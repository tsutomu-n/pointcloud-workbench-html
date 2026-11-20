# PointCloudWorkbench

timestamp="2026-11-20(金)_23:35 JST"

[English](../README.md) · [公開サイト](https://tsutomu-n.github.io/pointcloud-workbench-html/)

ブラウザーでLAS・LAZ点群を開き、3D・2D表示、断面、計測、密度で確認できるツールです。インストールやビルドは不要です。

## すぐに試す

- 最新のChromeまたはEdgeで[河川と橋のサンプル](https://tsutomu-n.github.io/pointcloud-workbench-html/PointCloudWorkbench.html?lang=ja&demo=river)を開きます。橋を横切る断面を見たり、橋の両端A・Bの距離を測ったり、「密度を見る」で右岸の点が抜けた箇所を確認したりできます。
- [自分のLAS・LAZを開く](https://tsutomu-n.github.io/pointcloud-workbench-html/PointCloudWorkbench.html?lang=ja)場合は、ファイルを選択し、推定メモリと表示点の割合を確認して品質を選びます。
- スマホでは、1本指で3Dを回転または2Dを移動し、2本指で移動・拡大縮小できます。モデル右上の「2D上面」「3D」「全体」「ツール」から表示や操作欄を切り替えます。

## 主な機能

- 標高・分類で色分けし、断面、点数、密度を確認できます。
- 距離、勾配、折れ線、XY投影面積を計測できます。計測は表示点を対象とし、値は元データの座標単位に依存します。結果は画面を離れる前にCSVで保存できます。
- CRS 診断や取得メタデータを確認できます。対応するJGD2011の平面直角座標系では、点群範囲の中心のみ座標変換して概算位置を表示します。詳しくは[CRS診断の仕様](./crs-diagnostics-final-spec.ja.md)を参照してください。

## 動作条件とファイルの扱い

- Chrome / Edge の最新版のみ対応。WebGLが必要です。Safari、Firefox、古いブラウザーは対応対象外です。
- LAS は 3GB超、LAZ は 2GB超で読み込み不可です。2GBから3GBのLASは実験的な対応です。大きなファイルは低品質設定からお試しください。
- **Client-Max / Server-Zero。** 点群ファイルは端末内で処理し、アップロードしません。CDNからライブラリを読み込むためネット接続が必要です。外部地図リンクを開くと、表示した座標が地図サービスへ渡ります。

## ドキュメント

[クイックスタート](./quickstart.ja.md) · [運用手順書](../PointCloudWorkbench_運用手順書.md) · [トラブルシューティング](./troubleshooting.ja.md) · [FAQ](./faq.ja.md) · [ドキュメント索引](../PointCloudWorkbench_ドキュメント索引.md)
