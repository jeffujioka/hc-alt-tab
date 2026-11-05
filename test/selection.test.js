import { describe, test, expect } from "bun:test";
import { initialSelection, stepSelection } from "../src/recent.js";

const e = (terminal) => ({ terminal, space: "s", tab: "t", pane: null, at: 0 });
const none = new Set();

describe("initialSelection", () => {
  test("selects the previous place", () => {
    expect(initialSelection([e("t1"), e("t2"), e("t3")], "t1", none)).toBe(1);
  });
  test("selects the current place when there is no other", () => {
    expect(initialSelection([e("t1")], "t1", none)).toBe(0);
  });
  test("skips an offline previous place", () => {
    expect(initialSelection([e("t1"), e("bs/t2"), e("t3")], "t1", new Set(["bs"]))).toBe(2);
  });
  test("opens on a selectable row when neither a previous nor the current place can be picked", () => {
    expect(initialSelection([e("bs/t1"), e("t2")], null, new Set(["bs"]))).toBe(1);
  });
  test("is 0 for an empty list", () => {
    expect(initialSelection([], null, none)).toBe(0);
  });
});

describe("stepSelection", () => {
  const rows = [e("t1"), e("bs/t2"), e("t3"), e("t4")];
  const off = new Set(["bs"]);
  test("next moves down over unselectable rows", () => expect(stepSelection(rows, 0, 1, off)).toBe(2));
  test("next wraps to the top", () => expect(stepSelection(rows, 3, 1, off)).toBe(0));
  test("prev wraps to the bottom", () => expect(stepSelection(rows, 0, -1, off)).toBe(3));
  test("prev moves up over unselectable rows", () => expect(stepSelection(rows, 2, -1, off)).toBe(0));
  test("stays put when nothing else is selectable", () => {
    expect(stepSelection([e("t1"), e("bs/t2")], 0, 1, off)).toBe(0);
  });
  test("stays put on an empty list", () => expect(stepSelection([], 0, 1, none)).toBe(0));
});
