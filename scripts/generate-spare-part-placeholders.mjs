#!/usr/bin/env node
/**
 * Génère des images placeholder pour les pièces détachées du seed.
 * Usage: npm run assets:spare-parts
 */
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "apps", "web", "public", "spare-parts");

const PARTS = [
  {
    file: "disque-frein.png",
    en: "Brake disc",
    ar: "قرص فرامل",
    accent: "#0f766e",
    bg: "#ecfdf5",
  },
  {
    file: "moyeu-roue.png",
    en: "Wheel hub",
    ar: "محور العجلة",
    accent: "#334155",
    bg: "#f1f5f9",
  },
  {
    file: "disque-embrayage.png",
    en: "Clutch disc",
    ar: "قرص كلتش",
    accent: "#b45309",
    bg: "#fffbeb",
  },
  {
    file: "alternateur.png",
    en: "Alternator",
    ar: "مولد كهربائي",
    accent: "#1d4ed8",
    bg: "#eff6ff",
  },
  {
    file: "pompe-eau.png",
    en: "Water pump",
    ar: "مضخة ماء",
    accent: "#0284c7",
    bg: "#f0f9ff",
  },
  {
    file: "filtre-air.png",
    en: "Air filter",
    ar: "فلتر هواء",
    accent: "#059669",
    bg: "#ecfdf5",
  },
  {
    file: "injecteurs.png",
    en: "Fuel injectors",
    ar: "حاقنات وقود",
    accent: "#7c3aed",
    bg: "#f5f3ff",
  },
  {
    file: "bras-suspension.png",
    en: "Control arm",
    ar: "ذراع تعليق",
    accent: "#dc2626",
    bg: "#fef2f2",
  },
  {
    file: "courroie.png",
    en: "Timing belt",
    ar: "سير توقيت",
    accent: "#0f766e",
    bg: "#f0fdfa",
  },
];

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSvg(part) {
  const en = escapeXml(part.en);
  const ar = escapeXml(part.ar);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${part.bg}"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="45%">
      <stop offset="0%" stop-color="${part.accent}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${part.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <rect width="800" height="800" fill="url(#glow)"/>
  <rect x="48" y="48" width="704" height="704" rx="36" fill="#ffffff" fill-opacity="0.72" stroke="${part.accent}" stroke-opacity="0.18" stroke-width="2"/>
  <circle cx="400" cy="330" r="150" fill="${part.accent}" fill-opacity="0.12" stroke="${part.accent}" stroke-opacity="0.35" stroke-width="8"/>
  <circle cx="400" cy="330" r="58" fill="#ffffff" fill-opacity="0.95" stroke="${part.accent}" stroke-width="6"/>
  <rect x="250" y="470" width="300" height="28" rx="14" fill="${part.accent}" fill-opacity="0.22"/>
  <rect x="290" y="520" width="220" height="18" rx="9" fill="${part.accent}" fill-opacity="0.14"/>
  <text x="400" y="620" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#050b10">${en}</text>
  <text x="400" y="670" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="600" fill="${part.accent}" direction="rtl">${ar}</text>
  <text x="400" y="728" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#64748b">Service Time · Demo product</text>
</svg>`;
}

await mkdir(outDir, { recursive: true });

for (const part of PARTS) {
  const svg = buildSvg(part);
  const target = join(outDir, part.file);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(target);
  console.log("✓", part.file);
}

console.log(`\n✅ ${PARTS.length} images → apps/web/public/spare-parts/`);
