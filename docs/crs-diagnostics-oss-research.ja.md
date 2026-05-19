# CRS 診断 OSS 調査メモ

更新日: 2026-05-19

## 結論

CRS 診断の初期実装では、LAS VLR の読み取り、WKT 文字列抽出、GeoTIFF key の最小解析は自前実装が妥当である。

OSS を使うなら、WKT 解析だけを軽量候補として限定採用する。LAS 全体ローダー、GeoTIFF ライブラリ、座標変換ライブラリは、今回の初期スコープには重い。

## 前提

- PointCloudWorkbench は `PointCloudWorkbench.html` 単体配布を維持する。
- 現状は `three.js` と `laz-perf` を CDN script で読み込む。
- repo には `package.json` がなく、通常利用に build step はない。
- 初期スコープは座標変換ではなく、LAS / LAZ 内の CRS メタデータ診断である。

## 調査対象

### `@loaders.gl/las`

- GitHub / docs: https://loaders.gl/docs/modules/las
- npm package: `@loaders.gl/las`
- license: MIT
- npm unpacked size: 約 6.4MB
- 依存: `@loaders.gl/*`, `laz-perf`

評価:
- LAS / LAZ ローダーとしては強いが、公式 docs 上で LAS v1.4 非対応とされている。
- この repo はすでに LAS 1.4 の 64-bit 点数フィールドや point format 6+ を扱っているため、丸ごと差し替え候補にはしにくい。
- CRS 診断だけのために導入するには大きい。

判断:
- 初期実装では採用しない。

### `@loaders.gl/wkt`

- GitHub / docs: https://loaders.gl/docs/modules/wkt
- npm package: `@loaders.gl/wkt`
- license: MIT
- npm unpacked size: 約 190KB
- 依存: `@loaders.gl/gis`, `@loaders.gl/loader-utils`, `@loaders.gl/schema`

評価:
- WKT-CRS loader を持つ。
- ただし loaders.gl 系依存が付くため、単一 HTML の軽量機能としてはやや大きい。
- 今回必要なのは WKT 全体の完全 AST ではなく、名称、EPSG 候補、単位、垂直 CRS の有無の要約である。

判断:
- 初期実装では見送り。
- WKT の方言対応で詰まった場合の後続候補。

### `wkt-crs`

- GitHub: https://github.com/DanielJDufour/wkt-crs
- npm package: `wkt-crs`
- license: CC0-1.0
- npm unpacked size: 約 20KB

評価:
- WKT-CRS の小さな parser。
- license は使いやすい。
- WKT を AST として扱う必要が出た場合の最軽量候補。
- ただし初期実装で必要な EPSG 候補抽出は、正規表現と簡易 section 判定でも足りる可能性が高い。

判断:
- 採用候補。
- 最初は自前の軽量抽出で始め、WKT 方言対応の必要が明確になった時だけ導入を検討する。

### `wkt-parser`

- GitHub: https://github.com/proj4js/wkt-parser
- npm package: `wkt-parser`
- license: MIT
- npm unpacked size: 約 168KB

評価:
- `proj4` が依存している WKT parser。
- WKT から proj4 用の定義へ寄せる用途に向く。
- 今回は座標変換を行わないため、初期導入の価値は限定的。

判断:
- 初期実装では採用しない。
- 後で `proj4` 連携を検討する段階の候補。

### `proj4`

- GitHub: https://github.com/proj4js/proj4js
- npm package: `proj4`
- license: MIT
- npm unpacked size: 約 830KB
- 依存: `mgrs`, `wkt-parser`

評価:
- ブラウザで座標変換できる実績ある OSS。
- CDN 直読みも可能。
- ただし今回の採用スコープは「CRS 診断」であり、緯度経度変換や地図表示は非目標。
- 日本の測地系や高さ変換を正確に扱うには EPSG 定義、グリッド、垂直基準など別問題が残る。

判断:
- 初期実装では採用しない。
- 将来の座標変換機能で再検討する。

### `geotiff`

- GitHub: https://github.com/geotiffjs/geotiff.js
- npm package: `geotiff`
- license: MIT
- npm unpacked size: 約 3.8MB
- 依存: `lerc`, `pako`, `zstddec`, `quick-lru`, `xml-utils`, `web-worker`, `parse-headers`, `@petamoriken/float16`

