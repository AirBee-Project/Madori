import { Color, LayersList } from "deck.gl";
import { TileLayer } from "@deck.gl/geo-layers";
import { BitmapLayer, GeoJsonLayer } from "@deck.gl/layers";
import { SimpleMeshLayer } from "@deck.gl/mesh-layers";
import { CubeGeometry } from "@luma.gl/engine";
import { Item } from "../types/Item";
import { GeoJSON } from "geojson";
import { COORDINATE_SYSTEM } from "@deck.gl/core";
import colorHexToRgba from "./ColorHexToRgba";
import hyperVoxelToPureVoxel from "./HyperVoxelToPureVoxel";
import { pvoxelToLngLat, VoxelLngLatProps, pvoxelToCoordinates } from "./PureVoxelToPolygon";

/**
 * StateであるItem[]を入れると、DeckglのLayerに変換し出力する関数a
 */
export default function generateLayer(item: Item[], isMapVisible: boolean = true): LayersList {
  let pointItem: Item<"point">[] = item.filter(
    (e): e is Item<"point"> =>
      !e.isDeleted && !e.isVisible && e.type === "point"
  );
  let lineItem: Item<"line">[] = item.filter(
    (e): e is Item<"line"> => !e.isDeleted && !e.isVisible && e.type === "line"
  );

  let voxelItem: Item<"voxel">[] = item.filter(
    (e): e is Item<"voxel"> =>
      !e.isDeleted && !e.isVisible && e.type === "voxel"
  );

  //PointはまとめてGeoJsonLayerとして表示
  const pointGeoJsonLayer = new GeoJsonLayer({
    id: "GeoJsonLayer",
    data: generatePointGeoJson(pointItem),
    pickable: true,
    filled: true,
    pointRadiusUnits: "pixels",
    pointRadiusMinPixels: 1,
    pointRadiusScale: 1,
    getFillColor: (d) => d.properties.color, // 個別カラー
    getRadius: (d) => d.properties.radius, // 個別サイズ
  });

  //LineはまとめてGeoJsonLayerとして表示
  const lineGeoJsonLayer = new GeoJsonLayer({
    id: "geojson-lines",
    data: generateLineGeoJson(lineItem),
    pickable: true,
    stroked: true,
    filled: false,
    lineWidthUnits: "pixels",
    getLineColor: (d) => d.properties.color as Color, // ← 色を個別設定
    getLineWidth: (d) => d.properties.width, // ← 太さを個別設定
  });

  //VoxelはSimpleMeshLayerとしてまとめて出力
  // LNGLAT座標系: 度単位で位置を指定（IPA仕様に準拠）
  // Z=31テスト用

  let voxelData: any[] = [];

  if (voxelItem.length > 0) {
    console.time("Voxel Data Generation");

    // 全ボクセルを変換
    for (const vItem of voxelItem) {
      const pVoxels = hyperVoxelToPureVoxel(vItem.data.voxel);
      const color = colorHexToRgba(vItem.data.color, vItem.data.opacity);

      for (const pv of pVoxels) {
        const coords = pvoxelToCoordinates(pv);
        const centerLon = (coords.minLon + coords.maxLon) / 2;
        const centerLat = (coords.minLat + coords.maxLat) / 2;

        // IPA仕様に基づく高さ計算
        const voxelHeight = Math.pow(2, 25 - pv.Z);
        const bottomAltitude = pv.F * voxelHeight;
        const z = bottomAltitude + voxelHeight / 2;

        // 水平サイズ（メートル単位）- 各ボクセルの緯度で計算
        const voxelLatRad = (centerLat * Math.PI) / 180;
        const voxelMetersPerLon = 111319.49079327358 * Math.cos(voxelLatRad);
        const sizeX = Math.abs(coords.maxLon - coords.minLon) * voxelMetersPerLon / 2;
        const sizeY = sizeX;  // IPA仕様: 正方形
        const sizeZ = voxelHeight / 2;

        voxelData.push({
          position: [centerLon, centerLat, z],  // LNGLAT: [経度, 緯度, 高度]
          size: [sizeX, sizeY, sizeZ],
          color: color
        });
      }
    }

    console.timeEnd("Voxel Data Generation");
    console.log(`Total voxels: ${voxelData.length}`);

    // 精密誤差測定（Z>=28のボクセルのみ）
    if (voxelData.length > 0 && voxelData.length <= 10) {
      console.group("=== 精密誤差測定 ===");
      for (const vItem of voxelItem) {
        const pVoxels = hyperVoxelToPureVoxel(vItem.data.voxel);
        for (const pv of pVoxels) {
          if (pv.Z >= 28) {
            const n = Math.pow(2, pv.Z);

            // IPA仕様による理論座標計算
            const theoreticalMinLon = (pv.X / n) * 360 - 180;
            const theoreticalMaxLon = ((pv.X + 1) / n) * 360 - 180;
            const theoreticalMinLat = Math.atan(Math.sinh(Math.PI * (1 - 2 * (pv.Y + 1) / n))) * 180 / Math.PI;
            const theoreticalMaxLat = Math.atan(Math.sinh(Math.PI * (1 - 2 * pv.Y / n))) * 180 / Math.PI;
            const theoreticalCenterLon = (theoreticalMinLon + theoreticalMaxLon) / 2;
            const theoreticalCenterLat = (theoreticalMinLat + theoreticalMaxLat) / 2;

            // 実際に使用している座標
            const coords = pvoxelToCoordinates(pv);
            const actualCenterLon = (coords.minLon + coords.maxLon) / 2;
            const actualCenterLat = (coords.minLat + coords.maxLat) / 2;

            // 誤差計算（メートル単位）
            const latRad = (actualCenterLat * Math.PI) / 180;
            const metersPerLon = 111319.49079327358 * Math.cos(latRad);
            const metersPerLat = 111319.49079327358;

            const lonErrorDeg = Math.abs(actualCenterLon - theoreticalCenterLon);
            const latErrorDeg = Math.abs(actualCenterLat - theoreticalCenterLat);
            const lonErrorMeters = lonErrorDeg * metersPerLon;
            const latErrorMeters = latErrorDeg * metersPerLat;

            // タイルサイズ計算
            const tileSizeDeg = 360 / n;
            const tileSizeMeters = tileSizeDeg * metersPerLon;

            console.log(`Voxel: ${pv.Z}/${pv.F}/${pv.X}/${pv.Y}`);
            console.log(`  タイルサイズ: ${tileSizeMeters.toFixed(4)} m (${(tileSizeDeg * 1e9).toFixed(2)} × 10^-9 度)`);
            console.log(`  理論中心: [${theoreticalCenterLon.toFixed(15)}, ${theoreticalCenterLat.toFixed(15)}]`);
            console.log(`  実際中心: [${actualCenterLon.toFixed(15)}, ${actualCenterLat.toFixed(15)}]`);
            console.log(`  経度誤差: ${lonErrorDeg.toExponential(6)} 度 = ${(lonErrorMeters * 1000).toFixed(6)} mm`);
            console.log(`  緯度誤差: ${latErrorDeg.toExponential(6)} 度 = ${(latErrorMeters * 1000).toFixed(6)} mm`);
            console.log(`  合計誤差: ${(Math.sqrt(lonErrorMeters ** 2 + latErrorMeters ** 2) * 1000).toFixed(6)} mm`);
          }
        }
      }
      console.groupEnd();

      // 座標→ピクセル変換検証用のグローバル関数を登録
      (window as any).verifyPixelProjection = (lon: number, lat: number, viewState: any) => {
        console.group("=== 座標→ピクセル変換検証 ===");

        // Web Mercator 手動計算
        const TILE_SIZE = 512;
        const worldScale = TILE_SIZE * Math.pow(2, viewState.zoom);

        // Mercator projection formula
        const x_world = (lon + 180) / 360 * worldScale;
        const latRad = lat * Math.PI / 180;
        const y_world = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * worldScale;

        // viewport center in world coordinates
        const centerLonRad = viewState.longitude * Math.PI / 180;
        const centerLatRad = viewState.latitude * Math.PI / 180;
        const center_x = (viewState.longitude + 180) / 360 * worldScale;
        const center_y = (1 - Math.log(Math.tan(centerLatRad) + 1 / Math.cos(centerLatRad)) / Math.PI) / 2 * worldScale;

        // Offset from center
        const dx = x_world - center_x;
        const dy = y_world - center_y;

        console.log(`入力座標: [${lon.toFixed(15)}, ${lat.toFixed(15)}]`);
        console.log(`ズームレベル: ${viewState.zoom}`);
        console.log(`ワールド座標: [${x_world.toFixed(6)}, ${y_world.toFixed(6)}]`);
        console.log(`中心からのオフセット: [${dx.toFixed(6)}, ${dy.toFixed(6)}] pixels`);

        // At high zoom, check if sub-pixel precision is maintained
        const pixelPrecision = 1 / Math.pow(2, viewState.zoom);
        console.log(`現在のズームでの1ピクセル = ${(pixelPrecision * 360 / TILE_SIZE).toExponential(4)} 度`);

        console.groupEnd();
        return { x_world, y_world, dx, dy };
      };

      console.log("座標→ピクセル検証: window.verifyPixelProjection(lon, lat, viewState) を使用可能");
    }
  }

  // LNGLAT座標系でレイヤーを生成
  const cubeGeometry = new CubeGeometry();
  const voxelMeshLayers = voxelData.length > 0 ? [new SimpleMeshLayer({
    id: "VoxelMeshLayer",
    data: voxelData,
    mesh: cubeGeometry,
    coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
    getPosition: (d: any) => d.position,  // [lon, lat, alt]
    getColor: (d: any) => d.color,
    getOrientation: [0, 0, 0],
    getScale: (d: any) => d.size,
    material: false,
    pickable: true,
  })] : [];
  // 背景地図: Carto Voyager (明るい地図)
  const tileMapLayer = new TileLayer({
    id: "TileMapLayer",
    data: "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
    maxZoom: 19,
    minZoom: 0,
    opacity: 1,
    renderSubLayers: (props) => {
      const { boundingBox } = props.tile;
      return new BitmapLayer(props, {
        data: undefined,
        image: props.data,
        bounds: [
          boundingBox[0][0],
          boundingBox[0][1],
          boundingBox[1][0],
          boundingBox[1][1],
        ],
      });
    },
    pickable: true,
  });

  let reuslt: LayersList = [
    tileMapLayer,
    pointGeoJsonLayer,
    lineGeoJsonLayer,
    ...voxelMeshLayers,
  ];
  return reuslt;
}

function generatePointGeoJson(point: Item<"point">[]): GeoJSON {
  const result: GeoJSON = {
    type: "FeatureCollection",
    features: [],
  };

  for (let i = 0; i < point.length; i++) {
    result.features.push({
      type: "Feature",
      properties: {
        color: colorHexToRgba(point[i].data.color, point[i].data.opacity),
        radius: point[i].data.size,
      },
      geometry: {
        type: "Point",
        coordinates: [point[i].data.lon, point[i].data.lat], // 東京
      },
    });
  }

  return result;
}

function generateLineGeoJson(line: Item<"line">[]): GeoJSON {
  const result: GeoJSON = {
    type: "FeatureCollection",
    features: [],
  };
  for (let i = 0; i < line.length; i++) {
    result.features.push({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [line[i].data.lon1, line[i].data.lat1],
          [line[i].data.lon2, line[i].data.lat2],
        ],
      },
      properties: {
        color: colorHexToRgba(line[i].data.color, line[i].data.opacity), // 赤
        width: line[i].data.size,
      },
    });
  }
  return result;
}

// Polygon related code removed as we use Mesh now

