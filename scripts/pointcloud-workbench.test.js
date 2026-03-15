const { test, expect } = require("bun:test");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const htmlPath = path.join(__dirname, "..", "PointCloudWorkbench.html");
const html = fs.readFileSync(htmlPath, "utf8");
const scriptMatches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const scriptMatch = scriptMatches.at(-1);

if (!scriptMatch) {
  throw new Error("inline script not found");
}

const scriptSource = scriptMatch[1];

function createMockElement(id = "") {
  return {
    id,
    style: {},
    dataset: {},
    className: "",
    textContent: "",
    innerHTML: "",
    value: "",
    checked: false,
    disabled: false,
    open: false,
    parentElement: null,
    offsetParent: {},
    classList: {
      add() {},
      remove() {},
      contains() {
        return false;
      },
    },
    addEventListener() {},
    removeEventListener() {},
    appendChild(child) {
      if (child) child.parentElement = this;
      return child;
    },
    removeChild() {},
    remove() {
      this.parentElement = null;
    },
    setAttribute() {},
    getAttribute() {
      return null;
    },
    querySelector() {
      return createMockElement();
    },
    querySelectorAll() {
      return [];
    },
    closest() {
      return this;
    },
    focus() {},
    click() {},
    insertRow() {
      return {
        insertCell() {
          return createMockElement();
        },
      };
    },
    getContext() {
      return {
        clearRect() {},
        fillText() {},
        beginPath() {},
        moveTo() {},
        lineTo() {},
        stroke() {},
        arc() {},
        fill() {},
      };
    },
  };
}

function createContext() {
  const elements = new Map();
  const documentEvents = new Map();
  const windowEvents = new Map();
  const NativeDate = Date;
  function MockDate(...args) {
    return new NativeDate(...args);
  }
  MockDate.now = () => NativeDate.now();
  MockDate.parse = NativeDate.parse;
  MockDate.UTC = NativeDate.UTC;
  MockDate.prototype = NativeDate.prototype;

  const document = {
    body: createMockElement("body"),
    documentElement: {
      lang: "ja",
    },
    activeElement: createMockElement("active"),
    createElement(tag) {
      const el = createMockElement(tag);
      if (tag === "canvas") {
        el.width = 0;
        el.height = 0;
      }
      return el;
    },
    getElementById(id) {
      if (!elements.has(id)) {
        elements.set(id, createMockElement(id));
      }
      return elements.get(id);
    },
    querySelector() {
      return createMockElement("query");
    },
    querySelectorAll() {
      return [];
    },
    addEventListener(type, handler) {
      documentEvents.set(type, handler);
    },
    removeEventListener(type) {
      documentEvents.delete(type);
    },
  };
  document.body.appendChild = function appendChild(child) {
    if (child) child.parentElement = document.body;
    return child;
  };

  const localStorageStore = new Map();
  const windowObject = {
    __PCW_ENABLE_TEST_API__: true,
    location: {
      href: "http://localhost/",
      reload() {},
    },
    screen: {
      width: 1920,
      height: 1080,
    },
    devicePixelRatio: 1,
    performance: {
      now() {
        return 0;
      },
    },
    addEventListener(type, handler) {
      windowEvents.set(type, handler);
    },
    removeEventListener(type) {
      windowEvents.delete(type);
    },
    requestAnimationFrame(callback) {
      if (typeof callback === "function") callback(0);
      return 1;
    },
    cancelAnimationFrame() {},
    setTimeout(callback) {
      if (typeof callback === "function") callback();
      return 1;
    },
    clearTimeout() {},
    setInterval() {
      return 1;
    },
    clearInterval() {},
    fetch: async () => ({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(0),
      status: 200,
    }),
    gc() {},
    File: function File() {},
    FileReader: function FileReader() {},
    FileList: function FileList() {},
    Blob: function Blob() {},
    ArrayBuffer,
    DataView,
    Promise,
    URL,
    TextDecoder,
    TextEncoder,
    WebGLRenderingContext: function WebGLRenderingContext() {},
    localStorage: {
      getItem(key) {
        return localStorageStore.has(key) ? localStorageStore.get(key) : null;
      },
      setItem(key, value) {
        localStorageStore.set(key, String(value));
      },
      removeItem(key) {
        localStorageStore.delete(key);
      },
    },
  };

  const THREE = {
    EventDispatcher: function EventDispatcher() {},
    OrbitControls: null,
  };
  THREE.EventDispatcher.prototype = {};

  const context = {
    console: {
      log() {},
      warn() {},
      error() {},
    },
    document,
    window: windowObject,
    localStorage: windowObject.localStorage,
    navigator: {
      hardwareConcurrency: 8,
      userAgent: "bun-test",
      language: "ja-JP",
    },
    screen: windowObject.screen,
    location: windowObject.location,
    performance: windowObject.performance,
    requestAnimationFrame: windowObject.requestAnimationFrame,
    cancelAnimationFrame: windowObject.cancelAnimationFrame,
    setTimeout: windowObject.setTimeout,
    clearTimeout: windowObject.clearTimeout,
    setInterval: windowObject.setInterval,
    clearInterval: windowObject.clearInterval,
    fetch: windowObject.fetch,
    URL,
    TextDecoder,
    TextEncoder,
    ArrayBuffer,
    DataView,
    Math,
    Number,
    String,
    Boolean,
    Object,
    JSON,
    Date: MockDate,
    Promise,
    Uint8Array,
    Uint16Array,
    Uint32Array,
    Int32Array,
    Float32Array,
    Float64Array,
    BigInt,
    isFinite,
    parseInt,
    parseFloat,
    THREE,
    createLazPerf: async () => ({
      _malloc() {
        return 0;
      },
      _free() {},
      HEAPU8: new Uint8Array(1024),
      LASZip: class {
        open() {}
        getCount() {
          return 0;
        }
        getPointLength() {
          return 20;
        }
        getPointFormat() {
          return 0;
        }
        getPoint() {}
        delete() {}
      },
    }),
  };

  windowObject.document = document;
  windowObject.window = windowObject;
  windowObject.THREE = THREE;
  windowObject.console = context.console;

  vm.createContext(context);
  vm.runInContext(scriptSource, context);
  return context;
}

