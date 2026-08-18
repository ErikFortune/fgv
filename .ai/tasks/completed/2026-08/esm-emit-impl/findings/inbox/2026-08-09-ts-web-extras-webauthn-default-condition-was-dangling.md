# Finding — `@fgv/ts-web-extras-webauthn`'s `default` condition pointed at a file that is never built

**Found by:** `esm-emit-impl` (the R5 gate, on its first full run)
**Severity:** shipped defect — the package was unresolvable for every non-Node consumer
**Status:** **fixed in this stream** (an `exports`-only change, in scope), recorded here because it is
a defect in a package this stream was not chartered to touch

## What

`libraries/ts-web-extras-webauthn/package.json` declared:

```json
"default": { "import": "./lib/index.browser.js", "require": "./lib/index.browser.js" }
```

There is no `src/index.browser.ts` in that package — `src/` contains only `index.ts` — so
`lib/index.browser.js` is never emitted. A full `rush rebuild` succeeds and the file still does not
exist.

`default` is the condition taken by **every consumer that is not Node**: browser bundlers, Deno,
edge runtimes. All of them fail to resolve the package at all. Node consumers were unaffected,
because the `node` condition correctly names `./lib/index.js`.

The value was copied from `@fgv/ts-web-extras`, which *does* have an `index.browser.ts`. The two
sibling packages that do not (`ts-web-extras-argon2`, `ts-web-extras-transformers`) both point their
non-node condition at `./lib/index.js`.

## Why nothing caught it

The same blind spot the R5 gate was built for. `rush build` resolves types (which come from `types`,
not `default`), Jest takes `require` through the `node` block, and no app imports this package. The
first thing in the repo to read the `default` condition was the gate.

Worth noting the gate *initially* masked it too: a missing artifact was reported as
`SKIP … (not built)`, which is indistinguishable from a package that simply has not been compiled
yet. The gate now fails instead when the package has produced build output but the specific named
artifact is absent, which is what turned this from a skip into a finding.

## Disposition

Fixed here by pointing `default` at `./lib/index.js`, matching its two sibling packages. This is an
`exports`-only change, explicitly in this stream's scope, and leaving it red was not an option —
the gate it was found by is landing in CI in the same PR.

No source was changed, and no other package's `exports` was touched for this reason.
