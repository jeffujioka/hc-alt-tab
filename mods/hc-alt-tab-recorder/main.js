// Records Visits for hc-alt-tab. Lives in a zero-size layout block (a hidden block never starts):
// render() runs on every focus change and feeds the dwell; a gentle timer turns a held place into a Visit.
import { View, div } from "gpui-kit";
import { focused } from "herdr";
import { placeOf } from "./recent.js";
import { Dwell } from "./dwell.js";
import { writeVisit } from "./store.js";

export default class Recorder extends View {
  init(_props, cx) {
    this.dwell = new Dwell();
    cx.timer.every(250, () => {
      const visit = this.dwell.due(Date.now());
      if (visit) writeVisit(visit);
    });
  }

  render() {
    const now = Date.now();
    this.dwell.observe(placeOf(focused(), now), now);
    return div();
  }
}
