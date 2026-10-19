# Convention — `convention.workflow.operating-modes`

Who runs the worker agents, and when the orchestrator may run them itself.

---

## Default: the user runs the workers

The orchestrator **prepares** work; the user **runs** it.

For each stream, the orchestrator:

1. Creates the stream's branch from the right base: `release` for a direct-to-release stream, the
   integration branch for a cluster phase.
2. Commits `brief.md`, plus an empty `state.md`, under `.ai/tasks/active/<stream-id>/` on that
   branch, and pushes it.
3. Hands the user a **paste-ready kickoff prompt** (shape:
   [`kickoff-prompt-shape.md`](kickoff-prompt-shape.md)). The prompt names the branch to work on, and
   tells the worker the brief on that branch is its contract.

The user starts a separate agent session with that prompt. When the worker reports back, **the
orchestrator and the user both review the result**, and the user sends the worker any follow-up
instructions. The orchestrator's contribution to that loop is its review, plus any follow-up
instructions it proposes. Gating (the independent `code-reviewer` pass, the combined-tree gate, and
the PR checks) is unchanged and still the orchestrator's to run or to ask for.

**Why this is the default.** The orchestrator's context is the scarcest resource in the system, and
it is the one place where cross-stream state lives. A worker running inside the orchestrator's
session spends that context on build output and file reads. It also serializes work that should be
parallel: one session cannot usefully drive several workers and keep reviewing. Separate sessions
parallelize for free, and they keep the user in the loop at each hand-back, which is where most course
corrections happen.

## Exception: autonomous development, by explicit authorization only

Sometimes, for example overnight, the user **explicitly authorizes autonomous development**. Only
then does the orchestrator launch the workers itself (Agent tool, `isolation: "worktree"` when more
than one runs at a time), run the review and follow-up loop without the user, and drive PRs to green.
See `.claude/agents/orchestrator.md` § "Commissioning Task subagents" for the mechanics.

The authorization covers what the user said it covers, for the session in which they said it. It is
not inferred from urgency, from a small task size, or from an earlier session's authorization. A
stream that "would be quicker to just run" is not an exception. Prepare the branch and the prompt.

Under autonomous operation, the gates are **stricter**, not looser, because no human reviews the
hand-back. The orchestrator must:

- run the independent review itself;
- re-run the gate on the combined tree;
- verify the worker's claims against the branch, not against its final message.

## Observed

2026-10-02: an orchestrator ran the `ts-extras-browser-barrel-gaps` worker inside its own session
without authorization. The work was sound, but it spent orchestrator context on a worker's hand-back,
and it was about to do the same for a second stream in parallel when the user corrected it. This
convention exists because that default had never been written down.