function installImmediateBlobReader(context) {
  const selectiveTimer = (callback, delay = 0) => {
    if (typeof callback === "function" && delay <= 10) {
      callback();
    }
    return 1;
  };
  context.setTimeout = selectiveTimer;
  context.clearTimeout = () => {};
  context.window.setTimeout = selectiveTimer;
  context.window.clearTimeout = () => {};

  class MockFileReader {
    constructor() {
      this.readyState = 0;
      this.result = null;
      this.error = null;
    }

    readAsArrayBuffer(blob) {
      this.readyState = 1;
      context.__blobReadCalls = (context.__blobReadCalls || 0) + 1;
      context.__blobReadSizes = context.__blobReadSizes || [];
      context.__blobReadSizes.push(blob.size || 0);
      this.result = blob.__buffer || new ArrayBuffer(0);
      this.readyState = 2;
      if (typeof this.onload === "function") {
        this.onload();
      }
    }

    abort() {
      this.readyState = 2;
      if (typeof this.onabort === "function") {
        this.onabort();
      }
    }
  }

  context.FileReader = MockFileReader;
  context.window.FileReader = MockFileReader;
}

function createChunkedFile(buffer, name = "scan.las") {
  return {
    name,
    size: buffer.byteLength,
    slice(start = 0, end = buffer.byteLength) {
      const sliced = buffer.slice(start, end);
      return {
        size: sliced.byteLength,
        __buffer: sliced,
        arrayBuffer: async () => sliced,
      };
    },
    arrayBuffer: async () => {
      throw new Error("full file read should not be used");
    },
  };
}

