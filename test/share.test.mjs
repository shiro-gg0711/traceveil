import { test } from 'node:test';
import assert from 'node:assert/strict';
import { markdownLog } from '../share.mjs';

test('GitHub copy uses only the result and cannot be closed by backticks in the log', () => {
  const text = 'INFO [EMAIL_1]\n```html\n<script>alert(1)</script>\n```';
  const result = markdownLog(text);
  assert.equal(result, '````text\n' + text + '\n````');
});
test('trailing newlines remain unchanged inside the fenced block', () => {
  assert.equal(markdownLog('done\n'), '```text\ndone\n```');
});
