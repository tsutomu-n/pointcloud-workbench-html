# PointCloudWorkbench 現状と実装済み機能

timestamp="2026-11-20(金)_22:54 JST"

> 履歴資料。記載時点の監査・計画・実装情報です。現行文書は[ドキュメント索引](../PointCloudWorkbench_ドキュメント索引.md)を参照してください。

作成日時: 2026-06-02_10:25 JST
更新日時: 2026-06-03_09:06 JST

確認対象:

- 主成果物: `PointCloudWorkbench.html`
- 確認時の作業ツリー: 文書追加前は `git status --short --branch` が `## main...origin/main`

## 1. 結論

このリポジトリは、単一 HTML で配布する LAS/LAZ 点群ワークベンチです。
現在の実装は「Client-Max / Server-Zero」を前提にしており、点群ファイルの選択、ヘッダー先読み、LAS/LAZ 読み込み、点群表示、診断、取得品質確認、CRS metadata 確認、地図リンク生成、作業メモコピーをブラウザー内で行います。

サーバー側の役割は静的ファイル配信に限定されています。
LAS/LAZ ファイル本体、ローカルファイル名、点群 payload、元 LAS 座標配列をアプリケーションサーバーへ送信する実装はありません。

## 2. リポジトリの現在地

### 2.1 配布形態

- `PointCloudWorkbench.html` がアプリ本体です。
- UI、CSS、主要 JavaScript は同じ HTML 内にあります。
- ビルド工程はありません。
- ローカル実行は Chrome または Edge で `PointCloudWorkbench.html` を開きます。
- GitHub Pages では `index.html` がランディングページ、`PointCloudWorkbench.html` がアプリ本体として配信されます。
- Cloudflare Pages 向けには `_headers`、`_redirects`、`assets/` 配下の static manifest を持ちます。

### 2.2 主要ファイル

| パス | 役割 |
|---|---|
| `PointCloudWorkbench.html` | 単一ファイルアプリ本体。UI、スタイル、描画、読み込み、診断、公開 API を含む |
| `index.html` | GitHub Pages 用ランディングページ |
| `demo/pointcloud-demo-sample.las` | Pages demo 用の同梱 LAS サンプル |
| `README.md` | 日本語の主要 README |
| `docs/README.ja.md` | 日本語 README |
| `docs/README.en.md` | 英語 README |
| `docs/runtime-model.ja.md` | 実行モデル説明 |
| `docs/architecture-client-max.ja.md` | Client-Max / Server-Zero 方針 |
| `PointCloudWorkbench_運用手順書.md` | 運用者向け手順 |
| `PointCloudWorkbench_実装リファレンス.md` | 開発者向け実装リファレンス |
| `PointCloudWorkbench_ドキュメント索引.md` | 日本語ドキュメント入口 |
| `scripts/pointcloud-workbench.test.js` | HTML 内 inline script と公開 test hooks の Bun 回帰テスト |
| `scripts/documentation-consistency.test.js` | README とガイドの整合性テスト |
| `scripts/public-repo-readiness.test.js` | 公開 repo と static-only 方針の readiness テスト |
| `scripts/e2e/run-diagnostics-smoke.mjs` | Playwright による LAS/LAZ 診断 smoke 用スクリプト |

### 2.3 検証資産

現在の自動検証は Bun ベースです。
主要な検証対象は、点群読み込み、CRS 診断、診断レポート、取得品質、地表候補、表示モード、計測、読み込みキャンセル、README 整合性、公開 repo readiness です。

代表コマンド:

```sh
bun test scripts/pointcloud-workbench.test.js scripts/documentation-consistency.test.js scripts/public-repo-readiness.test.js scripts/gitignore.test.js scripts/repository-metadata.test.js
bun scripts/check-readme.js
```

追加の UI smoke には Playwright 用の次の入口があります。

```sh
bunx --package playwright node scripts/e2e/run-diagnostics-smoke.mjs --las samples/test.las --laz samples/test.laz
```

## 3. 実行モデル

### 3.1 基本方針

