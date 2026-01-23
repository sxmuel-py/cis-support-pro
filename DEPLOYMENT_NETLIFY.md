# Deployment Guide - Netlify

This guide will help you deploy the **CIS Support Pro** portal to Netlify.

## Step 1: Push Code to GitHub

We need to push your local code (including the new `netlify.toml`) to GitHub.

**Run the automated script again:**
```bash
.\push-to-github.bat
```
*(If prompted, choose "force" or simply ensure it says "Success")*

---

## Step 2: Deploy to Netlify

1.  **Sign Up/Log In:** Go to [Netlify.com](https://www.netlify.com/) and sign up with GitHub.
2.  **Add New Site:**
    *   Click **"Add new site"** -> **"Import an existing project"**.
    *   Choose **GitHub**.
    *   Select your repository (`cis-support-pro`).

3.  **Configure Build:**
    *   **Build Command:** `npm run build` (should be auto-detected).
    *   **Publish Directory:** `.next` (Netlify handles this via the plugin).
    *   Click **"Deploy Site"**.

4.  **Environment Variables:**
    *   Go to **Site configuration** -> **Environment variables**.
    *   Click **"Add a variable"** -> **"Import from a .env file"**.
    *   Copy-paste the entire content of your `.env.local` file.
    *   Click **"Import variables"**.

5.  **Trigger Redeploy:**
    *   Go to **Deploys**.
    *   Click **"Trigger deploy"** -> **"Clear cache and deploy site"** (to ensure env vars are picked up).

---

## Step 3: Setup Automated Emails (Cron)

Netlify doesn't have a built-in free cron scheduler like Vercel, so we use **GitHub Actions** (it's free and better!).

1.  Go to your GitHub Repository settings.
2.  Navigate to **Settings** -> **Secrets and variables** -> **Actions**.
3.  Click **"New repository secret"**.
4.  Add these two secrets:

    *   **Name:** `NETLIFY_SITE_URL`
        *   **Value:** Your live Netlify URL (e.g., `https://cis-support-pro.netlify.app`) - *Wait until Netlify gives you this URL*.

    *   **Name:** `CRON_SECRET`
        *   **Value:** `Kx9mP2vL8nQ4rT6wY1zB5cD7fG3hJ0kM` (or whatever is in your .env file).

**That's it!** GitHub will now ping your Netlify site every 5 minutes to check for emails.

---

## Troubleshooting

*   **Build Failed?** Check the "Deploys" tab in Netlify for logs.
*   **Emails not processing?** Check the "Actions" tab in GitHub to see if the cron job is running successfully (green checkmarks).
