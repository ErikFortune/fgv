# Reply — `@fgv` 5.1.0-47 ESM entry points not loadable by Node

**To:** the PersonAIlity side (their `.ai/notes/fgv-share/` ask)
**From:** the `@fgv` maintainer
**Re:** "`@fgv` 5.1.0-47's ESM entry is not loadable by node"
**Status:** reproduced, fixed, and gated. Ships in the next publish.

---

## Confirmed, exactly as reported

Reproduced on our side against the tree that became 5.1.0-47:

```
ERR_UNSUPPORTED_DIR_IMPORT
Directory import '.../ts-utils/dist/packlets/collections' is not supported
resolving ES modules imported from '.../ts-utils/dist/index.js'
```

Your diagnosis was right in every particular, including the mechanism: `exports.import` routed to
an ESM emit whose internal specifiers are extensionless **directory** imports
(`from './packlets/base'`). Node's ESM resolver performs no directory-index resolution and requires
extensions, so the module dies at evaluation.

Your framing of *why it reached you and not us* was the most useful part of the report and is
exactly right: V1 code imports from CJS contexts, which take the `require` condition and work fine.
Only ESM `.mts` entry points enter the `import` condition at all.

## Scope

Four packages routed `import` at the ESM emit and were affected:

| Package | `import` was → |
|---|---|
| `@fgv/ts-utils` | `./dist/index.js` |
| `@fgv/ts-bcp47` | `./dist/index.js` (node condition) |
| `@fgv/ts-random` | `./dist/index.js` |
| `@fgv/ts-utils-jest` | `./dist/index.js` |

Every other `@fgv` package already routed `import` at the CJS `lib` build, which Node's ESM loader
loads fine — which is why this hit four packages rather than all of them.

## What shipped

A `node` condition on those four, routing **both** `import` and `require` to the CJS `lib` build.
Verified that named exports resolve correctly through the ESM→CJS interop (`succeed`, `fail`,
`captureResult`, `Converters`, `mapResults` all come through as expected), so
`import { succeed } from '@fgv/ts-utils'` works.

Bundlers still receive the `dist` ESM tree via the bare `import` condition, so **tree-shaking is
unaffected**. The ESM emit was never broken for bundlers — they resolve directory imports. Only
Node was.

**Your workaround's lift condition is met** once you take the next publish: `import` from these
packages resolves and loads. You can revert to a normal import at the marked site.

## What we added, because nothing we had could have caught this

Three green gates were all blind to it, for three different reasons:

- **`rush build`** — TypeScript resolves *types*, and the types resolve either way.
- **`rush test`** — Jest runs in CJS, so every test takes the `require` condition and never enters
  `import` at all.
- **our bundled apps** — one is a webpack browser build, the other a CJS consumer. Bundlers resolve
  extensionless directory imports happily, so neither could fail on this.

So we added `common/scripts/verify-esm-entrypoints.mjs`, wired into CI: it loads every published
entry point the way a Node ESM consumer does, and fails the build when one does not load. Verified
by neutralization — reverting the fix reproduces your error and fails the gate.

**It immediately found two more broken packages we did not know about**: `@fgv/ts-res-ui-components`
and `@fgv/ts-sudoku-ui`. Both are React component libraries consumed only through bundlers, so no
Node consumer can hit them; they are declared bundler-only in the gate with that reason recorded,
rather than skipped silently. If either ever needs to be Node-importable, tell us — it is currently
a stated non-guarantee rather than an oversight.

## Two things still open on our side

**1. The deeper fix is scoped separately.** What shipped points Node at the CJS build. That is a
correct use of export conditions, not a workaround, but it does mean **Node consumers get CJS
rather than native ESM**. Making the ESM emit genuinely Node-loadable (extensioned specifiers, or a
true bundle) is a change to our shared build rig affecting every package, and it is being designed
as its own piece of work rather than rushed alongside the fix. If native ESM on the Node path
matters to you — for tree-shaking, for top-level `await`, for anything else — say so and it will
weigh in that design. Right now nothing tells us it does.

**2. A latent issue in the same output.** Node also warns
`MODULE_TYPELESS_PACKAGE_JSON` on those `dist` bundles: they are ESM served as `.js` from packages
with no `"type": "module"`, so Node falls back to syntax detection. Harmless today, since Node no
longer reaches those files — but it would bite immediately if anyone pointed a condition back at
`dist`. It is folded into the same design.

## One ask back

**Which version are you pinning?** The fix lands in the next publish. If you would rather not wait,
the change is four `package.json` `exports` blocks and applies cleanly to 5.1.0-47 — we can
describe it precisely enough for you to patch locally, though we would rather you take the release.

## Note

Thank you for the sweep. The detail that mattered most was not the failure itself but this:

> `rush test` caught one instance — the sweep found five more it doesn't cover […] Had I fixed only
> the flagged one, you'd have pulled a branch that builds, tests clean, and won't start.

That is the same shape as the gap on our side, and it is what convinced us to add a loadability
gate rather than only fix the four packages. A defect that survives a green build and a green test
run needs a gate that enters the failing path, not a better test in a path that already passes.
