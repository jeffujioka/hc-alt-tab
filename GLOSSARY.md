# hc-alt-tab

An Alt-Tab-style switcher for the Herdr desktop app: jump between the places you were recently working, across every machine in the sidebar.

## Herdr world

**Machine**:
A computer whose herdr-core holds Spaces: this computer, or one added with `hc machine add` (e.g. `bs`, `jeff-remote`).
_Avoid_: Host, remote, session

**Space**:
A place to work on one Machine, usually one repo; owns Tabs.
_Avoid_: Workspace, project

**Tab**:
A piece of work inside a Space, made of Panes split right and down.
_Avoid_: Window

**Pane**:
One spot on screen inside a Tab, showing a Terminal or a mod.
_Avoid_: Split, view

**Terminal**:
A program running in herdr-core, identified by its address (e.g. `t13`, `bs/t13`); outlives the Pane that shows it.
_Avoid_: Shell, process, session

**Agent**:
A Terminal whose program reports a status (working, blocked, done, idle).
_Avoid_: Bot, assistant

## Switching

**Visit**:
The moment a Terminal (or, lacking one, a Pane) gains focus on this screen.
_Avoid_: Access, use

**Entry**:
One switchable place in the Recent list, identified by its Terminal address, falling back to its Pane.
_Avoid_: Item, target

**Recent list**:
The five most recently visited live Entries, newest first, spanning every Machine.
_Avoid_: History, MRU stack

**Switcher**:
The overlay that walks the Recent list while Cmd is held and switches to the selected Entry when Cmd is released.
_Avoid_: Picker, palette

**Quick toggle**:
An instant switch to the second Entry in the Recent list, without showing the Switcher.
_Avoid_: Last pane, back
