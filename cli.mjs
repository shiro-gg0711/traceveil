#!/usr/bin/env node
import { readFile, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { parseArgs } from 'node:util';
import { redact } from './redact.mjs';

const limit = 8 * 1024 * 1024;
const help = `TraceVeil — share logs with fewer exposed secrets

  node cli.mjs --web                  Open the browser interface
  node cli.mjs debug.log              Print redacted text
  node cli.mjs debug.log -o share.log  Create a new output file
  node cli.mjs --check debug.log      Exit 1 if a pattern is detected
  cat debug.log | node cli.mjs        Read standard input

Options: --web, --check, --output/-o PATH, --help/-h, --version
Input limit: 8 MiB. Existing files are never overwritten.
Known patterns only. Review the output before sharing.
`;

async function web() {
  const assets = new Map([
    ['/', ['index.html', 'text/html; charset=utf-8']],
    ['/redact.mjs', ['redact.mjs', 'text/javascript; charset=utf-8']],
    ['/session.mjs', ['session.mjs', 'text/javascript; charset=utf-8']],
    ['/share.mjs', ['share.mjs', 'text/javascript; charset=utf-8']],
    ['/app.mjs', ['app.mjs', 'text/javascript; charset=utf-8']],
    ['/style.css', ['style.css', 'text/css; charset=utf-8']],
    ['/TraceVeil.html', ['dist/TraceVeil.html', 'text/html; charset=utf-8']],
  ]);
  const server = createServer(async (req, res) => {
    const asset = assets.get(req.url);
    if (req.method !== 'GET' || !asset) { res.writeHead(404).end(); return; }
    try {
      const body = await readFile(new URL(asset[0], import.meta.url));
      res.writeHead(200, { 'Content-Type': asset[1], 'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; worker-src blob:; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'" });
      res.end(body);
    } catch { res.writeHead(500).end('Could not load the interface.'); }
  });
  server.on('error', () => { console.error('TraceVeil: could not start local server.'); process.exitCode = 2; });
  server.listen(0, '127.0.0.1', () => {
    console.error(`TraceVeil: http://127.0.0.1:${server.address().port}\nOpen this URL in your browser. Ctrl+C to stop.`);
  });
}

async function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    output: { type: 'string', short: 'o' }, check: { type: 'boolean' },
    web: { type: 'boolean' }, help: { type: 'boolean', short: 'h' }, version: { type: 'boolean' },
  } });
  if (values.help) { console.log(help); return; }
  if (values.version) { console.log('0.2.0'); return; }
  if (positionals.length > 1 || (values.check && values.output) ||
      (values.web && (positionals.length || values.check || values.output))) {
    throw new Error('Invalid combination of options. Run --help.');
  }
  if (values.web) return web();
  let input;
  if (positionals[0] && positionals[0] !== '-') {
    if ((await stat(positionals[0])).size > limit) throw new Error('Input exceeds 8 MiB.');
    input = await readFile(positionals[0]);
  } else {
    if (process.stdin.isTTY) { console.log(help); return; }
    const chunks = []; let size = 0;
    for await (const chunk of process.stdin) {
      size += chunk.length;
      if (size > limit) throw new Error('Input exceeds 8 MiB.');
      chunks.push(chunk);
    }
    input = Buffer.concat(chunks);
  }
  if (input.length > limit) throw new Error('Input exceeds 8 MiB.');
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(input); }
  catch { throw new Error('Input must be UTF-8 text.'); }
  const result = redact(text);
  const summary = Object.entries(result.counts).map(([kind, n]) => `${kind}=${n}`).join(', ');
  console.error(`TraceVeil: ${result.total} match(es)${summary ? ` (${summary})` : ''}. Review before sharing.`);
  if (values.check) { process.exitCode = result.total ? 1 : 0; return; }
  if (values.output) await writeFile(values.output, result.text, { flag: 'wx', mode: 0o600 });
  else process.stdout.write(result.text);
}

main().catch(error => {
  // Never echo user input or paths from filesystem error messages.
  const message = error.code === 'EEXIST' ? 'Output already exists; choose a new filename.'
    : error.code === 'ENOENT' ? 'Input file or output directory was not found.'
    : error.code && !error.code.startsWith('ERR_PARSE_ARGS') ? 'Could not read or write the file.'
    : error.code ? 'Invalid arguments. Run --help.' : error.message;
  console.error(`TraceVeil: ${message}`);
  process.exitCode = 2;
});
