// Reads and writes the stored Recent list through Herdr. All decisions live in ./recent.js.
import { agents, machines, panes, setShared, shared, spaces, terminals } from "herdr";
import { SHARED_KEY, machineOf, prune, recordVisit, sameTerminals, unreachableMachines } from "./recent.js";

/** Machines whose Terminals can't be listed right now (loading or unavailable). @returns {Set<string>} */
export function offlineMachines() {
  return unreachableMachines(machines());
}

/** @returns {import("./recent.js").Entry[]} */
export function readList() {
  const live = new Set(terminals().map((t) => t.address));
  return prune(shared(SHARED_KEY) ?? [], live, offlineMachines());
}

/** What a place looks like now, looked up live so renamed spaces and tabs read right. When its
 *  Machine is offline nothing can be looked up, and the label saved with the Visit stands in.
 *  @param {import("./recent.js").Entry} entry */
export function describePlace(entry) {
  const term = terminals().find((x) => x.address === entry.terminal);
  const pane = panes().find((p) => p.terminal === entry.terminal);
  const tabId = pane?.tab ?? entry.tab;
  const space = spaces().find((s) => s.tabs.some((tb) => tb.id === tabId)) ?? spaces().find((s) => s.id === entry.space);
  const tab = space?.tabs.find((tb) => tb.id === tabId);
  const agent = agents().find((a) => a.address === entry.terminal);
  const title = pane?.title || term?.name || term?.program?.name || null;
  // An unnamed tab is often called after its agent's title; don't print it twice.
  const parts = [space?.name, tab?.name, title === tab?.name ? null : title].filter(Boolean);
  return {
    program: term?.program ?? null,
    label: parts.length ? parts.join(" › ") : entry.label ?? entry.terminal,
    machine: machineOf(entry.terminal),
    status: agent?.status ?? null,
  };
}

/** Records a Visit. Writes only when the list actually changes: every write re-renders every mod.
 *  @param {import("./recent.js").Entry} entry */
export function writeVisit(entry) {
  const stored = shared(SHARED_KEY) ?? [];
  const next = recordVisit(readList(), { ...entry, at: Date.now(), label: describePlace(entry).label });
  if (!sameTerminals(next, stored)) setShared(SHARED_KEY, next);
}
