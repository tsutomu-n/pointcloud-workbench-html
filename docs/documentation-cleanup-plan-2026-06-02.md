# ドキュメント整理計画

作成時刻: 2026-06-02_13:45 JST

## 結論

この計画は、`PointCloudWorkbench.html` と現在のテスト対象を正として、古いドキュメントを整理するための実行順を定義する。

優先順位は次の通り。

1. 誤解を生む古い記述を修正する。
2. 完了済みの作業指示書を archive へ移す。
3. 内容が実質ログ断片だけのドキュメントを削除する。
4. 主要ドキュメントの導線を、現在の実装済み機能に合わせる。

## 前提

- アプリ本体は単一ファイル `PointCloudWorkbench.html`。
- 通常経路は Client-Max / Server-Zero の静的 HTML アプリ。
- Workers、Pages Functions、API、telemetry、DB 書き込み、サーバー側点群処理、LAS/LAZ upload path は現行実装にない。
- WebGPU、Worker、SharedArrayBuffer、isolation は現状では能力表示・診断寄りの扱いであり、WebGPU renderer や Worker parser の実装済み機能として書かない。
- 地図は埋め込みタイル表示ではなく、CRS 診断から Google Maps / GSI Maps への外部リンクを作る。
- 距離計測と密度ヒートマップは表示中のサンプリング点を基準にする。元 LAS/LAZ 全点の測量成果として保証しない。

## 調査で確認した根拠

- `git status --short --branch`
  - `## main...origin/main`
  - `PointCloudWorkbench_実装リファレンス.md` に未コミット変更あり
- `.ai_memory/HANDOFF.md`
  - Density Heatmap Overlay P0 は実装済み
  - 直近の自動検証は 113 tests pass
  - 未実施はブラウザー手動 smoke
- `rg` 確認
  - `new Worker` の実装なし
  - WebGPU renderer 実装なし
  - OPFS / IndexedDB の実利用なし
  - `setDensityOverlayEnabled` / `toggleDensityOverlay` / `setDensityOverlayOpacity` は公開 API として存在

## 実行計画

### 1. 削除候補

次の 3 ファイルは、内容が CDX failed-run の短いログ断片のみで、ファイル名が実内容と合っていない。

- `docs/implementation-notes.md`
- `docs/実装解説_個人開発向け.md`
- `docs/進捗ログ.md`

実行方針:

- 公開ドキュメントとしての価値がないため削除する。
- 削除前に `git diff -- docs/implementation-notes.md docs/実装解説_個人開発向け.md docs/進捗ログ.md` で未反映の手編集がないことを確認する。

### 2. アーカイブ候補

次のファイルは、計画・作業指示・過去レビューとしては有用だが、現行仕様として読むと誤解を招く。

- `docs/0602-1043-info.md`
  - Measurement v2 実装前の作業指示。
- `docs/0602-1118.md`
  - Density Heatmap Overlay P0 実装前の作業指示。
- `docs/done-up-implementation-status-2026-05-21.md`
  - Measurement v2 / Density Heatmap Overlay 以前のレビュー。
- `docs/crs-diagnostics-implementation-plan.ja.md`
  - CRS 診断の実装計画。最終仕様があるため現行導線から外す。
- `docs/crs-diagnostics-oss-research.ja.md`
  - CRS 診断の調査メモ。最終仕様があるため現行導線から外す。
- `.plan/phase2-implementation-plan-2026-05-20.md`
- `.plan/phase3-5-implementation-roadmap-2026-05-20.md`
- `.plan/pointcloud-workbench-remediation-plan.md`
- `.plan/public-demo-i18n-polish-plan.md`

実行方針:

- `docs/archive/` と `.plan/archive/` を作る。
- `git mv` で移動し、履歴を追えるようにする。
- archive 内のファイルは「過去計画・過去レビュー」であることを README または索引側に明記する。

### 3. 修正が必要な主要ドキュメント

#### `PointCloudWorkbench_ドキュメント索引.md`

修正内容:

- timestamp を最新化する。
- stale line link を更新するか、行番号依存を減らす。
- Measurement v2 と Density Heatmap Overlay を現行機能として追記する。
- archive 化した過去計画を現行仕様から分離する。

#### `PointCloudWorkbench_運用手順書.md`

修正内容:

- stale line link を更新するか、行番号依存を減らす。
- 密度ヒートマップの操作手順と注意書きを追加する。
- 表示点ベースであり、元 LAS/LAZ 全点密度ではないことを明記する。

#### `PointCloudWorkbench_実装リファレンス.md`

修正内容:

- stale line link を更新するか、行番号依存を減らす。
- 公開 API 一覧に密度オーバーレイ API を含める。
- 既に未コミット変更があるため、作業時は差分を読んでから追記する。

#### `docs/current-state-and-implemented-features.ja.md`

修正内容:

