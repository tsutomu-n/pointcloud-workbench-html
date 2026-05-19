# CRS 診断 最終形仕様定義

更新日: 2026-05-19

## 目的

PointCloudWorkbench の最終形では、利用者が LAS / LAZ を読み込んだ直後に、そのファイルが地球上の位置や高さ基準を判断するための情報を持っているかを確認できるようにする。

この仕様の中心は「座標変換」ではなく「座標参照情報の可視化と安全な判定」である。

## 最終形の利用者価値

- LAS / LAZ に CRS が入っているかを画面上で確認できる。
- EPSG、WKT、GeoTIFF の有無を確認できる。
- 水平位置を特定できる可能性があるかを判断できる。
- Z 値を標高として扱えるか、外部確認が必要かを判断できる。
- 測量会社、発注者、協力会社へ確認すべき項目をその場で把握できる。
- CRS がないファイルを、座標値だけで安全に使えると誤認しにくくなる。

## 対象ファイル形式

### 対象

- `.las`
- `.laz`

### 対象外

- `.ply`
- `.e57`
- `.xyz`
- 外部 `.prj`
- XML メタデータ
- 測量成果簿
- UAV 測量成果報告書

外部ファイルは将来拡張候補とするが、最終形 v1 では自動読み込みしない。

## CRS 情報の入力元

### LAS header

- LAS version
- point data format
- point data offset
- VLR count
- scale factor
- offset
- min / max X, Y, Z

### VLR / EVLR

最終形 v1 では VLR と EVLR の両方を診断対象にする。EVLR は LAS 1.3 / 1.4 で point data 後に置かれるため、`startOfFirstExtendedVariableLengthRecord` を使う。ただし EVLR offset から file end まで一括で読まない。EVLR header を逐次読み、projection record の payload だけを診断上限内で読む。

優先して読む record:

- `LASF_Projection` / `2111`: OGC Math Transform WKT
- `LASF_Projection` / `2112`: OGC WKT
- `LASF_Projection` / `34735`: GeoKeyDirectoryTag
- `LASF_Projection` / `34736`: GeoDoubleParamsTag
- `LASF_Projection` / `34737`: GeoAsciiParamsTag

`2111` は存在を表示するが、座標変換としては適用しない。

### WKT

検出対象:

- `PROJCRS`
- `GEOGCRS`
- `VERTCRS`
- `COMPOUNDCRS`
- `UNIT`
- `LENGTHUNIT`
- `AUTHORITY["EPSG", "..."]`
- `ID["EPSG", ...]`
- `VERT_CS`
- `JGD2011`
- `JGD2000`
- `WGS 84`
- `Tokyo Peil`
- `T.P.`
- `ellipsoidal height`

### GeoTIFF

検出対象:

- `ProjectedCSTypeGeoKey`
- `GeographicTypeGeoKey`
- `VerticalCSTypeGeoKey`
- `ProjLinearUnitsGeoKey`
- `VerticalUnitsGeoKey`
- GeoAsciiParams

GeoTIFF の EPSG 候補は、水平 CRS、垂直 CRS、単位、その他に分ける。`EPSG:9001` のような単位コードを水平 CRS として表示しない。

## 画面表示

### 表示場所

統計パネル、またはファイル情報パネル内に `座標情報` カードを表示する。

### 表示項目

- 判定
- 水平 CRS
- 垂直 CRS / 高さ基準
- EPSG 候補
- WKT
- GeoTIFF
- Math Transform WKT の有無
- 単位
- scale / offset
- 座標範囲
- LAS version / point format / WKT bit の整合
- 注意事項

### 表示例

CRS が十分にある場合:

```text
判定: 位置特定に使える可能性があります
水平CRS: JGD2011 / Japan Plane Rectangular CS IX
EPSG候補: EPSG:6677
WKT: あり
GeoTIFF: なし
高さ基準: 不明
注意: Z値を標高として使うには成果簿または垂直CRSを確認してください。
```

CRS がない場合:

```text
判定: CRS 不明のため、地球上の位置は特定できません
水平CRS: 不明
EPSG候補: 不明
WKT: なし
GeoTIFF: なし
高さ基準: 不明
注意: X/Y/Z 座標だけでは、公共座標かローカル座標か判定できません。
```

水平 CRS と垂直 CRS が揃う場合:

```text
判定: 水平位置と高さ基準を確認できます
水平CRS: JGD2011 / Japan Plane Rectangular CS IX
垂直CRS: Tokyo Peil height
EPSG候補: EPSG:6677, EPSG:6695
WKT: あり
GeoTIFF: あり
単位: metre
注意: 最終成果として使う前に、成果簿の座標系指定と一致するか確認してください。
```

## 判定ステータス

### `missing-horizontal-crs`

条件:
- 水平 CRS、EPSG、WKT、GeoTIFF の有力情報が見つからない。

表示:
- `CRS 不明のため、地球上の位置は特定できません`

### `usable-horizontal-crs`

条件:
- 水平 CRS または水平 EPSG 候補がある。
- 単位候補がある、または WKT / GeoTIFF から metre 相当と判断できる。

表示:
- `位置特定に使える可能性があります`

注意:
- 高さ基準が不明なら、Z 値は標高として断定しない。

### `vertical-unknown`

条件:
- 水平 CRS はある。
- 垂直 CRS、高さ基準、垂直単位が見つからない。

