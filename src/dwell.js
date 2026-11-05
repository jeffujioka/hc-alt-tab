// Turns a stream of focused places into Visits: a place counts once it stays focused for DWELL_MS.
// Pure: no herdr imports.

export const DWELL_MS = 1000;

export class Dwell {
  constructor() {
    this.entry = null;
    this.since = 0;
    this.reported = false;
  }

  /** @param {import("./recent.js").Entry | null} entry @param {number} now */
  observe(entry, now) {
    if (entry?.terminal === this.entry?.terminal) return;
    this.entry = entry;
    this.since = now;
    this.reported = false;
  }

  /** @param {number} now @returns {import("./recent.js").Entry | null} */
  due(now) {
    if (!this.entry || this.reported || now - this.since < DWELL_MS) return null;
    this.reported = true;
    return this.entry;
  }
}
