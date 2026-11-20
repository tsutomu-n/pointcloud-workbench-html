# PointCloudWorkbench 快速入门

timestamp="2026-11-21(土)_00:33 JST"

[English README](../README.md) · [日本語ガイド](./quickstart.ja.md)

## 试用河流和桥梁示例

在最新版 Chrome 或 Edge 中打开[中文演示](https://tsutomu-n.github.io/pointcloud-workbench-html/PointCloudWorkbench.html?lang=zh&demo=river)。点云会自动加载。手机竖屏时，先点模型右上方的「工具」。

1. 选择「查看桥梁断面」，调整切片厚度，观察切片带和显示点数的变化。
2. 选择「测量桥梁」，再选择 A 和 B。两端水平距离为 60 米。选择「复制 CSV」可保留结果。
3. 选择「查看密度」，观察右岸用轮廓标出的零点网格。密度根据显示点估算。

## 打开自己的 LAS 或 LAZ

1. [打开中文版应用](https://tsutomu-n.github.io/pointcloud-workbench-html/PointCloudWorkbench.html?lang=zh&open=file)。如果已打开示例，选择「打开自己的文件」。
2. 选择文件，确认预计内存和显示比例，然后选择「使用推荐设置打开」或「更改设置」。
3. 在「操作此点云」中可选点测量或查看中心切片。可直接在模型上撤销上一个点或结束测量。调整切片位置和厚度时，俯视图或侧视图中的切片带会同步更新。
4. 在「视图控制」和「着色模式」中调整显示，在「统计信息」中比较原始点数和显示点数。

右上角可以切换中文、English 和日本語。文件在设备上处理。应用运行时需要网络连接来加载依赖。
