# MonoPoint3D 実装リファレンス

更新日時: 2026-03-02 11:44:07 JST

## 1. スコープ
- 対象: `MonoPoint3D.html`（単一ファイル構成）
- 目的: 保守・改修時に、関数群と状態遷移を追跡しやすくする

### 1.1 誤読防止の前提
- 本書の行番号リンクは更新日時時点で検証済み。`MonoPoint3D.html` 変更後は再確認が必要。
- 言語セレクタは `setAppLanguage()` により `document.documentElement.lang` と `localStorage.viewerLanguage` を更新する。UI文言の動的翻訳機構はない。
- ファイルサイズ拒否条件は `size > 2GB`。`size === 2GB` は `critical` 扱いで継続可能。

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
- `FILE_SIZE_THRESHOLDS = { advisory: 100MB, warning: 500MB, critical: 1024MB, maximum: 2048MB }`
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
2. `loadLASFileActual(file)` または `loadSampleDataActual()`
3. `buildPointCloudFromArrayBuffer(arrayBuffer, fileName, fileSize)`
4. `parsePointsFromArrayBuffer()`
5. `parseLASHeader()` / `parseLASPoints()`（LAS）
6. `decompressLAZFile()` / `decodeLAZPoint()`（LAZ）
7. `createPointCloudFromData(points, header, filename)`
8. `setupPointCloudVisualization()`
9. `completeLoading()`

## 7. LAS/LAZ 実装要点

### 7.1 `parseLASHeader()`
- シグネチャ `LASF` を検証
- LAS 1.4 の 64-bit 点数を処理
- `pointDataRecordFormat` と `legacyPointCount` に応じて点数解釈を分岐

### 7.2 `parseLASPoints()`
- 品質設定の上限点数まで等間隔サンプリング
- scale/offset 適用済み座標を生成
- point format に応じて分類値のオフセットを切替

