// Sign-in the way Thunderbird does it: Thunderbird's own public OAuth client registrations
// (from Thunderbird's OAuth2Providers), authorization code + PKCE, then XOAUTH2 for IMAP/SMTP.
const crypto = require('node:crypto');
const http = require('node:http');
const { BrowserWindow, shell } = require('electron');

const PROVIDERS = {
  microsoft: {
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    clientId: '9e5f94bc-e8a4-4e73-b8be-63364c29d753',
    redirect: 'https://localhost',
    scope: 'https://outlook.office.com/IMAP.AccessAsUser.All https://outlook.office.com/SMTP.Send offline_access',
    imap: { host: 'outlook.office365.com', port: 993, secure: true },
    smtp: { host: 'smtp.office365.com', port: 587, secure: false },
  },
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: '406964657835-aq8lmia8j95dhl1a2bvharmfk3t1hgqj.apps.googleusercontent.com',
    clientSecret: 'kSmqreRr0qwBWJgbf5Y-PjSU', // public: shipped inside Thunderbird (OAuth2Providers.sys.mjs)
    redirect: 'http://localhost', // loopback; a port is added at sign-in
    scope: 'https://mail.google.com/ https://www.googleapis.com/auth/calendar',
    imap: { host: 'imap.gmail.com', port: 993, secure: true },
    smtp: { host: 'smtp.gmail.com', port: 465, secure: true },
  },
};

// Calendar for Microsoft 365: the same Thunderbird client, asking only for Exchange Web Services.
PROVIDERS['microsoft-calendar'] = {
  ...PROVIDERS.microsoft,
  scope: 'https://outlook.office.com/EWS.AccessAsUser.All offline_access',
};

const b64url = (b) => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function tokenRequest(p, params) {
  const body = new URLSearchParams({
    client_id: p.clientId,
    ...(p.clientSecret ? { client_secret: p.clientSecret } : {}),
    ...params,
  });
  const r = await fetch(p.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error(j.error_description || j.error || `token request failed (${r.status})`);
  return {
    access: j.access_token,
    refresh: j.refresh_token || params.refresh_token,
    expires: Date.now() + (j.expires_in || 3600) * 1000,
  };
}

// Microsoft: its client only allows https://localhost, so sign in inside an app window and catch that redirect.
function codeViaWindow(url, parent) {
  return new Promise((resolve, reject) => {
    const w = new BrowserWindow({
      width: 520,
      height: 720,
      parent,
      modal: false,
      title: 'Sign in',
      autoHideMenuBar: true,
      webPreferences: { partition: 'persist:signin' },
    });
    let done = false;
    const finish = (err, code) => {
      if (done) return;
      done = true;
      if (!w.isDestroyed()) w.close();
      err ? reject(err) : resolve(code);
    };
    w.webContents.session.webRequest.onBeforeRequest(
      { urls: ['https://localhost/*', 'http://localhost/*'] },
      (d, cb) => {
        cb({ cancel: true });
        const u = new URL(d.url);
        const err = u.searchParams.get('error_description') || u.searchParams.get('error');
        finish(err ? new Error(err) : null, u.searchParams.get('code'));
      },
    );
    w.on('closed', () => finish(new Error('the sign-in window was closed')));
    w.loadURL(url);
  });
}

// Google blocks sign-in inside embedded browsers, so use the system browser and a loopback listener.
function codeViaBrowser(buildUrl) {
  return new Promise((resolve, reject) => {
    let redirect;
    const srv = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://localhost');
      if (!u.searchParams.has('code') && !u.searchParams.has('error')) {
        res.writeHead(404);
        res.end();
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<body style="font:16px sans-serif;padding:40px">login ok. close tab. back to dude.</body>');
      srv.close();
      clearTimeout(timer);
      const err = u.searchParams.get('error');
      err ? reject(new Error(err)) : resolve({ code: u.searchParams.get('code'), redirect });
    });
    const timer = setTimeout(() => {
      srv.close();
      reject(new Error('sign-in timed out'));
    }, 5 * 60e3);
    srv.listen(0, '127.0.0.1', () => {
      redirect = `http://localhost:${srv.address().port}`;
      shell.openExternal(buildUrl(redirect));
    });
  });
}

async function signIn(provider, email, parent) {
  const p = PROVIDERS[provider];
  if (!p) throw new Error(`unknown provider ${provider}`);
  const verifier = b64url(crypto.randomBytes(32));
  const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
  const state = b64url(crypto.randomBytes(12));
  const build = (redirect) => {
    const u = new URL(p.authUrl);
    const q = {
      client_id: p.clientId,
      response_type: 'code',
      redirect_uri: redirect,
      scope: p.scope,
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      login_hint: email,
    };
    if (provider === 'google') Object.assign(q, { access_type: 'offline', prompt: 'consent' });
    for (const [k, v] of Object.entries(q)) u.searchParams.set(k, v);
    return u.toString();
  };
  let code,
    redirect = p.redirect;
  if (provider === 'google') ({ code, redirect } = await codeViaBrowser(build));
  else code = await codeViaWindow(build(redirect), parent);
  if (!code) throw new Error('no authorization code came back');
  const tok = await tokenRequest(p, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirect,
    code_verifier: verifier,
  });
  return { email, provider, ...tok };
}

async function freshToken(acct) {
  if (acct.expires - Date.now() > 60e3) return acct.access;
  const t = await tokenRequest(PROVIDERS[acct.provider], {
    grant_type: 'refresh_token',
    refresh_token: acct.refresh,
    scope: PROVIDERS[acct.provider].scope,
  });
  Object.assign(acct, t);
  return acct.access;
}

module.exports = { PROVIDERS, signIn, freshToken };
