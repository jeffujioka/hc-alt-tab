// Uninstall hc-alt-tab: switch back to the layout used before install, remove the key bindings and
// recording blocks, delete the mods.
// Usage: bun scripts/uninstall.js [--purge]   (--purge also deletes layouts/main-alt-tab.json)
import { existsSync, readFileSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { formatJson, removeBindings, removeRecorderBlock, RECORDER_BLOCK, DAILY_LAYOUT } from "../src/install-lib.js";

const home = process.env.HERDR_APP_HOME ?? join(homedir(), ".config", "herdr-app");
const layouts = join(home, "layouts");
const keysPath = join(home, "keys.json");
const statePath = join(home, ".hc-alt-tab-install.json");
const purge = process.argv.includes("--purge");

function edit(p, change) {
  const text = readFileSync(p, "utf8");
  writeFileSync(p, formatJson(change(JSON.parse(text)), text));
}
function readState() {
  try { return JSON.parse(readFileSync(statePath, "utf8")); } catch { return {}; }
}
function shownLayout() {
  const r = Bun.spawnSync(["herdr-app", "status"]);
  try { return r.exitCode === 0 ? JSON.parse(r.stdout.toString()).layout ?? null : null; } catch { return null; }
}

const previous = readState().previousLayout;
const back = previous && existsSync(join(layouts, `${previous}.json`)) ? previous : "main";
if (shownLayout() === DAILY_LAYOUT) {
  const r = Bun.spawnSync(["herdr-app", "do", "layout.switch", JSON.stringify({ name: back })]);
  if (r.exitCode !== 0) console.error(`could not switch to ${back}; switch layouts in Herdr yourself`);
  else console.log(`layout ${back}`);
}

if (existsSync(keysPath)) edit(keysPath, removeBindings);

for (const f of existsSync(layouts) ? readdirSync(layouts).filter((x) => x.endsWith(".json")) : []) {
  const p = join(layouts, f);
  if (readFileSync(p, "utf8").includes(`"${RECORDER_BLOCK.id}"`)) edit(p, removeRecorderBlock);
}
if (purge) rmSync(join(layouts, `${DAILY_LAYOUT}.json`), { force: true });

for (const m of ["hc-alt-tab", "hc-alt-tab-recorder"]) rmSync(join(home, "mods", m), { recursive: true, force: true });
rmSync(statePath, { force: true });
console.log(`hc-alt-tab uninstalled${purge ? ` (${DAILY_LAYOUT} deleted)` : ""}`);
