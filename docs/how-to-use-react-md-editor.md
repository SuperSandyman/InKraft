承知しました。Next.js 最新バージョン（App Router）を使い、TypeScript 環境下で `@uiw/react-md-editor` と `@uiw/react-markdown-preview` を組み込み、さらに画像をドラッグ＆ドロップで挿入・GitHub API を用いてアップロードできるようにする実装方法を詳細に調査します。

実装には、エディタの導入方法、画像アップロード機能の拡張、GitHub API を使ったアップロードの方法、エディタ出力の取得方法までを網羅してまとめます。

調査が完了しましたらお知らせいたします。少々お待ちください。

# Next.js App Router での`@uiw/react-md-editor`と`@uiw/react-markdown-preview`統合ガイド

## ステップ 1: ライブラリのインストールと Next.js 設定

まず、必要なパッケージをインストールします。以下のコマンドで Markdown エディタとプレビュー用のライブラリ、および関連パッケージを追加します。

```bash
npm install @uiw/react-md-editor @uiw/react-markdown-preview react-markdown
```

> **メモ:** `react-markdown`はプレビューコンポーネントの内部で使用されるため必要です。

次に、**グローバル CSS の設定**を行います。`@uiw/react-md-editor`と`@uiw/react-markdown-preview`には GitHub 風のスタイル用 CSS が含まれているため、それをプロジェクトに読み込む必要があります。しかし、Next.js（特に 14+）では**node_modules 内のグローバル CSS を直接インポートできない**制約があります。そこで以下の方法があります:

