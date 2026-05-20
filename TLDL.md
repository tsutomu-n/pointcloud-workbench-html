# TLDL: PointCloudWorkbench 監査要約

## 1. エグゼクティブ要約

PointCloudWorkbench は `PointCloudWorkbench.html` 単体で動作する、ブラウザー実行型 LAS/LAZ ワークベンチです。  
基本方針は Client-Max / Server-Zero で、点群本体はサーバーに送信せずローカル処理します。  
一方で実行時は CDN 依存（`three.js` / `laz-perf` / `simple-statistics` / `Flatbush` / `simpleheat`）があり、完全オフライン常用には向きません。  
品質面は Bun テスト、README 整合チェック、Server-Zero ガードで守られています。  
主要な注意点は、Chrome/Edge 限定、LAZ 2GB 上限、LAS 2-3GB 実験帯、計測は表示点ベース、CRS は診断のみで変換しないことです。  
この文書は、現状事実・誤謬リスク・改善余地を1ファイルで判断できるようにまとめた監査用サマリです。

## 2. リポジトリの事実

### 2.1 Scope

- 主成果物: `PointCloudWorkbench.html`（単一配布）
- 付帯成果物: `README.md`、日本語ドキュメント群、`scripts/` の検証コード
- 公開導線: `index.html`（ランディング） + `PointCloudWorkbench.html`（本体）

### 2.2 構成

- 実装本体: `PointCloudWorkbench.html`
- 回帰テスト: `scripts/pointcloud-workbench.test.js`
- ドキュメント整合: `scripts/documentation-consistency.test.js`
- 公開健全性: `scripts/public-repo-readiness.test.js`
- 方針ガード: `scripts/check-readme.js`、`scripts/check-server-zero.js`

### 2.3 実行モデル

- Server-Zero: API/DB/Worker/Functions なし（通常経路）
- 点群データ: ブラウザー内ローカル処理（アップロードなし）
- 依存: CDN 配信の `three.js` / `laz-perf` / `simple-statistics` / `Flatbush` / `simpleheat`
- ブラウザー方針: Chrome / Edge のみ対象（Safari / Firefox 非対応）

## 3. できること・できないこと

### 3.1 できること

- `.las` / `.laz` のローカル読み込みと可視化
- 3D/2D 切替、スライス確認、分類確認、統計確認
- 表示点ベース距離計測（履歴付き）
- LAS/LAZ ヘッダ・VLR・EVLR 由来 CRS 診断（WKT/GeoTIFF/EPSG 候補）
- 手動コピー型診断レポート出力（自動送信なし）

### 3.2 できないこと（仕様境界）

- 点群のサーバーアップロード
- サーバー側点群処理、DB 書き込み、テレメトリ自動送信
- CRS 座標変換、EPSG DB 照会、ジオコーディング、外部 CRS 解決
- Safari/Firefox 対応

## 4. 品質保証の実態

### 4.1 自動検証で守っていること

- `scripts/check-server-zero.js`:
  - 禁止ディレクトリ（`functions` / `src/functions` / `api`）検出
  - 禁止ファイル（`_worker.js`）検出
  - 禁止パターン（`/api` 呼び出し、telemetry、point cloud upload 等）検出
  - static manifest の `runtime.serverProcessing/pointCloudUpload/telemetry=false` を検証
  - Cloudflare Pages 25MiB 上限を検証
- `scripts/documentation-consistency.test.js`:
  - サイズ制限、ブラウザー制約、CRS 境界の文書整合を検証
- `scripts/public-repo-readiness.test.js`:
  - OSS 公開に必要な文書・workflow・manifest・ランディング要素を検証

### 4.2 検証で守り切れていない領域

- 性能 SLO（ロード時間/FPS/メモリしきい値）の定量保証
- 実機差分（GPU/ドライバ/OS差）に対する再現性保証
- CDN 障害時の可用性保証
- 文書テストの多くは文字列存在確認であり、意味整合の深い検証ではない

## 5. 誤謬リスク台帳

### High-1: 対応ブラウザー誤認

- 根拠: README とテストが Chrome/Edge 限定を明示
- 誤解パターン: 「Webアプリだから主要ブラウザー全対応」と思い込む
- 実害: Safari/Firefox で初期化失敗・サポート問い合わせ増
- 検知方法: 問い合わせ UA 集計、失敗再現手順確認
- 抑止策: 入口（index/README/運用手順）で「非対応」を強調
- 優先度: High

### High-2: CDN 単点依存の可用性誤認

- 根拠: 実行時に `three.js` / `laz-perf` / `simple-statistics` / `Flatbush` / `simpleheat` を CDN から取得
- 誤解パターン: 「ローカル処理なので完全オフラインで常時動く」と解釈
- 実害: CDN 障害・遮断環境で起動不可
- 検知方法: DevTools Network で外部取得失敗を確認
- 抑止策: README に依存を明記し、障害時の運用手順を追加
- 優先度: High

### High-3: 大容量運用の過信

- 根拠: LAS >3GB 拒否、LAZ >2GB 拒否、LAS 2-3GB は experimental
- 誤解パターン: 「上限未満なら安定」と誤認
- 実害: メモリ逼迫、フリーズ、操作不能
- 検知方法: プリフライトのリスク表示、実測メモリ確認
- 抑止策: 2-3GB 帯は LOW 推奨を明示し、運用上限を別途定義
- 優先度: High

