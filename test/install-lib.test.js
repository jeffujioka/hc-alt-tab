import { describe, test, expect } from "bun:test";
import { BINDINGS, RECORDER_BLOCK, addBindings, removeBindings, addRecorderBlock, removeRecorderBlock } from "../src/install-lib.js";

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
