// Telling "you must sign in again" apart from "the connection dropped" (tested by auth-errors.test.ts).
const AUTH =
  /invalid_grant|interaction_required|login_required|consent_required|invalid_token|unauthorized_client|AADSTS\d+|AUTHENTICATE failed|Authentication unsuccessful|authentication failed|5\.7\.\d+|\b535\b|token (has )?expired|AccessTokenExpired|session (is )?(invalid|expired)/i;

const CONN =
  /ECONNRESET|ECONNREFUSED|ETIMEDOUT|EPIPE|ENOTFOUND|EAI_AGAIN|socket|Connection (not available|closed)|NoConnection|closed unexpectedly|fetch failed|network/i;

// whatever was thrown: an Error, or imapflow's / nodemailer's error objects
type ErrLike =
  | {
      message?: string;
      code?: string;
      responseText?: string;
      response?: string;
      serverResponseCode?: string;
      authenticationFailed?: boolean;
    }
  | null
  | undefined;

const text = (e: ErrLike) =>
  [e?.message, e?.code, e?.responseText, e?.response, e?.serverResponseCode].filter(Boolean).join(' ');

export function isAuthError(err: unknown): boolean {
  const e = err as ErrLike;
  if (!e) {
    return false;
  }
  if (e.authenticationFailed || e.code === 'EAUTH') {
    return true;
  }
  const t = text(e);
  return AUTH.test(t) && !/fetch failed|ENOTFOUND|EAI_AGAIN/i.test(t); // offline isn't a sign-in problem
}

export function isConnError(e: unknown): boolean {
  return !!e && !isAuthError(e) && CONN.test(text(e as ErrLike));
}
