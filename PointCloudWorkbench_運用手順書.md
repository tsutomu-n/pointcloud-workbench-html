# PointCloudWorkbench 運用手順書

更新日時: 2026-05-21 00:00:00 JST

## 1. 目的
- 対象: `PointCloudWorkbench.html` の日常運用を担当する利用者、運用担当、検証担当
- 目的: 安定運用のための標準操作、警告時の対応、確認観点を明確化する

## 2. 前提環境
- 推奨ブラウザ: Chrome / Edge の最新版のみ対応
- 非対応ブラウザ: Safari、Firefox、古いブラウザー
- 必須機能: WebGL、File API、ArrayBuffer
- 取り扱い対象: `.las`, `.laz`
- 画面上の上限表示: `.las` 最大 3GB / `.laz` 最大 2GB
- 実装上の上限: LAS は 3GB超、LAZ は 2GB超で読み込み不可
- 選択した LAS/LAZ ファイルはブラウザー内で処理し、アプリケーションサーバーへアップロードしない
- Cloudflare / Pages は静的配信を基本とし、通常経路で Workers、Pages Functions、API、telemetry、DB、サーバー側点群処理を使わない

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
3. ローカル `LAS` は chunked 読み込み、ローカル `LAZ` は chunked で内部デコーダへ転送されるため、大容量時は進捗が段階的に進む

### 4.4 読み込み完了後
1. 右側の制御パネルで視点・表示モードを操作する
2. 必要に応じて「種類で色分け」「距離計測」「スライス表示」「自動分類」を使う（分類品質が低い場合は確認モーダルが出る）
3. 統計パネルで点数・分類内訳・処理時間を確認する

### 4.5 CRS 診断の確認
1. 読み込み完了後、統計パネル内の「CRS 診断」を確認する
2. `水平 CRS`、`垂直 CRS / 高さ基準`、`EPSG 候補`、`情報源`、`単位`、`注意` を確認する
3. `不明` は、LAS/LAZ 内の CRS メタデータだけでは判断できない状態を示す。座標値そのものが無効という意味ではない
4. 高さ基準が `不明` の場合、Z 値を T.P. 標高、楕円体高、任意高のどれかとして断定しない
5. 必要に応じて「問い合わせ文をコピー」を押し、発注者、測量者、データ提供者に座標系と高さ基準を確認する
6. コピー文にはローカルファイル名、点群 payload、座標配列は含まれない

### 4.6 取得品質と作業メモの確認
1. 読み込み完了後、「診断情報をコピー」で `acquisitionQuality` を確認する
2. `return`, `scanAngle`, `gpsTime` の利用可否と sampled coverage を、取得状態の参考情報として扱う
3. `gpsTimeMonotonicRatio` は警告用の補助指標であり、測量成果の時系列品質を保証するものではない
4. 診断情報の `location.coordinateReference` で CRS 診断、`location.bounds` で元座標系内の範囲と中心を確認する
5. `location.latLon.status` が `converted` の場合だけ、bounds 中心の推定緯度経度として扱う
6. `location.latLon.primary` と `location.latLon.alternateAxis` を比較し、Google Maps / 地理院地図で河川現場の想定位置に近い方を確認する
7. 統計パネルの Google Maps / 地理院地図リンクは、クリック時だけ外部地図へ緯度経度を渡す。LAS/LAZ ファイル本体、ファイル名、点群 payload は送らない
8. CRS が不明、EPSG 候補が複数、未対応 EPSG、bounds 不足、`proj4js` 未読込の場合、`location.latLon.status` は `unavailable` になる
9. 緯度経度は住所、河川現場の正確な境界、測量成果座標、納品用位置保証として扱わない
10. CRS が不明な場合、`location.bounds` は住所や緯度経度ではなく、元座標系内の数値範囲として扱う
11. 統計パネルの「作業メモコピー」を押すと、現在の表示、断面、計測履歴、異常候補、取得品質の要約を JSON でコピーできる
12. 作業メモにはローカルファイル名、点群 payload、元LAS座標配列は含まれない

### 4.7 地表候補アシストの確認
1. 読み込み完了後、統計パネルの「地表候補」と「地表方式」を確認する
2. `class 2 ground` は ground分類点を優先した参考地表、`p05推定` は分類が薄い場合の下位パーセンタイル推定を示す
3. `confidence` と有効セル率が低い場合、地表候補を勾配、土量、成果品DTMの根拠にしない
4. 地表候補アシストは表示点ベースの参考診断であり、測量成果DTM、設計面、切盛根拠ではない

## 5. ファイルサイズ警告の運用基準

| サイズ帯 | 表示レベル | 推奨対応 |
|---|---|---|
| 100MB以下 | `ok` | 通常運用 |
| 100MB超〜500MB以下 | `advisory` | `MEDIUM` 以下から開始 |
| 500MB超〜1GB以下 | `warning` | `LOW` または `MEDIUM` 推奨 |
| 1GB超〜2GB以下 | `critical` | LAS/LAZ とも `LOW` 推奨、PC負荷を監視 |
| LAS: 2GB超〜3GB以下 | `critical` | 実験運用帯。`LOW` 推奨、PC負荷を監視 |
| LAZ: 2GB超 | `maximum` | 読み込み不可。LAS 変換または別ファイルを使用 |
| LAS: 3GB超 | `maximum` | 読み込み不可、別ファイルを使用 |