このアプリは、点群処理をユーザー PC 側へ寄せます。
サーバー側では LAS/LAZ を受け取らず、解析せず、保存せず、自動ログ収集もしません。

ユーザーが明示的にコピーした診断 JSON や作業メモ JSON だけが、Issue などへ貼り付け可能な手動共有物になります。
その JSON にも、ローカルファイル名、LAS/LAZ 本体、点群 payload、元 LAS 座標配列は含めません。

### 3.2 Runtime mode 表示

ファイル選択画面では、現在の runtime capability を表示します。
表示対象は、実行モード、ブラウザー種別、renderer 候補、Worker 可否、isolation 状態などです。
これは実行環境の能力表示であり、現行実装が Worker parser や WebGPU renderer を使っているという意味ではありません。

実装上の mode は大きく次の分類です。

- Portable Online Mode: ローカルの HTML をブラウザーで開く想定
- Hosted High Performance Mode: HTTPS 配信、COOP/COEP などの header を利用できる配信想定
- Fallback Mode: renderer やブラウザー能力に制約がある場合の劣化表示

## 4. 入力と読み込み

### 4.1 対応入力

- `.las`
- `.laz`

対応ブラウザーは Chrome / Edge の最新版です。
Safari、Firefox、古いブラウザーは対応対象外です。

### 4.2 ファイルサイズ上限

形式ごとの上限は分かれています。

| 形式 | 上限 | 境界動作 |
|---|---:|---|
| LAS | 3GB 超を拒否 | 3GB ちょうどは `critical` 扱いで継続可能 |
| LAZ | 2GB 超を拒否 | 2GB ちょうどは `critical` 扱いで継続可能 |

LAS の `2GB 超から 3GB 以下` は experimental な運用帯です。
この帯では `LOW` 品質から始め、メモリ使用量と応答性を確認する前提です。

### 4.3 Preflight

読み込み前に、ファイルヘッダー、読み込み経路、リスク、推定表示率を確認できます。
`analyzeSelectedFilePreview` はヘッダーを先読みし、元点数と品質設定に基づく表示率を出します。

### 4.4 LAS 読み込み

ローカル LAS は full `ArrayBuffer` を避け、`slice()` と `FileReader` による chunked point-data reads を使います。
`parseLASHeaderFromFile()` でヘッダーだけを先読みし、`parseLASPointsFromFile()` で品質設定に沿って等間隔サンプリングします。

主な実装済み要素:

- LASF シグネチャ検証
- LAS 1.4 の 64-bit 点数対応
- `pointDataRecordFormat` の LAZ 圧縮 bit 正規化
- scale / offset 適用済み座標の生成
- point format に応じた分類値読み取り
- サイズ依存 timeout
- キャンセルと stale load の隔離

### 4.5 LAZ 読み込み

LAZ は `laz-perf` と WASM を使います。
ローカル LAZ は `readFileIntoWasmHeap()` で file slice を WASM heap へ chunk 転送し、JS 側の大きな full `ArrayBuffer` 重複を抑えます。
展開後は品質上限に合わせてサンプリングします。

## 5. 点群データモデル

### 5.1 ReaderRegistry

`ReaderRegistry` は LAS と LAZ の local reader を公開します。
入力形式ごとに reader を選び、読み込み経路を分岐します。

### 5.2 PointCloudData

`PointCloudData` 相当の summary は、元点数、デコード点数、表示点数、bounds、scale/offset 基準を整理します。
表示点数と元点数の比率は、品質設定や統計パネルで確認できます。

### 5.3 座標変換

描画用座標は、元 LAS/LAZ 座標を中心基準へ移して Three.js 用に変換します。
計測用の元座標は描画 attribute ではなく、`pointCloud.userData.sourcePositions` に保持します。
そのため、距離計測では表示点に snap しつつ、元 LAS 座標ベースの `dX / dY / dZ` を出せます。

## 6. 表示機能

### 6.1 3D / 2D 表示

3D 表示は Three.js を使います。
`window.set2DView()` と `window.exit2DView()` により、2D ビューと 3D 復帰を操作できます。

実装済みの視点操作:

- reset view
- top view
- side view
- back view
- move closer / move away
- fit to view
- OrbitControls によるマウス操作

### 6.2 色分け

実装済みの色分け mode は次の 2 つです。

- `height`: 標高色分け
- `classification`: LAS 分類色分け

分類表示では分類品質を確認し、凡例を更新します。
分類が薄い場合は警告や自動分類補助の導線があります。

### 6.3 スライスと 2D 断面

スライス表示は `window.toggleSlicing()`、`updateSlicing()`、`window.show2DSliceView()` で制御されます。
2D 断面 modal では、厚み、点サイズ、自動厚み調整、canvas export の導線があります。

### 6.4 統計パネル

統計パネルでは、点数、LAS header、bounds、分類内訳、読み込み時間、処理時間、密度、読み込み profile、CRS 診断、取得品質、診断 summary を確認できます。
診断 / 異常候補では、表示点ベースの密度ヒートマップ overlay を ON/OFF し、透明度と凡例を確認できます。

### 6.5 距離計測

距離計測は表示中のサンプリング点へ snap します。
最大 20 件のページ内一時履歴を保持します。

表示・コピーされる値:

- 3D 距離
- 水平距離
- 高低差
- 元座標基準の `dX / dY / dZ`
- 始点 / 終点の元座標

距離は `m-equivalent` として表示されます。
実際の意味は元データの座標単位に依存します。

## 7. CRS 診断と位置確認

### 7.1 CRS metadata 読み取り

CRS 診断は LAS/LAZ 内の header / VLR / EVLR metadata をローカルで読みます。
点群 payload 全体やローカルファイル名をコピーまたは送信しません。

対象 record:

- Coordinate System WKT `2112`
- Math Transform WKT `2111`
- GeoTIFF GeoKeyDirectory `34735`
- GeoDoubleParams `34736`
- GeoAsciiParams `34737`

VLR は `headerSize` から `pointDataOffset` 直前までを上限付きで読みます。
EVLR は header を先に読み、projection 対象 record だけ payload を上限付きで読みます。

### 7.2 CRS summary

実装済みの summary:

- WKT1 / WKT2 の CRS 名称抽出
- 水平 CRS / 垂直 CRS / unit / other の EPSG 候補分類
- GeoTIFF key からの CRS / unit EPSG 候補抽出
- WKT と GeoTIFF の水平 CRS 候補 mismatch warning
- parse warning と主 status の分離

### 7.3 緯度経度変換

緯度経度変換は限定実装です。
対応範囲は JGD2011 平面直角座標系 `EPSG:6669` から `EPSG:6687` の bounds 中心だけです。

実装済み:

- `location.latLon.primary`
- `location.latLon.alternateAxis`
- `location.latLon.selectedAssumption`
- primary の Google Maps / 地理院地図リンク
- alternate-axis の Google Maps / 地理院地図リンク
- 外部リンク disclosure

重要な境界:

- 全点変換はしません。
- 住所逆引きはしません。
- EPSG database lookup はしません。
- map matching はしません。
- ジオイド補正はしません。
- サーバー側 CRS 処理はしません。
- 地図リンクはユーザーがクリックした時だけ外部サイトへ緯度経度を渡します。

### 7.4 X/Y 入れ替え候補

JGD2011 平面直角座標系では、運用データによって X/Y の扱いが混乱しやすいため、primary と alternate-axis の両方を出します。
アプリは自動断定しません。
ユーザーは Google Maps または地理院地図で、河川現場の想定位置に近い方を確認します。

## 8. 診断機能

### 8.1 手動診断レポート

`buildManualDiagnosticReport()` は、ローカル処理で診断 JSON を作ります。
含まれる主な情報:

- runtime summary
- file kind と file size bucket
- point count summary
- coordinate reference summary
- bounds
- lat/lon summary
- map link summary
- lineage
- attribute availability
- acquisition quality
- diagnostics candidates
- recent error summary

含めない情報:

- ローカルファイル名
- LAS/LAZ 本体
- 点群 payload
- 座標配列

### 8.2 作業メモコピー

