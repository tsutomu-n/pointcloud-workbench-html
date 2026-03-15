# PointCloudWorkbench 実装リファレンス

更新日時: 2026-03-15 21:55:39 JST

## 1. スコープ
- 対象: `PointCloudWorkbench.html`（単一ファイル構成）
- 目的: 保守・改修時に、関数群と状態遷移を追跡しやすくする

### 1.1 誤読防止の前提
- 本書の行番号リンクは更新日時時点で検証済み。`PointCloudWorkbench.html` 変更後は再確認が必要。
- 言語セレクタは `setAppLanguage()` により `document.documentElement.lang` と `localStorage.viewerLanguage` を更新する。UI文言の動的翻訳機構はない。
- ファイルサイズ拒否条件は LAS は `3GB超`、LAZ は `2GB超` を拒否します。
- LAS は `3GBちょうど`、LAZ は `2GBちょうど` まで `critical` 扱いで継続可能です。

## 2. 外部依存
- `three.js r128`（CDN）
- `laz-perf`（CDN、WASM）
- `THREE.OrbitControls` はファイル内インライン定義

## 3. スクリプト構造（上位）
- エラー・監視系
- `ErrorTracker`
- `MemoryMonitor`
- `PerformanceMonitor`
- `CompatibilityChecker`
- 状態・設定定義
- `workflowState`, `statsData`, `performanceData`, `qualitySettings`
- ワークフロー制御
- ファイル選択、品質選択、読み込み、完了
- 3D描画・可視化制御
- カメラ、表示モード、2D/3D、スライス、分類
- UIユーティリティ
- ダイアログ、トースト、キーボード、統計表示

## 4. 主要状態モデル

### 4.1 `workflowState`
- `step`: `file-select | quality-select | loading | complete`
- `selectedFile`
- `selectedQuality`
- `performanceDetected`
- `qualityManuallySelected`
- 読み込み整合は `window._loadingCancelled`、`loadSessionSequence`、`activeLoadSessionId` でも補完する

### 4.2 `statsData`
- `fileName`, `fileSize`, `lasVersion`
- `originalPoints`, `displayPoints`
- `loadStartTime`, `processStartTime`
- `header`（LASヘッダー）
- `classificationCounts`

### 4.3 `performanceData`
- `hardwareSpecs`
- `benchmarkFPS`
- `performanceScore`
- `recommendedQuality`
- `recommendationAnalysis`

### 4.4 主要定数
- `DEFAULT_QUALITY = "medium"`
- `qualitySettings` のキーは `low | medium | high | maximum`（UI表示は `LOW / MEDIUM / HIGH / MAX`）
- `FILE_SIZE_THRESHOLDS = { advisory: 100MB, warning: 500MB, critical: 1024MB, maximum: 3072MB }`
- `FILE_SIZE_LIMITS = { las: 3GB, laz: 2GB }`
- `FILE_READ_TIMEOUT_POLICY` はサイズ依存で `60秒〜300秒` に拡張
- `POINT_PARSE_TIMEOUT_POLICY` はサイズ依存で `30秒〜300秒` に拡張
- `FILE_IO_POLICY` は header 先読込と chunked 読込サイズを定義
- `SUPPORTED_LANGUAGES = ["ja", "en", "zh"]`

## 5. 初期化フロー
1. `DOMContentLoaded`
2. `init()`
3. `safeInitializeComponents()`
4. `detectSystemPerformanceBackground()`
5. `initializeLanguagePreference()`
6. `setupEventListeners()`
7. `validateRequiredElements()`
8. `checkBrowserCapabilities()`

イベント登録は `window.eventListenersSetupDone` で冪等化。

