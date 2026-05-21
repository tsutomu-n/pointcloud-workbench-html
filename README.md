# PointCloudWorkbench

ブラウザーで動く LAS/LAZ 点群ワークベンチです。単一の HTML ファイルとして配布します。

インストール不要。ビルド不要。ライブデモを開き、同梱サンプル LAS を読み込み、3D/2D 表示、スライス、分類、統計ツールで点群を確認できます。

- English README: [`./docs/README.en.md`](./docs/README.en.md)

## ライブデモ

- ランディングページ: `https://tsutomu-n.github.io/pointcloud-workbench-html/`
- アプリを直接開く: `https://tsutomu-n.github.io/pointcloud-workbench-html/PointCloudWorkbench.html`
- 同梱サンプル LAS: `https://tsutomu-n.github.io/pointcloud-workbench-html/demo/pointcloud-demo-sample.las`
- ランディングページはブラウザ言語（`ja` / `en` / `zh`）に合わせて表示を切り替えられ、手動の言語切替もできます。

## ビジュアルツアー

- 将来のスクリーンショット素材は `assets/` に置きます。
- `assets/landing-hero.png`: GitHub Pages ランディングページのヒーロー画像。暗いターミナル風の見た目、大きな `PointCloudWorkbench.` タイポグラフィ、アプリ起動・サンプル LAS ダウンロード・リポジトリアクセスの3つの CTA を見せます。
- `assets/preflight-panel.png`: 同梱サンプル選択直後のアプリ画面。読み込み経路、リスク表示、ファイルサイズ、元点数、推定表示率、品質プリセットが読める状態を想定します。
- `assets/workspace-3d.png`: 読み込み後の 3D ワークスペース。奥行きと密度が分かる点群、主要操作パネル、単一 HTML でも実用に見える視点を想定します。
- `assets/workspace-2d-slice-stats.png`: 2D またはスライス確認中の画面。統計パネルを開き、断面確認、分類レビュー、定量確認ができることを示します。
- 画像の詳細な構図メモは [`assets/README.md`](./assets/README.md) にあります。

## 関連ドキュメント

- English README: [`./docs/README.en.md`](./docs/README.en.md)
- クイックスタート: [`./docs/quickstart.ja.md`](./docs/quickstart.ja.md)
- ジュニアSE向けガイド: [`./docs/for-junior-se.ja.md`](./docs/for-junior-se.ja.md)
- 実行モデル: [`./docs/runtime-model.ja.md`](./docs/runtime-model.ja.md)
- トラブルシューティング: [`./docs/troubleshooting.ja.md`](./docs/troubleshooting.ja.md)
- FAQ: [`./docs/faq.ja.md`](./docs/faq.ja.md)
- 用語集: [`./docs/glossary.ja.md`](./docs/glossary.ja.md)

## PointCloudWorkbench の特徴

- 単一 HTML 配布。メインアプリは `PointCloudWorkbench.html` で、ビルド工程はありません。
- Client-Max / Server-Zero 方針。Chrome / Edge で開き、`.las` または `.laz` をローカルで読み込みます。
- 選択した LAS/LAZ ファイルはブラウザー内で処理され、アプリケーションサーバーへアップロードされません。
- ランディングページはブラウザ言語に合わせられ、ユーザーの明示的な言語選択も維持できます。
- 本読み込み前にヘッダー、読み込み経路、リスク、推定表示率を確認できます。
- 3D/2D 切替、スライス、分類、統計確認を1つの画面で行えます。
- GitHub Pages では `index.html` をランディングページとして配信し、同梱サンプル LAS ですぐ検証できます。

## 60秒で試す

1. GitHub Pages のランディングページを開くか、アプリを直接開きます。
2. アプリで `サンプルデータを使用` を選び、同梱 Pages サンプルを選択します。手元の `.las` / `.laz` も読み込めます。
3. Preflight 画面で、読み込み経路、リスク、推定表示率を確認します。
4. 3D/2D で点群を確認し、表示点ベースの距離計測、スライス、統計、分類結果を確認します。

## 主な機能

