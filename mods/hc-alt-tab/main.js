// The Switcher: Alt-Tab over the Recent list. Opened by cmd-f4 (mod.open), which selects the
// previous place; cmd-f4 / cmd-shift-f4 while open arrive as "next" / "prev" (keys.json
// section mod:hc-alt-tab); releasing Cmd switches, Esc cancels, Enter or a click also switches.
import { View, div, image, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { agents, closeOverlay, focused, nextCommand, panes, props, run, spaces, terminals, theme } from "herdr";
import { initialSelection, isSelectable, machineOf, placeOf, stepSelection } from "./recent.js";
import { offlineMachines, readList, writeVisit } from "./store.js";

function icon(p, size, color) {
  if (!p?.icon) return null;
  return p.tint ? svg(p.icon).size(size).flex_none().text_color(color) : image(p.icon).w(size).h(size).flex_none();
}

export default class Switcher extends View {
  init(_props, cx) {
    const cur = placeOf(focused(), Date.now());
    if (cur) writeVisit(cur);
    this.current = cur?.terminal ?? null;
    this.offline = offlineMachines();
    this.rows = readList();
    this.sel = initialSelection(this.rows, this.current, this.offline);
    this.done = false;
    this.handle = cx.focus_handle();
    this.handle.focus();
    cx.spawn(async (cx) => {
      for (;;) {
        const command = await nextCommand();
        if (command === "next") this.sel = stepSelection(this.rows, this.sel, 1, this.offline);
        if (command === "prev") this.sel = stepSelection(this.rows, this.sel, -1, this.offline);
        cx.notify();
      }
    });
  }

  close() {
    this.done = true;
    closeOverlay(props().overlay);
  }

  commit() {
    if (this.done) return;
    const entry = this.rows[this.sel];
    if (entry && entry.terminal !== this.current && isSelectable(entry, this.offline)) {
      run("pane.focus", { terminal: entry.terminal });
      writeVisit(entry);
    }
    this.close();
  }

  // What a row shows, looked up live so renamed spaces and tabs read right.
  describe(entry) {
    const term = terminals().find((x) => x.address === entry.terminal);
    const pane = panes().find((p) => p.terminal === entry.terminal);
    const tabId = pane?.tab ?? entry.tab;
    const space = spaces().find((s) => s.tabs.some((tb) => tb.id === tabId)) ?? spaces().find((s) => s.id === entry.space);
    const tab = space?.tabs.find((tb) => tb.id === tabId);
    const agent = agents().find((a) => a.address === entry.terminal);
    const title = pane?.title || term?.name || term?.program?.name || entry.terminal;
    // An unnamed tab is often called after its agent's title; don't print it twice.
    const parts = [space?.name, tab?.name, title === tab?.name ? null : title];
    return {
      program: term?.program,
      label: parts.filter(Boolean).join(" › "),
      machine: machineOf(entry.terminal),
      status: agent?.status ?? null,
    };
  }

  render() {
    const t = theme();
    const row = (entry, i) => {
      const d = this.describe(entry);
      const selectable = isSelectable(entry, this.offline);
      return h_flex()
        .id(`hcat-${i}`)
        .h(40)
        .px(12)
        .gap(10)
        .items_center()
        .rounded(8)
        .when(i === this.sel, (el) => el.bg(t.selected))
        .when(!selectable, (el) => el.opacity(0.45))
        .when(selectable, (el) => el.cursor_pointer().on_click(() => { this.sel = i; this.commit(); }))
        .child(icon(d.program, 18, t.foreground) ?? div().size(18).flex_none())
        .child(div().flex_1().truncate().text_color(i === this.sel ? t.foreground : t.muted).child(d.label))
        .when(entry.terminal === this.current, (el) => el.child(div().flex_none().text_color(t.dim).child("•")))
        .when(Boolean(d.machine), (el) => el.child(div().flex_none().px(6).rounded(4).bg(t.raised).text_size(11).text_color(t.dim).child(d.machine)))
        .when(Boolean(d.status), (el) => el.child(div().size(7).flex_none().rounded(4).bg(t[d.status] ?? t.dim)));
    };
    const commitIfReleased = (e) => { if (!e.modifiers.platform) this.commit(); };
    return v_flex()
      .id("hc-alt-tab")
      .track_focus(this.handle)
      .on_modifiers_changed((e) => commitIfReleased(e))
      .on_key_down((e, cx) => {
        if (e.key === "escape") this.close();
        else if (e.key === "enter") this.commit();
        else commitIfReleased(e);
        cx.stop_propagation();
      })
      .on_key_up((e) => commitIfReleased(e))
      .size_full()
      .p(8)
      .gap(2)
      .bg(t.popover)
      .text_size(13)
      .when(this.rows.length === 0, (el) => el.child(div().p(12).text_color(t.dim).child("No recent places yet")))
      .children(this.rows.map(row));
  }
}
