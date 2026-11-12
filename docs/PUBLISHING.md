# Publish TraceVeil / 公開手順

## 1. Put the source on GitHub

Create a repository and upload this folder's source files, including `.github`, `.gitignore`, LICENSE, and both READMEs. Use GitHub Desktop or Git. Do not upload your real logs. The sample log contains fictional values only.

Suggested repository description:

> Local log redaction for GitHub issues and AI. Consistent labels, a portable browser UI, and a zero-dependency CLI.

Suggested topics: `log-redaction`, `privacy`, `developer-tools`, `local-first`, `javascript`, `zero-dependencies`.

Run `node --test` and `node scripts/build.mjs`. After pushing, inspect the GitHub Actions test results; the included matrix is configuration, not proof that all platforms pass.

## 2. Make the easiest download visible

Create a GitHub Release for `v0.2.0`. Attach `dist/TraceVeil.html` (generated with the build command) as an individual asset, and attach a source ZIP if useful. Put the actual asset link near the top of the README after the release exists. Do not use a guessed URL.

The HTML asset is the fastest path for users who do not have Node. To test: download it to a fresh folder, open it in the target browsers, try sample/custom redaction/copy/download/clear, and inspect network activity. Automated checks in this environment verified the standalone document via HTTP; file-protocol browser testing was blocked by automation policy.

## 3. Optional public browser demo

In repository **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source. Then open **Actions → Publish browser demo → Run workflow** from the default branch. The included workflow tests, builds `dist`, and publishes that artifact. It does not run automatically on every push or pull request.

Use the URL returned by the successful deployment as the README's actual “Try online” link and the repository Website field. Updating the demo requires running the workflow again. Pages availability depends on the repository/account settings. See [GitHub's official workflow guide](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

The demo makes the tool discoverable; the portable download lets users keep a local copy. Never promise that a hosted page makes no requests at all: loading a website still requests its assets.

## 4. Gather real feedback

Share the real demo and release links with developers who file bug reports or ask AI about logs. Ask whether one specific log-sharing task got easier. Use only fictional examples in public. See LAUNCH.md for ready-to-edit English/Japanese copy.

Track the failures people actually report: confusing startup, useful missed formats, excessive false positives, copy failures, or slow input. Improve those before adding integrations or claiming broad adoption. No testimonials, star counts, user counts, or compatibility guarantees are prefilled.

## 日本語メモ

1. ソース一式をGitHubへ投稿し、Actionsのテスト結果を確認。
2. Releaseを作り、生成した `TraceVeil.html` を添付。実在するダウンロードリンクをREADME上部に追加。
3. 必要ならPagesのSourceをGitHub Actionsにし、手動ワークフローでデモを公開。成功後に返されたURLを使う。
4. 公開前に対象ブラウザで直接HTMLを開いて確認。告知は実際のリンクと、架空ログの例を使う。

The original project is published at [GitHub](https://github.com/shiro-gg0711/traceveil) with its [live demo](https://shiro-gg0711.github.io/traceveil/). The instructions above also apply to a fork; substitute your own actual repository and deployment URLs. The local build does not publish anything automatically.
