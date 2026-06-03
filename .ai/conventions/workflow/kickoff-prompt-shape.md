# Convention — `convention.workflow.kickoff-prompt-shape`

> Source: distilled from `<repo>/docs/CHORES.md § Kickoff-prompt
> shape for chore agents` and the `workstream-brief` skill in the
> source corpus.

The shape of a kickoff prompt the orchestrator hands to a worker
agent. Different from the operational brief itself — the kickoff is
the message that wraps and points at the brief.

---

## Two shapes by workflow

### Stream kickoff — full upfront context

For a stream worker (`role.orchestrator.stream-agent`), the kickoff
delivers the full operational brief in one message. The brief is the
contract; the worker reads it in full, loads required reading, and
proceeds.

Shape:

- **Mission** — what success looks like, briefly.
- **Status entering** — what's already shipped that this stream
  depends on.
- **In-scope paths / out-of-scope paths** — file-boundary stake-out.
- **Required reading** — explicit list, in order of priority.
- **Skills to load when relevant** — explicitly named, with their
  trigger conditions.
- **Missing-input rule** — STOP if a required input is missing
  rather than fabricating context.
- **Dependencies** — hard and soft.
- **Phases** — numbered phases inside this stream, each with
  sub-steps.
- **Acceptance criteria** — exit gates as a checklist.
- **Required exit artifact** — the result.md shape.
- **Resume protocol** — how to resume mid-stream from state.md.
- **Coordination boundaries** — repo conventions to honor.
- **Branch + PR posture** — branch naming, PR opening rhythm,
  model recommendation.

### Chore-batch kickoff — interleaved per item

For a chore-batch worker (`role.orchestrator.chore-batch-agent`),
the kickoff delivers an interleaved-per-item shape, **not** the
upfront full-context shape. This is the load-bearing innovation of
the chore-batch workflow.

Don't give the agent a single upfront "Read everything before
coding" list spanning all items. That signals "deeply understand all
N items before starting any" and produces:

- **Context bloat** (N × M file reads before any code lands; real
  compaction risk on longer sessions).
- **Long time-to-first-commit** (no signal to the user that the
  batch is progressing).
- **Wasted exploration on independent items** (the agent re-orients
  when it gets there anyway).
- **Premature planning of items that depend on shape produced by
  *other* items** (e.g. coverage closure planned before the file it
  covers stabilizes).

The interleaved shape:

- **One short upfront read for batch-level context only** — the
  batch register entry, immediately-prior stream READMEs, the
  canonical docs that explain the *why*, **not** per-item file
  surfaces.
- **For each item**: read item N's specific code surface → write the
  brief.md section for item N → ship item N → checkpoint in
  state.md → move to item N+1.
- **For items that explicitly depend on prior items' output**: say
  "do not scope item N until items M-X have shipped." Don't rely on
  the agent to infer the dependency from "run last" framing.

## What both shapes share

- **A contract, not a draft.** Either you have enough to ship a
  complete prompt, or you don't. If you don't, ask the targeted
  clarifying question — don't deliver a half-prompt.
- **The missing-input rule.** Both stream and chore-batch kickoffs
  must include the explicit STOP-and-surface-the-gap rule for any
  required-reading file or declared input that doesn't exist.
- **File boundaries staked out.** In-scope and out-of-scope paths
  named explicitly. Out-of-scope is load-bearing because it prevents
  collisions with parallel streams.
- **Skill triggers named.** Skills the worker should load are named
  with their trigger conditions, not just listed.
- **Resume protocol.** How to resume from `state.md` if the session
  crosses a context boundary.
- **Review-loop discipline inherited from `CODING_STANDARDS.md`
  § "Review-loop discipline".** Every kickoff implicitly requires:
  - **Layer 1** — `code-reviewer` agent on the final diff before
    opening the PR; findings resolved or dispositioned with a
    summary in the PR description.
  - **Layer 2** — agent-driven Copilot loop: request on the first
    complete commit; re-request after each round as long as
    Copilot is adding substantive value; cap at 10 rounds; stop
    on diminishing returns OR cap and surface the stop with a
    one-line reason.
  - Both are part of the standard PR-description gate
    (`code-reviewer` summary + Copilot-loop status line) — kickoffs
    don't need to re-state the rules, but they should remind the
    worker that the discipline is mandatory and reference the
    `CODING_STANDARDS.md` section.
  - **Round count is not the stop signal — substantive value per
    round is.** Round 3 surfacing a load-bearing structural finding
    is *not* a stop signal; round 2 surfacing only nitpicks *is*.
    Implementing agents call the stop based on the most recent
    round's finding profile, not on a round-count threshold.
- **PR base for multi-phase streams targets an integration branch,
  not `release`.** Stream kickoffs for design-triage-implement
  workflows should instruct the implementing agent to base their
  PR on the stream's integration branch (`<stream-id>`, off
  `release` HEAD). Phase A design, Phase B triage, Phase C
  implementation all merge onto the same integration branch; the
  orchestrator opens the cluster-close PR (integration → release)
  when implementation completes. Phase A design does NOT land on
  `release` as its own commit. See orchestrator agent prompt §
  "Design triage cycle" for the integration-branch posture.

## Anti-patterns

- **Half-prompt asking the user to fill blanks.** Either ship a
  complete prompt or ask a clarifying question.
- **Upfront read-all-items list for chore batches.** Defeats the
  interleaved shape; produces the failure modes named above.
- **Implicit dependencies between items.** "Run last" without "do
  not scope item N until items M-X have shipped" produces shallow
  scoping.
- **Out-of-scope paths missing.** Worker has no way to know what
  parallel streams own; collisions follow.
- **Skill list without trigger conditions.** "Load these skills"
  without naming when produces under-loading; the worker doesn't
  know if a given file surface should trigger the load.

## Pattern observed (provenance)

The pre-S2.3 cleanup chore batch in the source corpus mixed signals
— the upfront read-list spanned all 5 items, but First Moves said
"spike item 1 first." The agent reasonably read it as "thorough
upfront exploration"; the result was fine but slower than necessary.
Future chore-batch prompts in the corpus use the interleaved shape;
this convention captures the lesson.

## Adapter notes

The kickoff prompt is realized as the message text the orchestrator
hands the worker. Harness mechanics vary (parallel cloud agent
invocation, sub-agent Task call, fresh chat session) but the prompt
shape is harness-agnostic.
