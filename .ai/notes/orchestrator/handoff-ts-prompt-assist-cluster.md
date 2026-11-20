# Handoff: ts-prompt-assist cluster (mid-cluster orchestrator transition)

**Date:** 2026-05-18
**Cluster:** `ts-prompt-assist v0.1`
**Integration branch:** `claude/ts-prompt-assist-features` (off `release`)
**Why this doc exists:** the prior orchestrator session is near context exhaustion. This doc lets a fresh orchestrator session pick up the cluster mid-flight without re-deriving state from PR/commit archaeology.

---

## Read these first (binding artifacts)

1. **`.ai/tasks/active/ts-prompt-assist/state.md`** — phase + history of the cluster. Most-recent rows reflect round-1 absorption (PRs #375 / #376 / #377 / #380 merged) and the round-2 cycle in flight.
2. **`.ai/tasks/active/ts-prompt-assist/pressure-test-findings-round-1.md`** + **`pressure-test-findings-round-2.md`** — what the two pressure-tests surfaced and how findings were triaged.
3. **`.ai/tasks/active/ts-prompt-assist/ts-res-typed-conditions-design.md`** — the active design decision blocking cluster close. Four options laid out (A withdraw / B cascade / C runtime teeth / D land + tech-debt). Erik is the decider; the prior orchestrator's lean was D (or B+D).
4. **`.ai/notes/orchestrator/lessons-pending.md`** — L1–L25. The L22–L25 block (this session's contributions) covers: fgv-conventions pre-load (L22), concurrent Task subagents need `isolation: "worktree"` (L23), subagent agent-discovery vs tool-inventory are independent gates (L24), typed-but-no-runtime-teeth critique pattern (L25). Read these before commissioning anything; they encode hard-won discipline that's not yet codified to convention docs.

## In-flight PRs at handoff

| PR | Status | Description |
|---|---|---|
| **#384** | Open, sample app + round-2 findings | Will rebase onto post-port #385 once cluster decision on #386 resolves; sample app updates to use whatever shape #385 ends up referencing |
| **#385** | Open, round-2 absorb (F1+F2+F6) | Local sibling types for typed-conditions; ports to ts-res reference once #386 settles |
| **#386** | Open, ts-res ConditionSetDecl parameterization | **Erik flagged two critiques; needs design adjudication** — see `ts-res-typed-conditions-design.md` |
| **#387** | Open, design options brief | The doc itself — captures the option space for the #386 decision |

## State of play at handoff

**The work that's done:**
- Phase B (full library implementation): merged via 8 sub-phase PRs + 3 orchestrator cleanups + 1 surface-tidy round.
- Round-1 pressure-test: PR #373 (sample app) held + closed; findings doc cherry-picked via #374; ergonomics absorbed via #375 (ts-utils withType) + #376 (ts-res qualifier mixed-shape + Partial widen) + #377 (ts-extras Yaml browser export + L13 micro-test) + #380 (ts-prompt-assist F3+F9+F12+F14).
- Repo-infra: #381 promoted code-reviewer agent to top-level; #383 merged release into integration to absorb.
- Round-2 pressure-test: PR #384 shipped + findings cherry-picked. Round-2 was materially smoother than round-1 (L22 confirmed working).

**The decision blocking cluster close:**
- PR #386 (ts-res in-place parameterization of `ConditionSetDecl` family on `TQualifierNames`) currently lands a compile-time-only annotation. Erik's two critiques:
  1. **Incomplete seam** — parameterization stops at ConditionSetDecl; consumers of that type (IChildResourceCandidateDecl, ILooseResourceCandidateDecl, etc.) keep the loose shape.
  2. **No runtime teeth** — the typed-narrow only protects in-code authoring; JSON loads via Converter pipeline accept the loose shape.
- Erik said he'd kick the tires on #386 and the cluster-close decision waits on him. The four paths are enumerated in `ts-res-typed-conditions-design.md`.

**What "cluster close" means in this cluster:**
1. PR #386 decision lands (whichever of A/B/C/D Erik picks).
2. Depending on choice:
   - **A** (withdraw): PR #385 stays with its local sibling types; #384 rebases onto #385; cluster close.
   - **B** (cascade): expand #386 to thread TQualifierNames through the full chain in ts-res; then #385 ports; #384 rebases; cluster close.
   - **C** (runtime teeth): commission new ts-res sub-phase for Converter parameterization; significantly delays cluster close. Probably wrong for now.
   - **D** (land + TECH_DEBT): merge #386 as-is + file TECH_DEBT entry; #385 ports; #384 rebases; cluster close.
3. Cluster close PR: integration → release promotion. Aggregates rush change files for the alpha publish.

## Operational protocol (the cluster's working conventions)

- **PR target binding**: cluster PRs target `claude/ts-prompt-assist-features` (integration branch), NOT `release`. Cluster close is the single PR that goes integration → release.
- **Lockstep version policy**: anything touching base-utils-grouped packages bumps everything together. Rush change files are required on every PR that changes any base-utils package.
- **No re-exports from sibling packages**: when a consumer needs a primitive from another `@fgv/*` package, it imports directly. The package the primitive lives in is the consumer's import source. (L22.)
- **Active-development surfaces** include `ts-prompt-assist`. Breaking pre-v0.1 changes are explicitly cheap; "preserve back-compat" instinct is wrong.
- **Task subagent isolation**: any concurrent Task subagent commission MUST use `isolation: "worktree"`. (L23.)
- **Code-reviewer fallback**: Task subagents commissioned via `general-purpose` cannot invoke code-reviewer (L24). Brief language for Guardrail #6 should accept inline CODE_REVIEW_CHECKLIST.md self-review as the documented substitute.
- **Post-merge cleanup PR pattern**: when a sub-phase PR merges and surfaces nits / API-shape issues during triage, the orchestrator opens a focused cleanup PR ON THE INTEGRATION BRANCH rather than queueing tech-debt entries. (L20.)
- **Test-pyramid expectations**: 100% coverage on every modified file is the gate. `rush build` + `rushx lint` + `rushx test` in every touched package before opening a PR.

## What the fresh orchestrator should do first

1. **Read `state.md` + the two pressure-test findings docs + `ts-res-typed-conditions-design.md` + the L22–L25 block.** ~15 minutes of grounding before any tool call.
2. **Check the four cluster PRs (#384, #385, #386, #387) for activity** since handoff. Status may have moved if Erik merged anything.
3. **Wait for Erik's decision on #386**, or if he's already decided, execute the chosen path. Do NOT pre-empt the decision; he was explicit that he wanted to kick the tires.

## Possible next actions (post-#386 decision)

| If Erik chose | Then |
|---|---|
| A (withdraw) | Close #386 + #387 with "superseded by withdraw" comments; revert PR #385's port plan; #384 rebases onto post-A integration HEAD; cluster close |
| B (cascade) | Expand #386: thread `TQualifierNames` through IChildResourceCandidateDecl, ILooseResourceCandidateDecl, IImporterResourceCandidateDecl, IContainerContextDecl, IChildResourceDecl, ILooseResourceDecl, IResourceCollectionDecl, IImporterResourceCollectionDecl, IResourceTreeRootDecl (all with `extends string = string` defaults). Run rush build / lint / test in ts-res + ts-prompt-assist. Force-push to #386 branch |
| C (runtime teeth) | Commission a new Task subagent for ts-res sub-phase. Brief should include the L25 framing — Converter parameterization needs to enforce at validate-time, not just type-system level. Probably defers cluster close by days; surface that to Erik before committing |
| D (land + TECH_DEBT) | Add a TECH_DEBT P2 entry for "ts-res qualifier-name runtime enforcement"; merge #386 + #387; port #385; rebase #384; cluster close |

## Things to NOT do

- **Don't merge release into integration again** unless something on release that integration needs has landed since #383. The cluster has its own decision space; absorbing unrelated release changes adds risk.
- **Don't commission a fresh pressure-test round** unless Erik specifically asks. Round-1 + round-2 was the planned shape; round-3 is over-engineering absent new signal.
- **Don't re-do the L22 fgv-conventions experiment in another cluster's commission** without thinking. L22 worked because of the specific framing this cluster used; copy-pasting the section verbatim to a non-ts-prompt-assist cluster may not generalize.
- **Don't sweep lessons L18–L25 to release / canonicalize them into convention docs yet.** The "wait until they recur and prove out" discipline is part of the lessons-pending design. Some of L22–L25 may not recur; let evidence accumulate before promoting.

## Cluster close checklist (when the time comes)

When PR #386's decision settles and #385 + #384 land:

1. Verify all four PRs (#384, #385, #386, #387) closed or merged.
2. Run final integration-branch validation: `rush build`, `rushx lint`, `rushx test` for all touched packages.
3. Open the cluster-close prep PR on integration if any final adjustments are needed (typical: state.md history rows, possibly a final lessons-pending update).
4. Open the integration → release promotion PR. This is the single PR that delivers the cluster.
5. After release merges: bump prerelease versions for the alpha publish per the cluster's lockstep version policy.
6. Verify ts-prompt-assist-features integration branch is in clean state for the next stream commission (or merge it into the cluster's archive if no further work is planned).

## Open questions the fresh orchestrator may want to raise with Erik

- Is the v0.1 alpha publish triggered immediately on cluster close, or does Erik queue alphas for batch publish?
- Should the post-cluster-close work include sweeping lessons L14–L25 from `lessons-pending.md` to durable form on `release`? Currently lessons-pending is on `claude/orchestrator-session` (long-lived branch) and only gets swept opportunistically.
- Is there a follow-on consumer port planned (the personaility agent chat application Erik mentioned originally)? That's beyond cluster scope but worth confirming the sequencing.

---

**Final note:** the cluster has been moving smoothly with a clear ship-then-cleanup rhythm (post-merge cleanup PR is the dominant mechanic). Trust the existing pattern; don't reinvent.