-   **方法 ①:** Next.js のビルド設定にプラグインを導入する。具体的には、[`next-remove-imports`](https://www.npmjs.com/package/next-remove-imports)を使う方法です。インストール後、`next.config.js`に以下を追記します。これにより、パッケージ内部の CSS インポートエラーを回避できます。

    ```js
    // next.config.js
    const removeImports = require('next-remove-imports')();
    module.exports = removeImports({
        // オプション設定（必要に応じて）
    });
    ```

-   **方法 ②:** CSS をグローバルに読み込む。他の方法として、ライブラリ付属の CSS ファイルを**手動でインポート**します。たとえば、Next.js の App ディレクトリで`app/layout.tsx`やグローバルの CSS ファイルに以下を追加します（または、コンポーネント内で動的インポートします）。

    ```tsx
    import '@uiw/react-md-editor/markdown-editor.css';
    import '@uiw/react-markdown-preview/markdown.css';
    ```

    > **注:** 上記 CSS インポートは**グローバルスタイル**として適用されます。App Router では`layout.tsx`内で global CSS をインポートできますが、エラーになる場合は方法 ① のプラグイン使用を検討してください。

さらに、**SSR（サーバーサイドレンダリング）対策**として、エディタコンポーネントを動的に読み込む設定をします。`@uiw/react-md-editor`はブラウザ環境でのみ動作するため、Next.js のサーバーコンポーネントとして直接読み込もうとするとエラーになる可能性があります。これを防ぐために、Next.js の動的インポート機能を使って**クライアントサイドでのみ**ロードするようにします。例えば以下のように記述します:

```tsx
import dynamic from 'next/dynamic';
// ... （他のimport）
const MDEditor = dynamic(() => import('@uiw/react-md-editor').then((mod) => mod.default), { ssr: false });
const MDEditorPreview = dynamic(() => import('@uiw/react-md-editor').then((mod) => mod.default.Markdown), {
    ssr: false
});
```

> このコードでは、エディタ本体`MDEditor`とプレビュー用の`MDEditor.Markdown`コンポーネントを動的インポートしています。`ssr: false`によりこれらはサーバー側ではレンダリングされず、ブラウザでのみ読み込まれます。

**App ディレクトリ用の注意:** Next.js 13 以降の App Router では、ページやコンポーネントファイルの先頭に`"use client";`と記載することで、そのファイルをクライアントコンポーネントとして扱えます。エディタを使用するページ/コンポーネントでは`"use client"`を宣言してください。これにより、そのコンポーネント内ではブラウザ環境が前提となり、上記の動的インポートと組み合わせて安全にエディタを使えます。

## ステップ 2: Markdown エディタとリアルタイムプレビューの実装

準備が整ったら、Markdown エディタとプレビューを組み合わせたコンポーネントを実装しましょう。次のようにコンポーネントを作成します（ここでは例として`app/page.tsx`に実装）。

```tsx
'use client'; // クライアントコンポーネントとして宣言

import { useState } from 'react';
// 上記でdynamicを使ってMDEditorとMDEditorPreviewを定義済みとする

export default function MarkdownPage() {
    const [content, setContent] = useState('**Hello world!!!**'); // 初期Markdown文字列

    return (
        <div data-color-mode="light" style={{ display: 'flex' }}>
            {/* エディタ */}
            <div style={{ flex: 1, marginRight: '1rem' }}>
                <MDEditor value={content} onChange={setContent} height={400} />
            </div>
            {/* リアルタイムプレビュー */}
            <div style={{ flex: 1, padding: '0 1rem' }}>
                <MDEditorPreview source={content} />
            </div>
        </div>
    );
}
```

上記コードでは、`useState`フックで Markdown 文字列の状態`content`を管理し、それを`MDEditor`の`value`プロパティに渡しています。`onChange`イベントで内容が変更されるたびに`content`を更新することで、下部または横のプレビュー (`MDEditorPreview` コンポーネント) に**リアルタイムで反映**されます。

-   `<MDEditor>`はテキスト入力部分で、**Markdown の編集 UI**を提供します。
-   `<MDEditorPreview>`（または`MDEditor.Markdown`）は、Markdown 文字列を HTML として描画しプレビューを表示するコンポーネントです。

`data-color-mode="light"`はエディタとプレビューのテーマをライトモードに設定するために付与しています（`"dark"`にするとダークテーマ）。必要に応じてこの属性でテーマを切り替えたり、周囲のコンテナのクラスでスタイル調整を行えます。

**補足:** レイアウトは上記では左右にエディタとプレビューを並べています。`display: "flex"`で横並びにし、スタイルで適宜余白を調整しています。縦に並べたい場合はスタイルを変更するか、単純に`MDEditor`と`MDEditorPreview`を縦に配置してください。

## ステップ 3: 画像ドラッグ＆ドロップアップロードの実装（GitHub API 連携）

Markdown エディタに**ドラッグ＆ドロップで画像を追加**し、その画像を GitHub にアップロードして Markdown 中に埋め込む機能を実装します。これにより、ユーザーが画像ファイルをエディタにドラッグするだけで、自動的に GitHub 上に画像が保存され、Markdown の画像タグが挿入されます。

### 3-1. エディタのドラッグ＆ドロップイベントを捕捉する

`@uiw/react-md-editor`の`MDEditor`コンポーネントは、標準的な DOM イベントである`onDrop`（ファイルがドロップされた時）や`onPaste`（クリップボードから貼り付けられた時）に対応しています。これらを利用して画像ファイルを検出しましょう。例えば、先ほどの`MDEditor`に以下のプロパティを追加します:

```tsx
<MDEditor
    value={content}
    onChange={setContent}
    // 画像のペーストに対応（オプショナル）
    onPaste={async (e) => {
        await handleUploadAndInsert(e.clipboardData);
    }}
    // ドロップに対応（ドラッグ&ドロップされたファイルを処理）
    onDrop={async (e) => {
        e.preventDefault(); // ブラウザのデフォルト動作を無効化
        await handleUploadAndInsert(e.dataTransfer);
    }}
/>
```

上記の`handleUploadAndInsert`関数（後述）で、渡された`DataTransfer`オブジェクト内のファイルを取り出し、アップロード処理を行います。`onPaste`では`clipboardData`、`onDrop`では`dataTransfer`経由でファイルデータにアクセスできます。それぞれ**非同期関数**内で処理し、アップロード完了後にエディタ内容を更新します。

### 3-2. GitHub API 経由で画像をアップロードするサーバー API の実装

次に、実際にファイルを GitHub にアップロードする処理を実装します。クライアントから直接 GitHub API を呼び出すこともできますが、**アクセストークンの安全性**や**CORS**の問題を考慮し、ここでは Next.js の API ルート（App Router の場合は`app/api`以下に定義するエンドポイント）を利用します。

1. **GitHub パーソナルアクセストークンの用意:** GitHub の PAT (Personal Access Token) を取得し、リポジトリへの内容変更権限（通常`repo`スコープ、または Fine-grained PAT であれば対象リポジトリの Contents 書き込み権限）を付与してください。Next.js プロジェクトの環境変数（例えば`.env.local`）にこのトークンを保存します。

    ```env
    GITHUB_TOKEN=<your token here>
    ```

    > _注:_ セキュリティのため、トークンはクライアントに露出しないよう**サーバー側でのみ**使用します。環境変数は Next.js のサーバーコンポーネントや API ルート内で`process.env.GITHUB_TOKEN`として参照可能です。

2. **アップロード先リポジトリとパスの決定:** アップロードされた画像を保存する GitHub リポジトリとパスを決めます。例えば、自分の GitHub アカウントの`my-blog-images`のようなリポジトリ、または既存プロジェクトの`public/images`ディレクトリなどを想定します。以下の例では、`USER/REPO`リポジトリの`images`フォルダにアップロードすると仮定します（必要に応じて適宜変更してください）。

3. **API エンドポイントの実装:** `app/api/uploadImage/route.ts`というファイルを作成し、POST リクエストを受け取って GitHub API を呼ぶ処理を実装します。例えば以下のようになります:

    ```ts
    import { NextRequest, NextResponse } from 'next/server';
    import { Buffer } from 'buffer';

    export async function POST(request: NextRequest) {
        try {
            // クライアントから画像ファイル名と内容(Base64)が送られてくることを想定
            const { name, content } = await request.json();
            if (!name || !content) {
                return NextResponse.json({ error: 'No image data' }, { status: 400 });
            }
            // GitHub APIエンドポイントとリクエストオプションを構築
            const repo = '<GitHubユーザ名>/<リポジトリ名>'; // 例: "myusername/my-blog-images"
            const path = `images/${name}`; // アップロード先パス
            const githubApiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
            // リクエストボディ作成（contentはBase64エンコードされたファイル内容）
            const body = {
                message: 'Upload image from Markdown editor',
                content: content // すでにBase64文字列化してある前提
                // branch: "main", // ブランチ指定（必要なら）
            };
            const githubRes = await fetch(githubApiUrl, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github+json'
                },
                body: JSON.stringify(body)
            });
            if (!githubRes.ok) {
                const errorData = await githubRes.json();
                console.error('GitHub API error:', errorData);
                return NextResponse.json({ error: 'GitHub upload failed', details: errorData }, { status: 500 });
            }
            const result = await githubRes.json();
            // GitHub APIの応答から画像のraw URLを取得
            const imageUrl: string | undefined = result.content?.download_url;
            return NextResponse.json({ url: imageUrl });
        } catch (e) {
            console.error('Unexpected error:', e);
            return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
        }
    }
    ```

    上記では、クライアントから`name`（ファイル名）と`content`（Base64 エンコード済み画像データ）を受け取り、GitHub の「Create or update file contents」API に対して HTTP PUT リクエストを送っています。リクエストボディの`message`はコミットメッセージ、`content`に画像ファイルの中身を Base64 文字列で指定します。成功すれば`download_url`（生データに直接アクセスできる URL）が含まれた JSON が返ってくるので、それをレスポンスとしてクライアントに返しています。

    > **ポイント:** GitHub API を呼ぶ際には適切なヘッダー（上記では認証用 Authorization ヘッダーと Accept ヘッダー）を指定してください。また、ファイルパスに同名ファイルが既に存在すると API は更新扱いになります。**新規アップロード時のファイル名の衝突**を避けるため、ファイル名`name`にタイムスタンプや UUID を付加して一意にすると良いでしょう（例: `image_1680000000000.png`など）。

### 3-3. クライアント側でのアップロード処理と Markdown への反映

API が用意できたら、クライアント側（エディタ側）でファイルを取得して API に送信し、返ってきた URL を Markdown テキストに挿入します。先ほど`onDrop`/`onPaste`で呼び出した`handleUploadAndInsert`関数を以下のように実装します:

```tsx
async function handleUploadAndInsert(dataTransfer: DataTransfer) {
    const files: File[] = [];
    // DataTransferから全ファイルを取り出す
    for (let i = 0; i < dataTransfer.files.length; i++) {
        const file = dataTransfer.files.item(i);
        if (file) files.push(file);
    }
    if (files.length === 0) return;

    for (const file of files) {
        // 1. ファイルをBase64エンコードする
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = () => reject(new Error('File read error'));
            reader.readAsDataURL(file); // DataURL形式で読み込む
        });
        // DataURLは "data:<MIMEタイプ>;base64,<...>" の形式なのでカンマ以降を取得

        // 2. APIにアップロードリクエストを送る
        const filename = `${Date.now()}_${file.name}`;
        const res = await fetch('/api/uploadImage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: filename, content: base64 })
        });
        if (!res.ok) {
            console.error('Image upload failed:', await res.text());
            continue;
        }
        const { url } = await res.json();
        if (url) {
            // 3. 挿入するMarkdown文字列を準備し、現在のエディタ内容に挿入
            const imageMarkdown = `![${file.name}](${url})`;
            insertTextAtCursor(imageMarkdown);
        }
    }
}
```

ここでの`insertTextAtCursor`は、現在編集中のテキストエリアに Markdown 文字列を挿入するヘルパー関数です。実装例を示します:

```tsx
function insertTextAtCursor(text: string) {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const oldValue = textarea.value;
    // カーソル位置で文字列を挿入
    const newValue = oldValue.slice(0, start) + text + oldValue.slice(end);
    textarea.value = newValue;
    // 挿入した内容をReactの状態にも反映
    setContent(newValue);
    // 挿入後の位置にカーソルを移動（必要であれば）
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
}
```

上記により、例えばユーザーが`image.png`をドロップすると、ファイルが GitHub にアップロードされた後で Markdown テキスト内の現在のカーソル位置に`![image.png](<アップロード後の画像URL>)`という形式の文字列が差し込まれます。この結果、プレビュー領域にはただちにその画像が表示されます（※プレビューコンポーネントが自動的に画像 URL を読み込んでレンダリングします）。

> **参考:** 上記の実装は Issue でコミュニティによって提案された方法を基にしています。複数ファイルのドラッグ＆ドロップにも対応しています。大量の画像を一度にアップロードする場合、GitHub API のレート制限やサイズ制限に注意してください。

## ステップ 4: Markdown 出力の取得と保存

エディタで編集した結果の Markdown 文字列（生のテキスト）を取得するには、**状態として保持している値**を使います。上記実装では、`useState`の`content`変数が常にエディタ内容と同期しています。したがって、`content`の値がそのまま Markdown 出力です。例えば、この値をバックエンドに送信してデータベースに保存したり、別ページでプレビュー表示するために渡したりできます。

-   **保存処理の例:** ボタンのハンドラで`fetch`や Axios を使い、`content`を API に POST してサーバー側で保存する。あるいは、フォーム送信する場合は隠し入力フィールドに`content`をセットして送信する方法もあります。
-   **プレビューへの利用:** 別のページやコンポーネントで`@uiw/react-markdown-preview`（もしくは`MDEditor.Markdown`）を使い、`source={content}`として渡せば、Markdown を HTML レンダリングできます。

リアルタイムプレビューを行っている場合は既にプレビューコンポーネントで最新`content`を表示していますが、例えば**別の場所でプレビュー**したいときも、同様にその Markdown 文字列を渡すだけで同じ見た目を再現できます。

## ステップ 5: その他の考慮事項（スタイリング・SSR・API の注意点）

最後に、導入にあたっての追加の調整ポイントや注意点をまとめます。

-   **スタイリングとテーマ調整:**
    エディタおよびプレビューは GitHub 風のスタイルが既定で適用されています。必要に応じて CSS を上書きして調整できます。例えばエディタの高さは`<MDEditor height={400} />`のように`height`プロパティで指定できます。また、親要素に`data-color-mode="light"`または`"dark"`を指定するとライト/ダークテーマを切り替えられます。ツールバーのボタン表示や機能カスタマイズも可能で、`commands`プロパティを使ってボタンを増減したりカスタムコマンドを定義できます。

-   **SSR 安全な統合:**
    Next.js App Router 環境では、サーバーコンポーネントとクライアントコンポーネントの分離に注意が必要です。`@uiw/react-md-editor`はブラウザの DOM 操作を行うため**クライアントコンポーネントとして扱う**必要があります。基本的には、エディタを使うコンポーネントで`"use client"`を宣言し、動的インポート（`ssr: false`）で読み込むことで問題なく動作します。万一ビルド時に CSS 関連のエラーが出る場合は、前述のプラグイン導入や CSS インポート方法を見直してください（例えば CSS を手動で組み込むなど）。

-   **GitHub API 利用時の注意:**
    GitHub API を使ってファイルアップロードを行う際、**認証情報**（トークン）は厳重に管理してください。公開リポジトリに画像をアップロードする場合、返される`download_url`は誰でもアクセス可能な URL になります。一方、プライベートリポジトリにアップロードした場合、`download_url`は認証がないとアクセスできません。そのため、公開したい画像はパブリックな場所にアップロードするのが簡便です。
    また、API 呼び出しには**レート制限**があります。認証した状態では 1 時間あたり 5000 リクエスト程度ですが、未認証だと 60 リクエスト/時に制限されます。頻繁に画像アップロードを行う可能性がある場合は、認証付きで呼び出すこととし、失敗時にはエラーメッセージをユーザーに知らせるなどの処理を入れておくと良いでしょう。ファイル名の重複については先述のようにユニークな名前を付けることで衝突を防止できます。不要になった画像のクリーンアップ（GitHub 上の削除）なども、必要であれば API 経由で対応可能です。

以上、Next.js（App Router）環境での`@uiw/react-md-editor`と`@uiw/react-markdown-preview`の統合手順を解説しました。適切に設定すれば、**Markdown の編集とプレビュー、画像アップロードまで含めた快適な編集体験**を実現できます。ぜひプロジェクトに取り入れてみてください。

**参考資料:**

-   uiwjs/react-md-editor 公式リポジトリと Issue
-   uiwjs/react-markdown-preview 公式ドキュメント
-   コミュニティによる画像アップロード実装例
-   GitHub REST API ドキュメント（Create or update file contents）
