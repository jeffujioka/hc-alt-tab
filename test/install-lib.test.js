import { describe, test, expect } from "bun:test";
import { BINDINGS, RECORDER_BLOCK, addBindings, removeBindings, addRecorderBlock, removeRecorderBlock, shippedLayouts, recordedLayouts, formatJson } from "../src/install-lib.js";

describe("which layouts record", () => {
  const installed = { "layout:main": { json: "a" }, "layout:win98": { json: "b" }, agents: { "main.js": "c" } };
  test("Herdr's shipped layouts are the installed manifest's layout: entries", () => {
    expect([...shippedLayouts(installed)].sort()).toEqual(["main", "win98"]);
  });
  test("every layout except Herdr's shipped ones records, plus main-alt-tab", () => {
    expect(recordedLayouts(["main", "win98", "my-layout", "board"], shippedLayouts(installed))).toEqual(["main-alt-tab", "my-layout", "board"]);
  });
  test("main-alt-tab is listed once when it already exists", () => {
    expect(recordedLayouts(["main", "main-alt-tab"], shippedLayouts(installed))).toEqual(["main-alt-tab"]);
  });
});

describe("formatJson keeps the file's style", () => {
  test("4-space indented files stay 4-space", () => {
    expect(formatJson({ a: 1 }, '{\n    "x": 0\n}\n')).toBe('{\n    "a": 1\n}\n');
  });
  test("tab-indented files stay tab-indented", () => {
    expect(formatJson({ a: 1 }, '{\n\t"x": 0\n}')).toBe('{\n\t"a": 1\n}\n');
  });
  test("one-line files stay on one line", () => {
    expect(formatJson({ a: 1 }, '{"x":0}')).toBe('{"a":1}\n');
  });
});

describe("addBindings", () => {
  test("adds every binding and keeps the person's own", () => {
    const { keys, conflicts } = addBindings({ global: { "cmd-q": "app.quit" } });
    expect(keys.global["cmd-q"]).toBe("app.quit");
    expect(keys.global["cmd-f4"]).toBe("mod.open:hc-alt-tab");
    expect(keys.global["cmd-f5"]).toBe("hc-alt-tab-recorder.toggle");
    expect(keys["mod:hc-alt-tab"]).toEqual(BINDINGS["mod:hc-alt-tab"]);
    expect(conflicts).toEqual([]);
  });
  test("is idempotent", () => {
    const once = addBindings({ global: { "cmd-q": "app.quit" } }).keys;
    expect(addBindings(once).keys).toEqual(once);
    expect(addBindings(once).conflicts).toEqual([]);
  });
  test("never overwrites a key bound to something else and reports it", () => {
    const { keys, conflicts } = addBindings({ global: { "cmd-f4": "x.y" } });
    expect(keys.global["cmd-f4"]).toBe("x.y");
    expect(conflicts).toEqual(["global cmd-f4"]);
  });
  test("does not mutate its input", () => {
    const k = { global: {} };
    addBindings(k);
    expect(k).toEqual({ global: {} });
  });
});

describe("removeBindings", () => {
  test("round-trips to the original keys", () => {
    const k = { global: { "cmd-q": "app.quit" }, terminal: { "cmd-c": "terminal.copy" } };
    expect(removeBindings(addBindings(k).keys)).toEqual(k);
  });
  test("keeps a binding the person changed afterwards", () => {
    const keys = addBindings({ global: {} }).keys;
    keys.global["cmd-f5"] = "other";
    expect(removeBindings(keys).global["cmd-f5"]).toBe("other");
  });
});

describe("recorder block", () => {
  const layout = { type: "row", children: [{ id: "a" }] };
  test("is appended to the root's children and is never hidden", () => {
    const out = addRecorderBlock(layout);
    expect(out.children.at(-1)).toEqual(RECORDER_BLOCK);
    expect("hidden" in RECORDER_BLOCK).toBe(false);
    expect(RECORDER_BLOCK.size).toEqual({ px: 0 });
  });
  test("is added once however often install runs", () => {
    const twice = addRecorderBlock(addRecorderBlock(layout));
    expect(twice.children.filter((c) => c.id === RECORDER_BLOCK.id).length).toBe(1);
  });
  test("removal restores the layout exactly", () => {
    expect(removeRecorderBlock(addRecorderBlock(layout))).toEqual(layout);
  });
});
