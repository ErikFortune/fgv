# Brief — `system-one-impl` (Phase C of `system-one-decisions`)

**Orchestrator-owned. Frozen at kickoff.** Put questions and disagreements in `state.md`; do not edit
this file.

**Workflow position.** Phase A (design) and Phase B (triage) are done. This is Phase C, the
implementation. Its PR goes onto `integration/system-one-decisions`; the whole cycle squashes to
`release` at the cluster close, which the orchestrator runs.

## Your contract

**`docs/design/system-one-decisions/implementation-plan.md` is the contract.** Build S1 exactly as
the plan specifies:

- § 3 is the surface;
- § 4 is the acceptance criteria;
- § 5 is the tests and the revert matrix;
- § 8 is the harness;
- § 9 is the scaffold;
- § 10 is the close-time updates.

Each deviation goes in `result.md` with its reason. This brief adds only what the plan does not say.

Read, in this order:

1. the plan, in full;
2. `docs/design/system-one-decisions/design.md` §§ 1, 3, 5, 6, 8 and 10, and the evidence rows the
   plan cites;
3. `.ai/tasks/active/system-one-triage/result.md`, especially the user's decisions U1 and U2, now
   recorded as decided;
4. `.ai/conventions/result-integration-boundary.md` and `libraries/ts-extras-ollama/`, your scaffold
   source;
5. `libraries/ts-agent-tasks/perf/mutationMatrix.js`, the model for § 5.2's runner. **Read its usage
   notes before running it.** Never run a revert matrix without its package-scoping flag: it mutates
   the package in place, and an interrupted run leaves the mutant in the tree.

## What the orchestrator believes — verify; do not build on it

These have not been run. Your job includes deciding whether they are right.

1. **`@typesafe-ai/sdk@0.6.0` installs through Rush here.** pnpm enforces a minimum release age, and
   the package is about three weeks old (design E28), so it should pass. **Check that `rush add` and
   `rush install` both succeed** before writing code against it. `rush update` resolves; CI's
   `rush install` verifies (`CODING_STANDARDS.md` § *A dependency bump can be green locally and
   rejected by CI*). If the policy rejects it, stop and surface it. Do **not** add a
   `minimumReleaseAgeExclude`.
2. **The SDK behaviours plan § 9 lists hold at 0.6.0** as Phase B read them in source. You will have
   the installed package; spot-check the ones your code depends on before relying on them (E29–E31).
   A behaviour that differs is a plan deviation, not a workaround.
3. **The SDK bundles without Node built-ins** (E31), so `verify-bundler-resolution.mjs` probably
   passes without a `NEEDS_NODE_BUILTINS` entry. Run the gate; add the entry only if it fails.
4. **No live leg can run from a sandbox like this one.** `typesafe.ai` is blocked, and there is no GPU
   or Olares. Record L1–L5 as **"not run live"**; never infer one. If your environment *can* reach a
   real server, run L1 and record it per plan § 6. Under the user's decision U2, the cluster close
   waits for a recorded L1, and the orchestrator holds it until then. That is not your gate.

## Package-boundary expectations

This is a **native-boundary-style package** over a client with subtle runtime modes: environment
fallbacks, retries, status classes, and text-or-JSON bodies. `CODING_STANDARDS.md` § *Native-boundary
packages are a known layer-1 blind spot* applies: your own review will under-cover runtime-mode
defects. Favour fixture tests that exercise the real SDK through its `fetch` seam, as the plan
requires, and never module-mock the SDK.

## Out of scope

- Everything plan § 3.8 lists.
- Any change to another package's source. The § 10 doc updates (`LIBRARY_CAPABILITIES.md`,
  `ACTIVE_DEVELOPMENT.md`, `result-integration-boundary.md`) are in scope.
- `/finalize-task`, which runs at the cluster close (plan § 10). Write `state.md` and `result.md`.
- A safer-fetch adapter (D7). It folds into PersonAIlity #672's work on `integration/asks`. You ship
  only the `fetch?` seam.

## Gates, in addition to plan § 4

- **A new project and a lockfile change mean `node common/scripts/install-run-rush.js rebuild`
  repo-wide**, with zero warnings. Grade it by grepping the log (`grep -ciE warning`), not by the
  exit code; `rush` exits 0 on `SUCCESS WITH WARNINGS`.
- `node common/scripts/install-run-rush.js change --verify --target-branch
  origin/integration/system-one-decisions`.
- Run the `code-reviewer` agent on your diff after the functional tests and before coverage closure
  (plan § 4). The user is driving you directly, so you run it yourself.

## Mechanics

- Work on branch `system-one-phase-c`, which already carries this brief. Push there. **Do not open a
  PR**; the orchestrator does that after review.
- **If PR #719 (Phase B) has merged** onto `integration/system-one-decisions` by the time you start,
  merge `origin/integration/system-one-decisions` into your branch first. Its content is the same as
  your base, so expect no conflicts; stop if there are any.
- `rush` is not on PATH. From the repo root, use `node common/scripts/install-run-rush.js <cmd>`.
- Commit before running long gates. Run every gate in the foreground.
- Never disable TLS verification or unset `HTTPS_PROXY`.
- **Stop and surface**, with a final message of at most 300 words, if:
  - the dependency policy rejects the SDK;
  - an SDK behaviour in plan § 9 differs in a way that changes the § 3 surface;
  - a revert-matrix row cannot be made VERIFIED without changing what it protects.

## Exit artifacts

- `state.md`: your working surface.
- `result.md`, covering:
  - what shipped;
  - every deviation from the plan, with its reason;
  - the verdict on each numbered belief;
  - the revert-matrix output, with each row's named test;
  - each live leg, as run or "not run live";
  - the `code-reviewer` findings and their disposition;
  - gate counts;
  - anything this brief or the plan got wrong.
