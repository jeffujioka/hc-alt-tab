# hc-alt-tab: Alt-Tab for the Herdr desktop app

Date: 2026-11-05
Status: draft, awaiting approval
Glossary: [`GLOSSARY.md`](../../../GLOSSARY.md) · ADR: [`0001`](../../adr/0001-recorder-in-cloned-layouts.md)

## Intent

The user runs many coding agents across Spaces on three Machines (this computer, `bs`, `jeff-remote`) in the Herdr desktop app (`/Applications/Herdr.app`, mods under `~/.config/herdr-app`). Moving between the places they were just working takes several hops (sidebar clicks, F2/F3 through every agent, Space next/prev). They want the OS Alt-Tab/Cmd-Tab habit: hold a modifier, tap to walk back through recently visited places, release to land there; tap once to bounce between the last two.

Success: from any Pane in any Space on any Machine, `cmd-f4` tapped once returns to the previous place; held with repeated `f4`, it reaches any of the five most recent places; releasing Cmd lands there.

## Goals

- One Recent list of Entries across Spaces, Tabs, Panes and Agents on every Machine shown in the sidebar.
- Switcher with hold-to-cycle, commit on Cmd release (Alt-Tab semantics).
- Quick toggle to the previous Entry with no UI.
- Recent list survives app restarts and layout switches.

## Non-goals

- Herdr TUI (`herdr`, `~/.config/herdr`) support: separate program, separate server, does not share agents with the app.
- A full jump list or fuzzy search: `cmd-p` (`picker`) already covers that.
- Per-level lists (Spaces-only, Tabs-only): one flat list.
- Syncing the Recent list across screens or clients.
- Upstream changes to Herdr (deferred; see Validation).

## Anti-goals

- Breaking or permanently forking Herdr's shipped `main` layout behavior: the clone must look and act like `main` plus an invisible block.
- Polluting the Recent list with places merely passed through (F2/F3 stepping, `alt-hjkl`).
- Stealing keys programs in terminals need.
- Any visible artifact of the recording block (no pixels, no focus stop, no pane).

## Constraints (verified on this machine, Herdr app with herdr-core 0.9.5-era docs in `~/.config/herdr-app/AGENTS.md`, `herdr.d.ts`, `gpui-kit.d.ts`)

- Extensions are **mods**: `~/.config/herdr-app/mods/<name>/main.js` + `mod.json`, plain JS (no build step), default-exporting a `View` class; checked with `herdr-app check <dir>`. Saving reloads every copy in place.
- A mod copy runs only while a layout block hosts it (or as an overlay). It starts the first time it shows; another layout starts its mods fresh. `<mod>.<command>` key actions reach **shown copies only**.
- No focus event stream, no app-level background mods, no cross-Space focus history. `view.json`'s `recent` lists closed Spaces only. `render()` reruns whenever live data, including focus, changes; `focused()` returns `{space, tab, pane, terminal, shown, agent, cwd}`.
- Focus belongs to this screen only; ids of remote Machines carry a `<machine>/` prefix (`bs/t13`, `bs/sp…`).
- Herdr's shipped layouts (`main`, `terminals`, `win98`) and mods are read-only: edits are moved to `<name>-edited` on next start. Changes go into clones (`herdr-app do layout.clone`), which never receive upstream updates.
- Keyboard: `keys.json` sections `global`, `layout:<name>`, `terminal`, `mod:<name>` (more specific wins). Mod key handlers: `on_key_down`, `on_key_up`, `on_modifiers_changed` on the keyboard-focus path (focus handle + `.track_focus`).
- Overlays: `openOverlay({mod, props, kind: "dialog" | "popup" | "window", modal, width, height})`; Esc closes the top dialog/popup; `mod.open {name}` opens a mod's overlay per its `mod.json` and toggles it closed when repeated.
- Persistence: `shared(key)` / `setShared(key, value)`, persisted, latest write wins.
- Switching commands: `pane.focus {pane | terminal}` (prefers the first visible layout terminal block showing that address, then its model pane), `space.select {id}`, `tab.select {id}`.
- User's existing `keys.json` is already customized (so new defaults never auto-merge); `cmd-f4`, `cmd-shift-f4`, `cmd-f5` are free; `f2`/`f3` are bound directly, so standard function keys are assumed enabled in macOS.
- User's layouts: `main` (shipped, in use today), `terminals`, `win98` (shipped), `my-layout` (a clone of `main` 0.1.12), `mission-control`, `mission-control-classic` (user-owned).