- 公開 API 一覧に `setDensityOverlayEnabled`、`toggleDensityOverlay`、`setDensityOverlayOpacity` を追加する。
- Runtime Mode の Worker / renderer 表現を、実装済み機能ではなく能力表示として明確化する。

### 4. 誤解リスクが高い補助ドキュメント

#### `docs/architecture-client-max.ja.md`

修正内容:

- `Worker解析`、`WebGPU/WebGL2描画`、`OPFS/IndexedDBキャッシュ` を実装済みのように書かない。
- 将来候補または設計上の余地として表現する。
- 現行描画は Three.js / WebGLRenderer ベースであることを明記する。

#### `docs/runtime-model.ja.md`

修正内容:

- WebGPU / Worker / SharedArrayBuffer の説明を capability 表示に寄せる。
- fallback 表現を、実装済み Worker fallback ではなく現行の劣化表示・診断表示として書き直す。

#### `docs/for-junior-se.ja.md`

修正内容:

- Worker / WebGPU の説明が一般用語なのか現行実装なのかを分ける。
- 現行アプリの通常経路では Worker 点群処理をしないことを明記する。

#### `docs/glossary.ja.md`

修正内容:

- Worker / OPFS / WebGPU を、現行実装済み機能としてではなく用語または将来候補として説明する。

#### `docs/faq.ja.md`

修正内容:

- 「Worker、WASM、描画コード、必要に応じて地図タイルを取得」という表現を修正する。
- 現行実装では地図タイルを埋め込まず、外部地図リンクを作ることを明記する。

#### `docs/quickstart.ja.md`

修正内容:

- 「地図タイル取得」を削除または外部地図リンクに置き換える。
- ネットワーク利用は CDN 取得や外部リンク遷移の範囲として説明する。

#### `docs/troubleshooting.ja.md`

修正内容:

- `Geo Preview`、地図タイル、地図込みスクリーンショットの記述を現行コードに合わせる。
- CRS bounds center から外部地図リンクを開く場合のトラブルシュートに変更する。

#### `TLDL.md`

修正内容:

- Measurement v2 と Density Heatmap Overlay を反映する。
- 「CRS 変換なし」「gradient なし」など、古い状態を前提にした記述を更新する。
- あるいは snapshot として archive へ移す。

### 5. 維持するドキュメント

次のファイルは現行導線として維持する。

- `README.md`
- `docs/README.ja.md`
- `docs/README.en.md`
- `docs/crs-diagnostics-final-spec.ja.md`
- `docs/cloudflare-pages-static-only.ja.md`
- `assets/README.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `CODE_OF_CONDUCT.md`
- `.github/PULL_REQUEST_TEMPLATE.md`

補足:

- `.ai_memory/HANDOFF.md` と `.ai_memory/.HANDOFF.lastgood.md` は公開ドキュメントではなく、ローカル再開用 artifact として維持する。
- `.tmp/*` は公開導線に入れない。

## 推奨実行順

1. `git status --short --branch` で作業前状態を確認する。
2. 既存の未コミット変更がある `PointCloudWorkbench_実装リファレンス.md` を読む。
3. 削除候補 3 ファイルに未反映の有用内容がないことを確認する。
4. `docs/archive/` と `.plan/archive/` を作成する。
5. 完了済み作業指示・古い計画・古いレビューを archive へ移す。
6. 誤解リスクが高い補助ドキュメントを先に修正する。
7. 主要ドキュメントの索引・運用・実装リファレンスを修正する。
8. README 系との文言差分を確認する。
9. 自動検証を実行する。
10. 最後にブラウザー手動 smoke を実施する。

## 検証コマンド

```bash
bun test scripts/documentation-consistency.test.js scripts/public-repo-readiness.test.js
bun scripts/check-readme.js
git diff --check
```

可能なら最後に full regression を実行する。

```bash
bun test scripts/pointcloud-workbench.test.js scripts/documentation-consistency.test.js scripts/public-repo-readiness.test.js scripts/gitignore.test.js scripts/repository-metadata.test.js
```

## 完了条件

- 削除候補 3 ファイルが削除されている、または削除しない理由が plan / docs に残っている。
- archive 候補が現行導線から外れている。
- Worker / WebGPU / OPFS / IndexedDB / 地図タイルが、実装済み機能として誤記されていない。
- Measurement v2 と Density Heatmap Overlay が主要ドキュメントに反映されている。
- stale line link が更新されている、または行番号依存を減らす形へ修正されている。
- README チェックと docs 関連テストが通る。

## 残リスク

- `PointCloudWorkbench_実装リファレンス.md` には既に未コミット変更があるため、次の実作業ではその差分を保持して進める必要がある。
- ブラウザー手動 smoke はこの計画作成時点では未実施。
- archive 移動後に documentation consistency test の allowlist やリンク検査が必要になる可能性がある。