- LAS/LAZ 読み込み
- LAS / LAZ ローカル reader を選ぶ ReaderRegistry dispatch
- 点数、bounds、LAS scale/offset 基準をまとめる PointCloudData summary
- LAS の chunked 読み込みによる大容量ファイル負荷の平準化（chunked LAS loading）
- LAZ の chunked read + WASM ヒープ直書きによるメモリ重複の抑制（WASM heap writes）
- 読み込み前のヘッダー先読みと正確な表示率プレビュー
- 読み込み経路と推定ピーク RAM リスクの表示
- Hosted / Portable / renderer / isolation capability を示す Runtime mode summary
- telemetry なし、LAS/LAZ upload なし、file name なしの手動診断レポートコピー
- LAS/LAZ header / VLR / EVLR metadata から WKT / GeoTIFF / EPSG 候補を読む CRS diagnostics
- 高さ基準を断定しない慎重な CRS 診断表示
- 対応 CRS では bounds 中心の緯度経度表示と Google Maps / 地理院地図リンクを生成
- LAS point format の signal availability と sampled return / scan-angle / GPS-time coverage に基づく取得品質 summary
- class 2 ground を優先し、分類が薄い場合は low-percentile grid 推定へ fallback する Ground candidate assist
- 現在表示、断面、計測、診断、取得品質を、file name や point payload なしでコピーする Work-assist memo copy
- 読み込み品質選択（`LOW` / `MEDIUM` / `HIGH` / `MAX`）
- 3D / 2D 表示切替
- 表示点ベースの距離計測履歴（3D距離、水平距離、高低差、元座標 dX / dY / dZ）
- 標高色分けと分類色分け
- スライス表示と 2D 断面確認
- 自動分類補助と分類品質レビュー
- 点数、分類内訳、処理時間を確認する統計パネル
- 正規化、重複排除、安定順序化された診断 warning code（`CRS_MISSING`, `CLASSIFICATION_*`, `DISPLAY_RATIO_LOW`, `DENSITY_*`, `Z_OUTLIERS`, `ISOLATED_POINTS`）
- `score` / `scoreStatus` を含む診断候補 summary / selected copy payload

## ブラウザ / 実行条件

- 対応ブラウザ: Chrome / Edge の最新版のみ対応
- 非対応ブラウザ: Safari、Firefox、古いブラウザーは対応対象外です。Safari and Firefox are intentionally unsupported。
- 必須 API: WebGL、File API、ArrayBuffer
- 対応入力: `.las`, `.laz`
- 実装上の上限: LAS は 3GB超、LAZ は 2GB超で読み込み不可。LAS files above 3GB and LAZ files above 2GB are rejected.

## 制約

- `three.js`、`laz-perf`、`simple-statistics`、`Flatbush`、`simpleheat`、`proj4js` は CDN から読み込むため、通常利用にはネットワーク接続が必要です。
- サーバー経路は static-only です。Workers、Pages Functions、APIs、telemetry、DB 書き込み、サーバー側点群処理を追加しません。
- 選択した点群ファイルはユーザーの端末内に留まります。ネットワークアクセスはアプリ資産、`proj4js`、ユーザーがクリックした外部地図リンクのためであり、LAS/LAZ upload ではありません。no LAS/LAZ upload。Selected LAS/LAZ files are processed locally in the browser and are not uploaded.
- CRS diagnostics はローカル metadata の確認と、対応する JGD2011 平面直角座標系の bounds 中心変換だけを行います。coordinate conversion はこの限定範囲に限り、geocoding、EPSG database lookup、map matching、サーバー側 CRS 処理は行いません。server-side CRS processing は行いません。
- 緯度経度は点群範囲の中心推定です。住所、現場境界、測量成果座標、納品用位置保証としては扱わないでください。Google Maps / 地理院地図リンクはクリック時だけ外部サイトへ緯度経度を渡します。
- CRS diagnostics は LAS header / VLR / EVLR を上限付きで読み、LAS/LAZ ファイルやローカルファイル名をアップロードまたは問い合わせ文へコピーしません。
- 取得品質はローカルの属性 coverage 補助です。アプリが使う LAS 1.4 R15 point-record layout に従い、PDRF 0-5 と PDRF 6+ の return / scan-angle interpretation を分け、GPS-time monotonicity は測量級証明ではなく warning signal として扱います。
- 地表候補アシストは近似的で、表示点ベースです。測量成果 DTM、設計面、切盛根拠、納品用地形モデルではありません。
- 作業メモコピーはレビューや引き継ぎのための一時的なページ内 context です。ROI geometry の保存、ファイル書き込み、LAS/LAZ upload、source point coordinates の含有は行いません。
- LAS の `2GB to 3GB` 帯は experimental です。`LOW` 品質から開始し、メモリ使用量と応答性を確認してください。
- LAZ は decoder が追加メモリを使うため安全域が狭く、`2GB` 超は拒否します。
- ローカル LAS は header-first preview と chunked point-data reads を使います。ローカル LAZ は chunked transfers into WASM を使います。URL 読み込みや一部互換経路では full `ArrayBuffer` read を使う場合があります。
- ファイルサイズ上限を拡張しても、実際の render cap は変わりません。品質画面と統計パネルで `source points / rendered points / render ratio` を確認してください。
- 自動分類は高さベースの補助機能であり、測量級分類を保証しません。
- 距離計測は元 LAS/LAZ の全点ではなく、表示中のサンプリング点に snap します。最大20件の計測結果をページ内の一時履歴として保持します。距離は `m-equivalent` として表示され、元データの座標単位に依存します。読み込み profile には計測用に保持する source-coordinate memory も含まれます。

