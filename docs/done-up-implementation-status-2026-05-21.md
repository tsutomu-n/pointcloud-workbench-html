# `.tmp/done-up?.md` 実装ステータスレビュー

作成日: 2026-05-21  
対象仕様: `/home/tn/projects/pointcloud-workbench/.tmp/done-up?.md`  
対象実装: `PointCloudWorkbench.html` / `scripts/pointcloud-workbench.test.js` / README / 運用・実装ドキュメント  
想定読者: `.tmp/done-up?.md` を作成した実務者、または仕様レビュー担当者

---

## 1. 結論

`.tmp/done-up?.md` の 8〜15 は、現時点では **13 来歴、12 属性、11 取得品質、15 作業補助の一部が実装済みまたは一部実装済み**です。

一方で、仕様の中核である **8 地表候補DTM、9 勾配、10 土量、14 差分** はまだ未実装です。既存の密度グリッド、断面、計測、診断候補は基礎部品として利用できますが、`.tmp/done-up?.md` が求める「共通XYグリッド → DTM → 勾配/土量/差分」にはまだ到達していません。

総合判定:

| 分類 | 項目 |
|---|---|
| 実装済み | 13 来歴のMVP相当、12 属性のヘッダ/点形式ベース判定、11 取得品質のavailability + sampled coverage、診断コピーへの反映 |
| 一部実装済み | 15 作業補助、共通グリッドの一部、断面/計測/異常候補の作業メモ化 |
| 未実装 | 8 地表候補DTM、9 勾配、10 土量、14 差分、ROI保存、視点保存、断面保存、JSON import/export |

実務者向けの重要な見方:

- 現実装は「診断・確認・コピー」の段階まで進んでいる。
- 「解析成果を作る」段階、特に DTM / 勾配 / 土量 / 差分はまだ始まっていない。
- `15 作業補助` は「保存機能」ではなく、現時点では「作業メモコピー」に限定されたv1である。
- `11 取得品質` は実装済みだが、原案の source ID 別統計、return比率詳細、scan angle p95、GPS discontinuity までは未実装である。

---

## 2. 判定基準

このレビューでは、原案の意図に対して次の基準で判定します。

| 判定 | 意味 |
|---|---|
| 実装済み | 原案MVPまたは主要目的を、利用者が実際に使える機能として満たしている。テストまたは実動確認がある |
| 一部実装済み | 関連する部品や限定版はあるが、原案が求める保存、解析、UI、出力型の中核が不足している |
| 未実装 | 原案の目的を満たすユーザー機能、解析関数、UI、テストが確認できない |

注意:

- 「関連部品がある」だけでは実装済みにしない。
- 「表示点ベース」の診断と「全点/ROI/DTMベース」の解析は分けて判定する。
- `.tmp/done-up?.md` は設計案として広く、現実装は単一HTML・ローカル処理・Server-Zero 方針を維持している。

---

## 3. 8〜15 ステータス一覧

