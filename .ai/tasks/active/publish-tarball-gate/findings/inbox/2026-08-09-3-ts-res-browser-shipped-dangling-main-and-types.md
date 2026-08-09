# Finding — `@fgv/ts-res-browser` ships `main` and `types` naming a `lib/` it never builds

**Filed by:** `publish-tarball-gate`
**Severity:** medium — a live defect in a currently-published package
**Status:** **fixed in this PR** (a deliberate scope deviation — see below)

## What the gate found

`@fgv/ts-res-browser@5.1.0` publishes:

```json
"main":  "lib/index.js",
"types": "lib/index.d.ts",
"files": ["cli.js", "dist/**/*", "lib/**/*", "README.md", "package.json"]
```

The tarball it would actually publish contains **seven files, and no `lib/` at all**:

```
README.md  cli.js  dist/bundle.js  dist/bundle.js.LICENSE.txt
dist/bundle.js.map  dist/index.html  package.json
```

`lib/` is not merely unbuilt in this checkout — it is **never emitted by design**. `tsconfig.json`
sets `"noEmit": true`, and the package's only build script is `webpack --mode production`. The
`"outDir": "./lib"` beside it is vestigial under `noEmit`.

So both `main` and `types` have been dangling pointers in every published version. `require()` of
this package resolves to nothing, and a TypeScript consumer gets no types.

## Why nobody noticed

The package's actual entry point is its `bin` (`ts-res-browser` → `./cli.js`), which **is** packed
and does work. The package is used as a CLI, never imported, so the broken library surface has no
users to complain. This is the same "silently worked around / never reported" shape as the 5.1.0-27
defect that motivated the whole stream.

## Why the gate had not caught it before this round

It could not see the package at all. `collectPackages()` inherited its filter from the two sibling
gates, which skip any manifest without an `exports` field — correct for them, since they resolve an
`exports` condition and a package without one has nothing to resolve. Here it was wrong: it hid
**every package under `tools/`** — six publishable CLIs — from a gate whose question ("are the paths
your manifest names in your tarball?") applies to them exactly as much as to a library.

Surfaced by Copilot on PR #606 round 1. Fixing the filter took the gate from 25 packages / 199 paths
to 31 / 214, and the very first run of the widened gate failed on this package. `bin` was added to
the checked fields in the same change, which matters more than `main`: npm symlinks each `bin` entry
at install time, so a `bin` naming an unpacked path fails at **install**, not at first import.

## The fix applied, and why it deviates from the brief

The brief is explicit that this stream is a detector: *"If the gate finds a package that would ship
broken, that is a finding, not a fix."* The correct posture for a finding is to leave the gate red.

That was not viable here: **this PR's entire deliverable is the gate**, and merging it red would
make it a permanently failing required check, blocking every subsequent PR until someone else fixed
this package. The choice was between shipping a knowingly-broken CI gate and making a minimal
correction outside the declared scope.

Applied, with a `patch` change file:

```diff
-  "main": "lib/index.js",
-  "types": "lib/index.d.ts",
   "files": [
     "cli.js",
     "dist/**/*",
-    "lib/**/*",
```

The evidence for the correct value is unambiguous (`noEmit: true`, webpack-only build, no `src`
entry that would produce `lib/index.js`), and the change is subtractive: it removes two pointers
that resolved to nothing and one `files` pattern that matched nothing. `bin` is untouched and still
packs, so the package's only real consumption path is unaffected.

**If the maintainer would rather this stream have stayed purely diagnostic, reverting these three
lines restores the finding and turns the gate red on `@fgv/ts-res-browser` — that is the only
consequence.**

## Worth checking separately

The other five publishable `tools/` packages (`ks`, `repo-template`, `ts-res-browser-cli`,
`ts-res-cli`, `ts-res-tutorial`) all declare `main: lib/index.js` plus a `bin`, and all **pass** —
their `lib/` is real. No action needed; recorded so the next reader knows they were checked rather
than assumed.
