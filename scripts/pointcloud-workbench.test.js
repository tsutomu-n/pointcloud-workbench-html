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

function createContext({
  userAgent = "bun-test",
  userAgentData = undefined,
  href = "http://localhost/",
  protocol = "",
  hasWebGpu = false,
  hasWorker = false,
  crossOriginIsolated = false,
  isSecureContext = true,
  webgl2 = true,
} = {}) {
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
        el.getContext = (type) => {
          if (type === "webgl2") return webgl2 ? {} : null;
          return {};
        };
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
      href,
      protocol,
      reload() {},
    },
    isSecureContext,
    crossOriginIsolated,
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
    URL,
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
      userAgent,
      userAgentData,
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

  if (hasWorker) {
    windowObject.Worker = function Worker() {};
  }
  if (hasWebGpu) {
    windowObject.navigator = {
      hardwareConcurrency: 8,
      userAgent,
      userAgentData,
      language: "ja-JP",
      gpu: {},
    };
    context.navigator = windowObject.navigator;
  }

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
  globalEncoding = 0,
  headerSize = 227,
  numberOfVariableLengthRecords = 0,
  pointCount = 1000,
  pointDataOffset = 227,
  pointDataRecordFormat = 1,
  pointDataRecordLength = 28,
  versionMajor = 1,
  versionMinor = 2,
  startOfFirstExtendedVariableLengthRecord = 0n,
  numberOfExtendedVariableLengthRecords = 0,
  pointCount64 = 0n,
} = {}) {
  const buffer = new ArrayBuffer(512);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  bytes.set(new TextEncoder().encode("LASF"), 0);
  view.setUint16(6, globalEncoding, true);
  view.setUint8(24, versionMajor);
  view.setUint8(25, versionMinor);
  view.setUint16(94, headerSize, true);
  view.setUint32(96, pointDataOffset, true);
  view.setUint32(100, numberOfVariableLengthRecords, true);
  view.setUint8(104, pointDataRecordFormat);
  view.setUint16(105, pointDataRecordLength, true);
  view.setUint32(107, pointCount, true);
  view.setBigUint64(
    235,
    BigInt(startOfFirstExtendedVariableLengthRecord),
    true,
  );
  view.setUint32(243, numberOfExtendedVariableLengthRecords, true);
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

function encodeFixedAscii(view, offset, length, value) {
  const bytes = new TextEncoder().encode(value);
  new Uint8Array(view.buffer, offset, length).set(bytes.slice(0, length));
}

function createVlrRecord({ userId = "LASF_Projection", recordId, payload = new Uint8Array(), description = "" }) {
  const payloadBytes = payload instanceof Uint8Array ? payload : new TextEncoder().encode(String(payload));
  const buffer = new ArrayBuffer(54 + payloadBytes.byteLength);
  const view = new DataView(buffer);
  view.setUint16(0, 0, true);
  encodeFixedAscii(view, 2, 16, userId);
  view.setUint16(18, recordId, true);
  view.setUint16(20, payloadBytes.byteLength, true);
  encodeFixedAscii(view, 22, 32, description);
  new Uint8Array(buffer, 54).set(payloadBytes);
  return new Uint8Array(buffer);
}

function createEvlrRecord({ userId = "LASF_Projection", recordId, payload = new Uint8Array(), description = "" }) {
  const payloadBytes = payload instanceof Uint8Array ? payload : new TextEncoder().encode(String(payload));
  const buffer = new ArrayBuffer(60 + payloadBytes.byteLength);
  const view = new DataView(buffer);
  view.setUint16(0, 0, true);
  encodeFixedAscii(view, 2, 16, userId);
  view.setUint16(18, recordId, true);
  view.setBigUint64(20, BigInt(payloadBytes.byteLength), true);
  encodeFixedAscii(view, 28, 32, description);
  new Uint8Array(buffer, 60).set(payloadBytes);
  return new Uint8Array(buffer);
}

function concatUint8Arrays(parts) {
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    output.set(part instanceof Uint8Array ? part : new Uint8Array(part), offset);
    offset += part.byteLength;
  }
  return output;
}

function createGeoKeyDirectoryPayload(entries) {
  const buffer = new ArrayBuffer(8 + entries.length * 8);
  const view = new DataView(buffer);
  view.setUint16(0, 1, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, entries.length, true);
  entries.forEach((entry, index) => {
    const offset = 8 + index * 8;
    view.setUint16(offset, entry.keyId, true);
    view.setUint16(offset + 2, entry.tiffTagLocation || 0, true);
    view.setUint16(offset + 4, entry.count || 1, true);
    view.setUint16(offset + 6, entry.valueOffset, true);
  });
  return new Uint8Array(buffer);
}

test("parseLASHeader exposes VLR and EVLR boundary fields for CRS diagnostics", () => {
  const context = createContext();
  context.__buffer = createLasHeaderBuffer({
    globalEncoding: 0x10,
    headerSize: 375,
    numberOfVariableLengthRecords: 2,
    pointDataOffset: 640,
    pointDataRecordFormat: 6,
    pointDataRecordLength: 30,
    versionMajor: 1,
    versionMinor: 4,
    startOfFirstExtendedVariableLengthRecord: 2048n,
    numberOfExtendedVariableLengthRecords: 1,
    pointCount: 0,
    pointCount64: 99n,
  });

  const header = vm.runInContext(
    "window.__pcwTestApi.parseLASHeader(__buffer)",
    context,
  );

  expect(header.globalEncoding).toBe(0x10);
  expect(header.wktGlobalEncodingBit).toBe(true);
  expect(header.headerSize).toBe(375);
  expect(header.numberOfVariableLengthRecords).toBe(2);
  expect(header.pointDataOffset).toBe(640);
  expect(header.pointDataRecordFormat).toBe(6);
  expect(header.startOfFirstExtendedVariableLengthRecord).toBe(2048);
  expect(header.numberOfExtendedVariableLengthRecords).toBe(1);
});

test("parseLASHeader keeps EVLR fields empty for legacy headers", () => {
  const context = createContext();
  context.__buffer = createLasHeaderBuffer({
    versionMajor: 1,
    versionMinor: 2,
    startOfFirstExtendedVariableLengthRecord: 2048n,
    numberOfExtendedVariableLengthRecords: 3,
  });

  const header = vm.runInContext(
    "window.__pcwTestApi.parseLASHeader(__buffer)",
    context,
  );

  expect(header.startOfFirstExtendedVariableLengthRecord).toBe(0);
  expect(header.numberOfExtendedVariableLengthRecords).toBe(0);
});