## 6. 読み込みパイプライン
1. `window.startDataLoading()`
2. `beginLoadSession()`
3. `loadLASFileActual(file)` または `loadSampleDataActual()`
4. `buildPointCloudFromLASFile(file)`（ローカル LAS）
5. `parseLASHeaderFromFile()` / `parseLASPointsFromFile()`（ローカル LAS）
6. `buildPointCloudFromLAZFile(file)`（ローカル LAZ）
7. `readFileIntoWasmHeap()` / `decompressLAZFile()`（ローカル LAZ）
8. `readFileAsArrayBuffer()` / `buildPointCloudFromArrayBuffer()`（URL 読込や互換経路）
9. `parsePointsFromArrayBuffer()`
10. `parseLASHeader()` / `parseLASPoints()`（ArrayBuffer 経路の LAS）
11. `decodeLAZPoint()`（LAZ）
12. `createPointCloudFromData(points, header, filename)`
13. `setupPointCloudVisualization()`
14. `completeLoading()`

## 7. LAS/LAZ 実装要点

### 7.1 `parseLASHeader()`
- シグネチャ `LASF` を検証
- LAS 1.4 の 64-bit 点数を処理
- `pointDataRecordFormat` と `legacyPointCount` に応じて点数解釈を分岐

### 7.2 `parseLASPoints()`
- 品質設定の上限点数まで等間隔サンプリング
- scale/offset 適用済み座標を生成
- point format に応じて分類値のオフセットを切替
- タイムアウトとキャンセルは握りつぶさず上位へ伝播

### 7.3 `parseLASPointsFromFile()`
- ローカル `LAS` を `slice()` + `FileReader` で chunk 読み込み
- 巨大 `ArrayBuffer` を作らずに、品質設定に沿って等間隔サンプリング
- `parseLASHeaderFromFile()` で先頭ヘッダーのみ先読み
- 進捗更新、キャンセル、サイズ依存タイムアウトを継続
### 7.4 `decompressLAZFile()`
- laz-perf の `LASZip` を使った逐次展開
- `maxPoints` 超過時は `skipRate` で間引き
- 診断情報を `window.__lazDebug` に保存
- 圧縮ファイルを WASM 側へ複製するため、LAS より上限を保守的にしている
- ローカル `LAZ` は `readFileIntoWasmHeap()` で chunk ごとに WASM ヒープへ転送し、JS 全量 `ArrayBuffer` を避ける

## 8. 点群生成と描画

### 8.1 `createPointCloudFromData()`
- 入力点検証（NaN/Infinity除外）
- 座標変換:
- `x = point.x - centerX`
- `y = point.z - minZ`
- `z = -(point.y - centerY)`
- `position`, `color`, `classification` バッファ属性を構築
- `statsData` と分類統計を更新

### 8.2 `downsamplePointCloud()`
- メモリ/性能低下時に点群を間引く
- `statsData.displayPoints` と `classificationCounts` を再計算

### 8.3 描画ループ
- `animate()` が `workflowState.step === "complete"` の間のみ実行
- `controls.update()`、FPS更新、`renderer.render()` を実行

## 9. 品質・性能推奨ロジック
- ハードウェア情報と簡易ベンチから `performanceScore` を算出
- `getRecommendationAnalysis()` で推奨品質を決定
- 手動選択済みなら推奨で上書きしない
- `updatePerformanceDisplay()` でUI反映

関連関数:
- `detectHardwareSpecs()`
- `quickBenchmark()`
- `calculatePerformanceScore()`
- `estimateQualityFPS()`
- `getHardwareQualityCap()`
- `clampQualityByHardware()`

## 10. ファイルサイズ判定
- 共通判定: `checkFileSizeLimits(file)`
- 形式別上限: LAS は 3GB、LAZ は 2GB
- 利用箇所:
- `handleFileSelect()`
- `updateFileInfo()`
- `loadLASFileActual()`
- `readBlobAsArrayBuffer()` / `readFileAsArrayBuffer()` が FileReader + `abort()` で読み込み中断を扱う
- `readFileIntoWasmHeap()` が LAZ を chunk ごとに WASM ヒープへ転送する
- LAS の 3GB超、LAZ の 2GB超 (`maximum`) は `canProceed = false` として読込拒否
- 比較演算は `>`。LAS の `3GBちょうど`、LAZ の `2GBちょうど` は `critical` で継続可能

