import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../cli.mjs', import.meta.url));
const run = (args = [], input = '') => spawnSync(process.execPath, [cli, ...args], { input, encoding: 'utf8' });
test('stdin returns only redacted content on stdout', () => {
  const result = run([], 'token=fake-test-value\n');
  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'token=[SECRET_1]\n');
  assert.ok(!result.stderr.includes('fake-test-value'));
});
test('check mode reports detection without emitting log contents', () => {
  const detected = run(['--check'], 'user@example.test');
  assert.equal(detected.status, 1);
  assert.equal(detected.stdout, '');
  assert.equal(run(['--check'], 'GET /health 200').status, 0);
});
test('bad arguments and malformed UTF-8 exit 2 without echoing input', () => {
  assert.equal(run(['--unknown']).status, 2);
  assert.equal(run(['--check', '-o', 'unused.log']).status, 2);
  assert.equal(run([], Buffer.from([0xff])).status, 2);
});
test('output is exclusive and input is never changed', () => {
  const dir = mkdtempSync(join(tmpdir(), 'traceveil-test-'));
  try {
    const input = join(dir, 'input.log'), output = join(dir, 'output.log');
    writeFileSync(input, 'password=fake-test-value');
    assert.equal(run([input, '-o', output]).status, 0);
    assert.equal(readFileSync(output, 'utf8'), 'password=[SECRET_1]');
    assert.equal(run([input, '-o', output]).status, 2);
    assert.equal(run([input, '-o', input]).status, 2);
    assert.equal(readFileSync(input, 'utf8'), 'password=fake-test-value');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('oversized stdin is refused', () => {
  const result = run([], 'a'.repeat(8 * 1024 * 1024 + 1));
  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
});