| No | 項目 | 現判定 | 実装済みの範囲 | 不足している範囲 |
|---:|---|---|---|---|
| 8 | 地表候補: 簡易DTM・地表/非地表分離 | 未実装 | class 2 ground の分類統計、断面の groundOnly、密度グリッドは存在 | `GroundCandidateReport`、DTMグリッド、p05/p10、3x3 smoothing、HAG、地表/非地表表示切替がない |
| 9 | 勾配: 法面・排水・急変箇所 | 未実装 | 2点計測で dZ / 水平距離は取得可能 | DTM中央差分、slopePercent、法勾配1:n、急変セル、排水注意候補、勾配ヒートマップがない |
| 10 | 土量: 概算体積・切盛差分 | 未実装 | 計測履歴、断面、密度候補はある | ROI、基準面、cut/fill/net、VolumeReport、有効セル率、信頼度表示がない |
| 11 | 取得品質: return / scan angle / GPS time / source ID | 一部実装済みから実装済み寄り | return / scanAngle / gpsTime の有無、sampled coverage、GPS monotonic warning、手動診断JSON反映 | return比率詳細、scan angle p95、高角度比率、GPS duration/discontinuity、source ID 別統計/色分けは未実装 |
| 12 | 属性: RGB / intensity / NIR | 一部実装済み | 点形式とrecord lengthから RGB / NIR / waveform / scannerChannel / classificationFlags / Extra Bytes有無を推定 | RGB表示、intensity表示/ヒストグラム、NIR/NDVI、RGB 8/16bit正規化、Extra Bytes定義読解は未実装 |
| 13 | 来歴: LAS version / software / VLR / Extra Bytes | 実装済み寄り | projectId、systemIdentifier、generatingSoftware、作成日、PDRF、record length、VLR/EVLR数、CRS診断との連携 | VLR/EVLR一覧の詳細分類、Extra Bytes定義の名前/型/scale/offset読解は未実装 |
| 14 | 差分: 時系列比較・進捗確認 | 未実装 | なし。CRS診断や密度グリッドは将来の前提部品 | 2ファイル同時保持、CRS/単位/高さ基準一致チェック、共通グリッド、dzヒートマップ、変化面積/体積がない |
| 15 | 作業補助: ROI・視点保存・断面保存・メモ | 一部実装済み | `作業メモコピー` で現在の表示、断面、計測、異常候補、取得品質をJSONコピー | ROI保存、視点保存、断面保存、メモ保存、workspace JSON export/import、ファイル指紋照合は未実装 |

---

## 4. 実装済みとして見てよいもの

### 4.1 13 来歴: MVP相当は実装済み

原案MVP:

```txt
1. LAS version
2. point format
3. point record length
4. generating software
5. creation date
6. VLR/EVLR一覧
7. Extra Bytes有無
8. WKT/GeoTIFF有無
```

現実装で確認できること:

- `buildLineageReport()` が header 由来の来歴情報をまとめる。
- `parseLASHeader()` が `systemIdentifier`, `generatingSoftware`, `projectId`, `fileCreationDayOfYear`, `fileCreationYear`, `pointDataRecordFormat`, `pointDataRecordLength`, VLR/EVLR 数を読む。
- CRS診断側で WKT / GeoTIFF / VLR / EVLR の bounded read が実装済み。
- `buildManualDiagnosticReport()` に `lineage` が含まれる。
- テストで header provenance と warnings を検証している。

実務者への確認ポイント:

- 「来歴パネル」として独立UI化はしていないが、手動診断JSONで確認できる。
- `VLR/EVLR一覧` は件数とCRS用途中心で、原案の `LasRecordSummary[]` のような全record一覧ではない。
- `Extra Bytes` は record length 差分として検知する段階で、Extra Bytes VLR の詳細パースまではない。

判定:

- **MVPの大半は実装済み**。
- ただし、原案の詳細なVLR/EVLR一覧とExtra Bytes詳細まで含めるなら **一部実装済み** と見る余地がある。

### 4.2 12 属性: availability診断は実装済み

現実装で確認できること:

- `buildAttributeAvailabilityReport()` が PDRF と point record length から属性有無を推定する。
- 対象は `xyz`, `intensity`, `return`, `classification`, `scanAngle`, `gpsTime`, `rgb`, `nir`, `waveform`, `scannerChannel`, `classificationFlags`。
- record length が標準より長い場合に Extra Bytes present として警告する。
- `buildManualDiagnosticReport()` に `attributes` が含まれる。
- 属性availabilityの回帰テストがある。

不足:

- RGB表示モードは原案の属性パネルとしては未実装。
- intensity grayscale / heatmap / histogram は未実装。
- NIR / NDVI は未実装。
- RGB 8bit/16bit自動判定、intensity p02-p98 clip は未実装。
- Extra Bytes VLR の定義読解は未実装。

判定:

- **属性の有無診断は実装済み**。
- **属性表示・属性統計・NDVIまで含めると一部実装済み**。

### 4.3 11 取得品質: availability + measured coverage は実装済み

現実装で確認できること:

