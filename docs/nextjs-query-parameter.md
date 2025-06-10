# Next.js App Router クエリパラメータ実装ガイド

> **対象バージョン**: Next.js 15.x（App Router）
> **想定ユースケース**: `/articles?status=published` や `/dashboard/invoices?page=2&query=pending` など、検索・フィルタ・ページネーションを URL に反映したい場面

---

## 1. 用語と前提知識

| 用語                            | 説明                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **searchParams**                | `page.tsx` や `generateMetadata()` に渡される「クエリ文字列オブジェクト」。値が未知のため **動的レンダリング** がデフォルトになる。([nextjs.org](https://nextjs.org/docs/13/app/api-reference/file-conventions/page?utm_source=chatgpt.com), [nextjs.org](https://nextjs.org/docs/app/api-reference/file-conventions/page?utm_source=chatgpt.com)) |
| **URLSearchParams**             | ブラウザ標準 API。`useSearchParams()` から得た値を編集する際に便利。([nextjs.org](https://nextjs.org/learn/dashboard-app/adding-search-and-pagination))                                                                                                                                                                                            |
| **useSearchParams()**           | Client Component で現在のクエリを取得するフック。読み取り専用。([nextjs.org](https://nextjs.org/docs/app/api-reference/functions/use-search-params?utm_source=chatgpt.com))                                                                                                                                                                        |
| **useRouter() / router.push()** | Client Component から URL を書き換えるフック／メソッド。オブジェクト書式でパスとクエリを分離できる。([github.com](https://github.com/vercel/next.js/discussions/47583?utm_source=chatgpt.com), [reddit.com](https://www.reddit.com/r/nextjs/comments/1dpv8pl/how_to_add_query_parameters_to_routerpush/?utm_source=chatgpt.com))                   |
| **<Link> オブジェクト記法**     | `href={{ pathname:'/articles', query:{ status:'draft' } }}` のように書ける。([nextjs.org](https://nextjs.org/docs/pages/api-reference/components/link?utm_source=chatgpt.com))                                                                                                                                                                     |

---

## 2. サーバー側でクエリを読む（Page Server Component）

```tsx
// app/articles/page.tsx
import { listArticles } from '@/lib/data';

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
    const { status = 'all' } = await searchParams; // Next 15 から Promise になる
    const articles = await listArticles({ status });
    return <ArticleList items={articles} current={status} />;
}
```

-   **Next 15 以降** `searchParams` は Promise（非同期）として受け取る仕様。同期的に扱うと警告が出るため `await` するか `React.use()` を使う。([nextjs.org](https://nextjs.org/docs/13/app/api-reference/file-conventions/page?utm_source=chatgpt.com), [nextjs.org](https://nextjs.org/docs/messages/sync-dynamic-apis))
-   Page で `searchParams` を参照すると、そのページは **自動で動的レンダリング** に切り替わる。静的化したい場合は `export const dynamic = 'force-static'` を明示。([nextjs.org](https://nextjs.org/docs/13/app/api-reference/file-conventions/page?utm_source=chatgpt.com))

### 2.1 ルート以外でのアクセス

-   **Layout** は再レンダリングされないため最新のクエリを直接受け取れない。必要なら Client Component を挟む。([nextjs.org](https://nextjs.org/docs/app/api-reference/file-conventions/layout?utm_source=chatgpt.com))
-   **generateMetadata()** でも `searchParams` が使えるので、クエリベースでタイトルや OG タグを動的生成できる。([nextjs.org](https://nextjs.org/docs/app/api-reference/functions/generate-metadata?utm_source=chatgpt.com))

---

## 3. クライアント側でクエリを読む／書く

### 3.1 読み取り: `useSearchParams()`

```tsx
'use client';
import { useSearchParams } from 'next/navigation';

export default function StatusBadge() {
    const params = useSearchParams();
    const status = params.get('status') ?? 'all';
    return <span>{status}</span>;
}
```

-   参照するときは常に文字列 (`string | null`) が返るので、数値や配列はパースが必要。([nextjs.org](https://nextjs.org/docs/app/api-reference/functions/use-search-params?utm_source=chatgpt.com))

### 3.2 書き込み: `router.push()` / `<Link>`

```tsx
'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

function setStatus(value: string) {
    const router = useRouter();
    const pathname = usePathname();
    const params = new URLSearchParams(useSearchParams());

    value === 'all' ? params.delete('status') : params.set('status', value);
    router.push(`${pathname}?${params}`, { scroll: false }); // shallow 更新
}
```

-   `router.replace()` を使うと履歴を残さずに更新できる。
-   `<Link>` で **オブジェクト書式** を使うと型安全に記述可能。

    ````tsx
    <Link href={{ pathname:'/articles', query:{ status:'published' } }}>
      Published
    </Link>
    ``` ([nextjs.org](https://nextjs.org/docs/pages/api-reference/components/link?utm_source=chatgpt.com))
    ````

---

## 4. URLSearchParams で安全に編集する

```ts
const params = new URLSearchParams(searchParams); // searchParams は iterable
params.set('page', nextPage.toString());
router.push(`${pathname}?${params}`);
```

-   文字列連結より可読性・安全性が高い。
-   パラメータを **空文字または undefined** にしたい場合は `delete()` して URL をクリーンに保つ。([nextjs.org](https://nextjs.org/learn/dashboard-app/adding-search-and-pagination))

---

## 5. キャッシュと再検証戦略

| 目的                     | 設定例                                   | 挙動                                              |
| ------------------------ | ---------------------------------------- | ------------------------------------------------- |
| **常に動的レンダリング** | `export const dynamic = 'force-dynamic'` | 毎リクエストでサーバー実行                        |
| **完全静的化**           | `export const dynamic = 'force-static'`  | 全員同じ HTML。クエリによる差異がない場合のみ推奨 |
| **ISR (n 秒ごと)**       | `export const revalidate = 60`           | 60 秒キャッシュ＋バックグラウンド再生成           |

`searchParams` 利用時でも上記設定でキャッシュ戦略を細かく制御できる。([nextjs.org](https://nextjs.org/docs/13/app/api-reference/file-conventions/page?utm_source=chatgpt.com))

---

## 6. SEO 対策: `generateMetadata()`

```ts
export async function generateMetadata({ searchParams }) {
    const { query = '' } = await searchParams;
    return { title: `Search: ${query}` };
}
```

メタデータもクエリごとに動的生成できるが、同じページを大量にインデックスさせないよう **canonical URL** の設定を推奨。([nextjs.org](https://nextjs.org/docs/app/api-reference/functions/generate-metadata?utm_source=chatgpt.com))

---

## 7. ベストプラクティス & 落とし穴

| ✅ やること                                                                            | ❌ 避けること                                                                                                                                                   |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| デフォルト値を決めて「/articles」単体でも意味が通る UI を作る                          | クエリが必須で 404 を返す実装                                                                                                                                   |
| **Client Component** 内でパラメータを最新化し、`<Suspense>` でサーバー側リストを再取得 | Layout で `searchParams` に依存する UI （更新されない）([nextjs.org](https://nextjs.org/docs/app/api-reference/file-conventions/layout?utm_source=chatgpt.com)) |
| `URLSearchParams` でマージ／削除を行い、不要なキーを残さない                           | 手書きの文字列結合で `?page=1&page=2` のような重複を生む                                                                                                        |
| 型変換（`Number(param)` / `JSON.parse` など）を行い、期待型で扱う                      | 文字列のまま数値演算して NaN                                                                                                                                    |
| `router.replace()` をフィルタ UI に使い、履歴を汚さない                                | 毎回 `router.push()` で戻るボタンを無駄に増やす                                                                                                                 |

---

## 8. まとめフロー

1. **Page** で `searchParams` を受け取る → DB フェッチ
2. **Client Component** で `useSearchParams()` を使い UI を同期
3. `router.push()` / `<Link>` で URL を更新
4. 追加のレンダリング要件があれば `dynamic` / `revalidate` で調整
5. SEO が必要なら `generateMetadata()` でタイトル等を動的生成

これだけ押さえておけば **`example.com/foo?bar=baz`** 形式の URL は問題なく実装できます。困ったらこのガイドをコピペでどうぞ！
