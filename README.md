# InKraft

GitHub と Markdown をベースにした、軽量な Git-based CMS です。

> UI は日本語向けです。

## Overview

-   Markdown + frontmatter の記事を GitHub リポジトリで管理
-   CMS リポジトリとコンテンツリポジトリを分離
-   GitHub OAuth でログインし、許可ユーザーだけが CMS を操作
-   Better Auth による認証
-   複数コンテンツタイプ対応（例: `posts`, `scraps`）
-   メタデータは各コンテンツディレクトリの `index.json` にキャッシュ
-   Markdown エディタ、プレビュー、画像アップロード
-   ダッシュボード、最近の記事、コンテンツアクティビティ表示
-   AI による記事テンプレート生成
-   Vercel デプロイ向け

## Version

Current major version: `2.x`

v2 では以下を含みます。

-   NextAuth から Better Auth へ移行
-   `BETTER_AUTH_*` 系 env を追加しつつ、旧 `AUTH_*` / `NEXTAUTH_*` env 互換を維持
-   CMS の noindex 対応
-   CI 追加
-   UI/UX リフレッシュ
-   OpenAI / Google Vertex AI のテンプレート生成 provider 切り替え

## Requirements

-   Node.js 24
-   GitHub OAuth App
-   CMS が操作する対象コンテンツリポジトリ
-   GitHub OAuth scope: `repo`

## Getting Started

1. Install dependencies

    ```bash
    npm install
    ```

2. Create local config files

    ```bash
    cp cms.config.example.json cms.config.json
    cp frontmatter.scheme.example.json frontmatter.scheme.json
    cp .env.example .env.local
    ```

3. Edit `.env.local`

    Required for auth:

    ```env
    BETTER_AUTH_SECRET=<32文字以上のランダム値>
    BETTER_AUTH_URL=http://localhost:3000
    GITHUB_CLIENT_ID=<github-oauth-client-id>
    GITHUB_CLIENT_SECRET=<github-oauth-client-secret>
    ALLOWED_USERS=login:your-github-login
    ```

    Generate a secret with:

    ```bash
    openssl rand -base64 32
    ```

4. Run the development server

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

### Auth

| Variable | Required | Description |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | Yes | Better Auth secret. Use a random value with at least 32 characters. |
| `BETTER_AUTH_URL` | Production recommended | Public app URL. Example: `https://cms.example.com`. |
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth App client ID. |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth App client secret. |
| `ALLOWED_USERS` | Yes | Comma-separated allow list. |
| `BETTER_AUTH_ALLOWED_HOSTS` | Optional | Dynamic host allow list for multi-host deployments. |

Legacy aliases are still supported:

-   `AUTH_SECRET`
-   `NEXTAUTH_SECRET`
-   `AUTH_GITHUB_ID`
-   `AUTH_GITHUB_SECRET`
-   `NEXTAUTH_URL`

Existing NextAuth sessions are not compatible with Better Auth sessions, so users may need to sign in again after upgrading to v2.

### Allowed Users

`ALLOWED_USERS` supports plain values and explicit prefixes:

```env
ALLOWED_USERS=login:your-github-login,email:you@example.com,id:123456,name:Display Name
```

Supported fields:

-   `login`
-   `email`
-   `id`
-   `name`

### AI Template Generation

InKraft can generate article templates through Google Vertex AI or OpenAI.

Default provider:

```env
AI_PROVIDER=google-vertex
GOOGLE_CREDENTIALS_JSON=<service-account-json>
GOOGLE_VERTEX_PROJECT_ID=<gcp-project-id>
GOOGLE_VERTEX_LOCATION=us-central1
GOOGLE_VERTEX_MODEL=gemini-2.5-flash
```

OpenAI provider:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=<openai-api-key>
OPENAI_MODEL=gpt-4.1-mini
```

`CONTENT_TEMPLATE_AI_PROVIDER` can also be used as an alias for `AI_PROVIDER`.

### Webhooks

```env
WEBHOOK_SECRET=<webhook-secret>
```

## Configuration

### `cms.config.json`

Example:

```json
{
    "targetRepository": "YOUR_GITHUB_USERNAME/YOUR_CONTENT_REPO",
    "branch": "main",
    "draftDirectory": "draft",
    "content": [
        {
            "directory": "posts",
            "articleFile": "index.md",
            "imageDirInsideContent": true
        },
        {
            "directory": "scraps",
            "articleFile": "index.md",
            "imageDirInsideContent": true
        }
    ],
    "webhooks": {
        "enabled": false,
        "endpoints": []
    }
}
```

Notes:

-   `targetRepository` must be `owner/repo`.
-   `imageDirInsideContent` should be `true`.
-   Metadata caches are stored at `<directory>/index.json`.
-   `draftDirectory` is optional.

### `frontmatter.scheme.json`

This file defines the editable frontmatter schema.

Example:

```json
[
    {
        "name": "title",
        "label": "タイトル",
        "type": "string",
        "multiple": false,
        "required": true,
        "description": "記事のタイトルです。"
    },
    {
        "name": "tags",
        "label": "タグ",
        "type": "string",
        "multiple": true,
        "required": false,
        "description": "タグは文字列の配列です。"
    },
    {
        "name": "date",
        "label": "投稿日",
        "type": "date",
        "format": "yyyy/MM/dd",
        "multiple": false,
        "required": true,
        "description": "記事の公開日を指定します。"
    }
]
```

Supported field types:

-   `string`
-   `date`
-   `boolean`

For multiple values, set `multiple: true` on a `string` field.

## Features

-   Create, edit, and delete Markdown articles
-   Click article titles to edit
-   GitHub-backed image uploads
-   Frontmatter form generated from schema
-   Mobile-friendly editor layout with collapsible metadata panels
-   AI article template generation
-   Dashboard with content activity, total content, update status, and recent articles
-   CMS pages are marked as noindex

## Deployment

Vercel is recommended.

1. Create a Vercel project
2. Set the environment variables above
3. Configure a GitHub OAuth App callback URL:

    ```text
    https://your-domain.example/api/auth/callback/github
    ```

4. Deploy

For production, set at least:

```env
BETTER_AUTH_SECRET=<32文字以上のランダム値>
BETTER_AUTH_URL=https://your-domain.example
GITHUB_CLIENT_ID=<github-oauth-client-id>
GITHUB_CLIENT_SECRET=<github-oauth-client-secret>
ALLOWED_USERS=login:your-github-login
```

If deploying to Vercel preview domains, `VERCEL_URL` is detected automatically. For custom multi-host setups, configure:

```env
BETTER_AUTH_ALLOWED_HOSTS=example.com,preview.example.com
```

## Development

```bash
npm run lint
npx tsc --noEmit
npm test -- --run
npm run build
```

CI runs lint, type check, tests, and build on pull requests to `main`.

## License

MIT License