## Approaches considered

1. **TUI plugin** (`herdr-plugin.toml`, socket `pane.focused`/`tab.focused`/`workspace.focused` events). Rejected: wrong program; the user runs the desktop app, which is built on herdr-core and does not share state with the TUI.
2. **Desktop mod, recorder in user-owned layouts only.** Recording would miss `main`, the layout in daily use. Rejected.
3. **Desktop mod, recorder in a clone of `main` plus user-owned layouts** (chosen). Daily layout becomes `main-alt-tab`; costs upstream updates to `main` (ADR 0001). Combined with a later upstream request for app-level background mods or a focus-history API, after which the clone and hidden block go away.
4. **Reconstruct recency from existing data** (`AgentInfo.seq`, `TabInfo.changed_at`, `view.json` per-tab pane history). Rejected: those track agent state changes and per-tab pane order, not cross-Space visits.

Interaction: hold-to-cycle with commit on Cmd release (chosen), with Enter-to-commit as the fallback only if validation shows Cmd release does not reach the overlay. A horizontal icon strip was rejected: many Entries share the same agent icon (omp).

## Design (decided with the user)

### Terms

As in `GLOSSARY.md`: Machine, Space, Tab, Pane, Terminal, Agent, Visit, Entry, Recent list, Switcher, Quick toggle.

### Recording Visits