test("readLASProjectionRecords reads bounded VLR projection records without point data", async () => {
  const context = createContext();
  installImmediateBlobReader(context);
  const wktPayload = new TextEncoder().encode('PROJCRS["JGD2011 / Japan Plane Rectangular CS IX",LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",6677]]\0');
  const vlrs = concatUint8Arrays([
    createVlrRecord({ recordId: 2112, payload: wktPayload }),
    createVlrRecord({
      recordId: 34735,
      payload: createGeoKeyDirectoryPayload([
        { keyId: 3072, valueOffset: 6677 },
        { keyId: 3076, valueOffset: 9001 },
      ]),
    }),
    createVlrRecord({
      recordId: 34736,
      payload: new Uint8Array(new Float64Array([1.25, 2.5]).buffer),
    }),
    createVlrRecord({
      recordId: 34737,
      payload: new TextEncoder().encode("JGD2011 / Japan Plane Rectangular CS IX|\0"),
    }),
  ]);
  const headerSize = 227;
  const pointDataOffset = headerSize + vlrs.byteLength;
  const header = createLasHeaderBuffer({
    headerSize,
    pointDataOffset,
    numberOfVariableLengthRecords: 4,
  });
  const fileBuffer = concatUint8Arrays([
    new Uint8Array(header).slice(0, headerSize),
    vlrs,
    new Uint8Array(64),
  ]).buffer;
  context.__file = createChunkedFile(fileBuffer, "projected.las");
  context.__header = vm.runInContext("window.__pcwTestApi.parseLASHeader(__buffer)", Object.assign(context, { __buffer: header }));

  const result = await vm.runInContext(
    "window.__pcwTestApi.readLASProjectionRecordsFromFile(__file, __header, 0)",
    context,
  );

  expect(result.records.map((record) => record.recordId)).toEqual([2112, 34735, 34736, 34737]);
  expect(context.__blobReadCalls).toBe(1);
  expect(context.__blobReadSizes).toEqual([vlrs.byteLength]);
});

test("readLASProjectionRecords reads EVLR WKT with header-first bounded payload reads", async () => {
  const context = createContext();
  installImmediateBlobReader(context);
  const headerSize = 227;
  const pointDataOffset = 512;
  const evlrOffset = 640;
  const evlr = createEvlrRecord({
    recordId: 2112,
    payload: new TextEncoder().encode('PROJCRS["JGD2011 / Japan Plane Rectangular CS IX",ID["EPSG",6677]]\0'),
  });
  const header = createLasHeaderBuffer({
    versionMajor: 1,
    versionMinor: 4,
    headerSize,
    pointDataOffset,
    startOfFirstExtendedVariableLengthRecord: BigInt(evlrOffset),
    numberOfExtendedVariableLengthRecords: 1,
  });
  const fileBytes = new Uint8Array(evlrOffset + evlr.byteLength);
  fileBytes.set(new Uint8Array(header).slice(0, headerSize), 0);
  fileBytes.set(evlr, evlrOffset);
  context.__file = createChunkedFile(fileBytes.buffer, "evlr.las");
  context.__header = vm.runInContext("window.__pcwTestApi.parseLASHeader(__buffer)", Object.assign(context, { __buffer: header }));

  const result = await vm.runInContext(
    "window.__pcwTestApi.readLASProjectionRecordsFromFile(__file, __header, 0)",
    context,
  );

  expect(result.records).toHaveLength(1);
  expect(result.records[0].kind).toBe("EVLR");
  expect(result.records[0].recordId).toBe(2112);
  expect(context.__blobReadSizes).toEqual([60, evlr.byteLength - 60]);
});

test("readLASProjectionRecords skips unsafe EVLR offsets and oversized non-projection payloads", async () => {
  const context = createContext();
  installImmediateBlobReader(context);
  const header = createLasHeaderBuffer({
    versionMajor: 1,
    versionMinor: 4,
    pointDataOffset: 512,
    startOfFirstExtendedVariableLengthRecord: 0n,
    numberOfExtendedVariableLengthRecords: 1,
  });
  context.__file = createChunkedFile(header, "bad-evlr.las");
  context.__header = vm.runInContext("window.__pcwTestApi.parseLASHeader(__buffer)", Object.assign(context, { __buffer: header }));

  const result = await vm.runInContext(
    "window.__pcwTestApi.readLASProjectionRecordsFromFile(__file, __header, 0)",
    context,
  );

  expect(result.records).toHaveLength(0);
  expect(result.warnings.some((warning) => warning.code === "evlr-skipped")).toBe(true);
});

test("readLASProjectionRecords warns for EVLR offsets beyond file size and overlapping point data", async () => {
  const context = createContext();
  installImmediateBlobReader(context);
  for (const headerOptions of [
    {
      pointDataOffset: 512,
      startOfFirstExtendedVariableLengthRecord: 4096n,
      numberOfExtendedVariableLengthRecords: 1,
    },
    {
      pointDataOffset: 1024,
      startOfFirstExtendedVariableLengthRecord: 640n,
      numberOfExtendedVariableLengthRecords: 1,
    },
    {
      pointDataOffset: 512,
      startOfFirstExtendedVariableLengthRecord: BigInt(Number.MAX_SAFE_INTEGER) + 2n,
      numberOfExtendedVariableLengthRecords: 1,
    },
  ]) {
    const headerBuffer = createLasHeaderBuffer({
      versionMajor: 1,
      versionMinor: 4,
      ...headerOptions,
    });
    context.__file = createChunkedFile(headerBuffer, "unsafe-evlr.las");
    context.__header = vm.runInContext(
      "window.__pcwTestApi.parseLASHeader(__buffer)",
      Object.assign(context, { __buffer: headerBuffer }),
    );

    const result = await vm.runInContext(
      "window.__pcwTestApi.readLASProjectionRecordsFromFile(__file, __header, 0)",
      context,
    );

    expect(result.records).toHaveLength(0);
    expect(result.warnings.some((warning) => warning.code === "evlr-skipped")).toBe(true);
  }
});

