# Workstream Brief: `esm-emit-impl` — implement the ESM emit design, and fix `ts-bcp47`'s browser entry

## Mission

Implement `.claude/project/esm-emit-design.md`'s R1–R5 in the sequence that design recommends, and
fix the `@fgv/ts-bcp47` browser-entry defect the design surfaced — because R3 would otherwise
propagate that defect's *class* to twenty more packages. **One stream, one publish.**

## Status entering

**There is no interim publish.** The `fix/esm-node-entry-points` work (PR #603) is deliberately
**not being shipped on its own** — this branch is based on it and supersedes it, so #603's content
ships here or not at all. Do not re-implement it; it is already in your history:

- the `node` condition on the four affected packages — **this is R1, already done**
- `common/scripts/verify-esm-entrypoints.mjs` + its CI step
- four `patch` change files
- `.ai/notes/cross-repo-handoffs/personaility-reply-2026-08-esm-entry-points.md`

**The design reframed the problem and you should start from its conclusion, not re-derive it.** The
reported bug (4 packages, Node ESM unloadable) is the smaller half. The larger half: **20 of 24
published packages already build a tree-shakeable ESM bundle their `exports` never points at**, and
for 17 of them nothing references it at all. Measured cost of that mis-wiring:
`@fgv/ts-json-base` ships **130.0 KB** to a browser bundler where the existing ESM emit would ship
**37.4 KB** — a 3.5× payload on a package with real browser consumers. Native Node ESM, by
contrast, has **no demonstrated consumer**.

## In-scope paths (you may modify)

- `rigs/heft-dual-rig/profiles/default/config/typescript.json` — R2, one line
- `common/scripts/verify-esm-entrypoints.mjs` — amend the two `BUNDLER_ONLY` reasons (§5.1)
- `common/scripts/verify-bundler-resolution.mjs` — **new**, R5
- `.github/workflows/ci.yml` — wire R5 in
- `libraries/*/package.json` — `exports` / `module` fields only, for R3
- `libraries/ts-bcp47/src/**` — the browser-entry fix
- `libraries/*/src/test/**` — only where the `ts-bcp47` fix requires it
- `libraries/*/etc/*.api.md` — regenerate, never hand-edit
- `common/changes/@fgv/*/*.json`
- `.claude/project/esm-emit-design.md` — status line + any divergence found in implementation
- `.ai/notes/cross-repo-handoffs/personaility-reply-2026-08-esm-entry-points.md` — **must be
  updated**, see deliverable 7
- `docs/WORKSTREAMS.md` (this stream's entry), `docs/FUTURE.md` (R4 if deferred)

## Out-of-scope paths (you must NOT modify)

- `libraries/ts-res-ui-components/**`, `libraries/ts-sudoku-ui/**` — built with
  `@rushstack/heft-web-rig`, emit **only** ESM to `lib` with no CJS anywhere. The design establishes
  (§5) that these are a *structurally different* problem, not a milder instance, and that nothing in
  R1–R5 touches them. Owner has confirmed both are **intended to be bundled, not imported from
  Node**. Keep both `BUNDLER_ONLY` entries; amend only their stated reason.
- Source of any package other than `ts-bcp47` — R3 is an `exports` change, not a source change. If a
  package needs source edits to bundle cleanly, **stop and record a finding**; do not fix it here.
- `apps/**`, `samples/**`
- Option B (explicit specifiers in source). Deferred by the design, explicitly not foreclosed. Not
  this stream.

## Required reading (load before writing code)

- `.claude/project/esm-emit-design.md` — **all of it**, but especially §3 (R1–R5), §5 (gate),
  §6 "Where the real risk is" + "Recommended sequencing", §7 (what was verified by running)
- `.ai/tasks/active/esm-emit-design/findings/inbox/2026-08-08-ts-bcp47-browser-entry-pulls-node-builtins.md`
- `.ai/tasks/active/esm-emit-design/findings/inbox/2026-08-08-seventeen-packages-emit-unreferenced-dist-js.md`
- `common/scripts/verify-esm-entrypoints.mjs` — its header states the posture R5 must mirror
- `rigs/heft-dual-rig/profiles/default/config/typescript.json`
- `.ai/instructions/MONOREPO_GUIDE.md`, `.ai/instructions/ACTIVE_DEVELOPMENT.md`

## Missing-input rule (non-negotiable)

If any required-reading file doesn't exist or you can't access it: **STOP** and surface the gap. Do
not recreate it from codebase exploration or improvise what it contained.

## Dependencies

**Hard:** none. Branch `esm-emit-impl` exists, based on `fix/esm-node-entry-points` @ `cebf10bae`.
**Soft:** none.

## Deliverables — in the design's sequence, which is load-bearing

1. **R2 — `emitModulePackageJson: true`** in the rig's `additionalModuleKindsToEmit` entry. One
   line. The design verified (§7 variant C) that it writes `dist/package.json` with
   `{"type":"module"}` and eliminates `MODULE_TYPELESS_PACKAGE_JSON`. Confirm that yourself on a
   rebuilt artifact.
2. **R5 — `verify-bundler-resolution.mjs`**, and wire it into CI. Mirror the existing gate's
   posture: **enter the failing path**, don't assert around it. For each published package, resolve
   the `browser`/`import` condition as a bundler would, bundle a trivial entry with esbuild at
   `platform: 'browser'` with node builtins **not** polyfilled, and fail on any unresolved import. A
   package that legitimately needs a node builtin declares itself on the record, in the same
   declaration-over-silent-skip style as `BUNDLER_ONLY`.
3. **Run R5 across every package and triage what it finds — before touching any `exports` block.**
   The design is explicit that the yield here is non-zero. Report the full list; fix only what
   deliverable 4 covers, and file the rest.
4. **Fix `@fgv/ts-bcp47`'s browser entry.** `index.browser` transitively reaches
   `packlets/iana/languageRegistriesFileLoader`, which imports node `path` and `fs`. Present in
   **both** `dist` (ESM) and `lib` (CJS) browser builds of the shipped 5.1.0-47, so a browser
   consumer can hit it today. Suggested shape, from the finding: keep `loadLanguageRegistries*` on
   the node entry and exclude it from `index.browser.ts`, following the split `@fgv/ts-extras`
   already uses. **Verify by bundling, not by reading imports.**
5. **R3 — route browser bundlers at the ESM emit** via the `browser` condition, per package, **each
   behind a green R5**, in ascending order of measured benefit. `browser` deliberately, not
   `default`: `default` is what Deno and edge runtimes take, and pointing those at the
   directory-import emit would recreate the original bug somewhere new. `@fgv/ts-bcp47` already has
   this exact shape — you are extending an in-repo precedent, not inventing one.
6. **R4 — dead `dist` emit.** After R3, any package whose `dist` JS nothing references is building
   dead output. The design calls this low-value, near-zero-risk, and **entirely optional**: prefer
   recording it in `docs/FUTURE.md` over blocking this stream on it.
7. **Docs, in this PR.** Amend the two `BUNDLER_ONLY` reasons per §5.1 to name the *rig decision*
   rather than the symptom. Mark the design doc implemented and record any divergence.
   **Update the PersonAIlity reply** — it currently says the interim ships in the next publish and
   describes the interim shape; that is now wrong, and it is the note a waiting consumer will read.
   Move this stream's ledger entry to Completed.

## Acceptance criteria (the stop point)

- [ ] `MODULE_TYPELESS_PACKAGE_JSON` no longer appears when Node loads a `dist` artifact
- [ ] `verify-bundler-resolution.mjs` exists, is wired into CI, and **fails** against `ts-bcp47`'s
      browser entry before deliverable 4 and passes after — demonstrate both
- [ ] Every package routed at the ESM emit by R3 has a green bundler-resolution result
- [ ] No package's source changed except `ts-bcp47` (findings filed instead)
- [ ] Both `BUNDLER_ONLY` entries retained, reasons amended to name the rig
- [ ] `rushx build` / `rushx lint` / `rushx test` pass in every modified package; 100% coverage
      maintained where it applied before
- [ ] `rush change --verify` green
- [ ] The PersonAIlity reply reflects what actually ships
- [ ] `code-reviewer` run on the final diff **before** chasing coverage; findings resolved or
      dispositioned
- [ ] Copilot loop driven by the implementer; stopped on diminishing returns or the 10-round cap

## Handoff contract (what you publish)

- Smaller browser bundles for every package R3 routes — the measured deliverable
- `verify-bundler-resolution.mjs` — the gate that makes R3 safe to extend later
- A `ts-bcp47` browser entry that bundles
- The triage list from deliverable 3 — what R5 found and what was deferred

## Open questions to resolve

- **OQ-1 — how far to take R3 in this stream.** The design says ascending order of measured
  benefit, each behind a green gate. It does **not** require all 20 in one pass. **Recommended:**
  do the ones whose gate is green and whose benefit is measurable, and defer any package whose gate
  is red to a follow-up with a finding. Partial R3 is a fine outcome; a rushed R3 that ships a
  browser build nobody bundled is not.
- **OQ-2 — does `module: "dist/index.js"` stay?** Several packages carry the legacy field pointing
  at the same emit. Bundlers honor it, and after R3 it may be redundant or may be the only thing
  some toolchain reads. **Recommended:** leave it alone unless R5 shows it causing a wrong
  resolution; removing a field some bundler silently depends on is exactly the kind of change this
  stream should not make blind.
- **OQ-3 — should #603 be closed or retargeted?** This branch contains all of it. **Recommended:**
  raise it with the orchestrator when you open the PR rather than acting on it yourself.

## Findings-inbox convention

`.ai/tasks/active/esm-emit-impl/findings/inbox/<timestamp>-<slug>.md`, one per file. Every package
R5 flags that you do not fix belongs here.

## Required exit artifact

`.ai/tasks/active/esm-emit-impl/result.md`: branch; summary; files changed; gate status per command;
**the R5 triage table** (package → resolves clean / needs a builtin / deferred); measured
before/after bundle sizes for each package R3 routed; an observability self-audit; a
convention-compliance sweep; a sibling-sweep pass on the new gate (its sibling is
`verify-esm-entrypoints.mjs` — did you diverge from its declaration-over-skip posture?); open
questions; deviations from this brief.

## Resume protocol

Re-read this brief, read `.ai/tasks/active/esm-emit-impl/state.md`, confirm scope.

## Why the sequencing is not negotiable

R3 is the valuable step and the dangerous one. Those twenty ESM trees **build**, but for twenty of
them no bundler has ever compiled them — and the one package already wired that way turned out to
pull `fs` and `path` into a browser graph. Building and bundling are different claims. R5 exists to
turn the second claim into evidence before R3 relies on it, which is why the design gates R3 on R5
and why this brief does too.