- LAS/LAZ点decodeで `returnNumber`, `numberOfReturns`, `scanAngle`, `gpsTime` を取り出す。
- PDRF 0-5 と PDRF 6+ の layout 差を分けている。
- PDRF 6+ の scan angle は raw int16 に `0.006 degree` を掛ける。
- `buildAcquisitionMetricsReport()` が sampled points から以下を出す。
  - `returnSignalCoverage`
  - `scanAngleCoverage`
  - `gpsTimeCoverage`
  - `gpsTimeMonotonicRatio`
- `buildAcquisitionQualityReport()` が availability と measured coverage を合成して `status`, `score`, `availableSignals`, `missingSignals`, `warnings` を返す。
- `buildManualDiagnosticReport()` に `acquisitionQuality` が含まれる。
- truncated LAS/LAZ point record の境界チェックも追加済み。
- 関連テストが複数ある。

不足:

- 原案の `returnStats` は未実装。
  - `singleReturnRatio`
  - `firstReturnRatio`
  - `lastReturnRatio`
  - `multiReturnRatio`
- 原案の `scanAngleStats` は未実装。
  - min/max/meanAbs/p95Abs/highAngleRatio
- 原案の `gpsTimeStats` は未実装。
  - min/max/duration/discontinuityCount
- 原案の `sourceStats` は未実装。
  - sourceCount、pointCountBySource、densityBySource
- source ID 色分け、GPS time 色分け、scan angle ヒートマップは未実装。
- `edgeOfFlightLine`, `overlap`, `withheld` の表示/診断は未実装。

判定:

- **取得品質の基礎診断は実装済み**。
- 原案MVPの `sourceId別点数` と `scan angle p95` までは届いていないため、厳密には **一部実装済み**。
- 現実装の名前は「取得品質availability + sampled coverage」と呼ぶのが正確。

### 4.4 15 作業補助: 作業メモコピーv1は実装済み

現実装で確認できること:

- 統計パネルに `作業メモコピー` ボタンがある。
- `buildWorkAssistSnapshot()` が `schemaVersion: 1` のJSONを作る。
- JSONには以下が含まれる。
  - workflow: step, selectedQuality, loadStrategy, loadRiskLevel
  - view: 2D/3D, current2DView, colorMode, visualizationMode, CAD mode, camera position/target/up
  - section: width, groundOnly, section profile summary
  - measurement: history count, active record id, last measurement summary
  - diagnostics: filter kind, selected candidate, candidate summary
  - acquisitionQuality: status, score, available/missing signals, warnings
- privacy方針として以下を明示し、テストで確認している。
  - file nameなし
  - point cloud payloadなし
  - source coordinatesなし
  - telemetryなし
  - uploadなし

不足:

- ROI保存は未実装。
- 視点を複数保存して戻す機能は未実装。
- 断面定義を保存して再実行する機能は未実装。
- メモ保存は未実装。
- JSON export/import は未実装。
- ファイル指紋照合は未実装。
- localStorage に最後の表示状態を保存する作業補助仕様は未実装。

判定:

- **作業補助v1としては実装済み**。
- `.tmp/done-up?.md` の `15 作業補助` 全体から見ると **一部実装済み**。

---

## 5. 一部実装済みとして扱うべき基盤部品

### 5.1 共通XYグリッド: 密度診断用として一部あり

現実装には `buildDensityGrid()` があり、表示点ベースのXYグリッドで以下を出せる。

- cell count
- mean density
- empty interior cells
- density spike cells
- density heatmap

ただし、`.tmp/done-up?.md` の `GridSpec` とは目的が違う。

不足:

- targetGrid 約200x200 の自動セルサイズ丸め。
- DTM/勾配/土量/差分で共有する `GridSpec`。
- ROI詳細診断向けの grid clipping。
- `cellSize`, `originX`, `originY`, `sampleRatio` を明示した共通型。

判定:

- **密度・異常候補のグリッドは実装済み**。
- **8〜10/14の共通解析グリッドとしては未実装**。

### 5.2 断面・計測: 15の素材として利用可能

