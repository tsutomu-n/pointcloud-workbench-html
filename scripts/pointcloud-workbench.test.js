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
    Date,
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