function createLasHeaderBuffer({
  pointCount = 1000,
  pointDataOffset = 227,
  pointDataRecordFormat = 1,
  pointDataRecordLength = 28,
  versionMajor = 1,
  versionMinor = 2,
  pointCount64 = 0n,
} = {}) {
  const buffer = new ArrayBuffer(512);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  bytes.set(new TextEncoder().encode("LASF"), 0);
  view.setUint8(24, versionMajor);
  view.setUint8(25, versionMinor);
  view.setUint32(96, pointDataOffset, true);
  view.setUint8(104, pointDataRecordFormat);
  view.setUint16(105, pointDataRecordLength, true);
  view.setUint32(107, pointCount, true);
  view.setBigUint64(247, BigInt(pointCount64), true);
  view.setFloat64(131, 0.01, true);
  view.setFloat64(139, 0.01, true);
  view.setFloat64(147, 0.01, true);
  view.setFloat64(155, 0, true);
  view.setFloat64(163, 0, true);
  view.setFloat64(171, 0, true);
  view.setFloat64(179, 100, true);
  view.setFloat64(187, 0, true);
  view.setFloat64(195, 100, true);
  view.setFloat64(203, 0, true);
  view.setFloat64(211, 50, true);
  view.setFloat64(219, 0, true);
  return buffer;
}

test("load session helpers isolate stale loads", () => {
  const context = createContext();

  const hasHelpers = vm.runInContext(
    'typeof window.__pcwTestApi?.beginLoadSession === "function" && typeof window.__pcwTestApi?.isLoadSessionActive === "function" && typeof window.__pcwTestApi?.clearActiveLoadSession === "function"',
    context,
  );
  expect(hasHelpers).toBe(true);

  const first = vm.runInContext("window.__pcwTestApi.beginLoadSession()", context);
  expect(first).toBe(1);
  expect(vm.runInContext("window.__pcwTestApi.isLoadSessionActive(1)", context)).toBe(true);

  const second = vm.runInContext("window.__pcwTestApi.beginLoadSession()", context);
  expect(second).toBe(2);
  expect(vm.runInContext("window.__pcwTestApi.isLoadSessionActive(1)", context)).toBe(false);
  expect(vm.runInContext("window.__pcwTestApi.isLoadSessionActive(2)", context)).toBe(true);

  vm.runInContext("window.__pcwTestApi.clearActiveLoadSession(2)", context);
  expect(vm.runInContext("window.__pcwTestApi.isLoadSessionActive(2)", context)).toBe(false);
});

test("parseLASPoints propagates timeout instead of swallowing it", async () => {
  const context = createContext();

  vm.runInContext(
    `
      window.__pcwTestApi.setWorkflowState({
        selectedQuality: "low",
      });
      window.__pcwTestApi.beginLoadSession();
      __now = 0;
      Date.now = () => {
        __now += 31000;
        return __now;
      };
    `,
    context,
  );

  const pointRecordLength = 20;
  const pointDataOffset = 0;
  const buffer = new ArrayBuffer(pointRecordLength);
  const view = new DataView(buffer);
  view.setInt32(0, 10, true);
  view.setInt32(4, 20, true);
  view.setInt32(8, 30, true);
  view.setUint16(12, 100, true);
  view.setUint8(15, 2);

  context.__buffer = buffer;
  context.__header = {
    pointDataOffset,
    pointDataRecordLength: pointRecordLength,
    numberOfPointRecords: 1,
    xScaleFactor: 1,
    yScaleFactor: 1,
    zScaleFactor: 1,
    xOffset: 0,
    yOffset: 0,
    zOffset: 0,
    pointDataRecordFormat: 1,
  };

  await expect(
    vm.runInContext("window.__pcwTestApi.parseLASPoints(__buffer, __header, 1)", context),
  ).rejects.toThrow(/タイムアウト/);
});

test("startDataLoading restarts memory monitoring before load", async () => {
  const context = createContext();

  vm.runInContext(
    `
      window.__pcwTestApi.setWorkflowState({
        selectedFile: {
          name: "test.las",
          size: 1024,
          arrayBuffer: async () => new ArrayBuffer(0),
        },
        selectedQuality: "low",
      });
      scene = {};
      memoryMonitor.startMonitoring = () => {
        globalThis.__memoryMonitorStartCalls =
          (globalThis.__memoryMonitorStartCalls || 0) + 1;
      };
      clearPointCloud = () => {};
      updateRightPanelVisibility = () => {};
      updateLoadingInfo = () => {};
      focusPrimaryAction = () => {};
      updateProgress = () => {};
      loadLASFileActual = async () => {};
      completeLoading = () => {};
      document.getElementById = () => ({
        classList: { add() {}, remove() {} },
        style: {},
      });
    `,
    context,
  );

  await vm.runInContext("window.startDataLoading()", context);
  expect(context.__memoryMonitorStartCalls).toBe(1);
});