現実装には以下がある。

- 2D表示
- 断面幅指定
- groundOnlyフィルタ
- `extractSectionPoints()`
- `buildSectionProfile()`
- `renderSectionProfile()`
- 距離計測履歴
- 計測結果コピー

ただし、`.tmp/done-up?.md` が求める保存・再利用とは別。

不足:

- 断面定義の保存。
- 保存断面の再実行。
- 断面CSV出力。
- 断面ごとのメモ。

判定:

- **断面表示・計測は実装済み**。
- **作業補助の保存対象としては一部実装済み**。

---

## 6. 未実装として明確に残るもの

### 6.1 8 地表候補DTM

未実装の主要要件:

- `GroundCandidateReport`
- `GroundCell[]`
- class 2 ground 優先グリッド化
- p05/p10 下位パーセンタイル方式
- 最低点 + 3x3 median smoothing
- 欠損セル補間
- `heightAboveGround` 計算
- 地表候補/非地表候補表示切替
- HAG色分け
- DTMメッシュ表示
- `GROUND_*` warning codes

現実装の関連部品:

- classification class 2 の集計はある。
- 断面の groundOnly はある。
- 密度グリッドはある。

ただし、これはDTMではない。

判定: **未実装**。

### 6.2 9 勾配

未実装の主要要件:

- DTMグリッドから中央差分で勾配計算。
- `SlopeReport`
- `SlopeCell[]`
- `SlopeRegion[]`
- slopePercent / slopeDegree / aspectDegree
- 法勾配 `1:n`
- 急変箇所
- 排水注意候補
- 低勾配エリア
- 勾配ヒートマップ
- `SLOPE_*`, `DRAINAGE_CANDIDATE`, `FLAT_LOW_AREA` warning codes

現実装の関連部品:

- 2点計測で dZ / 水平距離は出せる。
- 密度・Z外れ値候補はある。

ただし、これは勾配面解析ではない。

判定: **未実装**。

### 6.3 10 土量

未実装の主要要件:

- ROIポリゴン。
- 固定Z/2点勾配面/3点平面/前回DTMなどの基準面。
- `VolumeReport`
- cut/fill/net/absolute volume。
- 有効セル率。
- 信頼度と注意理由。
- 土量概算パネル。
- `VOLUME_*` warning codes。

現実装の関連部品:

- 断面、距離計測、密度グリッドはある。
- ただし面積・体積計算はない。

判定: **未実装**。

### 6.4 14 差分

未実装の主要要件:

- 2ファイル同時読み込み/保持。
- base/current の区別。
- CRS一致、単位一致、高さ基準一致チェック。
- bbox overlap チェック。
- 共通グリッド化。
- current - base の dz ヒートマップ。
- 変化面積、盛土相当、掘削相当、差引。
- `ChangeDetectionReport`
- `ChangeRegion[]`
- 位置合わせ不可時の停止条件。
- `DIFF_*` warning codes。

現実装の関連部品:

- CRS診断はある。
- 密度グリッドはある。
- ただし2時点比較はない。

判定: **未実装**。

---

## 7. レビューで突っ込まれやすい点

### 7.1 `15 作業補助` を実装済みと言い切ると危険

現状は「作業メモコピー」であり、原案の `PointCloudWorkspace` ではない。

言い換え推奨:

- 不正確: `15 作業補助を実装済み`
- 正確: `15 作業補助のv1として、現在状態の作業メモコピーを実装済み。保存/読込/ROI/メモは未実装`

### 7.2 `11 取得品質` は詳細統計まではない

現状の強み:

- return / scanAngle / gpsTime の抽出。
- coverage 計算。
- warning化。
- 手動診断JSON連携。

不足:

- p95 scan angle。
- source ID別点数。
- GPS duration/discontinuity。
- return構成比。

言い換え推奨:

- 不正確: `取得品質仕様を全実装`
- 正確: `取得品質のavailability + sampled coverageを実装。source/return/scanAngle/GPSの詳細統計は次段階`

