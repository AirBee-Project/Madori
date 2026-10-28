# Madori

![スクリーンショット](/docs/image27.png "スクショ2")
![スクリーンショット](/docs/image28.png "スクショ2")
![スクリーンショット](/docs/image25.png "スクショ2")
![スクリーンショット](/docs/image26.png "スクショ2")
![スクリーンショット](/docs/image29.png "スクショ2")

## アプリ概要

「Madori」は、入力した空間IDを地図上で可視化するツールです。描画には deck.gl を採用しており、大量のボクセルを高速にレンダリングできます。

### 時空間IDの描画
空間IDの直接入力に加えて、JSON形式でのインポートにも対応しています。IDのグループや、IDに付与された属性情報ごとに任意の色分けができるため、視覚的なデータ分析が可能です。

### 点/線の描画
座標を入力することで、任意の点や線を描画することが可能です。

### セットアップ
```bash
bun install
```

### 開発サーバーの起動
```bash
bun run dev
```

### ビルド
```bash
bun run build
```

### プレビュー
```bash
bun run preview
```

### 各種コマンド

| コマンド | 内容 |
| :--- | :--- |
| `bun run check` | Biome によるコードチェックと自動修正 |
| `bun run format` | コードの整形 |
| `bun run lint` | Biome によるルール違反の確認 |
| `bun run test` | Vitest によるテストの実行 |
| `bun run typecheck` | TypeScript の型チェック |
| `bun run ci` | コミット前の総合チェック |


