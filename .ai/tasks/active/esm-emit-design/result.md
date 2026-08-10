# Result — `esm-emit-design`

**Branch:** `esm-emit-design` (from `release` @ `792b87b5e`)
**Deliverable:** `.claude/project/esm-emit-design.md`
**Shape:** design only — no source, config, rig, or `package.json` changes in the diff.

## Summary

The stream was commissioned to decide how to make the ESM emit Node-loadable, and the evidence
reframed it. Running the actual tooling eliminated the cheapest option outright:
`emitMjsExtensionForESModule: true` **collides with the current rig arrangement** (both claim the
ESNext module kind — the build errors), and when run alone it **does not rewrite specifiers at
all** — it changes output filenames only, producing `.mjs` that fails with
`ERR_UNSUPPORTED_DIR_IMPORT` on directory imports *and* `ERR_MODULE_NOT_FOUND` on plain file
imports. It is strictly worse than the current `.js` emit. Measuring the published 5.1.0-47
artifacts then surfaced the larger finding: the ESM emit is not dead weight, it is **unwired**.
`@fgv/ts-json-base` already publishes a tree-shakeable ESM build that bundles to 37 KB, while its
`exports` routes browser bundlers at the 130 KB CJS build — 92.6 KB unclaimed, and 17 of 21
dual-rig packages are in that position. Meanwhile native Node ESM, the thing the stream is named
after, still has no consumer asking for it. So the design recommends leaving Node on CJS and
spending the effort on bundler wiring instead, where the value is measured rather than notional.

## The recommendation, in two sentences

Keep the interim `node`-condition shape (Node consumers stay on CJS), add
`emitModulePackageJson: true` to the rig to kill the typeless warning without a root
`"type": "module"`, and route **browser bundlers** at the existing ESM emit via a `browser`
condition — behind a new bundler-resolution CI gate that must land first. Defer native Node ESM
(explicit `./x/index.js` specifiers in source — verified to work, and verified *not* to require
`moduleResolution: node16`) until a consumer actually asks, since it costs ~3,520 specifier
rewrites across ~1,300 files plus a permanent authoring rule to buy a capability nobody has
requested.

## Verified by running vs. inferred

**Run** (Heft 1.2.7 + heft-node-rig 2.11.27 + TypeScript 5.8.3 — the pinned versions — on Node
22.22.2, in a scratch dir since deleted):

- `emitMjsExtensionForESModule: true` + existing `additionalModuleKindsToEmit` → **build error**,
  module-kind collision.
- The same flag alone → `.mjs` emitted, **specifiers untouched**, `ERR_UNSUPPORTED_DIR_IMPORT` and
  `ERR_MODULE_NOT_FOUND`. This is the crux the brief flagged; the answer is unambiguous.
- The repo's current config → **reproduces both reported symptoms** verbatim.
- `emitModulePackageJson: true` → writes `dist/package.json` = `{"type":"module"}`, **typeless
  warning gone**.
- Explicit `./x/index.js` specifiers → **ESM emit loads natively in Node**, CJS still `require`s
  clean, **no `moduleResolution` change needed** (the brief's largest speculative cost does not
  exist).
- Against **published** `5.1.0-47`: reproduced the consumer's exact `ERR_UNSUPPORTED_DIR_IMPORT`;
  confirmed `lib` is CJS / `dist` is ESM; measured all bundle sizes (ts-utils 7.1 KB ESM vs 92.0 KB
  CJS narrow; ts-json-base 37.4 vs 130.0; ts-bcp47 776 vs 819); discovered ts-bcp47's browser entry
  pulls node `path`/`fs`.

**Read from pinned sources** (not docs): `emitModulePackageJson`'s existence and semantics
(plugin schema), the collision check (`TypeScriptBuilder.js`), `heft-node-rig`'s `module: commonjs`,
`heft-web-rig@1.4.3` `library` profile's `module: esnext`.

**Counted, not run:** the 3,520-specifier / ~1,300-file sizing; rig-per-package table; the "exactly
four packages reference `dist/*.js`" fact.

**Still inferred:** that no consumer needs native Node ESM (an *absence* of evidence — the handoff
note asked and got silence; recorded as OQ-1, not as a finding); that the tree-shaking wins
generalize past the three packages measured; source-map cost of the bundling option (not measured,
since not recommended); that `browser` is honored by every bundler of interest.

## Open questions

- **OQ-1 — still open**, and deliberately not closed. The recommendation rests on silence, not on a
  stated "no". The brief's suggested resolution ("delete the ESM emit nothing loads") is **half
  right**: keep the interim shape, yes; delete the emit, no — it is unwired, not worthless, and
  deleting it forecloses the measured win.
- **OQ-2 — resolved.** `module` exists on exactly the four packages that route `import` at `dist`
  and points at the same artifact in every case: consistent, redundant, honored only by pre-`exports`
  tooling. It becomes a dangling pointer only if an emit it names is removed — so it must be deleted
  in the same commit that stops emitting. Do not add new `module` fields.
- **OQ-3 — resolved.** The dual emit is the right architecture (up to 13× on payload) but is wired
  up on 4 packages out of 21. Fix the wiring; do not collapse to a single emit.
- **OQ-4 — new, open.** How many of the 20 unwired packages can actually be bundled for a browser?
  The ts-bcp47 node-builtin leak says the answer is not "all of them". Unknowable without the new
  gate, and it bounds the recommendation's achievable value — which is why the gate sequences before
  the wiring.

## Findings filed

- `2026-08-08-ts-bcp47-browser-entry-pulls-node-builtins.md` — pre-existing defect in a package
  outside this recommendation's scope; the concrete evidence behind the gate-before-wiring ordering.
- `2026-08-08-seventeen-packages-emit-unreferenced-dist-js.md` — the waste-to-win mechanism.

## Deviations from the brief

1. **Two required-reading files were not on this branch.** `common/scripts/verify-esm-entrypoints.mjs`
   and `.ai/notes/cross-repo-handoffs/personaility-reply-2026-08-esm-entry-points.md` do not exist on
   `esm-emit-design` (based on `release` @ `792b87b5e`); both live on the unmerged interim-fix branch
   `fix/esm-node-entry-points`. Read from there via `git show` — read-only, nothing fetched into the
   working tree, no dependency taken on that branch merging. The missing-input rule's concern
   (recreating a file from exploration) does not apply: both were read verbatim. Flagging rather than
   silently absorbing it, since the brief listed them as present.
2. **The recommendation does not match any single option the brief enumerated.** The four listed
   options were each costed as asked, but the measured evidence pointed at a fifth — wiring the
   existing emit to bundlers — which the brief did not anticipate because the bundler row of the
   consumer table had not been measured. Presented as the recommendation with Option B named as the
   runner-up and explicit change-my-mind conditions, per the acceptance criteria.
3. **`docs/FUTURE.md` / `docs/TECH_DEBT.md` untouched.** The deferred items (R4, Option B, OQ-4) are
   all held by the design doc and are inputs to the implementation stream's brief; adding parallel
   entries now would duplicate rather than record. If the orchestrator would rather they be tracked
   there, that is a one-line addition either way.
