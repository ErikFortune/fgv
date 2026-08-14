---
name: finalize-task
description: Use to close out a workstream or chore batch — the full completion ritual in one pass. Generates the stream's meta.yaml (summary synthesis + keywords), migrates active/<id>/ to completed/<bucket>/<id>/, scaffolds the polished README, drafts the docs/WORKSTREAMS.md ledger entry for review, and prompts on LIBRARY_CAPABILITIES.md and design-doc status. Load this skill BEFORE opening the PR that closes a stream — the migration ships in the same PR as the work, never as a follow-up. Also has a RETROACTIVE mode for already-completed streams that backfills metadata and ledger entries WITHOUT moving anything, used to close the gap between stream directories on disk and narrated ledger entries.
---

# Finalize Task

Closing a stream is a multi-part ritual: metadata, artifact migration, a polished
completion record, a ledger entry, a capabilities entry, change-file verification.
This skill is that ritual in one pass.

> **Why this is a skill and not a checklist.** It has been a checklist twice.
> `.ai/conventions/workflow/artifact-protocol.md` states the rule unambiguously —
> *"the migration ships in the same PR as the work"* — and records its own
> recurrence on the `ai-assist-client-tools` cluster close (#451 → #452):
> *"the codified rule existed; the failure was the orchestrator's pre-promotion
> checklist not gating on it."* The remedy applied then was another checklist gate.
> The corpus today holds substantially more stream directories than the ledger
> narrates. Writing it down did not hold; gating on a list did not hold. One
> invocation at the end of a long stream is what is left to try.

## Modes

| mode | when | moves files? |
|---|---|---|
| **`close`** (default) | finishing a live stream, before its PR opens | **yes** — `active/<id>/` → `completed/<bucket>/<id>/` |
| **`retroactive`** | a stream that already shipped and already sits in `completed/` | **no** — updates artifacts in place |

**Retroactive mode moves nothing.** The stream is already where it belongs; what is
missing is its metadata and its ledger entry. Skip step 3 entirely and do not create,
rename, or relocate any directory. If you find yourself about to move something in
retroactive mode, stop — you have misidentified the mode.

Invoke as `/finalize-task <stream-id>` or `/finalize-task <stream-id> retroactive`.

## The governing split: script what cannot be wrong, prompt what needs judgment

Some steps have exactly one right answer — do them. Some steps produce prose in
artifacts whose value *is* that they are curated — draft those and stop for review.

**Never auto-commit a `docs/WORKSTREAMS.md` entry or a
`.ai/instructions/LIBRARY_CAPABILITIES.md` edit.** Mechanical prose in either would
degrade an artifact that is currently good, to fill a gap. Draft, then hand it over.

Two rules apply throughout:

- **Blank beats fabricated.** Every field below may legitimately be empty. An empty
  field is honest; an invented one is a false claim in a record people will trust.
- **You may not have the tooling.** A `rush index-tasks` generator is proposed but may
  not exist yet. Every step here is doable by hand — read the files, write the YAML.
  Where a step names a command that does not exist, do it manually and say so.

## Procedure

### 1. Locate and read the stream

Find the directory: `.ai/tasks/active/<id>/` (close) or
`.ai/tasks/completed/<bucket>/<id>/` (retroactive).

Read, in this order — the order matters because step 2 is a *comparison*:

1. `brief.md` — what the stream was **asked** to do
2. `result.md` — what it **actually did**, including deviations
3. `state.md` — live checkpoint; **may be stale by design**, treat as weakest evidence
4. `design.md` / `README.md` if present

If `result.md` is absent in `close` mode, the stream is not finished. Say so and stop.
In `retroactive` mode an absent `result.md` is common — fall back to `README.md`, and
if that is also absent, produce a metadata record with blank synthesis fields rather
than inventing one.

### 2. Write `<stream-dir>/meta.yaml`

```yaml
id: <stream-id>
status: shipped              # proposed | in-flight | shipped | abandoned
packages: ['@fgv/…']         # omit if not determinable
prs: [621, 624]              # grep the artifacts for #\d+, verify each is real
opened: 2026-08-13           # omit if unknown
closed: 2026-08-14
summary:
  intended: >                # from brief.md — what it set out to do
  shipped: >                 # from result.md — what actually landed
  diverged: >                # the delta: scope cut, approach changed, verdict reversed
  sourceLine: '…'            # VERBATIM authored opener from result.md / README.md
keywords: [ … ]              # generated; concepts a literal grep would miss
sourceHash: <hash>           # over the artifacts this was derived from
```

**`summary` is a synthesis, and the synthesis is the point.** The most useful fact
about a closed stream is the delta between what it was asked to do and what it did.
No single authored line contains that, because it spans two files. Do not paste one
line and call it a summary.

**`diverged` empty is a legitimate and common answer** — many streams ship exactly
what they were briefed. Do not manufacture a divergence to fill the field. But look
for these, which recur:

- scope cut mid-stream ("built (a), deferred (b)")
- a verdict reversed (won't-do → will-do, or the reverse)
- an approach rejected in favour of another
- a finding that changed the design
- something shipped that the brief never mentioned

**`sourceLine` is your synthesis's own audit trail.** Copy the authored opening claim
verbatim — `**Shipped:** …`, `## Outcome`, `## Delivered`, `**Status:** …`. It costs
nothing and lets a later reader check your synthesis against its source without
opening the stream. If you cannot find one, leave it blank.

**`keywords` earn their place by adding recall.** Include concepts a literal grep for
the stream id would miss — the problem class, the primitives touched, the failure mode
addressed. Skip words already in the id.

### 3. Migrate the artifacts — **`close` mode only**

**Skip this entire step in retroactive mode.**

Move `active/<id>/` → `completed/<bucket>/<id>/`, where `<bucket>` derives from the
close date (`YYYY-MM`). Then write the polished `README.md` per
`.ai/conventions/workflow/artifact-protocol.md` § "What the polished README looks
like". `brief.md` / `state.md` / `result.md` are archived read-only alongside it.

This ships **in the same PR as the work**. Not after merge, not as a follow-up — both
failure modes are named in the protocol with the incidents that produced them.

### 4. Draft the `docs/WORKSTREAMS.md` entry — **for review, not for commit**

Match the shape of the entries already there (see the ledger's own § "Stream entry
shape"). They are narrative and opinionated, and that is deliberate — a mechanical row
would be a downgrade.

Lead with what a reader most needs: **what shipped, and what changed shape along the
way.** Include PR numbers, the status marker, and any open question the stream left.

Then **stop and present it.** Do not commit it unreviewed.

### 5. Prompt on the docs that ship with the code

`CODING_STANDARDS.md` § "Docs ship with the code" requires these in the same PR, and
the tell that it was skipped is a later PR whose diff is only `.md` status corrections.
Ask each question out loud; do not answer them silently:

- **Public surface changed?** → does `.ai/instructions/LIBRARY_CAPABILITIES.md` need a
  new entry or an amended one? Draft it; do not commit it.
- **Implemented a design?** → does that design doc still say "design only, not
  implemented"? A stale status line is read as input by the *next* stream.
- **Deferred something?** → is it in `docs/FUTURE.md` or `docs/TECH_DEBT.md`, or is it
  about to be lost?
- **Lesson worth codifying?** → `.ai/instructions/`, per the lessons convention.

### 6. Verify the mechanical gates

- `rush change --verify --target-branch origin/release` — **CI's first gate, and
  invisible to the entire local build/test suite.** A missing change file fails the job
  in ~30 seconds having compiled nothing.
- Regenerate the corpus index if a generator exists; skip if not.
- `git diff --name-only origin/release... | cut -d/ -f2` against the change files
  actually being shipped.

### 7. Report the ledger gap

Count stream directories under `.ai/tasks/` against `### ` entries in
`docs/WORKSTREAMS.md`. Report the streams with no entry.

This is the backlog that motivated the skill. Surfacing it each run keeps it from
drifting back out of view — and in retroactive mode it *is* the worklist.

## Retroactive mode, specifically

Used to close the existing gap between stream directories and ledger entries.

1. Steps 1, 2, 4, 5, 7 — **not 3, and not 6** (the work merged long ago; there are no
   change files to verify and nothing to migrate).
2. Set `status: shipped` and derive `closed` from the bucket the stream already sits in.
3. Batch them, but **do not batch the review** — each drafted ledger entry is a claim
   about what a stream did, and a reviewer skimming twenty at once will not catch a
   wrong one.
4. Prefer blank fields over reconstruction. These streams closed weeks or months ago;
   the artifacts are the only evidence, and if they do not say it, you do not know it.

## Stop conditions

Stop and ask rather than guessing when:

- `result.md` is absent in `close` mode — the stream is not done
- `brief.md` and `result.md` describe work that does not look like the same stream
- you cannot tell whether a PR number in the artifacts actually belongs to this stream
- the stream looks like part of a cluster and finalizing it alone would misrepresent it
- retroactive mode, and the stream is *not* already under `completed/` — it is a live
  stream and you have the wrong mode

## Anti-patterns

- **Committing a drafted ledger or capabilities entry** without review. The draft is
  input to a human decision, not the decision.
- **Filling `diverged` to look thorough.** Most streams ship what they were briefed.
- **Trusting `state.md`.** It is a live scratchpad and is frequently stale at close —
  the protocol says so.
- **Moving anything in retroactive mode.**
- **Treating a green `rush change --verify` as the only gate.** It is the first one,
  not the last.
- **Doing step 3 in a follow-up PR.** That is the named failure this skill exists to
  prevent.
