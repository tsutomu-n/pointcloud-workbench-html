# PointCloudWorkbench 運用手順書

更新日時: 2026-03-02 11:44:07 JST

## 1. 目的
- 対象: `PointCloudWorkbench.html` の日常運用を担当する利用者、運用担当、検証担当
- 目的: 安定運用のための標準操作、警告時の対応、確認観点を明確化する

## 2. 前提環境
- 推奨ブラウザ: Chrome / Edge / Firefox の最新版
- 必須機能: WebGL、File API、ArrayBuffer
- 取り扱い対象: `.las`, `.laz`
- 画面上の上限表示: 最大 2GB

## 3. 起動手順
1. `PointCloudWorkbench.html` をブラウザで開く
2. 初期画面で「ファイル選択」パネルが表示されることを確認する
3. 必要に応じて右上の言語セレクタ（日本語/English/中文）を選択する
4. 言語セレクタは `lang` 属性と保存値のみを切替える機能であり、UI文言の自動翻訳は行われないことを理解する

## 4. 標準操作フロー

### 4.1 ファイル選択
1. ドラッグ&ドロップ、または「ファイルを選択」で LAS/LAZ を選ぶ
2. ファイル情報と警告表示を確認する
3. 「品質設定へ」を押す

### 4.2 品質設定
1. `LOW / MEDIUM / HIGH / MAX` から品質を選択する
2. 推定読み込み時間、推定メモリ、推奨 FPS、表示点数を確認する
3. 「読み込み開始」を押す

### 4.3 読み込み中
1. 進捗バー、残り時間、現在処理を監視する
2. 必要なら「キャンセル」または `ESC` で中断する

### 4.4 読み込み完了後
1. 右側の制御パネルで視点・表示モードを操作する
2. 必要に応じて「種類で色分け」「スライス表示」「自動分類」を使う（分類品質が低い場合は確認モーダルが出る）
3. 統計パネルで点数・分類内訳・処理時間を確認する

## 5. ファイルサイズ警告の運用基準

| サイズ帯 | 表示レベル | 推奨対応 |
|---|---|---|
| 100MB以下 | `ok` | 通常運用 |
| 100MB超〜500MB以下 | `advisory` | `MEDIUM` 以下から開始 |
| 500MB超〜1GB以下 | `warning` | `LOW` または `MEDIUM` 推奨 |
| 1GB超〜2GB以下 | `critical` | `LOW` 推奨、PC負荷を監視 |
| 2GB超 | `maximum` | 読み込み不可、別ファイルを使用 |

注記:
- 判定は `>` 比較で実装されているため、ちょうど `2GB` は `critical` 扱い（継続可能）です。

## 6. 日常操作で使う主要機能
- 視点切替: 正面、真上、側面、背面、全体表示
- 表示モード: 標高で色分け、種類で色分け
- 2D切替: 2D上面/2D正面/2D右側/3D戻る
- スライス表示: 断面確認、2Dスライス表示
- 自動分類: 高さ情報から分類を再生成
- CADモード: Z-up 表示へ切替
- 凡例パネル: `window.toggleLegendPanel()` で開閉可能（現在のUIに専用ボタン導線はない）

## 7. 警告・エラー時の対応

### 7.1 メモリ警告
- 症状: メモリ警告ダイアログ表示、描画が重い
- 対応:
1. 品質を `LOW` にする
2. 不要なら `goHome` でデータをクリアして再読込
3. ブラウザタブを整理して再試行

### 7.2 パフォーマンス警告
- 症状: FPS低下、描画応答遅延
- 対応:
1. `LOW` へ変更
2. 「種類で色分け」より「標高で色分け」を優先
3. スライス表示や追加処理を一時停止

### 7.3 読み込み失敗
- 症状: 読み込み中にエラートースト表示
- 対応:
1. 品質を下げて再実行
2. ファイルサイズと拡張子を確認
3. 必要ならブラウザを再起動して再試行

## 8. セッション終了とリセット
- 画面上部の「ファイル選択」またはタイトル押下でホームに戻る
- 戻る際は確認ダイアログが表示され、現在の点群は破棄される
- 緊急時は `window.performFinalCleanup()` でクリーンアップ可能

## 9. 運用チェックリスト
- `.las` と `.laz` の両方で読み込みできる
- 2GB超ファイルで読み込み拒否される
- 品質切替時に推定値が更新される
- 読み込み完了後に視点・表示モードが操作可能
- 分類モード時に（必要なら `window.toggleLegendPanel()` で表示して）統計値と凡例内容が整合している
- `goHome` 後に次のファイル選択が正常にできる

## 10. 改訂時のルール
- 操作導線やボタン名を変更した場合は本書を更新する
- 警告閾値や運用推奨値を変更した場合はサイズ基準表を更新する

## 11. 関数クイックリンク（運用で参照する主要処理）

