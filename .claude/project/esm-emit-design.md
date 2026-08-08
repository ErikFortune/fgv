# ESM emit design

**Status:** design complete, awaiting review. **No implementation has been done in this stream** —
no source, config, rig, or `package.json` change is in its diff. An implementation stream is
commissioned from this document, not by it.

**Stream:** `esm-emit-design`, branch `esm-emit-design` from `release` @ `792b87b5e`.
**Prior art this builds on:** the interim fix on `fix/esm-node-entry-points` (a `node` condition
routing Node at the CJS build, plus `common/scripts/verify-esm-entrypoints.mjs` in CI). That fix is
correct and stays. This document weighs what it costs.

---

## 0. Summary — the finding that reframed the stream

The stream was commissioned to decide how to make the ESM emit Node-loadable. The evidence says
that is the *less* valuable of two problems in the same emit, and the more expensive one.

Measured, on the actually-published `5.1.0-47` artifacts (method in §7):

| Package | What a browser bundler gets today | Bundled, minified | If routed at the ESM emit | Delta |
|---|---|---|---|---|
| `@fgv/ts-utils` (`import { succeed }`) | ESM (`dist`) | **7.1 KB** | — | already correct |
| `@fgv/ts-json-base` (`import { JsonSchema }`) | **CJS (`lib`)** | **130.0 KB** | 37.4 KB | **−92.6 KB (3.5×)** |

`@fgv/ts-json-base` **already builds and publishes** a tree-shakeable ESM bundle in `dist`. Its
`exports` block simply does not point at it — browser bundlers take `default.import → ./lib/…`,
which is CommonJS. **Twenty of the twenty-four published packages are in this position.** The four
that are not are exactly the four that broke for the consumer.

So the dual emit's real defect is not only that Node cannot load it. It is that:

- for **4 packages** it is wired to bundlers *and* (until the interim fix) wrongly to Node — the
  reported bug;
- for **17 packages** it is built and published and **referenced by nothing at all** — dead output
  carrying a measured 3.5× payload cost for browser consumers who could have had it.

Meanwhile native Node ESM, the thing the stream is named after, **has no demonstrated consumer**
(OQ-1, §8). The recommendation follows that asymmetry rather than the stream's name.

---

## 1. What consumers actually need

### The consumer shapes and the condition each takes

Conditions are matched by Node and by bundlers in the order they appear in the `exports` object,
most-specific-first. The repo's published packages use four keys: `node`, `browser`, `default`,
`types`.

| Consumer shape | Condition taken | What it needs | Status today |
|---|---|---|---|
| **Node ESM** (`import` from `.mjs` / `"type":"module"`) | `node.import`, else `import`, else `default` | A file whose *internal relative specifiers Node can resolve* | Broken pre-fix on 4 packages; correct post-fix (routed to CJS) |
| **Node CJS** (`require`) | `node.require`, else `require`, else `default` | CJS | Always worked. This is what `samples/testbed` is. |
| **Bundler, browser target** (webpack/vite/esbuild) | `browser` if present, else `import`, else `default` | ESM, for tree-shaking | Correct on 4; **CJS on 20** |
| **Jest** (`heft-jest`, CJS transform) | `require` | CJS | Always worked. Never enters `import`. |
| **`tsx` / `ts-node --esm`** | same as Node ESM | same as Node ESM | same as Node ESM |
| **TypeScript type resolution** | `types` | `.d.ts` | Resolves either way — which is why `rush build` was green. |

The three green gates that missed the original bug map exactly onto this table: `rush build` reads
only the `types` row, `rush test` only the Jest row, and the bundled apps only the bundler row.
**No gate read the Node-ESM row.** `verify-esm-entrypoints.mjs` now does. §6 argues the bundler row
needs the same treatment before any of the changes below ship.

### What tree-shaking is actually worth here — measured, not assumed

The brief asks for evidence rather than the usual assumption that `sideEffects: false` plus ESM is
self-evidently worth having. It is worth a great deal in one place and almost nothing in another,
and the difference is structural.

