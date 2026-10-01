# agent-tasks-i1a — the tool factory and the read-only surface

**Shipped**: 2026-09-29 via [PR #702](https://github.com/ErikFortune/fgv/pull/702) into `integration/agent-tasks-v1` (finalized at the agent-tasks cluster close, 2026-10-01).

## Summary

This is slice one of four in plan § I1. The I1 split was decided up front. The slice adds a `tools`
packlet to `ts-agent-tasks`. `createTaskTools({ view, renderer?, budget? })` returns exactly two
`AiAssist.IAiClientTool`s, `task_query` and `task_inspect`, over an `IBoundTaskView`.

Bounding is on by default, not opt-in:

- Tasks reach the model only as `TaskContextRenderer` text.
- A page item the text omitted or abbreviated is named by id, so paging skips nothing unannounced.
- Details are returned only within budget.
- A failing projector fails the call.

A failure reaches the model as its code and a fixed description, never as host text. The packlet
references no `IBoundTaskWriter` member. That is the evidence for I1's gate *"read-only use has no
mutation dependency."*

## Files changed

All in `@fgv/ts-agent-tasks` (squash `96ebc0d1`, 33 files):

- **`src/packlets/tools/` (new):** `taskTools.ts`, `presentation.ts`, `viewAnswers.ts` (added in
  Copilot round 4), `schemas.ts`, `index.ts`. Also `src/packlets/types/tools.ts` (new).
- **The renderer extension:** `types/context.ts`, `converters/contextConverters.ts`,
  `context/renderer.ts`, `context/normalize.ts`.
- **Tests:** four suites under `src/test/unit/tools/` (`bounding`, `factory`, `reads`,
  `requestCapture`) and `test/helpers/toolFixtures.ts`.
- **Other package files:** `package.json` (the `@fgv/ts-extras` dependency, added with `rush add`),
  rows I1a-1…I1a-31 in `perf/mutationMatrix.js`, `CAPABILITIES.md` and `etc/ts-agent-tasks.api.md`.

## Decisions made during execution

- **A failing projector fails the call.** The alternative was to "yield less". It was rejected
  because dropping a page item misstates completeness *and* advances the cursor past a task the
  model never saw.
- **The model gets a code, never host text** (Copilot round 1, high). Truncation bounds a disclosure
  but does not prevent one. Host text goes to a new optional `Logging.ILogger`. Only
  argument-validation failures are passed through, cut at 500 UTF-16 units and never inside a
  surrogate pair.
- **The whole view answer is converted before anything reads it** (`viewAnswers.ts`, round 4).
  Rounds 2–4 had found the same defect three times, one field per round. `oneOf` over
  literal-pinned arms was used instead of `discriminatedObject`, because the latter indexes its arm
  table with the raw discriminator.
- **The renderer was extended rather than worked around.** `IContextUnresolvedReference` makes the
  binding optional, through a **separate** converter. The storage converter still requires a
  binding, and a test pins this.
- **`limit` above the budget is refused, not clamped.**
- **The `@fgv/ts-extras` dependency follows the `ts-agent-memory` precedent.**

## Followups

- **Unframed details beside framed context** (`docs/TECH_DEBT.md` [P3]): resolved by
  `agent-tasks-i2` (2026-10-01).
- **`JsonSchema.integer` has no `minimum`/`maximum`** (`docs/TECH_DEBT.md` [P3]): still open. The
  trigger fired in I1b, I1c and I1d. Each declined it as a `ts-json-base` extension outside its
  surface, and the entry now says to take it as its own chore.
- **For I1b:** the opt-in shape and the reuse of the failure path were taken up by
  `agent-tasks-i1b`.
- **For I1c:** registry parameter schemas were taken up by `agent-tasks-i1c`.
- **For I1d:** `inspectStop` was taken up by `agent-tasks-i1d`.
- **On Gemini, closure is enforced by validation only**, because that dialect drops
  `additionalProperties`. This is documented in `libraries/ts-agent-tasks/CAPABILITIES.md`. It is
  a property of the dialect, not a followup.

## Lessons codified during the run

No `.ai/instructions/` file was changed (the squash touched only `LIBRARY_CAPABILITIES.md`'s
reflex). `result.md` records lessons that the I1b brief carried forward:

- **A model-facing failure path is a disclosure surface, not a formatting one.** Layer 1 fixed the
  bound and left the disclosure.
- **A revert row can be wrong in either direction.** I1a-18's mutant was a no-op, because
  `strictObject` never calls an absent optional field's converter. I1a-21 was red for the wrong
  reason: dropping `.optional()` made the cursor required.
- **A capture test that finds nothing must be investigated before it is believed.** The Gemini
  tools were under `function_declarations`.

## References

- Brief: `brief.md`
- Live state: `state.md`
- Exit artifact: `result.md`
- Plan: `docs/design/agent-tasks/implementation-plan.md` § I1
- PR: [#702](https://github.com/ErikFortune/fgv/pull/702)
