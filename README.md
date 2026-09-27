# Terminal Game

A single-player desktop game. Players type commands into a fake terminal to
move around a mock file system, read files, and launch mini games.

- **App shell:** Electron (a desktop window, no browser needed)
- **UI:** React, built with Vite
- **Game logic:** plain JavaScript in `src/game/`, running inside the app (no
  server)

> This README is kept up to date with every code change.

---

## Getting the code

Repository: `git@github.com:evac3/terminal_game_jam.git` (branch `main`).

```sh
git clone git@github.com:evac3/terminal_game_jam.git
cd terminal_game_jam
npm install        # first time, and whenever package.json changes
```

`node_modules/`, `dist/` and `release/` aren't in git. `npm install` and the
build commands recreate them.

## Running it

```sh
cd ~/gamejam-2026
npm run dev
```

This opens the game in a desktop window. When you save a file, the window
updates by itself: UI changes keep the game state, and game-logic changes may
reload the window. Close the window (or press Ctrl+C in the terminal) to stop.

| Command | What it does |
|---|---|
| `npm run dev` | Develop in the Electron window with live reload |
| `npm run dev:web` | Same UI in a normal browser at http://localhost:3000 (handy for browser devtools) |
| `npm run build` | Builds the UI into `dist/` |
| `npm start` | Builds, then runs the built app in Electron (what players will get) |
| `npm run package` | Builds a double-clickable installer into `release/` (`.dmg` on Mac, `.exe` on Windows, `.AppImage` on Linux) |

### Packaging notes
- The Mac app is **not code-signed** (`"identity": null` in `package.json`),
  so there are no keychain password prompts. On other Macs, first launch needs
  right-click → **Open**, because macOS warns about unsigned apps. Signing
  needs an Apple Developer ID certificate and can be set up later.
- `release/` and `dist/` are build output and are listed in `.gitignore`.
- The app uses the default Electron icon until an icon is added.

---

## Player commands

| Command | Usage | What it does |
|---|---|---|
| `help` | `help` | Shows the guide: every command with its usage, plus path and tips |
| `ls` | `ls [-a] [path]` | Lists a folder. Folders end in `/`. `-a` also shows hidden files (names starting with `.`) |
| `cd` | `cd [path]` | Changes folder. With no path, goes home. Supports `~`, `..` and `/` paths |
| `view` | `view <file>` | Shows a file's contents |
| `run` | `run <file>` | Opens a program file's mini game in a separate window. Only files created with `program()` can be run |
| `clear` (or `cls`) | `clear` | Clears the screen |

Paths: `~` is the home folder (`/home/guest`), `..` is the folder above, and a
path starting with `/` starts from the top.

## Keys

| Key | What it does |
|---|---|
| `1` | Opens the speaker (NPC) screen to reread every earlier NPC message, and pressing it again switches back. Works during dialogue too. It's skipped while the command line has text (so `1` can be typed inside a command), and when the dialogue is waiting for that key itself (`input [key:1]`, `input [any]`, or a keyword starting with `1`) |
| ↑ / ↓ | Moves through earlier commands |

## Mock file system

```
/home/guest/2048.exe          program → opens the 2048 mini game
/home/guest/readme.txt
/home/guest/notes/todo.txt
/home/admin/backup.tar
/home/admin/.secret           hidden (ls -a)
/etc/hostname
/etc/motd
/var/log/auth.log
/tmp/
```

---

## How it works

1. The player types a line and presses Enter (`Terminal.jsx`).
2. `useTerminal` shows the typed line on screen, then calls `execute()` in
   `src/game/engine.js`.
3. `execute` splits the line into a command and arguments, finds the command
   file, and runs it with the player's `session`.
4. The command returns text to print. It can also call
   `terminal.clear()` or `terminal.launch(gameId)`.
5. `launch` opens the app again in a new window at `?game=<id>`, and
   `main.jsx` shows that mini game instead of the terminal.

### Screens (switching inside the main window)

The main window shows either the terminal or a **screen**, such as the
NPC dialogue screen. Switching happens in the same window. The terminal stays loaded
(just hidden) while a screen is up, so its log, input and game state are kept.

Switch from anywhere with these functions:
- **React components:** `const { showScreen, showTerminal, toggleScreen } = useScreen();`
- **Commands:** `terminal.showScreen('npc', data)`
- **Key presses:** add an entry to `SCREEN_HOTKEYS` in
  `src/screens/useScreenHotkeys.js`

Triggers planned for later (a certain input, a game event) should call one of
these.

