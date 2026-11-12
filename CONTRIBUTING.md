# Contributing

Use Node.js 24 or newer. No installation step is needed. Run `node --test` before proposing a change.

Keep the shared redaction engine small and free of Node-specific imports so that the browser and CLI behave identically. Add a regression test with fictional input for each new detection rule. Preserve newline sequences and consistent labels; document false positives and unsupported cases.

Never submit real credentials, private keys, or personal logs. Describe detection issues using artificial examples. For private security reports, use the repository's GitHub private vulnerability reporting feature if enabled by its owner; otherwise do not disclose active secrets in an issue.

Contributions are licensed under the MIT license in this repository.
