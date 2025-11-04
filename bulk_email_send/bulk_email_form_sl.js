/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

/**
 * 一括メール送信フォーム - Suitelet
 *
 * 機能:
 * - Email Template、Saved Search、添付ファイルを選択するフォーム表示
 * - 送信先のプレビュー機能
 * - Map/Reduce Scriptをトリガーしてメール送信実行
 *
 * Script ID: customscript_bulk_email_form_sl
 * Deployment ID: customdeploy_bulk_email_form_sl
 */

define(['N/ui/serverWidget', 'N/search', 'N/file', 'N/task', 'N/runtime', 'N/log', 'N/redirect', 'N/record'],
    function(serverWidget, search, file, task, runtime, log, redirect, record) {

        /**
         * onRequest - Handle both GET and POST
         * @param {Object} context
         */
        function onRequest(context) {
            if (context.request.method === 'GET') {
                // Check if this is an AJAX call for employee email
                var action = context.request.parameters.action;
                if (action === 'getEmployeeEmail') {
                    getEmployeeEmail(context);
                } else {
                    displayForm(context);
                }
            } else {
                handleFormSubmit(context);
            }
        }

        /**
         * Get employee email address (AJAX endpoint)
         * @param {Object} context
         */
        function getEmployeeEmail(context) {
            try {
                var employeeId = context.request.parameters.replyToEmployeeId;

                log.debug('getEmployeeEmail', 'Employee ID: ' + employeeId);

                if (!employeeId) {
                    log.debug('getEmployeeEmail', 'No employee ID provided');
                    context.response.write(' '); // Space instead of empty string
                    return;
                }

                var empRecord = record.load({
                    type: record.Type.EMPLOYEE,
                    id: employeeId
                });

                log.debug('getEmployeeEmail', 'Employee record loaded');

                var email = empRecord.getValue({ fieldId: 'email' });

                log.debug('getEmployeeEmail', 'Email retrieved: ' + email);

                if (email) {
                    context.response.write(email);
                    log.debug('getEmployeeEmail', 'Email sent to client: ' + email);
                } else {
                    log.debug('getEmployeeEmail', 'No email found for employee');
                    context.response.write(' '); // Space instead of empty string
                }

            } catch (e) {
                log.error({
                    title: 'Error in getEmployeeEmail',
                    details: e.message + ' | Employee ID: ' + employeeId + ' | Stack: ' + JSON.stringify(e.stack)
                });
                context.response.write(' '); // Space instead of empty string
            }
        }

        /**
         * フォームを表示
         * @param {Object} context
         */
        function displayForm(context) {
            try {
                // プレビュー時のパラメータを取得
                var params = context.request.parameters;
                var isPreview = params.custpage_action === 'preview';

                // デバッグ: パラメータをログに記録
                if (isPreview) {
                    log.debug({
                        title: 'Preview Request Parameters',
                        details: JSON.stringify(params)
                    });
                }

                var form = serverWidget.createForm({
                    title: 'Bulk Email Sender'
                });

                // ===== Add Fields =====

                // 1. Email Template
                var templateField = form.addField({
                    id: 'custpage_email_template',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Email Template',
                    source: 'emailtemplate'
                });
                templateField.isMandatory = true;
                templateField.setHelpText({
                    help: 'Select the email template to use for this bulk send.'
                });
                // Restore value on preview
                if (isPreview && params.custpage_email_template) {
                    templateField.defaultValue = params.custpage_email_template;
                }

                // 2. Saved Search (Recipients)
                var savedSearchField = form.addField({
                    id: 'custpage_saved_search',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Saved Search (Recipients)'
                });
                savedSearchField.isMandatory = true;

                // Add Saved Search list
                savedSearchField.addSelectOption({
                    value: '',
                    text: '-- Please Select --'
                });

                try {
                    var currentUserId = runtime.getCurrentUser().id;

                    // Saved Searchを検索
                    var searchObj = search.create({
                        type: 'savedsearch',
                        filters: [
                            ['owner', search.Operator.ANYOF, currentUserId]
                        ],
                        columns: [
                            'title',
                            'id',
                            search.createColumn({
                                name: 'datemodified',
                                sort: search.Sort.DESC
                            })
                        ]
                    });

                    var searchResultCount = searchObj.runPaged().count;
                    log.debug('Saved Search Count', searchResultCount);

                    // 結果を配列に格納（既にソート済み）
                    var searchResults = [];
                    searchObj.run().each(function(result) {
                        searchResults.push({
                            id: result.id,
                            title: result.getValue('title') || 'Search ' + result.id
                        });
                        return true;
                    });

                    // オプションを追加
                    searchResults.forEach(function(item) {
                        savedSearchField.addSelectOption({
                            value: item.id,
                            text: item.title
                        });
                    });
                } catch (e) {
                    log.error({
                        title: 'Error loading saved searches',
                        details: JSON.stringify(e)
                    });
                }

                savedSearchField.setHelpText({
                    help: 'Select a saved search to identify recipients. The search must include an Email column.'
                });
                // Restore value on preview
                if (isPreview && params.custpage_saved_search) {
                    savedSearchField.defaultValue = params.custpage_saved_search;
                }

                // 3. Sender Name (Display Name)
                var senderNameField = form.addField({
                    id: 'custpage_sender_name',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Sender Name (Display Name)'
                });
                senderNameField.isMandatory = true;
                senderNameField.setHelpText({
                    help: 'The name displayed as the sender in the recipient\'s inbox.'
                });

                // Set default value
                if (isPreview && params.custpage_sender_name) {
                    senderNameField.defaultValue = params.custpage_sender_name;
                } else {
                    senderNameField.defaultValue = 'TOKYO FOOD Co., LTD';
                }

                // 4. Employee (for Reply-To)
                var employeeField = form.addField({
                    id: 'custpage_reply_to_employee',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Employee (for Reply-To)',
                    source: 'employee'
                });
                employeeField.isMandatory = true;
                employeeField.setHelpText({
                    help: 'Select employee whose email will be used for Reply-To address. Defaults to current user.'
                });

                // Default: current logged-in user
                var currentUser = runtime.getCurrentUser();
                var currentUserId = currentUser.id;
                var employeeId = null;
                if (isPreview && params.custpage_reply_to_employee) {
                    employeeId = params.custpage_reply_to_employee;
                    employeeField.defaultValue = employeeId;
                } else if (currentUserId) {
                    employeeId = currentUserId;
                    employeeField.defaultValue = currentUserId;
                }

                // Get employee's email for Reply-To default
                var employeeEmail = '';
                if (employeeId) {
                    try {
                        var empRecord = record.load({
                            type: record.Type.EMPLOYEE,
                            id: employeeId
                        });
                        employeeEmail = empRecord.getValue({ fieldId: 'email' }) || '';
                    } catch (e) {
                        log.debug('Could not load employee email', e.message);
                    }
                }

                // 5. Reply-To Address (Mandatory)
                var replyToField = form.addField({
                    id: 'custpage_reply_to',
                    type: serverWidget.FieldType.EMAIL,
                    label: 'Reply-To Address'
                });
                replyToField.isMandatory = true;
                replyToField.setHelpText({
                    help: 'Email address where replies will be sent. Auto-populated from selected employee.'
                });
                // Set default value: prioritize preview value, then employee email
                var replyToValue = '';
                if (isPreview && params.custpage_reply_to) {
                    replyToValue = params.custpage_reply_to;
                } else if (employeeEmail) {
                    replyToValue = employeeEmail;
                }

                if (replyToValue) {
                    replyToField.defaultValue = replyToValue;
                }

                log.debug('Reply-To Default', 'Employee: ' + employeeId + ', Email: ' + employeeEmail + ', Reply-To: ' + replyToValue);

                // 6. Attachments (multiple)
                var attachmentField = form.addField({
                    id: 'custpage_attachments',
                    type: serverWidget.FieldType.MULTISELECT,
                    label: 'Attachments'
                });

                // File Cabinetのファイルリストを取得して追加
                // E-Mail Attachments フォルダ (ID: 1280787) のみ
                try {
                    var fileSearch = search.create({
                        type: 'file',
                        filters: [
                            ['folder', 'anyof', '1280787']
                        ],
                        columns: ['name', 'folder']
                    });

                    var fileCount = 0;
                    fileSearch.run().each(function(result) {
                        var fileId = result.id;
                        var fileName = result.getValue('name');

                        attachmentField.addSelectOption({
                            value: fileId,
                            text: fileName
                        });

                        fileCount++;
                        return true;
                    });

                    log.debug('Files Loaded', 'Count: ' + fileCount);
                } catch (e) {
                    log.error({
                        title: 'Error loading files',
                        details: JSON.stringify(e)
                    });
                }

                attachmentField.setHelpText({
                    help: 'Select files from File Cabinet to attach to emails (multiple selection allowed).'
                });
                // Restore value on preview
                if (isPreview && params.custpage_attachments) {
                    attachmentField.defaultValue = params.custpage_attachments.split(',');
                }

                // 7. Subject Override (Optional)
                var subjectOverrideField = form.addField({
                    id: 'custpage_subject_override',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Subject Override (Optional)'
                });
                subjectOverrideField.setHelpText({
                    help: 'Enter a subject line to override the email template subject. Leave blank to use the template default.'
                });
                // Restore value on preview
                if (isPreview && params.custpage_subject_override) {
                    subjectOverrideField.defaultValue = params.custpage_subject_override;
                }

                // ===== Add Tabs =====
                form.addTab({
                    id: 'custpage_settings_tab',
                    label: 'Settings'
                });

                form.addTab({
                    id: 'custpage_preview_tab',
                    label: 'Preview'
                });

                // フィールドをタブに配置
                templateField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.NORMAL
                });

                // ===== Add Sublist (Recipients Preview) =====
                var previewList = form.addSublist({
                    id: 'custpage_preview_list',
                    type: serverWidget.SublistType.LIST,
                    label: 'Recipients Preview (max 100 displayed)',
                    tab: 'custpage_preview_tab'
                });

                previewList.addField({
                    id: 'custpage_preview_email',
                    type: serverWidget.FieldType.EMAIL,
                    label: 'Email'
                });

                // Display preview if action is preview
                if (context.request.parameters.custpage_action === 'preview') {
                    populatePreview(context, previewList);
                }

                // ===== Add Buttons =====
                form.addSubmitButton({
                    label: 'Send Emails'
                });

                form.addButton({
                    id: 'custpage_preview_btn',
                    label: 'Preview Recipients',
                    functionName: 'previewRecipients()'
                });

                form.addButton({
                    id: 'custpage_reset_btn',
                    label: 'Reset',
                    functionName: 'resetForm()'
                });

                // ===== クライアントスクリプト追加 =====
                // パスは環境に応じて調整してください
                // Client Scriptファイルの絶対パスを指定
                form.clientScriptModulePath = '/SuiteScripts/TFC SuiteScript/release/BulkEmailSender/bulk_email_form_cs.js';

                context.response.writePage(form);

            } catch (e) {
                log.error({
                    title: 'Error in displayForm',
                    details: e.message
                });
                throw e;
            }
        }

        /**
         * プレビューリストにデータを追加
         * @param {Object} context
         * @param {Object} sublist
         */
        function populatePreview(context, sublist) {
            try {
                var savedSearchId = context.request.parameters.custpage_saved_search;

                if (!savedSearchId) {
                    return;
                }

                // Saved Searchを実行
                var savedSearch = search.load({
                    id: savedSearchId
                });

                var lineNum = 0;
                var maxPreview = 100; // プレビューは最大100件

                savedSearch.run().each(function(result) {
                    if (lineNum >= maxPreview) {
                        return false; // 100件で打ち切り
                    }

                    var email = result.getValue({ name: 'email' }) ||
                                result.getValue({ name: 'emailaddress' }) ||
                                result.getValue({ name: 'custentity_email' }) ||
                                result.getValue({ name: 'custentity_tfc_cust_purchasing_email' });

                    if (email) {
                        // Split multiple emails by common delimiters (comma, semicolon, newline)
                        var emails = email.split(/[,;\n]+/);

                        for (var i = 0; i < emails.length; i++) {
                            if (lineNum >= maxPreview) {
                                return false; // 100件で打ち切り
                            }

                            var trimmedEmail = emails[i].trim();

                            // Only add non-empty email addresses
                            if (trimmedEmail) {
                                sublist.setSublistValue({
                                    id: 'custpage_preview_email',
                                    line: lineNum,
                                    value: trimmedEmail
                                });

                                lineNum++;
                            }
                        }
                    }

                    return true;
                });

                log.audit({
                    title: 'Preview Loaded',
                    details: lineNum + ' recipients found'
                });

            } catch (e) {
                log.error({
                    title: 'Error in populatePreview',
                    details: e.message
                });
            }
        }

        /**
         * フォーム送信処理
         * @param {Object} context
         */
        function handleFormSubmit(context) {
            try {
                var request = context.request;

                // プレビューボタンの場合
                if (request.parameters.custpage_action === 'preview') {
                    redirect.toSuitelet({
                        scriptId: runtime.getCurrentScript().id,
                        deploymentId: runtime.getCurrentScript().deploymentId,
                        parameters: request.parameters
                    });
                    return;
                }

                // Execute email send
                var emailTemplate = request.parameters.custpage_email_template;
                var savedSearch = request.parameters.custpage_saved_search;
                var senderName = request.parameters.custpage_sender_name;
                var replyToEmployee = request.parameters.custpage_reply_to_employee;
                var replyTo = request.parameters.custpage_reply_to;
                var attachments = request.parameters.custpage_attachments;
                var subjectOverride = request.parameters.custpage_subject_override;

                // Validation
                if (!emailTemplate || !savedSearch || !senderName || !replyToEmployee || !replyTo) {
                    throw new Error('Required fields are missing.');
                }

                // Convert attachments to array (multiple selection returns string)
                var attachmentArray = [];
                if (attachments) {
                    if (typeof attachments === 'string') {
                        attachmentArray = attachments.split('\u0005'); // NetSuite multi-select delimiter
                    } else {
                        attachmentArray = [attachments];
                    }
                }

                // Trigger Map/Reduce Script
                var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_bulk_email_send_mr',
                    deploymentId: 'customdeploy_bulk_email_send_mr',
                    params: {
                        custscript_email_template: emailTemplate,
                        custscript_saved_search: savedSearch,
                        custscript_sender_name: senderName,
                        custscript_reply_to: replyTo,
                        custscript_attachments: attachmentArray.join(','),
                        custscript_subject_override: subjectOverride
                    }
                });

                var mrTaskId = mrTask.submit();

                log.audit({
                    title: 'Map/Reduce Task Submitted',
                    details: 'Task ID: ' + mrTaskId
                });

                // Display success message
                var form = serverWidget.createForm({
                    title: 'Email Sending Task Started'
                });

                var messageField = form.addField({
                    id: 'custpage_message',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: 'Message'
                });

                // Build URL to return to form
                var scriptUrl = runtime.getCurrentScript().deploymentId ?
                    '/app/site/hosting/scriptlet.nl?script=' + runtime.getCurrentScript().id +
                    '&deploy=' + runtime.getCurrentScript().deploymentId :
                    context.request.url.split('?')[0];

                // Get current timestamp
                var now = new Date();
                var timestamp = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

                var message = '<div style="padding: 20px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px;">' +
                    '<h2 style="color: #155724;">Email Sending Task Started Successfully</h2>' +
                    '<p><strong>Task ID:</strong> ' + mrTaskId + '</p>' +
                    '<p><strong>Started at:</strong> ' + timestamp + '</p>' +
                    '<p><strong>Reply-To Address:</strong> ' + replyTo + '</p>' +
                    '<hr style="border: none; border-top: 1px solid #c3e6cb; margin: 15px 0;">' +
                    '<p><strong>✓</strong> Bulk emails are being sent in the background.</p>' +
                    '<p><strong>✓</strong> A confirmation copy will be sent to the Reply-To address above after all emails are sent.</p>' +
                    '<p style="color: #856404; background-color: #fff3cd; padding: 10px; border-radius: 3px;">' +
                    '<strong>Note:</strong> If you don\'t receive the confirmation email, please check the API status at: ' +
                    '<a href="https://vap.tokyofood.co.nz/nsmail/send" target="_blank">https://vap.tokyofood.co.nz/nsmail/send</a> ' +
                    '(Status should show "ok")</p>' +
                    '<p><a href="' + scriptUrl + '" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">Return to Form</a></p>' +
                    '</div>';

                messageField.defaultValue = message;

                context.response.writePage(form);

            } catch (e) {
                log.error({
                    title: 'Error in handleFormSubmit',
                    details: e.message
                });

                // Display error message
                var errorForm = serverWidget.createForm({
                    title: 'Error'
                });

                var errorField = errorForm.addField({
                    id: 'custpage_error',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: 'Error'
                });

                // Build URL to return to form
                var scriptUrl = runtime.getCurrentScript().deploymentId ?
                    '/app/site/hosting/scriptlet.nl?script=' + runtime.getCurrentScript().id +
                    '&deploy=' + runtime.getCurrentScript().deploymentId :
                    context.request.url.split('?')[0];

                var errorMessage = '<div style="padding: 20px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px;">' +
                    '<h2 style="color: #721c24;">An Error Occurred</h2>' +
                    '<p>' + e.message + '</p>' +
                    '<p>Please contact your administrator if this issue persists.</p>' +
                    '<p><a href="' + scriptUrl + '">Return to Form</a></p>' +
                    '</div>';

                errorField.defaultValue = errorMessage;

                context.response.writePage(errorForm);
            }
        }

        return {
            onRequest: onRequest
        };
    });