Game state lives in memory in the React hook. Closing the app (or reloading
the window) starts a new game.

### Dialogue (plot scripts)

Story dialogue is written in `.txt` files in `src/dialogue/scripts/`. A
script is a list of lines to print, with pauses that wait for the player:

```
main: [incoming connection]      ← printed in the terminal
input [enter]                    ← wait for the Enter key
npc: Hello? Is someone there?    ← printed on the NPC screen
npc: Type "ready" when you are.
input [ready | yes | y]          ← wait for one of these typed keywords
```

| Line | Meaning |
|---|---|
| `main: <text>` | Print in the main terminal window (the view switches to the terminal) |
| `npc: <text>` | Print on the NPC dialogue screen (the view switches to the NPC screen) |
| `input [enter]` | Wait for a key press. Key names: `enter`, `space`, `tab`, `esc`, `backspace`, `up`, `down`, `left`, `right` |
| `input [any]` | Wait for any key press |
| `input [key:y]` | Wait for one specific key |
| `input [yes]` | Wait for a typed keyword + Enter. Not case-sensitive, and extra spaces are ignored |
| `input [yes \| y]` | Several accepted answers, separated by `\|` (keys and keywords can be mixed) |
| `input ["enter"]` | Quotes force a keyword (the word "enter", not the Enter key) |
| `# ...` | Comment. Blank lines are ignored too |

`src/dialogue/scripts/intro.txt` is the full example, and it plays when the
game opens.

Where the player types:
- **Key presses** count on any screen.
- **Keywords** can be typed in the terminal or on the NPC screen, which shows
  a `>` input line whenever a keyword is expected.
  - In the terminal, a keyword that is also a real command (like `ls`) runs
    as a command too. Otherwise it's only an answer, so there's no
    "command not found".
  - Wrong answers are shown on the NPC screen but don't advance the
    dialogue.

Starting a dialogue:
- **React:** `useDialogue().startDialogue('<name>')`
- **Commands:** `terminal.startDialogue('<name>')`
- **Game opening:** `OPENING_DIALOGUE` in `src/App.jsx`

Script errors (like an unknown tag) print as a `[dialogue error]` line in the
terminal, with the line number.

---

## Files

```
package.json            scripts, dependencies, packaging settings ("build")
index.html              page shell
vite.config.js          Vite settings
electron/main.js        Electron: creates the windows
scripts/dev.js          `npm run dev`: starts Vite + Electron together
src/main.jsx            entry: shows the main window (App) or a mini game
src/App.jsx             main window: the terminal and the active screen
src/hooks/useTerminal.js
src/components/Terminal.jsx, Terminal.css
src/screens/            screens that switch in over the terminal (NPC dialogue...)
src/dialogue/           dialogue scripts: parser, runner, React connection
  scripts/*.txt         the plot scripts themselves
src/game/               game logic (no React)
  engine.js, parser.js, session.js, fileSystem.js
  commands/             one file per command
src/games/              mini games (React)
```

### `package.json`
- `"type": "module"`: all JS files use `import`/`export`.
- `"main": "electron/main.js"`: where Electron starts.
- `"build"`: electron-builder settings. These cover the app id, product name,
  which files go into the app (`dist/` and `electron/`), the output folder
  (`release/`), the installer type per OS, and `mac.identity: null` (no
  signing).
- Everything is a devDependency, because Vite bundles React into `dist/`, so
  the packaged app doesn't need `node_modules`.

### `index.html`
The page shell (black background, no margin) that loads `src/main.jsx`.

### `vite.config.js`
React plugin. `base: './'` makes the built files load from disk inside
Electron. The dev server prefers port 3000 and picks the next free port if
3000 is taken.

### `electron/main.js`: the app's windows
- `DEV_SERVER_URL`: set by `scripts/dev.js` during development. If it's set,
  the app loads the Vite dev server. If not, it loads `dist/index.html`.
- `COLORS.background`: window background (matches the terminal).
- `isAppUrl(url)`: true only for the app's own pages.
- `createMainWindow()`: the 960×640 terminal window.
  - `setWindowOpenHandler`: lets the page open mini game windows (480×640, no
    menu bar) and blocks any other URL.
  - Closing the terminal window quits the app, and any game windows with it.

### `scripts/dev.js`: `npm run dev`
Starts the Vite dev server, then runs Electron pointed at it through
`VITE_DEV_SERVER_URL`. When Electron exits, it stops Vite. Ctrl+C closes
Electron.

### `src/main.jsx`: entry point
Reads `?game=<id>` from the URL. If it's there, shows that game from
`src/games` (or "Unknown game"). If not, shows `<App />`.