test("parseLASVlrRecords reports malformed lengths and record cap", () => {
  const context = createContext();
  const malformed = createVlrRecord({ recordId: 2112, payload: new TextEncoder().encode("short") });
  new DataView(malformed.buffer, malformed.byteOffset, malformed.byteLength).setUint16(20, 200, true);
  context.__malformed = malformed;
  context.__single = createVlrRecord({ recordId: 2112, payload: new TextEncoder().encode("ok") });

  const malformedResult = vm.runInContext(
    "window.__pcwTestApi.parseLASVlrRecords(__malformed.buffer, { count: 1 })",
    context,
  );
  const cappedResult = vm.runInContext(
    "window.__pcwTestApi.parseLASVlrRecords(__single.buffer, { count: 65 })",
    context,
  );

  expect(malformedResult.records).toHaveLength(0);
  expect(malformedResult.warnings.some((warning) => warning.code === "parse-warning")).toBe(true);
  expect(cappedResult.warnings.some((warning) => warning.code === "diagnostic-limit-reached")).toBe(true);
});

test("summarizeWktCrs separates CRS, vertical, unit, and other EPSG candidates", () => {
  const context = createContext();
  context.__wkt = 'COMPOUNDCRS["JGD2011 / Japan Plane Rectangular CS IX + height",PROJCRS["JGD2011 / Japan Plane Rectangular CS IX",BASEGEOGCRS["JGD2011",ID["EPSG",6668]],LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",6677]],VERTCRS["Tokyo Peil height",LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",6695]]]';

  const summary = vm.runInContext(
    "window.__pcwTestApi.summarizeWktCrs(__wkt)",
    context,
  );

  expect(summary.present).toBe(true);
  expect(summary.hasVertical).toBe(true);
  expect(summary.epsgCandidates.horizontal).toContain("6677");
  expect(summary.epsgCandidates.vertical).toContain("6695");
  expect(summary.epsgCandidates.unit).toContain("9001");
  expect(summary.epsgCandidates.horizontal).not.toContain("9001");
});

test("summarizeWktCrs handles WKT1 authorities, datum codes, and missing top-level CRS EPSG", () => {
  const context = createContext();
  context.__wkt1 = 'PROJCS["JGD2011 / Japan Plane Rectangular CS IX",GEOGCS["JGD2011",DATUM["Japanese Geodetic Datum 2011",AUTHORITY["EPSG","1128"]],AUTHORITY["EPSG","6668"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AUTHORITY["EPSG","6677"]]';
  context.__noTopLevel = 'PROJCRS["Local projected grid",BASEGEOGCRS["JGD2011",ID["EPSG",6668]],CONVERSION["Local method",METHOD["Transverse Mercator",ID["EPSG",9807]]],LENGTHUNIT["metre",1,ID["EPSG",9001]]]';

  const wkt1 = vm.runInContext(
    "window.__pcwTestApi.summarizeWktCrs(__wkt1)",
    context,
  );
  const noTopLevel = vm.runInContext(
    "window.__pcwTestApi.summarizeWktCrs(__noTopLevel)",
    context,
  );

  expect(wkt1.epsgCandidates.horizontal).toContain("6677");
  expect(wkt1.epsgCandidates.unit).toContain("9001");
  expect(wkt1.epsgCandidates.other).toContain("1128");
  expect(noTopLevel.present).toBe(true);
  expect(noTopLevel.epsgCandidates.horizontal).toEqual([]);
  expect(noTopLevel.epsgCandidates.unit).toEqual(["9001"]);
  expect(noTopLevel.epsgCandidates.other).toContain("9807");
});

test("summarizeGeoTiffKeys extracts CRS and unit EPSG candidates", () => {
  const context = createContext();
  context.__payload = createGeoKeyDirectoryPayload([
    { keyId: 3072, valueOffset: 6677 },
    { keyId: 4096, valueOffset: 6695 },
    { keyId: 3076, valueOffset: 9001 },
  ]);

  const summary = vm.runInContext(
    `
      const dir = window.__pcwTestApi.parseGeoKeyDirectory(__payload);
      window.__pcwTestApi.summarizeGeoTiffKeys(dir, [], "");
    `,
    context,
  );

  expect(summary.epsgCandidates.horizontal).toEqual(["6677"]);
  expect(summary.epsgCandidates.vertical).toEqual(["6695"]);
  expect(summary.epsgCandidates.unit).toEqual(["9001"]);
  expect(summary.units.horizontal).toBe("metre");
});

test("summarizeProjectionRecords prefers WKT and warns on CRS mismatch", () => {
  const context = createContext();
  const wktPayload = new TextEncoder().encode('PROJCRS["JGD2011 / Japan Plane Rectangular CS IX",LENGTHUNIT["metre",1,ID["EPSG",9001]],ID["EPSG",6677]]\0');
  const geoPayload = createGeoKeyDirectoryPayload([
    { keyId: 3072, valueOffset: 6678 },
    { keyId: 3076, valueOffset: 9001 },
  ]);
  context.__records = [
    { kind: "EVLR", userId: "LASF_Projection", recordId: 2112, projectionType: "coordinateSystemWkt", payload: wktPayload },
    { kind: "VLR", userId: "LASF_Projection", recordId: 34735, projectionType: "geoKeyDirectory", payload: geoPayload },
  ];

  const summary = vm.runInContext(
    "window.__pcwTestApi.summarizeProjectionRecords(__records)",
    context,
  );

  expect(summary.wkt.epsgCandidates.horizontal).toEqual(["6677"]);
  expect(summary.geoTiff.epsgCandidates.horizontal).toEqual(["6678"]);
  expect(summary.warnings.some((warning) => warning.code === "crs-mismatch-warning")).toBe(true);
});

test("buildCoordinateReferenceDiagnostics keeps parse warnings separate from main CRS status", () => {
  const context = createContext();
  context.__header = {
    pointDataRecordFormat: 6,
    wktGlobalEncodingBit: true,
  };
  context.__summary = {
    wkt: {
      name: "JGD2011 / Japan Plane Rectangular CS IX",
      hasVertical: false,
      units: { horizontal: "metre", vertical: null },
      epsgCandidates: { horizontal: ["6677"], vertical: [], unit: ["9001"], other: [] },
    },
    geoTiff: null,
    warnings: [{ code: "parse-warning", message: "一部のVLRを解析できませんでした。" }],
    rawSources: { hasWkt: true, hasGeoTiff: false, hasMathTransformWkt: false, vlrCount: 1, evlrCount: 0 },
  };

  const diagnostics = vm.runInContext(
    "window.__pcwTestApi.buildCoordinateReferenceDiagnostics({ header: __header, projectionSummary: __summary })",
    context,
  );

  expect(diagnostics.status).toBe("vertical-unknown");
  expect(diagnostics.warningCodes).toContain("parse-warning");
  expect(diagnostics.warningCodes).toContain("vertical-crs-missing");
});

