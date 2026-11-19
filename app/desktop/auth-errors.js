// Telling "you must sign in again" apart from "the connection dropped" (tested by auth-errors.test.js).
const AUTH =
  /invalid_grant|interaction_required|login_required|consent_required|invalid_token|unauthorized_client|AADSTS\d+|AUTHENTICATE failed|Authentication unsuccessful|authentication failed|5\.7\.\d+|\b535\b|token (has )?expired|AccessTokenExpired|session (is )?(invalid|expired)/i;
const CONN =
  /ECONNRESET|ECONNREFUSED|ETIMEDOUT|EPIPE|ENOTFOUND|EAI_AGAIN|socket|Connection (not available|closed)|NoConnection|closed unexpectedly|fetch failed|network/i;
const text = (e) =>
  [e?.message, e?.code, e?.responseText, e?.response, e?.serverResponseCode].filter(Boolean).join(' ');

function isAuthError(e) {
  if (!e) return false;
  if (e.authenticationFailed || e.code === 'EAUTH') return true;
  const t = text(e);
  return AUTH.test(t) && !/fetch failed|ENOTFOUND|EAI_AGAIN/i.test(t); // offline isn't a sign-in problem
}
function isConnError(e) {
  return !!e && !isAuthError(e) && CONN.test(text(e));
}

module.exports = { isAuthError, isConnError };
