# ◒ TraceVeil

### Share the trace. Not the secrets.

**Prepare logs for GitHub issues, teammates, and AI — locally, without an account.**

[日本語](README.ja.md) · [Detection limits](#what-it-catches) · [CLI](#terminal-and-library) · [Publish a demo](docs/PUBLISHING.md) · [Release notes](CHANGELOG.md)

```diff
- alice@example.test failed from 192.168.1.12
- Authorization: Bearer fictional-value
- alice@example.test retried
+ [EMAIL_1] failed from [IP_1]
+ Authorization: Bearer [SECRET_1]
+ [EMAIL_1] retried
    at authenticate (src/auth.js:42:7)
```

The same value gets the same label within a category. You can still follow a retry, a user, or a client through the log. Original line breaks remain intact.

## Try it in 30 seconds

**No Node installation for the portable browser version.**

1. Open `dist/TraceVeil.html` from the release ZIP in a modern browser.
2. Click **Try an example**, or paste your own UTF-8 log.
3. Review the result. Add names or hostnames under **Also hide…** if needed.
4. **Copy result**, **Copy for GitHub**, or **Save .txt**.

The portable HTML contains all its code and styles. It needs no account, backend, CDN, or log upload. A hosted demo still needs a first page load; download the HTML if you want a local copy. Text and custom values stay in memory. No analytics, persistent text storage, or telemetry.

**Working from a source checkout?** Install [Node.js 24+](https://nodejs.org/en/download), then:

```sh
node cli.mjs --web       # local browser interface
node scripts/build.mjs  # generate dist/TraceVeil.html + a Pages-ready index
```

No `npm install`. On Windows, `start.cmd` also starts the local interface.

## Useful in everyday work

| When | What to do |
| --- | --- |
| Filing a GitHub issue | Paste the log, review it, then use **Copy for GitHub** for a correctly fenced code block. |
| Asking an AI about a stack trace | Keep file/line information while masking supported credentials and identifiers. |
| Sharing a customer-support log | Add specific customer names or internal hostnames as exact custom values, then review. |
| Checking a log in a script | Use `--check`; get counts and an exit code without printing the log. |

Browser features: English/Japanese chosen from your browser language, light/dark mode, file picker/drop, live category counts, background-worker processing, stale-result protection, and clipboard fallback. No log text is placed into HTML markup.

### Additional values

Enter one exact value per line. Matching is case-sensitive; use2–256 Unicode code points each, up to32 values. Duplicates are ignored and overlapping literal matches are combined. Both automatic and custom detectors read the original input. A custom span that overlaps an automatic match masks their combined span, so a requested value is hidden fully without exposing part of a credential. Existing generated labels are left intact. Counts describe the resulting redacted spans, not all overlapping detector hits. Custom values must be a single line. This is literal matching, not a regular expression or a general name detector.

**Clear all** clears the log and additional values in the interface and cancels its processing. Previously copied text, downloaded files, and browser-managed history are not erased.

## Terminal and library

Node.js 24+; no dependencies or build step for the CLI:

```sh
node cli.mjs examples/debug.log
node cli.mjs debug.log --output redacted.log
node cli.mjs --check debug.log
cat debug.log | node cli.mjs > redacted.log
node cli.mjs --help
```

For PowerShell, prefer `--output` over `>` to avoid shell-specific output encodings. Input must be UTF-8, up to8 MiB. Existing output files are never overwritten, and source files are never edited. The CLI summary contains counts, not matched values.

| Code | Meaning |
| --- | --- |
| `0` | Completed, or `--check` found no supported patterns |
| `1` | `--check` found a supported pattern; stdout is empty |
| `2` | Invalid arguments, input, or file operation |

```js
import { redact } from './redact.mjs';

const { text, counts, total } = redact(
  'customer=Project-A email=alice@example.test',
  { literals: ['Project-A'] },
);
// customer=[CUSTOM_1] email=[EMAIL_1]
```

Custom values are available in the browser and library; the CLI keeps its small automatic-pattern interface. Nothing calls an AI service.

## What it catches

- Common ASCII email addresses and IPv4 addresses.
- Single-line `API_KEY`, `password`, `token`, `client_secret`, and related assignments, with underscore/hyphen prefixes up to121 characters; quoted values support escaped quotes.
- Bearer/Basic values; selected GitHub/OpenAI-style token, AWS access-key-ID, and JWT formats.
- URL user information and complete standard PEM private-key blocks.
- Optional exact custom values.

**This is a focused log helper, not a complete secret scanner. Always review the output.** IPv6, cookies, home paths, names, addresses, Unicode emails, arbitrary custom formats, encoded values, and malformed/multiline secrets are not comprehensively detected. A version number may look like an IPv4 address. Unquoted assignments end at whitespace or common separators. Labels preserve equality within the same category and exact representation, not across sessions or encodings; they are not cryptographic anonymization. The tool does not revoke leaked credentials or secure your original file, clipboard, or saved output.

Use a dedicated secret scanner for repository audits. TraceVeil focuses on a short, inspectable engine and everyday log sharing, with no claims of first-of-its-kind detection or guaranteed safety.

## Small, inspectable sources

| File | Responsibility |
| --- | --- |
| `redact.mjs` | Pure shared engine; automatic rules and optional literal values |
| `app.mjs`, `index.html`, `style.css` | Browser UI; same engine in a Blob worker |
| `session.mjs` | Only the newest asynchronous result can be shown |
| `share.mjs` | Markdown fences that cannot be closed by backticks inside a log |
| `cli.mjs` | UTF-8 stdin/files, exclusive output, check mode, local preview |
| `scripts/build.mjs` | Deterministic, dependency-free portable HTML build |

If Web Workers are unavailable, processing falls back to the main thread. Browser clipboard restrictions fall back to a selectable copy dialog. Generated portable code is exactly the same engine, not a second implementation.

## Development and publication

```sh
node --test
node scripts/build.mjs
```

CI is configured for Node 24/26 on Linux, macOS, and Windows. The release was locally verified on Windows with Node 24 and the embedded Chromium browser. Portable HTML was tested over local HTTP; direct `file://` navigation is blocked by the automated browser's policy and was not verified in that environment. Test your target browsers before advertising broader compatibility.

See [publishing instructions](docs/PUBLISHING.md) for release assets and the opt-in GitHub Pages workflow. Uploading sources alone does not publish the demo: Pages needs to be enabled and the workflow run manually. No GitHub owner, repository URL, stars, or deployment success is invented in these files. The package stays `private` to prevent accidental npm publication.

Help improve this: report a fictional missed example or confusing workflow using the issue templates. See [CONTRIBUTING](CONTRIBUTING.md), [security notes](SECURITY.md), and the [launch kit](docs/LAUNCH.md). MIT licensed.