test("experimental size limit accepts up to 3GB and rejects above it", () => {
  const context = createContext();

  context.__twoPointFiveGb = { size: Math.floor(2.5 * 1024 * 1024 * 1024) };
  context.__threeGb = { size: 3 * 1024 * 1024 * 1024 };
  context.__overThreeGb = { size: 3 * 1024 * 1024 * 1024 + 1 };

  const critical = vm.runInContext(
    "window.__pcwTestApi.checkFileSizeLimits(__twoPointFiveGb)",
    context,
  );
  const boundary = vm.runInContext(
    "window.__pcwTestApi.checkFileSizeLimits(__threeGb)",
    context,
  );
  const over = vm.runInContext(
    "window.__pcwTestApi.checkFileSizeLimits(__overThreeGb)",
    context,
  );

  expect(critical.canProceed).toBe(true);
  expect(critical.level).toBe("critical");
  expect(boundary.canProceed).toBe(true);
  expect(boundary.level).toBe("critical");
  expect(over.canProceed).toBe(false);
  expect(over.level).toBe("maximum");
});

test("LAZ keeps a stricter ceiling than LAS", () => {
  const context = createContext();

  context.__lasBoundary = {
    name: "scan.las",
    size: 3 * 1024 * 1024 * 1024,
  };
  context.__lazBoundary = {
    name: "scan.laz",
    size: 2 * 1024 * 1024 * 1024,
  };
  context.__lazOver = {
    name: "scan.laz",
    size: 2 * 1024 * 1024 * 1024 + 1,
  };

  const lasBoundary = vm.runInContext(
    "window.__pcwTestApi.checkFileSizeLimits(__lasBoundary)",
    context,
  );
  const lazBoundary = vm.runInContext(
    "window.__pcwTestApi.checkFileSizeLimits(__lazBoundary)",
    context,
  );
  const lazOver = vm.runInContext(
    "window.__pcwTestApi.checkFileSizeLimits(__lazOver)",
    context,
  );

  expect(lasBoundary.canProceed).toBe(true);
  expect(lazBoundary.canProceed).toBe(true);
  expect(lazBoundary.level).toBe("critical");
  expect(lazOver.canProceed).toBe(false);
  expect(lazOver.level).toBe("maximum");
});

test("large LAZ warnings include decoder memory caution", () => {
  const context = createContext();

  context.__largeLaz = {
    name: "scan.laz",
    size: Math.floor(1.4 * 1024 * 1024 * 1024),
  };

  const result = vm.runInContext(
    "window.__pcwTestApi.checkFileSizeLimits(__largeLaz)",
    context,
  );

  expect(result.canProceed).toBe(true);
  expect(result.level).toBe("critical");
  expect(result.message).toMatch(/LAZ/);
  expect(result.message).toMatch(/内部デコーダ|メモリ/);
});

test("startDataLoading ignores stale completion after cancellation", async () => {
  const context = createContext();

  vm.runInContext(
    `
      const file = {
        name: "test.las",
        size: 1024,
        arrayBuffer: async () => new ArrayBuffer(0),
      };
      window.__pcwTestApi.setWorkflowState({
        selectedFile: file,
        selectedQuality: "low",
      });
      scene = {};
      clearPointCloud = () => {};
      updateRightPanelVisibility = () => {};
      updateLoadingInfo = () => {};
      focusPrimaryAction = () => {};
      updateProgress = () => {};
      __resolveLoad = null;
      loadLASFileActual = async () => {
        await new Promise((resolve) => {
          __resolveLoad = resolve;
        });
      };
      completeLoading = () => {
        globalThis.__completeLoadingCalls =
          (globalThis.__completeLoadingCalls || 0) + 1;
      };
      showToast = () => {};
      document.getElementById = () => ({
        classList: { add() {}, remove() {} },
        style: {},
      });
    `,
    context,
  );

  const loadPromise = vm.runInContext("window.startDataLoading()", context);
  vm.runInContext("window.cancelLoading()", context);
  vm.runInContext("__resolveLoad()", context);
  await loadPromise;

  expect(context.__completeLoadingCalls || 0).toBe(0);
});

