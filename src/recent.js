// The Recent list: which places count, their order, and which one is "previous".
// Pure: no herdr imports, so it runs under `bun test` and inside both mods.

/** @typedef {{ terminal: string, space: string, tab: string, pane: string | null, at: number }} Entry */

export const MAX_ENTRIES = 5;
export const SHARED_KEY = "hc-alt-tab.recent";

/** @param {string} address @returns {string | null} */
export function machineOf(address) {
  const slash = address.indexOf("/");
  return slash < 0 ? null : address.slice(0, slash);
}

/** @param {{ space: string, tab: string, pane: string | null, terminal: string | null } | null} focused
 *  @param {number} now @returns {Entry | null} */
export function placeOf(focused, now) {
  if (!focused || !focused.terminal) return null;
  return { terminal: focused.terminal, space: focused.space, tab: focused.tab, pane: focused.pane, at: now };
}

/** @param {Entry[]} list @param {Entry} entry @returns {Entry[]} */
export function recordVisit(list, entry) {
  return [entry, ...list.filter((x) => x.terminal !== entry.terminal)].slice(0, MAX_ENTRIES);
}

/** @param {Entry[]} list @param {Set<string>} live @param {Set<string>} offline @returns {Entry[]} */
export function prune(list, live, offline) {
  return list.filter((x) => live.has(x.terminal) || offline.has(machineOf(x.terminal)));
}

/** @param {Entry} entry @param {Set<string>} offline */
export function isSelectable(entry, offline) {
  return !offline.has(machineOf(entry.terminal));
}

/** @param {Entry[]} list @param {string | null} currentTerminal @param {Set<string>} offline @returns {Entry | null} */
export function previousPlace(list, currentTerminal, offline) {
  return list.find((x) => x.terminal !== currentTerminal && isSelectable(x, offline)) ?? null;
}

/** Row the Switcher opens on: the previous place, else the current place, else the first row.
 *  @param {Entry[]} rows @param {string | null} currentTerminal @param {Set<string>} offline @returns {number} */
export function initialSelection(rows, currentTerminal, offline) {
  const prev = previousPlace(rows, currentTerminal, offline);
  if (prev) return rows.indexOf(prev);
  return Math.max(0, rows.findIndex((x) => x.terminal === currentTerminal));
}

/** Next (dir 1) or previous (dir -1) selectable row, wrapping; stays put when there is none.
 *  @param {Entry[]} rows @param {number} sel @param {1 | -1} dir @param {Set<string>} offline @returns {number} */
export function stepSelection(rows, sel, dir, offline) {
  for (let i = 1; i < rows.length; i++) {
    const at = (((sel + dir * i) % rows.length) + rows.length) % rows.length;
    if (isSelectable(rows[at], offline)) return at;
  }
  return sel;
}
