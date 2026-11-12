import { redact } from './redact.mjs';
import { createSession } from './session.mjs';
import { markdownLog } from './share.mjs';

const $ = id => document.getElementById(id);
const limit = 8 * 1024 * 1024;
let language = navigator.language.startsWith('ja') ? 1 : 0;
let result = null, timer, job, workerUrl, fileRevision = 0;
let phase = 'idle';

const words = {
  skip: ['Skip to editor', '編集欄へ移動'], local: ['● ON YOUR DEVICE', '● この端末で処理'],
  eyebrow: ['FOR BUG REPORTS, TEAMMATES & AI', 'バグ報告・チームへの相談・AIへの質問に'],
  headline1: ['Share the trace.', 'ログの流れは、そのまま。'], headline2: ['Not the secrets.', '見せたくない値は、伏せる。'],
  intro: ['Make logs easier to share. Hide common sensitive values while keeping the relationships that help explain a bug.', '同じ値には、同じラベルを。メールや認証情報を伏せながら、不具合の調査に必要な関係性と改行を残します。'],
  trust1: ['No uploads', 'アップロード不要'], trust2: ['No account', '登録不要'], trust3: ['Open source', 'ソース公開可能'],
  exampleTitle: ['SAME PERSON. SAME LABEL.', '同じ人には、同じラベル。'],
  exampleNote: ['Keep the context. Remove the identifying value.', '経緯を残して、個人を特定する値を伏せる。'],
  sample: ['Try an example', 'サンプルを試す'], file: ['Open file', 'ファイルを開く'], clear: ['Clear all', 'すべて消去'],
  dropHint: ['Paste or drop a UTF-8 text file · up to 8 MiB', '貼り付け・UTF-8ファイルをドロップ · 8 MiBまで'],
  inputLabel: ['01 / ORIGINAL LOG', '01 / 元のログ'], outputLabel: ['02 / READY TO REVIEW', '02 / 結果を確認'],
  inputPlaceholder: ['Paste a log here, or try the example above.', 'ログを貼り付けるか、上のサンプルで試してください。'],
  outputPlaceholder: ['Your redacted log will appear here.', '伏せ字にしたログがここに表示されます。'],
  copy: ['Copy result', '結果をコピー'], markdown: ['Copy for GitHub', 'GitHub用にコピー'], download: ['Save .txt', '.txtを保存'],
  customTitle: ['Also hide a name, hostname, or project identifier', '名前・ホスト名・プロジェクト名も伏せたいとき'],
  customHelp: ['One exact value per line. Case-sensitive; 2–256 characters each, up to 32 values. Stays in memory only.', '1行に1つ、伏せたい値を入力。大文字と小文字を区別し、各2〜256文字・32個まで。保存されません。'],
  customLabel: ['Additional values to hide', '追加で伏せる値'],
  reviewTitle: ['One last look before sharing.', '共有する前に、最後の確認を。'],
  reviewBody: ['This catches known patterns, not every secret. Review the result. Repeated labels preserve equality; they are not cryptographic anonymization.', '既知の形式を検出する仕組みです。すべての秘密情報を見つけるものではありません。同じラベルから値の一致は分かるため、暗号学的な匿名化ではありません。'],
  howTitle: ['Three steps. No setup.', '準備なしで、3ステップ。'],
  step1: ['Paste a log or open a text file.', 'ログを貼り付けるか、ファイルを開く。'],
  step2: ['Review the result; add custom values if needed.', '結果を確認し、必要なら伏せたい値を追加。'],
  step3: ['Copy it into your issue, chat, or AI prompt.', 'Issue・チャット・AIへの質問にコピー。'],
  detectTitle: ['What gets redacted?', '何を伏せられますか？'],
  detectBody: ['Common ASCII emails, IPv4, secret assignments, Bearer/Basic values, selected tokens, URL credentials, and complete PEM private keys. IPv6, cookies, paths, names, and custom formats are not covered automatically; add exact values above. False positives are possible.', '一般的なメール、IPv4、秘密情報の代入、Bearer/Basic認証、一部のトークン、URLの認証情報、完全なPEM秘密鍵。IPv6・Cookie・パス・名前・独自形式は自動検出の対象外なので、必要な値を追加してください。誤検出もあります。'],
  privacyTitle: ['Where does my text go?', '入力した内容はどこへ行きますか？'],
  privacyBody: ['Redaction happens in this browser. The tool makes no log uploads and uses no analytics or persistent text storage. Clear all removes text and custom values from the interface. Your clipboard and downloaded files remain under your control.', 'このブラウザ内で処理します。ログのアップロード・アクセス解析・入力の永続保存は行いません。「すべて消去」で元のログと追加値を画面から消します。コピー済みの内容や保存ファイルは端末に残ります。'],
  footer: ['Small enough to inspect. Free to self-host.', '読み解ける小ささ。自分の環境でも使えます。'],
  idle: ['Waiting for a log', 'ログの入力待ち'], busy: ['Processing…', '処理中…'], ready: ['Ready to review', '確認できます'],
  noMatches: ['No supported patterns found. Review the result.', '対応する形式は見つかりませんでした。内容を確認してください。'],
  tooLarge: ['Input exceeds 8 MiB.', '入力は8 MiB以内にしてください。'],
  failure: ['Could not process. Check custom values: up to 32 lines, 2–256 characters each.', '処理できませんでした。追加値は各2〜256文字、32行以内にしてください。'],
  badFile: ['Choose one UTF-8 text file, up to 8 MiB.', '8 MiB以内のUTF-8テキストファイルを1つ選んでください。'],
  copied: ['Copied. Review before sharing.', 'コピーしました。共有前に内容を確認してください。'],
  saved: ['File saved through your browser.', 'ブラウザからファイルを保存しました。'],
  cleared: ['Log and custom values cleared.', 'ログと追加値を消去しました。'],
  manualCopy: ['Select the text and copy it manually.', '文字列を選択して、手動でコピーしてください。'], close: ['Close', '閉じる'],
};
const names = {
  SECRET: ['secrets', '認証値'], TOKEN: ['tokens', 'トークン'], EMAIL: ['emails', 'メール'],
  IP: ['IP addresses', 'IP'], CREDENTIAL: ['URL credentials', 'URL認証'], PRIVATE_KEY: ['private keys', '秘密鍵'], CUSTOM: ['custom values', '追加値'],
};
const t = key => words[key][language];
function message(key) { $('message').textContent = key ? t(key) : ''; }
function setPhase(value) { phase = value; $('state').textContent = t(value); }
function setActions(enabled) { for (const id of ['copy', 'markdown', 'download']) $(id).disabled = !enabled; }
function paintSummary() {
  $('summary').textContent = result ? (result.total ? Object.entries(result.counts)
    .map(([kind, count]) => `${names[kind][language]} ${count}`).join(' · ') : t('noMatches')) : '';
}

