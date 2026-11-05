# hc-alt-tab

Alt-Tab for the [Herdr](https://herdr.dev) desktop app: jump back to the places you were just working — any Space, Tab or Agent, on this computer or on another Machine — with `cmd-f4`, the way Cmd-Tab switches apps.

Terms (Visit, Entry, Recent list, Switcher, Quick toggle) are defined in [`GLOSSARY.md`](GLOSSARY.md); the design is in [`docs/superpowers/specs/2026-11-05-hc-alt-tab-design.md`](docs/superpowers/specs/2026-11-05-hc-alt-tab-design.md).

## Keys

| Keys | What happens |
|---|---|
| `cmd-f4` (tap) | Go back to the previous place |
| hold Cmd, `f4` again | Open the Switcher and walk down the five most recent places |
| `cmd-shift-f4` (Switcher open) | Walk up |
| release Cmd | Go to the selected place |
| `enter` / click a row | Go to it |
| `esc` | Close without switching |
| `cmd-f5` | Quick toggle: bounce between the last two places, no UI |

A place counts as visited once it stays focused for 1 second, so stepping through agents with F2/F3 doesn't fill the list. Places on a Machine that is offline stay listed, dimmed, and can't be picked.

On Mac keyboards where F-keys control brightness and volume, either turn on *System Settings → Keyboard → Use F1, F2, etc. keys as standard function keys* or hold `fn`.

## Install

Needs [Bun](https://bun.sh) and the Herdr app running.

```sh
bun scripts/install.js
```

This:
- copies `mods/hc-alt-tab` (the Switcher) and `mods/hc-alt-tab-recorder` into `~/.config/herdr-app/mods/` (`HERDR_APP_HOME` overrides the folder);
- clones Herdr's `main` layout as `main-alt-tab` and switches to it;
- adds a zero-size recording block to `main-alt-tab`, `my-layout`, `mission-control` and `mission-control-classic` (whichever exist);
- adds the key bindings to `keys.json`, leaving any key you already use for something else alone (it prints those).

It backs up `keys.json` and the layouts it touches to `<file>.hc-alt-tab.bak` the first time, and is safe to run again.

## Uninstall

```sh
bun scripts/uninstall.js          # keeps layouts/main-alt-tab.json
bun scripts/uninstall.js --purge  # deletes it too
```

Switches back to `main`, removes the bindings and recording blocks, and deletes both mods.

## Limits

- Visits are recorded only in layouts that hold the recording block. Herdr's own `main`, `terminals` and `win98` layouts are replaced on every start, so they can't hold it; that's why install clones `main` ([ADR 0001](docs/adr/0001-recorder-in-cloned-layouts.md)). The Switcher still opens everywhere; `cmd-f5` does nothing in unrecorded layouts.
- `main-alt-tab` is a copy: it won't pick up Herdr's later changes to `main`. Re-clone (`uninstall --purge`, then install) after a Herdr update you want.
- The Recent list is per screen and is not shared between Herdr clients.

## Development

```sh
bun test           # list, dwell, selection and installer logic
sh scripts/sync.sh # copy mods into Herdr (hot-reloads) and run `herdr-app check` on each
```

Herdr does not hot-reload symlinked mods, so edit here and run `scripts/sync.sh`. All decisions about the list live in `src/recent.js` and `src/dwell.js` (pure, tested); `src/store.js` only reads and writes the list through Herdr. `sync.sh` copies those three files into each mod folder.
