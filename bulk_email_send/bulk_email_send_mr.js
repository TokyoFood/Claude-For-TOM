/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * Bulk Email Sending via External API - Map/Reduce Script
 *
 * Features:
 * - Retrieve recipients from Saved Search
 * - Send emails via external SMTP API (not NetSuite email.send)
 * - BCC distribution (45 recipients per email)
 * - File Cabinet attachments support
 * - Email Template support
 *
 * External API: https://vap.tokyofood.co.nz/nsmail/send
 * SMTP Server: mss52.kagoya.net
 * From: no-reply@tokyofood.co.nz
 *
 * Script ID: customscript_bulk_email_send_mr
 * Deployment ID: customdeploy_bulk_email_send_mr
 */

define(['N/search', 'N/file', 'N/runtime', 'N/log', 'N/record', 'N/https', 'N/encode'],
    function(search, file, runtime, log, record, https, encode) {

        // External API endpoint
        var API_ENDPOINT = 'https://vap.tokyofood.co.nz/nsmail/send';

        // BCC division number (45 recipients per email)
        var DIVISION_NUMBER = 45;

        /**
         * getInputData - Retrieve recipients from Saved Search
         * @return {Array|Object} Recipient data
         */
        function getInputData() {
            try {
                var script = runtime.getCurrentScript();
                var savedSearchId = script.getParameter({ name: 'custscript_saved_search' });

                log.audit({
                    title: 'getInputData Start',
                    details: 'Saved Search ID: ' + savedSearchId
                });

                if (!savedSearchId) {
                    throw new Error('Saved Search ID is not specified.');
                }

                // Load Saved Search
                var savedSearch = search.load({
                    id: savedSearchId
                });

                log.audit({
                    title: 'Saved Search Loaded',
                    details: 'Search ID: ' + savedSearchId
                });

                return savedSearch;

            } catch (e) {
                log.error({
                    title: 'Error in getInputData',
                    details: e.message
                });
                throw e;
            }
        }

        /**
         * map - Process each recipient and collect email addresses
         * @param {Object} context
         */
        function map(context) {
            try {
                var searchResult = JSON.parse(context.value);

                log.debug({
                    title: 'Map Processing',
                    details: 'Result ID: ' + searchResult.id
                });

                // Get email address (support multiple column names)
                var email = searchResult.values.email ||
                            searchResult.values.emailaddress ||
                            searchResult.values.custentity_email ||
                            searchResult.values.custentity_tfc_cust_purchasing_email ||
                            searchResult.values['email.CUSTRECORD'] ||
                            null;

                if (!email) {
                    log.error({
                        title: 'No Email Found',
                        details: 'Record ID: ' + searchResult.id + ' has no email address'
                    });
                    return;
                }

                // Get name
                var entityName = searchResult.values.entityid ||
                                searchResult.values.companyname ||
                                searchResult.values.altname ||
                                (searchResult.values.firstname ?
                                    searchResult.values.firstname + ' ' + (searchResult.values.lastname || '') :
                                    null) ||
                                'Customer';

                // Split multiple emails by common delimiters (comma, semicolon, newline)
                var emails = email.split(/[,;\n]+/);

                // Process each email address separately
                for (var i = 0; i < emails.length; i++) {
                    var trimmedEmail = emails[i].trim();

                    // Only process non-empty email addresses
                    if (trimmedEmail) {
                        // Build recipient data
                        var recipientData = {
                            recipientId: searchResult.id,
                            recipientEmail: trimmedEmail,
                            recipientName: entityName,
                            recipientType: searchResult.recordType || 'customer'
                        };

                        // Write to reduce stage with a fixed key for batching
                        context.write({
                            key: 'batch',  // Single key to collect all recipients
                            value: recipientData
                        });

                        log.debug({
                            title: 'Email Added',
                            details: 'Email: ' + trimmedEmail + ' for ' + entityName
                        });
                    }
                }

            } catch (e) {
                log.error({
                    title: 'Error in map',
                    details: e.message + ' | Context: ' + JSON.stringify(context)
                });
            }
        }

        /**
         * reduce - Send emails via external API with BCC grouping
         * @param {Object} context
         */
        function reduce(context) {
            try {
                var script = runtime.getCurrentScript();

                // Get script parameters
                var emailTemplateId = script.getParameter({ name: 'custscript_email_template' });
                var senderName = script.getParameter({ name: 'custscript_sender_name' });
                var replyTo = script.getParameter({ name: 'custscript_reply_to' });
                var attachmentsStr = script.getParameter({ name: 'custscript_attachments' });
                var subjectOverride = script.getParameter({ name: 'custscript_subject_override' });

                log.audit({
                    title: 'Reduce Start',
                    details: 'Total Recipients: ' + context.values.length + ' | Sender Name: ' + senderName
                });

                // Parse all recipients
                var allRecipients = [];
                for (var i = 0; i < context.values.length; i++) {
                    var recipientData = JSON.parse(context.values[i]);
                    allRecipients.push(recipientData.recipientEmail);
                }

                log.audit({
                    title: 'Recipients Collected',
                    details: 'Total: ' + allRecipients.length
                });

                // Get email template content
                var emailSubject = subjectOverride || 'Bulk Email';
                var emailBody = '';

                if (emailTemplateId) {
                    try {
                        var templateRecord = record.load({
                            type: 'emailtemplate',
                            id: emailTemplateId
                        });

                        emailSubject = templateRecord.getValue({ fieldId: 'subject' }) || emailSubject;
                        emailBody = templateRecord.getValue({ fieldId: 'content' }) || '';

                        // Subject override
                        if (subjectOverride) {
                            emailSubject = subjectOverride;
                        }

                        // Remove any template variables (simplified - no merge fields)
                        emailBody = emailBody.replace(/\$\{[^}]+\}/g, '');
                        emailSubject = emailSubject.replace(/\$\{[^}]+\}/g, '');

                    } catch (e) {
                        log.error({
                            title: 'Email Template Load Error',
                            details: 'Template ID: ' + emailTemplateId + ' | Error: ' + e.message
                        });
                        emailBody = 'Default email body';
                    }
                }

                // Process attachments (convert to base64)
                var attachments = [];
                if (attachmentsStr) {
                    var attachmentIds = attachmentsStr.split(',');
                    for (var i = 0; i < attachmentIds.length; i++) {
                        try {
                            var attachFile = file.load({
                                id: attachmentIds[i].trim()
                            });

                            // Get file content as base64
                            // NetSuite file.getContents() returns base64 for binary files
                            var base64Content = attachFile.getContents();

                            attachments.push({
                                filename: attachFile.name,
                                content: base64Content
                            });

                            log.debug({
                                title: 'Attachment Loaded',
                                details: 'File: ' + attachFile.name + ' (Size: ' + base64Content.length + ' bytes)'
                            });

                        } catch (e) {
                            log.error({
                                title: 'Attachment Load Error',
                                details: 'File ID: ' + attachmentIds[i] + ' | Error: ' + e.message
                            });
                        }
                    }
                }

                // Divide recipients into BCC groups
                var bccGroups = [];
                for (var i = 0; i < allRecipients.length; i += DIVISION_NUMBER) {
                    var end = Math.min(i + DIVISION_NUMBER, allRecipients.length);
                    bccGroups.push(allRecipients.slice(i, end));
                }

                log.audit({
                    title: 'BCC Groups Created',
                    details: 'Total Groups: ' + bccGroups.length + ' (max ' + DIVISION_NUMBER + ' per group)'
                });

                // Send email for each BCC group via external API
                var successCount = 0;
                var errorCount = 0;

                for (var groupIdx = 0; groupIdx < bccGroups.length; groupIdx++) {
                    try {
                        var bccGroup = bccGroups[groupIdx];

                        // Build API request payload
                        var payload = {
                            subject: emailSubject,
                            body: emailBody,
                            replyTo: replyTo,
                            senderName: senderName,
                            recipients: bccGroup,
                            attachments: attachments
                        };

                        log.debug({
                            title: 'Sending Email Group ' + (groupIdx + 1),
                            details: 'Recipients: ' + bccGroup.length + ' | API: ' + API_ENDPOINT
                        });

                        // Call external API
                        var response = https.post({
                            url: API_ENDPOINT,
                            body: JSON.stringify(payload),
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });

                        if (response.code === 200) {
                            var responseBody = JSON.parse(response.body);
                            if (responseBody.status === 'success') {
                                successCount++;
                                log.audit({
                                    title: 'Email Sent Successfully',
                                    details: 'Group ' + (groupIdx + 1) + ' | Recipients: ' + bccGroup.length
                                });
                            } else {
                                errorCount++;
                                log.error({
                                    title: 'API returned error status',
                                    details: 'Group ' + (groupIdx + 1) + ' | Response: ' + response.body
                                });
                            }
                        } else {
                            errorCount++;
                            log.error({
                                title: 'HTTP Error from API',
                                details: 'Group ' + (groupIdx + 1) + ' | Code: ' + response.code + ' | Response: ' + response.body
                            });
                        }

                    } catch (e) {
                        errorCount++;
                        log.error({
                            title: 'Email Send Error',
                            details: 'Group ' + (groupIdx + 1) + ' | Error: ' + e.message
                        });
                    }
                }

                // Send a confirmation copy to Reply-To address (only 1 email)
                if (replyTo && successCount > 0) {
                    try {
                        var confirmPayload = {
                            subject: emailSubject,
                            body: emailBody,
                            replyTo: replyTo,
                            senderName: senderName,
                            recipients: [replyTo],  // Send only to Reply-To address
                            attachments: attachments
                        };

                        log.debug({
                            title: 'Sending Confirmation Copy',
                            details: 'Sending to Reply-To: ' + replyTo + ' | Total Recipients: ' + allRecipients.length
                        });

                        var confirmResponse = https.post({
                            url: API_ENDPOINT,
                            body: JSON.stringify(confirmPayload),
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });

                        if (confirmResponse.code === 200) {
                            var confirmResponseBody = JSON.parse(confirmResponse.body);
                            if (confirmResponseBody.status === 'success') {
                                log.audit({
                                    title: 'Confirmation Copy Sent',
                                    details: 'Sent to: ' + replyTo
                                });
                            } else {
                                log.error({
                                    title: 'Confirmation Copy - API Error',
                                    details: 'Response: ' + confirmResponse.body
                                });
                            }
                        } else {
                            log.error({
                                title: 'Confirmation Copy - HTTP Error',
                                details: 'Code: ' + confirmResponse.code + ' | Response: ' + confirmResponse.body
                            });
                        }

                    } catch (e) {
                        log.error({
                            title: 'Confirmation Copy Error',
                            details: 'Error: ' + e.message
                        });
                    }
                }

                log.audit({
                    title: 'Reduce Complete',
                    details: 'Success: ' + successCount + ' | Errors: ' + errorCount + ' | Total Recipients: ' + allRecipients.length
                });

            } catch (e) {
                log.error({
                    title: 'Error in reduce',
                    details: e.message + ' | Context: ' + JSON.stringify(context)
                });
            }
        }

        /**
         * summarize - Summary of sending results
         * @param {Object} summary
         */
        function summarize(summary) {
            try {
                log.audit({
                    title: 'Summarize Start',
                    details: 'Total Records Processed: ' + summary.inputSummary.count
                });

                // Log errors
                summary.mapSummary.errors.iterator().each(function(key, error) {
                    log.error({
                        title: 'Map Error - Key: ' + key,
                        details: error
                    });
                    return true;
                });

                summary.reduceSummary.errors.iterator().each(function(key, error) {
                    log.error({
                        title: 'Reduce Error - Key: ' + key,
                        details: error
                    });
                    return true;
                });

                log.audit({
                    title: 'Summarize Complete',
                    details: 'Bulk email sending process completed'
                });

            } catch (e) {
                log.error({
                    title: 'Error in summarize',
                    details: e.message
                });
            }
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
    });