### `src/App.jsx`: the main window
- `OPENING_DIALOGUE` (`'intro'`): the script played when the game opens.
  Set it to `null` for none.
- `App`: wraps everything in `ScreenProvider`, then `DialogueProvider`.
- `MainWindow`:
  - Turns on the screen hotkeys (`useScreenHotkeys`). A key is skipped when
    the dialogue is waiting for that key (`claimsKey`).
  - Starts `OPENING_DIALOGUE` once. `startedRef` stops React dev mode from
    starting it twice.
  - Always renders `<Terminal active={...} />`, with `active` false while a
    screen is up, and puts the current screen on top as
    `<Screen data close />`.

### `src/hooks/useTerminal.js`: connects the UI to the game logic
- `formatPrompt({ user, host, cwd })`: gives `guest@mainframe:~$`.
- `openGameWindow(gameId)`: runs `window.open('?game=<id>', 'minigame-<id>')`.
  Running the same game again reuses its window.
- `useTerminal()`:
  - Must be used inside `ScreenProvider` and `DialogueProvider`.
  - Creates the `session` once and keeps it in a ref.
  - `lines` starts with the MOTD. Each line is
    `{ id, kind: 'input' | 'output' | 'system' | 'dialogue', text }`.
  - Subscribes to the dialogue's `main:` lines (`onMainPrint`) and adds them
    to `lines`.
  - `prompt` is refreshed after every command.
  - `runCommand(raw)`: builds the `terminal` object (`clear`, `launch`,
    `showScreen`, `startDialogue`), runs `execute`, then adds the output and
    updates the prompt.
  - `sendCommand(raw)`: shows the typed line. If the dialogue is waiting for
    this keyword, it runs the command only if it's a real command, then gives
    the answer to the dialogue. Otherwise it runs the command normally.
  - Returns `{ lines, prompt, sendCommand }`.

### `src/components/Terminal.jsx`: the terminal on screen
- Prop `active` (default true): when false, the terminal is `hidden` but
  stays loaded. When it becomes true again, it scrolls to the bottom and
  focuses the input.
- Draws the log lines and the input row with the prompt.
- `handleKeyDown`: Enter submits. The up and down arrows move through command
  history.
- Scrolls to the newest line automatically, and clicking anywhere focuses the
  input.

### `src/components/Terminal.css`
Green-on-black terminal style. Line classes: `.terminal-line--input`,
`--output`, `--system` (yellow warnings) and `--dialogue` (light blue
`main:` script lines).

### `src/game/engine.js`
- `MAX_COMMAND_LENGTH` (1000): longer input is cut off.
- `isCommand(raw)`: true if the line starts with a real command name.
- `execute(raw, { session, terminal })`: parses the line, saves it to
  `session.history` (last 500 kept), finds the command and runs it. Returns
  the output text, `<cmd>: command not found`, or `<cmd>: internal error` if
  the command throws (the error is logged to the console).

### `src/game/session.js`: player state
- `MOTD`: the welcome text shown at start.
- `createSession()`: returns `{ user, host, home, cwd, fs, history }`.
  **Add new player data here** (inventory, flags, progress...).
- `getPrompt(session)`: returns `{ user, host, cwd }` for the prompt, with
  home shown as `~`.

### `src/game/fileSystem.js`: mock file system
- Node shapes: `{ type: 'dir', children }` and
  `{ type: 'file', content, game? }`.
- `dir(children)`: makes a folder.
- `file(content, extra)`: makes a file. `extra` adds more fields.
- `program(gameId, content)`: makes a runnable file. `run` launches mini game
  `gameId`, which must be a key in `src/games/index.js`.
- `TEMPLATE`: the starting file tree. **Add or change game files here.**
- `createFileSystem()`: returns a fresh copy of `TEMPLATE`.
- `resolvePath(cwd, target, home)`: turns `~`, `..`, relative and absolute
  paths into a clean absolute path.
- `getNode(root, absPath)`: returns the file or folder at a path, or `null`.
- `displayPath(absPath, home)`: shows the home folder as `~`.

### `src/game/parser.js`
- `parse(input)`: splits a line into `{ command, args }`. Handles single
  quotes, double quotes and backslash escapes:
  `view "my file.txt"` gives `args: ['my file.txt']`.

### `src/game/commands/index.js`: command registry
- Loads every other `.js` file in this folder automatically, using Vite's
  `import.meta.glob`. Throws if a file is missing `name` or `run`, or if a
  name or alias is used twice.
