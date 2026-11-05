// keys.json and layout edits made by install/uninstall. Pure: inputs are never mutated.

export const BINDINGS = {
  global: { "cmd-f4": "mod.open:hc-alt-tab", "cmd-f5": "hc-alt-tab-recorder.toggle" },
  "mod:hc-alt-tab": { "cmd-f4": "hc-alt-tab.next", "cmd-shift-f4": "hc-alt-tab.prev" },
};

export const RECORDER_BLOCK = {
  id: "hc-alt-tab-recorder",
  type: "block",
  size: { px: 0 },
  resizable: false,
  content: { mod: "hc-alt-tab-recorder" },
};

export const DAILY_LAYOUT = "main-alt-tab";

/** Herdr's own layouts, from its installed-files manifest (`installed.json`): `layout:<name>` keys.
 *  They are replaced on every start, so they can't hold the recording block.
 *  @param {Record<string, unknown>} installed @returns {Set<string>} */
export function shippedLayouts(installed) {
  return new Set(Object.keys(installed).filter((k) => k.startsWith("layout:")).map((k) => k.slice("layout:".length)));
}

/** Layouts that get the recording block: the daily clone first, then every layout that isn't Herdr's.
 *  @param {string[]} names layout names found in layouts/ @param {Set<string>} shipped @returns {string[]} */
export function recordedLayouts(names, shipped) {
  return [DAILY_LAYOUT, ...names.filter((n) => n !== DAILY_LAYOUT && !shipped.has(n))];
}

/** Serializes `value` in the indentation style of `original` (the file's previous text).
 *  @param {unknown} value @param {string} original @returns {string} */
export function formatJson(value, original) {
  const body = original.trim();
  if (!body.includes("\n")) return JSON.stringify(value) + "\n";
  const indent = /\n([ \t]+)\S/.exec(body)?.[1] ?? "  ";
  return JSON.stringify(value, null, indent) + "\n";
}

/** @returns {{ keys: object, conflicts: string[] }} */
export function addBindings(keys) {
  const out = structuredClone(keys);
  const conflicts = [];
  for (const [section, bindings] of Object.entries(BINDINGS)) {
    out[section] ??= {};
    for (const [key, action] of Object.entries(bindings)) {
      if (key in out[section] && out[section][key] !== action) conflicts.push(`${section} ${key}`);
      else out[section][key] = action;
    }
  }
  return { keys: out, conflicts };
}

export function removeBindings(keys) {
  const out = structuredClone(keys);
  for (const [section, bindings] of Object.entries(BINDINGS)) {
    if (!out[section]) continue;
    for (const [key, action] of Object.entries(bindings)) {
      if (out[section][key] === action) delete out[section][key];
    }
    if (section !== "global" && Object.keys(out[section]).length === 0) delete out[section];
  }
  return out;
}

export function addRecorderBlock(layout) {
  const out = structuredClone(layout);
  out.children ??= [];
  if (!out.children.some((c) => c.id === RECORDER_BLOCK.id)) out.children.push(structuredClone(RECORDER_BLOCK));
  return out;
}

export function removeRecorderBlock(layout) {
  const out = structuredClone(layout);
  if (out.children) out.children = out.children.filter((c) => c.id !== RECORDER_BLOCK.id);
  return out;
}
