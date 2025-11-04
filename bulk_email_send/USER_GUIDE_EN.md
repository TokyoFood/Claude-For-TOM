# Bulk Email Sender - User Guide

## Overview

The Bulk Email Sender allows you to send emails to multiple recipients based on a NetSuite Saved Search. This tool uses Email Templates and can include file attachments from the File Cabinet.

### Key Features

- **Large Volume Support**: Uses external SMTP server (Kagoya), so no recipient limit
- **BCC Sending**: Recipients cannot see other recipients' addresses (45 recipients per batch)
- **HTML Email Support**: Email Template HTML renders correctly
- **File Attachments**: Supports PDF, Excel, images, and other file types

---

## How to Access

1. Log in to NetSuite
2. Navigate to the Bulk Email Sender form using the direct URL https://5093054.app.netsuite.com/app/site/hosting/scriptlet.nl?script=2460&deploy=1 
3. Or search for "Bulk Email" in the Global Search

---

## Step-by-Step Instructions

### 1. Select Email Template
- Templates are created under **Documents > Templates > Email Templates**
- Choose the email template you want to use
- The template contains the email subject and body

### 2. Select Recipients (Saved Search)
- Create and select a Saved Search that contains the list of recipients
- **Important**: The Saved Search must include an **Email** column
- The list is sorted by most recently modified (your latest searches appear at the top)
- Only your own searches are shown

### 3. Enter Sender Name (Display Name)
- This is the sender name displayed in the recipient's mailbox
- Defaults to `TOKYO FOOD Co., LTD`
- You can change this as needed (e.g., department name, person's name)
- **Note**: The actual email address is `no-reply@tokyofood.co.nz`

### 4. Select Employee (for Reply-To)
- Choose the employee whose email will be used for the Reply-To address
- Defaults to you (the current logged-in user)
- The selected employee's email address will be **automatically filled** in the Reply-To Address field

### 5. Enter Reply-To Address (Required)
- This is where replies will be sent
- **Automatically filled** with the selected employee's email address
- You can change this to a different email address if needed
- **Important**: After sending is complete, a confirmation copy will be sent to this address

### 6. Select Attachments (Optional)
- Choose files from the **E-Mail Attachments** folder in File Cabinet
- You can select multiple files by holding Ctrl (Windows) or Cmd (Mac)
- All selected files will be attached to every email

### 7. Subject Override (Optional)
- Leave blank to use the Email Template's subject line
- Enter text here to override the template's subject for this send

---

## Preview Recipients

Before sending, you can preview the recipient list:

1. Select your Saved Search
2. Click the **Preview Recipients** button
3. The Preview tab will show up to 100 email addresses
4. Review the list to ensure it's correct

---

## Sending Emails

1. Fill in all required fields (marked with red asterisk *)
2. Click **Preview Recipients** to verify your recipient list (recommended)
3. Click **Send Emails** button
4. Confirm the action in the dialog box
5. You will see a confirmation screen with:
   - **Task ID**: Keep this number in case you need to contact support
   - **Started at**: Timestamp when the task began
   - **Reply-To Address**: Where the confirmation email will be sent

### After Sending

- Emails are sent in the background (you don't need to wait)
- The process may take several minutes depending on the number of recipients
- You can close the browser - emails will continue to send
- **After all emails are sent, a confirmation copy will be sent to the Reply-To Address**
- When you receive the confirmation email, it means all emails have been processed
- If you don't receive the confirmation email, check the API status at https://vap.tokyofood.co.nz/nsmail/send (should show "ok")
- If you encounter any issues, contact your administrator with the **Task ID**

---

## Important Notes

### How Email Sending Works

- Emails are sent via external SMTP server (mss52.kagoya.net) from `no-reply@tokyofood.co.nz`
- Recipients will see the selected Sender's name, but replies go to the Reply-To address
- Make sure the Reply-To address is correct before sending
- **BCC sending**: Recipients cannot see other recipients' addresses
- **45 recipients per batch**: Ensures stable delivery even for large mailings

### Recipient Limits

- Uses external SMTP server, so not affected by NetSuite's email limits
- Can send to hundreds of recipients, but please consult with your administrator for large mailings

### Best Practices

1. **Always preview** your recipient list before sending
2. **Test first** with a small Saved Search (e.g., just yourself) to verify the email looks correct
3. **Double-check** the Reply-To address
4. **Verify attachments** are the correct files before sending
5. **Save your Saved Search** with a descriptive name for easy identification

---

## Troubleshooting

### "Required fields are missing" error
- Make sure Email Template, Saved Search, Sender Name, Employee, and Reply-To are all filled in

### Reply-To field is empty
- Try selecting a different Employee, then select your original choice again
- The field should auto-populate with the employee's email address

### Saved Search list is empty
- You may not have any Saved Searches
- Create a Saved Search first (Reports > Saved Searches > New)
- Make sure the search includes an Email column

### No attachments showing
- Files must be in the **E-Mail Attachments** folder (Folder ID: 1280787)
- Ask your administrator to move files to this folder

### Emails not arriving
- First, check if the confirmation email was sent to the Reply-To Address
- If the confirmation email arrived, the sending process completed successfully
- Check the recipient's spam/junk folder
- Verify the Saved Search contains valid email addresses
- If the confirmation email also didn't arrive, check the API status at https://vap.tokyofood.co.nz/nsmail/send (should show "ok")
- Contact your administrator with the Task ID from the confirmation screen

---

## Getting Help

If you encounter any issues:

1. Note the **Task ID** from the confirmation screen (if available)
2. Take a screenshot of any error messages
3. Contact your NetSuite administrator with:
   - What you were trying to do
   - The error message or unexpected behavior
   - The Task ID (if available)
   - The Saved Search name you were using

---

## For Administrators: File Updates

If script updates are needed:

1. Navigate to: **Documents > Files > File Cabinet**
2. Go to: **SuiteScripts > TFC SuiteScript > release > BulkEmailSender**
3. Replace the following files with updated versions:
   - `bulk_email_form_sl.js` (Main form script)
   - `bulk_email_form_cs.js` (Client-side validation)
   - `bulk_email_send_mr.js` (Email sending script)
4. No additional deployment steps required - changes take effect immediately
5. Users may need to refresh their browser (Ctrl+Shift+R) to see changes

---

## Quick Reference

| Field | Required? | Description |
|-------|-----------|-------------|
| Email Template | Yes | Template with subject and body |
| Saved Search (Recipients) | Yes | List of people to email |
| Sender Name (Display Name) | Yes | Sender name displayed to recipients |
| Employee (for Reply-To) | Yes | Employee whose email is used for Reply-To |
| Reply-To Address | Yes | Where replies are sent (confirmation email sent here) |
| Attachments | No | Files to attach to emails |
| Subject Override | No | Override template subject |

**Key Buttons:**
- **Preview Recipients**: View email list before sending
- **Send Emails**: Start the bulk send
- **Reset**: Clear all fields and start over

---

## System Architecture (For Administrators)

```
NetSuite Suitelet Form
  ↓ User Input
NetSuite Map/Reduce Script
  ↓ HTTPS POST (JSON)
External API (Tomcat Servlet)
  https://vap.tokyofood.co.nz/nsmail/send
  ↓ JavaMail API
SMTP Server (mss52.kagoya.net)
  ↓ BCC 45 recipients per batch
Recipients
```

---

*Last Updated: November 2, 2025 - Version 2.0 (External SMTP API)*
