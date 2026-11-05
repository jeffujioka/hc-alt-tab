import { describe, test, expect } from "bun:test";
import { Dwell, DWELL_MS } from "../src/dwell.js";

const e = (terminal) => ({ terminal, space: "s", tab: "t", pane: null, at: 0 });

describe("Dwell", () => {
  test("a place becomes a Visit once it has been focused for DWELL_MS", () => {
    const d = new Dwell();
    d.observe(e("t1"), 0);
    expect(d.due(DWELL_MS - 1)).toBeNull();
    expect(d.due(DWELL_MS).terminal).toBe("t1");
  });
  test("a place is reported only once", () => {
    const d = new Dwell();
    d.observe(e("t1"), 0);
    d.due(1000);
    expect(d.due(1500)).toBeNull();
  });
  test("passing through restarts the clock for the new place", () => {
    const d = new Dwell();
    d.observe(e("t1"), 0);
    d.observe(e("t2"), 500);
    expect(d.due(1200)).toBeNull();
    expect(d.due(1500).terminal).toBe("t2");
  });
  test("re-observing the same place keeps its clock", () => {
    const d = new Dwell();
    d.observe(e("t1"), 0);
    d.observe(e("t1"), 800);
    expect(d.due(1000).terminal).toBe("t1");
  });
  test("no place, no Visit", () => {
    const d = new Dwell();
    d.observe(null, 0);
    expect(d.due(5000)).toBeNull();
  });
  test("coming back to a place after leaving it counts again", () => {
    const d = new Dwell();
    d.observe(e("t1"), 0);
    d.due(1000);
    d.observe(e("t2"), 1100);
    d.observe(e("t1"), 1200);
    expect(d.due(2200).terminal).toBe("t1");
  });
});