### 7.3 `decompressLAZFile()`
- laz-perf の `LASZip` を使った逐次展開
- `maxPoints` 超過時は `skipRate` で間引き
- 診断情報を `window.__lazDebug` に保存

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
- 利用箇所:
- `handleFileSelect()`
- `updateFileInfo()`
- `loadLASFileActual()`
- 2GB超 (`maximum`) は `canProceed = false` として読込拒否
- 比較演算は `>`。`2GBちょうど` は `critical` で継続可能

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
- `FILE_SIZE_THRESHOLDS` を変更し、他判定ロジックの重複追加はしない
- 読み込み経路追加時:
- `buildPointCloudFromArrayBuffer()` を共通入口として再利用する

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
| `ErrorTracker` | [MonoPoint3D.html#L4482](MonoPoint3D.html#L4482) | グローバル例外収集と表示 |
| `MemoryMonitor` | [MonoPoint3D.html#L4753](MonoPoint3D.html#L4753) | メモリ圧監視と自動最適化 |
| `PerformanceMonitor` | [MonoPoint3D.html#L4929](MonoPoint3D.html#L4929) | FPS監視と性能劣化対応 |
| `CompatibilityChecker` | [MonoPoint3D.html#L5157](MonoPoint3D.html#L5157) | ブラウザ機能互換チェック |
| `init` | [MonoPoint3D.html#L5512](MonoPoint3D.html#L5512) | 全体初期化エントリ |
| `safeInitializeComponents` | [MonoPoint3D.html#L5533](MonoPoint3D.html#L5533) | 初期化タスクの順次実行 |
| `setupEventListeners` | [MonoPoint3D.html#L5770](MonoPoint3D.html#L5770) | UI/キー/離脱イベント登録 |
| `cleanupEventListeners` | [MonoPoint3D.html#L6049](MonoPoint3D.html#L6049) | 登録済みイベント一括解除 |
| `setAppLanguage` | [MonoPoint3D.html#L5452](MonoPoint3D.html#L5452) | 表示言語反映と保存 |
| `initializeLanguagePreference` | [MonoPoint3D.html#L5470](MonoPoint3D.html#L5470) | 言語設定の復元 |

### 18.2 ワークフロー・入力

| 関数 | 行番号リンク | 役割 |
|---|---|---|
| `handleFileSelect` | [MonoPoint3D.html#L6079](MonoPoint3D.html#L6079) | ファイル選択ハンドラ |
| `checkFileSizeLimits` | [MonoPoint3D.html#L6297](MonoPoint3D.html#L6297) | サイズ判定の共通関数 |
| `updateFileInfo` | [MonoPoint3D.html#L6481](MonoPoint3D.html#L6481) | ファイル情報UI更新 |
| `proceedToQualitySelection` | [MonoPoint3D.html#L6570](MonoPoint3D.html#L6570) | 品質設定画面遷移 |
| `applyQualitySelection` | [MonoPoint3D.html#L6640](MonoPoint3D.html#L6640) | 品質状態の正規化反映 |
| `startDataLoading` | [MonoPoint3D.html#L6938](MonoPoint3D.html#L6938) | 読み込み開始制御 |
| `updateLoadingInfo` | [MonoPoint3D.html#L7073](MonoPoint3D.html#L7073) | 読み込み情報表示更新 |
| `updateProgress` | [MonoPoint3D.html#L7262](MonoPoint3D.html#L7262) | 進捗バー・文言更新 |
| `loadLASFileActual` | [MonoPoint3D.html#L7315](MonoPoint3D.html#L7315) | 実データ読み込み本体 |
| `completeLoading` | [MonoPoint3D.html#L9140](MonoPoint3D.html#L9140) | 完了状態へ遷移 |

### 18.3 データ処理・描画

| 関数 | 行番号リンク | 役割 |
|---|---|---|
| `setupPointCloudVisualization` | [MonoPoint3D.html#L7619](MonoPoint3D.html#L7619) | 点群表示セットアップ |
| `buildPointCloudFromArrayBuffer` | [MonoPoint3D.html#L7638](MonoPoint3D.html#L7638) | 読み込み共通処理入口 |
| `parsePointsFromArrayBuffer` | [MonoPoint3D.html#L7715](MonoPoint3D.html#L7715) | LAS/LAZ 分岐パーサ |
| `parseLASHeader` | [MonoPoint3D.html#L7791](MonoPoint3D.html#L7791) | LASヘッダー解析 |
| `parseLASPoints` | [MonoPoint3D.html#L7917](MonoPoint3D.html#L7917) | LAS点群抽出 |
| `decompressLAZFile` | [MonoPoint3D.html#L8049](MonoPoint3D.html#L8049) | LAZ解凍処理 |
| `decodeLAZPoint` | [MonoPoint3D.html#L8343](MonoPoint3D.html#L8343) | LAZ 1点デコード |
| `createPointCloudFromData` | [MonoPoint3D.html#L8385](MonoPoint3D.html#L8385) | BufferGeometry生成 |
| `downsamplePointCloud` | [MonoPoint3D.html#L8759](MonoPoint3D.html#L8759) | 点群間引き最適化 |
| `adjustCameraToData` | [MonoPoint3D.html#L8917](MonoPoint3D.html#L8917) | データ範囲フィット |
| `animate` | [MonoPoint3D.html#L11552](MonoPoint3D.html#L11552) | メインレンダーループ |
| `updateStatsDisplay` | [MonoPoint3D.html#L12634](MonoPoint3D.html#L12634) | 統計UI再計算 |

### 18.4 表示モード・UI補助

| 関数 | 行番号リンク | 役割 |
|---|---|---|
| `set2DView` | [MonoPoint3D.html#L9096](MonoPoint3D.html#L9096) | 2Dビュー切替 |
| `exit2DView` | [MonoPoint3D.html#L9105](MonoPoint3D.html#L9105) | 3Dビュー復帰 |
| `setColorMode` | [MonoPoint3D.html#L9351](MonoPoint3D.html#L9351) | 色分けモード切替入口 |
| `executeColorModeChange` | [MonoPoint3D.html#L9372](MonoPoint3D.html#L9372) | 色バッファ再計算 |
| `updateLegendPanel` | [MonoPoint3D.html#L9765](MonoPoint3D.html#L9765) | 分類凡例の描画 |
| `determineBestVisualizationMode` | [MonoPoint3D.html#L9870](MonoPoint3D.html#L9870) | 推奨表示モード判定 |
| `toggleSlicing` | [MonoPoint3D.html#L10083](MonoPoint3D.html#L10083) | スライスUI切替 |
| `updateSlicing` | [MonoPoint3D.html#L10165](MonoPoint3D.html#L10165) | スライス面更新 |
| `autoClassify` | [MonoPoint3D.html#L11535](MonoPoint3D.html#L11535) | 自動分類起動 |
| `detectSystemPerformanceBackground` | [MonoPoint3D.html#L11606](MonoPoint3D.html#L11606) | バックグラウンド性能検出 |
| `getRecommendationAnalysis` | [MonoPoint3D.html#L11790](MonoPoint3D.html#L11790) | 品質推奨計算 |
| `updatePerformanceDisplay` | [MonoPoint3D.html#L11877](MonoPoint3D.html#L11877) | 性能情報UI反映 |
| `showConfirmDialog` | [MonoPoint3D.html#L11955](MonoPoint3D.html#L11955) | 確認ダイアログ |
| `showToast` | [MonoPoint3D.html#L12066](MonoPoint3D.html#L12066) | 通知表示 |
| `handleKeyDown` | [MonoPoint3D.html#L12158](MonoPoint3D.html#L12158) | キー入力処理 |
| `handleKeyUp` | [MonoPoint3D.html#L12280](MonoPoint3D.html#L12280) | キー入力解放処理 |
| `performFinalCleanup` | [MonoPoint3D.html#L12957](MonoPoint3D.html#L12957) | 終了時クリーンアップ |

## 19. ユースケース別トレース（事実ベース）

### 19.1 大容量ファイル（500MB超）を選択したとき

処理経路:
1. `handleFileSelect` → [MonoPoint3D.html#L6079](MonoPoint3D.html#L6079)
2. `checkFileSizeLimits` → [MonoPoint3D.html#L6297](MonoPoint3D.html#L6297)
3. `showFileSizeWarning`（必要時）→ [MonoPoint3D.html#L6400](MonoPoint3D.html#L6400)
4. `updateFileInfo` → [MonoPoint3D.html#L6481](MonoPoint3D.html#L6481)

ポイント:
- 閾値は `FILE_SIZE_THRESHOLDS` で一元管理
- `warning/critical` は継続可能、`maximum` は継続不可

### 19.2 2GB超を読み込み開始時に防ぐ

処理経路:
1. `startDataLoading` → [MonoPoint3D.html#L6938](MonoPoint3D.html#L6938)
2. `loadLASFileActual` → [MonoPoint3D.html#L7315](MonoPoint3D.html#L7315)
3. `checkFileSizeLimits` 再評価 → [MonoPoint3D.html#L6297](MonoPoint3D.html#L6297)
4. `canProceed=false` なら警告表示して例外終了

ポイント:
- 選択時チェックに加えて、読み込み直前でも同じ判定を実施

### 19.3 通常読み込み（LAS/LAZ）から表示完了まで

処理経路:
1. `startDataLoading` → [MonoPoint3D.html#L6938](MonoPoint3D.html#L6938)
2. `loadLASFileActual` → [MonoPoint3D.html#L7315](MonoPoint3D.html#L7315)
3. `buildPointCloudFromArrayBuffer` → [MonoPoint3D.html#L7638](MonoPoint3D.html#L7638)
4. `parsePointsFromArrayBuffer` → [MonoPoint3D.html#L7715](MonoPoint3D.html#L7715)
5. `parseLASPoints` or `decompressLAZFile` → [MonoPoint3D.html#L7917](MonoPoint3D.html#L7917) / [MonoPoint3D.html#L8049](MonoPoint3D.html#L8049)
6. `createPointCloudFromData` → [MonoPoint3D.html#L8385](MonoPoint3D.html#L8385)
7. `completeLoading` → [MonoPoint3D.html#L9140](MonoPoint3D.html#L9140)

ポイント:
- 点群生成後に `statsData` と分類統計が更新される
- `complete` ステップへ遷移後に `animate` ループが有効化

### 19.4 分類表示の品質が低いデータ

処理経路:
1. `setColorMode('classification')` → [MonoPoint3D.html#L9351](MonoPoint3D.html#L9351)
2. `executeColorModeChange` → [MonoPoint3D.html#L9372](MonoPoint3D.html#L9372)
3. `getClassificationStats` / `updateLegendPanel` → [MonoPoint3D.html#L9559](MonoPoint3D.html#L9559) / [MonoPoint3D.html#L9765](MonoPoint3D.html#L9765)

ポイント:
- 未分類率や分類種類数に基づいて警告ログとUI指標が更新される
- 必要に応じて `autoClassify` で再分類可能
- 未分類率の算出で参照する分類コードは処理系で差がある（例: `createPointCloudFromData` は `0/1`、`getClassificationStats` は `1`）

### 19.5 メモリ圧・性能低下時の自動劣化

処理経路:
1. `MemoryMonitor.checkMemoryUsage`（定期）→ [MonoPoint3D.html#L4753](MonoPoint3D.html#L4753)
2. `PerformanceMonitor.checkPerformance`（FPS監視）→ [MonoPoint3D.html#L4929](MonoPoint3D.html#L4929)
3. `downsamplePointCloud` → [MonoPoint3D.html#L8759](MonoPoint3D.html#L8759)

ポイント:
- 条件を満たすと点数間引き・点サイズ調整が行われる
- `statsData.displayPoints` と分類統計が再計算される
