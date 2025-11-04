# Bulk Email Sender - Testing Guide

## Purpose

This guide helps you test the Bulk Email Sender to ensure it works correctly before using it for important email campaigns.

---

## Pre-Testing Checklist

Before you start testing, make sure you have:

- [ ] Access to NetSuite
- [ ] The URL to the Bulk Email Sender form
- [ ] At least one Email Template created
- [ ] A test Saved Search with your own email address
- [ ] A test file in the E-Mail Attachments folder (optional)

---

## Test Scenario 1: Simple Email (No Attachments)

**Goal**: Send a basic email to yourself

### Steps:

1. Open the Bulk Email Sender form
2. Fill in the following:
   - **Email Template**: Select any template
   - **Saved Search**: Create or select a search that returns only YOUR email address
   - **Sender Name**: Keep default (TOKYO FOOD Co., LTD)
   - **Employee (for Reply-To)**: Keep default (yourself)
   - **Reply-To**: Should auto-fill with your email (verify it's correct)
   - **Attachments**: Leave empty
   - **Subject Override**: Leave empty
3. Click **Preview Recipients**
4. Verify your email address appears in the preview list
5. Click **Send Emails**
6. Confirm the action
7. Note the **Task ID** and **timestamp** from the confirmation screen
8. Wait 2-5 minutes
9. Check your email inbox

### Expected Results:
- ✅ Email received within 5 minutes (for recipient)
- ✅ **Confirmation email received at Reply-To Address (1 email only)**
- ✅ Subject matches the Email Template
- ✅ Body matches the Email Template
- ✅ Sender name shows as "TOKYO FOOD Co., LTD"
- ✅ Reply-To address is correct (check by clicking Reply)
- ✅ No attachments

---

## Test Scenario 2: Email with Attachments

**Goal**: Send an email with file attachments

### Steps:

1. Open the Bulk Email Sender form
2. Fill in the following:
   - **Email Template**: Select any template
   - **Saved Search**: Use the same test search (just your email)
   - **Sender Name**: Keep default (TOKYO FOOD Co., LTD)
   - **Employee (for Reply-To)**: Keep default (yourself)
   - **Reply-To**: Should auto-fill with your email
   - **Attachments**: Select 1-2 test files
   - **Subject Override**: Leave empty
3. Click **Preview Recipients**
4. Verify your email address appears
5. Click **Send Emails**
6. Confirm and note the Task ID
7. Wait 2-5 minutes
8. Check your email inbox

### Expected Results:
- ✅ Email received within 5 minutes
- ✅ **Confirmation email received at Reply-To Address (1 email only)**
- ✅ Attachments are included (in both recipient and confirmation emails)
- ✅ Attachments can be opened/downloaded
- ✅ All other fields correct as in Test 1

---

## Test Scenario 3: Subject Override

**Goal**: Test custom subject line

### Steps:

1. Open the Bulk Email Sender form
2. Fill in the following:
   - **Email Template**: Select any template
   - **Saved Search**: Use your test search
   - **Sender Name**: Keep default (TOKYO FOOD Co., LTD)
   - **Employee (for Reply-To)**: Keep default (yourself)
   - **Reply-To**: Auto-filled
   - **Attachments**: Leave empty
   - **Subject Override**: Enter "TEST - Custom Subject Line"
3. Click **Send Emails**
4. Confirm and note the Task ID
5. Check your email inbox

### Expected Results:
- ✅ Email subject is "TEST - Custom Subject Line"
- ✅ Email body still matches the template
- ✅ All other fields correct

---

## Test Scenario 4: Custom Sender Name

**Goal**: Test custom sender name display

### Steps:

1. Open the Bulk Email Sender form
2. Fill in the following:
   - **Email Template**: Select any template
   - **Saved Search**: Use your test search (yourself only)
   - **Sender Name**: Enter "Sales Team"
   - **Employee (for Reply-To)**: Keep default (yourself)
   - **Reply-To**: Auto-filled
   - **Attachments**: Leave empty
   - **Subject Override**: Leave empty
3. Click **Send Emails**
4. Confirm and note the Task ID
5. Check your email inbox

### Expected Results:
- ✅ Email received
- ✅ Sender name shows as "Sales Team"
- ✅ Reply-To address is your email address
- ✅ When you click Reply, it goes to your address
- ✅ **Confirmation email received (1 email only)**

---

## Test Scenario 5: Different Employee

**Goal**: Test changing the Reply-To employee

### Steps:

1. Open the Bulk Email Sender form
2. Fill in the following:
   - **Email Template**: Select any template
   - **Saved Search**: Use your test search (yourself only)
   - **Sender Name**: Keep default (TOKYO FOOD Co., LTD)
   - **Employee (for Reply-To)**: Select a **different employee** (not yourself)
   - **Reply-To**: Should auto-change to the new employee's email
   - **Attachments**: Leave empty
   - **Subject Override**: Leave empty
3. Verify the Reply-To field updated automatically
4. Click **Send Emails**
5. Confirm and note the Task ID
6. Check both your and the selected employee's email inboxes

### Expected Results:
- ✅ You receive the email (as recipient)
- ✅ Selected employee receives **confirmation email (1 email only)**
- ✅ Sender name shows as "TOKYO FOOD Co., LTD"
- ✅ Reply-To address is the selected employee's email
- ✅ When you click Reply, it goes to the selected employee

---

## Test Scenario 6: Multiple Recipients with Confirmation Email

**Goal**: Test sending to 2-3 people

### Preparation:
1. Create a test Saved Search that includes 2-3 colleagues' email addresses
2. **Important**: Inform your colleagues you're doing a test

### Steps:

1. Open the Bulk Email Sender form
2. Fill in the following:
   - **Email Template**: Select a template with "TEST" in the subject
   - **Saved Search**: Select your 2-3 person test search
   - **Sender Name**: Keep default (TOKYO FOOD Co., LTD)
   - **Employee (for Reply-To)**: Keep default (yourself)
   - **Reply-To**: Auto-filled
   - **Attachments**: Leave empty or add 1 file
   - **Subject Override**: Add "TEST - Please ignore" if template doesn't indicate it's a test
3. Click **Preview Recipients**
4. Verify all 2-3 email addresses appear correctly
5. Click **Send Emails**
6. Confirm and note the Task ID
7. Ask your colleagues to confirm receipt (within 10 minutes)
8. Check your own inbox for the confirmation email

### Expected Results:
- ✅ All recipients receive the email within 10 minutes
- ✅ **Confirmation email sent to Reply-To Address (yourself) - only 1 email**  regardless of recipient count
- ✅ Confirmation email arrives last (after all recipient emails sent)
- ✅ All emails are identical
- ✅ All details (sender, reply-to, attachments) are correct

---

## Test Scenario 7: Reset Function

**Goal**: Test the Reset button

### Steps:

1. Open the Bulk Email Sender form
2. Fill in several fields (don't send)
3. Click **Reset** button
4. Confirm the reset action

### Expected Results:
- ✅ All fields are cleared
- ✅ Form returns to initial state
- ✅ No email was sent

---

## Test Scenario 7: Validation Checks

**Goal**: Test that required fields are enforced

### Steps:

1. Open the Bulk Email Sender form
2. Leave **Email Template** empty
3. Click **Send Emails**
4. **Expected**: Error message "Please select an Email Template"
5. Fill in Email Template
6. Leave **Saved Search** empty
7. Click **Send Emails**
8. **Expected**: Error message "Please select a Saved Search"
9. Repeat for other required fields:
   - **Sender**
   - **Reply-To Address**

### Expected Results:
- ✅ Cannot send without Email Template
- ✅ Cannot send without Saved Search
- ✅ Cannot send without Sender
- ✅ Cannot send without Reply-To Address
- ✅ Can send without Attachments (they're optional)
- ✅ Can send without Subject Override (it's optional)

---

## Troubleshooting During Testing

### Issue: No email received after 10 minutes

**Check:**
1. Spam/junk folder
2. Is the email address in the Saved Search correct?
3. Did you note the Task ID? Contact admin with it

**Try:**
- Send another test to a different email address you control

### Issue: Reply-To field doesn't auto-populate

**Try:**
1. Select a different Sender
2. Select the original Sender again
3. The field should now populate

**If still empty:**
- Manually enter the Reply-To address
- Report to administrator

### Issue: Attachments missing from email

**Check:**
1. Are the files in the **E-Mail Attachments** folder?
2. Did you actually select them in the form?
3. Are the files too large? (NetSuite has size limits)

**Try:**
- Use a smaller file (under 10MB)
- Test with just one attachment

### Issue: Wrong sender name appears

**Check:**
- Did you select the correct Sender in the form?
- The name comes from the Employee record in NetSuite

**Note:**
- The actual sending address is always `no-reply@tokyofood.co.nz`
- Only the display name (sender name) changes
- Emails are sent via external SMTP server (mss52.kagoya.net)

---

## Test Results Template

Use this checklist to track your testing:

```
Date Tested: _______________
Tester Name: _______________

[ ] Test 1: Simple Email - PASS / FAIL
    Notes: _________________________________

[ ] Test 2: Email with Attachments - PASS / FAIL
    Notes: _________________________________

[ ] Test 3: Subject Override - PASS / FAIL
    Notes: _________________________________

[ ] Test 4: Different Sender - PASS / FAIL
    Notes: _________________________________

[ ] Test 5: Multiple Recipients - PASS / FAIL
    Notes: _________________________________

[ ] Test 6: Reset Function - PASS / FAIL
    Notes: _________________________________

[ ] Test 7: Validation Checks - PASS / FAIL
    Notes: _________________________________

Overall Status: READY FOR PRODUCTION / NEEDS FIXES

Issues Found:
1. _________________________________
2. _________________________________
3. _________________________________
```

---

## Reporting Issues

If you find problems during testing:

1. **Stop testing** if the issue is severe
2. **Document the issue**:
   - What you were trying to do (which test scenario)
   - What happened instead
   - Error messages (take screenshots)
   - Task ID (if you got to the send step)
3. **Contact the administrator** with all the above information
4. **Don't use for production** until issues are resolved

---

## Sign-Off

Once all tests pass:

```
Testing completed by: _______________
Date: _______________
Signature: _______________

Approved for production use: YES / NO

Approver: _______________
Date: _______________
```

---

## Tips for Successful Testing

1. **Use test data only** - don't test with real customer email lists
2. **Test during low-traffic hours** - avoid peak business times
3. **Start small** - test with 1-3 recipients before larger groups
4. **Keep notes** - document what works and what doesn't
5. **Ask questions** - if something seems wrong, ask before proceeding
6. **Be patient** - emails may take a few minutes to arrive

---

*Last Updated: 2025-02-11*
