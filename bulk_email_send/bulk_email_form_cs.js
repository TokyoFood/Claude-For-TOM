/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

/**
 * 一括メール送信フォーム - Client Script
 *
 * 機能:
 * - プレビューボタンの処理
 * - フォームバリデーション
 * - リセットボタンの処理
 */

define(['N/currentRecord', 'N/url', 'N/https'],
    function(currentRecord, url, https) {

        /**
         * pageInit - Page initialization
         * @param {Object} context
         */
        function pageInit(context) {
            console.log('Bulk Email Form - Page Initialized');

            // Set Reply-To from Employee on page load
            updateReplyToFromEmployee(context.currentRecord);
        }

        /**
         * Update Reply-To field with employee's email
         * @param {Object} currentRec
         */
        function updateReplyToFromEmployee(currentRec) {
            try {
                var employeeId = currentRec.getValue({
                    fieldId: 'custpage_reply_to_employee'
                });

                var currentReplyTo = currentRec.getValue({
                    fieldId: 'custpage_reply_to'
                });

                // Only update if Reply-To is empty
                if (employeeId && !currentReplyTo) {
                    require(['N/https', 'N/url'], function(https, url) {
                        try {
                            var suiteletUrl = url.resolveScript({
                                scriptId: 'customscript_bulk_email_form_sl',
                                deploymentId: 'customdeploy_bulk_email_form_sl',
                                params: {
                                    action: 'getEmployeeEmail',
                                    replyToEmployeeId: employeeId
                                }
                            });

                            var response = https.get({
                                url: suiteletUrl
                            });

                            if (response.code === 200 && response.body) {
                                var email = response.body.trim();
                                if (email) {
                                    currentRec.setValue({
                                        fieldId: 'custpage_reply_to',
                                        value: email
                                    });
                                    console.log('Reply-To set to: ' + email);
                                }
                            }
                        } catch (e) {
                            console.error('Error getting employee email: ' + e.message);
                        }
                    });
                }
            } catch (e) {
                console.error('Error in updateReplyToFromEmployee: ' + e.message);
            }
        }

        /**
         * fieldChanged - Field change event
         * @param {Object} context
         */
        function fieldChanged(context) {
            var currentRec = context.currentRecord;
            var fieldId = context.fieldId;

            // When Saved Search changes
            if (fieldId === 'custpage_saved_search') {
                var savedSearchId = currentRec.getValue({
                    fieldId: 'custpage_saved_search'
                });

                if (savedSearchId) {
                    console.log('Saved Search Selected: ' + savedSearchId);
                }
            }

            // When Employee changes, update Reply-To with employee's email
            if (fieldId === 'custpage_reply_to_employee') {
                var employeeId = currentRec.getValue({
                    fieldId: 'custpage_reply_to_employee'
                });

                console.log('Employee changed to: ' + employeeId);

                if (employeeId) {
                    // Get employee's email via AJAX call
                    require(['N/https', 'N/url'], function(https, url) {
                        try {
                            var suiteletUrl = url.resolveScript({
                                scriptId: 'customscript_bulk_email_form_sl',
                                deploymentId: 'customdeploy_bulk_email_form_sl',
                                params: {
                                    action: 'getEmployeeEmail',
                                    replyToEmployeeId: employeeId
                                }
                            });

                            console.log('Fetching email from: ' + suiteletUrl);

                            var response = https.get({
                                url: suiteletUrl
                            });

                            console.log('Response code: ' + response.code + ', body: ' + response.body);

                            if (response.code === 200 && response.body) {
                                var email = response.body.trim();
                                if (email) {
                                    currentRec.setValue({
                                        fieldId: 'custpage_reply_to',
                                        value: email
                                    });
                                    console.log('Reply-To updated to: ' + email);
                                }
                            }
                        } catch (e) {
                            console.error('Error getting employee email: ' + e.message);
                        }
                    });
                }
            }
        }

        /**
         * saveRecord - Validation before save
         * @param {Object} context
         * @return {boolean}
         */
        function saveRecord(context) {
            var currentRec = context.currentRecord;

            // Check required fields
            var emailTemplate = currentRec.getValue({
                fieldId: 'custpage_email_template'
            });

            var savedSearch = currentRec.getValue({
                fieldId: 'custpage_saved_search'
            });

            var senderName = currentRec.getValue({
                fieldId: 'custpage_sender_name'
            });

            var replyToEmployee = currentRec.getValue({
                fieldId: 'custpage_reply_to_employee'
            });

            var replyTo = currentRec.getValue({
                fieldId: 'custpage_reply_to'
            });

            if (!emailTemplate) {
                alert('Please select an Email Template.');
                return false;
            }

            if (!savedSearch) {
                alert('Please select a Saved Search.');
                return false;
            }

            if (!senderName) {
                alert('Please enter a Sender Name.');
                return false;
            }

            if (!replyToEmployee) {
                alert('Please select an Employee for Reply-To.');
                return false;
            }

            if (!replyTo) {
                alert('Please enter a Reply-To Address.');
                return false;
            }

            // Confirmation dialog
            var confirmMessage = 'Are you sure you want to send emails to the selected recipients?';

            return confirm(confirmMessage);
        }

        /**
         * プレビューボタンのクリック処理
         */
        function previewRecipients() {
            try {
                var currentRec = currentRecord.get();

                var savedSearch = currentRec.getValue({
                    fieldId: 'custpage_saved_search'
                });

                if (!savedSearch) {
                    alert('Please select a Saved Search.');
                    return;
                }

                // フォームの変更フラグをリセット
                window.onbeforeunload = null;

                // Get all form values to preserve on reload
                var emailTemplate = currentRec.getValue({ fieldId: 'custpage_email_template' }) || '';
                var senderName = currentRec.getValue({ fieldId: 'custpage_sender_name' }) || '';
                var replyToEmployee = currentRec.getValue({ fieldId: 'custpage_reply_to_employee' }) || '';
                var replyTo = currentRec.getValue({ fieldId: 'custpage_reply_to' }) || '';
                var attachments = currentRec.getValue({ fieldId: 'custpage_attachments' });
                var subjectOverride = currentRec.getValue({ fieldId: 'custpage_subject_override' }) || '';

                // Process attachments (array case)
                var attachmentsStr = '';
                if (attachments) {
                    if (Array.isArray(attachments)) {
                        attachmentsStr = attachments.join(',');
                    } else {
                        attachmentsStr = attachments;
                    }
                }

                // Get existing parameters from current URL
                var currentUrl = window.location.href;
                var urlParts = currentUrl.split('?');
                var baseUrl = urlParts[0];
                var existingParams = [];

                // Preserve existing parameters (script, deploy, etc.)
                if (urlParts.length > 1) {
                    var queryString = urlParts[1];
                    var paramPairs = queryString.split('&');
                    for (var i = 0; i < paramPairs.length; i++) {
                        var pair = paramPairs[i].split('=');
                        var key = pair[0];
                        // Preserve parameters that don't start with custpage_
                        if (key.indexOf('custpage_') !== 0 && key !== 'custpage_action') {
                            existingParams.push(paramPairs[i]);
                        }
                    }
                }

                // Add new parameters
                var newParams = [];
                newParams.push('custpage_action=preview');
                newParams.push('custpage_saved_search=' + encodeURIComponent(savedSearch));
                if (emailTemplate) newParams.push('custpage_email_template=' + encodeURIComponent(emailTemplate));
                if (senderName) newParams.push('custpage_sender_name=' + encodeURIComponent(senderName));
                if (replyToEmployee) newParams.push('custpage_reply_to_employee=' + encodeURIComponent(replyToEmployee));
                if (replyTo) newParams.push('custpage_reply_to=' + encodeURIComponent(replyTo));
                if (attachmentsStr) newParams.push('custpage_attachments=' + encodeURIComponent(attachmentsStr));
                if (subjectOverride) newParams.push('custpage_subject_override=' + encodeURIComponent(subjectOverride));

                // すべてのパラメータを結合
                var allParams = existingParams.concat(newParams);
                var reloadUrl = baseUrl + '?' + allParams.join('&');

                console.log('Redirecting to: ' + reloadUrl);
                window.location.href = reloadUrl;
            } catch (e) {
                console.error('Error in previewRecipients: ' + e.message);
                alert('An error occurred: ' + e.message);
            }
        }

        /**
         * Reset button click handler
         */
        function resetForm() {
            // Disable browser's "Leave site?" warning
            window.onbeforeunload = null;

            // Preserve script and deploy parameters
            var currentUrl = window.location.href;
            var urlParts = currentUrl.split('?');
            var baseUrl = urlParts[0];
            var existingParams = [];

            // Preserve existing parameters (script, deploy, etc.)
            if (urlParts.length > 1) {
                var queryString = urlParts[1];
                var paramPairs = queryString.split('&');
                for (var i = 0; i < paramPairs.length; i++) {
                    var pair = paramPairs[i].split('=');
                    var key = pair[0];
                    // Preserve parameters that don't start with custpage_
                    if (key.indexOf('custpage_') !== 0) {
                        existingParams.push(paramPairs[i]);
                    }
                }
            }

            // Redirect with only the preserved parameters
            var resetUrl = baseUrl;
            if (existingParams.length > 0) {
                resetUrl += '?' + existingParams.join('&');
            }

            console.log('Resetting to: ' + resetUrl);
            window.location.href = resetUrl;
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord,
            previewRecipients: previewRecipients,
            resetForm: resetForm
        };
    });