表示:
- `平面位置は確認できますが、高さ基準は不明です`

### `complete-crs-metadata`

条件:
- 水平 CRS がある。
- 垂直 CRS または高さ基準がある。
- 単位がある。
- WKT / GeoTIFF / EPSG のいずれかで裏付けがある。

表示:
- `水平位置と高さ基準を確認できます`

注意:
- それでも成果簿との照合は必要とする。

### `parse-warning`

条件:
- VLR / EVLR が壊れている。
- record length が不正。
- WKT の文字列抽出に失敗した。
- GeoTIFF key の解釈が途中で止まった。

表示:
- `座標情報の一部を解析できませんでした`

扱い:
- `parse-warning` は、可能な限り主 status を上書きしない。例えば水平 CRS が検出できていて一部 GeoTIFF key だけ壊れている場合は、主 status を維持し、警告として併記する。

### `crs-mismatch-warning`

条件:
- WKT と GeoTIFF の CRS 候補が矛盾する。
- point format 6-10 なのに WKT record が見つからない。
- Global Encoding の WKT bit と WKT record の存在が矛盾する。

表示:
- `座標系情報に不整合の可能性があります`

## コピー用確認文

最終形では、利用者が相手に送れる確認文を表示またはコピーできるようにする。

```text
LAS/LAZ ファイルの座標系をご教示ください。

確認したい内容は以下です。

・測地系: JGD2011 / JGD2000 / WGS84 など
・投影座標系: 平面直角座標系の場合は第何系か
・EPSGコード
・高さ基準: T.P.標高 / 楕円体高 など
・単位: mでよいか
・LAS/LAZ 内に CRS が埋め込まれているか
・別途 .prj、測量成果簿、メタデータがあるか

特に、Z値を標高として使用可能か確認したいです。
```

## 非目標

最終形 v1 でも、次は行わない。

- LAS / LAZ のアップロード
- サーバー側点群処理
- 外部 API による EPSG 解決
- 住所や地名の自動推定
- 地図タイル表示
- 緯度経度変換
- CRS の自動補正
- 成果簿の真偽判定

## 内部データモデル

```js
{
  status: "missing-horizontal-crs" |
    "usable-horizontal-crs" |
    "vertical-unknown" |
    "complete-crs-metadata",
  confidence: "high" | "medium" | "low",
  horizontal: {
    detected: true,
    name: "JGD2011 / Japan Plane Rectangular CS IX",
    epsg: ["6677"],
    source: "wkt"
  },
  vertical: {
    detected: false,
    name: null,
    epsg: [],
    heightBasis: null,
    source: null
  },
  units: {
    horizontal: "metre",
    vertical: null
  },
  rawSources: {
    hasWkt: true,
    hasGeoTiff: false,
    hasMathTransformWkt: false,
    vlrCount: 2,
    evlrCount: 0,
    globalEncodingWktBit: true,
    pointDataRecordFormat: 6
  },
  epsgCandidates: {
    horizontal: ["6677"],
    vertical: [],
    unit: ["9001"],
    other: []
  },
  warnings: [
    "高さ基準は LAS/LAZ 内から確認できませんでした。"
  ],
  warningCodes: [
    "parse-warning"
  ]
}
```

## 品質基準

- CRS がないファイルを「位置特定可能」と表示しない。
- 水平 CRS だけで Z の高さ基準まで断定しない。
- `complete-crs-metadata` でも「成果として安全」とは断定しない。
- EPSG の単位コード、datum code、method code を水平 CRS code と混同しない。
- LAS 1.4 point format 6-10 では WKT がない状態を不整合として警告する。
- EVLR にしか CRS がない LAS 1.4 を CRS なしと誤判定しない。
- EVLR 解析は record header 先読みと byte cap を必須にし、巨大 EVLR や非 CRS EVLR の payload を不用意に読まない。
- WKT / GeoTIFF の raw 情報を過剰に画面へ出さず、利用者には要約を出す。
- 詳細確認が必要な利用者には、展開表示またはコピー用テキストで確認できるようにする。
- コピー用確認文には、ローカルファイル名、点群 payload、座標配列を含めない。
- 解析失敗はアプリ全体の読み込み失敗にしない。点群表示は可能な限り継続する。

## 検証基準

- CRS なし fixture
- WKT のみ fixture
- GeoTIFF のみ fixture
- WKT + GeoTIFF fixture
- EVLR WKT fixture
- 水平 CRS のみ fixture
- 水平 CRS + 垂直 CRS fixture
- 壊れた VLR fixture
- point format 6-10 かつ WKT なし fixture
- WKT と GeoTIFF の候補不一致 fixture
- EPSG:9001 など単位 EPSG を含む WKT fixture
- 巨大な非 CRS EVLR fixture
- EVLR offset が file size 外または不正な fixture
- コピー用確認文がファイル名や点群 payload を含まないこと

上記に対して、判定ステータス、表示文、警告文、既存読み込みフローへの影響をテストする。

## 完了条件

- ローカル LAS / LAZ の読み込み後、CRS 診断カードが表示される。
- CRS あり / なし / 高さ基準不明の違いが UI で分かる。
- コピー用確認文が利用者の問い合わせに使える内容になっている。
- 既存の距離計測、統計表示、色モード切替、ホーム復帰、再読み込みが壊れていない。
- README、運用手順書、実装リファレンスが仕様と一致している。
