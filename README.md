# GeoWorld

地理クラブ（GeoWorld）は、国ボールと3Dワールドを楽しむブラウザー向けサンドボックスゲームです。Viteでビルドし、GitHub Pagesで静的サイトとして公開できます。

## ローカルで実行

Node.js 22以降を用意して、リポジトリのルートで実行します。

```sh
npm install
npm run dev
```

開発サーバーは通常 `http://localhost:3000` で起動します。型チェックは `npm run lint`、本番ビルドは `npm run build` です。

## GitHub Pagesへ公開

1. このプロジェクトを `geoworld` という名前のGitHubリポジトリにpushします。
2. GitHubリポジトリの **Settings → Pages → Build and deployment** を開き、Sourceを **GitHub Actions** に設定します。
3. `main` ブランチへpushすると、`.github/workflows/pages.yml` がビルドしてPagesへ自動デプロイします。

公開URLは通常 `https://<GitHubユーザー名>.github.io/geoworld/` です。GitHub Actions上ではViteのベースパスを `/geoworld/` に設定し、ローカル開発時は `/` を使用します。

## メモ

- このアプリはフロントエンド静的配信に対応しています。サーバー専用機能が含まれる場合、GitHub Pagesだけでは実行できません。
- APIキーなどの秘密情報をクライアントコードへ埋め込まないでください。GitHub Pagesのビルド成果物は公開されます。