## 11. 表示モード・分類
- `window.setColorMode(mode)` から `executeColorModeChange(mode)` を呼ぶ
- 現在 UI 実装済みモード: `height`, `classification`
- `classification` へ切替える際は品質警告モーダルで継続確認が入る場合がある
- `analyzeClassificationData()` / `updateClassificationUI()` で品質指標と推薦表示を更新
- `updateLegendPanel()` が凡例 DOM を動的生成
- `window.toggleLegendPanel()` は公開されているが、現状UIに専用ボタン導線はない

## 12. 2D・スライス・補助表示
- 2D:
- `window.set2DView(view)`
- `window.exit2DView()`
- スライス:
- `window.toggleSlicing()`
- `updateSlicing()`
- `window.show2DSliceView()`

## 13. イベントとクリーンアップ
- `setupEventListeners()` で登録したハンドラは `window.eventListeners` に記録
- `cleanupEventListeners()` で一括解除
- 離脱確認: `beforeunload`
- 実クリーンアップ: `unload`
- 緊急クリーンアップ: `window.performFinalCleanup()`

## 14. `window` 公開 API 一覧

### 14.1 ワークフロー
- `loadSampleData`
- `proceedToQualitySelection`
- `startDataLoading`
- `cancelLoading`
- `goBackToFileSelect`
- `openFilePickerFromNav`
- `goHome`

### 14.2 ビュー操作
- `set2DView`, `exit2DView`
- `resetView`, `topView`, `sideView`, `backView`
- `moveCloser`, `moveAway`, `fitToView`
- `setColorMode`

### 14.3 機能操作
- `toggleLegendPanel`（UIボタン導線なし。開発者コンソール/APIから利用）
- `toggleSlicing`
- `show2DSliceView`
- `resetSlicing`
- `toggleCADMode`
- `autoClassify`

### 14.4 開発補助
- `debugClassification`
- `refreshClassificationStats`
- `testClassificationMode`
- `toggleStatsPanel`
- `toggleControlsPanel`
- `performFinalCleanup`

## 15. 変更時の実装指針
- 品質追加時:
- `qualitySettings`, `qualityOrder`, `qualityScoreFloor`, UIラジオ、推奨ロジックを同時更新
- 表示モード追加時:
- UIボタン追加、`executeColorModeChange()`、`getModeLabel()`、推奨ロジックを同時更新
- サイズ基準変更時:
- `FILE_SIZE_THRESHOLDS` / `FILE_SIZE_LIMITS` を変更し、他判定ロジックの重複追加はしない
- 読み込み経路追加時:
- ローカルファイルは chunked 経路、URL/互換経路は `buildPointCloudFromArrayBuffer()` を使い分ける

## 16. 既知の結合ポイント
- 単一HTMLのため、状態とUIが密結合
- デバッグログが多く、コンソール出力負荷が高め
- 監視クラスが `workflowState` と `pointCloud` に直接依存

## 17. 開発時の最低確認
- 構文チェック:
- `node -e "new Function(inlineScript)"`
- 機能確認:
- ファイル選択 → 品質選択 → 読み込み完了
- `goHome` 後に再読込可能
- 分類表示・凡例・統計の整合
- `beforeunload` 確認ダイアログの動作

## 18. 関数クイックリンク（実装追跡用）

### 18.1 初期化・監視

