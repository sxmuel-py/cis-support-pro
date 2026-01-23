# Deployment Guide - Vercel

This guide will help you deploy the **CIS Support Pro** portal to Vercel.

## Prerequisites

1.  **Vercel Account**: [Sign up here](https://vercel.com/signup).
2.  **GitHub Account**: [Sign up here](https://github.com/join).
3.  **Git Installed**: You already have this.

---

## Step 1: Push Code to GitHub

We need to push your local code to a private GitHub repository.

1.  **Create a Repository:**
    *   Go to [GitHub.com/new](https://github.com/new).
    *   Repository Name: `cis-support-pro` (or similar).
    *   Visibility: **Private** (Important!).
    *   Create Repository.

2.  **Push Code:**
    Run these commands in your terminal:
    ```bash
    git init
    git add .
    git commit -m "Initial commit - Complete IT Support Portal"
    git branch -M main
    git remote add origin https://github.com/YOUR_USERNAME/cis-support-pro.git
    git push -u origin main
    ```

---

## Step 2: Deploy to Vercel

1.  **Import Project:**
    *   Go to your [Vercel Dashboard](https://vercel.com/dashboard).
    *   Click **"Add New..."** -> **"Project"**.
    *   Select "Import" next to your `cis-support-pro` repository.

2.  **Configure Project:**
    *   **Framework Preset:** Next.js (should be auto-detected).
    *   **Root Directory:** `./` (default).

3.  **Environment Variables:**
    *   It is **CRITICAL** to copy all variables from your `.env.local` file into Vercel.
    *   Click **"Environment Variables"** section.
    *   Copy-paste the entire content of `.env.local`.
    *   *Tip: You can copy the whole file content and paste it into the first field; Vercel often parses it automatically.*

    **Checklist of required variables:**
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   `SUPABASE_SERVICE_ROLE_KEY`
    *   `GMAIL_CLIENT_ID`
    *   `GMAIL_CLIENT_SECRET`
    *   `GMAIL_REFRESH_TOKEN`
    *   `GMAIL_INBOX_EMAIL`
    *   `CRON_SECRET`
    *   `TRIAGE_MODE`

4.  **Deploy:**
    *   Click **"Deploy"**.
    *   Wait for the build to complete (usually 1-2 minutes).

---

## Step 3: Verify Deployment

1.  **Visit the URL:** Vercel will give you a domain (e.g., `cis-support-pro.vercel.app`).
2.  **Test Login:** Log in with your admin/technician account.
3.  **Check Cron Jobs:**
    *   Go to your Project Dashboard on Vercel.
    *   Click **"Settings"** -> **"Cron Jobs"**.
    *   You should see `/api/cron/process-emails` listed with status **Scheduled**.

---

## Troubleshooting

*   **Build Fails?** Check the logs. Common issues are type errors or missing dependencies.
*   **Emails not sending?** Double-check that `GMAIL_REFRESH_TOKEN` was copied correctly without spaces.
*   **Database connection error?** Ensure your Supabase project allows connections from Vercel (usually 0.0.0.0/0).
