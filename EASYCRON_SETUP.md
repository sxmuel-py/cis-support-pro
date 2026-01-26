# EasyCron Setup Guide

This guide will help you set up EasyCron to automatically process emails every 5 minutes instead of using GitHub Actions.

## Why EasyCron?

- ✅ **More Reliable**: Better uptime than GitHub Actions
- ✅ **Free Tier**: 1 cron job running every 5 minutes (perfect for our needs)
- ✅ **Monitoring Dashboard**: See execution history and logs
- ✅ **Email Alerts**: Get notified if the job fails
- ✅ **No Code Changes**: Works with your existing API endpoint

---

## Step-by-Step Setup

### 1. Create EasyCron Account

1. Go to **[https://www.easycron.com](https://www.easycron.com)**
2. Click **"Sign Up"** (top right)
3. Create a free account with your email
4. Verify your email address

---

### 2. Create Your Cron Job

1. **Log in** to your EasyCron dashboard
2. Click **"+ Cron Job"** button (top left)
3. Fill in the form with these exact values:

#### Basic Settings

| Field | Value |
|-------|-------|
| **Cron Job Name** | `CIS Support - Email Processing` |
| **URL** | `https://cis-support-pro.netlify.app/api/cron/process-emails` |
| **Cron Expression** | `*/5 * * * *` |

> **Note**: The cron expression `*/5 * * * *` means "every 5 minutes"

#### HTTP Settings

1. **HTTP Method**: Select `GET`
2. **HTTP Headers**: Click "Add Header" and enter:
   - **Header Name**: `Authorization`
   - **Header Value**: `Bearer Kx9mP2vL8nQ4rT6wY1zB5cD7fG3hJ0kM`

#### Advanced Settings (Optional but Recommended)

| Setting | Value | Why? |
|---------|-------|------|
| **Timeout** | `60 seconds` | Gives enough time to process all emails |
| **Email on Failure** | ✅ Enabled | Get notified if something breaks |
| **Notification Email** | Your email | Where to send alerts |

---

### 3. Test the Cron Job

Before saving, test it:

1. Click **"Test"** button (bottom of form)
2. You should see a success response like:
   ```json
   {
     "success": true,
     "results": {
       "processed": 0,
       "tickets_created": 0,
       "junk_filtered": 0,
       "duplicates_skipped": 0,
       "errors": 0
     },
     "timestamp": "2026-01-26T09:00:00.000Z"
   }
   ```
3. If you see this, click **"Create Cron Job"**

---

### 4. Enable the Cron Job

1. After creating, you'll see your cron job in the dashboard
2. Make sure the **Status** toggle is **ON** (green)
3. The job will now run automatically every 5 minutes

---

### 5. Monitor Execution

#### View Logs
1. Go to your EasyCron dashboard
2. Click on **"CIS Support - Email Processing"**
3. Click **"Execution Log"** tab
4. You'll see:
   - ✅ Successful runs (green)
   - ❌ Failed runs (red)
   - Response time
   - Response body

#### Check Email Processing
- Send a test email to `cislagoshelpdesk@gmail.com`
- Wait up to 5 minutes
- Check if a ticket was created in your dashboard
- Check if you received a confirmation email

---

## Troubleshooting

### ❌ "401 Unauthorized" Error
**Problem**: The authorization header is incorrect or missing.

**Solution**: 
1. Edit your cron job
2. Verify the HTTP Header is exactly:
   - Name: `Authorization`
   - Value: `Bearer Kx9mP2vL8nQ4rT6wY1zB5cD7fG3hJ0kM`
3. Make sure there's a space after "Bearer"

---

### ❌ "500 Internal Server Error"
**Problem**: Something wrong with the Netlify deployment or environment variables.

**Solution**:
1. Check Netlify deployment is successful
2. Verify all environment variables are set in Netlify:
   - `GMAIL_CLIENT_ID`
   - `GMAIL_CLIENT_SECRET`
   - `GMAIL_REFRESH_TOKEN`
   - `GMAIL_INBOX_EMAIL`
   - `CRON_SECRET`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

### ❌ Timeout Error
**Problem**: The job is taking longer than 60 seconds.

**Solution**:
1. Edit your cron job
2. Increase timeout to `90 seconds`
3. If still timing out, you may have too many unread emails - manually archive old emails in Gmail

---

### ❌ No Emails Being Processed
**Problem**: Cron is running but not creating tickets.

**Solution**:
1. Check the execution log response body
2. Look for errors in the `errorDetails` array
3. Verify Gmail credentials are still valid
4. Check that emails are actually unread in the inbox

---

## Removing GitHub Actions (Optional)

Once EasyCron is working, you can remove the GitHub Actions workflow:

1. Delete the file: `.github/workflows/cron.yml`
2. Commit and push:
   ```bash
   git rm .github/workflows/cron.yml
   git commit -m "Remove GitHub Actions cron (using EasyCron instead)"
   git push origin main
   ```

---

## Free Tier Limits

EasyCron's free tier includes:
- ✅ 1 cron job
- ✅ Minimum interval: 5 minutes
- ✅ Execution history: Last 10 runs
- ✅ Email notifications

**This is perfect for our use case!** If you need more frequent checks (e.g., every minute), you'd need to upgrade to a paid plan (~$3/month).

---

## Alternative: Upgrade to Every Minute

If you want emails processed faster:

1. Upgrade to EasyCron's **Starter Plan** ($2.99/month)
2. Change cron expression to: `* * * * *` (every minute)
3. This processes emails 5x faster

---

## Support

- **EasyCron Documentation**: [https://www.easycron.com/faq](https://www.easycron.com/faq)
- **CIS Support Pro Issues**: Check Netlify logs or Supabase logs

---

## Summary

✅ **What you did:**
- Created a free EasyCron account
- Set up a cron job to ping your Netlify endpoint every 5 minutes
- Enabled monitoring and email alerts

✅ **What happens now:**
- Every 5 minutes, EasyCron calls your API
- Your API checks Gmail for new emails
- Tickets are created automatically
- Confirmation emails are sent

✅ **No more GitHub Actions needed!**
