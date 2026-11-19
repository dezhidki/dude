// Run: node auth-errors.test.js
const assert = require('node:assert');
const { isAuthError, isConnError } = require('./auth-errors');
const err = (message, extra = {}) => Object.assign(new Error(message), extra);
assert.ok(isAuthError(err('AADSTS700082: The refresh token has expired due to inactivity.')));
assert.ok(isAuthError(err('invalid_grant')));
assert.ok(isAuthError(err('Command failed', { authenticationFailed: true })));
assert.ok(isAuthError(err('Invalid login: 535 5.7.3 Authentication unsuccessful', { code: 'EAUTH' })));
assert.ok(isAuthError(err('AADSTS50076: interaction_required, multi-factor authentication needed')));
assert.ok(!isAuthError(err('fetch failed')));
assert.ok(!isAuthError(err('getaddrinfo ENOTFOUND login.microsoftonline.com')));
assert.ok(isConnError(err('Connection not available', { code: 'NoConnection' })));
assert.ok(isConnError(err('read ECONNRESET')));
assert.ok(!isConnError(err('invalid_grant')));
assert.ok(!isAuthError(err('Mailbox does not exist')) && !isConnError(err('Mailbox does not exist')));
console.log('auth-errors ok');
