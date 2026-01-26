# Cron-Job.org Setup Guide (1-Minute Interval)

This project uses **Cron-Job.org** to trigger email processing every minute. This provides near instant ticket creation compared to the 5-minute interval of GitHub Actions or EasyCron's free tier.

## Configuration Details

**Dashboard URL**: [https://console.cron-job.org/jobs](https://console.cron-job.org/jobs)

### Job Settings

| Setting | Value |
|---------|-------|
| **URL** | `https://cis-support-pro.netlify.app/api/cron/process-emails` |
| **Title** | `CIS Support - Email Processing` |
| **Schedule** | `Every 1 minute` |

### Authentication (Important)

In the **Advanced** tab, the following header MUST be set:

- **Key**: `Authorization`
- **Value**: `Bearer Kx9mP2vL8nQ4rT6wY1zB5cD7fG3hJ0kM`

*(Note the space between "Bearer" and the secret key)*

## Monitoring

- Check the **History** tab in the Cron-Job.org dashboard to see execution logs.
- Failed runs will trigger an email notification (if configured).
- A `200 OK` status means the job ran successfully.
- A `401 Unauthorized` status means the Authorization header is missing or incorrect.

## Why External Cron?

We switched from GitHub Actions to Cron-Job.org to:
1. Achieve **1-minute intervals** (GitHub Actions is minimum 5 mins).
2. Avoid GitHub Actions concurrency limits or delays.
3. Get better real-time processing for support tickets.
