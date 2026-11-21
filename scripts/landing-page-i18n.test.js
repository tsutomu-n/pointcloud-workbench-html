const { test, expect } = require("bun:test");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const indexPath = path.join(__dirname, "..", "index.html");

function extractInlineScript(html, marker) {
  const matches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const target = matches
    .map((match) => match[1])
    .find((script) => script.includes(marker));

  if (!target) {
    throw new Error(`landing page script missing: ${marker}`);
  }

  return target;
}

function buildContext({
  html,
  query = "",
  stored = null,
  languages = [],
  language = "en-US",
  storedTheme = null,
  systemTheme = null,
} = {}) {
  const storage = new Map();
  if (stored !== null) {
    storage.set("pcwLandingLanguage", stored);
  }
  if (storedTheme !== null) {
    storage.set("pcw-theme", storedTheme);
  }

  const appLinks = [...html.matchAll(/<a\b[^>]*href="(\.\/PointCloudWorkbench\.html[^"]*)"[^>]*>/g)]
    .map(([, href]) => ({
      href: href.replaceAll("&amp;", "&"),
      getAttribute(name) {
        return this[name] ?? null;
      },
      setAttribute(name, value) {
        this[name] = value;
      },
    }));

  const selector = {
    value: "",
    addEventListener() {},
    setAttribute() {},
  };

  const textNode = () => ({
    textContent: "",
    innerHTML: "",
  });

  const documentListeners = {};
  const windowListeners = {};
  const themeListeners = {};
  const themeToggle = {
    ...textNode(),
    setAttribute(name, value) {
      this[name] = value;
    },
    addEventListener(type, listener) {
      themeListeners[type] = listener;
    },
  };

  const nodes = {
    landingLanguageSelector: selector,
    themeToggle,
    docThreeTitle: { ...textNode(), href: "" },
  };

  const documentElement = {
    lang: "en",
    dataset: {},
    dispatchEvent() {},
  };

  const context = {
    console,
    Event,
    URL,
    URLSearchParams,
    window: {
      location: { search: query },
      addEventListener(type, listener) {
        windowListeners[type] = listener;
      },
      matchMedia: systemTheme
        ? () => ({ matches: systemTheme === "light", addEventListener() {} })
        : undefined,
    },
    document: {
      baseURI: "https://example.com/pointcloud-workbench/",
      documentElement,
      getElementById(id) {
        return nodes[id] || null;
      },
      querySelectorAll(selector) {
        return selector === 'a[href^="./PointCloudWorkbench.html"]' ? appLinks : [];
      },
      addEventListener(type, callback) {
        (documentListeners[type] ??= []).push(callback);
      },
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

  return { appLinks, context, storage, nodes, documentElement, documentListeners, themeListeners, windowListeners };
}

function loadApi(options = {}) {
  const html = fs.readFileSync(indexPath, "utf8");
  const script = extractInlineScript(html, "__pcwLandingTestApi");
  const harness = buildContext({ html, ...options });
  const { context } = harness;
  vm.createContext(context);
  vm.runInContext(script, context);

  return {
    ...harness,
    html,
    api: context.window.__pcwLandingTestApi,
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

test("landing app links preserve the sample and all three languages", () => {
  const { api, appLinks, nodes } = loadApi();

  for (const language of ["zh", "ja", "en"]) {
    api.applyLandingLanguage(language);
    const routes = appLinks.map(({ href }) => href);
    expect(routes).toEqual([
      `./PointCloudWorkbench.html?lang=${language}&open=file`,
      `./PointCloudWorkbench.html?lang=${language}&demo=river`,
    ]);
    expect(nodes.docThreeTitle.href).toBe(
      `https://github.com/tsutomu-n/pointcloud-workbench-html/blob/main/docs/quickstart.${language}.md`,
    );
  }
});

test("landing theme restores the saved choice on click, page restore, and other-tab changes", () => {
  const { context, html, storage, nodes, documentElement, documentListeners, themeListeners, windowListeners } =
    loadApi({ storedTheme: "dark", systemTheme: "light" });
  vm.runInContext(extractInlineScript(html, "pcw-theme"), context);

  expect(documentElement.dataset.theme).toBe("dark");
  for (const listener of documentListeners.DOMContentLoaded) listener();
  expect(nodes.themeToggle["aria-pressed"]).toBe("false");

  themeListeners.click();
  expect(documentElement.dataset.theme).toBe("light");
  expect(nodes.themeToggle["aria-pressed"]).toBe("true");
  expect(storage.get("pcw-theme")).toBe("light");

  storage.set("pcw-theme", "dark");
  windowListeners.pageshow({ persisted: true });
  expect(documentElement.dataset.theme).toBe("dark");
  expect(nodes.themeToggle["aria-pressed"]).toBe("false");

  storage.delete("pcw-theme");
  windowListeners.storage({ key: null });
  expect(documentElement.dataset.theme).toBe("light");
});