- `get(name)`: finds a command by name or alias.
- `list()`: returns all commands in file-name order (used by `help`).

### `src/game/commands/*.js`: one file per command
Each file is `export default { name, aliases?, description, usage, run(ctx) }`.
`ctx` is `{ args, session, terminal, commands }`, where `terminal` is
`{ clear(), launch(gameId), showScreen(screenId, data?), startDialogue(name) }`.
`run` returns the text to show, or nothing, and can be `async`.

| File | Notes |
|---|---|
| `help.js` | Builds the guide from every command's `usage` and `description`, then adds the Paths, Keys (`1` = reread messages) and Tips sections |
| `ls.js` | `-a` shows hidden files, and a path argument is optional. Listing a file prints its name |
| `cd.js` | Default target is `~`. Errors for missing paths and for files |
| `view.js` | One file argument. Errors for a missing argument, a missing file or a folder |
| `run.js` | One file argument. Checks the file exists, isn't a folder and has `game`, then calls `terminal.launch(game)` |
| `clear.js` | Alias `cls`. Calls `terminal.clear()` |

### `src/screens/ScreenContext.jsx`: screen switching
- `ScreenProvider`: holds `current`, which is `null` for the terminal or
  `{ id, data }` for a screen.
- `useScreen()`: returns `{ current, showScreen, showTerminal, toggleScreen }`.
  - `showScreen(id, data = {})`: switches to that screen. Unknown ids are
    ignored with a console warning.
  - `showTerminal()`: goes back to the terminal.
  - `toggleScreen(id, data)`: shows that screen, or goes back to the
    terminal if it's already open.

### `src/screens/index.js`: screen registry
`screens` maps a screen id to a React component. Each screen gets props
`{ data, close }`: `data` is what was passed to `showScreen`, and `close()`
returns to the terminal.

### `src/screens/useScreenHotkeys.js`: key presses that switch screens
- `SCREEN_HOTKEYS`: maps a key to a screen id (currently `1 → 'npc'`).
- `useScreenHotkeys(bindings, isKeyClaimed)`: listens for keys on the whole
  window (capture phase), and each bound key calls `toggleScreen`.
  `isKeyClaimed(key)` returning true skips the hotkey for that press. `App`
  passes the dialogue's `claimsKey`.
- It skips held-down keys (`e.repeat`), Ctrl/Cmd/Alt combos, and presses
  while the terminal input has text. It stops the key from also being typed.

### `src/screens/NpcScreen.jsx`: NPC dialogue screen (screen id `npc`)
- Shows `npcLines` from `useDialogue()`, the whole message history, so the
  player can press 1 to reread it. NPC lines are light blue, the player's
  replies show as `> text`, and each conversation is separated by a dashed
  line. Shows "No messages yet." before anything has been said.
- A fixed `[1] back to terminal` hint sits in the bottom-right corner.
- When a keyword is expected, shows a `>` input line and focuses it. Enter
  calls `reply(text)`.
- When only a key is expected, shows a blinking hint like `[ press Enter ]`.
- Keeps the newest line in view.

### `src/screens/NpcScreen.css`
A centered text column (max 640px wide) anchored to the bottom, in the same
green-on-black style. Line classes: `.npc-line--npc`, `--player` and
`--empty`. `.npc-divider` is the dashed line between conversations,
`.npc-footer` is the corner hint, and `.npc-hint` blinks.

### `src/dialogue/parser.js`: script text → steps
- `parseScript(source)`: returns a list of steps and throws `ScriptError` (with
  `.line`) on a bad line. Steps are:
  - `{ type: 'say', target: 'main' | 'npc', text, line }`
  - `{ type: 'input', options, line }`, where each option is
    `{ kind: 'key', key, label }` or `{ kind: 'text', word, label }`
- `TAGS`: maps a tag name to a function that builds its step. **Add new
  script tags here.** A line is `<tag>: rest`, and the colon is optional.
- `KEY_NAMES`: maps script key names to `KeyboardEvent.key` values (`any` →
  `'*'`).
- `parseOption(raw, line)`: reads one input target. Checks, in order: a
  `"quoted"` keyword, `key:x`, a known key name, and otherwise a keyword.
- `ScriptError`: an error whose message starts with `line N:`.

### `src/dialogue/runner.js`: plays the steps
- `matchesOption(option, input)`: checks `{ key }` or `{ text }` against one
  option. Single-letter keys and keywords are not case-sensitive.