- A mod copy in a zero-size, hidden block records Visits. It lives in `main-alt-tab` (clone of `main`, becomes the daily layout), `my-layout`, `mission-control`, `mission-control-classic`. `terminals` and `win98` are not recorded.
- A Visit is focus that stays on the same place for **1 second**. Focus that moves on sooner is not a Visit.
- A switch made by the Switcher or Quick toggle is a Visit immediately, with no dwell, in any layout: the Switcher writes it to the stored list itself. *(Author's call.)*
- Pressing `cmd-f4` or `cmd-f5` first records the current place as a Visit immediately, so a press within the dwell window still knows where you came from. *(Author's call.)*
- An Entry is keyed by the focused Terminal address (`t13`, `bs/t13`). Places without a Terminal (mod panes, nothing focused) are not Entries. *(Plan review: the Pane-id fallback was dropped; every non-mod Pane has a Terminal, so it could never apply.)*
- The Recent list holds the **5** most recent Entries, newest first, all Machines together, stored via `shared()` so it survives restarts and layout switches.
- An Entry whose Terminal has ended or whose Pane has closed drops out; the list may then hold fewer than 5 until new Visits fill it.
- An Entry on a Machine whose layout is unavailable (offline) stays in the list.
- While an unrecorded layout is shown, passive Visits are lost; only Switcher switches are recorded there.

### Switcher

- Opens from any layout (bound as an app-level overlay, like `cmd-p` → `picker`), so it works even where Visits are not recorded.
- Centered dialog, 5 vertical rows max. Each row: program icon, `space › tab › title`, a machine tag for remote Entries, the agent status dot when the Entry is an Agent. The current Entry is marked. Offline Entries are dimmed and not selectable. Colors come from `theme()`.
- Keys while Cmd is held:

| Key | Effect |
|---|---|
| `cmd-f4` | Open, selecting the previous place: the newest Entry that is not the current place *(author's call)* |
| `f4` again (Cmd still held) | Select next row (wraps) |
| `cmd-shift-f4` | Select previous row (wraps) |
| release Cmd | Switch to the selected Entry and close |
| `esc` | Close without switching |

- Switching to an Entry brings its Space, Tab and Pane forward, on whichever Machine it lives.
- With no previous place, `cmd-f4` opens the Switcher showing what there is; release does nothing harmful (switching to the current Entry is a no-op). *(Author's call.)*

### Quick toggle

- `cmd-f5`: switch to the previous place (newest Entry that is not the current place) immediately, no UI. Repeating bounces between the two most recent places. With no previous place, nothing happens. *(Author's call.)*
- In layouts without the recorder (`terminals`, `win98`), `cmd-f5` does nothing. *(User's decision: avoids a hidden overlay that could flash.)*

### Packaging

- Project: `~/projects/jeffujioka/hc-alt-tab` (git), copied (synced) into `~/.config/herdr-app/mods/`, since a symlinked mod does not hot-reload. One mod named `hc-alt-tab`, or two mods if the recorder and the Switcher need different `mod.json` placement (builder's call).
- `keys.json` gains the `cmd-f4`, `cmd-shift-f4`, `cmd-f5` bindings (and any `mod:<name>` section the Switcher needs); existing bindings stay untouched.
- Layout changes: create `main-alt-tab` via `layout.clone` from `main`, then add the zero-size recording block (`"size": {"px": 0}`, not `"hidden"`) to it and to the user-owned layouts listed above; switch the daily layout to `main-alt-tab`.
- Install/uninstall must be reversible: document the exact `keys.json` and layout edits so they can be undone.

## Validation first (gate before building the rest)

The user wants proof the project works before anything else, including the upstream issue. A throwaway spike must answer:

1. **Hot reload through a symlink**: does saving a file in the symlinked project reload the mod? If not, use a copy/sync script instead of a symlink.
2. **Cross-Space, cross-Machine switching**: does `pane.focus {terminal}` (or `space.select` + `tab.select` + `pane.focus`) land on an Entry in another Space, including a remote one like `bs/t13`?
3. **Recorder residency**: does a hidden zero-size block in a cloned layout stay alive and see every focus change, including changes made from the sidebar, F2/F3 and remote Spaces?
4. **Hold-to-cycle**: does the Switcher overlay take keyboard focus on open, receive further `f4` / `cmd-shift-f4` while Cmd is held (rather than the global binding re-toggling it), and get `on_modifiers_changed` when Cmd is released?

Outcomes:
- 1 fails: copy script, continue.
- 4 fails: fall back to Enter to commit, arrows/`f4` to move; continue.
- 2 partly works (local Spaces switch, remote ones like `bs/t13` do not): continue; remote Entries still show and are switched to by hand until fixed upstream. *(User's decision.)*
- 3 partly works (block stays alive but does not re-render on focus changes): continue, reading `focused()` on a cheap timer (~250 ms) that never redraws. *(User's decision.)*
- Stop and report only if the recorder cannot observe focus at all, or no switching works; that evidence drives the upstream issue to `herdrdev/herdr-app`.

Upstream issue (app-level background mods or a focus-history API): only after validation, drafted for the user's approval, never posted without it.

### Results (spike run 2026-11-05, throwaway mod, config restored afterwards)

All four checks passed; the project is viable.

| # | Check | Result |
|---|---|---|
| 1 | Hot reload through a symlink | **Fails**: edits through a symlinked mod folder are not picked up. A real copy reloads on save. Use a copy/sync step (`rsync` into `~/.config/herdr-app/mods/`). |
| 2 | Cross-Space, cross-Machine switching | **Passes**: `herdr-app do pane.focus {terminal}` alone brought forward Space, an inactive Tab and the Pane, for local (`t1b`, `t5`) and remote (`bs/t19`) Terminals. |
| 3 | Recorder residency | **Passes with a change**: a block with `"hidden": true` never starts (a copy starts the first time it shows). A visible block with `"size": {"px": 0}` starts at layout switch and its `render()` sees every focus change, local and remote; nothing showed on screen. Use the zero-size visible block, not `hidden`. |
| 4 | Hold-to-cycle | **Passes**: the dialog overlay takes keyboard focus. A `mod:<name>` section in `keys.json` routes the repeated `cmd-f4` / `cmd-shift-f4` to the overlay's `nextCommand()` (without it the global `mod.open` toggles the overlay closed). `on_modifiers_changed` reports `platform: false` on Cmd release. Commands reached only the overlay copy, not the layout copy of the same mod. Keys were synthesized with System Events; a hands-on check with real keys remains. |

## Left to the builder

- Whether the recorder and the Switcher are one mod or two, and how the global key reaches the right copy.
- How the dwell timer is implemented: `cx.timer` is allowed for the dwell check and, if needed, the ~250 ms focus poll, but must not call `cx.notify()` / redraw unless the mod's own view changes.
- Exact visual sizing and spacing of the dialog within the stated row contents.
- The `shared()` key name and stored shape.
- The exact JSON of the zero-size recording block in each layout (it must not be `hidden`, see Results).
