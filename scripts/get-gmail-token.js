/**
 * Gmail OAuth2 Token Generator
 *
 * Uses a localhost callback instead of the deprecated OOB flow.
 * Before running, add this redirect URI to your Google OAuth client:
 * http://127.0.0.1:3007/oauth2callback
 */

const { google } = require("googleapis");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.GMAIL_OAUTH_PORT || 3007);
const REDIRECT_URI = `http://127.0.0.1:${PORT}/oauth2callback`;
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
];

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const contents = fs.readFileSync(filePath, "utf8");

  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function getClientCredentials() {
  loadDotEnv(path.join(__dirname, "..", ".env.local"));

  if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET) {
    return {
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      source: ".env.local",
    };
  }

  const credentialsPath = path.join(__dirname, "..", "gmail-credentials.json");
  if (!fs.existsSync(credentialsPath)) {
    throw new Error(
      "Missing Gmail OAuth credentials. Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env.local or add gmail-credentials.json."
    );
  }

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
  const config = credentials.installed || credentials.web || {};

  if (!config.client_id || !config.client_secret) {
    throw new Error("gmail-credentials.json is missing client_id/client_secret.");
  }

  return {
    clientId: config.client_id,
    clientSecret: config.client_secret,
    source: "gmail-credentials.json",
  };
}

async function main() {
  const { clientId, clientSecret, source } = getClientCredentials();

  console.log("\n===========================================");
  console.log("Gmail Bot OAuth2 Setup");
  console.log("===========================================\n");
  console.log(`Using client credentials from ${source}`);
  console.log(`Redirect URI: ${REDIRECT_URI}\n`);
  console.log("If Google rejects the redirect URI, add this exact URI to your OAuth client first:");
  console.log(REDIRECT_URI);
  console.log("");

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  const server = http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url, `http://127.0.0.1:${PORT}`);

      if (requestUrl.pathname !== "/oauth2callback") {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
        return;
      }

      const code = requestUrl.searchParams.get("code");
      const error = requestUrl.searchParams.get("error");

      if (error) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end(`Google OAuth error: ${error}`);
        console.error(`\nGoogle OAuth error: ${error}`);
        server.close();
        return;
      }

      if (!code) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Missing authorization code");
        console.error("\nMissing authorization code in callback.");
        server.close();
        return;
      }

      const { tokens } = await oauth2Client.getToken(code);

      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Authorization complete. You can close this tab and return to Codex.");

      console.log("\n===========================================");
      console.log("SUCCESS");
      console.log("===========================================\n");
      console.log("Add these values to .env.local or your Vercel env vars:\n");
      console.log(`GMAIL_CLIENT_ID=${clientId}`);
      console.log(`GMAIL_CLIENT_SECRET=${clientSecret}`);
      console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token || "<no refresh token returned>"}`);
      console.log("");

      if (!tokens.refresh_token) {
        console.log("No refresh token was returned.");
        console.log("If this app was already authorized before, revoke it at https://myaccount.google.com/permissions");
        console.log("then run this script again.\n");
      } else {
        console.log("This is your fresh production refresh token.\n");
      }

      server.close();
    } catch (error) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Failed to exchange the authorization code.");
      console.error("\nFailed to exchange authorization code:", error.message);
      server.close();
    }
  });

  server.listen(PORT, "127.0.0.1", () => {
    console.log("Open this URL in your browser and approve the Gmail account:\n");
    console.log(authUrl);
    console.log("");
    console.log("Waiting for Google callback...\n");
  });
}

main().catch((error) => {
  console.error("\nSetup failed:", error.message);
  process.exit(1);
});
