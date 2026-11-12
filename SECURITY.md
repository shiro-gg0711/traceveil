# Security and privacy

TraceVeil helps prepare a log for sharing; it does not certify that a log is safe to publish. Detection has false positives and false negatives. Review the output, and revoke any credentials already exposed elsewhere.

The browser performs processing in memory, normally in a worker, with a main-thread fallback if workers are unavailable. There is no log upload, analytics, or persistent text storage in application code. A hosted page still makes ordinary requests for its own code and styles. Use the portable HTML or self-host if you want control over the code you load. Clipboard, downloads, browser extensions, host integrity, and browser-managed data are outside this tool's control.

No user content is rendered as HTML. Custom replacements are literal and escaped before matching; generated labels are preserved. Read the exact supported formats in README.md.

Do not put real credentials, personal data, or private logs in issues. If the repository owner enables GitHub private vulnerability reporting, use that feature for security problems. Otherwise report a fictional minimal reproducer without active secrets. No monitored email address or response-time guarantee is implied by this file.