| 関数/クラス | 行番号リンク | 役割 |
|---|---|---|
| `ErrorTracker` | [PointCloudWorkbench.html#L4482](PointCloudWorkbench.html#L4482) | グローバル例外収集と表示 |
| `MemoryMonitor` | [PointCloudWorkbench.html#L4753](PointCloudWorkbench.html#L4753) | メモリ圧監視と自動最適化 |
| `PerformanceMonitor` | [PointCloudWorkbench.html#L4929](PointCloudWorkbench.html#L4929) | FPS監視と性能劣化対応 |
| `CompatibilityChecker` | [PointCloudWorkbench.html#L5157](PointCloudWorkbench.html#L5157) | ブラウザ機能互換チェック |
| `init` | [PointCloudWorkbench.html#L5728](PointCloudWorkbench.html#L5728) | 全体初期化エントリ |
| `safeInitializeComponents` | [PointCloudWorkbench.html#L5749](PointCloudWorkbench.html#L5749) | 初期化タスクの順次実行 |
| `setupEventListeners` | [PointCloudWorkbench.html#L5986](PointCloudWorkbench.html#L5986) | UI/キー/離脱イベント登録 |
| `cleanupEventListeners` | [PointCloudWorkbench.html#L6265](PointCloudWorkbench.html#L6265) | 登録済みイベント一括解除 |
| `setAppLanguage` | [PointCloudWorkbench.html#L5668](PointCloudWorkbench.html#L5668) | 表示言語反映と保存 |
| `initializeLanguagePreference` | [PointCloudWorkbench.html#L5686](PointCloudWorkbench.html#L5686) | 言語設定の復元 |

### 18.2 ワークフロー・入力

| 関数 | 行番号リンク | 役割 |
|---|---|---|
| `handleFileSelect` | [PointCloudWorkbench.html#L6295](PointCloudWorkbench.html#L6295) | ファイル選択ハンドラ |
| `checkFileSizeLimits` | [PointCloudWorkbench.html#L6513](PointCloudWorkbench.html#L6513) | サイズ判定の共通関数 |
| `updateFileInfo` | [PointCloudWorkbench.html#L6698](PointCloudWorkbench.html#L6698) | ファイル情報UI更新 |
| `proceedToQualitySelection` | [PointCloudWorkbench.html#L6787](PointCloudWorkbench.html#L6787) | 品質設定画面遷移 |
| `applyQualitySelection` | [PointCloudWorkbench.html#L6857](PointCloudWorkbench.html#L6857) | 品質状態の正規化反映 |
| `startDataLoading` | [PointCloudWorkbench.html#L7157](PointCloudWorkbench.html#L7157) | 読み込み開始制御 |
| `updateLoadingInfo` | [PointCloudWorkbench.html#L7318](PointCloudWorkbench.html#L7318) | 読み込み情報表示更新 |
| `updateProgress` | [PointCloudWorkbench.html#L7507](PointCloudWorkbench.html#L7507) | 進捗バー・文言更新 |
| `loadLASFileActual` | [PointCloudWorkbench.html#L7560](PointCloudWorkbench.html#L7560) | 実データ読み込み本体 |
| `completeLoading` | [PointCloudWorkbench.html#L9688](PointCloudWorkbench.html#L9688) | 完了状態へ遷移 |

### 18.3 データ処理・描画

| 関数 | 行番号リンク | 役割 |
|---|---|---|
| `setupPointCloudVisualization` | [PointCloudWorkbench.html#L7865](PointCloudWorkbench.html#L7865) | 点群表示セットアップ |
| `parseLASHeaderFromFile` | [PointCloudWorkbench.html#L7958](PointCloudWorkbench.html#L7958) | LASヘッダー先読み |
| `parseLASPointsFromFile` | [PointCloudWorkbench.html#L7973](PointCloudWorkbench.html#L7973) | LAS chunked 点抽出 |
| `readFileIntoWasmHeap` | [PointCloudWorkbench.html#L8112](PointCloudWorkbench.html#L8112) | LAZ chunked 転送 |
| `buildPointCloudFromLASFile` | [PointCloudWorkbench.html#L8204](PointCloudWorkbench.html#L8204) | LAS ローカル読込入口 |
| `buildPointCloudFromLAZFile` | [PointCloudWorkbench.html#L8238](PointCloudWorkbench.html#L8238) | LAZ ローカル読込入口 |
| `buildPointCloudFromArrayBuffer` | [PointCloudWorkbench.html#L8264](PointCloudWorkbench.html#L8264) | 読み込み共通処理入口 |
| `parsePointsFromArrayBuffer` | [PointCloudWorkbench.html#L8283](PointCloudWorkbench.html#L8283) | LAS/LAZ 分岐パーサ |
| `parseLASHeader` | [PointCloudWorkbench.html#L8363](PointCloudWorkbench.html#L8363) | LASヘッダー解析 |
| `parseLASPoints` | [PointCloudWorkbench.html#L8489](PointCloudWorkbench.html#L8489) | LAS点群抽出 |
| `decompressLAZFile` | [PointCloudWorkbench.html#L8565](PointCloudWorkbench.html#L8565) | LAZ解凍処理 |
| `decodeLAZPoint` | [PointCloudWorkbench.html#L8891](PointCloudWorkbench.html#L8891) | LAZ 1点デコード |
| `createPointCloudFromData` | [PointCloudWorkbench.html#L8933](PointCloudWorkbench.html#L8933) | BufferGeometry生成 |
| `downsamplePointCloud` | [PointCloudWorkbench.html#L9307](PointCloudWorkbench.html#L9307) | 点群間引き最適化 |
| `adjustCameraToData` | [PointCloudWorkbench.html#L9465](PointCloudWorkbench.html#L9465) | データ範囲フィット |
| `animate` | [PointCloudWorkbench.html#L12108](PointCloudWorkbench.html#L12108) | メインレンダーループ |
| `updateStatsDisplay` | [PointCloudWorkbench.html#L13190](PointCloudWorkbench.html#L13190) | 統計UI再計算 |

### 18.4 表示モード・UI補助

| 関数 | 行番号リンク | 役割 |
|---|---|---|
| `set2DView` | [PointCloudWorkbench.html#L9644](PointCloudWorkbench.html#L9644) | 2Dビュー切替 |
| `exit2DView` | [PointCloudWorkbench.html#L9653](PointCloudWorkbench.html#L9653) | 3Dビュー復帰 |
| `setColorMode` | [PointCloudWorkbench.html#L9907](PointCloudWorkbench.html#L9907) | 色分けモード切替入口 |
| `executeColorModeChange` | [PointCloudWorkbench.html#L9928](PointCloudWorkbench.html#L9928) | 色バッファ再計算 |
| `updateLegendPanel` | [PointCloudWorkbench.html#L10321](PointCloudWorkbench.html#L10321) | 分類凡例の描画 |
| `determineBestVisualizationMode` | [PointCloudWorkbench.html#L10426](PointCloudWorkbench.html#L10426) | 推奨表示モード判定 |
| `toggleSlicing` | [PointCloudWorkbench.html#L10639](PointCloudWorkbench.html#L10639) | スライスUI切替 |
| `updateSlicing` | [PointCloudWorkbench.html#L10721](PointCloudWorkbench.html#L10721) | スライス面更新 |
| `autoClassify` | [PointCloudWorkbench.html#L12091](PointCloudWorkbench.html#L12091) | 自動分類起動 |
| `detectSystemPerformanceBackground` | [PointCloudWorkbench.html#L12162](PointCloudWorkbench.html#L12162) | バックグラウンド性能検出 |
| `getRecommendationAnalysis` | [PointCloudWorkbench.html#L12346](PointCloudWorkbench.html#L12346) | 品質推奨計算 |
| `updatePerformanceDisplay` | [PointCloudWorkbench.html#L12433](PointCloudWorkbench.html#L12433) | 性能情報UI反映 |
| `showConfirmDialog` | [PointCloudWorkbench.html#L12511](PointCloudWorkbench.html#L12511) | 確認ダイアログ |
| `showToast` | [PointCloudWorkbench.html#L12622](PointCloudWorkbench.html#L12622) | 通知表示 |
| `handleKeyDown` | [PointCloudWorkbench.html#L12714](PointCloudWorkbench.html#L12714) | キー入力処理 |
| `handleKeyUp` | [PointCloudWorkbench.html#L12836](PointCloudWorkbench.html#L12836) | キー入力解放処理 |
| `performFinalCleanup` | [PointCloudWorkbench.html#L13513](PointCloudWorkbench.html#L13513) | 終了時クリーンアップ |

## 19. ユースケース別トレース（事実ベース）

### 19.1 大容量ファイル（500MB超）を選択したとき

処理経路:
1. `handleFileSelect` → [PointCloudWorkbench.html#L6148](PointCloudWorkbench.html#L6148)
2. `checkFileSizeLimits` → [PointCloudWorkbench.html#L6366](PointCloudWorkbench.html#L6366)
3. `showFileSizeWarning`（必要時）→ [PointCloudWorkbench.html#L6469](PointCloudWorkbench.html#L6469)
4. `updateFileInfo` → [PointCloudWorkbench.html#L6550](PointCloudWorkbench.html#L6550)

ポイント:
- 閾値帯は `FILE_SIZE_THRESHOLDS`、形式別上限は `FILE_SIZE_LIMITS` で管理
- `warning/critical` は継続可能、`maximum` は継続不可

### 19.2 形式別上限を読み込み開始時に防ぐ

処理経路:
1. `startDataLoading` → [PointCloudWorkbench.html#L7008](PointCloudWorkbench.html#L7008)
2. `loadLASFileActual` → [PointCloudWorkbench.html#L7410](PointCloudWorkbench.html#L7410)
3. `checkFileSizeLimits` 再評価 → [PointCloudWorkbench.html#L6366](PointCloudWorkbench.html#L6366)
4. `canProceed=false` なら警告表示して例外終了

ポイント:
- LAS と LAZ で上限が異なる
- 選択時チェックに加えて、読み込み直前でも同じ判定を実施

### 19.3 通常読み込み（LAS/LAZ）から表示完了まで

処理経路:
1. `startDataLoading` → [PointCloudWorkbench.html#L7008](PointCloudWorkbench.html#L7008)
2. `loadLASFileActual` → [PointCloudWorkbench.html#L7410](PointCloudWorkbench.html#L7410)
3. `buildPointCloudFromArrayBuffer` → [PointCloudWorkbench.html#L7740](PointCloudWorkbench.html#L7740)
4. `parsePointsFromArrayBuffer` → [PointCloudWorkbench.html#L7820](PointCloudWorkbench.html#L7820)
5. `parseLASPoints` or `decompressLAZFile` → [PointCloudWorkbench.html#L8026](PointCloudWorkbench.html#L8026) / [PointCloudWorkbench.html#L8169](PointCloudWorkbench.html#L8169)
6. `createPointCloudFromData` → [PointCloudWorkbench.html#L8510](PointCloudWorkbench.html#L8510)
7. `completeLoading` → [PointCloudWorkbench.html#L9265](PointCloudWorkbench.html#L9265)

ポイント:
- 点群生成後に `statsData` と分類統計が更新される
- `complete` ステップへ遷移後に `animate` ループが有効化

### 19.4 分類表示の品質が低いデータ

処理経路:
1. `setColorMode('classification')` → [PointCloudWorkbench.html#L9484](PointCloudWorkbench.html#L9484)
2. `executeColorModeChange` → [PointCloudWorkbench.html#L9505](PointCloudWorkbench.html#L9505)
3. `getClassificationStats` / `updateLegendPanel` → [PointCloudWorkbench.html#L9692](PointCloudWorkbench.html#L9692) / [PointCloudWorkbench.html#L9898](PointCloudWorkbench.html#L9898)

ポイント:
- 未分類率や分類種類数に基づいて警告ログとUI指標が更新される
- 必要に応じて `autoClassify` で再分類可能
- 未分類率の算出で参照する分類コードは処理系で差がある（例: `createPointCloudFromData` は `0/1`、`getClassificationStats` は `1`）

### 19.5 メモリ圧・性能低下時の自動劣化

処理経路:
1. `MemoryMonitor.checkMemoryUsage`（定期）→ [PointCloudWorkbench.html#L4753](PointCloudWorkbench.html#L4753)
2. `PerformanceMonitor.checkPerformance`（FPS監視）→ [PointCloudWorkbench.html#L4929](PointCloudWorkbench.html#L4929)
3. `downsamplePointCloud` → [PointCloudWorkbench.html#L8884](PointCloudWorkbench.html#L8884)

ポイント:
- 条件を満たすと点数間引き・点サイズ調整が行われる
- `statsData.displayPoints` と分類統計が再計算される
