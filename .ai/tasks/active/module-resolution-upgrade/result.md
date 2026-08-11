# `module-resolution-upgrade` — exit artifact

**Branch:** `module-resolution-upgrade` (from `release` @ `af2178cde`, i.e. after #608)

## Deliverables

| # | status |
|---|---|
| 1 — make today's behavior explicit | **landed**, verified free |
| 2 — reconcile the three overrides | **landed**, with the reason recorded |
| 3 — move to `bundler` repo-wide | **not available** — see below; deliberately not forced |
| 4 — evaluate `node16`/`nodenext` | **not attempted** — its gate now also gates step 3 |

All three of the stream's durable follow-ups are promoted into `docs/FUTURE.md` (reachability gate,
type-checking the webpack apps, the emit decision) rather than left only in `findings/inbox/`.

### 1 — landed

`moduleResolution: "node"` is now stated in all 31 rig-inheriting projects (23 on `@fgv/heft-dual-rig`,
6 on `@rushstack/heft-node-rig` directly, 2 on `@rushstack/heft-web-rig`). The three freestanding
webpack tsconfigs already stated one.

Verified free as the brief required — full `rush rebuild` before and after, hashing every emitted
`.js` / `.d.ts` / `.map` / `.json` under `lib/` and `dist/` plus every checked-in `etc/*.api.md`:

> **8,836 artifacts compared, zero differences.**

Stated per project rather than in the rig because **both shared-layer shapes are blocked by Heft** —
it rejects a TS 5.0 `extends` array, and a workspace-symlinked rig's relative paths resolve into the
rig's own tree. Answers OQ-3; detail in the `heft-blocks-a-shared-tsconfig-layer` finding.

### 2 — landed