注記:
- 判定は `>` 比較で実装されているため、LAS はちょうど `3GB`、LAZ はちょうど `2GB` まで `critical` 扱い（継続可能）です。
- LAS の `2GB超〜3GB以下` は実験運用帯です。`LOW` 品質から開始し、キャンセル復帰やブラウザ負荷を監視してください。

## 6. 日常操作で使う主要機能
- 視点切替: 正面、真上、側面、背面、全体表示
- 表示モード: 標高で色分け、種類で色分け
- 距離計測: 表示点を2点クリックし、3D距離、水平距離、高さ差、元LAS基準の dX/dY/dZ を確認
- 2D切替: 2D上面/2D正面/2D右側/3D戻る
- スライス表示: 断面確認、2Dスライス表示
- 自動分類: 高さ情報から分類を再生成
- CRS 診断: LAS/LAZ の header / VLR / EVLR に含まれる WKT、GeoTIFF、EPSG 候補を統計パネルで確認
- 取得品質: LAS/LAZ の point format と sampled return / scan-angle / GPS-time coverage を手動診断 JSON で確認
- 地表候補: class 2 ground または p05 推定による表示点ベースの参考地表を統計パネルで確認
- 作業メモコピー: 現在の表示、断面、計測、異常候補、取得品質の要約をファイル名なしでコピー
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

### 7.4 CRS 診断の警告
- `CRS 不明`: LAS/LAZ 内から水平 CRS 候補を確認できない。地球上の位置特定には成果簿や提供元情報を確認する
- `高さ基準は不明`: 水平位置は確認できても、Z 値を標高として使うには垂直 CRS または成果簿の確認が必要
- `複数 CRS 候補あり`: WKT と GeoTIFF の候補が異なる可能性がある。アプリ表示では WKT を優先し、最終成果には提供元確認を挟む
- `parse-warning` / `evlr-skipped`: 壊れた record、不正 offset、診断上限超過などにより一部 metadata を読めない。点群表示の成否とは別に扱う

## 8. セッション終了とリセット
- 画面上部の「ファイル選択」またはタイトル押下でホームに戻る
- 戻る際は確認ダイアログが表示され、現在の点群は破棄される
- 緊急時は `window.performFinalCleanup()` でクリーンアップ可能

## 9. 運用チェックリスト
- `.las` と `.laz` の両方で読み込みできる
- LAS は 3GB超、LAZ は 2GB超で読み込み拒否される
- 品質切替時に推定値が更新される
- 読み込み完了後に視点・表示モードが操作可能
- 距離計測で2点クリック後に結果と履歴が表示され、個別削除、全消去、コピーが動作する
- 分類モード時に（必要なら `window.toggleLegendPanel()` で表示して）統計値と凡例内容が整合している
- 統計パネルの CRS 診断で、CRS あり / CRS なし / 高さ基準不明が空欄ではなく明示される
- CRS 問い合わせ文コピーに、ローカルファイル名、点群 payload、座標配列が含まれない
- 手動診断 JSON の `acquisitionQuality` が空欄ではなく、利用可能 signal、score、warning を出す
- 統計パネルの地表候補が、方式、confidence、有効セル率を表示し、成果品DTMではないことを運用上理解できる
- 作業メモコピーに、表示・断面・計測・異常候補・取得品質の要約が含まれ、ローカルファイル名、点群 payload、元LAS座標配列が含まれない
- `goHome` 後に次のファイル選択が正常にできる

## 10. 改訂時のルール
- 操作導線やボタン名を変更した場合は本書を更新する
- 警告閾値や運用推奨値を変更した場合はサイズ基準表を更新する

## 11. 関数クイックリンク（運用で参照する主要処理）

