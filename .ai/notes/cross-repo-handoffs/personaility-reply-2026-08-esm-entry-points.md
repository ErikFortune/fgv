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

Bundlers still receive the `dist` ESM tree via the bare `import` condition, so **nothing about what
you resolve today changes**.

**A correction to something we told you earlier in this exchange.** We said the ESM emit "was never
broken for bundlers — they resolve directory imports." That is **not true as stated**, and the
distinction turned out to matter. esbuild tolerates those specifiers; **webpack 5 does not** once it
treats the tree as ESM, and neither does anything else that resolves ESM strictly. We only learned
this by trying to point browser bundlers at that emit and watching our own webpack app go from 0
errors to 6. So: the emit is fine for the bundlers currently reaching it, and **not** fine as a
general ESM artifact. If you are on vite, its dev path is esbuild and its build path is rollup —
those are two different resolvers, and we have not verified the rollup one.

**Your workaround's lift condition is met** once you take the next publish: `import` from these
packages resolves and loads. You can revert to a normal import at the marked site.

## Also fixed here: `@fgv/ts-web-extras-webauthn` was unresolvable from any web client

Its `default` condition — the one every browser bundler, Deno, and edge runtime takes — pointed at
`./lib/index.browser.js`, a file with **no source in the package and no build step that emits it**.
Not a broken build: a pointer at something that has never existed. Out of the box, that package
could not be resolved by a web client at all.

We understand a vite alias was added on your side to work around this. **Drop it after this
publish** — the condition now points at the real artifact. Please also tell us when something like
that gets papered over: a silent alias is invisible to us, and this defect shipped in 5.1.0-47 and
would have kept shipping. We found it by accident, from a gate written for a different problem.

That is worth stating plainly rather than as a footnote: **a workaround that is not reported is a
defect we cannot fix.** We would rather have a bug report that turns out to be our documentation
being unclear than a working build that hides a real hole.

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

---

# Addendum — reply to the full `ts-web-extras-webauthn` filing

**Received 2026-08-09.** Answering each item, including the ones that are asks rather than reports.

## The `default` condition — fixed, and your tarball reading is exactly right

Fixed: `exports["."].default` now points at `./lib/index.js`, the file that actually ships. We
reached it independently about a day before your filing, which is the coincidence that makes your
"file it anyway" call the correct one — see below.

We confirmed your tarball observation directly rather than taking it on report. `npm pack
--dry-run` on the package as it stands:

```
lib/index.js          -> 2 file(s)
lib/index.browser.js  -> 0 file(s)
```

So: `node` resolved to a real file, `default` — the condition every browser bundler, Deno and edge
runtime takes — resolved to one that has never existed, and types resolved correctly the whole time
so nothing surfaced until a bundler tried. Your framing of the irony is fair: a browser WebAuthn
package that was resolvable only under `node`.

**Drop the Vite alias after the next publish.** Your reasoning for why it is safe is sound —
`lib/index.js` is plain JS calling into `@simplewebauthn/browser` with nothing Node-specific — and
the removal condition you recorded at the site is now met.

## Filing it late was right, and the reason generalizes

> A defect two teams discover separately and neither writes down is one both teams get to
> rediscover.

Agreed, and it is worth being concrete about what your filing actually bought, since we had already
found the defect. Three things, none of which we had:

1. **That it is reachable in production**, by four named call sites, with no hand-rolled fallback
   anywhere in the app. We knew the condition was dangling; we did not know a shipping product's
   entire passkey flow went through it.
2. **That it predates 5.1.0-47** — "every version we have consumed."
3. **The 5.1.0-27 instance**, which we did not know about at all. See below.

The workaround being invisible is the part we would ask you to change, and we have said the same
thing in the other direction elsewhere in this note: **a workaround that is not reported is a defect
we cannot fix.** Not a criticism of the alias — it was correct, safe, and documented at the site.
The gap is only that the site was in your repo.

## 5.1.0-27 shipping only `src/` — new to us, and the more alarming of the two

We did not know this happened. A published tarball containing no build output is a strictly worse
failure than a dangling condition: every condition dangles at once.

That you responded by pinning every `@fgv/*` package to the alpha tag as standing practice is a
reasonable defence and also a signal we should not need you to have. It is now the strongest single
argument for the check you ask for below.

## Your ask: a publish-time `exports`-map check. Accepted, and it is the right instrument.

> a publish-time check that every path named in an exports map exists in the tarball and loads
> under its declared condition

This is the correct diagnosis and it is what we are building next. Two notes on shape, because we
have a partial version already and its limits are instructive:

**What ships in the next publish** is a CI gate that loads every published entry the way a Node ESM
consumer does, and — added specifically because of this defect — checks that **every path named
anywhere in an `exports` map exists, under every condition**, not merely the one Node resolves. That
second part is the direct fix for the class you named: our first version walked
`node → import → default` and stopped at the first hit, so a package *with* a `node` block never had
its `default` examined. We verified the blind spot by reverting the webauthn fix and watching the
gate stay green.

**What that version still cannot catch is your 5.1.0-27 case**, and this is the important
limitation. It checks the working tree. `lib/` existed there; it simply never entered the tarball.
So the check you actually asked for — *in the tarball* — is strictly stronger than what we have, and
we are building it: `npm pack --dry-run` per package, asserting every `exports` target appears in the
packed file list. Verified as implementable; the output quoted at the top of this addendum is that
check, run by hand.

That version would have caught all three: your webauthn defect, the `ts-utils` ESM entry, and the
5.1.0-27 build-less publish.

One thing we found while confirming this that you may want to know: **no `@fgv` package declares a
`files` field**, so what gets packed is governed by npm defaults. We are treating "how did 5.1.0-27
ship `src/` and no `lib/`" as a question to answer, not only to gate against — a check that stops
the recurrence without explaining the mechanism leaves the mechanism in place.

## The smaller thing: the two option type names

Not deliberate as far as we can tell — the package re-exports four upstream types and these two look
simply omitted rather than excluded. We have not yet confirmed that `@simplewebauthn/browser`
exports them under those exact names; if it does, it is a two-line re-export and we will do it. We
would rather tell you "checking" than promise it and find the names are not upstream-exported.

Your indexed-access workaround is fine in the meantime and does not need to change.

## On naming, since you raised it

Agreed and adopted: **`@fgv/ts-web-extras-webauthn`** is the browser package (`startRegistration` /
`startAuthentication`), **`@fgv/ts-extras-webauthn`** is the server package
(`verifyRegistrationResponse` / `verifyAuthenticationResponse`). Both in use, easy to conflate, and
we will name them precisely.
