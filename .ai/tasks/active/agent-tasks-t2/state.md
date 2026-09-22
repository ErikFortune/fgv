# State — `agent-tasks-t2`

Newest entry last. Append one at each phase boundary.

---

## 2026-09-22 — phase 0: required reading complete, scope confirmed

**Verified against the tree.** Every required-reading file exists. `implementation-plan.md` § T2
says what the kickoff says: the same deliverables, the same six acceptance clauses, the same test
list, and the review gate "disclosure/omission and receipt semantics; pure API independent of live
infrastructure". T1 is on the base as `1337c27c`; the branch head is `35b40b62` (stream setup
only). T1's `result.md` carries the declared-vs-exercised table. No missing-input escalation.

**Authority used for shapes:** design §9 *Pure rendering in both modes* (`ITaskContextBudget`,
`IInclusionEntry`, `ITaskInclusionReceipt`, `ITaskContextInput`, `ITaskContext`,
`renderTaskContext`), §8.3 (`ITaskUpdate`, `IUnresolvedTaskReference`), §7 (`ITaskSummary`, and
"projection strips private details/binding… projector failures return failure instead of falling
back to full data"), and fgv-library §2/§10.

### Slice boundary as I am drawing it

- `types`: `ITaskSummary`, `ITaskUpdate`, `IUnresolvedTaskReference` (pulled forward from §7/§8.3
  because the renderer's input is made of them), plus the context value types.
- `converters`: a `context` group on `TaskConverters` — summary, update, unresolved reference,
  budget, input, inclusion entry and receipt.
- `context` (new): `TaskContextRenderer` — validate → deduplicate/conflict-check → project →
  select → render → receipt. No clock, random, filesystem, store or ID factory is reachable from it.

### Decisions taken up front (each revisits a design sketch; reasons go to `result.md`)

1. **A class, not a free function.** The design sketches `renderTaskContext(input, budget)`. The
   renderer must validate its input (the symmetry hole the brief names), validation is
   bounds-dependent, and bounds live on a `TaskConverters` instance — so it is
   `TaskContextRenderer.create({ converters?, projection? }).render(input, budget?)`, matching
   T1's `TaskConverters.create` / `TaskKindRegistry.create`.
2. **`TaskResult`, not `Result`.** Invalid input and conflicting duplicates are distinguishable
   failures a host acts on differently.
3. **One render item per `(task, revision)`.** An inclusion entry is `(taskId, revision,
   updateIds)`, so updates at the revision a current snapshot already shows ride on that item
   instead of rendering the same state twice. Distinct revisions stay distinct items.
4. **The projection seam re-validates its output and pins identity.** A host projector's result
   goes back through the strict summary converter, and must keep `id`, `revision` and `kind` — a
   projector that changed them would make the receipt describe something that was not rendered.
   Throwing or failing fails the render; there is no fallback to unprojected data.

---

## 2026-09-22 — phase 1: implementation and scenario tests

**Shipped in the working tree:** `types/summary.ts` (`ITaskSummary`, `IUnresolvedTaskReference`),
`ITaskUpdate` in `types/updates.ts`, `types/context.ts`; `converters/contextConverters.ts` (on
`TaskConverters.context`); the `context` packlet — `escaping` (frame-safe JSON quoting),
`framing` (fixed text and worst-case reserve), `normalize` (dedup / conflict rules), `renderer`.

**Scenario tests written first**, one `describe` per plan test topic, plus a purity file. The
no-side-effects test spies on `Date.now`, `Math.random`, `performance.now`, `hrtime`, web crypto
and every configurable function on `crypto`, `fs` and `fs/promises`. **Watched it fail:** an
injected `Date.now()` + `fs.existsSync` in the renderer turned it red naming both; restored.
Its first version silently spied on nothing (namespace-import getters are not configurable) —
the "> 50 spies" sanity assertion is what caught that.

Coverage after scenario tests alone: 100% lines, two renderer branches open. Stopping here for
`code-reviewer` before closing them, per the layer-1 order.

---

## 2026-09-22 — phase 2: layer-1 review resolved, gates green, PR open

`code-reviewer`: no P1. Two P2s (the revision tie-break was an untested path, now tested; the §9
tie-break wording was dispositioned for the design authority) and five P3s. Four P3s were fixed.
The unreachable `?? 0` and the second open branch were removed by restructuring, with no
coverage directive. `allTaskResults` was dispositioned as a ts-utils candidate. Coverage is 100%
on all four metrics.

All nine `ci.yml` steps ran locally and exited 0, including repo-wide `rush rebuild` and
`rush test`. The regenerated API report was unchanged by the review fixes.

PR [#685](https://github.com/ErikFortune/fgv/pull/685) targets `integration/agent-tasks-v1`. Per
"a PR anticipates its own merge", the ledger entry and the plan's T2 heading/status line are
marked shipped via #685 in the PR itself. The plan edit is two status lines, the same edit T1
made to that file.

Next: the Copilot loop (layer 2).