`tools/ts-res-browser` and `tools/ts-res-ui-playground` moved from `node` to `bundler`, matching
`apps/sudoku`, which already declared it. All three are webpack-bundled and never Node-loaded, so
`bundler` models what webpack actually does. The reason is now recorded at all three sites —
`apps/sudoku`'s value was already correct but carried only a bare `/* Bundler mode */`, so it gained
the same comment without a value change (leaving deliverable 1's byte-identical verification intact).

`ts-res-browser` type-checks clean under `bundler`. The other two do not type-check at all — see the
finding; that is pre-existing and unrelated.

### 3 — not available at the quoted price

> `moduleResolution: bundler` **cannot be set on a `module: commonjs` project**, and all 29
> rig-inheriting projects are `module: commonjs`. `node10` is the only legal value there.

The design amendment's probe varied `module` and `moduleResolution` together and so never asked
whether its `bundler` row was reachable from where the repo sits. Every path off node10 changes
`module`; changing `module` changes the emit. **Steps 3 and 4 therefore share one prerequisite.**

A type-check-only overlay was built and swept across all 29 projects as a possible substitute. It
does not hold up, and answers **OQ-2 in the negative** — detail below.

### 4 — not attempted

Deliberate. Its gate (the dual-emit question, design § 2 Option D) is unchanged and now also gates
step 3, so attempting 4 without an answer would have been the "push through" the brief forbids.

## Step-3 triage list

Repo-wide sweep, 29 projects, `module: esnext` + `moduleResolution: bundler` + `noEmit`:

| configuration | errors |
|---|---:|
| `bundler` | 73 |
| `bundler` + `customConditions: ["node"]` | 3 |

| cause | count | disposition |
|---|---:|---|
| dual-entry `@fgv` package resolved to its **browser** build (`bundler` does not set the `node` condition) — 46 × TS2339, 20 × TS7006 cascade, 2 × TS2551, 1 × TS2724 | 69 | **not defects.** The checker asked what a browser bundler sees while type-checking Node code |
| `clipboardy` resolved to `browser.js`, no types (TS7016) | 1 | same cause, third-party |
| `mustache` `Writer` not a named export (TS2614) | 1 | **false positive introduced by the overlay** — `module: esnext` changes named-import semantics; compiles under the real `commonjs` emit |
| `jest-snapshot/build` not exposed by that package's `exports` (TS2307 ×2) | 2 | **real - FIXED** (`0d1700513`). Confirmed `ERR_PACKAGE_PATH_NOT_EXPORTED` at runtime; was latent only because the import is type-only and erased from both emits |

Nothing was bulk-fixed. **The one real item was fixed** (`0d1700513`) - it is two lines in
`libraries/ts-utils/src/test/helpers/`, technically in scope only under deliverable 4, and folded in
on the owner's call after the triage was reviewed. Re-running the exports-aware check over `ts-utils`
now reports zero errors where it reported the two TS2307s.

## Open questions

- **OQ-1 (how far is worth going)** — resolved differently than anticipated. Not "land 1–3 then
  decide 4": 1–2 land, 3 is unavailable, and 3+4 are one decision gated on the emit.
- **OQ-2 (does `bundler` cost anything for Node consumers)** — **answered: yes.** It does not weaken
  Node checking; it checks a different path entirely. `customConditions: ["node"]` corrects the path
  but blinds the pass to `default` — the webauthn class. Neither pass is a gate, and both are weaker
  than the existing scripts, which assert every condition at every subpath unconditionally.
  **Recommendation: do not build it.**
- **OQ-3 (does the rig change belong upstream)** — **answered: the layer was forced, not chosen.**
  Per project is the only shape Heft supports.

## Findings filed (9)

- `bundler-is-unreachable-from-module-commonjs` — blocks D3 as briefed
- `bundler-mode-asks-the-wrong-question-for-node-packages` — answers OQ-2; rules out the gate
- `twenty-one-packages-declare-an-unreachable-types-condition` — **the largest item surfaced**; same
  shape as the webauthn defect, independent of the emit question
- `ts-utils-imports-a-subpath-jest-snapshot-does-not-export` — the one real defect from the sweep; **fixed**
- `three-webpack-apps-are-never-type-checked` — 35 pre-existing errors nothing runs
- `heft-blocks-a-shared-tsconfig-layer` — answers OQ-3
- `the-esm-emit-is-shipped-and-dead` — **reframes the emit decision**: 25 of 25 packages route
  `import` at the CJS `lib/`, so no consumer is on the ESM path. Also **carries a correction to its
  own first version**, which wrongly claimed `ts-bcp47`'s ESM entry was broken — that was Node's ESM
  loader applied to a browser-branch entry no consumer reaches; esbuild *and* webpack 5 both bundle
  it clean, and the three gates already cover every condition a real consumer takes.
- `what-external-esm-consumers-actually-get` — **settles the emit decision's central unknown**, tested
  against packed tarballs installed into a `"type": "module"` package: external ESM consumers work
  today (79 named exports via `cjs-module-lexer`; TS `node16` type-checks, emits and runs clean). The
  only sharp edge is importing a *type* by name from JavaScript, which `verbatimModuleSyntax` catches
  at compile time. Activating ESM is worth ~5% bundle on the one package shipping both, plus
  statically-checkable named exports — **and neither direction breaks anyone.**
- `cost-of-activating-the-esm-emit-measured-by-doing-it` — **sizes the emit change by running the
  codemod repo-wide and rebuilding, then reverting.** Specifiers are mechanical (3,697 sites, 2 by
  hand) and **build on today's config**, so the work is incrementally landable with no flag day; the
  3 webpack apps need one line each. **The dominant, previously-unknown cost is 1,830
  `@rushstack/eslint-plugin-packlets` violations** — the rule compares the packlet entry point by
  exact path equality, so `../base/index.js` can never satisfy it, and there is no option.

## Gate status

| gate | result |
|---|---|
| `rush rebuild` | ✅ green, output byte-identical to baseline |
| `verify-esm-entrypoints.mjs` | ✅ |
| `verify-bundler-resolution.mjs` | ✅ |
| `verify-tarball-exports.mjs` | ✅ |
| `rush test` | ⚠️ 1 pre-existing failure, **environmental** — see below |
| `rush change --verify` | ✅ — 29 change files, all `type: "none"` |

`ts-json-base` › `FsFileTreeAccessors › fileIsMutable › returns permission-denied for read-only file`
fails **in this container only**, because the session runs as `uid 0` and root ignores the
`chmod 0o444` the test sets up — so the write it expects to be denied succeeds. Confirmed
pre-existing rather than assumed: with every change stashed, on a clean tree at `af2178cde`, the same
test fails identically. CI runs non-root and is unaffected. Worth knowing before the next agent in
this container reads a red `rush test` as its own doing.

Untouched, as the brief required — this work does not replace them, and per OQ-2 it cannot.

## Deviations

- **D1 is 31 inline declarations, not one rig file.** Forced by Heft; two shapes tried and measured
  before falling back.
- **D3 attempted and abandoned on evidence rather than skipped.** The blocker is recorded with the
  measurement that establishes it.
- **The `types`-condition audit was not in the brief.** It came out of diagnosing the 70 browser-entry
  errors and is the most consequential thing found. Filed, not fixed, per the brief's rule that
  `exports` blocks are findings unless fixing one unblocks the step.
- **The `jest-snapshot/build` fix was folded in on the owner's call**, after the triage was reviewed.
  Strictly it sits in `libraries/*/src/**`, in scope only under deliverable 4 — but it is two lines,
  the correct form already existed in `@fgv/ts-utils-jest` to copy, and leaving a confirmed
  `ERR_PACKAGE_PATH_NOT_EXPORTED` in the tree to be re-discovered later was the worse trade.

## Recommended next

1. **Reachability, not just existence** — extend a gate to assert a condition can actually be
   selected, not merely that the file it names exists. Independent of the emit question and cheap;
   it is the check none of the three existing gates makes. The accompanying `exports` edit is
   **manifest-only**: `types` first inside the `node` block across 21 packages. The browser branch
   needs no `types` key — it already resolves `lib/index.browser.d.ts` by adjacency, correctly — so
   **no browser `.d.ts` rollup has to be built.** (An earlier version of this artifact said it did.)
2. **Type-check the three webpack apps** — add the step and fix the 35 errors together, since adding
   the step first turns `rush build` red.
3. **Decide the emit once** — `module` is the real variable. Treat "off node10" as one decision.

(The sweep's one real defect, `jest-snapshot/build`, was fixed in this stream and is no longer a
prerequisite for that decision.)
