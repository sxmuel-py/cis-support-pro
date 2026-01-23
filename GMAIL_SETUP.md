# Gmail Integration Setup Guide

## Prerequisites
- Google Workspace admin access
- Google Cloud Console access
- OpenAI API key (or Anthropic)

---

## Step 1: Google Cloud Setup

### 1.1 Create/Select Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Note the **Project ID**

### 1.2 Enable Gmail API
1. Navigate to **APIs & Services** → **Library**
2. Search for "Gmail API"
3. Click **Enable**

### 1.3 Create Service Account
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Fill in details:
   - Name: `cis-support-gmail-service`
   - Description: `Service account for CIS Support Pro email integration`
4. Click **Create and Continue**
5. Skip role assignment (click **Continue**)
6. Click **Done**

### 1.4 Generate Service Account Key
1. Click on the service account you just created
2. Go to **Keys** tab
3. Click **Add Key** → **Create new key**
4. Select **JSON** format
5. Click **Create**
6. **Save the downloaded JSON file securely**

### 1.5 Enable Domain-Wide Delegation
1. Still in the service account details page
2. Check **Enable Google Workspace Domain-wide Delegation**
3. Note the **Client ID** (you'll need this for Google Workspace Admin)
4. Click **Save**

---

## Step 2: Google Workspace Admin Setup

### 2.1 Configure Domain-Wide Delegation
1. Go to [Google Workspace Admin Console](https://admin.google.com)
2. Navigate to **Security** → **Access and data control** → **API Controls**
3. Scroll to **Domain-wide Delegation**
4. Click **Manage Domain Wide Delegation**
5. Click **Add new**
6. Fill in:
   - **Client ID**: (from Step 1.5)
   - **OAuth Scopes**: 
     ```
     https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/gmail.modify
     ```
7. Click **Authorize**

---

## Step 3: Configure Environment Variables

### 3.1 Extract Service Account Credentials
Open the JSON file you downloaded in Step 1.4 and find:
- `client_email` → This is your `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → This is your `GOOGLE_PRIVATE_KEY`

### 3.2 Update `.env.local`
```env
# Gmail API
GOOGLE_SERVICE_ACCOUNT_EMAIL=cis-support-gmail-service@your-project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Key-Here\n-----END PRIVATE KEY-----\n"
GMAIL_INBOX_EMAIL=itsupport@cislagos.org

# OpenAI
OPENAI_API_KEY=sk-proj-your-key-here

# Cron Secret (generate with: openssl rand -base64 32)
CRON_SECRET=your-random-secret-here

# Triage Mode
TRIAGE_MODE=llm
```

**Important:** Make sure the `GOOGLE_PRIVATE_KEY` includes the `\n` characters for line breaks!

---

## Step 4: Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Click **Create new secret key**
3. Name it: `CIS Support Pro`
4. Copy the key and add to `.env.local`

---

## Step 5: Apply Database Migration

Run the email integration migration:

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/003_email_integration.sql`
3. Paste and click **Run**

---

## Step 6: Install Dependencies

```bash
npm install
```

This will install:
- `googleapis` - Gmail API client
- `openai` - LLM for email triage

---

## Step 7: Test the Integration

### 7.1 Manual Test
```bash
# Start dev server
npm run dev

# In another terminal, trigger the cron job manually:
curl http://localhost:3000/api/cron/process-emails \
  -H "Authorization: Bearer your-cron-secret-here"
```

### 7.2 Send Test Email
1. Send an email to `itsupport@cislagos.org`
2. Subject: "Test - My computer won't turn on"
3. Body: "Hi, I need help. My laptop is not starting up."
4. Wait 30 seconds, then trigger the cron job
5. Check dashboard → You should see a new ticket!

### 7.3 Test Junk Filtering
1. Send an email with subject: "Special Promotion - Buy Now!"
2. Trigger cron job
3. Check Supabase → `trash` table should have this email

---

## Step 8: Deploy to Vercel

### 8.1 Add Environment Variables
In Vercel Dashboard → Settings → Environment Variables, add:
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GMAIL_INBOX_EMAIL`
- `OPENAI_API_KEY`
- `CRON_SECRET`
- `TRIAGE_MODE`

### 8.2 Deploy
```bash
vercel --prod
```

### 8.3 Verify Cron Job
- Vercel will automatically set up the cron job from `vercel.json`
- It will run every 5 minutes
- Check logs: Vercel Dashboard → Deployments → Functions → Logs

---

## Troubleshooting

### "Error: Missing Gmail configuration"
- Check that all env vars are set in `.env.local`
- Restart dev server after adding env vars

### "Error: Unauthorized"
- Verify domain-wide delegation is set up correctly
- Check that OAuth scopes are exactly as specified
- Wait 10 minutes for changes to propagate

### "Error: Permission denied"
- Ensure service account has domain-wide delegation enabled
- Verify `GMAIL_INBOX_EMAIL` is correct

### "No emails fetched"
- Check that there are unread emails in the inbox
- Verify Gmail API is enabled in Google Cloud Console
- Test with a fresh email

### LLM Errors
- Verify `OPENAI_API_KEY` is valid
- Check OpenAI account has credits
- System will fallback to keyword-based triage

---

## Monitoring

### Check Processed Emails
```sql
SELECT * FROM processed_emails ORDER BY created_at DESC LIMIT 10;
```

### Check Junk Emails
```sql
SELECT * FROM trash ORDER BY created_at DESC LIMIT 10;
```

### View Cron Job Logs
- Vercel: Dashboard → Functions → Logs
- Local: Check terminal output

---

## Next Steps

1. ✅ Monitor for a few days
2. ✅ Adjust LLM prompt if needed
3. ✅ Add auto-reply feature (optional)
4. ✅ Upgrade to Gmail Push Notifications (real-time)