test("getFileReadTimeoutMs scales with file size and caps for very large files", () => {
  const context = createContext();

  const hasHelper = vm.runInContext(
    'typeof window.__pcwTestApi?.getFileReadTimeoutMs === "function"',
    context,
  );
  expect(hasHelper).toBe(true);

  context.__smallFile = { size: 10 * 1024 * 1024 };
  context.__mediumFile = { size: 700 * 1024 * 1024 };
  context.__largeFile = { size: 2 * 1024 * 1024 * 1024 };

  const small = vm.runInContext("window.__pcwTestApi.getFileReadTimeoutMs(__smallFile)", context);
  const medium = vm.runInContext("window.__pcwTestApi.getFileReadTimeoutMs(__mediumFile)", context);
  const large = vm.runInContext("window.__pcwTestApi.getFileReadTimeoutMs(__largeFile)", context);

  expect(small).toBe(60000);
  expect(medium).toBeGreaterThan(small);
  expect(large).toBeGreaterThanOrEqual(medium);
  expect(large).toBeLessThanOrEqual(300000);
});

test("cancelLoading aborts an active FileReader read", async () => {
  const context = createContext();

  const deferredTimers = [];
  const noOpTimer = () => deferredTimers.length;
  context.setTimeout = noOpTimer;
  context.clearTimeout = () => {};
  context.window.setTimeout = noOpTimer;
  context.window.clearTimeout = () => {};

  class MockFileReader {
    constructor() {
      this.readyState = 0;
      this.result = null;
      this.error = null;
    }

    readAsArrayBuffer() {
      this.readyState = 1;
      context.__readerStarted = (context.__readerStarted || 0) + 1;
    }

    abort() {
      this.readyState = 2;
      context.__readerAbortCalls = (context.__readerAbortCalls || 0) + 1;
      if (typeof this.onabort === "function") {
        this.onabort();
      }
    }
  }

  context.FileReader = MockFileReader;
  context.window.FileReader = MockFileReader;
  context.__file = { name: "scan.las", size: 1024 };

  vm.runInContext("window.__pcwTestApi.beginLoadSession()", context);

  const readPromise = vm.runInContext(
    "window.__pcwTestApi.readFileAsArrayBuffer(__file)",
    context,
  );

  vm.runInContext("window.cancelLoading()", context);

  await expect(readPromise).rejects.toThrow(/__CANCELLED__/);
  expect(context.__readerStarted).toBe(1);
  expect(context.__readerAbortCalls).toBe(1);
});

test("parseLASPointsFromFile reads sampled LAS data via slices without full file reads", async () => {
  const context = createContext();
  installImmediateBlobReader(context);

  vm.runInContext(
    `
      window.__pcwTestApi.beginLoadSession();
      window.__pcwTestApi.setWorkflowState({
        selectedQuality: "low",
      });
    `,
    context,
  );

  const recordLength = 20;
  const buffer = new ArrayBuffer(recordLength * 3);
  const view = new DataView(buffer);
  for (let i = 0; i < 3; i++) {
    const offset = i * recordLength;
    view.setInt32(offset, i + 1, true);
    view.setInt32(offset + 4, i + 11, true);
    view.setInt32(offset + 8, i + 21, true);
    view.setUint16(offset + 12, 100 + i, true);
    view.setUint8(offset + 15, 2 + i);
  }

  context.__file = createChunkedFile(buffer, "sample.las");
  context.__header = {
    pointDataOffset: 0,
    pointDataRecordLength: recordLength,
    numberOfPointRecords: 3,
    xScaleFactor: 1,
    yScaleFactor: 1,
    zScaleFactor: 1,
    xOffset: 0,
    yOffset: 0,
    zOffset: 0,
    pointDataRecordFormat: 1,
  };

  const points = await vm.runInContext(
    "window.__pcwTestApi.parseLASPointsFromFile(__file, __header, { chunkBytes: 20 })",
    context,
  );

  expect(points).toHaveLength(3);
  expect(points[0]).toEqual({
    x: 1,
    y: 11,
    z: 21,
    intensity: 100,
    classification: 2,
  });
  expect(points[2]).toEqual({
    x: 3,
    y: 13,
    z: 23,
    intensity: 102,
    classification: 4,
  });
  expect(context.__blobReadCalls).toBe(3);
});

