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

export const RECORDED_LAYOUTS = ["main-alt-tab", "my-layout", "mission-control", "mission-control-classic"];

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