| 関数 | 行番号リンク | 参照用途 |
|---|---|---|
| `loadSampleData` | [PointCloudWorkbench.html#L9998](PointCloudWorkbench.html#L9998) | サンプルデータ選択 |
| `proceedToQualitySelection` | [PointCloudWorkbench.html#L10075](PointCloudWorkbench.html#L10075) | 品質設定画面への遷移 |
| `applyQualitySelection` | [PointCloudWorkbench.html#L10145](PointCloudWorkbench.html#L10145) | 品質選択反映 |
| `startDataLoading` | [PointCloudWorkbench.html#L11356](PointCloudWorkbench.html#L11356) | 読み込み開始 |
| `cancelLoading` | [PointCloudWorkbench.html#L11495](PointCloudWorkbench.html#L11495) | 読み込みキャンセル |
| `loadLASFileActual` | [PointCloudWorkbench.html#L11876](PointCloudWorkbench.html#L11876) | 実ファイル読み込み本体 |
| `completeLoading` | [PointCloudWorkbench.html#L14991](PointCloudWorkbench.html#L14991) | 読み込み完了遷移 |
| `goBackToFileSelect` | [PointCloudWorkbench.html#L10252](PointCloudWorkbench.html#L10252) | ファイル選択に戻る |
| `goHome` | [PointCloudWorkbench.html#L11341](PointCloudWorkbench.html#L11341) | ホーム復帰 |
| `set2DView` | [PointCloudWorkbench.html#L14868](PointCloudWorkbench.html#L14868) | 2D表示切替 |
| `exit2DView` | [PointCloudWorkbench.html#L14878](PointCloudWorkbench.html#L14878) | 3D表示へ復帰 |
| `setColorMode` | [PointCloudWorkbench.html#L15222](PointCloudWorkbench.html#L15222) | 色分けモード切替 |
| `toggleLegendPanel` | [PointCloudWorkbench.html#L15558](PointCloudWorkbench.html#L15558) | 凡例表示切替（開発者コンソール/API向け） |
| `toggleSlicing` | [PointCloudWorkbench.html#L15886](PointCloudWorkbench.html#L15886) | スライス表示開始/停止 |
| `show2DSliceView` | [PointCloudWorkbench.html#L16462](PointCloudWorkbench.html#L16462) | 2D断面表示 |
| `resetSlicing` | [PointCloudWorkbench.html#L16438](PointCloudWorkbench.html#L16438) | スライス設定リセット |
| `toggleCADMode` | [PointCloudWorkbench.html#L16215](PointCloudWorkbench.html#L16215) | CADモード切替 |
| `autoClassify` | [PointCloudWorkbench.html#L17333](PointCloudWorkbench.html#L17333) | 自動分類実行 |
| `toggleStatsPanel` | [PointCloudWorkbench.html#L18408](PointCloudWorkbench.html#L18408) | 統計パネル切替 |
| `toggleControlsPanel` | [PointCloudWorkbench.html#L18427](PointCloudWorkbench.html#L18427) | 制御パネル表示切替 |
| `performFinalCleanup` | [PointCloudWorkbench.html#L18891](PointCloudWorkbench.html#L18891) | 緊急クリーンアップ |

## 12. ユースケース別ガイド（事実ベース）

### 12.1 大容量ファイル（約700MB）を安定して開く

前提:
- 500MB超〜1GB以下は `warning` 扱い
- 1GB超〜2GB以下は LAS/LAZ とも `critical` 扱い
- LAS の 2GB超〜3GB以下は `critical` のまま継続可能な実験運用帯

操作:
1. `.las` または `.laz` を選択する
2. サイズ警告が出たら「LOW品質で試す」を選ぶか、品質画面で `LOW` を選択する
3. 読み込み開始後、進捗と残り時間を確認する

期待結果:
- 読み込みは継続可能
- 操作遅延が出る場合は `LOW` で再読み込みすると改善しやすい

### 12.2 上限を超えるファイルを選択した場合

前提:
- LAS は 3GB超、LAZ は 2GB超で `maximum`（読み込み不可）

操作:
1. 上限を超える LAS/LAZ ファイルを選択する

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

### 12.6 2点間の距離を確認したい

前提:
- 距離計測は表示中のサンプリング点への計測であり、元LAS/LAZ全点への最近傍探索ではない
- 距離は `m相当` として表示され、元データの座標単位に依存する
- 推定ピークRAMには、計測用に保持する元座標メモリも含まれる
- 計測履歴はページ内の一時状態で、最大20件まで保持される

操作:
1. 読み込み完了後に「距離計測を開始」を押す
2. 点群上の1点目をクリックする
3. 点群上の2点目をクリックする
4. 3D距離、水平距離、高さ差、元LAS基準の dX/dY/dZ を確認する
5. 続けて別の2点をクリックすると、前の結果を残したまま履歴に追加される
6. 必要なら上部の「コピー」で最新結果を控え、履歴行の「コピー」で任意の結果を控える
7. 不要な履歴は行ごとの「削除」で消し、すべて消す場合は「計測を全消去」を押す
8. 計測操作だけ終了したい場合は「計測モード終了」または `Esc` を押す

期待結果:
- 各2点に色付きピン、2点間に線が表示され、距離値は右パネルと履歴に表示される
- 履歴行にマウスを重ねる、フォーカスする、またはクリック/Enter/Spaceで選択すると、対応する3D計測表示が強調される
- ドラッグによる視点操作では誤計測されない
- 計測モード終了後も履歴は残り、Home復帰、新規読み込み、計測全消去で計測表示が消える

## 13. 事実確認メモ（誤読防止）
- 行番号リンクは更新日時時点で検証済み。`PointCloudWorkbench.html` 更新後は再確認が必要。
- `toggleLegendPanel()` は公開APIだが、現状UIから直接押すボタンはない。
- 読み込み中 `ESC` は `cancelLoading()` として機能するが、`complete` ステップでは別動作（パネル閉じなど）になる。