### High-4: 計測精度の誤認

- 根拠: 計測は表示点ベース、原点群全点ではない
- 誤解パターン: 「測定値=元データの厳密距離」と解釈
- 実害: 業務判断の誤差・説明責任リスク
- 検知方法: 計測結果表示とドキュメント整合を確認
- 抑止策: UI と手順書で「表示点ベース」を明示
- 優先度: High

### High-5: CRS 診断の機能誤解

- 根拠: CRS は診断のみ、座標変換/外部照会なし
- 誤解パターン: 「EPSG が出るなら変換できる」と誤認
- 実害: 下流 GIS 工程で前提崩壊
- 検知方法: 仕様説明と問い合わせ内容の突合
- 抑止策: 「診断であり変換ではない」を反復明示
- 優先度: High

### Medium-1: 単一巨大 HTML の保守性低下

- 根拠: 実装の大半が1ファイル集中
- 誤解パターン: 小変更でも影響範囲が限定されると誤認
- 実害: レビュー漏れ・回帰リスク増
- 検知方法: PR 差分と回帰観点の抜け確認
- 抑止策: 変更チェックリストとテスト観点の定型化
- 優先度: Medium

### Medium-2: Server-Zero ガードの過信

- 根拠: パターン検出中心で、意味解析ではない
- 誤解パターン: 「ガードに通れば完全に安全」と解釈
- 実害: 抜け道実装の見逃し
- 検知方法: 人手レビューで境界逸脱を確認
- 抑止策: PR テンプレートに境界自己申告項目を維持
- 優先度: Medium

### Low-1: 文書と実装の将来乖離

- 根拠: ドキュメント量が多く更新漏れ余地がある
- 誤解パターン: 古い記述を現行仕様と誤認
- 実害: 利用者混乱
- 検知方法: doc consistency test + 手動レビュー
- 抑止策: 仕様変更時の同時更新ルールを徹底
- 優先度: Low

## 6. 抜け・漏れ・割愛の監査結果

### 6.1 仕様欠落（文書間）

- 欠落候補: なし（主要制約は README / 日本語 docs / 運用手順で整合）
- 留意点: 将来機能追加時に「できないこと」更新漏れが起きやすい

### 6.2 検証欠落（自動テスト）

- 欠落: 非機能の受け入れ基準（性能・メモリ・操作体感）の自動基準が未定義
- 欠落: 文書整合は主に文言存在検査で、意味的整合の保証は弱い

### 6.3 運用欠落（障害時）

- 欠落: CDN 不達時の明確な運用手順（代替配布、復旧判断）
- 欠落: 非対応ブラウザー利用時の問い合わせテンプレート

### 6.4 公開運用欠落（OSS）

- 欠落: 機能拡張提案に対する「Server-Zero 境界判定テンプレート」
- 欠落: 大容量データの推奨運用プロファイル（サイズ帯別）

## 7. つっこみどころ（主張と実証のギャップ）

| 主張 | 実証できる事実 | ギャップ/誤解余地 |
|---|---|---|
| No install / No build | 実行時ビルド不要 | 開発保守には Bun とCIが必要 |
| ローカル処理 | LAS/LAZはアップロードしない | 実行依存は CDN 経由 |
| OSS-ready | 検証スクリプト・CI・文書は整備済み | 非機能SLOは明文化不足 |
| Server-Zero | manifest + 禁止パターン検査あり | 静的検査中心で意味解析ではない |

## 8. Better化ロードマップ

### 短期（低コスト・高効果）

1. 制約早見表を README と運用手順へ追加（対応ブラウザー、サイズ上限、計測前提、CRS境界）
2. CDN 障害時 FAQ を追加（症状・確認手順・回避策）
3. 問い合わせテンプレートを整備（非対応ブラウザー、計測誤解、CRS誤解）

### 中期（運用安定化）

1. 代表サンプルで非機能ベースラインを記録（ロード時間、メモリ、操作感）
2. サイズ帯別推奨運用（例: 0-1GB / 1-2GB / 2-3GB）を定義
3. Server-Zero 境界レビュー項目を PR テンプレートへ強化

### 長期（保守性改善）

1. 単一HTML維持を前提に、内部責務の論理分割方針を文書化
2. 変更影響チェックを定型化し、回帰観点を先に提示する運用へ移行

## 9. 日常運用チェックリスト

### 9.1 変更前後で必須

1. `bun test scripts/pointcloud-workbench.test.js scripts/documentation-consistency.test.js scripts/gitignore.test.js scripts/repository-metadata.test.js scripts/public-repo-readiness.test.js scripts/landing-page-i18n.test.js`
2. `bun scripts/check-readme.js`
3. `bun scripts/check-server-zero.js`

### 9.2 合格条件

- テスト全件 pass
- README check OK
- Server-Zero check OK
- 変更に応じて README / 日本語 docs / 運用手順 / 実装リファレンスが同期

## 10. 意思決定ログ（この文書の前提）

- この文書は「機能紹介」ではなく「監査と意思決定の補助」を優先する。
- 断定は、現行コード・テスト・ドキュメントの確認済み事実に限定する。
- 未実装の改善は提案として明示し、現状機能としては書かない。