| Case | ESM (`dist`) | CJS (`lib`) | Ratio |
|---|---|---|---|
| `ts-utils`, narrow (`succeed` only) | 7,071 B | 91,950 B | **13.0×** |
| `ts-utils`, broad (`Collections` + `Converters`) | 52,292 B | 91,961 B | 1.76× |
| `ts-json-base` (`JsonSchema`) | 37,367 B | 130,004 B | **3.48×** |
| `ts-bcp47` (`Bcp47`) | 775,777 B | 818,675 B | **1.06×** |

The pattern: tree-shaking pays in proportion to how *narrowly* the consumer imports and how
*granular* the barrel is. `ts-utils` re-exports named functions, so a `succeed`-only consumer drops
92% of the package. `ts-bcp47`'s public surface is the `Bcp47` namespace object over an IANA
registry that is reachable in one piece — a namespace re-export is an all-or-nothing edge to a
bundler's reachability graph, so tree-shaking recovers 5%.

**Consequences for this design.** (a) Tree-shaking is real value and "delete the ESM emit"
therefore has a measured price, not a rhetorical one — it is not free even though nothing loads it
in Node. (b) The value is concentrated in the granular-barrel packages, and `ts-json-base`,
`ts-extras`, and `ts-res` are all granular-barrel packages routed at CJS today. (c) Adding a
namespace re-export to a barrel silently forfeits most of the benefit — worth knowing, not worth a
rule.

`sideEffects: false` is already set on every published library except `@fgv/ts-random`,
`@fgv/ts-utils-jest`, and `@fgv/ts-app-shell` (which correctly narrows it to `["**/*.css"]`). It is
a precondition for the numbers above, and it is already in place. It is not the missing piece.

---

## 2. The options, each costed

### The mechanism, stated once

TypeScript **does not rewrite import specifiers, ever**. `./packlets/base` in source is
`./packlets/base` in every emit, under every module kind, with every extension option. CommonJS
survives this because `require` does directory-index resolution; Node's ESM resolver does not, and
also requires an explicit extension. Every option below is a way of arranging for the specifier
that TypeScript copies through to be one Node can resolve.

### Option A — `emitMjsExtensionForESModule: true`

**Verdict: eliminated. It does not do the thing the brief identified as the crux.** This was the
option most likely to be a cheap win, so it was tested first and hardest.

Two findings, both from running Heft `1.2.7` with `@rushstack/heft-node-rig` `2.11.27` and
TypeScript `5.8.3` — the versions the rig pins (§7 has the harness):

**A1 — it is not compatible with the current rig arrangement at all.** Setting it alongside the
existing `additionalModuleKindsToEmit` fails the build outright:

```
Error: Module kind "99" is already emitted at <pkg>/lib with extension '.mjs'
by option emitMjsExtensionForESModule.
```

The option emits ESNext into **tsconfig's `outDir` (`lib`)** with an `.mjs` extension. It is an
*alternative* to `additionalModuleKindsToEmit: [{ esnext → dist }]`, not a modifier of it — both
claim the ESNext module kind, and the plugin rejects the collision. Adopting it means abandoning
the `dist` ESM tree, which is what four packages' `exports` and `module` fields point at.

**A2 — with the collision removed, it still does not fix anything.** Run alone, it emits `.mjs`
alongside `.js` in `lib`, and the specifiers are **untouched**:

```js
// lib/index.mjs — emitted with emitMjsExtensionForESModule: true
import * as Base from './packlets/base';        // ← not rewritten
import { helper } from './packlets/other';      // ← not rewritten
```

```
$ node -e "import('./lib/index.mjs')"
ERR_UNSUPPORTED_DIR_IMPORT  Directory import '.../lib/packlets/base' is not supported

$ node -e "import('./lib/packlets/base/index.mjs')"
ERR_MODULE_NOT_FOUND        Cannot find module '.../lib/packlets/base/thing'
```

Note the second failure. The option does not merely fail to convert a *directory* specifier into
`./packlets/base/index.mjs` — it does not append an extension to a plain *file* specifier either.
It changes output filenames and nothing else. An `.mjs` emit is therefore **strictly worse** than
the current `.js` emit: it fails on every relative specifier rather than only on directory ones, in
exchange for removing a warning that §4 removes for free.

