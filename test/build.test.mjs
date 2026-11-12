import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Script } from 'node:vm';
import { buildPage } from '../scripts/build.mjs';

test('portable output is deterministic with no runtime asset imports', async () => {
  const html = await buildPage();
  assert.equal(html, await buildPage());
  assert.ok(!/<script[^>]+src=|<link[^>]+href="(?:style|https?:)|^import\s/m.test(html));
  assert.ok(html.includes('function redact('));
  assert.ok(html.includes('function createSession('));
  const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
  assert.doesNotThrow(() => new Script(script));
  const engine = await readFile(new URL('../redact.mjs', import.meta.url), 'utf8');
  assert.ok(html.includes(engine.replace(/^export /gm, '').trim()));
});
