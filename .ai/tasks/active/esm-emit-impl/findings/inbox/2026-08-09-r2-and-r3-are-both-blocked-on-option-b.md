# Finding — R2 *and* R3 are both blocked on Option B, and R2 is not independently safe

**Found by:** `esm-emit-impl`, by building the repo's own webpack app after applying R2 and R3
**Severity:** invalidates the design's central recommendation; both changes were reverted
**Bears on:** `.claude/project/esm-emit-design.md` §3 (R2, R3), §4 ("settled"), §6 ("is it breaking?")

## What the design said

> **R2 — Add `emitModulePackageJson: true`…** One line. Verified (§7, variant C) to write
> `dist/package.json` containing `{"type":"module"}` and to eliminate `MODULE_TYPELESS_PACKAGE_JSON`
> entirely.

and, in §4:

> This is a **one-line rig change with no publish-shape change** … and it is worth doing under *any*
> of the options in §2 — it is the one recommendation here that is independent of the recommendation.

and, in §6's blast-radius table, R2 was scored `Breaking? No — nobody resolves differently`.

## What actually happens

Both R2 and R3 break `tools/ts-res-ui-playground`, the repo's webpack build.

Isolated to a single generated file, by bisection on an otherwise identical tree:

| Tree | webpack errors |
|---|---|
| base branch, unmodified | **0** |
| + R2 (`emitModulePackageJson: true`) | **6** |
| same tree, `libraries/ts-utils/dist/package.json` deleted by hand | **0** |

```
ERROR in ../../libraries/ts-utils/dist/index.js 22:0-54
Module not found: Error: Can't resolve './packlets/collections' in '.../ts-utils/dist'
Did you mean 'index.js'?
```

R3 fails the same way, on whichever packages it routes:

```
ERROR in ../../libraries/ts-extras/dist/index.browser.js 23:0-49
Module not found: Error: Can't resolve './packlets/ai-assist' in '.../ts-extras/dist'
```

## Why

The mechanism is the one the design already documented — it was simply never connected to R2 or R3.

The `dist` emit contains extensionless **directory** imports (`from './packlets/base'`). That is not
valid ESM, which is exactly why Node cannot load it and why the original bug existed. Two different
things make a tool apply *correct* ESM resolution to that tree:

- **declaring it ESM** — `dist/package.json` = `{"type":"module"}`, which is precisely what R2 adds;
- **being a bundler that applies `fullySpecified`** — webpack 5 does, for anything it treats as ESM.

esbuild does neither: it falls back to node10-style directory-index resolution and reports success.
The design's §6 asserted "bundlers resolve extensionless directory imports happily" and chose
esbuild for the gate on the strength of it. **That is true of esbuild and false of webpack 5.**

So the design's own §7 note — *"the ESM tree builds; it has never been bundled; those are different
claims"* — was right, and applies one level further than it was aimed. It was written about R3. It
is equally true of R2, and of the gate that was supposed to make R3 safe.

## Consequence

**R2 is not independent of the recommendation.** §4's claim that it is worth doing under any option
is wrong: it is only safe once the emit it declares ESM actually *is* ESM. Today it converts a
harmless Node warning into a hard webpack failure for the four packages already routed at `dist`.

**R3 is not gated on a bundler-resolution check.** It is gated on Option B — explicit specifiers in
source (`./packlets/base/index.js`), the ~3,520-edit codemod the design deferred for want of a
consumer asking. Option B is not merely the way to get native Node ESM; it is the precondition for
*any* correct consumer of the ESM emit, browser bundlers included.

That reframes Option B's cost/benefit substantially. The design weighed it as buying a capability no
consumer had requested, against R3 buying a measured 3.5× payload win. In fact **R3's win is not
available without it** — they are one change, not two competing ones.

## What shipped instead

R2 and R3 both reverted. What remains is the gate, two real defect fixes it found, and this finding.

The gate now reports the precondition directly: `--probe-esm` marks a package **BLOCKED** when
esbuild bundles it but its emitted specifiers are not fully specified, so the next attempt fails
fast with the reason rather than rediscovering this by breaking a webpack build. Current verdict:
**10 dual-rig packages BLOCKED, 4 clean** (single-file packages that have no relative specifiers to
get wrong).

## Recommended next step

Option B, as its own stream, scoped as the enabler for R2 + R3 rather than as native-ESM support.
The codemod is mechanical and per-package (resolve each relative specifier; append `/index.js` for a
directory, `.js` for a file), the design verified it needs no `moduleResolution` change, and this
gate plus `verify-esm-entrypoints.mjs` verify each package as it converts. R2 and R3 then land
behind it, per package, with the measured wins already recorded in `result.md`.

**Validate any future R3 with webpack, not only esbuild.** A single bundler is weaker evidence than
it looks, and this stream is the demonstration.
