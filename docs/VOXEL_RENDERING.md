# IPA空間ID ボクセル描画仕様

## 概要

本プロジェクトは、IPA（情報処理推進機構）の空間ID仕様に基づいたボクセル（3次元空間タイル）を高精度で描画するシステムです。

## 座標系

### LNGLAT座標系を使用

deck.gl の `COORDINATE_SYSTEM.LNGLAT` を採用しています。

```typescript
coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
getPosition: (d) => [longitude, latitude, altitude],
```

**選択理由:**
- IPA仕様がXYZタイル（度単位）に基づくため、度ベースの座標系が自然
- Z=31（約1.5cmボクセル）でもナノメートル精度を維持
- METER_OFFSETS よりメルカトル投影との親和性が高い

---

## IPA空間ID → 経緯度変換

### 座標変換式

```typescript
// Z: ズームレベル, X: 経度インデックス, Y: 緯度インデックス, F: 高度インデックス
const n = Math.pow(2, Z);

// 経度
const minLon = -180 + (360 / n) * X;
const maxLon = -180 + (360 / n) * (X + 1);

// 緯度（メルカトル投影の逆変換）
const maxLat = Math.atan(Math.sinh(Math.PI - (Y / n) * 2 * Math.PI)) * 180 / Math.PI;
const minLat = Math.atan(Math.sinh(Math.PI - ((Y + 1) / n) * 2 * Math.PI)) * 180 / Math.PI;

// 中心座標
const centerLon = (minLon + maxLon) / 2;
const centerLat = (minLat + maxLat) / 2;
```

### 高度計算

```typescript
// IPA仕様: Z=25で高さ1m
const voxelHeight = Math.pow(2, 25 - Z);  // メートル
const bottomAltitude = F * voxelHeight;
const centerAltitude = bottomAltitude + voxelHeight / 2;
```

---

## 経緯度 → IPA空間ID変換

```typescript
const n = Math.pow(2, Z);
const lon = 139.762217;
const lat = 35.682219;

// X座標
const X = Math.floor(n * (lon + 180) / 360);

// Y座標
const latRad = lat * Math.PI / 180;
const Y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);

// ボクセルID形式
const voxelId = `${Z}/${F}/${X}/${Y}`;
```

---

## サイズ計算

```typescript
// 水平サイズ（メートル単位）
const voxelLatRad = (centerLat * Math.PI) / 180;
const metersPerLon = 111319.49079327358 * Math.cos(voxelLatRad);
const sizeX = Math.abs(maxLon - minLon) * metersPerLon / 2;
const sizeY = sizeX;  // IPA仕様: 正方形

// 垂直サイズ
const sizeZ = voxelHeight / 2;
```

**注意:** SimpleMeshLayerのCubeGeometryは2×2×2キューブなので、サイズは半分を指定

---

## 描画レイヤー構成

```typescript
import { SimpleMeshLayer, COORDINATE_SYSTEM } from "deck.gl";
import { CubeGeometry } from "@luma.gl/engine";

const voxelMeshLayer = new SimpleMeshLayer({
  id: "VoxelMeshLayer",
  data: voxelData,
  mesh: new CubeGeometry(),
  coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
  getPosition: (d) => d.position,  // [lon, lat, alt]
  getColor: (d) => d.color,        // [R, G, B, A]
  getOrientation: [0, 0, 0],
  getScale: (d) => d.size,         // [sizeX, sizeY, sizeZ]
  material: false,
  pickable: true,
});
```

---

## 精度検証

### 理論精度

| レイヤー | 精度 |
|---------|------|
| JavaScript計算 | 64-bit float（ナノメートル級） |
| deck.gl内部処理 | 64-bit + オフセット法 |
| WebGLレンダリング | 32-bit + オフセット補正 |

### 実測精度

| Zレベル | タイルサイズ | 実測誤差 |
|---------|-------------|---------|
| Z=28 | 約12cm | 0.000001 mm (1nm) |
| Z=30 | 約3cm | 0.000000 mm |
| Z=31 | 約1.5cm | 0.000093 mm (93nm) |

---

## 使用例

### URLパラメータ形式

```
http://localhost:1420/?voxel=31/0/1907455922/845624613
```

### 複数ボクセル指定

```
http://localhost:1420/?voxel=31/0/1907455922/845624613,31/0/1907455923/845624613
```

### 範囲指定（ハイパーボクセル）

```
http://localhost:1420/?voxel=12/0/3448:3710/1466:1766
```

---

## 制限事項

1. **最大ズーム表示**: deck.glのmaxZoomは30に設定（それ以上は背景タイルなし）
2. **大量描画**: 100万個程度まで実用的なパフォーマンス
3. **極端な高緯度**: 85°以上はメルカトル投影の限界

---

## 参考資料

- [IPA 空間ID仕様](https://www.digital.go.jp/data/spatial-id)
- [deck.gl Coordinate Systems](https://deck.gl/docs/developer-guide/coordinate-systems)
- [OpenStreetMap Slippy Map Tilenames](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames)