test("CRS display helpers render unknowns cautiously and inquiry text omits sensitive data", () => {
  const context = createContext();
  context.__diagnostics = {
    status: "missing-horizontal-crs",
    horizontal: { detected: false, name: null, epsg: [] },
    vertical: { detected: false, name: null, epsg: [] },
    units: { horizontal: null, vertical: null },
    epsgCandidates: { horizontal: [], vertical: [], unit: [], other: [] },
    rawSources: { hasWkt: false, hasGeoTiff: false, hasMathTransformWkt: false },
    warnings: ["X/Y/Z 座標だけでは、公共座標かローカル座標か判定できません。"],
  };

  const rows = vm.runInContext(
    "window.__pcwTestApi.formatCrsDiagnosticsRows(__diagnostics)",
    context,
  );
  const inquiry = vm.runInContext(
    "window.__pcwTestApi.formatCrsInquiryText()",
    context,
  );

  expect(rows.status).toContain("特定できません");
  expect(rows.horizontal).toBe("不明");
  expect(rows.vertical).toBe("不明");
  expect(JSON.stringify(rows)).not.toContain("安全");
  expect(inquiry).toContain("EPSGコード");
  expect(inquiry).not.toContain("scan.las");
  expect(inquiry).not.toContain("PointData");
});

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

test("browser support policy allows Chrome and Edge only", () => {
  const chrome = createContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  });
  expect(vm.runInContext("window.__pcwTestApi.detectBrowserSupport()", chrome)).toEqual({
    supported: true,
    browser: "chrome",
  });

  const edge = createContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0",
  });
  expect(vm.runInContext("window.__pcwTestApi.detectBrowserSupport()", edge)).toEqual({
    supported: true,
    browser: "edge",
  });

  const firefox = createContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.0; rv:125.0) Gecko/20100101 Firefox/125.0",
  });
  expect(vm.runInContext("window.__pcwTestApi.detectBrowserSupport()", firefox)).toEqual({
    supported: false,
    browser: "unsupported",
  });
});

test("runtime mode selection distinguishes hosted, portable, and unsupported modes", () => {
  const hostedHighPerformance = createContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    href: "https://example.test/PointCloudWorkbench.html",
    protocol: "https:",
    hasWebGpu: true,
    hasWorker: true,
    crossOriginIsolated: true,
  });
  expect(
    vm.runInContext("window.__pcwTestApi.buildRuntimeStatus()", hostedHighPerformance),
  ).toMatchObject({
    mode: "hosted-high-performance",
    browser: "chrome",
    renderer: "WebGPU",
    worker: "Available",
    isolation: "COOP/COEP",
  });

  const portableWebgl = createContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    href: "file:///tmp/PointCloudWorkbench.html",
    protocol: "file:",
    hasWorker: true,
  });
  expect(vm.runInContext("window.__pcwTestApi.selectRuntimeMode()", portableWebgl)).toBe(
    "portable-online-webgl2",
  );

  const unsupported = createContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.0; rv:125.0) Gecko/20100101 Firefox/125.0",
    href: "https://example.test/PointCloudWorkbench.html",
    protocol: "https:",
    webgl2: true,
  });
  expect(vm.runInContext("window.__pcwTestApi.selectRuntimeMode()", unsupported)).toBe(
    "unsupported",
  );
});

test("runtime status panel writes the detected capability summary", () => {
  const context = createContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0",
    href: "https://example.test/PointCloudWorkbench.html",
    protocol: "https:",
    hasWorker: true,
  });

  const status = vm.runInContext("window.__pcwTestApi.updateRuntimeStatusPanel()", context);
  expect(status.mode).toBe("hosted-normal");
  expect(context.document.getElementById("runtimeModeLabel").textContent).toBe(
    "hosted-normal",
  );
  expect(context.document.getElementById("runtimeBrowser").textContent).toBe("edge");
  expect(context.document.getElementById("runtimeRenderer").textContent).toBe("WebGL2");
  expect(context.document.getElementById("runtimeWorker").textContent).toBe("Available");
  expect(context.document.getElementById("runtimeIsolation").textContent).toBe("Normal");
});

test("manual diagnostic report omits point cloud payloads and file names", () => {
  const context = createContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    href: "https://example.test/PointCloudWorkbench.html",
    protocol: "https:",
    hasWorker: true,
  });

  context.__selectedFile = {
    name: "private-site-survey.las",
    size: 123456,
  };
  vm.runInContext(
    `
      window.__pcwTestApi.setWorkflowState({
        step: "quality-select",
        selectedQuality: "low",
        selectedFile: __selectedFile,
      });
    `,
    context,
  );

  const reportText = vm.runInContext(
    "window.__pcwTestApi.buildManualDiagnosticReport()",
    context,
  );
  const report = JSON.parse(reportText);

  expect(report.privacy).toMatchObject({
    manualCopyOnly: true,
    telemetry: false,
    sendsPointCloudFile: false,
    includesPointCloudData: false,
    includesFileName: false,
  });
  expect(report.file).toEqual({
    extension: "las",
    sizeBytes: 123456,
  });
  expect(report.workflow).toMatchObject({
    step: "quality-select",
    selectedQuality: "low",
  });
  expect(report.diagnosticsCandidates).toMatchObject({
    total: 0,
    activeKind: "all",
    byKind: {
      "Z外れ値": 0,
      "孤立候補": 0,
      "欠測セル": 0,
      "密度スパイク": 0,
    },
  });
  expect(reportText).not.toContain("private-site-survey");
  expect(reportText).not.toContain("points\":[");
});

test("ReaderRegistry exposes LAS and LAZ local readers", () => {
  const context = createContext();

  const readers = vm.runInContext(
    "window.__pcwTestApi.getRegisteredPointCloudReaders()",
    context,
  );

  expect(readers).toEqual([
    {
      extension: "las",
      label: "LAS local chunked reader",
      localChunked: true,
    },
    {
      extension: "laz",
      label: "LAZ local WASM heap reader",
      localChunked: true,
    },
  ]);
  expect(
    vm.runInContext('window.__pcwTestApi.resolvePointCloudReader("scan.las").label', context),
  ).toBe("LAS local chunked reader");
  expect(
    vm.runInContext('window.__pcwTestApi.resolvePointCloudReader("scan.laz").label', context),
  ).toBe("LAZ local WASM heap reader");
  expect(
    vm.runInContext('window.__pcwTestApi.resolvePointCloudReader("scan.ply")', context),
  ).toBeNull();
});

