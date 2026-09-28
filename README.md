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
| `npm run package` | Builds installers for the computer you're on into `release/` |
| `npm run package:mac` | Builds the Mac `.dmg` (one universal app for Intel and Apple Silicon Macs) |
| `npm run package:win` | Builds the Windows installer and portable `.exe` (works from a Mac too) |
| `npm run package:all` | Builds both Mac and Windows at once |

### Making a new version to share

```sh
cd ~/gamejam-2026
npm run package:all
```

This takes about two minutes. It builds from your current code, so save
first. The files land in `release/`:

| File | For | How players use it |
|---|---|---|
| `Terminal Game-<version>-mac-universal.dmg` | Any Mac (Intel or Apple Silicon) | Open it, drag the app to Applications |
| `Terminal Game-<version>-win-x64.exe` | Windows 10/11 | Installer: run it, pick a folder, then launch from the Start menu |
| `Terminal Game-<version>-win-portable.exe` | Windows 10/11 | No install: double-click to play |

The other files and folders in `release/` (`mac-universal/`,
`win-unpacked/`, `.blockmap`, `.yml`) are leftovers from the build. Players
don't need them.

To change the version number in the file names, run `npm version patch`
(0.1.0 → 0.1.1) before packaging. In a git repo this also makes a commit and
tag. Or edit `"version"` in `package.json` by hand.

### Packaging notes
- **Mac:** the app is **not code-signed** (`"identity": null` in
  `package.json`), so there are no keychain password prompts. The first time
  a player opens it, macOS blocks it as coming from an unidentified
  developer. They should right-click the app → **Open** → **Open**. Signing
  needs a paid Apple Developer ID and can be set up later.
- **Windows:** the `.exe` files aren't signed either. Windows SmartScreen may
  show "Windows protected your PC". Click **More info** → **Run anyway**.
- `release/` and `dist/` are build output and are listed in `.gitignore`.
  Share the files from `release/` directly (e.g. upload them to itch.io or a
  GitHub release). Don't commit them.
- The app uses the default Electron icon until an icon is added.
- Packaging settings live in the `"build"` section of `package.json`:
  - `mac.target`: a universal `dmg`.
  - `win.target`: `nsis` (the installer) and `portable`, both x64.
  - `nsis`: the installer lets the player choose a folder.
  - `artifactName`: the output file names.

---

## Player commands

| Command | Usage | What it does |
|---|---|---|
| `help` | `help` | Shows the guide: every command with its usage, plus path and tips |
| `ls` | `ls [-a] [path]` | Lists a folder. Folders end in `/`. `-a` also shows hidden files (names starting with `.`) |
| `cd` | `cd [path]` | Changes folder. With no path, goes home. Supports `~`, `..` and `/` paths |
| `view` | `view <file>` | Shows a text file's contents. Documents (like `puzzle.txt` from the word puzzle event) and images (like `image.jpg`) open in their own window instead |
| `run` | `run <file>` | Opens a program file's mini game in a separate window. Only files created with `program()` can be run |
| `clear` (or `cls`) | `clear` | Clears the screen |

Paths: `~` is the home folder (`/home`), `..` is the folder above, and a
path starting with `/` starts from the top. The game starts in `/home`.

## Keys

| Key | What it does |
|---|---|
| `1` | Opens the speaker (NPC) screen to reread every earlier NPC message, and pressing it again switches back. Works during dialogue too. It's skipped while the command line has text (so `1` can be typed inside a command), and when the dialogue is waiting for that key itself (`input [key:1]`, `input [any]`, or a keyword starting with `1`) |
| ↑ / ↓ | Moves through earlier commands |

## Mock file system

```
/home/guest/readme.txt
/home/guest/notes/todo.txt
/home/admin/getStarted/2048.exe       program → opens the 2048 mini game
/home/admin/getStarted/tutorial.txt   used by the tutorial in example.txt
/home/admin/getStarted/image.jpg      image → opens in its own window (placeholder picture)
/etc/hostname
/etc/motd
/var/log/auth.log
/tmp/
```

