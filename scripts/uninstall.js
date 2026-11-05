// Uninstall hc-alt-tab: switch back to main, remove keys and recording blocks, delete the mods.
// Usage: bun scripts/uninstall.js [--purge]   (--purge also deletes layouts/main-alt-tab.json)
import { existsSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { removeBindings, removeRecorderBlock, RECORDED_LAYOUTS } from "../src/install-lib.js";

const home = process.env.HERDR_APP_HOME ?? join(homedir(), ".config", "herdr-app");
const purge = process.argv.includes("--purge");
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const writeJson = (p, v) => writeFileSync(p, JSON.stringify(v, null, 2) + "\n");

const status = Bun.spawnSync(["herdr-app", "status"]);
if (status.exitCode === 0 && JSON.parse(status.stdout.toString()).layout === "main-alt-tab") {
  Bun.spawnSync(["herdr-app", "do", "layout.switch", JSON.stringify({ name: "main" })]);
}

const keysPath = join(home, "keys.json");
writeJson(keysPath, removeBindings(readJson(keysPath)));

for (const name of RECORDED_LAYOUTS) {
  const p = join(home, "layouts", `${name}.json`);
  if (existsSync(p)) writeJson(p, removeRecorderBlock(readJson(p)));
}
if (purge) rmSync(join(home, "layouts", "main-alt-tab.json"), { force: true });

for (const m of ["hc-alt-tab", "hc-alt-tab-recorder"]) rmSync(join(home, "mods", m), { recursive: true, force: true });
console.log(`hc-alt-tab uninstalled${purge ? " (main-alt-tab deleted)" : ""}`);