**Cost if adopted anyway:** loss of the `dist` tree, four `exports` blocks rewritten, and a build
that still does not load. **There is no configuration of this option that solves the problem.**

### Option B — explicit specifiers in source

Write `from './packlets/base/index.js'` instead of `from './packlets/base'`, repo-wide. The `.js`
suffix is TypeScript's convention for "the emitted sibling of this `.ts` file"; it is what both
emits then contain, and it is resolvable by Node's ESM loader and by `require` alike.

**Verified to work, end to end** (§7, variants D–F): with explicit specifiers, the ESM emit loads
natively in Node (`LOADED [ 'Base', 'helper', 'top' ]`), the CJS emit continues to `require`
cleanly, and cross-packlet specifiers (`../base/index.js`) behave the same.

**Verified: `moduleResolution: node16`/`nodenext` is NOT forced.** The brief flagged this as a cost
input. It is not one. The spike compiled under the rig's effective settings — `module: commonjs`,
`moduleResolution` unspecified (so TypeScript's `node10` default) — and `./packlets/base/index.js`
specifiers type-checked and emitted correctly with no compiler-option change whatsoever. This
removes the largest speculative cost from this option.

**Cost, sized honestly.** Counting relative `from '…'` specifiers in `src` across all packages
(excluding those already carrying `.js`/`.json`/`.css`):

| | Count |
|---|---|
| Relative specifiers to rewrite, published packages | ~3,190 |
| Including private/sample packages | **3,520** |
| Files touched | **~1,300** |
| Largest single package | `ts-res`, 733 specifiers / 244 files |

Plus test files, not counted above.

The rewrite is **mechanical and scriptable** — for each specifier, resolve it against the source
tree; if it lands on a directory, append `/index.js`; if on a file, append `.js`. A codemod (ts-morph
or the TypeScript compiler API) does this deterministically, and the build plus
`verify-esm-entrypoints.mjs` verify it. It is a large diff but a low-risk one, and it can be done
one package at a time.

The durable cost is not the diff — it is the **permanent authoring rule**. Every new import in the
repo must carry an extension forever, enforced by a lint rule
(`import/extensions` with `{ ts: 'never', js: 'always' }` or equivalent), because nothing else in
the toolchain notices when one is missing: `rush build` is green either way, `rush test` is green
either way, and only the Node-ESM gate catches it, per-package, after the fact.

**This is the only option that makes the ESM emit genuinely Node-loadable without adding a
bundling step.** §3 argues for deferring it, not against it.

### Option C — bundle the ESM output to a single file

Add a rollup/esbuild pass over the ESM emit, producing one `dist/index.mjs` with no internal
relative specifiers at all. Symmetrical with what API Extractor already does for `.d.ts` (which
also lands in `dist`, alongside the JS emit).

**Feasibility is not in question** — the measurement harness in §7 does exactly this with esbuild
and produces a loadable, tree-shakeable single file. Tree-shaking survives bundling: the 7.1 KB
`ts-utils` figure *is* a single-file esbuild output, so a pre-bundled ESM entry does not forfeit the
value in §1 (rollup/esbuild preserve ESM export granularity, and `sideEffects: false` still applies).

**Cost.**
- A new build tool in the rig, and a new build step in every package's critical path.
- **Source maps degrade.** Consumers currently debug against per-file emits that map 1:1 to source.
  A bundle maps through a second transform; fidelity depends on tool configuration and is a real
  regression for anyone stepping into `@fgv` code.
- **Cross-package boundaries need care.** `@fgv` packages import each other. The bundle must treat
  sibling `@fgv/*` packages as external, or every package inlines its dependencies and the install
  grows superlinearly while dedup disappears.
- It does not remove the need for Option B if the *CJS* build is ever expected to be consumed
  per-file, and it leaves the source tree's specifiers as the odd artifact out.

**When it becomes the right answer:** if the repo ever wants a genuinely optimized published
artifact (minified, single-file, no per-file overhead) rather than a faithful compilation. That is a
different goal from "Node can load it", and this design does not recommend adopting the cost of the
former to achieve the latter.

### Option D — drop the dual emit, ship CJS only

The honest baseline. Delete `additionalModuleKindsToEmit` from the rig; publish `lib` only; point
every condition at it. `dist` stays, because API Extractor's `.d.ts` rollup lives there.

**What is lost, and for whom.** Not "nothing". Browser bundler consumers of the four wired packages
lose the numbers in §1: **85 KB on a narrow `ts-utils` import, 40 KB on a broad one, 43 KB on
`ts-bcp47`.** Node consumers lose nothing (they are on CJS already, by the interim fix). Jest and
CJS consumers lose nothing.

**And it forecloses the larger win.** The 17 unreferenced ESM emits are dead *today*, but they are
dead because nothing points at them, not because they are worthless — §0 measures 92.6 KB sitting
unclaimed in `ts-json-base` alone. Deleting the emit converts a wiring gap into a permanent
capability loss and makes the §3 recommendation impossible.

**Verdict: rejected**, and specifically rejected on measured evidence rather than on principle.
This is the option OQ-1 invites, and it would have been the right call if the ESM emit were
genuinely unused — but it is not unused, it is *under-used*.

---

## 3. Recommendation

**Keep the interim shape for Node. Stop treating the ESM emit as a Node-loading problem and start
treating it as a bundler-wiring one. Defer native Node ESM until a consumer asks.**

Concretely, in the order an implementation stream should do them:

**R1 — Keep the interim `node` condition. Node consumers get CJS.** No consumer has said that is
insufficient (OQ-1, §8). The alternative (Option B) costs ~3,520 specifier rewrites and a permanent
authoring rule, against zero demonstrated demand.

**R2 — Add `emitModulePackageJson: true` to the rig's `additionalModuleKindsToEmit` entry.** One
line. Verified (§7, variant C) to write `dist/package.json` containing `{"type":"module"}` and to
eliminate `MODULE_TYPELESS_PACKAGE_JSON` entirely. See §4.

**R3 — Route *browser bundlers* at the ESM emit, package by package, via the `browser` condition.**
This is where the measured value is. `@fgv/ts-bcp47` already has exactly this shape
(`browser: { import: './dist/index.browser.js' }`), so this is an in-repo precedent being extended,
not a new pattern. Use `browser` rather than `default` deliberately: `default` is also what a
non-Node ESM runtime (Deno, an edge runtime) would take, and pointing *that* at the directory-import
emit would recreate the original bug in a new place. `browser` is claimed by bundlers targeting the
browser and by no runtime that must actually resolve the specifiers.

**R3 is gated on R5.** Do not do it blind — see the `ts-bcp47` finding in §6.

**R4 — For packages that will not be routed at the ESM emit, stop emitting it.** After R3, any
remaining package whose `dist` JS nothing references is building dead output. The clean lever is
per-package: move it to `@rushstack/heft-node-rig` (which is what the CLIs and `ts-http-storage`
already use) rather than adding a rig flag. Low value, near-zero risk, entirely optional — record
it in `docs/FUTURE.md` rather than blocking R2/R3 on it.

**R5 — Add a bundler-resolution gate, sibling to `verify-esm-entrypoints.mjs`.** See §6.

### Why this over the runner-up

**The runner-up is Option B (explicit specifiers).** It is the only option that actually delivers
native Node ESM, it is verified to work, and its largest feared cost (`moduleResolution: node16`)
turned out not to exist. It is a legitimate choice and this design does not argue it is wrong — it
argues it is **premature**.

The distinguishing reasoning: Option B pays ~3,520 edits, a permanent lint rule, and a repo-wide
authoring change to buy a capability **no consumer has requested**, while the recommendation pays a
one-line rig change and ~20 `exports` edits to buy a capability that is **measured at 3.5× payload
on a package with real browser consumers**. Same emit, same build, radically different
evidence-to-cost ratios. When one option's benefit is measured in kilobytes on shipping consumers
and the other's is measured in hypotheticals, the ordering is not close.

The recommendation is also **not exclusive of** Option B. R1–R5 leave the source tree untouched, so
adopting explicit specifiers later is exactly as cheap then as it is now — the codemod does not get
harder. This is deferral, not foreclosure. Option D, by contrast, *is* exclusive: it deletes the
thing R3 wires up.

### What would change my mind

Any one of these flips the recommendation to Option B:

- **A consumer states a native-ESM requirement.** Top-level `await` in a `@fgv` package, `import.meta`
  usage, an ESM-only downstream dependency, or a runtime that will not load CJS (Deno, some edge
  runtimes) — any of these makes CJS-for-Node a real constraint rather than a notional one. The
  PersonAIlity reply asked this question directly and the answer, so far, is silence.
- **The repo adopts `moduleResolution: node16`/`nodenext`** for any other reason. Explicit
  specifiers become mandatory at that point, so Option B's cost is already sunk and its benefit
  becomes free.
- **A second consumer hits the same class of failure** through a path the `node` condition does not
  cover — e.g. a subpath export, or a bundler that ignores conditions. That would be evidence the
  condition-routing approach is load-bearing in more places than it can hold.

And one that flips it to Option D: **if R5 shows that routing bundlers at the ESM emit is broadly
unsafe** — that is, if the `ts-bcp47` node-builtin leak (§6) turns out to be the rule rather than
the exception across the 20 packages — then the ESM emit is not merely unwired but unusable, and
the case for keeping it collapses.

---

## 4. `"type": "module"` and the typeless warning — settled

**Do not add `"type": "module"` to any package's root `package.json`. Use
`emitModulePackageJson: true` instead.**

The `MODULE_TYPELESS_PACKAGE_JSON` warning fires because the ESM emit is `.js` in a package whose
nearest `package.json` has no `type` field, so Node reparses after sniffing syntax:

```
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to <pkg>/package.json.
```

Node's own advice is wrong for this repo. A root `"type": "module"` would declare **every** `.js`
in the package ESM — including the entire CJS `lib` tree, which would immediately fail to load. The
dual emit's whole premise is two module kinds in one package, and the root `type` field cannot
express that.

Heft already ships the correct mechanism, and it was found by reading the plugin's own schema
rather than the docs: `additionalModuleKindsToEmit[].emitModulePackageJson`. **Verified by running**
(§7, variant C): it writes

```json
// dist/package.json — generated
{ "type": "module" }
```

which scopes the declaration to the ESM output folder only. `lib` is unaffected. The warning is
gone in the same run that reproduced it without the flag.

This is a **one-line rig change with no publish-shape change** (the generated `dist/package.json` is
build output, not an authored file), and it is worth doing under *any* of the options in §2 — it is
the one recommendation here that is independent of the recommendation. It is also a latent-bug fix
in the precise sense the handoff note flagged: harmless while nothing points at `dist`, and biting
immediately if anything ever does. R3 makes something point at `dist`. R2 must land first.

---

## 5. How the gate changes

`verify-esm-entrypoints.mjs` declares `@fgv/ts-res-ui-components` and `@fgv/ts-sudoku-ui`
bundler-only. **The recommendation neither makes them loadable nor makes the declaration
unnecessary. The declaration stays, and its stated reason should be sharpened — it is currently
right about the symptom and vague about the cause.**

**Verified** (by reading the pinned `@rushstack/heft-web-rig@1.4.3`, `profiles/library/tsconfig-base.json`,
and both packages' `config/rig.json`):

| | dual-rig packages | the two React libraries |
|---|---|---|
| Rig | `@fgv/heft-dual-rig` | `@rushstack/heft-web-rig`, `library` profile |
| `lib` module kind | `commonjs` | **`esnext`** |
| `dist` JS emit | esnext | **none** |
| CJS build exists? | yes | **no** |

These two packages are a **structurally different problem**, not a milder instance of the same one.
The dual-rig packages have a working CJS build that the `node` condition can point at — which is
exactly what the interim fix did. The web-rig packages have **only** an ESM build, in `lib`, with
directory imports, and no CJS anywhere to fall back to. Nothing in R1–R5 touches them, because
nothing in R1–R5 touches the web rig.

Making them Node-loadable would require either moving them to the dual rig (they are React
component libraries with `.tsx` and CSS — a real port, not a config swap) or applying Option B's
codemod to them specifically. Neither is justified by any consumer need: both are consumed through
webpack only, and one of them (`ts-sudoku-ui`) belongs to the sudoku packages already slated to
leave this repo.

**Recommended gate changes:**

1. **Keep both `BUNDLER_ONLY` entries.** Amend each reason from "Its `lib` build is ESM with
   directory imports" to name the cause: *"Built with `@rushstack/heft-web-rig` (`library`
   profile), which emits `module: esnext` to `lib` and produces no CJS build. There is no artifact
   for a `node` condition to point at."* The current wording reads as a property of the output; the
   amended wording names the rig decision that produced it, which is what a future reader needs in
   order to know what changing it would cost.
2. **Add the bundler-resolution gate (R5)** — see §6. `verify-esm-entrypoints.mjs` reads the
   Node-ESM row of the §1 table. Nothing reads the bundler row, and R3 makes the bundler row
   load-bearing.
3. **No change to the script's resolution logic.** Its hand-rolled `resolveImportTarget` already
   walks `node` → `import` → `default` in Node's precedence order. If R3 adds `browser` blocks, the
   script correctly ignores them — Node does not take `browser`, and the script models Node.

---

## 6. Migration and blast radius

### Is it breaking?

**No, under the recommendation.** Every step is additive at the resolution layer:

| Change | Who resolves differently | Breaking? |
|---|---|---|
| R2 `emitModulePackageJson` | nobody — adds a generated `dist/package.json` | No |
| R3 `browser` condition added | browser bundlers only; `node`/`require`/`default` untouched | No, but see below |
| R4 drop unreferenced emit | nobody — the artifact is unreferenced by construction | No |
| R5 new gate | nobody (CI only) | No |

Node ESM, Node CJS, and Jest consumers see **no resolution change at all**. That is the point of
using `browser` rather than `default`.

### Where the real risk is, and it is not resolution

**R3 changes what browser bundlers compile, and the ESM tree has never been compiled by a bundler
for 20 of these packages.** It builds; it has never been *bundled*. Those are different claims, and
the difference is not theoretical:

While measuring §1, bundling `@fgv/ts-bcp47`'s **browser** entry for a browser target failed:

```
✘ [ERROR] Could not resolve "path"
    node_modules/@fgv/ts-bcp47/dist/packlets/iana/languageRegistriesFileLoader.js:31:17
✘ [ERROR] Could not resolve "fs"
```

`index.browser` transitively reaches `languageRegistriesFileLoader`, which imports node `path` and
`fs`. This is **not** caused by anything in this design — it is present in the shipped 5.1.0-47, in
**both** the `dist` (ESM) and `lib` (CJS) browser builds, and it is a pre-existing packaging defect
in a package that already routes browsers at `dist`. It is filed to the findings inbox, not fixed
here.

But it is precisely the class of problem R3 would propagate to 20 more packages if applied blind.
Hence **R5: a bundler-resolution gate must land before R3**, and R3 must be applied per-package
behind it.

**Shape of the gate.** Mirror `verify-esm-entrypoints.mjs`'s posture — enter the failing path
rather than assert around it. For each published package, resolve the `browser`/`import` condition
the way a bundler does, run a real bundle of a trivial entry against it with
`platform: 'browser'` and node builtins **not** polyfilled, and fail on any unresolved import.
esbuild is sufficient and fast (the whole §1 measurement ran in seconds). A package that legitimately
requires a node builtin declares itself, on the record, in the same style as `BUNDLER_ONLY` — the
script's own comment makes the case for declaration-over-silent-skip better than this document can.

### Lockstep versioning

Everything publishes together, so a change here moves every package's version whether or not that
package changed. That is the standing cost of the policy, not a cost of this design — and it is an
argument *for* batching R2 + R3 + R5 into one implementation stream rather than trickling them.

The consumer-visible delta from a batched R2+R3: **browser bundles get smaller, and nothing else
changes.** That is a release note, not a migration guide. No consumer action is required; no
`exports` key any consumer currently resolves is removed or repointed.

### Recommended sequencing for the implementation stream

1. R2 (rig, one line) + R5 (gate) — independent, low-risk, verifiable on their own.
2. Run R5 across all packages and **triage what it finds before touching any `exports` block.** The
   `ts-bcp47` result says the yield here is non-zero.
3. R3 per-package, in ascending order of measured benefit, each behind a green R5.
4. R4 as cleanup, or defer to `docs/FUTURE.md`.

Option B, if a consumer ever asks for it, is a separate stream and remains exactly as cheap as it is
today.

---

## 7. What was verified by running

Everything in §2 and §4 about tool behavior was run, not read. Two harnesses, both in a scratch
directory, both deleted.

**Harness 1 — Heft spike.** A standalone package with `@rushstack/heft@1.2.7` +
`@rushstack/heft-node-rig@2.11.27` + `typescript@5.8.3` (the versions `rigs/heft-dual-rig/package.json`
pins), `config/heft.json` extending the node rig, and a source tree mirroring the repo's shape:
`src/index.ts` with a directory import (`./packlets/base`) and a file import, `src/packlets/base/index.ts`
re-exporting `./thing`. Node 22.22.2.

| Variant | Config | Result |
|---|---|---|
| A | `emitMjsExtensionForESModule: true` + existing `additionalModuleKindsToEmit` | **Build error** — `Module kind "99" is already emitted at lib with extension '.mjs'` |
| A′ | `emitMjsExtensionForESModule: true` alone | Emits `lib/*.mjs`; **specifiers unrewritten**; `ERR_UNSUPPORTED_DIR_IMPORT` on the directory import and `ERR_MODULE_NOT_FOUND` on the file import |
| B | the repo's current config, verbatim | **Reproduces both reported symptoms** — `ERR_UNSUPPORTED_DIR_IMPORT` + the typeless reparse warning |
| C | B + `emitModulePackageJson: true` | Emits `dist/package.json` = `{"type":"module"}`; **typeless warning gone**; dir-import failure remains (as expected) |
| D | explicit `./x/index.js` specifiers, unchanged compiler options | **ESM emit loads natively**; CJS emit still `require`s cleanly; **no `moduleResolution` change needed** |
| E | D + C | **Loads clean, no warning** — the shape Option B would ship |
| F | E + a cross-packlet `../base/index.js` specifier | Loads clean |

**Harness 2 — published-artifact measurement.** `@fgv/ts-utils@5.1.0-47`, `@fgv/ts-bcp47@5.1.0-47`,
`@fgv/ts-json-base@5.1.0-47` installed from npm; bundled with `esbuild@0.28.1`
(`--bundle --minify --format=esm --platform=browser`), node builtins externalized where present so
ESM and CJS are compared on equal terms.

- Reproduced the consumer's exact error against the **published** artifact:
  `ERR_UNSUPPORTED_DIR_IMPORT … resolving ES modules imported from …/ts-utils/dist/index.js`.
- Confirmed `lib` is CJS (`"use strict"` + `require`) and `dist` is ESM on the published tree.
- All four size figures in §1 and the two in §0.
- Discovered the `ts-bcp47` node-builtin leak in the browser entry (§6).

**Also verified by reading pinned sources rather than docs:** `emitModulePackageJson`'s existence
and semantics (`heft-typescript-plugin`'s `typescript.schema.json`), the module-kind collision check
(`TypeScriptBuilder.js`), `heft-node-rig`'s `module: commonjs`, and `heft-web-rig@1.4.3`'s
`library` profile `module: esnext`.

**Static analysis (counted, not run):** the 3,520 / ~1,300 sizing in Option B; the rig-per-package
table in §5; the fact that exactly four packages reference a `dist/*.js` artifact.

### What remains inferred

- **That no consumer needs native Node ESM.** This is an absence of evidence — the PersonAIlity
  reply asked and got no answer. It is the load-bearing premise of the recommendation and it is
  recorded as OQ-1, not as a finding.
- **That the R3 wins generalize** beyond the three packages measured. The mechanism (granular
  barrel → large win; namespace barrel → small win) is understood and the direction is not in
  doubt, but only `ts-utils`, `ts-bcp47`, and `ts-json-base` were measured. R5's rollout should
  measure each package it touches.
- **Source-map fidelity under Option C.** Asserted as a cost from how bundlers work; not measured,
  because Option C is not recommended.
- **That `browser` is taken by every bundler of interest.** True of webpack, vite, rollup, and
  esbuild by documented default; not exercised against each one here.

---

## 8. Open questions

**OQ-1 — does native Node ESM matter to any real consumer today? STILL OPEN, and answered "no
evidence either way" rather than "no".** The interim fix gives Node consumers CJS; the handoff note
asked PersonAIlity directly whether native ESM matters to them; no answer has come back. The
recommendation is built on that silence, which is a weaker foundation than a stated "no". **The
implementation stream should not treat OQ-1 as closed.** If a Node ESM requirement surfaces before
R3 lands, re-read §3's "what would change my mind" before proceeding.

Note that the brief's suggested resolution of OQ-1 — "keep the interim shape, delete the broken
`dist` ESM emit, and stop maintaining a build nothing loads" — is **half right and half wrong on
measured evidence**. Keeping the interim shape: right. Deleting the emit: wrong, because the emit is
not unloaded-because-worthless but unloaded-because-unwired, and §0 measures 92.6 KB of unclaimed
value in one package. The brief explicitly permitted the delete outcome; the evidence does not
support it.

**OQ-2 — is `module: "dist/index.js"` also a liability? RESOLVED: no, today; conditionally, later.**
Exactly four packages carry `module`, and they are the same four that route `import` at `dist`:
`ts-utils`, `ts-bcp47` (`dist/index.browser.js`), `ts-random`, `ts-utils-jest`. In every case
`module` points at **the same artifact** `exports` already routes bundlers to, so it is consistent,
redundant, and honored only by tooling too old to read `exports` (webpack 4, old rollup). It is not
a liability in its current form.

It **becomes** one under R4: if a package's `dist` JS emit is removed while `module` still points at
it, `module` becomes a dangling pointer that legacy bundlers will follow into nothing. Rule for the
implementation stream: **`module` must be removed in the same commit that stops emitting what it
points at.** Under R3, packages newly routed at the ESM emit should get a `browser` condition and
**not** a new `module` field — `module` is a pre-`exports` compatibility shim and there is no reason
to add new instances of it.

**OQ-3 — is the dual emit earning its cost? RESOLVED: yes in principle, no as currently wired.**
The dual emit is the right architecture — the two module kinds serve genuinely different consumers
and §1 measures the ESM half at up to 13× on payload. But 17 of the 21 dual-rig packages emit a
`dist` JS tree that **no `package.json` field anywhere references**. The cost is not the second
build kind; it is that the second build kind is wired up on four packages out of twenty-one. R3
fixes the wiring; R4 stops the emit where it will not be wired. Neither answer is "collapse to a
single emit".

**OQ-4 (new) — how many of the 20 unwired packages can actually be bundled for the browser?**
Raised by the `ts-bcp47` node-builtin finding (§6). Unknown, and unknowable without running R5. It
directly bounds R3's achievable value and is the reason R5 sequences before R3.

---

## Appendix — the four affected packages, before and after the interim fix

State on `release` @ `792b87b5e` (this branch's base, **pre**-fix), which is what 5.1.0-47 shipped:

| Package | `import` resolved to | `module` | Loadable by Node ESM |
|---|---|---|---|
| `@fgv/ts-utils` | `./dist/index.js` | `dist/index.js` | ✗ `ERR_UNSUPPORTED_DIR_IMPORT` |
| `@fgv/ts-bcp47` | `./dist/index.js` (node) | `dist/index.browser.js` | ✗ |
| `@fgv/ts-random` | `./dist/index.js` | `dist/index.js` | ✗ |
| `@fgv/ts-utils-jest` | `./dist/index.js` | `dist/index.js` | ✗ |
| every other published package | `./lib/…` (CJS) | — | ✓ |

The interim fix adds a `node` condition routing both `import` and `require` at `lib` for the four,
leaving the bare/`browser` `import` at `dist` for bundlers. That shape is what R1 keeps and R3
generalizes to the remaining twenty.