test("readFileIntoWasmHeap streams file slices into WASM memory", async () => {
  const context = createContext();
  installImmediateBlobReader(context);

  vm.runInContext("window.__pcwTestApi.beginLoadSession()", context);

  const source = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
  context.__file = createChunkedFile(source.buffer, "sample.laz");
  context.__wasmModule = {
    HEAPU8: new Uint8Array(32),
  };

  await vm.runInContext(
    "window.__pcwTestApi.readFileIntoWasmHeap(__file, __wasmModule, 4, __file.size, { chunkBytes: 3 })",
    context,
  );

  expect(Array.from(context.__wasmModule.HEAPU8.slice(4, 12))).toEqual(
    Array.from(source),
  );
  expect(context.__blobReadCalls).toBe(3);
});

test("analyzeSelectedFilePreview reads header via slices and returns point count", async () => {
  const context = createContext();
  installImmediateBlobReader(context);

  const headerBuffer = createLasHeaderBuffer({ pointCount: 543210 });
  context.__file = createChunkedFile(headerBuffer, "preview.las");

  const hasHelper = vm.runInContext(
    'typeof window.__pcwTestApi?.analyzeSelectedFilePreview === "function"',
    context,
  );
  expect(hasHelper).toBe(true);

  const preview = await vm.runInContext(
    "window.__pcwTestApi.analyzeSelectedFilePreview(__file)",
    context,
  );

  expect(preview.header.numberOfPointRecords).toBe(543210);
  expect(preview.profile.strategyKey).toBe("las-chunked");
  expect(context.__blobReadCalls).toBe(1);
});

test("analyzeSelectedFilePreview keeps legacy point count for compressed LAZ headers", async () => {
  const context = createContext();
  installImmediateBlobReader(context);

  const headerBuffer = createLasHeaderBuffer({
    pointCount: 1065,
    pointDataOffset: 1301,
    pointDataRecordFormat: 128,
    pointDataRecordLength: 20,
    versionMajor: 1,
    versionMinor: 2,
    pointCount64: 5064672093372088392n,
  });
  context.__file = createChunkedFile(headerBuffer, "point10.las.laz");

  const preview = await vm.runInContext(
    "window.__pcwTestApi.analyzeSelectedFilePreview(__file)",
    context,
  );

  expect(preview.header.numberOfPointRecords).toBe(1065);
  expect(preview.profile.displayPoints).toBe(1065);
  expect(preview.profile.displayRatioPercent).toBe(100);
});

test("updateEstimations uses preview header to show exact ratio and load profile", () => {
  const context = createContext();

  const hasHelper = vm.runInContext(
    'typeof window.__pcwTestApi?.updateEstimations === "function" && typeof window.__pcwTestApi?.buildLoadProfile === "function"',
    context,
  );
  expect(hasHelper).toBe(true);

  vm.runInContext(
    `
      window.__pcwTestApi.setWorkflowState({
        selectedFile: {
          name: "dense.laz",
          size: 1536 * 1024 * 1024,
          slice() { return { size: 0, __buffer: new ArrayBuffer(0), arrayBuffer: async () => new ArrayBuffer(0) }; }
        },
        selectedQuality: "maximum",
        previewHeader: {
          numberOfPointRecords: 5000000
        }
      });
      window.__pcwTestApi.updateEstimations();
    `,
    context,
  );

  expect(context.document.getElementById("estimatedSampling").textContent).toContain(
    "40.00%",
  );
  expect(context.document.getElementById("estimatedRisk").textContent).toMatch(
    /LAS|LAZ|危険度|推定/,
  );
  expect(context.document.getElementById("estimatedLoadPath").textContent).toMatch(
    /LAZ|WASM|chunked/,
  );
});