test("PointCloudData summarizes counts, bounds, and coordinate basis", () => {
  const context = createContext();
  context.__header = {
    numberOfPointRecords: 4,
    xScaleFactor: 0.01,
    yScaleFactor: 0.02,
    zScaleFactor: 0.03,
    xOffset: 100,
    yOffset: 200,
    zOffset: 300,
  };
  context.__points = [
    { x: 10, y: 5, z: 1 },
    { x: 20, y: 15, z: 9 },
  ];

  const data = vm.runInContext(
    `
      window.__pcwTestApi.createPointCloudData({
        header: __header,
        points: __points,
        fileName: "scan.las",
        fileSize: 256,
      })
    `,
    context,
  );

  expect(data.kind).toBe("PointCloudData");
  expect(data.pointCounts).toMatchObject({
    sourceCount: 4,
    decodedCount: 2,
    displayCount: 2,
    displayRatio: 50,
  });
  expect(data.bounds).toEqual({
    minX: 10,
    maxX: 20,
    minY: 5,
    maxY: 15,
    minZ: 1,
    maxZ: 9,
  });
  expect(data.coordinateBasis.scale).toEqual({ x: 0.01, y: 0.02, z: 0.03 });
  expect(data.coordinateBasis.offset).toEqual({ x: 100, y: 200, z: 300 });
});

test("buildDensityGrid reports missing and spike density cells from displayed points", () => {
  const context = createContext();
  context.__points = [
    { x: 0, y: 0, z: 1 },
    { x: 0.1, y: 0.1, z: 1 },
    { x: 0.2, y: 0.1, z: 1 },
    { x: 0.2, y: 0.2, z: 1 },
    { x: 0.3, y: 0.2, z: 1 },
    { x: 9, y: 9, z: 2 },
    { x: 9.2, y: 9.1, z: 2 },
  ];
  context.__bounds = { minX: 0, maxX: 10, minY: 0, maxY: 10, minZ: 1, maxZ: 2 };

  const grid = vm.runInContext(
    "window.__pcwTestApi.buildDensityGrid(__points, __bounds, { gridSize: 4 })",
    context,
  );

  expect(grid.summary.occupiedCells).toBe(2);
  expect(grid.summary.emptyInteriorCells).toBeGreaterThan(0);
  expect(grid.summary.densitySpikeCells).toBeGreaterThan(0);
  expect(grid.status).toBe("warn");
});

test("detectZOutliers uses robust quartile thresholds", () => {
  const context = createContext();
  context.__points = [
    { x: 0, y: 0, z: 10 },
    { x: 1, y: 0, z: 11 },
    { x: 2, y: 0, z: 12 },
    { x: 3, y: 0, z: 13 },
    { x: 4, y: 0, z: 14 },
    { x: 5, y: 0, z: 100 },
  ];

  const result = vm.runInContext(
    "window.__pcwTestApi.detectZOutliers(__points)",
    context,
  );

  expect(result.status).toBe("warn");
  expect(result.candidates.map((point) => point.z)).toEqual([100]);
  expect(result.upperThreshold).toBeLessThan(100);
});

test("detectIsolatedPoints finds displayed points with too few neighbors", () => {
  const context = createContext();
  context.__points = [
    { x: 0, y: 0, z: 1 },
    { x: 0.2, y: 0.1, z: 1 },
    { x: 0.3, y: 0.2, z: 1 },
    { x: 10, y: 10, z: 1 },
  ];

  const result = vm.runInContext(
    `
      const index = window.__pcwTestApi.buildSpatialDiagnosticsIndex(__points);
      window.__pcwTestApi.detectIsolatedPoints(__points, index, {
        radius: 1,
        minNeighbors: 1,
      });
    `,
    context,
  );

  expect(result.status).toBe("warn");
  expect(result.candidates.map((point) => point.index)).toEqual([3]);
});

test("extractSectionPoints applies width and ground-only filters", () => {
  const context = createContext();
  context.__points = [
    { x: 0, y: 0, z: 1, classification: 2 },
    { x: 5, y: 0.4, z: 1, classification: 2 },
    { x: 5, y: 0.4, z: 1, classification: 5 },
    { x: 5, y: 3, z: 1, classification: 2 },
  ];
  context.__section = {
    start: { a: 0, b: 0 },
    end: { a: 10, b: 0 },
  };

  const all = vm.runInContext(
    "window.__pcwTestApi.extractSectionPoints(__points, __section, { width: 1, plane: 'xy' })",
    context,
  );
  const groundOnly = vm.runInContext(
    "window.__pcwTestApi.extractSectionPoints(__points, __section, { width: 1, plane: 'xy', groundOnly: true })",
    context,
  );

  expect(all.points.map((point) => point.index)).toEqual([0, 1, 2]);
  expect(groundOnly.points.map((point) => point.index)).toEqual([0, 1]);
  expect(groundOnly.status).toBe("ok");
});

test("renderDensityHeatmap uses simpleheat when available", () => {
  const context = createContext();
  context.__calls = [];
  context.simpleheat = () => ({
    data(data) {
      context.__calls.push(["data", data.length]);
      return this;
    },
    max(value) {
      context.__calls.push(["max", value]);
      return this;
    },
    radius(value) {
      context.__calls.push(["radius", value]);
      return this;
    },
    gradient(value) {
      context.__calls.push(["gradient", !!value]);
      return this;
    },
    draw(value) {
      context.__calls.push(["draw", value]);
      return this;
    },
  });
  context.__canvas = {
    width: 120,
    height: 60,
    getContext() {
      return {
        clearRect() {},
        fillRect() {},
      };
    },
  };
  context.__report = {
    densityGrid: {
      gridSize: 2,
      cells: [
        { row: 0, column: 0, count: 4 },
        { row: 0, column: 1, count: 0 },
        { row: 1, column: 0, count: 2 },
        { row: 1, column: 1, count: 1 },
      ],
    },
  };

  const result = vm.runInContext(
    "window.__pcwTestApi.renderDensityHeatmap(__report, __canvas)",
    context,
  );

  expect(result).toEqual({ rendered: true, mode: "simpleheat" });
  expect(context.__calls.map((call) => call[0])).toEqual([
    "data",
    "max",
    "radius",
    "gradient",
    "draw",
  ]);
});

