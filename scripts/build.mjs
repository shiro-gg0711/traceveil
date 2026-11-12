import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);
export async function buildPage() {
  const names = ['index.html', 'style.css', 'redact.mjs', 'session.mjs', 'share.mjs', 'app.mjs'];
  const [html, css, engine, session, share, app] = await Promise.all(
    names.map(name => readFile(new URL(name, root), 'utf8')));
  const script = [engine, session, share, app.replace(/^import .+;\r?\n/gm, '')]
    .join('\n').replace(/^export /gm, '').replace(/<\/script/gi, '<\\/script');
  return html.replace('<link rel="stylesheet" href="style.css">', () => `<style>\n${css}\n</style>`)
    .replace('<script type="module" src="app.mjs"></script>', () => `<script type="module">\n${script}\n</script>`);
}

export async function build() {
  const html = await buildPage();
  const dist = new URL('dist/', root);
  await mkdir(dist, { recursive: true });
  await Promise.all(['index.html', 'TraceVeil.html'].map(name => writeFile(new URL(name, dist), html)));
  await writeFile(new URL('.nojekyll', dist), '');
  console.log(`Built portable TraceVeil.html (${Buffer.byteLength(html).toLocaleString()} bytes)`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await build();