`buildWorkAssistSnapshot()` は `schemaVersion: 1` の作業メモ JSON を作ります。
表示、断面、計測履歴、選択中の異常候補、取得品質、地表候補の要約を含みます。

これはページ内状態の手動コピー用です。
外部送信、ファイル書き込み、サーバー保存は行いません。

### 8.3 取得品質

取得品質は、LAS point record layout と sampled points の coverage を使う参考診断です。

確認する signal:

- return
- scan angle
- GPS time
- classification
- RGB / NIR
- scanner channel
- classification flags

PDRF `0-5` と `6+` では byte layout が違うため、decode 側で分岐します。
GPS-time monotonic ratio は warning signal であり、測量級の証明ではありません。

### 8.4 来歴と属性 availability

`buildLineageReport()` は LAS header から project id、system identifier、generating software、作成日、PDRF、VLR/EVLR 数を要約します。

`buildAttributeAvailabilityReport()` は point format と record length から、どの属性が利用可能かを推定します。
既知 baseline より record length が長い場合は、追加属性の可能性を warning として扱います。

### 8.5 密度・異常候補

実装済みの診断候補:

- density grid の low-density cell
- density spike cell
- empty interior cell
- 表示点ベースの密度ヒートマップ overlay
- Z outlier
- isolated point
- section profile
- ground candidate summary

候補は数を制限し、安定した順序で並べます。
copy payload には `warningCodes`、`score`、`scoreStatus` を含みます。
密度ヒートマップ overlay は既存の density grid を Three.js の X/Z 平面へ重ねる参考表示であり、元 LAS/LAZ 全点の厳密密度や測量成果としては扱いません。

### 8.6 warning code と score

診断 warning code は大文字・アンダースコアへ正規化し、既知コードだけを採用し、重複排除し、既定順序で返します。

代表コード:

- `CRS_MISSING`
- `CLASSIFICATION_*`
- `DISPLAY_RATIO_LOW`
- `DENSITY_*`
- `Z_OUTLIERS`
- `ISOLATED_POINTS`

score は warning code ごとの減点、section weight、total deduction を持ちます。

## 9. 地表候補アシスト

`buildGroundCandidateGrid()` は表示点ベースの参考地表候補を作ります。
class 2 ground が一定比率以上ある場合は ground 分類を優先し、分類が薄い場合は low-percentile grid の p05 Z に fallback します。

返す主な情報:

- method
- grid
- cells
- validCellRatio
- groundPointCount
- nonGroundPointCount
- confidence
- warnings

warning:

- `GROUND_CLASS_MISSING`
- `GROUND_CLASS_SPARSE`
- `GROUND_GRID_HOLES`
- `GROUND_ESTIMATE_LOW_CONFIDENCE`

未実装の後続候補:

- HAG 点属性付与
- DTM メッシュ表示
- 地表 / 非地表表示切替
- 勾配
- 土量
- 差分

## 10. 分類補助

分類表示は既存分類を色分けして確認します。
`autoClassify()` は高さベースの補助分類を行います。
これは測量級分類の保証ではありません。

分類関連で実装済みの確認:

- class `0` と `1` の未分類扱い
- 分類内訳
- 分類品質表示
- 凡例生成
- 自動分類後の統計更新

## 11. UI と操作補助

### 11.1 キーボードと modal

実装済み:

- キーボード操作
- キーボード help modal
- confirm dialog
- toast
- focus restoration
- stats panel toggle
- controls panel toggle
- right panel layout adjustment

### 11.2 メモリ・性能監視

`MemoryMonitor` と `PerformanceMonitor` が実装されています。
メモリ圧や FPS 低下時には、表示点数の間引きや点サイズ調整などの劣化処理を行います。

### 11.3 エラー追跡

`ErrorTracker` は global error と unhandled rejection を収集し、重大系の回復 UI を出します。
手動診断レポートには、recent error summary として短い情報だけを入れます。

## 12. 公開 API

`window.*` は互換性 surface として扱います。
主な公開 API は次の通りです。

### 12.1 ワークフロー

