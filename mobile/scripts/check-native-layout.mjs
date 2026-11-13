// Source-level guard for single-line, fit-to-width native headings and controls.
// This complements, but does not replace, screenshot testing on real devices.
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../app");
const routes = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const filename = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(filename);
    else if (filename.endsWith(".tsx") && !entry.name.startsWith("_")) routes.push(filename);
  }
}
walk(app);
if (routes.length < 38) throw new Error("Native layout coverage unexpectedly shrank: " + routes.length);

const important = /\bstyle=\{s\.(?:title|heroTitle|dispatchTitle|sectionTitle|nextTitle|primaryText|secondaryText|actionText|back|name|person|finishText|techniqueText|playText|recordText)\}/;
const tag = /<(?:Animated\.)?Text\b[^>]*>/g;
const issues = [];
let fitted = 0;
for (const file of routes) {
  const source = fs.readFileSync(file, "utf8");
  const relative = path.relative(app, file);
  for (const match of source.matchAll(tag)) {
    const element = match[0];
    if (!important.test(element)) continue;
    if (!/\bnumberOfLines=\{1\}/.test(element) || !/\badjustsFontSizeToFit\b/.test(element)) {
      const line = source.slice(0, match.index).split("\n").length;
      issues.push(relative + ":" + line + " should fit on one line");
    } else fitted++;
  }
  for (const copy of ["Coach-Briefing öffnen", "FRAUEN-DASHBOARD OPTIONAL"]) {
    if (source.includes(copy)) issues.push(relative + ": decorative dash in UI: " + copy);
  }
}
for (const page of ["(tabs)/index.tsx","(tabs)/training.tsx","(tabs)/progress.tsx","(tabs)/athlete.tsx","(tabs)/coach.tsx"]) {
  if (!routes.some(f => f.endsWith(path.join("app", page)))) issues.push("Missing primary tab: " + page);
}
if (issues.length) {
  console.error("Native layout contract failed:\n" + issues.join("\n"));
  process.exit(1);
}
console.log("Native layout source guard passed: " + routes.length + " routes; " + fitted + " headlines and controls fit one line.");
console.log("Visual QA remains required for 320, 360, 375 and 430 dp and enlarged accessibility text.");
