import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession } from '../session.mjs';

test('an older result cannot overwrite a newer input', async () => {
  const pending = [], shown = [];
  const session = createSession(() => new Promise(resolve => pending.push(resolve)), result => shown.push(result));
  const first = session.submit('old');
  const second = session.submit('new');
  await Promise.resolve();
  assert.equal(pending.length, 2);
  pending[1]('new-result'); await second;
  pending[0]('old-result'); await first;
  assert.deepEqual(shown, ['new-result']);
});
test('clear invalidates outstanding work and its errors', async () => {
  let reject;
  const errors = [], shown = [];
  const session = createSession(() => new Promise((_, fail) => { reject = fail; }), result => shown.push(result), error => errors.push(error));
  const pending = session.submit('private');
  await Promise.resolve();
  assert.equal(typeof reject, 'function');
  session.invalidate(); reject(new Error('old error')); await pending;
  assert.deepEqual(shown, []); assert.deepEqual(errors, []);
});
test('clipboard UI completions can be invalidated by edits or clear', () => {
  const session = createSession(() => {}, () => {});
  const isCurrent = session.snapshot();
  assert.equal(isCurrent(), true);
  session.invalidate();
  assert.equal(isCurrent(), false);
});
