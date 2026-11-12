# Changelog

## 0.2.0 — 2026-11-12

- Portable single-file browser build; no Node installation for browser users.
- Redesigned responsive English/Japanese UI with automatic language and light/dark appearance.
- Exact custom redactions for names, hosts, and project identifiers.
- Background worker, stale-result protection, and cancellation on clear.
- GitHub-ready Markdown copy, clipboard fallback, and file drop.
- Deterministic standard-library build, opt-in Pages workflow, issue templates, publishing and launch guidance.
- Existing CLI commands and supported automatic detection patterns preserved.
- Overlapping custom/automatic matches mask the requested span completely; pending clipboard fallbacks cannot restore text after clear.

## 0.1.0 — 2026-11-10

- Initial zero-dependency browser and CLI tool.
- Consistent labels, newline preservation, supported credentials/emails/IPs, Markdown-free text output, and automated tests.
