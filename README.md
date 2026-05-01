# Madori

![スクリーンショット](/docs/image25.png "スクショ2")
![スクリーンショット](/docs/image26.png "スクショ2")

## アプリ概要

「Madori」は、入力した空間IDを地図上で可視化するツールです。描画には deck.gl を採用しており、大量のボクセルを高速にレンダリングできます。

空間IDの直接入力に加えて、JSON形式でのインポートにも対応しています。IDのグループや、IDに付与された属性情報ごとに任意の色分けができるため、視覚的なデータ分析が可能です。

現在は GitHub Pages で公開しており、誰でも利用できます。

- 公開URL: https://airbee-project.github.io/Madori/

## 開発中の機能

- 点の描画
- 線の描画
- 地図の切り替え

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

### Biome

| コマンド | 内容 |
| :--- | :--- |
| `bun run check` | コードの整形、インポート整理、自動修正 |
| `bun run format` | コードの自動整形 |
| `bun run lint` | ルール違反のチェック |