function cancelJob() {
  if (job) { job.worker.terminate(); job.reject(new Error('Cancelled')); job = null; }
}
function run(text, options) {
  if (!globalThis.Worker) return Promise.resolve(redact(text, options));
  if (!workerUrl) {
    const code = `${redact.toString()}\nonmessage=({data})=>{try{postMessage({result:redact(data.text,data.options)})}catch{postMessage({error:true})}};`;
    workerUrl = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
  }
  return new Promise((resolve, reject) => {
    let worker;
    try { worker = new Worker(workerUrl); }
    catch { resolve(redact(text, options)); return; }
    job = { worker, reject };
    worker.onmessage = ({ data }) => {
      worker.terminate(); if (job?.worker === worker) job = null;
      if (data.error) reject(new Error('Processing failed')); else resolve(data.result);
    };
    worker.onerror = event => {
      event.preventDefault(); worker.terminate(); if (job?.worker === worker) job = null;
      reject(new Error('Processing failed'));
    };
    worker.postMessage({ text, options });
  });
}
const session = createSession(run, value => {
  result = value; $('output').value = value.text;
  setPhase('ready'); setActions(true); paintSummary();
}, () => { setPhase('idle'); message('failure'); });

function invalidate() {
  session.invalidate(); cancelJob(); clearTimeout(timer);
  result = null; $('output').value = ''; setActions(false); paintSummary();
}
function processInput() {
  invalidate(); message('');
  const text = $('input').value;
  const size = new TextEncoder().encode(text).length;
  $('size').textContent = `${size.toLocaleString()} B`;
  if (size > limit) { setPhase('idle'); message('tooLarge'); return; }
  if (!text) { setPhase('idle'); return; }
  setPhase('busy');
  timer = setTimeout(() => {
    const literals = $('literals').value.split(/\r\n|\n|\r/).filter(value => value.length);
    session.submit(text, { literals });
  }, 180);
}
function edit() { fileRevision++; processInput(); }
async function openFile(file) {
  if (!file || file.size > limit) { message('badFile'); return; }
  const ticket = ++fileRevision;
  invalidate(); setPhase('busy'); message('');
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
    if (ticket !== fileRevision) return;
    $('input').value = text; processInput();
  } catch { if (ticket === fileRevision) { setPhase('idle'); message('badFile'); } }
}

