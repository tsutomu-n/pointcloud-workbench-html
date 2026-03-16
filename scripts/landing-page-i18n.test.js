const { test, expect } = require("bun:test");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const indexPath = path.join(__dirname, "..", "index.html");

function extractInlineScript(html) {
  const matches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const target = matches
    .map((match) => match[1])
    .find((script) => script.includes("__pcwLandingTestApi"));

  if (!target) {
    throw new Error("landing page test api script was not found");
  }

  return target;
}

function buildContext({ query = "", stored = null, languages = [], language = "en-US" } = {}) {
  const storage = new Map();
  if (stored !== null) {
    storage.set("pcwLandingLanguage", stored);
  }

  const selector = {
    value: "",
    addEventListener() {},
    setAttribute() {},
  };

  const textNode = () => ({
    textContent: "",
    innerHTML: "",
  });

  const nodes = {
    landingLanguageSelector: selector,
    landingLanguageLabel: textNode(),
    badgeMono: textNode(),
    heroMetaOne: textNode(),
    heroMetaTwo: textNode(),
    heroMetaThree: textNode(),
    heroLead: textNode(),
    heroDesc: textNode(),
    heroSlabLabel: textNode(),
    heroSlabPoints: textNode(),
    heroSlabDesc: textNode(),
    ctaLaunch: textNode(),
    ctaSample: textNode(),
    ctaRepository: textNode(),
    sectionCapabilities: textNode(),
    capOneTag: textNode(),
    capOneTitle: textNode(),
    capOneDesc: textNode(),
    capTwoTag: textNode(),
    capTwoTitle: textNode(),
    capTwoDesc: textNode(),
    capThreeTag: textNode(),
    capThreeTitle: textNode(),
    capThreeDesc: textNode(),
    sectionRequirements: textNode(),
    reqTitle: textNode(),
    reqList: textNode(),
    limitsTitle: textNode(),
    limitsList: textNode(),
    sectionDocs: textNode(),
    docOneTitle: textNode(),
    docOneDesc: textNode(),
    docTwoTitle: textNode(),
    docTwoDesc: textNode(),
    docThreeTitle: textNode(),
    docThreeDesc: textNode(),
    docFourTitle: textNode(),
    docFourDesc: textNode(),
    docsNote: textNode(),
    footerLicense: textNode(),
  };

  const documentElement = {
    lang: "en",
    dataset: {},
  };

  const context = {
    console,
    URLSearchParams,
    window: {
      location: { search: query },
      addEventListener() {},
    },
    document: {
      documentElement,
      getElementById(id) {
        return nodes[id] || null;
      },
      addEventListener() {},
    },
    navigator: {
      languages,
      language,
    },
    localStorage: {
      getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
      },
      setItem(key, value) {
        storage.set(key, String(value));
      },
      removeItem(key) {
        storage.delete(key);
      },
    },
  };

  context.window.document = context.document;
  context.window.navigator = context.navigator;
  context.window.localStorage = context.localStorage;

  return { context, storage, nodes, documentElement };
}

function loadApi(options) {
  const html = fs.readFileSync(indexPath, "utf8");
  const script = extractInlineScript(html);
  const { context, storage, nodes, documentElement } = buildContext(options);
  vm.createContext(context);
  vm.runInContext(script, context);

  return {
    api: context.window.__pcwLandingTestApi,
    storage,
    nodes,
    documentElement,
  };
}

test("landing page resolves language by query, storage, navigator, then default", () => {
  const queryPreferred = loadApi({
    query: "?lang=zh-TW",
    stored: "ja",
    languages: ["en-US", "ja-JP"],
    language: "en-US",
  });
  expect(queryPreferred.api.resolveInitialLandingLanguage().language).toBe("zh");
  expect(queryPreferred.api.resolveInitialLandingLanguage().source).toBe("query");

  const storagePreferred = loadApi({
    stored: "ja",
    languages: ["en-US"],
    language: "en-US",
  });
  expect(storagePreferred.api.resolveInitialLandingLanguage().language).toBe("ja");
  expect(storagePreferred.api.resolveInitialLandingLanguage().source).toBe("storage");

  const navigatorPreferred = loadApi({
    languages: ["zh-CN", "en-US"],
    language: "en-US",
  });
  expect(navigatorPreferred.api.resolveInitialLandingLanguage().language).toBe("zh");
  expect(navigatorPreferred.api.resolveInitialLandingLanguage().source).toBe("navigator");

  const defaultPreferred = loadApi({
    languages: ["fr-FR"],
    language: "fr-FR",
  });
  expect(defaultPreferred.api.resolveInitialLandingLanguage().language).toBe("en");
  expect(defaultPreferred.api.resolveInitialLandingLanguage().source).toBe("default");
});

test("landing page normalizes language tags and persists only explicit selection", () => {
  const harness = loadApi({
    languages: ["ja-JP"],
    language: "ja-JP",
  });

  expect(harness.api.normalizeLandingLanguageTag("EN-us")).toBe("en");
  expect(harness.api.normalizeLandingLanguageTag("zh-Hant")).toBe("zh");
  expect(harness.api.normalizeLandingLanguageTag("fr-FR")).toBeNull();

  harness.api.applyLandingLanguage("ja", { persist: false });
  expect(harness.documentElement.lang).toBe("ja");
  expect(harness.storage.has("pcwLandingLanguage")).toBe(false);

  harness.api.applyLandingLanguage("en", { persist: true });
  expect(harness.documentElement.lang).toBe("en");
  expect(harness.storage.get("pcwLandingLanguage")).toBe("en");
  expect(harness.nodes.landingLanguageSelector.value).toBe("en");
});
