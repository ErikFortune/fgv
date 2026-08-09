# Reply — `@fgv` 5.1.0-47 ESM entry points not loadable by Node

**To:** the PersonAIlity side (their `.ai/notes/fgv-share/` ask)
**From:** the `@fgv` maintainer
**Re:** "`@fgv` 5.1.0-47's ESM entry is not loadable by node"
**Status:** reproduced, fixed, and gated. Ships in the next publish.

> **Updated 2026-08-09.** An earlier version of this note said the fix below would ship on its own
> in the next publish. It is not shipping on its own — it was held and folded into a single larger
> change that supersedes it, so the four `exports` blocks and the rest of the packaging work land
> together rather than moving every package's version twice under our lockstep policy. **The fix you
> need is unchanged and is in that change.**
>
> One correction to what this note previously said: the `MODULE_TYPELESS_PACKAGE_JSON` warning in
> "Still open" below is **not** fixed. We implemented the fix, found it breaks webpack consumers,
> and reverted it. Details there — it matters to you only if you bundle our packages with webpack,
> in which case the news is that we did *not* ship the thing that would have broken you.

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

## What ships

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

## Also in this change, beyond your report

Investigating the deeper fix turned up something bigger than the bug you hit. Most of it did **not**
ship, and the reason is worth passing on.

**Twenty of our twenty-four published packages already build a tree-shakeable ESM bundle that their
`exports` never points at.** Browser bundlers get the CommonJS build instead. We measured the cost
and it is real — `@fgv/ts-json-base` hands a bundler 130 KB where the ESM emit it already publishes
would give 41 KB on a narrow import.

We tried to claim that win by pointing browser bundlers at the ESM emit, verified it with esbuild,
and then discovered it **breaks webpack**. That emit contains extensionless directory imports
(`from './packlets/base'`) — the same thing that broke Node for you. esbuild tolerates them;
webpack 5 does not, and neither does any tool that treats the tree as real ESM. Our own webpack app
went from 0 errors to 6. So it was reverted, and the real precondition is now clear: **the emit has
to carry explicit specifiers before anyone can be pointed at it** — the same underlying fix as
native Node ESM, which we had been treating as a separate, lower-priority question. It is not
separate.

What *did* ship, beyond your four packages:

- **a second CI gate**, `verify-bundler-resolution.mjs`, which actually bundles every published
  package's browser entry for a browser target with node builtins deliberately not polyfilled, and
  fails on anything unresolved. It also now reports which packages could not safely be pointed at
  the ESM emit even though they bundle, so we cannot repeat the mistake above quietly;
- **a real defect that gate found in `@fgv/ts-bcp47`** — its browser entry transitively reached a
  filesystem loader and pulled `fs` and `path` into a browser graph. That one was already reachable
  by a browser consumer in 5.1.0-47. If you bundle `ts-bcp47` for a browser and carry a
  `resolve.fallback` for `path`/`fs`, you can drop it after this publish;
- **a fix to `@fgv/ts-web-extras-webauthn`**, whose non-Node condition pointed at a file that is
  never built — so browser bundlers, Deno, and edge runtimes could not resolve that package at all.

For you specifically: **nothing you resolve changes**, and no bundle sizes change yet.

## Still open on our side

**1. The deeper fix is scoped separately.** What ships points Node at the CJS build. That is a
correct use of export conditions, not a workaround, but it does mean **Node consumers get CJS
rather than native ESM**. Making the ESM emit genuinely Node-loadable (extensioned specifiers, or a
true bundle) is a change to our shared build rig affecting every package, and it is being designed
as its own piece of work rather than rushed alongside the fix. If native ESM on the Node path
matters to you — for tree-shaking, for top-level `await`, for anything else — say so and it will
weigh in that design. Right now nothing tells us it does.

**What changed since we wrote that:** we had been treating "make the ESM emit genuinely loadable"
as a nice-to-have with no demonstrated consumer, to be done only if someone asked. It turns out to
be the precondition for the browser-bundler work above as well, so it is now on the critical path
regardless of whether native Node ESM matters to you. Your answer to ask #2 no longer decides
*whether* we do it — only how we prioritise it.

**2. The latent issue in the same output — attempted, reverted, now better understood.** Node warns
`MODULE_TYPELESS_PACKAGE_JSON` on those `dist` bundles: ESM served as `.js` from packages with no
`"type": "module"`, so Node falls back to syntax detection. We said it was harmless today and would
bite the moment anything pointed a condition back at `dist`.

The obvious fix is a build-rig flag that emits a generated `dist/package.json` containing
`{"type":"module"}`, scoping the declaration to the ESM folder only. We implemented it, and it does
remove the warning. **It also breaks webpack**, for the reason above: declaring the tree ESM makes
webpack stop doing directory-index resolution, and the tree's extensionless directory imports then
fail. Reverted.

So the warning stays for now, and it stays *harmless* for now — nothing points Node at `dist`. The
real fix is explicit specifiers in the emit, which is the same fix as item 1. That is the honest
version: these are not two loosely-related cleanups, they are one change we have not made yet.

## Two asks back

**1. Which version are you pinning?** The fix lands in the next publish. If you would rather not
wait, the part you need is four `package.json` `exports` blocks and applies cleanly to 5.1.0-47 — we
can describe it precisely enough for you to patch locally, though we would rather you take the
release.

**2. Does native Node ESM actually matter to you?** This is the same question as before and it is
still unanswered, which matters more now than it did. The decision to leave Node on CJS is built on
the *absence* of a stated requirement rather than on a "no" — a weaker foundation, and one we would
rather replace with an actual answer. A "no, CJS is fine" is as useful to us as a "yes": it closes
the question either way. A "yes" costs us roughly 3,500 mechanical import rewrites and a permanent
authoring rule, so we would rather know than guess.

## Note

Thank you for the sweep. The detail that mattered most was not the failure itself but this:

> `rush test` caught one instance — the sweep found five more it doesn't cover […] Had I fixed only
> the flagged one, you'd have pulled a branch that builds, tests clean, and won't start.

That is the same shape as the gap on our side, and it is what convinced us to add a loadability
gate rather than only fix the four packages. A defect that survives a green build and a green test
run needs a gate that enters the failing path, not a better test in a path that already passes.
