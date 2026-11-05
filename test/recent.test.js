import { describe, test, expect } from "bun:test";
import { machineOf, placeOf, recordVisit, prune, previousPlace, isSelectable, MAX_ENTRIES } from "../src/recent.js";

const e = (terminal, at = 0) => ({ terminal, space: "s", tab: "t", pane: null, at });
const terms = (list) => list.map((x) => x.terminal);

describe("machineOf", () => {
  test("remote address names its machine", () => expect(machineOf("bs/t13")).toBe("bs"));
  test("local address has no machine", () => expect(machineOf("t13")).toBeNull());
});

describe("placeOf", () => {
  test("nothing focused is not an Entry", () => expect(placeOf(null, 1)).toBeNull());
  test("a place without a Terminal is not an Entry", () => {
    expect(placeOf({ space: "s", tab: "t", pane: null, terminal: null }, 1)).toBeNull();
  });
  test("a focused Terminal becomes an Entry", () => {
    expect(placeOf({ space: "s", tab: "t", pane: null, terminal: "t1" }, 1)).toEqual({ terminal: "t1", space: "s", tab: "t", pane: null, at: 1 });
  });
});

describe("recordVisit", () => {
  const full = ["a", "b", "c", "d", "e"].map((t) => e(t));
  test("a new Visit goes first and the oldest falls off the cap", () => {
    const out = recordVisit(full, e("f"));
    expect(terms(out)).toEqual(["f", "a", "b", "c", "d"]);
    expect(out.length).toBe(MAX_ENTRIES);
  });
  test("revisiting moves the Entry to the front without duplicating it", () => {
    expect(terms(recordVisit(full, e("c")))).toEqual(["c", "a", "b", "d", "e"]);
  });
  test("does not mutate its input", () => {
    recordVisit(full, e("f"));
    expect(terms(full)).toEqual(["a", "b", "c", "d", "e"]);
  });
});

describe("prune", () => {
  const list = [e("t1"), e("bs/t2"), e("bs/t3"), e("t4")];
  test("drops Entries whose Terminal is gone", () => {
    expect(terms(prune(list, new Set(["t1", "bs/t2"]), new Set()))).toEqual(["t1", "bs/t2"]);
  });
  test("keeps Entries of an offline Machine", () => {
    expect(terms(prune(list, new Set(["t1", "bs/t2"]), new Set(["bs"])))).toEqual(["t1", "bs/t2", "bs/t3"]);
  });
});

describe("previousPlace", () => {
  test("skips the current place", () => {
    expect(previousPlace([e("t1"), e("t2"), e("t3")], "t1", new Set()).terminal).toBe("t2");
  });
  test("finds the newest other place when current is not first (dwell window)", () => {
    expect(previousPlace([e("t2"), e("t1")], "t1", new Set()).terminal).toBe("t2");
  });
  test("skips Entries on an offline Machine", () => {
    expect(previousPlace([e("t1"), e("bs/t2"), e("t3")], "t1", new Set(["bs"])).terminal).toBe("t3");
  });
  test("is null when only the current place is known", () => {
    expect(previousPlace([e("t1")], "t1", new Set())).toBeNull();
  });
  test("is null for an empty list", () => {
    expect(previousPlace([], null, new Set())).toBeNull();
  });
});

describe("isSelectable", () => {
  test("offline Machine Entries are not selectable", () => {
    expect(isSelectable(e("bs/t2"), new Set(["bs"]))).toBe(false);
    expect(isSelectable(e("t2"), new Set(["bs"]))).toBe(true);
  });
});
