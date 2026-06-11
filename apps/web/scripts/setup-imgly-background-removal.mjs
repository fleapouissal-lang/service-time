import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { mkdir, readdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { execSync } from "node:child_process";

const VERSION = "1.7.0";
const PACKAGE_URL = `https://staticimgly.com/@imgly/background-removal-data/${VERSION}/package.tgz`;

const REQUIRED_ASSEMBLED = [
  "onnxruntime-web/ort-wasm-simd-threaded.wasm",
  "onnxruntime-web/ort-wasm-simd-threaded.mjs",
  "models/isnet_quint8",
];

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(scriptDir, "..");
const assetDir = path.join(webRoot, "public", "imgly-background-removal");
const markerFile = path.join(assetDir, "resources.json");
const archivePath = path.join(assetDir, "package.tgz");
const extractDir = path.join(assetDir, "_extract");

const force = process.argv.includes("--force");

async function download(url, destination) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to download ${url}: ${response.status} ${response.statusText}`,
    );
  }

  await pipeline(response.body, createWriteStream(destination));
}

async function moveDistContents(sourceDir, destinationDir) {
  const entries = await readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const from = path.join(sourceDir, entry.name);
    const to = path.join(destinationDir, entry.name);
    await rm(to, { recursive: true, force: true });
    await rename(from, to);
  }
}

function readResourceMap() {
  return JSON.parse(readFileSync(markerFile, "utf8"));
}

function requiredChunkNames(resourceMap) {
  const names = new Set();

  for (const entry of Object.values(resourceMap)) {
    for (const chunk of entry.chunks ?? []) {
      names.add(chunk.name);
    }
  }

  return names;
}

function assembleResource(key, entry, destinationDir) {
  const relativePath = key.startsWith("/") ? key.slice(1) : key;
  const outPath = path.join(destinationDir, relativePath);
  mkdirSync(path.dirname(outPath), { recursive: true });

  const parts = [];
  for (const chunk of entry.chunks ?? []) {
    parts.push(readFileSync(path.join(destinationDir, chunk.name)));
  }

  const assembled = Buffer.concat(parts);
  if (assembled.length !== entry.size) {
    throw new Error(
      `Assembled size mismatch for ${key}: expected ${entry.size}, got ${assembled.length}`,
    );
  }

  writeFileSync(outPath, assembled);
}

async function assembleStructuredAssets() {
  const resourceMap = readResourceMap();

  for (const [key, entry] of Object.entries(resourceMap)) {
    assembleResource(key, entry, assetDir);
  }
}

async function assetsAreComplete() {
  if (!existsSync(markerFile)) {
    return false;
  }

  try {
    const resourceMap = readResourceMap();

    for (const name of requiredChunkNames(resourceMap)) {
      if (!existsSync(path.join(assetDir, name))) {
        return false;
      }
    }

    for (const assembled of REQUIRED_ASSEMBLED) {
      if (!existsSync(path.join(assetDir, assembled))) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!force && (await assetsAreComplete())) {
    const fileCount = (await readdir(assetDir, { recursive: true })).length;
    console.log(
      `IMG.LY background-removal assets OK (${fileCount} entries in ${assetDir}).`,
    );
    return;
  }

  if (force) {
    console.log("Forcing reinstall of IMG.LY background-removal assets…");
  } else {
    console.log("Incomplete IMG.LY assets detected, reinstalling…");
  }

  await mkdir(assetDir, { recursive: true });

  for (const entry of await readdir(assetDir)) {
    if (entry === ".gitkeep") continue;
    await rm(path.join(assetDir, entry), { recursive: true, force: true });
  }

  await rm(extractDir, { recursive: true, force: true });
  await mkdir(extractDir, { recursive: true });

  console.log(`Downloading background-removal assets v${VERSION}…`);
  await download(PACKAGE_URL, archivePath);

  console.log("Extracting archive…");
  execSync(`tar -xzf "${archivePath}" -C "${extractDir}"`, { stdio: "inherit" });

  const distDir = path.join(extractDir, "package", "dist");
  if (!existsSync(path.join(distDir, "resources.json"))) {
    throw new Error(`Invalid archive layout: missing ${distDir}/resources.json`);
  }

  await moveDistContents(distDir, assetDir);
  console.log("Assembling WASM/model files…");
  await assembleStructuredAssets();

  await rm(extractDir, { recursive: true, force: true });
  await rm(archivePath, { force: true });

  if (!(await assetsAreComplete())) {
    throw new Error("Asset install finished but validation failed.");
  }

  const fileCount = (await readdir(assetDir, { recursive: true })).length;
  const archiveSize = await stat(markerFile).then((value) => value.size);
  console.log(
    `Background-removal assets installed (${fileCount} entries, resources.json ${archiveSize} bytes).`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
