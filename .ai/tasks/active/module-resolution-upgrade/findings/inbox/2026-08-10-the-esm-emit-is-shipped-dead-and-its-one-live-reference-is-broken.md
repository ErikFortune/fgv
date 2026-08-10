# The ESM emit is shipped, is dead, and its one live reference does not load

**Severity:** reframes the emit decision. One live instance of the 5.1.0-47 class, browser-branch only.

Surfaced answering "where does changing the emit leave our consumers?" — the answer turns out to
depend on a fact nobody had written down.

## Every consumer gets CommonJS today, on every path

Audited all 25 published packages' `exports` maps:

> **25 of 25 route `node.import` at `./lib/index.js` — the CommonJS build.**

`lib/` is CJS (`"use strict"; ... exports.X = ...; require(...)`). `dist/` is ESM (`import * as X
from './packlets/...'`). Both are built, both are packed, and **`dist/` is reached by nothing**
except one branch of one package (below). `main` is `lib/index.js` everywhere.

Node's ESM loader imports our CJS fine — `cjs-module-lexer` detects the named exports:

```
$ node --input-type=module -e "import('./libraries/ts-utils/lib/index.js').then(m => ...)"
LOADS, named exports visible: true
```

**So the ESM emit is not something consumers depend on. It is something they never receive.** That
inverts the usual risk framing of an emit change: this is not "migrate consumers off CJS", it is
"decide whether to activate a tree we already build, ship, and ignore".

## The one live reference is broken

`@fgv/ts-bcp47` is the sole package whose `default.import` points into `dist`
(`./dist/index.browser.js`). It does not load under Node's ESM loader:

```
ERR_UNSUPPORTED_DIR_IMPORT: Directory import '.../dist/packlets/bcp47' is not supported
  resolving ES modules imported from .../dist/index.browser.js
(node:...) [MODULE_TYPELESS_PACKAGE_JSON] Warning: ... doesn't parse as CommonJS.
  Reparsing as ES module because module syntax was detected.
```

Both halves of the 5.1.0-47 defect, still present: extensionless directory specifiers, and **no
`dist/package.json` with `{"type":"module"}`** in any package (checked all 25).

**Exposure is narrower than it looks**, and worth stating precisely rather than alarming:

- A **Node** consumer never takes this path — `node` matches before `default`.
- A **browser bundler** does. esbuild resolves extensionless directory imports, which is why
  `verify-bundler-resolution` passes; **webpack 5 does not** once it treats the tree as ESM (see that
  gate's header — the repo's own webpack app went 0 → 6 errors when this was tried).

So it works today for esbuild/rollup-based consumers and would fail for a webpack one. It is also
simply inconsistent: the other 24 packages point their browser branch at `lib/index.browser.js`.

## What this means for the emit decision

Three options, and the consumer cost is not where the design doc's framing implies:

1. **Stay CJS-only; stop shipping `dist`.** Consumers see no change — they already get CJS on every
   path. Removes ~half the packed bytes and deletes the entire class of "the ESM tree is broken"
   defects, because there would be no ESM tree. Costs: no native ESM story, ever.
2. **Fix and activate the ESM emit.** Needs `{"type":"module"}` in `dist/`, fully-specified relative
   specifiers throughout (the ~3,520-site change), and per-branch `types`. This *is* Option B, and
   it is the same prerequisite `node16` needs — which is the point: **the specifier work is not the
   price of `node16`, it is the price of having a working ESM emit at all.** We are paying to ship it
   and getting nothing.
3. **Status quo.** Keep building and packing a tree that one package references and that does not
   load. Cheapest today, and the option that keeps generating this class of finding.

**The honest framing for a consumer conversation:** nobody is on our ESM path, so 1 and 2 are both
non-breaking for them. The decision is about what we want to offer, not about migrating anyone.

## Recommended immediate action, independent of the decision

Point `@fgv/ts-bcp47`'s `default.import` at `./lib/index.browser.js`, matching the other 24. That is
a one-line change removing a live inconsistency, and it does not prejudge options 1–3.

Not done here: it is an `exports` edit, which this stream's brief scopes as a finding.
