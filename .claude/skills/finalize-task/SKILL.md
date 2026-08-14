---
name: finalize-task
description: Use to close out a workstream or chore batch — the full completion ritual in one pass. Generates the stream's meta.yaml (summary synthesis + keywords), migrates active/<id>/ to completed/<bucket>/<id>/, scaffolds the polished README, drafts the docs/WORKSTREAMS.md ledger entry for review, prompts on LIBRARY_CAPABILITIES.md and design-doc status, and runs an antagonist pass that tries to refute its own output for inaccuracies and omissions before anything is handed over. Load this skill BEFORE opening the PR that closes a stream — the migration ships in the same PR as the work, never as a follow-up. Also has a RETROACTIVE mode for already-completed streams that backfills metadata and ledger entries WITHOUT moving anything, used to close the gap between stream directories on disk and narrated ledger entries.
---

# Finalize Task

Closing a stream is a multi-part ritual: metadata, artifact migration, a polished
completion record, a ledger entry, a capabilities entry, change-file verification —
then an **antagonist pass** over everything the ritual just asserted. This skill is
that ritual in one pass.

> **Why this is a skill and not a checklist.** It has been a checklist twice.
> `.ai/conventions/workflow/artifact-protocol.md` states the rule unambiguously —
> *"the migration ships in the same PR as the work"* — and records its own
> recurrence on the `ai-assist-client-tools` cluster close (#451 → #452):
> *"the codified rule existed; the failure was the orchestrator's pre-promotion
> checklist not gating on it."* The remedy applied then was another checklist gate.
> Measured 2026-08-14: **68 stream directories, 41 ledger entries, 31 directories with
> no entry under their own name — 20 of them unmentioned in the ledger entirely.**
> Writing it down did not hold; gating on a list did not hold. One invocation at the
> end of a long stream is what is left to try.

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

**`prs` is merged PRs only, and stays a flat list of integers.** An index tool reads it;
a dict or a list of objects breaks that. A stream that also has *retired*, *superseded*
or *deliberately-held* PRs puts them in a sibling `prHistory` map instead —

```yaml
prs: [357, 358, 372]
prHistory:
  retired:
    - number: 359
      why: 'first single-agent attempt; abandoned after context drift, never merged'
  held:
    - number: 373
      why: 'deliberately not merged so the next round could be a cold-start integration'
```

This is not tidiness. Listing a closed-unmerged PR in `prs` **asserts it merged**, and a
retired PR is often the most instructive thing a cluster produced — the reason a workflow
shape changed. Verify state rather than assuming: a number appearing in an artifact is not
evidence it landed.

Two more fields, both optional and both worth adding when they apply:

- **`ledgerEntry:`** when `docs/WORKSTREAMS.md` narrates the stream under a *different*
  name than the directory. Without it, every future reconciliation reports the stream as
  un-narrated and someone re-does this work. (Known instances: directory `ts-prompt-assist`
  → entry `ts-prompt-assist-features`; directory `safer-fetch-s3` → narrated as the S3
  sub-stream of `fetch-primitive-threat-model`.)
- **`relatedStreams:`** — `{id, relationship}` pairs. A one-file fix stream is illegible
  alone; its parent is the most important fact about it.

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

### 6. Antagonist pass — try to refute your own output

Everything produced above is a **claim about what happened**, written by whoever just spent a long
stream forming a view of what happened. That is precisely the condition under which a confidently
wrong claim gets written and not noticed.

**Commission an independent reviewer if you can spawn one** (`code-reviewer`, or a general agent
briefed as below). `docs/STATUS.md` records why: *"Independent layer-1 passes earn their cost.
Four streams ran without an agent-spawn tool in their session and self-reviewed instead.
Commissioning independent `code-reviewer` passes retroactively found: a real P2 on #582…"*. If you
cannot spawn one, run the pass yourself — but run it **as a separate deliberate pass with the
brief below**, not as a re-read.

**Frame it to refute, not to approve.** The reviewer's job is to find what is wrong or missing.
"Looks right" is not an output; if nothing survives scrutiny, say so explicitly and name what was
checked.

**Default to "wrong" under uncertainty.** A claim you cannot trace to an artifact is a finding,
not a maybe.

#### The two classes, and the harder one

**Inaccuracies** — claims contradicted by the evidence:

- Does every assertion in `summary.intended` / `shipped` trace to a specific line in `brief.md` /
  `result.md`? Quote the line or drop the claim.
- Does `sourceLine` actually appear verbatim in the source file?
- Do the `prs` numbers belong to *this* stream, and are they in the state claimed (merged vs
  open)? Check, do not assume.
- Does the drafted ledger entry's status marker match reality?
- Do `packages` match what the PRs actually touched?

**Omissions** — the harder half, and the more valuable. Ask *"what should be here and is not?"*:

- **`diverged` is empty — is that true, or unexamined?** This is the highest-yield check. Read
  `brief.md` and `result.md` side by side and look for scope cut, a reversed verdict, a rejected
  approach, a finding that changed the design, or something shipped that the brief never mentioned.
  An empty `diverged` on a stream that visibly changed shape is the characteristic failure of this
  whole ritual.
- Did the stream **defer** anything that is now recorded nowhere — not in `FUTURE.md`, not in
  `TECH_DEBT.md`, not in the ledger entry?
- Did it change a **public surface** with no `LIBRARY_CAPABILITIES.md` draft?
- Did it **implement a design** whose doc still says "design only"?
- Did it surface a **lesson** that will be lost?
- Are there findings in `findings/inbox/` that were never dispositioned?
- Does the ledger entry omit an **open question** the stream left behind?

#### Handling the findings

Fix inaccuracies. Fill genuine omissions. For anything you decline, **record the decline with its
reasoning** in the artifact — the repo's convention throughout is that a considered-and-rejected
option is more useful than silence, because it stops the next person re-litigating it.

If the pass changes `meta.yaml`, recompute `sourceHash`.

#### Which artifacts may be corrected, and how

The split is by **who wrote it and when**, not by which file is convenient:

| artifact | on a wrong claim |
|---|---|
| `brief.md`, `brief-phase-*.md`, `design*.md`, `state.md` | **never edit** — authored in flight, evidence of what was known at the time |
| `README.md` | **amend in place, preserving the original** |
| `meta.yaml` | edit freely; it is this ritual's own output |

`README.md` is a *synthesis written after the fact*, and later agents read it as a statement
of what shipped. A synthesis that is wrong about its own subject is a hazard, not a
historical record — but silently rewriting it destroys the audit trail, so do neither.
Instead:

1. Correct the claim inline, with a pointer to the appendix entry.
2. Add an `## Appendix A — corrections (YYYY-MM-DD)` at the end.
3. Under it, one `### A.n — <what was wrong>` per finding, each **quoting the original
   verbatim in a blockquote**, then stating what is true and how it was verified.
4. Add a `### Checked and unchanged` closing section naming what survived scrutiny — a
   correction list with no stated scope is indistinguishable from a partial pass.
5. Note the amendment in a blockquote under the header so a skimmer sees it.

Some findings are *additions* rather than corrections — a followup recorded nowhere durable,
a lesson that was surfaced and dropped, a binding constraint that was missed. Those belong in
the appendix too; title it `— notes` rather than `— corrections` if nothing in the file was
actually wrong.

**Leave a design error in `design.md` uncorrected even when the code is right** — that a
signed-off design was wrong and step-zero verification caught it is the most valuable thing
such a stream records. Say so explicitly in the appendix, or a later reader reads the
divergence as an oversight.

Anchors: GitHub slugs lowercase the heading, strip punctuation, and replace **each** space
with a hyphen without collapsing runs — so `### A.1 — the thing` becomes
`#a1--the-thing` (two hyphens, from the spaces that flanked the em dash).

### 7. Verify the mechanical gates

- `rush change --verify --target-branch origin/release` — **CI's first gate, and
  invisible to the entire local build/test suite.** A missing change file fails the job
  in ~30 seconds having compiled nothing.
- Regenerate the corpus index if a generator exists; skip if not.
- `git diff --name-only origin/release... | cut -d/ -f2` against the change files
  actually being shipped.

### 8. Report the ledger gap

Take the **set difference on stream ids, in both directions** — not the difference of
two totals. Report the streams with no entry.

```bash
find .ai/tasks/active -mindepth 1 -maxdepth 1 -type d -printf '%f\n'  > /tmp/d.txt
find .ai/tasks/completed -mindepth 2 -maxdepth 2 -type d -printf '%f\n' >> /tmp/d.txt
sort -u /tmp/d.txt -o /tmp/d.txt
grep -o '^### `[^`]*`' docs/WORKSTREAMS.md | sed 's/^### `//;s/`$//' | sort -u > /tmp/l.txt
comm -23 /tmp/d.txt /tmp/l.txt   # directories with no ledger entry  ← the worklist
comm -13 /tmp/d.txt /tmp/l.txt   # ledger entries with no directory  ← naming mismatches
```

**Two traps, both of which have already produced a wrong number in a committed doc:**

- **`grep -c '^### '` over-counts.** The ledger carries prose section headings at the
  same level as stream entries. Match on the backticked form and nothing else.
- **`dirs − entries` is not the gap.** Ledger entries naming a stream whose directory
  is absent (or differently named) cancel against real gaps, so the subtraction lands
  low and hides the reconciliation work. Both `comm` directions are the report; the
  second is short and each line in it is a question worth answering.

A directory absent from `comm -23` is not necessarily narrated — it may be *mentioned*
inside another stream's entry without having one of its own. If you want that finer
read, grep each gap id against the whole ledger and separate "unmentioned" from
"mentioned in passing".

This is the backlog that motivated the skill. Surfacing it each run keeps it from
drifting back out of view — and in retroactive mode it *is* the worklist.

## Retroactive mode, specifically

Used to close the existing gap between stream directories and ledger entries.

1. Steps 1, 2, 4, 5, **6**, 8 — **not 3, and not 7** (the work merged long ago; there is nothing
   to migrate and no change file to verify). **The antagonist pass is not optional here** — it is
   more important in retroactive mode, not less, because you are reconstructing a stream you did
   not run from artifacts written by someone else.
2. Set `status: shipped` and derive `closed` from the bucket the stream already sits in.
3. Batch them, but **do not batch the review** — each drafted ledger entry is a claim
   about what a stream did, and a reviewer skimming twenty at once will not catch a
   wrong one.
4. Prefer blank fields over reconstruction. These streams closed weeks or months ago;
   the artifacts are the only evidence, and if they do not say it, you do not know it.
5. **Amending a README is in scope; moving anything is not.** Retroactive mode's
   no-move rule is about *directory structure*, not about leaving a false claim standing.
   Follow the correction convention in step 6 — inline fix plus a verbatim appendix.

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
- **Running the antagonist pass as a re-read.** Re-reading your own draft in the same frame that
  produced it is not a review. Spawn an independent reviewer, or at minimum stop, change frame,
  and work the checklist explicitly.
- **An antagonist pass that returns "looks good".** If it found nothing, it must say what it
  checked. A clean pass with no stated scope is indistinguishable from a pass that did not run.
- **Doing step 3 in a follow-up PR.** That is the named failure this skill exists to
  prevent.