- `DialogueRunner(steps, { say, wait, end })`:
  - `start()`: runs from the first step.
  - `#advance()`: calls `say` for each `say` step until it reaches an `input`
    step (then calls `wait(options)`) or the end (then calls `end()`).
  - `waitingFor`: the current input options, or `null`.
  - `index`: the current step.
  - `accepts(input)`: checks whether `input` matches, without advancing.
  - `submit(input, atStep?)`: continues if `input` matches. It returns true
    or false. `atStep` makes it only continue if still at that step.

### `src/dialogue/DialogueContext.jsx`: connects dialogue to the UI
- `DialogueProvider` (must be inside `ScreenProvider`).
- `useDialogue()` returns:
  - `startDialogue(name)`: parses `scripts/<name>.txt` and plays it. Returns
    false and prints a `[dialogue error]` line in the terminal if the script
    is missing or invalid.
    - `npc` lines go to `npcLines` and switch to the NPC screen.
    - `main` lines go to the terminal and switch to it.
  - `npcLines`: `[{ id, kind: 'npc' | 'player' | 'divider', text }]`: every
    NPC-screen line so far. It's kept across dialogues, with a `divider` added
    when a new one starts, and trimmed to the last `MAX_NPC_LINES` (500).
  - `waitingFor`: current input options, or `null`.
  - `active`: true while a script is running.
  - `accepts(input)`, `submit(input, atStep?)`: pass-throughs to the runner.
  - `claimsKey(key)`: true if the current wait needs that key: a matching key
    target, or a keyword that starts with that character. Hotkeys skip
    claimed keys.
  - `reply(text)`: adds the player's text to `npcLines`, then submits it.
  - `onMainPrint(fn)`: subscribes to `main:` lines. It returns an
    unsubscribe function.
- A window key listener handles key-press targets. It checks the key before
  any other handler. It then continues on the next tick, so a command's
  output prints before the next dialogue lines, and it uses `atStep` so one
  key press can't answer two steps.

### `src/dialogue/scripts/index.js`
Loads every `.txt` in the folder as raw text, as `scripts[<file name>]`.

### `src/dialogue/scripts/intro.txt`
The example script, with the full format reference in its header comments.
It's played at game start.

### `src/dialogue/scripts/example.txt`
A longer sample scene that uses every input type: `any`, a named key
(`space`), single keys (`key:y | key:n`), typed keywords, a quoted keyword
(`"enter"`), and a mix of a keyword and a key (`continue | esc`). The player
also has to look in the terminal to find the password (`hunter2` in
`/home/admin/.secret`). To play it at start, set
`OPENING_DIALOGUE = 'example'` in `src/App.jsx`.

### `src/games/index.js`: mini game registry
`games` maps a game id to a React component. **To add a mini game:** make the
component in `src/games/`, add it here, then add `program('<id>')` to a file
in `TEMPLATE` in `src/game/fileSystem.js`.

### `src/games/Game2048.jsx`: 2048 (test mini game)
- `slideRow(row)`: slides one row left and merges equal tiles. Returns
  `{ row, gained }`.
- `move(grid, dir)`: turns every direction into a left slide (using
  `transpose` and `reverseRows`), then turns it back. Returns
  `{ grid, gained, moved }`.
- `addRandomTile(grid)`: adds a 2 (90% chance) or a 4 to a random empty cell.
- `canMove(grid)`: returns false once no move changes the board (game over).
- `newGame()`: a fresh board with two tiles.
- Component: arrow keys or WASD to play. Shows the score, "You reached
  2048!", and "Game over!", with New game and Close buttons.

### `src/games/Game2048.css`
Board and tile colors. Each tile value has a class `.g2048-tile--<value>`
(`--big` is for values over 2048).

---

## Adding things

- **New command:** add `src/game/commands/<name>.js` with
  `export default { name, description, usage, run }`. `help` lists it
  automatically.
- **New file or folder:** edit `TEMPLATE` in `src/game/fileSystem.js`.
- **New mini game:** see `src/games/index.js` above.
- **New screen:** make a component in `src/screens/` (it gets
  `{ data, close }`), add it to `screens` in `src/screens/index.js`, then
  trigger it with `showScreen('<id>')`, `terminal.showScreen('<id>')` or a
  `SCREEN_HOTKEYS` entry.
- **New dialogue:** add `src/dialogue/scripts/<name>.txt` (format in
  `intro.txt`), then start it with `startDialogue('<name>')`.
- **New script tag:** add a handler to `TAGS` in `src/dialogue/parser.js`,
  then handle its step type in `DialogueRunner#advance` in `runner.js`.