| 関数 | 行番号リンク | 参照用途 |
|---|---|---|
| `loadSampleData` | [PointCloudWorkbench.html#L6511](PointCloudWorkbench.html#L6511) | サンプルデータ選択 |
| `proceedToQualitySelection` | [PointCloudWorkbench.html#L6570](PointCloudWorkbench.html#L6570) | 品質設定画面への遷移 |
| `applyQualitySelection` | [PointCloudWorkbench.html#L6640](PointCloudWorkbench.html#L6640) | 品質選択反映 |
| `startDataLoading` | [PointCloudWorkbench.html#L6938](PointCloudWorkbench.html#L6938) | 読み込み開始 |
| `cancelLoading` | [PointCloudWorkbench.html#L7061](PointCloudWorkbench.html#L7061) | 読み込みキャンセル |
| `loadLASFileActual` | [PointCloudWorkbench.html#L7315](PointCloudWorkbench.html#L7315) | 実ファイル読み込み本体 |
| `completeLoading` | [PointCloudWorkbench.html#L9140](PointCloudWorkbench.html#L9140) | 読み込み完了遷移 |
| `goBackToFileSelect` | [PointCloudWorkbench.html#L6738](PointCloudWorkbench.html#L6738) | ファイル選択に戻る |
| `goHome` | [PointCloudWorkbench.html#L6923](PointCloudWorkbench.html#L6923) | ホーム復帰 |
| `set2DView` | [PointCloudWorkbench.html#L9096](PointCloudWorkbench.html#L9096) | 2D表示切替 |
| `exit2DView` | [PointCloudWorkbench.html#L9105](PointCloudWorkbench.html#L9105) | 3D表示へ復帰 |
| `setColorMode` | [PointCloudWorkbench.html#L9351](PointCloudWorkbench.html#L9351) | 色分けモード切替 |
| `toggleLegendPanel` | [PointCloudWorkbench.html#L9755](PointCloudWorkbench.html#L9755) | 凡例表示切替（開発者コンソール/API向け） |
| `toggleSlicing` | [PointCloudWorkbench.html#L10083](PointCloudWorkbench.html#L10083) | スライス表示開始/停止 |
| `show2DSliceView` | [PointCloudWorkbench.html#L10659](PointCloudWorkbench.html#L10659) | 2D断面表示 |
| `resetSlicing` | [PointCloudWorkbench.html#L10635](PointCloudWorkbench.html#L10635) | スライス設定リセット |
| `toggleCADMode` | [PointCloudWorkbench.html#L10412](PointCloudWorkbench.html#L10412) | CADモード切替 |
| `autoClassify` | [PointCloudWorkbench.html#L11535](PointCloudWorkbench.html#L11535) | 自動分類実行 |
| `toggleStatsPanel` | [PointCloudWorkbench.html#L12603](PointCloudWorkbench.html#L12603) | 統計パネル切替 |
| `toggleControlsPanel` | [PointCloudWorkbench.html#L12622](PointCloudWorkbench.html#L12622) | 制御パネル表示切替 |
| `performFinalCleanup` | [PointCloudWorkbench.html#L12957](PointCloudWorkbench.html#L12957) | 緊急クリーンアップ |

## 12. ユースケース別ガイド（事実ベース）

### 12.1 大容量ファイル（約700MB）を安定して開く

前提:
- 500MB超〜1GB以下は `warning` 扱い
- 1GB超〜2GB以下は `critical` 扱い

操作:
1. `.las` または `.laz` を選択する
2. サイズ警告が出たら「LOW品質で試す」を選ぶか、品質画面で `LOW` を選択する
3. 読み込み開始後、進捗と残り時間を確認する

期待結果:
- 読み込みは継続可能
- 操作遅延が出る場合は `LOW` で再読み込みすると改善しやすい

### 12.2 2GB超ファイルを選択した場合

前提:
- 2GB超は `maximum`（読み込み不可）

操作:
1. 2GBを超えるファイルを選択する

期待結果:
- サイズ警告が表示され、読み込みは中止される
- 別ファイルの再選択が必要

### 12.3 分類表示でほぼ単色になる場合（未分類が多い）

前提:
- 未分類率が高いデータでは分類色の差が出にくい

操作:
1. 「種類で色分け」に切替える（必要に応じて確認モーダルで続行を選ぶ）
2. 色差が乏しい場合は「標高で色分け」に戻す
3. 必要なら「自動分類」を実行して再評価する

期待結果:
- 標高表示で地形差を確認しやすくなる
- 自動分類後は分類色の分離が改善する場合がある

### 12.4 読み込み中に中断して復帰する

操作:
1. 読み込み中に「キャンセル」または `ESC` を押す
2. 品質選択へ戻り、品質を下げて再実行する

期待結果:
- 読み込みが中断され、品質選択画面へ戻る
- `LOW` で再試行すると成功率が上がる

### 12.5 断面を確認したい（2Dスライス）

操作:
1. 読み込み完了後に「スライス表示を開始」を押す
2. 断面位置を調整する
3. 「2Dスライス表示」で断面キャンバスを確認する
4. 不要になったら「スライス設定リセット」

期待結果:
- 断面上の点密度や分布を平面で確認できる
- 3D表示と併用して内部構造を追える

## 13. 事実確認メモ（誤読防止）
- 行番号リンクは更新日時時点で検証済み。`PointCloudWorkbench.html` 更新後は再確認が必要。
- `toggleLegendPanel()` は公開APIだが、現状UIから直接押すボタンはない。
- 読み込み中 `ESC` は `cancelLoading()` として機能するが、`complete` ステップでは別動作（パネル閉じなど）になる。