## リポジトリ構成

- `index.html`: GitHub Pages 用ランディングページ
- `PointCloudWorkbench.html`: 単一ファイルアプリ本体
- `assets/`: README / Pages 表示用のスクリーンショット・画像素材ディレクトリ
- `demo/pointcloud-demo-sample.las`: Pages demo 用の同梱 LAS サンプル
- `scripts/`: regression tests と README consistency checks
- `PointCloudWorkbench_ドキュメント索引.md`: 日本語ドキュメント入口
- `PointCloudWorkbench_運用手順書.md`: 日本語運用ガイド
- `PointCloudWorkbench_実装リファレンス.md`: 日本語実装リファレンス

## ライセンス

- `MIT` ライセンスです。詳細は `LICENSE` を参照してください。

## 開発

- 配布物は単一ファイルのまま維持します。`PointCloudWorkbench.html` が runtime artifact で、build pipeline はありません。
- JavaScript / TypeScript の実行とテストは `bun` を前提にしています。
- `scripts/` は開発時の回帰テストと README チェック用です。アプリ実行には不要です。
- 挙動を変更した場合は、関連する運用・実装ドキュメントも更新してください。
- Contribution guidelines: [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- Security policy: [`SECURITY.md`](./SECURITY.md)
- Code of conduct: [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)

## テスト

- 再開時の最小検証順:
  - `bun test scripts/pointcloud-workbench.test.js`
  - `bun scripts/check-readme.js`
  - `bunx --package playwright node scripts/e2e/run-diagnostics-smoke.mjs --las samples/test.las --laz samples/test.laz`
- `bun test scripts/pointcloud-workbench.test.js scripts/documentation-consistency.test.js scripts/gitignore.test.js scripts/repository-metadata.test.js scripts/public-repo-readiness.test.js scripts/landing-page-i18n.test.js`
- `bun scripts/check-readme.js`
- ローカル LAS/LAZ 診断の browser smoke（headless Playwright、repo への依存 install 不要）:
  - `bunx --package playwright playwright install chromium`
  - `bunx --package playwright node scripts/e2e/run-diagnostics-smoke.mjs --las samples/test.las --laz samples/test.laz`
  - 出力スクリーンショット: `.tmp/e2e/las-diagnostics.png`, `.tmp/e2e/laz-diagnostics.png`
  - 失敗時は scenario step、`workflowState.step`、直近の page / console / request failure をログ出力します。
- 任意の手動 CI job: GitHub Actions `Diagnostics Smoke`（`workflow_dispatch`）は同じ LAS/LAZ smoke を実行し、スクリーンショットを artifacts としてアップロードします。
- CI は `.github/workflows/*.yml` に対して pinned `actionlint` も実行します。ローカルの `actionlint .github/workflows/*.yml` は任意です。

## リポジトリの範囲

- 主要な公開成果物は `PointCloudWorkbench.html` と関連ドキュメントです。
- GitHub Pages は `index.html` をランディングページとして使い、実アプリの `PointCloudWorkbench.html` を直接配信します。
- Cloudflare Pages deployment は `_headers`、`_redirects`、`assets/` 配下の static manifests を使う static-only 構成を維持します。
- `scripts/` は開発・保守用の検証資産として公開します。
- `test-results/` とローカル補助ツールの出力は公開成果物ではありません。

## CDN / ネットワーク注意

- Runtime は CDN 配信の `three.js`、`laz-perf`、`simple-statistics`、`Flatbush`、`simpleheat`、`proj4js` に依存します。
- 通常利用にはネットワーク接続が必要です。CDN に到達できない場合、アプリの初期化に失敗することがあります。
- GitHub Pages demo も同じ CDN 依存を持ちます。
