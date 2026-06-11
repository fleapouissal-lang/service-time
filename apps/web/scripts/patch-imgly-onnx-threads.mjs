import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const candidates = [
  path.join(
    webRoot,
    "node_modules",
    "@imgly",
    "background-removal",
    "dist",
    "index.mjs",
  ),
  path.join(
    webRoot,
    "..",
    "..",
    "node_modules",
    "@imgly",
    "background-removal",
    "dist",
    "index.mjs",
  ),
];

const patches = [
  {
    from: "ort2.env.wasm.numThreads = maxNumThreads();",
    to: "ort2.env.wasm.numThreads = 1;",
    label: "numThreads=1",
  },
  {
    from: `async function loadAsUrl(url, config) {
  return URL.createObjectURL(await loadAsBlob(url, config));
}`,
    to: `async function loadAsUrl(key, config) {
  const relativePath = key.startsWith("/") ? key.slice(1) : key;
  return new URL(relativePath, config.publicPath).href;
}`,
    label: "loadAsUrl direct HTTP",
  },
];

for (const filePath of candidates) {
  if (!existsSync(filePath)) continue;

  let source = readFileSync(filePath, "utf8");
  let changed = false;

  for (const patch of patches) {
    if (source.includes(patch.to)) continue;
    if (!source.includes(patch.from)) {
      console.warn(`[patch-imgly] skip ${patch.label}: pattern not found`);
      continue;
    }
    source = source.replace(patch.from, patch.to);
    changed = true;
    console.log(`[patch-imgly] applied ${patch.label}:`, filePath);
  }

  if (changed) {
    writeFileSync(filePath, source);
  }
}
