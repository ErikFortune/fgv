# agent-tasks-i2 — prompt fragments and the final composition check

**Shipped**: 2026-10-01 via [PR #707](https://github.com/ErikFortune/fgv/pull/707) into `integration/agent-tasks-v1` (finalized at the agent-tasks cluster close, 2026-10-01).

## Summary

Slice I2 lets agent task context go into a cacheable prompt as **one trailing per-request slot**
after a stable prefix. Two guarantees come with it. The body that is sent must be the body that was
analyzed. A delivery's receipt can be acknowledged only against the exact text that was sent.

It adds a new `prompt` packlet to `@fgv/ts-agent-tasks`. `checkTaskPrompt` refuses unless:

- the composition is *positively* available. An empty `cacheFindings` is never read as evidence of
  analysis.
- the task slot is the one trailing section and carries the context exactly once.
- a stable prefix precedes it.
- no refusing cache finding fired.
- the breakpoint plan ends at the slot.

`prepareTaskPrompt` wraps a bound delivery in a handoff that carries no receipt. The handoff
releases the receipt only on `acknowledge(sentSystem)` with text equal to the checked body. A failed
check or a mismatched send abandons the delivery's manifest. The slice also framed `task_inspect`
details through a newly published `serializeTaskData`, which retired the I2-triggered TECH_DEBT
entry.

## Files changed

- `@fgv/ts-agent-tasks` `src/packlets/prompt/` (new):
  - `fragments.ts`: `defaultTaskContextSlotName`, `taskDataInterpretationRules`, `taskContextSlot`,
    `taskPromptTemplate`, `taskPromptDescriptor`, `taskPromptRecord`, `taskContextSubstitutions`.
  - `checkedPrompt.ts`: `checkTaskPrompt` and `ICheckedTaskPrompt`.
  - `handoff.ts`: `prepareTaskPrompt` and `ITaskPromptHandoff`.
- `context/escaping.ts`: publishes `serializeTaskData`.
- `tools/presentation.ts`, `tools/taskTools.ts`, `types/tools.ts`: `task_inspect.details` is now
  escaped one-line text, and `maxDetailsChars` counts the escaped text.
- New dependency on `@fgv/ts-prompt-assist` (3-line lockfile diff).
- Tests:
  - `prompt/checkedPrompt` (31), `prompt/handoff` (12), `prompt/fragments` (11), `prompt/outbound` (8)
    and `context/taskData` (7).
  - `tools/bounding` gained 3 tests and `publicSurface` gained 1.
  - `context/purity` was amended.
  - New helper: `test/helpers/promptFixtures.ts`.
- `CAPABILITIES.md`, `api.md`, `LIBRARY_CAPABILITIES.md`, the plan's I2 status line, the ledger and
  `docs/TECH_DEBT.md`.

## Decisions made during execution

- **Receipt binding: candidate 1's binding, held in candidate 3's handoff.** Each candidate was
  checked against source:
  - **Text hash in the receipt: not buildable within the slice.** `IPromptComposition.sections`
    does give a canonical slot text. But `ITaskInclusionReceipt` is T2's canonical shape, and T7's
    `acknowledge` compares it in full against the stored manifest without ever seeing the body.
    Carrying a hash would change the receipt converter, the manifest and storage.
  - **Composition identity: not buildable.** `IPromptComposition` has no id, hash or revision.
  - **What shipped:** the handoff holds the exact checked body and compares it by full string
    equality. A hash would only earn its place if the binding were persisted or transported, and it
    is neither.
- **What the host must do.** The library cannot see the wire. The host must pass the text it
  *actually sent*, and must re-resolve and re-check after any change to the body.
- **The snapshot path trusts its context to be one render.** On this path, `checkTaskPrompt` with
  a host-rendered context and `receiptFor` binds the context's text to the body. It trusts T2 for
  the claim that the receipt describes that text. This is layer-1 P2-a, documented rather than
  verified.
- **`task_inspect` details are data, framed like task prose.** The hazards being escaped do not
  depend on the channel. As a result:
  - `details` is now a string, which is BREAKING (change file `minor`).
  - Details that cannot be framed fail the call. This is I1a's rule that a failing projector fails
    the call.
- **Handoff calls are serialized** after Copilot round 1. A refusal is terminal and is set before
  the abandonment is awaited.
- **`met` requires the request's own measure and a finite, non-negative
  `minCacheablePrefixTokens`.** Without both, the verdict is `unknown` (Copilot round 2).
- **`ts-prompt-assist` and `ts-extras` were consumed unchanged.** No upstream bug needed a fix.

## Followups

- **Fold rows `I2-1…I2-36` into `perf/mutationMatrix.js`.** Recorded in `docs/TECH_DEBT.md` (P3).
  Its trigger, "the M1 stop-state cohort lands, or cluster close", has now fired.
- **`JsonConverters.jsonValue` admits `Infinity`.** Recorded in `docs/TECH_DEBT.md` (P3).
- **No provider cache-hit claim and no `HorizontalComposer` integration.** These are stated as
  "not given" in result.md § *What P1 can rely on*. They are deliberate non-goals, not deferred
  work, so they have no tracking entry.
- **Verifying the snapshot path's receipt-to-text pairing** would need a text hash in the receipt,
  which is a T2/T7 surface change. That is documented on `checkTaskPrompt` only, with no TECH_DEBT
  entry.

## Lessons codified during the run

None were written into `.ai/instructions/` by this stream. Two observations are worth carrying:

- **A real library caught what fabricated metadata would have hidden.** The first version of
  `taskPromptTemplate` emitted `{{name}}`, which `ts-prompt-assist` refuses at load.
- **The brief's Copilot guidance was inverted here.** The brief said to trigger Copilot with a
  comment because the API trigger is unreliable. Here, both `@copilot review` comments (12:20 and
  13:41 UTC) never registered, and the API request worked.
- **Layer 1 was right but stopped one step short on a check-then-act window.** Layer 1 flagged the
  concurrency window (P3-c), and the fix covered only the already-acknowledged case. Copilot round
  1 found the same window one step further: a check-then-act across an `await`, which is the brief's
  trap 3.

## References

- Brief: `brief.md`
- Live state: `state.md`
- Exit artifact: `result.md`
- Revert matrix: `i2Matrix.js` (rows `I2-1…I2-36`; run with `--pkg` on a copy)
- PR: [#707](https://github.com/ErikFortune/fgv/pull/707)
- Related streams: `agent-tasks-t2`, `agent-tasks-t7`, `agent-tasks-i1a`, `agent-tasks-m1-stop`,
  `agent-tasks-p1`
