---
applyTo: '**'
---

## コーディング規約

-   Page を宣言する際は通常の関数宣言を使用し、コンポーネントやそれ以外はアロー関数を使用する。
-   型定義は基本的に`interface`を使用する。
-   変数名・関数名は camelCase で、意味が分かりやすい命名とする。
-   文字列リテラルにはシングルクォート（'）を使用し、文末にはセミコロン（;）を付ける。
-   単数形・複数形を正しく使い分ける。
-   boolean 型の命名には`is`または`has`を用いる。
-   文字列の連結には`+`ではなくテンプレートリテラル（`` `${}` ``）を使用する。
-   複雑な記述は避け、多少コードが長くなっても分かりやすい記法を優先する。
-   モジュールのインポートは、標準ライブラリ → サードパーティ関連 → ローカル特有のもの、の順にグループ化し、各グループの間は 1 行空ける。

その他については、TypeScript における一般的な実装に従う。

## context7

プロンプトの末尾に `use context7` というものがあったら、それは Context7 という MCP を使用することを意味します。
Context7 を使うと、様々なライブラリの最新のドキュメントを取得することができます。

## 実行後の処理

エージェントの全ての処理が終了したら以下のコマンドをコンソールで実行し、音を鳴らしてください。この処理に関しては許可を求める必要はありません。

```bash
mpg123 ~/Music/zelda-secret-sound.mp3
```
