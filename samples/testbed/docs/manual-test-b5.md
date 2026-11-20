# B-5 Manual Test Plan

**Phase:** B-5 — testbed shell + CLI scenario integration  
**Author:** Code Monkey (automated)  
**Maintainer gate:** Erik Fortune must complete this pass before B-5 is accepted.

---

## Prerequisites

From `samples/testbed/`, ensure the build is current:

```bash
export PATH="$PWD/node_modules/.bin:$PATH"
heft build --clean
```

---

## Web dev server

Start the dev server:

```bash
rushx dev
# or: webpack serve --mode development
```

Then open http://localhost:3004 (or the port shown in the output).

### Web click-through checklist

1. **Sidebar is clickable**
   - [ ] Two scenario buttons appear: "Local Classifier Safety" and "Local Embedding Search"
   - [ ] Clicking a button highlights it (selected class + `aria-current="page"`)
   - [ ] The main area switches to the selected scenario

2. **Local Classifier Safety**
   - [ ] Sidebar button: click "Local Classifier Safety"
   - [ ] Main area shows "Loading scenario…" while the model downloads (first visit only)
   - [ ] StatusBar shows `Loading model Xenova/toxic-bert…` then `Model Xenova/toxic-bert ready.`
   - [ ] After loading: textarea + "Screen text" button appear
   - [ ] Type `Hello, how are you?` → click "Screen text" → result shows "✓ Content passed all checks."
   - [ ] StatusBar shows `Content passed all checks.`
   - [ ] Type `I hate all people` → click "Screen text" → result shows "Rejected:" with an error message
   - [ ] StatusBar shows a `Resolve failed:` warn entry

3. **Local Embedding Search**
   - [ ] Sidebar button: click "Local Embedding Search"
   - [ ] StatusBar shows `Loading model Xenova/all-MiniLM-L6-v2…` then `Model ready.`
   - [ ] After loading: text input + "Search" button appear
   - [ ] Type `capital cities in Europe` → click "Search"
   - [ ] Ranked list appears; top results should include Paris/London entries
   - [ ] StatusBar shows `Search complete. Top result: "..."`

4. **Switching scenarios**
   - [ ] Click between scenarios without reload — each mounts its own component
   - [ ] StatusBar accumulates logs from both scenarios

---

## CLI

From `samples/testbed/`:

```bash
export PATH="$PWD/node_modules/.bin:$PATH"
```

### --help

```bash
node bin/testbed.js --help
```

Expected: prints usage including `--scenario <id>` and lists both scenarios.

### --scenario local-classifier-safety

```bash
node bin/testbed.js --scenario local-classifier-safety
```

Expected:
- Model downloads (first run) then runs 4 demo inputs
- Summary printed to stdout: `B-3 local-classifier-safety demo (4 inputs):`
- Lines like `clean-greeting: CLEAN`, `hate-speech: REJECTED`
- Exit code 0

### --scenario local-embedding-search

```bash
node bin/testbed.js --scenario local-embedding-search
```

Expected:
- Model downloads (first run) then ranks the demo query `capital cities in Europe`
- Summary printed to stdout: `B-4a local-embedding-search demo`
- Top 5 results with scores
- Paris/London entries appear near the top
- Exit code 0

### Unknown scenario id

```bash
node bin/testbed.js --scenario does-not-exist
```

Expected:
- Exits with code 1
- stderr: `unknown scenario "does-not-exist"` and list of available scenarios

### Bare invocation

```bash
node bin/testbed.js
```

Expected:
- Exits with code 0
- stdout: `testbed CLI — 2 scenario(s) available:` and lists both scenarios

---

## Automated gate summary (for reference)

```
heft build --clean   → no errors, no warnings
eslint src           → zero problems
heft test --clean    → 137 tests pass, 100% all four coverage metrics
webpack --mode production → compiled; @fgv/ts-extras-transformers only appears as webpackIgnore string literal
```

---

**Status:** Automated gates PASS. Maintainer manual pass COMPLETE (both scenarios verified in light + dark).
