# InKraft

A lightweight, extensible CMS based on Markdown and GitHub.

> **Note:** This CMS currently supports only Japanese UI.

## Overview

-   **Real-time Markdown preview**, image upload, direct editing (no WYSIWYG), and full JSON-based configuration.
-   Content and CMS repositories are completely separated; all content operations use the GitHub API.
-   Supports multiple content types (e.g., posts, scraps).
-   Article body: Markdown + frontmatter. Metadata is cached in `index.json`.
-   All settings are managed in `cms.config.json`.
-   Mobile-friendly UI with editing toolbar/tooltips.
-   Designed for deployment on Vercel.

## Getting Started

1. **Clone this repository**

2. **Install dependencies**

    ```bash
    npm install
    # or
    yarn install
    ```

3. **Create your configuration**

    Copy the example config and edit as needed:

    ```bash
    cp cms.config.example.json cms.config.json
    ```

    > **Note:** Only `"type": "json"` is supported for metaCache, and `imageDirInsideContent` must be `true`.

4. **(Optional) Set up environment variables**  
   See `.env.example` if provided.

5. **Run the development server**

    ```bash
    npm run dev
    # or
    yarn dev
    ```

    Open [http://localhost:3000](http://localhost:3000) in your browser.

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
            "imageDirInsideContent": true,
            "metaCache": {
                "type": "json",
                "path": "posts/index.json"
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

-   Only `"type": "json"` is supported for `metaCache`.
-   `imageDirInsideContent` must be `true`.

### `frontmatter.scheme.json`

This file defines the schema for frontmatter fields in your articles.  
Example (`frontmatter.scheme.example.json`):

```json
[
    {
        "name": "title",
        "label": "タイトル",
        "type": "string",
        "multiple": false,
        "required": true,
        "description": "記事のタイトルです。1行の文字列として記述します。"
    },
    {
        "name": "tags",
        "label": "タグ",
        "type": "string",
        "multiple": true,
        "required": false,
        "description": "タグは文字列の配列です。省略可能。"
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

-   Each object describes a frontmatter field (name, type, required, etc).
-   Use this to enforce consistent metadata in your Markdown articles.

## Features

-   Create, edit, and delete Markdown articles (with GitHub integration)
-   Image upload (stored in your GitHub repo)
-   Metadata caching in `index.json`
-   AI-powered article template generation, translation, and summary (Japanese only)
-   Dashboard: Hacker News card, recent articles, GitHub heatmap, and more
-   Mobile-friendly UI/UX

## Deployment

Vercel is recommended.

1. Create a new Vercel project
2. Set up environment variables and `cms.config.json`
3. Enable GitHub OAuth

## Contribution

-   Issues and Pull Requests are welcome!
-   Please see `.github/instructions/` for coding conventions and requirements.
-   New features, bug fixes, and documentation improvements are appreciated.

## License

MIT License

---

**Note:** This CMS currently supports only Japanese content and UI.  
If you need English support, please open an issue or contribute!