Added by events during play:
```
/home/puzzle.txt              document → opens in its own window (word puzzle event)
```

---

## How it works

1. The player types a line and presses Enter (`Terminal.jsx`).
2. `useTerminal` shows the typed line on screen, then calls `execute()` in
   `src/game/engine.js`.
3. `execute` splits the line into a command and arguments, finds the command
   file, and runs it with the player's `session`.
4. The command returns text to print. It can also call `terminal.clear()`,
   `terminal.launch(gameId)`, `terminal.openDocument(docId)` or
   `terminal.openImage(imageId)`.
5. `launch`, `openDocument` and `openImage` open the app again in a new
   window at `?game=<id>`, `?doc=<id>` or `?image=<id>`, and `main.jsx` shows
   that mini game, document or image instead of the terminal.

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
| `main: <text>` | Print in the main terminal window (the view switches to the terminal). Use it for system messages, not conversation |
| `npc: <text>` | NPC's line on the NPC screen, in light blue (the view switches to the NPC screen) |
| `player: <text>` | Player's line on the NPC screen, in amber (the view switches to the NPC screen). Scripts start these with `> ` |
| `wait <time>` | Pause before the next line: `wait 800` or `wait 800ms` (milliseconds), `wait 1.5s` (seconds) |
| `input [enter]` | Wait for a key press. Key names: `enter`, `space`, `tab`, `esc`, `backspace`, `up`, `down`, `left`, `right` |
| `input [any]` | Wait for any key press |
| `input [key:y]` | Wait for one specific key |
| `input [yes]` | Wait for a typed keyword + Enter. Not case-sensitive, and extra spaces are ignored |
| `input [yes \| y]` | Several accepted answers, separated by `\|` (keys and keywords can be mixed) |
| `input ["enter"]` | Quotes force a keyword (the word "enter", not the Enter key) |
| `input npc [word]` | Typed answers only count on the NPC screen. Key presses still count anywhere |
| `input main [cmd]` | Typed answers only count in the terminal, so the command really runs (used for the tutorial's commands). Meanwhile the NPC screen shows "[ press 1 to go to the terminal ]" and no reply box |
| `wrong: <text>` | Goes right after an `input` line: what the NPC says when a typed answer on the NPC screen is wrong. With several `wrong:` lines, all are said |
| `event: <id>` | Start a game event from `src/events` (e.g. `event: word-puzzle`) |
| `screen: <id>` | Switch the main window to a screen from `src/screens` (e.g. `screen: ending`), or back with `screen: terminal` |
| `# ...` | Comment. Blank lines are ignored too |

Text lines (`main:`, `npc:`, `player:`) keep extra leading spaces after the
colon, so indented text lines up (e.g. `npc:     L downloads`).

`src/dialogue/scripts/intro.txt` has the full format reference in its
header. `example.txt` uses every feature, including the word puzzle event.

Where the player types:
- **Key presses** count on any screen.
- **Keywords** can be typed in the terminal or on the NPC screen, which shows
  a `>` input line whenever a keyword is expected.
  - In the terminal, a keyword that is also a real command (like `ls`) runs
    as a command too. Otherwise it's only an answer, so there's no
    "command not found".
  - Wrong answers are shown on the NPC screen but don't advance the
    dialogue. The NPC answers with the script's `wrong:` lines, if any.
    Wrong answers typed in the terminal just run as commands.

Starting a dialogue:
- **React:** `useDialogue().startDialogue('<name>')`
- **Commands:** `terminal.startDialogue('<name>')`
- **Game opening:** `OPENING_DIALOGUE` in `src/App.jsx`

Script errors (like an unknown tag, or an `event:` / `screen:` id that doesn't exist)
print as a `[dialogue error]` line in the terminal, with the line number.
The script doesn't start.

### Events (major story moments)

Each game event is its own folder in `src/events/`, so it's easy to find,
move and read. An event bundles what the moment needs: the documents it uses
and what happens when it fires (e.g. files appearing). A dialogue script
fires it with `event: <id>`. The dialogue around it (hints, the answer, and
the NPC's right/wrong replies) stays in the script.

**Event 1: word puzzle** (`src/events/wordPuzzle/`, id `word-puzzle`). It's
a placeholder, played at the end of `example.txt`:
1. The NPC says a file arrived, and `event: word-puzzle` puts `puzzle.txt`
   in the home folder.
2. The player finds it with `ls` and runs `view puzzle.txt`. The puzzle
   opens in its own window.
3. The player presses 1 and types the answer on the NPC screen
   (`input npc [incident]`). Wrong answers get "No... that's not it. Read the
   clue again.", and the right answer gets "Incident. That's correct." The
   answer is only in the script, not in the puzzle file.

---

## Files

```
package.json            scripts, dependencies, packaging settings ("build")
index.html              page shell
vite.config.js          Vite settings
electron/main.js        Electron: creates the windows
scripts/dev.js          `npm run dev`: starts Vite + Electron together
src/main.jsx            entry: shows the main window (App), a mini game, a document, or an image
src/App.jsx             main window: the terminal and the active screen
src/hooks/useTerminal.js
src/components/Terminal.jsx, Terminal.css
src/components/DocumentWindow.jsx, .css   document pop-out window
src/components/ImageWindow.jsx            image pop-out window
src/images/             images opened by `view` (index.js + image files)
src/screens/            screens that switch in over the terminal (NPC dialogue, ending)
src/citations.js        collects every citation for the ending screen
src/dialogue/           dialogue scripts: parser, runner, React connection
  scripts/*.txt         the plot scripts themselves
src/events/             game events, one folder each (wordPuzzle/...)
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
  (`release/`), and the output file names. Also the installer per OS: a
  universal Mac `dmg` (no signing: `mac.identity: null`), and a Windows
  `nsis` installer plus a `portable` exe. See "Packaging notes".
- `"scripts"`: `package`, `package:mac`, `package:win` and `package:all`
  build the installers (see "Running it").
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
  - `setWindowOpenHandler`: lets the page open mini game and document windows
    (no menu bar, and the size comes from the page's `window.open` call).
    Blocks any other URL.
  - Closing the terminal window quits the app, and any game windows with it.

### `scripts/dev.js`: `npm run dev`
Starts the Vite dev server, then runs Electron pointed at it through
`VITE_DEV_SERVER_URL`. When Electron exits, it stops Vite. Ctrl+C closes
Electron.

### `src/main.jsx`: entry point
`Root` reads the URL:
- `?doc=<id>`: shows `<DocumentWindow id />`.
- `?image=<id>`: shows `<ImageWindow id />`.
- `?game=<id>`: shows that game from `src/games` (or "Unknown game").
- Neither: shows `<App />`.

### `src/App.jsx`: the main window
- `OPENING_DIALOGUE` (currently `'example'`): the script played when the
  game opens. Set it to `null` for none.
- `App`: wraps everything in `ScreenProvider`, then `DialogueProvider`.
- `MainWindow`:
  - Turns on the screen hotkeys (`useScreenHotkeys`) through
    `isKeyClaimed`. A key is skipped when the current screen has
    `locksHotkeys` (the ending), or when the dialogue is waiting for that key
    (`claimsKey`).
  - Starts `OPENING_DIALOGUE` once. `startedRef` stops React dev mode from
    starting it twice.
  - Always renders `<Terminal active={...} />`, with `active` false while a
    screen is up, and puts the current screen on top as
    `<Screen data close />`.

### `src/hooks/useTerminal.js`: connects the UI to the game logic
- `formatPrompt({ user, host, cwd })`: gives `guest@mainframe:~$`.
- `openPopup(param, id, { width, height })`: runs
  `window.open('?<param>=<id>', '<param>-<id>')`. Opening the same thing
  again reuses its window.
- `useTerminal()`:
  - Must be used inside `ScreenProvider` and `DialogueProvider`.
  - Creates the `session` once and keeps it in a ref.
  - `lines` starts with the MOTD. Each line is
    `{ id, kind: 'input' | 'output' | 'system' | 'dialogue', text }`.
  - `terminal`: what commands and events can do besides printing text:
    - `clear()`, `showScreen()` and `startDialogue()`.
    - `launch(gameId)`: opens a 480×640 game window.
    - `openDocument(docId)`: opens a 760×820 document window.
    - `openImage(imageId)`: opens an 880×640 image window.
  - Subscribes to the dialogue's `main:` lines (`onMainPrint`) and adds them
    to `lines`.
  - Subscribes to `event:` lines (`onGameEvent`) and runs them with
    `runEvent(id, { session, terminal })`. It does this here because this
    hook holds the player's session. A failing event prints an
    `[event error]` line.
  - `prompt` is refreshed after every command.
  - `runCommand(raw)`: runs `execute` with `terminal`, then adds the output
    and updates the prompt.
  - `sendCommand(raw)`: shows the typed line. If the dialogue is waiting for
    this keyword (`{ text, from: 'main' }`), it runs the command only if it's
    a real command, then gives the answer to the dialogue. Otherwise it runs
    the command normally.
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

### `src/components/DocumentWindow.jsx`: document pop-out
Shows a document from `getDocument(id)` (`src/events`): a sticky header with
the title and a Close button, then the text as written (line breaks kept).
It also sets the window title, and shows "Unknown document" for a bad id.

### `src/components/DocumentWindow.css`
Readable text column (max 680px, 15px, light green on black) with a sticky
header. `.doc-image` makes an image fit the window width. `ImageWindow` uses
these styles too.

### `src/components/ImageWindow.jsx`: image pop-out
Shows an image from `getImage(id)` (`src/images`): the same header as the
document window (title and Close), then the picture, scaled down to fit. It
also sets the window title, and shows "Unknown image" for a bad id.

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
  `{ type: 'file', content, game?, doc?, image? }`.
- `dir(children)`: makes a folder.
- `file(content, extra)`: makes a file. `extra` adds more fields.
- `program(gameId, content)`: makes a runnable file. `run` launches mini game
  `gameId`, which must be a key in `src/games/index.js`.
- `docFile(docId)`: makes a document file. `view` opens document `docId`
  (from an event's `documents`) in its own window.
- `imageFile(imageId)`: makes an image file. `view` opens image `imageId`
  (from `src/images/index.js`) in its own window.
- `addFile(root, absPath, node)`: puts a file or folder at a path, replacing
  anything already there. The parent folder must exist. Events use this.
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
`{ clear(), launch(gameId), openDocument(docId), openImage(imageId), showScreen(screenId, data?), startDialogue(name) }`.
`run` returns the text to show, or nothing, and can be `async`.

| File | Notes |
|---|---|
| `help.js` | Builds the guide from every command's `usage` and `description`, then adds the Paths, Keys (`1` = reread messages) and Tips sections |
| `ls.js` | `-a` shows hidden files, and a path argument is optional. Listing a file prints its name |
| `cd.js` | Default target is `~`. Errors for missing paths and for files |
| `view.js` | One file argument. Errors for a missing argument, a missing file or a folder. Image files (`image` set) call `terminal.openImage(image)`, document files (`doc` set) call `terminal.openDocument(doc)`, and anything else prints its content |
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
`screens` maps a screen id to a React component: `npc` (NpcScreen) and
`ending` (EndingScreen). Each screen gets props `{ data, close }`: `data` is
what was passed to `showScreen`, and `close()` returns to the terminal. A
component with `locksHotkeys = true` can't be left with the 1 hotkey.

### `src/screens/useScreenHotkeys.js`: key presses that switch screens
- `SCREEN_HOTKEYS`: maps a key to a screen id (currently `1 → 'npc'`).
- `useScreenHotkeys(bindings, isKeyClaimed)`: listens for keys on the whole
  window (capture phase), and each bound key calls `toggleScreen`.
  `isKeyClaimed(key)` returning true skips the hotkey for that press. `App`
  passes the dialogue's `claimsKey`.
- It skips held-down keys (`e.repeat`), Ctrl/Cmd/Alt combos, and presses
  while the terminal input has text. It stops the key from also being typed.

### `src/screens/NpcScreen.jsx`: NPC dialogue screen (screen id `npc`)
- Shows `npcLines` from `useDialogue()`, the whole conversation history, so
  the player can press 1 to reread it.
  - NPC lines are light blue.
  - Player lines (`player:` script lines and typed replies, which are stored
    as `> text`) are amber.
  - Each conversation is separated by a dashed line.
  - Shows "No messages yet." before anything has been said.
- A fixed `[1] back to terminal` hint sits in the bottom-right corner.
- When a keyword is expected, shows a `>` input line and focuses it. Enter
  calls `reply(text)`.
- When the keyword must be typed in the terminal (`waitingFrom === 'main'`),
  it shows "[ press 1 to go to the terminal ]" instead of the input line.
- When only a key is expected, shows a blinking hint like `[ press Enter ]`.
- Keeps the newest line in view.

### `src/screens/NpcScreen.css`
A centered text column (max 640px wide) anchored to the bottom, in the same
green-on-black style. Line classes: `.npc-line--npc` (light blue),
`--player` (amber `#ffc46b`) and `--empty` (dim green). `.npc-divider` is the dashed line between conversations,
`.npc-footer` is the corner hint, and `.npc-hint` blinks.

### `src/screens/EndingScreen.jsx`: end of the demo (screen id `ending`)
- Shown by `screen: ending` at the end of `example.txt`.
- Page 1: `BANNER`, a big ASCII "END OF / DEMO", then "This is the end of
  the demo. Thank you for playing!" and a blinking
  "[ press Enter to see citations ]".
- Page 2: "CITATIONS", listing `getCitations()`, each with its file name
  above it, then "[ press Enter to go back ]".
- Enter switches between the two pages. `locksHotkeys = true`, so 1
  doesn't leave the ending.

### `src/screens/EndingScreen.css`
Centered green-on-black layout. The banner's font size scales with the
window width, and it has a soft glow. The subtitle is light blue, the hint
blinks, and the citations sit in a left-aligned column up to 720px wide.

### `src/citations.js`
`getCitations()` returns `[{ source, text }]` from every image's `citation`
(`src/images/index.js`) and every event document's `citation`
(`src/events/*`). Add a `citation` there and it shows up on the ending
screen.

### `src/dialogue/parser.js`: script text → steps
- `parseScript(source)`: returns a list of steps and throws `ScriptError` (with
  `.line`) on a bad line. Steps are:
  - `{ type: 'say', target: 'main' | 'npc' | 'player', text, line }`
  - `{ type: 'wait', duration, line }` (milliseconds)
  - `{ type: 'input', options, from, wrong, line }`, where:
    - each option is `{ kind: 'key', key, label }` or
      `{ kind: 'text', word, label }`
    - `from` is `'main'`, `'npc'` or `null` (anywhere)
    - `wrong` is the list of `wrong:` lines
  - `{ type: 'event', id, line }`
  - `{ type: 'screen', id, line }`
- `SAY_TAGS` (`main`, `npc`, `player`): text tags whose text keeps its
  leading spaces. All other tags get trimmed text.
- `TAGS`: maps a tag name to `(rest, line, steps) => step`. **Add new script
  tags here.** A line is `<tag>: rest`, and the colon is optional.
  - A handler that returns nothing adds no step. `wrong` works this way: it
    adds its text to the `input` step just before it, and errors if there
    isn't one.
- `KEY_NAMES`: maps script key names to `KeyboardEvent.key` values (`any` →
  `'*'`).
- `parseOption(raw, line)`: reads one input target. Checks, in order: a
  `"quoted"` keyword, `key:x`, a known key name, and otherwise a keyword.
- `ScriptError`: an error whose message starts with `line N:`.

### `src/dialogue/runner.js`: plays the steps
- `matchesOption(option, input)`: checks `{ key }` or `{ text }` against one
  option. Single-letter keys and keywords are not case-sensitive.
- `DialogueRunner(steps, { say, event, screen, wait, end })`:
  - `start()`: runs from the first step.
  - `#advance()`: runs steps until it reaches an `input` step (then calls
    `wait(options, step)`) or the end (then calls `end()`).
    - It calls `say(target, text, step)` for `say` steps, `event(id)` for
      `event` steps and `screen(id)` for `screen` steps.
    - A `wait` step pauses with a timer, then continues.
  - `stop()`: cancels a pending `wait` timer (`start()` calls it first).
  - `waitingFor`: the current input options, or `null`.
  - `wrongReplies`: the current input step's `wrong:` lines, or `[]`.
  - `index`: the current step.
  - `accepts(input)`: checks whether `input` (`{ key }` or
    `{ text, from }`) matches, without advancing. A typed answer from the
    wrong screen (see `input npc [...]`) doesn't match.
  - `submit(input, atStep?)`: continues if `input` matches. It returns true
    or false. `atStep` makes it only continue if still at that step.

### `src/dialogue/DialogueContext.jsx`: connects dialogue to the UI
- `DialogueProvider` (must be inside `ScreenProvider`).
- `useDialogue()` returns:
  - `startDialogue(name)`: parses `scripts/<name>.txt` and plays it. Returns
    false and prints a `[dialogue error]` line in the terminal if the script
    is missing or invalid, including an `event:` id not found in
    `src/events` or a `screen:` id not found in `src/screens` (other than
    `terminal`).
    - `screen:` lines call `showScreen(id)`, or `showTerminal()` for
      `terminal`.
    - `npc` and `player` lines go to `npcLines` (as kind `npc` / `player`)
      and switch to the NPC screen.
    - `main` lines go to the terminal and switch to it.
  - `npcLines`: `[{ id, kind: 'npc' | 'player' | 'divider', text }]`: every
    NPC-screen line so far. It's kept across dialogues, with a `divider` added
    when a new one starts, and trimmed to the last `MAX_NPC_LINES` (500).
  - `waitingFor`: current input options, or `null`.
  - `waitingFrom`: where a typed answer must come from: `'main'`, `'npc'` or
    `null` (anywhere).
  - `active`: true while a script is running.
  - `accepts(input)`, `submit(input, atStep?)`: pass-throughs to the runner.
  - `claimsKey(key)`: true if the current wait needs that key: a matching key
    target, or a keyword that starts with that character. Hotkeys skip
    claimed keys.
  - `reply(text)`: adds the player's text to `npcLines` as a `player` line
    (`> text`), then submits it as
    `{ text, from: 'npc' }`. If it's wrong, it adds the step's `wrong:` lines
    as NPC lines. Empty text is ignored.
  - `onMainPrint(fn)`, `onGameEvent(fn)`: subscribe to `main:` lines or
    `event:` ids. Each returns an unsubscribe function.
- A window key listener handles key-press targets. It checks the key before
  any other handler. When a key is used as an answer, a character key (like
  the letter pressed for `[any]`, or `y` for `[key:y]`) is kept from also
  being typed into the focused input. It then continues on the next tick, so a command's
  output prints before the next dialogue lines, and it uses `atStep` so one
  key press can't answer two steps.

### `src/dialogue/scripts/index.js`
Loads every `.txt` in the folder as raw text, as `scripts[<file name>]`.

### `src/dialogue/scripts/intro.txt`
The first example script, with the full format reference in its header
comments.

### `src/dialogue/scripts/example.txt`
The game's current story draft, played at game start
(`OPENING_DIALOGUE = 'example'`):
1. System warnings in the terminal.
2. A back-and-forth between the NPC and the player (`npc:` / `player:` with
   `wait` pauses).
3. The tutorial, split into numbered parts (3.1–3.10):
   - 3.1–3.2: what `cd` and directories are (with a folder tree), and how to
     move around.
   - 3.3: the player pushes back.
   - 3.4–3.10: one part per command, each waiting for the real command in
     the terminal (`input main [...]`): `cd admin/getStarted`, `ls`,
     `view tutorial.txt`, `view image.jpg`, then the up/down arrows tip, then
     `run 2048.exe` and `help`.
4. More conversation, then the word puzzle event (`event: word-puzzle`,
   `input npc [incident]`, `wrong:`).
5. After the right answer: `wait 1500`, then `screen: ending` (end of demo
   and citations).

### `src/dialogue/scripts/og_example.txt`
The earlier sample scene that uses every input type: `any`, `space`,
`key:y | key:n`, typed keywords, a quoted keyword (`"enter"`), and
`continue | esc`.

### `src/images/index.js`: image registry
- `images`: maps an image id to `{ title, src, citation? }`. `src` is the imported
  file, so Vite bundles it for dev and the packaged app.
- `getImage(id)`: returns the image, or `null`.
- `placeholder` (`image.jpg`): a placeholder picture for the tutorial. Its
  citation is "Van Rooyen, Theunis. (2020). Nuclear Physics for Nuclear
  Engineers." **To
  replace it:** overwrite `src/images/image.jpg` (keep the name), or import a
  different file here.

### `src/events/index.js`: event registry
- `ALL_EVENTS`: the list of event modules. **Add new events here.**
- `events`: maps an event id to its event.
- `getEvent(id)`: returns the event, or `null`.
- `getDocument(id)`: finds a document in any event's `documents`, or
  returns `null`. The document window uses this.
- `runEvent(id, ctx)`: calls the event's `start(ctx)`, where `ctx` is
  `{ session, terminal }`. Throws for an unknown id.
- Event shape:
  `{ id, name, documents?: { <docId>: { title, text, citation? } }, start({ session, terminal }) }`.

### `src/events/wordPuzzle/index.js`: event 1, word puzzle
id `word-puzzle`. It has one document, `word-puzzle` (title `puzzle.txt`,
text from `puzzle.txt`, and the Terranova (2026) article as its
`citation`). `start` puts `docFile('word-puzzle')` at
`~/puzzle.txt`.

### `src/events/wordPuzzle/puzzle.txt`
The puzzle text shown in the document window: the clue, the blank, the
paragraph and the citation. The answer line ("Incident") was left out on
purpose. One line break in the pasted paragraph ("7Li / ~1.01 MeV") was
joined.

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
- **New event:** make `src/events/<name>/index.js` exporting
  `{ id, name, documents?, start }` (plus any `.txt` it needs), add it to
  `ALL_EVENTS` in `src/events/index.js`, then fire it from a script with
  `event: <id>`.
- **New image:** put the file in `src/images/`, import it in
  `src/images/index.js` and add it to `images`, then put
  `imageFile('<id>')` in `TEMPLATE` (or add it from an event with `addFile`).
- **New citation:** add `citation: '...'` to the image in
  `src/images/index.js` or to the document in its event. The ending screen
  lists it automatically.
- **New document:** add it to an event's `documents`, then put a
  `docFile('<docId>')` somewhere (in the event's `start`, or in `TEMPLATE`).
