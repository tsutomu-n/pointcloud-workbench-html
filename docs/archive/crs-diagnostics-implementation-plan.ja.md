# CRS 診断 推奨実装計画

更新日: 2026-05-19

## 目的

- LAS / LAZ ファイルに含まれる座標参照系メタデータを読み取り、地球上の位置特定に使える可能性を画面上で判定できるようにする。
- `PointCloudWorkbench.html` 単体配布、Server-Zero、Client-Max の前提を維持する。
- 初期実装では座標変換や地図表示に踏み込まず、「CRS 情報があるか」「高さ基準まで安全に判断できるか」を利用者へ明示する。

## 制約

- 最終成果物は引き続き `PointCloudWorkbench.html` の単一 HTML とする。
- Workers、Pages Functions、API、DB、テレメトリ、LAS / LAZ アップロード経路は追加しない。
- PDAL、PROJ、EPSG DB 相当の重い GIS ランタイムは同梱しない。
- ブラウザ内でローカルファイルを slice 読みする方針を維持し、不要な全量読み込みを増やさない。
- UI 上では、検出できた情報と推測を分ける。高さ基準が不明な場合に「標高として安全」と断定しない。

## 推奨スコープ

### 入れる

- LAS header から VLR 読みに必要な項目を取得する。
  - `globalEncoding`
  - `headerSize`
  - `numberOfVariableLengthRecords`
  - `pointDataOffset`
  - `startOfFirstExtendedVariableLengthRecord`
  - `numberOfExtendedVariableLengthRecords`
  - LAS version
  - point format
- `headerSize` から `pointDataOffset` 直前までを slice 読みし、VLR を解析する。
- LAS 1.3 / 1.4 で EVLR がある場合は、`startOfFirstExtendedVariableLengthRecord` から EVLR header を逐次 bounded slice で読み、CRS 候補 record の payload だけを上限内で解析する。
- `LASF_Projection` の主要 record を対象にする。
  - `2111`: OGC Math Transform WKT
  - `2112`: OGC WKT
  - `34735`: GeoKeyDirectoryTag
  - `34736`: GeoDoubleParamsTag
  - `34737`: GeoAsciiParamsTag
- WKT 文字列を抽出する。
- GeoTIFF key から EPSG 候補を抽出する。
- 水平 CRS、垂直 CRS、高さ基準、単位の検出状態をまとめる。
- UI に「座標情報」または「CRS 診断」カードを追加する。
- README、運用手順書、実装リファレンスに「判定できること / できないこと」を追記する。

### 初期実装では入れない

- 緯度経度への座標変換
- 地図表示
- 住所、市町村、都道府県の推定
- EPSG DB の同梱
- 外部 `.prj`、XML、成果簿、報告書の自動読み込み
- ユーザーによる CRS 編集と保存
- CRS がないファイルへの自動補正
- OGC Math Transform WKT の適用
- Global Encoding の WKT bit 不整合の自動修復

## 対象ファイル

- `PointCloudWorkbench.html`
  - LAS header 解析
  - VLR / EVLR / GeoTIFF / WKT 解析
  - CRS 診断データ構造
  - UI 表示
  - `window.__pcwTestApi` のテスト用公開
- `scripts/pointcloud-workbench.test.js`
  - header / VLR / 判定ロジックの回帰テスト
- `README.md`
  - 機能概要と Server-Zero 境界の説明
- `PointCloudWorkbench_運用手順書.md`
  - 利用者向けの読み方、注意点、相手へ確認すべき項目
- `PointCloudWorkbench_実装リファレンス.md`
  - 解析対象 record、データ構造、テスト API の説明
- 必要なら `PointCloudWorkbench_ドキュメント索引.md`
  - 新規説明箇所への案内

## 実装順

### PR1: LAS header の不足項目を追加する

目的:
- VLR 読み取り範囲を安全に決められるようにする。

作業:
- `parseLASHeader()` に `headerSize` と `numberOfVariableLengthRecords` を追加する。
- LAS 1.4 header では `globalEncoding`、`startOfFirstExtendedVariableLengthRecord`、`numberOfExtendedVariableLengthRecords` も読む。
- `pointDataOffset` と `headerSize` の妥当性チェックを追加する。
- point format 6-10 では WKT が必須になり得るため、WKT bit と WKT record の有無を診断材料として保持する。
- 既存の header preview が壊れないことを確認する。

