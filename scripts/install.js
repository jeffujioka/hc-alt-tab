// Install hc-alt-tab: copy mods, clone main as main-alt-tab, add the recording block to every layout
// that isn't Herdr's own, add the key bindings, switch to main-alt-tab.
// Usage: bun scripts/install.js
import { existsSync, readFileSync, writeFileSync, copyFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { addBindings, addRecorderBlock, formatJson, recordedLayouts, shippedLayouts, DAILY_LAYOUT } from "../src/install-lib.js";

const home = process.env.HERDR_APP_HOME ?? join(homedir(), ".config", "herdr-app");
const root = join(import.meta.dir, "..");
const layouts = join(home, "layouts");
const keysPath = join(home, "keys.json");
const statePath = join(home, ".hc-alt-tab-install.json");

function sh(cmd, args) {
  const r = Bun.spawnSync([cmd, ...args], { cwd: root, stdout: "inherit", stderr: "inherit" });
  if (r.exitCode !== 0) throw new Error(`${cmd} ${args.join(" ")} failed (${r.exitCode})`);
}
function edit(p, change) {
  const text = readFileSync(p, "utf8");
  writeFileSync(p, formatJson(change(JSON.parse(text)), text));
}
function backup(p) {
  const bak = `${p}.hc-alt-tab.bak`;
  if (!existsSync(bak)) copyFileSync(p, bak);
}
function shownLayout() {
  const r = Bun.spawnSync(["herdr-app", "status"]);
  try { return r.exitCode === 0 ? JSON.parse(r.stdout.toString()).layout ?? null : null; } catch { return null; }
}

// Without a keys.json Herdr uses its built-in shortcuts; writing one holding only ours would drop them all.
if (!existsSync(keysPath)) {
  console.error(`no ${keysPath}: open Herdr once (or add any shortcut in Settings) so it writes one, then rerun`);
  process.exit(1);
}

// Remember the layout in use before the first install, so uninstall can go back to it.
if (!existsSync(statePath)) {
  const previous = shownLayout();
  writeFileSync(statePath, JSON.stringify({ previousLayout: previous === DAILY_LAYOUT ? null : previous }) + "\n");
}

sh("sh", ["scripts/sync.sh"]);

if (!existsSync(join(layouts, `${DAILY_LAYOUT}.json`))) {
  sh("herdr-app", ["do", "layout.clone", JSON.stringify({ name: "main", as: DAILY_LAYOUT })]);
}
const installedPath = join(home, "installed.json");
const shipped = shippedLayouts(existsSync(installedPath) ? JSON.parse(readFileSync(installedPath, "utf8")) : {});
const names = readdirSync(layouts).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -".json".length));
for (const name of recordedLayouts(names, shipped)) {
  const p = join(layouts, `${name}.json`);
  if (!existsSync(p)) { console.log(`skip layout ${name}: not found`); continue; }
  if (name !== DAILY_LAYOUT) backup(p);
  edit(p, addRecorderBlock);
  console.log(`recording block in ${name}`);
}
if (shipped.size) console.log(`not recorded (Herdr's own, replaced on start): ${[...shipped].join(", ")}`);

backup(keysPath);
let conflicts = [];
edit(keysPath, (k) => { const r = addBindings(k); conflicts = r.conflicts; return r.keys; });
// Herdr ignores a `mod:<name>` keys section for a mod it hasn't loaded yet and keeps ignoring it
// until keys.json is read again. Give the app time to pick up the freshly copied mods, then re-save.
Bun.sleepSync(1500);
edit(keysPath, (k) => k);
for (const c of conflicts) console.log(`not bound, already taken: ${c}`);

sh("herdr-app", ["do", "layout.switch", JSON.stringify({ name: DAILY_LAYOUT })]);
console.log(`hc-alt-tab installed; layout ${DAILY_LAYOUT}`);