評価:
- GeoTIFF ファイルの読み取りには強い。
- ただし LAS VLR 内の GeoTIFF key は TIFF ファイルそのものではない。
- 今回必要なのは `34735 / 34736 / 34737` の小さな key-value 解析であり、GeoTIFF raster decoder 全体は不要。

判断:
- 初期実装では採用しない。

### `geotiff-geokeys-to-proj4`

- GitHub: https://github.com/matafokka/geotiff-geokeys-to-proj4
- npm package: `geotiff-geokeys-to-proj4`
- license: BSD-3-Clause
- npm unpacked size: 約 6.1MB

評価:
- GeoTIFF keys から proj4 定義へ寄せる用途。
- EPSG schema を含むため大きい。
- 今回は変換ではなく診断なので、導入コストが高い。

判断:
- 初期実装では採用しない。

### `copc`

- npm package: `copc`
- license: MIT
- npm unpacked size: 約 90KB
- 依存: `cross-fetch`, `laz-perf`

評価:
- COPC 向けであり、通常 LAS / LAZ の CRS 診断に直接合わない。

判断:
- 採用しない。

## 仕様上の根拠

- LAS の WKT は `LASF_Projection` user id の VLR として格納され、Coordinate System WKT は record id `2112` で扱われる。
- OGC Math Transform WKT は record id `2111` で扱われる。初期実装では適用せず、存在だけを警告として扱う。
- LAS 1.4 の point format 6-10 は WKT 前提になるため、WKT record がない場合は CRS 診断上の不整合として扱う。
- LAS 1.4 では WKT と GeoTIFF の両方が存在する場合、より表現力のある WKT を優先する方針が妥当である。
- LAS 1.3 / 1.4 の EVLR は VLR より大きい CRS 情報を持てるため、VLR だけを読むと CRS を見逃す可能性がある。
- GeoTIFF key は LAS VLR 内では小さな key directory と params として入るため、GeoTIFF raster decoder 全体を入れる必要はない。
- EVLR は VLR より大きい payload を持てるため、ブラウザでは header 先読みと payload byte cap が必要である。CRS 診断のために EVLR offset から file end まで一括読みしない。

参照:

- ASPRS LAS 1.4 specification: https://www.asprs.org/wp-content/uploads/2019/07/LAS_1_4_r15.pdf
- ArcGIS Pro LAS coordinate system docs: https://doc.esri.com/en/arcgis-pro/latest/help/analysis/3d-analyst/understand-las-coordinate-system.html
- libLAS WKT VLR notes: https://liblas.org/development/wkt.html

## 採用方針

初期実装:

- LAS VLR reader: 自前実装
- LAS EVLR reader: 自前実装
- WKT record 抽出: 自前実装
- WKT 要約: 自前の軽量抽出
- GeoTIFF key 解析: 自前実装
- EPSG 候補抽出: 自前実装
- 座標変換: 実装しない

後続で再検討:

- WKT 方言対応が不足した場合: `wkt-crs`
- 座標変換を正式機能にする場合: `proj4`
- 外部 GeoTIFF raster を扱う場合: `geotiff`

## 実装計画への反映

- PR1 から PR4 までは自前の純粋関数で進める。
- EVLR 対応は後回しにせず、VLR 抽出と同じ診断基盤で扱う。
- EVLR は header-first sequential read にし、projection record 以外の巨大 payload を読まない。
- PR3 では WKT parser OSS の導入を stop condition にする。
  - 正規表現と簡易 section 判定で EPSG、単位、垂直 CRS 有無が取れない fixture が出た場合だけ `wkt-crs` を検討する。
- `@loaders.gl/las` は LAS 1.4 非対応のため、既存 loader の置換には使わない。
- `geotiff` は LAS VLR の GeoTIFF key 解析には過剰なため使わない。

## 追加レビューで見つけた注意点

- `parse-warning` を status として強く出しすぎると、抽出済み CRS の主判定が隠れる。警告は主判定に併記する方がよい。
- WKT から単純に最後または最初の EPSG を取ると、単位、datum、method の EPSG を CRS と誤認する。WKT の文脈で horizontal / vertical / unit / other に分ける。
- `survey-safe` という言葉は成果として安全という誤解を招く。内部 status は `complete-crs-metadata` にする。