テスト:
- LAS header fixture で `globalEncoding`、`headerSize`、`numberOfVariableLengthRecords`、`pointDataOffset`、EVLR offset / count を読めること。
- 異常な offset の場合に VLR 解析へ進まないこと。
- point format 6-10 で WKT record がない場合、点群表示ではなく CRS 診断に警告が出ること。

### PR2: VLR / EVLR 抽出を追加する

目的:
- point data へ入る前の VLR 領域と、LAS 1.3 / 1.4 の EVLR 領域を bounded slice 読みし、CRS 候補を取得できるようにする。

作業:
- `readLASVlrSectionFromFile()` 相当の関数を追加する。
- `readLASEvlrSectionFromFile()` 相当の関数を追加する。
- VLR header を順に読み、`userId`、`recordId`、`recordLengthAfterHeader`、`description`、payload を抽出する。
- EVLR header を順に読み、8 byte record length を安全な上限内で扱う。EVLR offset から file end まで一括 slice しない。
- VLR 数と `pointDataOffset` を超えない範囲で読みを止める。
- EVLR は `startOfFirstExtendedVariableLengthRecord`、file size、record count、診断用 byte cap を超えない範囲で読みを止める。
- 破損 VLR では例外で読み込み全体を落とさず、診断結果に警告を残す。

テスト:
- 複数 VLR / EVLR を持つ fixture を読めること。
- `LASF_Projection` 以外の VLR を無視または raw summary に留めること。
- record length が範囲外の VLR で安全に停止すること。
- record length が大きすぎる EVLR で全量読み込みに進まないこと。
- 非 CRS EVLR の巨大 payload を読まないこと。
- record 数や byte 数の上限到達時に `diagnostic-limit-reached` 相当の警告を残すこと。

### PR3: WKT / GeoTIFF / EPSG 候補解析を追加する

目的:
- CRS 診断に必要な最小情報を抽出する。

作業:
- `recordId 2112` から WKT 文字列を抽出する。
- `recordId 2111` の Math Transform WKT は適用せず、存在と注意だけを診断へ残す。
- `recordId 34735 / 34736 / 34737` から GeoTIFF key を解析する。
- GeoTIFF の `ProjectedCSTypeGeoKey`、`GeographicTypeGeoKey`、`VerticalCSTypeGeoKey`、`ProjLinearUnitsGeoKey`、`VerticalUnitsGeoKey` を候補として扱う。
- GeoAsciiParamsTag は pipe 区切り文字列として扱い、key directory の offset / count 参照を検証する。
- WKT1 と WKT2 の両方を対象にし、`AUTHORITY["EPSG", "..."]`、`ID["EPSG", ...]`、`UNIT`、`LENGTHUNIT`、`VERT_CS`、`VERTCRS` を候補として抽出する。
- EPSG 候補は、CRS の EPSG と unit / datum / method の EPSG を混同しないよう、horizontal / vertical / unit / other に分ける。
- 複数候補がある場合は horizontal / vertical / unknown に分ける。

テスト:
- WKT から EPSG 候補を抽出できること。
- GeoTIFF key から EPSG 候補を抽出できること。
- WKT と GeoTIFF が両方ある場合に両方の存在を保持すること。
- `EPSG:9001` のような単位コードを水平 CRS と誤判定しないこと。
- WKT2 の `LENGTHUNIT` / `ID` と WKT1 の `UNIT` / `AUTHORITY` の両方を扱えること。

### PR4: CRS 診断データ構造と判定文を追加する

目的:
- UI と docs で使える安定した判定結果を作る。

作業:
- `buildCoordinateReferenceDiagnostics(header, vlrs)` 相当の純粋関数を追加する。
- 判定を次のように分ける。
  - `usable-horizontal-crs`: 水平 CRS と単位の候補がある
  - `missing-horizontal-crs`: 水平 CRS が見つからない
  - `vertical-unknown`: 水平 CRS はあるが高さ基準が不明
  - `complete-crs-metadata`: 水平 CRS、垂直 CRS、高さ基準、単位の候補が揃う
- 表示文は断定を避け、検出値と注意を分ける。
- `parse-warning` は可能なら単独 status ではなく warnings として併記し、水平 CRS の有無など主判定を失わないようにする。

テスト:
- CRS なしの LAS は「位置特定不可」と出ること。
- 水平 CRS だけの LAS は「平面位置に使える可能性あり / 高さ基準は要確認」と出ること。
- 垂直 CRS もある LAS は「土木成果として確認しやすい」と出ること。
- 解析警告があっても、抽出済みの水平 CRS 判定が失われないこと。

### PR5: UI に CRS 診断を表示する

