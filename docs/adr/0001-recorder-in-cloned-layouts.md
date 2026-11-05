# Record Visits from a hidden block in cloned layouts

Herdr's desktop app keeps no cross-Space focus history, and a mod only runs while a layout block hosts it, so the Recent list is recorded by a zero-size hidden block that must sit in every layout that should record. Herdr's shipped layouts (`main`, `terminals`, `win98`) are replaced on every start, so we clone `main` as `main-alt-tab` (daily layout) and add the block there and to the user's own layouts; `terminals` and `win98` stay unrecorded, and the Switcher still opens everywhere through `mod.open`.

## Consequences

- `main-alt-tab` no longer receives upstream changes to `main`; re-clone after Herdr updates that matter.
- Visits made while an unrecorded layout is shown are lost.
- An upstream request (app-level background mods or a focus-history API) is open; when it lands, drop the clone and the hidden block.