- `loadSampleData`
- `proceedToQualitySelection`
- `startDataLoading`
- `cancelLoading`
- `goBackToFileSelect`
- `openFilePickerFromNav`
- `goHome`

### 12.2 ビュー操作

- `set2DView`
- `exit2DView`
- `resetView`
- `topView`
- `sideView`
- `backView`
- `moveCloser`
- `moveAway`
- `fitToView`
- `setColorMode`

### 12.3 機能操作

- `toggleLegendPanel`
- `toggleSlicing`
- `show2DSliceView`
- `resetSlicing`
- `toggleCADMode`
- `autoClassify`
- `copyCrsInquiryText`
- `copyWorkAssistSnapshot`
- `setDensityOverlayEnabled`
- `toggleDensityOverlay`
- `setDensityOverlayOpacity`

### 12.4 開発・保守補助

- `debugClassification`
- `refreshClassificationStats`
- `testClassificationMode`
- `toggleStatsPanel`
- `toggleControlsPanel`
- `performFinalCleanup`

テスト用には `window.__pcwTestApi` もあります。
これは `window.__PCW_ENABLE_TEST_API__` が有効な時だけ公開されます。

## 13. 外部依存

runtime は CDN 配信のライブラリに依存します。

- `three.js r128`
- `laz-perf`
- `simple-statistics`
- `Flatbush`
- `simpleheat`
- `proj4js`

`proj4js` は固定 CDN URL と Subresource Integrity で読み込みます。
CDN 未到達または SRI 不一致の場合、緯度経度リンク生成は無効化されます。

## 14. CI / 公開 repo readiness

`.github/workflows/` には次の workflow があります。

- `ci.yml`
- `deploy-pages.yml`
- `diagnostics-smoke.yml`

公開 repo readiness は、README、CONTRIBUTING、static-only 方針、GitHub Actions、Pages demo assets、runtime mode summary UI、test hooks を確認します。

## 15. 実装済みではないこと / 禁止していること

この repo の現状で、次は実装済み機能ではありません。
また、方針上追加しない対象として扱われています。

- LAS/LAZ のサーバーアップロード
- サーバー側点群処理
- サーバー側 LAZ 展開
- サーバー側 CRS 処理
- geocoding
- EPSG database lookup
- map matching
- telemetry
- 自動ログ収集
- DB 書き込み
- Worker parser
- WebGPU renderer
- OPFS / IndexedDB キャッシュ
- アプリ内の地図タイル表示
- ユーザー管理
- セッション管理
- 点群 payload の自動共有
- ローカルファイル名の診断 JSON への混入
- 測量成果として保証する DTM / 土量 / 差分

## 16. 保守時の注意

### 16.1 単一 HTML の維持

この repo は単一 HTML 配布を前提にしています。
ビルドパイプラインや分割 bundle を導入する場合は、配布契約そのものが変わるため、事前に設計判断が必要です。

### 16.2 docs 同時更新

挙動を変更した場合は、関連する docs も同時に更新します。

主な対応:

- 操作仕様変更: `PointCloudWorkbench_運用手順書.md`
- 内部処理変更: `PointCloudWorkbench_実装リファレンス.md`
- 公開説明変更: `README.md`, `docs/README.ja.md`, `docs/README.en.md`
- CRS 診断変更: CRS 関連 spec / plan docs

### 16.3 最小検証

通常の docs / HTML 変更後は、少なくとも次を確認します。

```sh
bun test scripts/pointcloud-workbench.test.js scripts/documentation-consistency.test.js scripts/public-repo-readiness.test.js scripts/gitignore.test.js scripts/repository-metadata.test.js
bun scripts/check-readme.js
```

UI に影響する変更では、LAS/LAZ の browser smoke も行います。

## 17. この文書の位置づけ

この文書は「現在の状態と実装済み機能」を説明するための overview です。
関数単位の追跡は `PointCloudWorkbench_実装リファレンス.md`、操作手順は `PointCloudWorkbench_運用手順書.md`、設計方針は `docs/architecture-client-max.ja.md` と `docs/runtime-model.ja.md` を正とします。
