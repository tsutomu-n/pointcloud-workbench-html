# River and bridge demo

timestamp="2026-11-21(土)_19:56 JST"

[English README](../README.md) · [日本語ガイド](./quickstart.ja.md) · [中文快速入门](./quickstart.zh.md)

Open the [river and bridge demo](https://tsutomu-n.github.io/pointcloud-workbench-html/PointCloudWorkbench.html?lang=en&demo=river) in Chrome or Edge. The app loads a synthetic point cloud in local metre coordinates. Use the upper-right language selector to switch between English, Japanese, and Simplified Chinese. On a phone in portrait, tap **Tools** above the model to open the sidebar.

1. Choose **See the bridge cross-section**. Change the thickness to see how the band and its point count change.
2. Choose **Measure bridge** and select **A** and **B**. The expected horizontal distance is 60 m. Use **Copy CSV** to keep the result from this session.
3. Choose **Explore density** to locate the cell on the right bank with zero displayed points. Density depends on the displayed sample.
4. Choose **Open your own file** to inspect a LAS or LAZ file. Review the estimate, then choose **Open with recommended settings** or **Change settings**.

Select the question mark beside a sample tool for help. Drag with one finger to rotate in 3D or pan in 2D. Pinch to zoom or drag with two fingers to pan. Use **Download history CSV** to save up to 20 measurements. Each row identifies a picked point in source coordinates. The first row of each measurement includes its results. 3D distance and slope require known horizontal and vertical length units.

After loading your own file, **Working with this point cloud** opens measurement or a central slice. Undo a point or end measurement above the model. Adjust slice position and thickness to see the band in plan or side view. Open **View controls** or **Color mode** in the sidebar to change how the model is displayed. Their headings show the current settings. Open **Statistics** to compare the source and displayed point counts and check the coordinate units.
