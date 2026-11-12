export function markdownLog(text) {
  let width = 3;
  for (const match of text.matchAll(/`+/g)) width = Math.max(width, match[0].length + 1);
  const fence = '`'.repeat(width);
  return `${fence}text\n${text}${text.endsWith('\n') ? '' : '\n'}${fence}`;
}
