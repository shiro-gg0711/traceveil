# Launch kit

Draft material only. Replace “demo/release link” with actual verified URLs after publication. Nothing in this file is sent automatically.

## GitHub short description

Local log redaction for GitHub issues and AI. Keep repeated identities, hide supported secrets. Portable browser UI + zero-dependency CLI.

## English announcement

I built TraceVeil for the moment before you paste a log into a GitHub issue or an AI chat.

It replaces supported emails, credentials, and identifiers with consistent labels, so you can still follow the same user or retry through the log. You can add exact names and hostnames too.

The browser version is a single HTML file: no account, log upload, or runtime dependencies. There is also a small CLI for files and pipelines. It's MIT licensed and uses one shared engine.

It's not a complete secret scanner; review the result before sharing. I'd like feedback on one thing: which part of preparing a log is still inconvenient?

Demo/release link: add after publication.

## 日本語の紹介文

GitHubのIssueやAIへの質問にログを貼る前に使う「TraceVeil」を作りました。

対応するメールアドレスや認証情報を伏せながら、同じ値には同じラベルを付けます。誰が再試行したかなど、調査に必要な流れを残せます。社名やホスト名は、伏せたい値として追加できます。

ブラウザ版は単体HTMLで、登録・ログのアップロードは不要です。ファイルやパイプで使えるCLIもあり、外部依存ゼロ・MITライセンスです。

すべての秘密情報を検出するものではないので、共有前の確認は必要です。「ログを共有する前の作業」で、まだ面倒な点があれば教えてください。

デモ・ダウンロード：公開後に実際のリンクを記載。

## 20-second demo

1. Start with an empty editor; click Try an example.
2. Point out that both occurrences of the same email become EMAIL_1.
3. Add a fictional internal hostname under Also hide.
4. Copy for GitHub and show the redacted fenced block.
5. Clear all. End with the actual release link and a request for specific feedback.

Use a real screenshot of the finished UI. Do not invent user counts or before/after time savings.