test("decompressLAZFile keeps source point count when sampling down", async () => {
  const context = createContext();

  const sourceBuffer = new ArrayBuffer(64);
  const points = [
    { x: 1, y: 2, z: 3, intensity: 10, classification: 2 },
    { x: 4, y: 5, z: 6, intensity: 11, classification: 3 },
    { x: 7, y: 8, z: 9, intensity: 12, classification: 4 },
    { x: 10, y: 11, z: 12, intensity: 13, classification: 5 },
  ];

  context.__nextPointer = 0;
  context.__heap = new Uint8Array(2048);
  context.createLazPerf = async () => ({
    _malloc(size) {
      const pointer = context.__nextPointer;
      context.__nextPointer += size + 32;
      return pointer;
    },
    _free() {},
    HEAPU8: context.__heap,
    LASZip: class {
      constructor() {
        this.index = 0;
      }
      open() {}
      getCount() {
        return points.length;
      }
      getPointLength() {
        return 20;
      }
      getPointFormat() {
        return 1;
      }
      getPoint(pointer) {
        const point = points[this.index];
        if (!point) {
          throw new Error("point exhausted");
        }
        const view = new DataView(context.__heap.buffer);
        view.setInt32(pointer, point.x, true);
        view.setInt32(pointer + 4, point.y, true);
        view.setInt32(pointer + 8, point.z, true);
        view.setUint16(pointer + 12, point.intensity, true);
        view.setUint8(pointer + 15, point.classification);
        this.index += 1;
      }
      delete() {}
    },
  });

  const result = await vm.runInContext(
    'window.__pcwTestApi.decompressLAZFile(__sourceBuffer, { fileName: "sample.laz", quality: "low", maxPoints: 2 })',
    Object.assign(context, { __sourceBuffer: sourceBuffer }),
  );

  expect(result.header.numberOfPointRecords).toBe(4);
  expect(result.points).toHaveLength(2);
});

test("getClassificationStats counts classes 0 and 1 as unclassified", () => {
  const context = createContext();

  const stats = vm.runInContext(
    `
      statsData.classificationCounts = { 0: 40, 1: 35, 2: 25 };
      statsData.displayPoints = 100;
      window.__pcwTestApi.getClassificationStats();
    `,
    context,
  );

  expect(stats.isValid).toBe(true);
  expect(stats.types).toBe(3);
  expect(stats.unclassifiedCount).toBe(75);
  expect(stats.unclassifiedPercent).toBe(75);
  expect(stats.quality).toBe("limited");
  expect(stats.recommendedMode).toBe("height");
});

test("normalizeHeightValue returns a safe midpoint for flat ranges", () => {
  const context = createContext();

  const normalized = vm.runInContext(
    "window.__pcwTestApi.normalizeHeightValue(12, 5, 5)",
    context,
  );

  expect(normalized).toBe(0.5);
  expect(Number.isFinite(normalized)).toBe(true);
});

test("hideAllPanels preserves stats toggle markup", () => {
  const context = createContext();
  const label = createMockElement("statsToggleLabel");
  const button = createMockElement("statsToggle");
  const panel = createMockElement("statsPanel");

  button.querySelector = (selector) =>
    selector === ".stats-toggle__label" ? label : null;
  button.classList = {
    add() {},
    remove() {},
    contains() {
      return false;
    },
  };
  panel.classList = {
    add() {},
    remove() {},
    contains() {
      return false;
    },
  };

  context.__statsPanel = panel;
  context.__statsToggle = button;

  vm.runInContext(
    `
      statsVisible = true;
      document.getElementById = (id) => {
        if (id === "statsPanel") return __statsPanel;
        if (id === "statsToggle") return __statsToggle;
        return {
          classList: { add() {}, remove() {}, contains() { return false; } },
          querySelector() { return null; },
          style: {},
        };
      };
      window.__pcwTestApi.hideAllPanels();
    `,
    context,
  );

  expect(label.textContent).toBe("統計情報");
  expect(button.textContent).toBe("");
});