### 7.3 `12 属性` は「有無診断」であり「属性表示」ではない

現状は PDRF/record length に基づく属性availability。

未実装:

- RGB表示。
- intensity表示。
- NIR/NDVI。
- histogram。

言い換え推奨:

- 不正確: `属性パネル実装済み`
- 正確: `属性availability診断を実装済み。属性表示UIは未実装`

### 7.4 8〜10/14 は「部品あり」と「機能あり」を混同しやすい

密度グリッドや断面はあるが、DTM/勾配/土量/差分そのものではない。

言い換え推奨:

- 不正確: `地表候補/勾配/土量/差分の基盤は完成`
- 正確: `密度・断面・計測の基礎部品はあるが、共通解析グリッドとDTMは未実装`

---

## 8. 次に実装するなら何からか

原案の依存関係は正しいため、次は **8 地表候補DTM** を推奨する。

理由:

- 9 勾配、10 土量、14 差分の全てがDTMに依存する。
- 15のROI保存を先に大きく作っても、解析対象がまだないため価値が出にくい。
- 既存の `buildDensityGrid()` と `extractSectionPoints()` を参考に、表示点ベースの小さい `GroundCandidateReport` から始められる。

推奨する次スライス:

```txt
8A. buildGroundCandidateGrid(points, bounds, options)
  - class 2 ground が十分なら classification_ground
  - ground が薄ければ low_percentile_grid
  - cellSize は既定値または自動簡易値
  - validCellRatio / confidence / warnings を返す

8B. buildHeightAboveGroundSummary(points, groundGrid)
  - HAG統計だけ出す
  - 点ごとの永続HAG付与や表示切替は後回し

8C. 統計パネルまたは手動診断JSONへ要約だけ追加
  - DTM成果品ではなく「地表候補アシスト」と明記
```

この順なら、9 勾配に進む前に DTM の品質とリスクを確認できる。

---

## 9. 実装根拠メモ

確認した主な実装点:

- `PointCloudWorkbench.html`
  - `buildLineageReport()`
  - `buildAttributeAvailabilityReport()`
  - `buildAcquisitionMetricsReport()`
  - `buildAcquisitionQualityReport()`
  - `buildManualDiagnosticReport()`
  - `buildWorkAssistSnapshot()`
  - `copyWorkAssistSnapshot()`
  - `buildDensityGrid()`
  - `extractSectionPoints()`
  - `buildSectionProfile()`
  - `buildDiagnosticsScore()`
- `scripts/pointcloud-workbench.test.js`
  - lineage / attribute / acquisition quality tests
  - LAS/LAZ point decode boundary tests
  - work assist snapshot privacy tests
  - density / diagnostics / section / measurement tests
- docs
  - `README.md` に取得品質と作業メモの説明あり
  - `PointCloudWorkbench_運用手順書.md` に操作とprivacy注意あり
  - `PointCloudWorkbench_実装リファレンス.md` に実装契約あり

直近の検証結果:

```txt
bun test scripts/pointcloud-workbench.test.js
=> 88 pass / 0 fail

bun test scripts/pointcloud-workbench.test.js scripts/documentation-consistency.test.js
=> 91 pass / 0 fail

bun scripts/check-readme.js
=> README チェック OK

bunx --package playwright node scripts/e2e/run-diagnostics-smoke.mjs --las samples/test.las --laz samples/test.laz
=> Diagnostics smoke passed
```

---

## 10. 最終レビュー用サマリ

この状態を実務者に見せる場合の短い説明:

> 13/12/11は、原案の「診断基盤」としてかなり実装済みです。特に来歴、属性availability、取得品質coverage、手動診断JSONへの反映はテスト付きで確認できます。15は作業補助v1として、現在状態の作業メモコピーまで入りました。ただし、原案の保存/読込/ROI/メモ機能ではありません。8/9/10/14は未実装です。密度グリッド、断面、計測はありますが、共通DTM・勾配・土量・差分の解析機能とはまだ別物です。次に進めるなら、8の地表候補DTMを最小スライスで作るのが妥当です。
