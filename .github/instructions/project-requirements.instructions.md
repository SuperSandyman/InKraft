---
applyTo: '**'
---

# 自作 CMS 要件定義書

あくまでこの要件定義書はプロジェクトの概要程度のものであり、詳細な仕様は実装を進めながら決定されることに留意せよ。

## 概要

Markdown + GitHub ベースの軽量・拡張可能な CMS。
**リアルタイムプレビュー、画像アップロード、直書きスタイル重視、完全 json 設定管理**が特徴の OSS プロジェクト。
※ **記事リポジトリと CMS リポジトリは完全に分離**され、GitHub API で連携する。

---

## コンセプト

-   フロントエンドのみで完結可能な**GitHub 連携型 CMS**
-   複数のコンテンツタイプに対応（例：posts, scraps）
-   記事本文は Markdown + frontmatter、メタ情報は index.json に一元化
-   設定は全て `cms.config.json` に集約
-   編集は**WYSIWYG ではなく、直接 Markdown を書くスタイル**
-   **スマホ対応の装飾補助（ツールバー/ツールチップ）あり**
-   ホスティングは **Vercel** を使用

---

## 技術構成

### フロントエンド

-   **Next.js (App Router)**
-   **Tailwind CSS** + **shadcn/ui**
-   **Vitest** + **React Testing Library**（ユニットテスト、結合テスト）

### データ連携

-   GitHub REST API（基本操作）
-   GraphQL API（必要に応じて拡張）
-   GitHub OAuth（@auth/core）
-   `index.json` によるメタ情報キャッシュ（frontmatter から抽出）

### デプロイ・CI

-   CMS は **Vercel** にデプロイ
-   必要に応じて GitHub Actions で `index.json` の更新も対応

---

## cms.config.json（設定ファイル仕様例）

```json
{
    "targetRepository": "yourname/blog-content",
    "branch": "main",
    "draftDirectory": "_drafts",
    "content": [
        {
            "type": "posts",
            "directory": "posts",
            "articleFile": "article.md",
            "imageDirInsideContent": true,
            "metaCache": {
                "type": "json",
                "path": "posts/index.json"
            }
        },
        {
            "type": "scraps",
            "directory": "scraps",
            "draftDirectory": "_drafts_scraps",
            "articleFile": "article.md",
            "imageDirInsideContent": true,
            "metaCache": {
                "type": "json",
                "path": "scraps/index.json"
            }
        }
    ],
    "auth": {
        "provider": "github",
        "clientId": "YOUR_CLIENT_ID",
        "scopes": ["repo", "read:user"]
    },
    "editor": {
        "theme": "dark",
        "previewEnabled": true,
        "extensions": ["math", "diagram", "highlight"]
    },
    "meta": {
        "useTags": true,
        "useCategories": true,
        "allowCustomFields": true
    },
    "deploy": {
        "useGitHubActions": true,
        "outputDir": "dist"
    }
}
```

---

## 今後の拡張ポイント（メモ）

-   `cms-cli`：記事作成や index.json 更新用 CLI
-   画像 CDN 対応（Cloudflare Images / S3）
-   i18n・タグ検索・公開予約機能の追加
-   GraphQL API 化 or Headless 拡張
-   PR ベースの記事投稿ワークフロー