$('input').addEventListener('input', edit);
$('literals').addEventListener('input', edit);
$('sample').onclick = () => {
  $('input').value = 'INFO alice@example.test connected from 192.168.1.12\nDEBUG API_KEY="fictional-value-only"\nDEBUG Authorization: Bearer fictional-value-only\nERROR Login failed for alice@example.test\n  at authenticate (src/auth.js:42:7)\nINFO bob@example.test connected from 192.168.1.12';
  edit();
};
$('clear').onclick = () => {
  fileRevision++; invalidate();
  $('input').value = $('literals').value = $('file').value = $('copy-text').value = '';
  $('copy-dialog').close(); $('size').textContent = '0 B'; setPhase('idle'); message('cleared'); $('input').focus();
};
$('file').onchange = () => { openFile($('file').files[0]); $('file').value = ''; };
document.addEventListener('dragover', event => {
  if ([...event.dataTransfer.types].includes('Files')) { event.preventDefault(); document.body.classList.add('dragging'); }
});
document.addEventListener('dragleave', event => { if (!event.relatedTarget) document.body.classList.remove('dragging'); });
document.addEventListener('drop', event => {
  document.body.classList.remove('dragging');
  if (!event.dataTransfer.files.length) return;
  event.preventDefault();
  if (event.dataTransfer.files.length !== 1) message('badFile'); else openFile(event.dataTransfer.files[0]);
});
async function copy(markdown = false) {
  if (!result) return;
  const isCurrent = session.snapshot();
  const text = markdown ? markdownLog(result.text) : result.text;
  try { await navigator.clipboard.writeText(text); if (isCurrent()) message('copied'); }
  catch {
    if (!isCurrent()) return;
    $('copy-text').value = text; $('copy-dialog').showModal(); $('copy-text').focus(); $('copy-text').select();
  }
}
$('copy').onclick = () => copy();
$('markdown').onclick = () => copy(true);
$('close-dialog').onclick = () => $('copy-dialog').close();
$('copy-dialog').addEventListener('close', () => { $('copy-text').value = ''; });
$('download').onclick = () => {
  if (!result) return;
  const url = URL.createObjectURL(new Blob([result.text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = 'traceveil-redacted.txt'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000); message('saved');
};
function translate() {
  document.documentElement.lang = language ? 'ja' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = t(node.dataset.i18n); });
  $('language').textContent = language ? 'English' : '日本語';
  $('input').placeholder = t('inputPlaceholder'); $('output').placeholder = t('outputPlaceholder');
  $('file').setAttribute('aria-label', t('file')); setPhase(phase); paintSummary(); message('');
}
$('language').onclick = () => { language = 1 - language; translate(); };
window.addEventListener('pagehide', () => { session.invalidate(); cancelJob(); if (workerUrl) URL.revokeObjectURL(workerUrl); workerUrl = undefined; });
translate();
