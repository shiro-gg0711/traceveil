/** Pure local transformation. All detectors read the original text before replacement. */
export function redact(text, { literals = [] } = {}) {
  if (!Array.isArray(literals) || literals.length > 32 || literals.some(value =>
    typeof value !== 'string' || [...value].length < 2 || [...value].length > 256 || /[\r\n]/.test(value))) {
    throw new Error('Invalid literal redactions: use up to 32 single-line values of 2–256 characters.');
  }
  const spans = [];
  const add = (start, end, kind) => { if (end > start) spans.push({ start, end, kind }); };
  const whole = (pattern, kind) => {
    for (const match of text.matchAll(pattern)) add(match.index, match.index + match[0].length, kind);
  };

  // Read PEM markers once; repeated incomplete blocks must not rescan the tail.
  let begin;
  for (const marker of text.matchAll(/-----(BEGIN|END) ([A-Z ]{0,40}PRIVATE KEY)-----/g)) {
    if (marker[1] === 'BEGIN') begin = marker;
    else if (begin && begin[2] === marker[2]) {
      add(begin.index, marker.index + marker[0].length, 'PRIVATE_KEY'); begin = undefined;
    }
  }

  // Bound key prefixes, and scan values without a potentially unbounded regex stack.
  const names = '(?:[A-Z0-9_-]{1,120}[_-])?(?:api[_-]?key|access[_-]?token|refresh[_-]?token|token|password|passwd|secret|client[_-]?secret)';
  const assignment = new RegExp(String.raw`(?<![A-Z0-9_-])${names}["']?[\t ]*[:=][\t ]*`, 'gi');
  while (assignment.exec(text)) {
    const first = assignment.lastIndex;
    const quote = text[first] === '"' || text[first] === "'" ? text[first] : '';
    const start = first + quote.length;
    let end = start;
    while (end < text.length && text[end] !== '\r' && text[end] !== '\n') {
      if (quote ? text[end] === quote : /[\s,;"'}]/.test(text[end])) break;
      if (quote && text[end] === '\\' && end + 1 < text.length && !/[\r\n]/.test(text[end + 1])) end++;
      end++;
    }
    assignment.lastIndex = end;
    if (!quote || text[end] === quote) add(start, end, 'SECRET');
  }
  for (const match of text.matchAll(/(\b(?:Bearer|Basic)[\t ]+)([\w.~+/=-]+)/gi)) {
    add(match.index + match[1].length, match.index + match[0].length, 'SECRET');
  }
  whole(/\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-(?:proj-)?[A-Za-z0-9_-]{20,}|AKIA[A-Z0-9]{16}|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/g, 'TOKEN');
  for (const match of text.matchAll(/((?<![a-z0-9+.-])[a-z][a-z0-9+.-]*:\/\/)([^\s/@]+)@/gi)) {
    add(match.index + match[1].length, match.index + match[1].length + match[2].length, 'CREDENTIAL');
  }
  whole(/(?<![A-Z0-9.!#$%&'*+/?^_`{|}~-])[A-Z0-9.!#$%&'*+/?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9.-]*[A-Z0-9])?\.[A-Z]{2,}\b/gi, 'EMAIL');
  for (const match of text.matchAll(/(?<![\w.])(?:\d{1,3}\.){3}\d{1,3}(?![\w.])/g)) {
    if (match[0].split('.').every(part => +part <= 255)) add(match.index, match.index + match[0].length, 'IP');
  }
  for (const value of new Set(literals)) {
    let pending;
    for (let start = text.indexOf(value); start !== -1; start = text.indexOf(value, start + 1)) {
      const end = start + value.length;
      if (pending && start < pending.end) pending.end = end;
      else {
        if (pending) spans.push(pending);
        pending = { start, end, kind: 'CUSTOM' };
      }
    }
    if (pending) spans.push(pending);
  }

  const markers = [...text.matchAll(/\[(?:SECRET|TOKEN|EMAIL|IP|CREDENTIAL|PRIVATE_KEY|CUSTOM)_\d+\]/g)]
    .map(match => ({ start: match.index, end: match.index + match[0].length }));
  const priority = { CUSTOM: 0, PRIVATE_KEY: 1, SECRET: 2, TOKEN: 3, CREDENTIAL: 4, EMAIL: 5, IP: 6 };
  const merged = [];
  let markerIndex = 0;
  for (const span of spans.sort((a, b) => a.start - b.start || b.end - a.end)) {
    while (markers[markerIndex]?.end <= span.start) markerIndex++;
    const marker = markers[markerIndex];
    if (marker && (span.kind === 'CUSTOM' ? marker.start < span.end
      : marker.start === span.start && marker.end === span.end)) continue;
    const previous = merged.at(-1);
    if (previous && span.start < previous.end) {
      // An email inside URL userinfo must not expand the credential into its host.
      // Explicit custom spans do expand overlaps, so the requested value is hidden fully.
      const wins = priority[span.kind] < priority[previous.kind];
      if (wins || previous.kind === 'CUSTOM' || span.kind === 'CUSTOM') previous.end = Math.max(previous.end, span.end);
      if (wins) previous.kind = span.kind;
    } else merged.push({ ...span });
  }

  const labels = new Map(), unique = {}, counts = {}, output = [];
  let copied = 0;
  for (const { start, end, kind } of merged) {
    const value = text.slice(start, end), key = `${kind}:${value}`;
    if (!labels.has(key)) {
      unique[kind] = (unique[kind] || 0) + 1;
      labels.set(key, `[${kind}_${unique[kind]}]`);
    }
    counts[kind] = (counts[kind] || 0) + 1;
    output.push(text.slice(copied, start), labels.get(key), (value.match(/\r\n|\r|\n/g) || []).join(''));
    copied = end;
  }
  return { text: output.join('') + text.slice(copied), counts, total: merged.length };
}
