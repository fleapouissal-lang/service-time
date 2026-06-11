import { build } from "esbuild";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const webRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outFile = path.join(webRoot, "public", "imgly-bg-removal.mjs");
const entryCandidates = [
  path.join(webRoot, "node_modules", "@imgly", "background-removal", "dist", "index.mjs"),
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

const entry = entryCandidates.find((candidate) => existsSync(candidate));

if (!entry) {
  console.error("Missing @imgly/background-removal. Run npm install first.");
  process.exit(1);
}

execSync("node scripts/patch-imgly-onnx-threads.mjs", {
  cwd: webRoot,
  stdio: "inherit",
});

await build({
  entryPoints: [entry],
  outfile: outFile,
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2020"],
  minify: false,
  sourcemap: false,
  logLevel: "info",
});

console.log(`Bundled IMG.LY background removal -> ${outFile}`);