test("renderDensityHeatmap falls back without simpleheat", () => {
  const context = createContext();
  context.__draws = 0;
  context.__canvas = {
    width: 120,
    height: 60,
    getContext() {
      return {
        clearRect() {},
        fillRect() {
          context.__draws++;
        },
      };
    },
  };
  context.__report = {
    densityGrid: {
      gridSize: 2,
      cells: [
        { row: 0, column: 0, count: 4 },
        { row: 0, column: 1, count: 0 },
        { row: 1, column: 0, count: 2 },
        { row: 1, column: 1, count: 1 },
      ],
    },
  };

  const result = vm.runInContext(
    "window.__pcwTestApi.renderDensityHeatmap(__report, __canvas)",
    context,
  );

  expect(result).toEqual({ rendered: true, mode: "fallback" });
  expect(context.__draws).toBeGreaterThan(0);
});

test("buildDiagnosticCandidateItems limits categories and total results", () => {
  const context = createContext();
  context.__report = {
    zOutliers: {
      candidates: Array.from({ length: 12 }, (_, index) => ({
        index,
        x: index,
        y: 0,
        z: index + 100,
      })),
    },
    isolatedPoints: {
      candidates: Array.from({ length: 12 }, (_, index) => ({
        index: index + 100,
        x: index,
        y: 0,
        z: 1,
        neighborCount: 0,
      })),
    },
    densityGrid: {
      emptyInteriorCells: Array.from({ length: 12 }, (_, index) => ({
        row: index,
        column: 0,
      })),
      densitySpikeCells: Array.from({ length: 12 }, (_, index) => ({
        row: index,
        column: 1,
        count: index + 3,
      })),
    },
  };

  const items = vm.runInContext(
    "window.__pcwTestApi.buildDiagnosticCandidateItems(__report, { perCategoryLimit: 3, totalLimit: 8 })",
    context,
  );

  expect(items).toHaveLength(8);
  expect(items.filter((item) => item.kind === "Z外れ値")).toHaveLength(3);
  expect(items.filter((item) => item.kind === "孤立候補")).toHaveLength(3);
});

test("buildDiagnosticCandidateItems can filter by candidate kind", () => {
  const context = createContext();
  context.__report = {
    zOutliers: {
      candidates: [{ index: 1, x: 0, y: 0, z: 10 }],
    },
    isolatedPoints: {
      candidates: [{ index: 2, x: 0, y: 0, z: 1, neighborCount: 0 }],
    },
    densityGrid: {
      emptyInteriorCells: [{ row: 1, column: 1 }],
      densitySpikeCells: [{ row: 2, column: 2, count: 6 }],
    },
  };

  const items = vm.runInContext(
    "window.__pcwTestApi.buildDiagnosticCandidateItems(__report, { kindFilter: '欠測セル' })",
    context,
  );

  expect(items).toHaveLength(1);
  expect(items[0].kind).toBe("欠測セル");
});

test("buildDiagnosticCandidateSummary returns per-kind counts and total", () => {
  const context = createContext();
  context.__report = {
    zOutliers: { candidates: [{ index: 1 }, { index: 2 }] },
    isolatedPoints: { candidates: [{ index: 3 }] },
    densityGrid: {
      emptyInteriorCells: [{ row: 1, column: 1 }],
      densitySpikeCells: [{ row: 2, column: 2 }, { row: 3, column: 3 }],
    },
  };

  const summary = vm.runInContext(
    "window.__pcwTestApi.buildDiagnosticCandidateSummary(__report)",
    context,
  );

  expect(summary.total).toBe(6);
  expect(summary.byKind).toEqual({
    "Z外れ値": 2,
    "孤立候補": 1,
    "欠測セル": 1,
    "密度スパイク": 2,
  });
  expect(summary.activeKind).toBe("all");
});

test("buildSectionProfile summarizes count, ground ratio, and z range", () => {
  const context = createContext();
  context.__sectionResult = {
    width: 2,
    points: [
      { sectionPosition: 0, z: 10, classification: 2 },
      { sectionPosition: 4, z: 14, classification: 2 },
      { sectionPosition: 8, z: 18, classification: 5 },
    ],
  };

  const profile = vm.runInContext(
    "window.__pcwTestApi.buildSectionProfile(__sectionResult)",
    context,
  );

  expect(profile.count).toBe(3);
  expect(profile.groundCount).toBe(2);
  expect(profile.groundRatio).toBeCloseTo(66.666, 2);
  expect(profile.zRange).toBe(8);
  expect(profile.densityEstimate).toBeCloseTo(3 / 16, 4);
});

test("renderSectionProfile handles empty data without crashing", () => {
  const context = createContext();
  context.__canvas = {
    width: 120,
    height: 60,
    getContext() {
      return {
        clearRect() {},
        fillRect() {},
        fillText() {},
        beginPath() {},
        moveTo() {},
        lineTo() {},
        stroke() {},
      };
    },
  };

  const result = vm.runInContext(
    "window.__pcwTestApi.renderSectionProfile(__canvas, null)",
    context,
  );

  expect(result).toBe(false);
});

test("buildDiagnosticsScore deducts for CRS, density, outlier, and isolation warnings", () => {
  const context = createContext();
  context.__report = {
    crsDiagnostics: { status: "missing-horizontal-crs" },
    densityGrid: { summary: { emptyInteriorCells: 2, densitySpikeCells: 1 } },
    zOutliers: { candidates: [{ index: 1 }] },
    isolatedPoints: { candidates: [{ index: 2 }] },
    classificationStats: { quality: "poor" },
    displayRatio: 1.5,
  };

  const score = vm.runInContext(
    "window.__pcwTestApi.buildDiagnosticsScore(__report)",
    context,
  );

  expect(score.score).toBeLessThan(50);
  expect(score.status).toBe("danger");
  expect(score.reasons).toContain("CRS確認");
  expect(score.reasons).toContain("欠測候補");
  expect(score.warningCodes).toContain("CRS_MISSING");
  expect(score.warningCodes).toContain("DENSITY_HOLES");
  expect(score.sectionWeights.reliability).toBe(30);
});

test("buildDiagnosticsWarningCodes returns normalized warning codes", () => {
  const context = createContext();
  context.__report = {
    crsDiagnostics: { status: "unknown" },
    densityGrid: { summary: { emptyInteriorCells: 1, densitySpikeCells: 0 } },
    zOutliers: { candidates: [{ index: 1 }] },
    isolatedPoints: { candidates: [] },
    classificationStats: { quality: "limited" },
    displayRatio: 2.4,
  };

  const codes = vm.runInContext(
    "window.__pcwTestApi.buildDiagnosticsWarningCodes(__report)",
    context,
  );

  expect(codes).toEqual([
    "CRS_MISSING",
    "CLASSIFICATION_LIMITED",
    "DISPLAY_RATIO_LOW",
    "DENSITY_HOLES",
    "Z_OUTLIERS",
  ]);
});

