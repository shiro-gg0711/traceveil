import { test } from 'node:test';
import assert from 'node:assert/strict';
import { redact } from '../redact.mjs';

test('the same email keeps its label, distinct emails remain distinguishable', () => {
  const result = redact('alice@example.test → bob@example.test\nalice@example.test failed');
  assert.equal(result.text, '[EMAIL_1] → [EMAIL_2]\n[EMAIL_1] failed');
  assert.equal(result.counts.EMAIL, 3);
});
test('credentials disappear without changing line endings or stack traces', () => {
  const input = 'API_KEY="demo-secret"\r\nAuthorization: Bearer abcdef123456\r\n  at fetch (app.js:10:2)';
  const result = redact(input);
  assert.equal(result.text, 'API_KEY="[SECRET_1]"\r\nAuthorization: Bearer [SECRET_2]\r\n  at fetch (app.js:10:2)');
});
test('JSON keys, URL credentials, and IPv4 addresses are masked', () => {
  const result = redact('{"password":"sample-pass"}\npostgres://alice:pass@db.test/app\nclient=192.168.1.5');
  assert.equal(result.text, '{"password":"[SECRET_1]"}\npostgres://[CREDENTIAL_1]@db.test/app\nclient=[IP_1]');
});
test('multi-line private keys preserve line count', () => {
  const input = 'start\n-----BEGIN PRIVATE KEY-----\nexample-key-data\nsecond-line\n-----END PRIVATE KEY-----\nend';
  const result = redact(input);
  assert.ok(!result.text.includes('example-key-data'));
  assert.equal(result.text.split('\n').length, input.split('\n').length);
  assert.equal(result.counts.PRIVATE_KEY, 1);
});
test('standalone GitHub tokens and JWTs are redacted', () => {
  const result = redact('ghp_'+'a'.repeat(36)+' eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature123');
  assert.ok(result.text.includes('[TOKEN_1]'));
  assert.ok(result.text.includes('[TOKEN_2]'));
});
test('ordinary debug content and invalid IP addresses are unchanged', () => {
  const text = 'GET /health 200\nversion=999.123.456.789\n2026-11-09T12:00:00Z\n日本語のエラー';
  assert.deepEqual(redact(text), { text, counts: {}, total: 0 });
});
test('labels are stable across secret formats and a second pass is unchanged', () => {
  const result = redact('token=abc123\nAuthorization: Bearer abc123\nemail=hi@example.test');
  assert.equal(result.text, 'token=[SECRET_1]\nAuthorization: Bearer [SECRET_1]\nemail=[EMAIL_1]');
  assert.equal(redact(result.text).text, result.text);
});
test('CRLF and CR line boundaries survive private-key masking', () => {
  const text = '-----BEGIN RSA PRIVATE KEY-----\r\naaa\rbbb\r\n-----END RSA PRIVATE KEY-----';
  assert.deepEqual(redact(text).text.match(/\r\n|\r|\n/g), text.match(/\r\n|\r|\n/g));
});
test('escaped quotes in JSON secret values do not leave trailing secret text', () => {
  assert.equal(redact(String.raw`{"password":"ab\"cd"}`).text, '{"password":"[SECRET_1]"}');
});
test('an empty assignment does not consume the next line', () => {
  assert.equal(redact('password=\nINFO connected').text, 'password=\nINFO connected');
});
test('Bearer credentials containing a tilde are fully redacted', () => {
  assert.equal(redact('Authorization: Bearer abc~def').text, 'Authorization: Bearer [SECRET_1]');
});
test('a long email-like non-match is processed without repeated rescanning', () => {
  const text = 'a.'.repeat(20000);
  const start = performance.now();
  assert.equal(redact(text).text, text);
  assert.ok(performance.now() - start < 250, '40 KB non-match must finish within 250 ms');
});
test('long hyphenated non-matches do not cause assignment rescanning', () => {
  const text = 'a-'.repeat(20000);
  const start = performance.now();
  assert.equal(redact(text).text, text);
  assert.ok(performance.now() - start < 250, '40 KB non-match must finish within 250 ms');
});
test('maximum-size hyphenated input does not overflow the regex stack', () => {
  const text = 'a-'.repeat(4 * 1024 * 1024);
  assert.equal(redact(text).text, text);
});
test('URL-like non-matches do not repeatedly repartition user information', () => {
  const text = 'http://' + 'a:'.repeat(20000);
  const start = performance.now();
  assert.equal(redact(text).text, text);
  assert.ok(performance.now() - start < 250, '40 KB non-match must finish within 250 ms');
});
test('incomplete private-key blocks do not repeatedly scan the remaining input', () => {
  const text = '-----BEGIN PRIVATE KEY-----\n'.repeat(10000);
  const start = performance.now();
  assert.equal(redact(text).text, text);
  assert.ok(performance.now() - start < 250, 'incomplete blocks must finish within 250 ms');
});
test('long quoted secret values are completely redacted without stack overflow', () => {
  const text = 'password="' + 'a\\"'.repeat(100000) + '"';
  assert.equal(redact(text).text, 'password="[SECRET_1]"');
});
test('multiple complete PEM blocks preserve intervening log text', () => {
  const block = '-----BEGIN PRIVATE KEY-----\nfictional\n-----END PRIVATE KEY-----';
  const result = redact(block + '\nINFO retry\n' + block);
  assert.equal(result.text, '[PRIVATE_KEY_1]\n\n\nINFO retry\n[PRIVATE_KEY_1]\n\n');
  assert.equal(result.counts.PRIVATE_KEY, 2);
});
test('underscore and hyphen prefixes remain supported', () => {
  assert.equal(redact('MY_SERVICE_API_KEY=one\nmy-service-password=two').text,
    'MY_SERVICE_API_KEY=[SECRET_1]\nmy-service-password=[SECRET_2]');
});
test('maximum-size plain quoted values do not overflow the regex stack', () => {
  const text = 'password="' + 'a'.repeat(8 * 1024 * 1024 - 11) + '"';
  assert.equal(redact(text).text, 'password="[SECRET_1]"');
});
test('optional literal redactions are exact-case, longest-first, and regex-safe', () => {
  const result = redact('team.alpha team team.alpha TEAM', { literals: ['team', 'team.alpha'] });
  assert.equal(result.text, '[CUSTOM_1] [CUSTOM_2] [CUSTOM_1] TEAM');
  assert.equal(result.counts.CUSTOM, 3);
});
test('custom redactions preserve generated labels and deduplicate entries', () => {
  const result = redact('token=abc\nSECRET alice@example.test', { literals: ['SECRET', 'SECRET'] });
  assert.equal(result.text, 'token=[SECRET_1]\n[CUSTOM_1] [EMAIL_1]');
  assert.equal(redact(result.text, { literals: ['SECRET', 'CUSTOM', 'EMAIL'] }).text, result.text);
});
test('literal replacements do not cross line boundaries or retain state', () => {
  assert.throws(() => redact('text', { literals: ['a\nb'] }), /literal/i);
  assert.equal(redact('private-name', { literals: ['private-name'] }).text, '[CUSTOM_1]');
  assert.equal(redact('private-name').text, 'private-name');
});
test('custom limits produce generic errors without revealing values', () => {
  for (const literals of [['x'], ['a'.repeat(257)], Array(33).fill('xx'), [123]]) {
    assert.throws(() => redact('text', { literals }), /Invalid literal redactions/);
  }
});
test('explicit custom values are fully hidden even when automatic patterns overlap them', () => {
  assert.equal(redact('host-192.168.1.2', { literals: ['host-192.168.1.2'] }).text, '[CUSTOM_1]');
  assert.equal(redact('Alice alice@example.test', { literals: ['Alice alice@example.test'] }).text, '[CUSTOM_1]');
});
test('custom values cannot break automatic detection by masking a key name', () => {
  assert.equal(redact('token=abc123', { literals: ['token'] }).text, '[CUSTOM_1]=[SECRET_1]');
});
test('a custom match inside a credential masks the entire overlapping credential', () => {
  assert.equal(redact('password=abcXYZdef', { literals: ['XYZ'] }).text, 'password=[CUSTOM_1]');
});
test('overlapping custom values are fully hidden as a combined span', () => {
  assert.equal(redact('project-alpha-secret', { literals: ['project-alpha', 'alpha-secret'] }).text, '[CUSTOM_1]');
  assert.equal(redact('aaaaaa', { literals: ['aa'] }).text, '[CUSTOM_1]');
});