目的:
- 利用者が読み込み直後に CRS の有無と注意点を確認できるようにする。

作業:
- 統計パネルまたはファイル情報パネルに「座標情報」カードを追加する。
- 表示項目を絞る。
  - 水平 CRS
  - EPSG 候補
  - WKT
  - GeoTIFF
  - 垂直 CRS / 高さ基準
  - 単位
  - 判定
- 不明な項目は `不明` と表示する。
- `X/Y/Z だけでは地球上の位置は確定しません` という注意を必要時に出す。
- point format 6-10 なのに WKT がない場合は、LAS 1.4 CRS 表現として不整合の可能性がある旨を出す。
- WKT と GeoTIFF が矛盾する可能性がある場合は、WKT 優先で表示しつつ「複数 CRS 候補あり」と出す。
- 問い合わせ文コピーを実装する場合は、既存の clipboard pattern に合わせ、ローカルファイル名、点群 payload、座標配列を含めない。

テスト:
- CRS 診断カードが header / VLR 診断結果を反映すること。
- CRS なしのときに空欄ではなく `不明` と注意が出ること。
- UI 表示が既存の統計更新を壊さないこと。

### PR6: 文書を同期する

目的:
- 機能の限界を利用者と開発者の両方に明示する。

作業:
- README に CRS 診断の概要と Server-Zero 境界を追記する。
- 運用手順書に、発注者や測量会社へ確認する項目を追記する。
- 実装リファレンスに VLR / WKT / GeoTIFF / EPSG 解析の責務を追記する。
- 必要ならドキュメント索引に CRS 診断の案内を追加する。

テスト:
- `bun test scripts/pointcloud-workbench.test.js scripts/documentation-consistency.test.js`
- `bun scripts/check-readme.js`

## 最小テストコマンド

```bash
bun test scripts/pointcloud-workbench.test.js
```

## フル確認コマンド

```bash
bun test scripts/pointcloud-workbench.test.js scripts/documentation-consistency.test.js scripts/gitignore.test.js scripts/repository-metadata.test.js scripts/public-repo-readiness.test.js scripts/landing-page-i18n.test.js
bun scripts/check-readme.js
bun scripts/check-server-zero.js
```

## 完了条件

- CRS あり / CRS なし / 水平のみ / 水平 + 垂直の fixture で診断結果がテストされている。
- LAS / LAZ の通常読み込み、preview、統計表示が壊れていない。
- UI が「検出値」「推測」「不明」「外部確認が必要」を区別して表示する。
- docs が「この機能でできること」と「できないこと」を明記している。
- Server-Zero 方針に反する依存、アップロード経路、外部 API が追加されていない。

## 追加レビューで修正したリスク

- EVLR を初期計画から落としていたため、LAS 1.4 の CRS を見逃す可能性があった。VLR と EVLR の両方を bounded slice で扱う方針へ修正した。
- EVLR を offset から file end まで読む設計に見える余地があった。EVLR header を先に読み、projection record payload だけを上限付きで読む方針へ修正した。
- point format 6-10 と Global Encoding WKT bit の扱いが弱かった。WKT 必須系の不整合を診断警告として扱う。
- `survey-safe` は安全断定に見えるため、内部 status 名を `complete-crs-metadata` に変更する。成果簿照合が必要な点は維持する。
- WKT 内の EPSG 抽出で unit code や datum code を CRS code と誤判定するリスクがあった。EPSG 候補を horizontal / vertical / unit / other に分ける。
- Math Transform WKT `2111` を見落としていた。変換は適用しないが、存在と注意を診断へ残す。
- `parse-warning` が主判定を上書きすると利用者に情報が伝わりにくい。警告は主判定に併記する設計へ寄せる。
- docs / README 同期対象として `docs/README.ja.md` と `scripts/documentation-consistency.test.js` も実装計画に含める。

## OSS 活用方針

詳細調査: `docs/crs-diagnostics-oss-research.ja.md`

- 初期実装では、LAS VLR 読み取り、WKT record 抽出、GeoTIFF key の最小解析を自前実装する。
- `@loaders.gl/las` は LAS v1.4 非対応の制約があり、既存 loader 置換には使わない。
- `geotiff` は GeoTIFF raster decoder としては強いが、LAS VLR 内の小さな GeoTIFF key 解析には過剰なため使わない。
- `proj4` は座標変換用であり、CRS 診断だけの初期スコープには入れない。
- WKT 方言対応で不足が出た場合のみ、軽量な `wkt-crs` の限定導入を検討する。