test("updateDiagnosticsSummaryDisplay normalizes warning code set, order, and dedup", () => {
  const context = createContext();
  vm.runInContext(
    `
      const canvas = document.getElementById("sectionProfileCanvas");
      if (canvas) {
        canvas.getContext = () => ({
          clearRect() {},
          fillRect() {},
          fillText() {},
          beginPath() {},
          moveTo() {},
          lineTo() {},
          stroke() {},
        });
      }
    `,
    context,
  );
  context.__report = {
    score: {
      score: 42,
      status: "warn",
      reasons: ["CRS確認"],
      warningCodes: [
        " density_holes ",
        "CRS_MISSING",
        "DENSITY_HOLES",
        "crs_missing",
        "UNKNOWN_CODE",
      ],
      sectionWeights: {},
    },
    densityGrid: { summary: {} },
    zOutliers: { candidates: [] },
    isolatedPoints: { candidates: [] },
  };

  vm.runInContext("updateDiagnosticsSummaryDisplay(__report)", context);
  const codesText = vm.runInContext(
    "document.getElementById('diagnosticsWarningCodes').textContent",
    context,
  );

  expect(codesText).toBe("CRS_MISSING, DENSITY_HOLES");
});

test("buildPointCloudDiagnostics falls back when optional OSS helpers are not loaded", () => {
  const context = createContext();
  context.__pointCloudData = {
    points: [
      { x: 0, y: 0, z: 1, classification: 2 },
      { x: 0.2, y: 0.1, z: 1, classification: 2 },
      { x: 5, y: 5, z: 20, classification: 1 },
      { x: 10, y: 10, z: 200, classification: 1 },
    ],
    bounds: { minX: 0, maxX: 10, minY: 0, maxY: 10, minZ: 1, maxZ: 200 },
    pointCounts: { displayCount: 4, displayRatio: 100 },
  };

  const report = vm.runInContext(
    `
      window.__pcwTestApi.buildPointCloudDiagnostics({
        pointCloudData: __pointCloudData,
        classificationCounts: { 1: 2, 2: 2 },
        crsDiagnostics: { status: "complete-crs-metadata" },
      })
    `,
    context,
  );

  expect(report.basis).toBe("displayed-points");
  expect(report.usesFlatbush).toBe(false);
  expect(report.densityGrid.summary.occupiedCells).toBeGreaterThan(0);
  expect(Number.isFinite(report.score.score)).toBe(true);
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

test("calculateMeasurementMetrics reports source-coordinate distances", () => {
  const context = createContext();

  const metrics = vm.runInContext(
    `
      window.__pcwTestApi.calculateMeasurementMetrics(
        { source: { x: 10, y: 20, z: 30 } },
        { source: { x: 13, y: 24, z: 42 } }
      )
    `,
    context,
  );

  expect(metrics.dx).toBe(3);
  expect(metrics.dy).toBe(4);
  expect(metrics.dz).toBe(12);
  expect(metrics.distance3d).toBe(13);
  expect(metrics.horizontalDistance).toBe(5);
  expect(metrics.heightDifference).toBe(12);
});

test("calculateMeasurementMetrics rejects invalid source coordinates", () => {
  const context = createContext();

  expect(() =>
    vm.runInContext(
      `
        window.__pcwTestApi.calculateMeasurementMetrics(
          { source: { x: NaN, y: 20, z: 30 } },
          { source: { x: 13, y: 24, z: 42 } }
        )
      `,
      context,
    ),
  ).toThrow("計測点の元座標が無効です");
});

test("formatMeasurementResult labels displayed-point measurement and meter-equivalent units", () => {
  const context = createContext();

  const result = vm.runInContext(
    `
      window.__pcwTestApi.formatMeasurementResult({
        distance3d: 13,
        horizontalDistance: 5,
        heightDifference: 12,
        dx: 3,
        dy: 4,
        dz: 12,
      })
    `,
    context,
  );

  expect(result.summary).toContain("13.000 m相当");
  expect(result.note).toContain("表示点への計測");
  expect(result.note).toContain("元データの座標単位に依存");
  expect(result.rows).toContainEqual(["高さ差", "12.000 m相当"]);
  expect(result.rows).toContainEqual(["dZ", "12.000 m相当"]);
});

test("formatMeasurementCopyText includes source point coordinates", () => {
  const context = createContext();

  const text = vm.runInContext(
    `
      window.__pcwTestApi.formatMeasurementCopyText({
        start: { x: 10, y: 20, z: 30 },
        end: { x: 13, y: 24, z: 42 },
        distance3d: 13,
        horizontalDistance: 5,
        heightDifference: 12,
        dx: 3,
        dy: 4,
        dz: 12,
      })
    `,
    context,
  );

  expect(text).toContain("距離: 13.000 m相当");
  expect(text).toContain("点1 元LAS座標: X=10.000, Y=20.000, Z=30.000");
  expect(text).toContain("点2 元LAS座標: X=13.000, Y=24.000, Z=42.000");
  expect(text).toContain("表示点への計測");
});

test("createMeasurementRecord stores metrics for measurement history", () => {
  const context = createContext();

  const record = vm.runInContext(
    `
      window.__pcwTestApi.createMeasurementRecord(
        7,
        { source: { x: 10, y: 20, z: 30 } },
        { source: { x: 13, y: 24, z: 42 } }
      )
    `,
    context,
  );

  expect(record.id).toBe(7);
  expect(record.metrics.distance3d).toBe(13);
  expect(record.metrics.horizontalDistance).toBe(5);
  expect(record.metrics.heightDifference).toBe(12);
});

test("appendMeasurementRecord enforces the measurement history limit", () => {
  const context = createContext();
  context.__history = [{ id: 1 }, { id: 2 }];
  context.__record = { id: 3 };

  const result = vm.runInContext(
    "window.__pcwTestApi.appendMeasurementRecord(__history, __record, 2)",
    context,
  );

  expect(result.history.map((record) => record.id)).toEqual([2, 3]);
  expect(result.removed.map((record) => record.id)).toEqual([1]);
});

test("formatMeasurementHistoryItem summarizes distance and deltas", () => {
  const context = createContext();

  const item = vm.runInContext(
    `
      window.__pcwTestApi.formatMeasurementHistoryItem({
        id: 4,
        metrics: {
          distance3d: 13,
          horizontalDistance: 5,
          heightDifference: 12,
          dx: 3,
          dy: 4,
          dz: 12,
        },
      })
    `,
    context,
  );

  expect(item.id).toBe(4);
  expect(item.distance).toBe("13.000 m相当");
  expect(item.meta).toContain("水平 5.000 m相当");
  expect(item.meta).toContain("高さ差 12.000 m相当");
});

test("measurement pin visual specs use fixed screen-size markers", () => {
  const context = createContext();

  const specs = vm.runInContext(
    `[
      window.__pcwTestApi.getMeasurementPinVisualSpec("start"),
      window.__pcwTestApi.getMeasurementPinVisualSpec("end"),
    ]`,
    context,
  );

  expect(specs[0]).toMatchObject({
    role: "start",
    size: 30,
    fill: "#38bdf8",
  });
  expect(specs[1]).toMatchObject({
    role: "end",
    size: 34,
    fill: "#facc15",
  });
  expect(specs[1].size).toBeGreaterThan(specs[0].size);
});

test("formatMeasurementTooltip summarizes the hovered history record", () => {
  const context = createContext();

  const tooltip = vm.runInContext(
    `
      window.__pcwTestApi.formatMeasurementTooltip({
        id: 4,
        metrics: {
          distance3d: 13,
          horizontalDistance: 5,
          heightDifference: 12,
        },
      })
    `,
    context,
  );

  expect(tooltip.title).toBe("#4 13.000 m相当");
  expect(tooltip.rows).toContainEqual(["水平", "5.000 m相当"]);
  expect(tooltip.rows).toContainEqual(["高さ差", "12.000 m相当"]);
});

test("active measurement record prefers hover preview over click selection", () => {
  const context = createContext();

  const ids = vm.runInContext(
    `[
      window.__pcwTestApi.getActiveMeasurementRecordId({
        previewRecordId: null,
        selectedRecordId: 7,
      }),
      window.__pcwTestApi.getActiveMeasurementRecordId({
        previewRecordId: 3,
        selectedRecordId: 7,
      }),
      window.__pcwTestApi.getActiveMeasurementRecordId({
        previewRecordId: null,
        selectedRecordId: null,
      }),
    ]`,
    context,
  );

  expect(ids).toEqual([7, 3, null]);
});

test("removed measurement records clear only matching preview or selection state", () => {
  const context = createContext();

  const states = vm.runInContext(
    `[
      window.__pcwTestApi.clearRemovedMeasurementIdsFromState(
        { previewRecordId: 3, selectedRecordId: 7 },
        [{ id: 3 }]
      ),
      window.__pcwTestApi.clearRemovedMeasurementIdsFromState(
        { previewRecordId: 3, selectedRecordId: 7 },
        [{ id: 7 }]
      ),
      window.__pcwTestApi.clearRemovedMeasurementIdsFromState(
        { previewRecordId: 3, selectedRecordId: 7 },
        [{ id: 99 }]
      ),
    ]`,
    context,
  );

  expect(states).toEqual([
    { previewRecordId: null, selectedRecordId: 7 },
    { previewRecordId: 3, selectedRecordId: null },
    { previewRecordId: 3, selectedRecordId: 7 },
  ]);
});

test("downsampleSourcePositions preserves source-coordinate index mapping", () => {
  const context = createContext();
  context.__sourcePositions = new Float64Array([
    0, 1, 2,
    10, 11, 12,
    20, 21, 22,
    30, 31, 32,
  ]);

  const sampled = vm.runInContext(
    "Array.from(window.__pcwTestApi.downsampleSourcePositions(__sourcePositions, 4, 2))",
    context,
  );

  expect(sampled).toEqual([0, 1, 2, 20, 21, 22]);
});

test("buildLoadProfile includes measurement source-coordinate memory", () => {
  const context = createContext();

  const profile = vm.runInContext(
    `
      window.__pcwTestApi.buildLoadProfile(
        { name: "dense.las", size: 100 * 1024 * 1024, slice() {} },
        "maximum",
        { numberOfPointRecords: 2000000 }
      )
    `,
    context,
  );

  expect(profile.measurementCoordinateMemoryMB).toBeGreaterThan(0);
  expect(profile.riskMessage).toContain("計測用座標");
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

test("sample modal includes the bundled Pages demo LAS option", () => {
  expect(html).toContain("Pages Demo Sample");
  expect(html).toContain("./demo/pointcloud-demo-sample.las");
});

test("selectSampleFile keeps bundled sample byte size separate from preview point count", () => {
  const context = createContext();

  vm.runInContext(
    `
      clearSelectedFilePreview = () => {};
      updateFileInfo = () => {};
      updateLastFileInfo = () => {};
      saveLastFileName = () => {};
      closeSampleFileModal = () => {};
      workflowState.selectedQuality = "medium";
      document.getElementById = () => ({
        disabled: true,
        style: {},
      });
      window.selectSampleFile("./demo/pointcloud-demo-sample.las", "Pages Demo Sample", 114915, 4096);
    `,
    context,
  );

  const selectedSize = vm.runInContext("workflowState.selectedFile.size", context);
  const previewPointCount = vm.runInContext(
    "workflowState.previewHeader.numberOfPointRecords",
    context,
  );

  expect(selectedSize).toBe(114915);
  expect(previewPointCount).toBe(4096);
});

test("bundled Pages demo LAS parses as an uncompressed LAS sample", async () => {
  const context = createContext();
  installImmediateBlobReader(context);

  const sampleBuffer = fs.readFileSync(
    path.join(__dirname, "..", "demo", "pointcloud-demo-sample.las"),
  );
  const exactArrayBuffer = sampleBuffer.buffer.slice(
    sampleBuffer.byteOffset,
    sampleBuffer.byteOffset + sampleBuffer.byteLength,
  );
  context.__file = createChunkedFile(exactArrayBuffer, "pointcloud-demo-sample.las");

  const preview = await vm.runInContext(
    "window.__pcwTestApi.analyzeSelectedFilePreview(__file)",
    context,
  );

  expect(preview.header.numberOfPointRecords).toBe(4096);
  expect(preview.header.pointDataRecordFormat).toBe(1);
  expect(preview.header.pointDataRecordLength).toBe(28);
  expect(preview.profile.strategyKey).toBe("las-chunked");
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
  ).toEqual([
    "pointerdown",
    "pointerup",
    "webglcontextlost",
    "webglcontextrestored",
  ]);
  expect(context.__controlsDisposed).toBe(1);
  expect(context.__removedWindowEvents).toContain("resize");
});
