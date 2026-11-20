# Stream brief — `mistakes-log`

**Status: PROPOSED 🟡 — decision needed before any implementation.** Drafted 2026-08-16
from a concept the repo owner brought in. This brief evaluates it; it does not assume it.

## The concept, as received

A `MISTAKES.md` at the repo root, and one line in `CLAUDE.md`: *"Log mistakes in
MISTAKES.md (what happened, root cause, prevention)."* Every time the agent breaks
something or is corrected, it appends an entry — what happened / root cause / consequence
/ the rule that prevents a repeat. Newest first. No tooling.

Two claimed payoffs: the agent starts **citing** it ("this approach was avoided because it
caused XYZ before"), and repeated entries **graduate into hard rules** in `CLAUDE.md`, so
the log is where evidence accumulates and `CLAUDE.md` is where it gets enforced.

## The finding that should drive the decision: we already have most of this

Verified against the repo, 2026-08-16. Three artifacts already implement pieces of it:

| artifact | what it is | where it lives |
|---|---|---|
| `.ai/notes/orchestrator/lessons-pending.md` | the inbox — **71 headings, lessons numbered to L40+**, with a sweep history | **branch `claude/orchestrator-session`**, swept to `release` at intervals |
| `.ai/conventions/workflow/lessons-codification-triage.md` | the triage — five weighted destinations for a surfaced pattern | `release` |
| `.ai/conventions/workflow/doc-graduation.md` | how a parked lesson graduates | `release` |

So "log it, then graduate the repeats into hard rules" is **not a new idea here — it is
the existing design**. Any proposal must therefore answer a narrower question than the one
the concept poses:

> **What does `MISTAKES.md` do that `lessons-pending.md` does not already do?**

Three candidate answers, in descending strength. The first is strong enough on its own.

### 1. Reachability — the strongest argument, and it is structural

`lessons-pending.md` **lives on a branch**, by design (`doc-graduation.md`), and is
**orchestrator-scoped** by its own header. A normal implementing session — the sessions
that make most of the mistakes — cannot read it and is not expected to. The concept's first
payoff, *the agent reaches for it*, is unreachable for the existing artifact and would be
free for a root-level file on `release`.

This is the part worth having. It does not require adopting the rest.

### 2. Trigger point — logs at correction time, not at stream close

`lessons-pending.md` is fed by orchestrator sessions and swept at cluster close. That
captures cross-cutting design lessons well and **systematically misses the small
in-the-moment correction** — the wrong command, the test that pinned nothing, the gate run
with the wrong tool. Those are exactly the mistakes that repeat, because nothing records
them at the moment they are cheap to record.

### 3. Countability — the genuinely novel piece

The concept's claim that recurrence *counts* should drive graduation is the part the repo
does not do, and there is direct evidence it needs it:

- `.ai/tasks/.../finalize-task` skill, on its own existence: *"It has been a checklist
  twice… Writing it down did not hold; gating on a list did not hold."*
- `CODING_STANDARDS.md` on `samples/testbed`: **four consecutive streams** broke the same
  way before the remedy changed from advice to a checkbox.
- The `.ai/tasks/completed/2026-08/agent-memory-derived-state-reconciliation/` record: a
  lesson was codified in `TESTING_GUIDELINES.md` and the *next* stream reproduced it one
  file over.

In every case recurrence was noticed **anecdotally and late**. A count is cheap and would
have fired earlier.

## The evidence this session produced, including against the idea

This session made at least five loggable mistakes. They are worth stating plainly because
they bear on the design in both directions.

| # | mistake | already covered by an always-on rule? |
|---|---|---|
| 1 | Wrote a regression test that passed against the un-fixed code (`defaultSafeIntegers` set after construction) | **Yes** — `TESTING_GUIDELINES.md`: *"A regression test you have not seen fail is a guess."* |
| 2 | Did it **again**, differently, in the next stream (reopen-and-write leak test) | **Yes** — same rule |
| 3 | Ran `git checkout origin/release -- .`, silently overwriting the working tree | No |
| 4 | Reported 100% coverage from `heft test` when `rushx coverage` disagreed | Partially — the standards name the gates but not that these two disagree |
| 5 | Cited `provenanceSource` shipping as evidence a *doc-only* stream shipped — wrong stream | No |

**The uncomfortable half.** Mistakes 1 and 2 were already covered by an explicit,
always-on, correctly-worded rule that I had read. Logging them again would not obviously
have prevented the second. This is real evidence that **the log's value is concentrated in
mistakes 3–5 — the ones no rule covers — and that graduating a rule into `CLAUDE.md` is not
sufficient to prevent recurrence.** A proposal that assumes graduation is the fix is
assuming the thing this session falsifies.

**The supportive half.** Mistakes 3–5 are exactly the small mechanical corrections nothing
in the current substrate captures, and #1/#2 *were* caught both times by the same
countermeasure (revert the fix, watch the test go red) — which is procedural, not a rule.
That suggests entries should record **the check that caught it**, not only the rule that
would have prevented it.

## Open questions the stream must answer

1. **Is "no tooling" the right end state?** It is clearly the right *start*. But
   `lessons-pending.md` reached 71 headings and is periodically swept precisely because
   unpruned logs stop being read. What is the pruning rule for `MISTAKES.md`, and is
   "graduate then delete" sufficient? A log that only grows is a diary, which the concept
   itself names as the failure mode.
2. **What is the relationship to `lessons-pending.md`?** Options: (a) `MISTAKES.md`
   replaces it, (b) `MISTAKES.md` is the session-facing front end and lessons-pending stays
   the orchestrator's, (c) they merge. **Two inboxes with overlapping scope is the worst
   outcome** and is the default if this ships without deciding.
3. **What is the graduation threshold, and who counts?** "Four or five" is a starting
   number, not a measured one. With no tooling, counting is by eye — which is how
   recurrence already gets missed.
4. **Does an entry record the rule, the check, or both?** Per the evidence above, the
   check that caught it may be more transferable than the rule that should have prevented it.
5. **Does it live on `release`?** It has to, for payoff #1 to exist. That means it is in
   every diff and every publish; confirm that is acceptable.

## Recommended shape, if it proceeds

Deliberately smaller than the concept as received:

- **`MISTAKES.md` at the repo root, on `release`**, newest first.
- **One line in `CLAUDE.md`**, as proposed — no more, because always-on rules compete for
  attention with every other always-on rule (`lessons-codification-triage.md`'s own cost table).
- **Entry shape:** what happened / root cause / **the check that caught it** / the rule that
  would prevent it / a recurrence count.
- **Scope it to the class the existing substrate misses**: in-the-moment mechanical
  corrections. Cross-cutting design lessons keep going to `lessons-pending.md`. That is the
  answer to OQ-2 unless the stream finds a better one.
- **A graduation rule stated in the file itself**, with the threshold written down so it is
  countable rather than felt.

## Explicitly NOT in scope

- Tooling, a plugin, or a vector store. The concept is right that this starts as a flat file.
- Retroactively mining this session's or any prior session's mistakes into entries. Seed it
  with the five above at most, and only if they survive the OQ-4 decision about entry shape.
- Changing `lessons-pending.md`'s existing 71 entries or their graduation history.

## Acceptance criteria

- [ ] OQ-1 through OQ-5 answered in the artifact, not left implicit
- [ ] The relationship to `lessons-pending.md` stated in **both** files, so neither reads as
      the only inbox
- [ ] `MISTAKES.md` on `release` with its own graduation rule and threshold
- [ ] Exactly one line added to `CLAUDE.md`
- [ ] A stated way to tell, later, whether it worked — otherwise this is unfalsifiable and
      will be kept out of politeness