test("initThreeJS replaces the previous renderer canvas and binds context listeners", async () => {
  const context = createContext();

  const container = createMockElement("container");
  container.children = [];
  container.getBoundingClientRect = () => ({
    width: 640,
    height: 480,
  });
  container.appendChild = function appendChild(child) {
    this.children.push(child);
    child.parentElement = this;
    return child;
  };
  container.removeChild = function removeChild(child) {
    this.children = this.children.filter((item) => item !== child);
  };

  context.__container = container;
  context.__renderers = [];
  context.__removedWindowEvents = [];

  context.window.addEventListener = function addEventListener(type, handler) {
    this.__events = this.__events || {};
    this.__events[type] = this.__events[type] || [];
    this.__events[type].push(handler);
  };
  context.window.removeEventListener = function removeEventListener(type, handler) {
    this.__events = this.__events || {};
    this.__events[type] = (this.__events[type] || []).filter(
      (registered) => registered !== handler,
    );
    context.__removedWindowEvents.push(type);
  };

  class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    set(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
      return this;
    }
    copy(other) {
      this.x = other.x;
      this.y = other.y;
      this.z = other.z;
      return this;
    }
    clone() {
      return new Vector3(this.x, this.y, this.z);
    }
  }

  context.THREE.Scene = class {
    constructor() {
      this.children = [];
    }
    add(child) {
      this.children.push(child);
    }
    remove(child) {
      this.children = this.children.filter((item) => item !== child);
    }
  };
  context.THREE.Color = class {
    constructor(value) {
      this.value = value;
    }
  };
  context.THREE.PerspectiveCamera = class {
    constructor() {
      this.position = new Vector3();
      this.aspect = 1;
    }
    updateProjectionMatrix() {}
  };
  context.THREE.OrthographicCamera = class {
    constructor() {
      this.position = new Vector3();
      this.up = new Vector3();
    }
    updateProjectionMatrix() {}
  };
  context.THREE.WebGLRenderer = class {
    constructor() {
      this.domElement = createMockElement("canvas");
      this.domElement.__events = {};
      this.domElement.addEventListener = (type, handler) => {
        this.domElement.__events[type] = this.domElement.__events[type] || [];
        this.domElement.__events[type].push(handler);
      };
      this.domElement.removeEventListener = (type, handler) => {
        this.domElement.__events[type] = (this.domElement.__events[type] || []).filter(
          (registered) => registered !== handler,
        );
      };
      this.disposeCalls = 0;
      context.__renderers.push(this);
    }
    setSize() {}
    setPixelRatio() {}
    dispose() {
      this.disposeCalls += 1;
    }
    render() {}
  };
  context.THREE.AmbientLight = class {};
  context.THREE.DirectionalLight = class {
    constructor() {
      this.position = new Vector3();
    }
  };
  context.THREE.GridHelper = class {};
  context.THREE.AxesHelper = class {};
  context.THREE.OrbitControls = class {
    constructor() {
      this.target = new Vector3();
    }
    update() {}
    dispose() {
      context.__controlsDisposed = (context.__controlsDisposed || 0) + 1;
    }
  };

  vm.runInContext(
    `
      updateProgress = () => {};
      document.getElementById = (id) => {
        if (id === "container") return __container;
        return {
          classList: { add() {}, remove() {}, contains() { return false; } },
          querySelector() { return null; },
          style: {},
          textContent: "",
        };
      };
    `,
    context,
  );

  await vm.runInContext("window.__pcwTestApi.initThreeJS()", context);
  await vm.runInContext("window.__pcwTestApi.initThreeJS()", context);

  expect(context.__renderers).toHaveLength(2);
  expect(context.__renderers[0].disposeCalls).toBe(1);
  expect(context.__container.children).toHaveLength(1);
  expect(
    Object.keys(context.__renderers[1].domElement.__events).sort(),
  ).toEqual(["webglcontextlost", "webglcontextrestored"]);
  expect(context.__controlsDisposed).toBe(1);
  expect(context.__removedWindowEvents).toContain("resize");
});
