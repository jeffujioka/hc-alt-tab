// Records Visits for hc-alt-tab and runs Quick toggle (cmd-f5 → "toggle").
// Lives in a zero-size layout block (a hidden block never starts): render() runs on every focus
// change and feeds the dwell; a gentle timer turns a held place into a Visit.
import { View, div } from "gpui-kit";
import { focused, nextCommand, run } from "herdr";
import { placeOf, previousPlace } from "./recent.js";
import { Dwell } from "./dwell.js";
import { offlineMachines, readList, writeVisit } from "./store.js";

function quickToggle() {
  const cur = placeOf(focused(), Date.now());
  if (cur) writeVisit(cur);
  const target = previousPlace(readList(), cur?.terminal ?? null, offlineMachines());
  if (!target) return;
  run("pane.focus", { terminal: target.terminal });
  writeVisit(target);
}

export default class Recorder extends View {
  init(_props, cx) {
    this.dwell = new Dwell();
    cx.timer.every(250, () => {
      const visit = this.dwell.due(Date.now());
      if (visit) writeVisit(visit);
    });
    // Touching cx each round lets a reload end this loop ("a loop ends at its next cx use"),
    // so an old build never toggles a second time.
    cx.spawn(async (cx) => {
      for (;;) {
        const command = await nextCommand();
        cx.notify();
        if (command === "toggle") quickToggle();
      }
    });
  }

  render() {
    const now = Date.now();
    this.dwell.observe(placeOf(focused(), now), now);
    return div();
  }
}
