// Install hc-alt-tab: copy mods, clone main as main-alt-tab, add the recording block and keys, switch layout.
// Usage: bun scripts/install.js
import { existsSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { addBindings, addRecorderBlock, RECORDED_LAYOUTS } from "../src/install-lib.js";

const home = process.env.HERDR_APP_HOME ?? join(homedir(), ".config", "herdr-app");
const root = join(import.meta.dir, "..");

function sh(cmd, args) {
  const r = Bun.spawnSync([cmd, ...args], { cwd: root, stdout: "inherit", stderr: "inherit" });
  if (r.exitCode !== 0) throw new Error(`${cmd} ${args.join(" ")} failed (${r.exitCode})`);
}
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const writeJson = (p, v) => writeFileSync(p, JSON.stringify(v, null, 2) + "\n");
function backup(p) {
  const bak = `${p}.hc-alt-tab.bak`;
  if (!existsSync(bak)) copyFileSync(p, bak);
}

sh("sh", ["scripts/sync.sh"]);

const layouts = join(home, "layouts");
if (!existsSync(join(layouts, "main-alt-tab.json"))) {
  sh("herdr-app", ["do", "layout.clone", JSON.stringify({ name: "main", as: "main-alt-tab" })]);
}
for (const name of RECORDED_LAYOUTS) {
  const p = join(layouts, `${name}.json`);
  if (!existsSync(p)) { console.log(`skip layout ${name}: not found`); continue; }
  if (name !== "main-alt-tab") backup(p);
  writeJson(p, addRecorderBlock(readJson(p)));
  console.log(`recording block in ${name}`);
}

const keysPath = join(home, "keys.json");
backup(keysPath);
const { keys, conflicts } = addBindings(readJson(keysPath));
writeJson(keysPath, keys);
for (const c of conflicts) console.log(`not bound, already taken: ${c}`);

sh("herdr-app", ["do", "layout.switch", JSON.stringify({ name: "main-alt-tab" })]);
console.log("hc-alt-tab installed; layout main-alt-tab");
