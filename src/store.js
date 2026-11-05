// Reads and writes the stored Recent list through Herdr. All decisions live in ./recent.js.
import { shared, setShared, terminals, machines } from "herdr";
import { SHARED_KEY, prune, recordVisit } from "./recent.js";

/** Machines whose layout can't be reached right now. @returns {Set<string>} */
export function offlineMachines() {
  return new Set(machines().filter((m) => m.name !== null && m.layout === "unavailable").map((m) => m.name));
}

/** @returns {import("./recent.js").Entry[]} */
export function readList() {
  const live = new Set(terminals().map((t) => t.address));
  return prune(shared(SHARED_KEY) ?? [], live, offlineMachines());
}

/** @param {import("./recent.js").Entry} entry */
export function writeVisit(entry) {
  setShared(SHARED_KEY, recordVisit(readList(), { ...entry, at: Date.now() }));
}
