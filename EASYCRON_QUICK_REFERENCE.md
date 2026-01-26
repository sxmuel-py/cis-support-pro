# EasyCron Quick Setup - Copy & Paste Values

## 🔗 Sign Up
**URL**: https://www.easycron.com

---

## ⚙️ Cron Job Configuration

### Basic Info
```
Cron Job Name: CIS Support - Email Processing
URL: https://cis-support-pro.netlify.app/api/cron/process-emails
Cron Expression: */5 * * * *
HTTP Method: GET
```

### HTTP Header
```
Header Name: Authorization
Header Value: Bearer Kx9mP2vL8nQ4rT6wY1zB5cD7fG3hJ0kM
```

### Advanced Settings
```
Timeout: 60 seconds
Email on Failure: Enabled
```

---

## ✅ Expected Test Response
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

---

## 🧪 Testing Steps

1. **Test the cron job** in EasyCron (click "Test" button)
2. **Send test email** to `cislagoshelpdesk@gmail.com`
3. **Wait 5 minutes** (or manually trigger in EasyCron)
4. **Check dashboard** for new ticket
5. **Check email** for confirmation

---

## 🗑️ Remove GitHub Actions (After EasyCron Works)

```bash
cd "c:\Users\new\Documents\IT SUPPORT"
git rm .github/workflows/cron.yml
git commit -m "Remove GitHub Actions cron (using EasyCron instead)"
git push origin main
```

---

## 📊 Monitoring

**Dashboard**: https://www.easycron.com/user/
- View execution logs
- Check success/failure rate
- See response times
- Get email alerts on failures
