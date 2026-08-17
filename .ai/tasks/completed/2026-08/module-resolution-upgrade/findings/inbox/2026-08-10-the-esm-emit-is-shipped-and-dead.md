# The ESM emit is shipped and dead — and a correction about whether that is a defect

**Severity:** reframes the emit decision. **Contains a correction to this finding's own first
version**, which claimed `@fgv/ts-bcp47`'s ESM entry was broken. It is not, and the gates already
cover it. Kept rather than deleted because the correction is the useful part.

Surfaced answering "where does changing the emit leave our consumers?"

## The load-bearing fact: every consumer gets CommonJS today, on every path

Audited all 25 published packages' `exports` maps:

> **25 of 25 route `node.import` at `./lib/index.js` — the CommonJS build.** `main` is
> `lib/index.js` everywhere.

`lib/` is CJS (`"use strict"; ... exports.X = ...; require(...)`). `dist/` is ESM (`import * as X
from './packlets/...'`). Both are built, both are packed, and **no package routes a Node consumer at
`dist/`**. One package — `@fgv/ts-bcp47` — routes its *browser* branch there.

Node's ESM loader imports our CJS fine; `cjs-module-lexer` detects the named exports:

```
$ node --input-type=module -e "import('./libraries/ts-utils/lib/index.js').then(m => ...)"
LOADS, named exports visible: true
```

**So the ESM emit is not something consumers depend on — it is something they never receive.** That
inverts the usual risk framing: this is not "migrate consumers off CJS", it is "decide whether to
activate a tree we already build, ship, and reach from almost nothing".

## Correction — `ts-bcp47`'s ESM entry is NOT broken, and I tested it wrong

The first version of this finding claimed that entry "does not load", citing:

```
ERR_UNSUPPORTED_DIR_IMPORT: Directory import '.../dist/packlets/bcp47' is not supported
[MODULE_TYPELESS_PACKAGE_JSON] ... doesn't parse as CommonJS
```

**That was produced by importing a browser-branch entry with Node's ESM loader — a path no consumer
takes.** Node matches the `node` condition first and never reaches `browser`/`default`. The correct
question is whether a *bundler* can consume it, and both do:

| runtime | result |
|---|---|
| Node ESM loader | fails — **and is never the consumer of this entry** |
| esbuild (`verify-bundler-resolution`) | ✅ resolves `-> ./dist/index.browser.js` and bundles |
| **webpack 5** (probed directly, `conditionNames: ['browser','import','default']`) | ✅ **bundles clean, 0 errors** |

I predicted webpack would fail, on the strength of `verify-esm-entrypoints.mjs`'s header note that
webpack applies `fullySpecified` and hard-fails on extensionless directory imports. That note is
accurate but conditional, and the condition is stated in the same paragraph: *"Declaring the emit ESM
(a `dist/package.json` with `{"type":"module"}`) is enough to trigger it."* **No package declares
it** — so `fullySpecified` never engages and webpack resolves directory imports happily.

The absence of `type: module`, which the first version called "half the defect", is precisely what
makes the tree consumable by bundlers today.

## The gates are not narrow here — they already cover this

Checked, not assumed, for `ts-bcp47`:

- **`verify-tarball-exports`** — verifies **all 12** declared paths exist in the tarball, including
  every `dist` target under all three condition blocks.
- **`verify-bundler-resolution`** — resolves `browser` → `import` and bundles **`./dist/index.browser.js`**
  with esbuild. The ESM entry *is* exercised.
- **`verify-esm-entrypoints`** — loads `./lib/index.js`, the entry Node actually resolves.

Between them, every condition a real consumer takes is covered. There is no gap of the shape the
first version of this finding asserted.

## The one gap that IS real: reachability

`verify-tarball-exports` reports, for a package whose `types` sits after `default`:

```
ok  @fgv/ts-json-base  . > default > types -> ./dist/ts-json-base.d.ts
```

That file exists, so the gate says `ok` — but `default` matches unconditionally, so **no resolver
ever reads that `types` key.** The gate is answering "does the named file exist" for a condition that
cannot be selected. Same for the sibling gates: all three check existence or consumption of the
condition *they* choose; none checks whether a declared condition is reachable at all.

This is the durable finding, and it is the one worth building. See the sibling
`twenty-one-packages-declare-an-unreachable-types-condition`.

## What this means for the emit decision

Three options; consumer cost is not where the design doc's framing implies:

1. **Stay CJS-only; stop shipping `dist`.** Consumers see no change — they already get CJS on every
   Node path, and the one browser branch pointing at `dist` can point at `lib/index.browser.js` like
   the other 24. Removes packed bytes and a whole category of confusion.
2. **Fix and activate the ESM emit.** Needs `{"type":"module"}` in `dist/`, fully-specified relative
   specifiers (~3,520 sites), and per-branch `types`. **Note the ordering trap:** adding
   `type: module` *first* is what would break the bundler path that works today, by engaging
   `fullySpecified` before the specifiers are fixed.
3. **Status quo.** Keep building and packing a tree that one browser branch references.

**The honest framing for a consumer conversation:** nobody is on our ESM path, so 1 and 2 are both
non-breaking. The decision is about what we want to offer, not about migrating anyone. And the
specifier work is not the price of `node16` — it is the price of having a working ESM emit at all.

## Optional tidy, independent of the decision

Point `@fgv/ts-bcp47`'s `browser`/`default` `import` at `./lib/index.browser.js`, matching the other
24. Not a bug fix — both bundlers handle the current shape — just consistency, and it makes option 1
a one-package smaller job. Not done here: an `exports` edit, which this stream's brief scopes as a
finding.
