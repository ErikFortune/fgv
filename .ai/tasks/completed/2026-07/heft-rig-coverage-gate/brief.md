# Brief — fix `@fgv/heft-dual-rig` coverage-threshold gate (threshold miss must fail the build)

**Branch:** `claude/heft-rig-coverage-gate` (off `release`).
**Surface:** `rigs/heft-dual-rig` (+ possibly heft/jest config it owns). Build-tooling.
**You are the worker.** Do not sub-delegate. Reproduce, locate, fix, prove — with real command exit codes.

## The bug (confirmed by V2-track probe, 2026-07-05)

With an unmeetable `coverageThreshold` (e.g. `statements: 101`) in a package's `config/jest.config.json`, `rushx test` **prints** the Jest warning —
`Jest: "global" coverage threshold for statements (101%) not met: 100%` —
but **exits 0**. Test *failures* correctly fail the command; coverage-*threshold* misses do not. Every consuming package (all of PersonAIlity's, and this repo's) inherits this, so **the repo's "100% coverage to merge" rule is currently unenforced by CI.** This is a gate-integrity defect: every "100% coverage via `heft test`" claim to date has been unverified by exit code.

## Goal

A coverage-threshold miss must make the test command exit **non-zero**, so CI (and `rushx test`) actually block on it — identically to how a failing test does.

## Investigate → locate → fix (in order)

1. **Reproduce.** Pick a small package that uses the rig (or the rig's own test config). Set `statements: 101` in its `config/jest.config.json` `coverageThreshold.global`, run `rushx test`, and confirm: warning printed, exit code `0` (`echo $?`). This is the failing baseline.
2. **Locate the swallow.** Trace how the rig runs Jest. `@fgv/heft-dual-rig` wraps `@rushstack/heft` + `@rushstack/heft-node-rig`; coverage runs via `@rushstack/heft-jest-plugin`. Determine where jest's non-zero exit (on threshold failure) is lost:
   - Does the heft-jest-plugin invocation capture jest's result and fail the heft task, or does it only surface test-run failures and ignore `coverageThreshold` outcomes?
   - Is jest run with a flag/mode that reports-but-doesn't-enforce (e.g. threshold checked in a reporter path rather than the run's exit)?
   - Is this the rig's wiring, the shared jest profile the packages `extends`, or upstream `@rushstack/heft-jest-plugin` behavior?
3. **Fix at the right layer.**
   - **If it's the rig / a config the rig owns:** make the fix there so every consuming package inherits it (the whole point — a per-package fix doesn't scale).
   - **If it's genuinely upstream `@rushstack/heft-jest-plugin`:** do NOT fork it silently. Surface the finding with the minimal viable options (a rig-level post-jest exit-code check, a heft task that re-asserts coverage, a plugin config flag if one exists, or a pinned-version bump if upstream fixed it) + your recommendation, and flag for the orchestrator before implementing a heavyweight workaround.

## Load-bearing caveat — the fix will surface real debt; do NOT paper over it

Once the gate actually enforces, **any package currently below its declared threshold will start failing.** That's the fix working, not a regression. After the fix:

- Run the **full** `rush test` (or `rush test` across the affected packages) and report exactly which packages fail coverage now that the gate bites.
- **Do NOT lower any package's `coverageThreshold` to make the suite green**, and do NOT add blanket `c8 ignore`s. If real sub-threshold packages surface, that is a genuine finding — list them (package + metric + actual %) and surface to the orchestrator. We decide per-package whether to fill the gap or accept an explicit, justified threshold — that is a separate decision, not part of this fix.
- Note ts-utils' profile currently sets thresholds at **98**, not 100 — do not "correct" thresholds as part of this stream; only fix the *enforcement*.

## Constraints

- No `any`; follow repo conventions. `__`-prefix unused params (lint-mandated) if you touch TS.
- The fix's own change must not itself lower a gate.

## Deliverable

`.ai/tasks/active/heft-rig-coverage-gate/{brief.md, findings.md}` — this brief + a short `findings.md` recording: the reproduction (with exit codes), the root-cause layer (rig vs shared profile vs upstream), the fix applied, and the full-suite result after the fix (which packages, if any, the now-live gate flags).

## Proof of work (paste in your final report)

- The **before**: `statements: 101` probe → warning + `echo $?` = `0`.
- The **after**: same probe → warning + `echo $?` = **non-zero** (gate now bites); and a real 100%/at-threshold package still exits `0` (no false positive).
- The full `rush test` result post-fix, naming any packages the enforced gate now flags (or "all packages pass at their declared thresholds").
- `git diff --stat` of the fix (should be small + in the rig / shared config layer).

## Escalation

If the root cause is upstream and every in-rig remedy is a heavyweight workaround, STOP and surface options + recommendation rather than committing a large shim.
