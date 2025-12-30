import fs from "node:fs";
import path from "node:path";

const root = process.argv[2];
if (!root) {
  console.error("Usage: node scripts/gen-geo-data.mjs <repoRoot>");
  process.exit(1);
}

const jsonPath = path.join(root, "tmp", "nigeria-states-lga.json");
const outPath = path.join(root, "src", "lib", "geo-data.ts");

const raw = fs.readFileSync(jsonPath, "utf8");
const data = JSON.parse(raw);

const records = Array.isArray(data) ? data : data.states ?? [];

const states = records
  .map((s) => ({
    name: s.name ?? s.state,
    lgas: (s.lgas ?? s.lga ?? [])
      .map((l) => (typeof l === "string" ? l : l?.name))
      .filter(Boolean),
  }))
  .filter((s) => typeof s.name === "string" && s.name.trim().length > 0);

const fctName = "Federal Capital Territory";
const fct = states.find((s) => s.name === fctName);

const rest = states
  .filter((s) => s.name !== fctName)
  .sort((a, b) => a.name.localeCompare(b.name));

for (const s of rest) s.lgas.sort((a, b) => a.localeCompare(b));
if (fct) fct.lgas.sort((a, b) => a.localeCompare(b));

const ordered = fct ? [...rest, fct] : rest;
const total = ordered.reduce((n, s) => n + s.lgas.length, 0);

const header = `export type GeoState = {\n  name: string;\n  lgas: string[];\n};\n\n// Full Nigerian State -> LGA mapping (${total} total entries incl. FCT area councils).\n// Source data normalized from https://github.com/Some19ice/nigeria-geo (MIT).\n`;

const content =
  header +
  `export const NIGERIAN_STATES: GeoState[] = ${JSON.stringify(ordered, null, 2)};\n\n` +
  `export const NIGERIA_GEO_MAP = new Map<string, string[]>(\n  NIGERIAN_STATES.map((s) => [s.name, s.lgas]),\n);\n`;

fs.writeFileSync(outPath, content);

console.log(`Wrote ${outPath}`);
console.log(`States: ${ordered.length}`);
console.log(`Total LGAs: ${total}`);
