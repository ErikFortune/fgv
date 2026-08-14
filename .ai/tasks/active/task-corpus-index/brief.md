# Stream brief — `task-corpus-index`

**Status: PROPOSED — not started.** Drafted 2026-08-14.

**Scope grew during drafting, and the centre moved.** It began as "an index so an agent can find
things." It is now **two skills and the metadata contract between them**: `/finalize-task` (write
side — the completion ritual made executable) and `/task-corpus` (read side). The index is one
derived artifact in the middle, not the point. The retitle is deliberate but the id is kept,
since the ledger already references it.

## Motivation

`.ai/tasks/` holds **269 markdown files / 3.1 MB** across **14 active** and **52 completed**
streams. It is the repo's institutional memory: why a design was chosen, what a stream
actually shipped, which findings were dispositioned and why.

An agent picking up cold cannot use most of it, and the reason is **not** retrieval capacity.
3 MB is trivially greppable and every agent already has `Grep`/`Glob`/`Read`. The reason is
**discovery**: you cannot grep for a stream whose existence you do not suspect. The corpus is
addressable only by someone who already knows what is in it.

The symptom shows up as re-derivation. This session alone: the branch-migration plan existed,
complete and current, at `.ai/notes/orchestrator/branch-migration-checklist.md`, and finding it
took four searches across three wrong guesses. A reader who gave up one search earlier would
have re-derived a 137-line plan that was already locked with Erik.

**This stream is deliberately the cheap half of a two-option investigation.** The expensive
half — indexing the corpus into `@fgv/ts-agent-memory` behind an MCP server — is briefed
separately as `agent-memory-mcp-server`. **Do that one only if this one proves insufficient**,
and the point of shipping this first is to find out.

Generated **keywords** (§1) sharpen that test considerably. They are the cheap bridge between
grep and semantic search: they surface concepts a literal search misses, which is most of what
the vector path would buy. If keywords close the discovery gap, the second stream stays unbuilt —
which is the outcome to hope for.

## The shape of the corpus (verified 2026-08-14)

Strong, near-universal file conventions already exist:

| file | count | role |
|---|---|---|
| `brief.md` | 59 | the contract — what the stream was asked to do |
| `state.md` | 47 | live checkpoint |
| `result.md` | 32 | exit artifact — what it actually did |
| `README.md` | 28 | polished completion record (in `completed/`) |
| `design.md` | 16 | design bundle |

Two-tree layout per `.ai/conventions/workflow/artifact-protocol.md`:
`active/<id>/` → `completed/<YYYY-MM>/<id>/`.

**No file carries frontmatter, and there is no index.** Those two gaps are the whole problem:
there is no machine-readable statement of what a stream *is*, so the only handle is the
directory name.

## Scope

### 0. `/finalize-task` — the completion ritual, made executable (decided 2026-08-14)

Everything below is a *step* of this. The stream's centre of gravity is not the index; it is that
**closing a stream is a multi-part ritual that is currently manual and demonstrably not happening.**

**The evidence is unusually strong, because the rule already exists and already failed twice.**
`.ai/conventions/workflow/artifact-protocol.md` is unambiguous — *"the migration ships in the same
PR as the work"* — and names its own recurrence: on the `ai-assist-client-tools` cluster close
(2026-06-04, #451 → #452), *"the codified rule existed; the failure was the orchestrator's
pre-promotion checklist not gating on it."* The fix applied then was **another checklist gate**.
Today: **68 stream directories on disk, 43 narrated ledger entries.** Roughly 25 streams closed
without one.

Writing it down did not work. Adding a gate did not work. The remaining move is to make the ritual
**one invocation** instead of a list a tired agent is asked to remember at the end of a long stream.

#### What it does

| step | kind | notes |
|---|---|---|
| generate `meta.yaml` (§1) | **mechanical + model** | synthesis reviewed in the same PR |
| move `active/<id>/` → `completed/<bucket>/<id>/` | **mechanical** | bucket derived from close date |
| scaffold the polished `README.md` | **model, drafted** | protocol § "What the polished README looks like" |
| regenerate `INDEX.md` (§2) | **mechanical** | gitignored; cheap |
| `rush change --verify --target-branch origin/release` | **mechanical** | CI's first gate, invisible to the local suite |
| report stream dirs missing a ledger entry | **mechanical** | the 25-stream backlog, surfaced |
| **draft** the `docs/WORKSTREAMS.md` entry | **model, requires review** | see below |
| **prompt** for `LIBRARY_CAPABILITIES.md` | **judgment** | see below |
| **prompt** for design-doc status | **judgment** | "docs ship with the code" — a shipped design says so in its own PR |

#### The mechanical / judgment split is the whole design

**Script what cannot be wrong.** Moving a directory, deriving a bucket, regenerating a derived
index, running a verify command — these have one right answer and no upside to a human doing them.

**Do not auto-write the narrative artifacts.** `docs/WORKSTREAMS.md`'s value *is* that it is
curated and narrative; `LIBRARY_CAPABILITIES.md` is consumer-facing and dense with hard-won
opinion. Auto-generated prose in either would be worse than the gap it fills, and would degrade an
artifact that is currently good. The skill **drafts** the ledger entry and **prompts** on
capabilities — it does not commit either unreviewed. Same principle as the summary in §1:
generation is fine when it is reviewed at the moment someone still has context.

**Prompting beats silence.** For the judgment steps the skill's job is to make the question
unavoidable — *"this stream touched `@fgv/ts-agent-memory`'s public surface; does
`LIBRARY_CAPABILITIES.md` need an entry?"* — not to answer it.

#### The skill itself is written — `.claude/skills/finalize-task/SKILL.md`

Authored 2026-08-14, ahead of the tooling, because **every step is doable by hand**: an agent can
read the artifacts, write the YAML, move the directory, draft the ledger entry. The proposed
`rush index-tasks` generator makes some steps cheaper; it is not a prerequisite. That means the
skill is usable **today**, including for the retroactive backfill, and the remaining work in this
stream is tooling that accelerates a ritual which already runs.

#### Must run retroactively

The backfill uses the same skill against already-completed streams — and **retroactive mode moves
nothing**, because those streams already sit in `completed/`. It runs steps 1, 2, 4, 5 and 7 and
deliberately skips the migration (step 3) and the change-file gate (step 6): the work merged long
ago, so there is nothing to move and no change file to verify.

If the skill only worked on a live stream, the existing gap would never close and we would have
built something that prevents future instances of a problem while leaving the current one intact.

Two rules carry extra weight in this mode, both encoded in the skill: **prefer blank over
reconstruction** (these streams closed weeks or months ago; the artifacts are the only evidence),
and **batch the runs but not the review** — a reviewer skimming twenty drafted ledger entries at
once will not catch a wrong one.

#### Relationship to the read side

`/finalize-task` is the **write** side; `/task-corpus` (§5) is the **read** side. `meta.yaml` is
the contract between them. They can ship independently — the read skill degrades gracefully
against streams that predate the write skill (their metas are simply absent, and the index reports
them as such).

### 1. A per-stream `meta.yaml`, built once at completion (decided 2026-08-14)

**Do not hand-author frontmatter across 269 files.** Generate a single per-stream metadata
artifact — `<stream-dir>/meta.yaml` — as a step of the existing completion transition
(`active/<id>/` → `completed/<bucket>/<id>/`, per
`.ai/conventions/workflow/artifact-protocol.md`). Built **once**, when the stream closes and
`result.md` exists, i.e. when there is finally something true to summarize.

Three properties fall out of that placement, and they are why this shape beats
per-file frontmatter:

- **The conflict class disappears.** Each stream writes only its own directory. Nothing is
  shared, so nothing collides — which is the cost the shared-`INDEX.md` design was paying.
- **It hooks a workflow step that already exists**, rather than adding discipline anyone has to
  remember.
- **It lands in the stream-closing PR**, so a human reviews the summary at the one moment they
  still have the context to catch a wrong one.

```yaml
id: agent-memory-fragment-id
status: shipped
packages: ['@fgv/ts-agent-memory', '@fgv/ts-agent-memory-sqlite-vec']
prs: [585]
opened: 2026-07-28
closed: 2026-07-31
summary:                         # generated synthesis + extracted check — see below
  intended: …
  shipped: …
  diverged: …
  sourceLine: …                  # verbatim from result.md
keywords: [vector-index, fragment, locator, opaque-id, sqlite-vec, re-embed]
sourceHash: 3f9a1c…              # over the artifacts this was derived from
```

#### Summary is a generated synthesis; the extracted line rides along as its check

An earlier draft of this brief said summary should be **extracted** rather than generated, on the
grounds that extraction cannot hallucinate. That was over-cautious, and it gave up the thing that
makes a summary worth reading.

The most useful fact about a closed stream is the **delta between what it was asked to do
(`brief.md`) and what it actually did (`result.md`)** — including what got cut. No authored line
contains that, because it spans two files. Extraction yields the outcome and silently drops the
fact that the outcome changed shape. `orchestrator.md` already names this as where drift lives:
when a stream revises approach mid-flight, the change file and `state.md` "frequently still
describe the rejected approach." That is a synthesis problem, and only synthesis solves it.

The real risk was never generation — it was **unreviewed** generation. Building at completion
already puts the summary in the stream-closing PR, in front of the one person who still has full
context. Two refinements make that review effective rather than nominal:

- **Structure the synthesis.** Separate `intended` / `shipped` / `diverged` fields, not free
  prose. A wrong claim in a named field is visible at a glance; the same claim buried in a
  paragraph is not. `diverged` empty is a legitimate and common answer.
- **Carry the extracted line alongside as a check.** `sourceLine`, verbatim from `result.md`'s
  authored opener (`**Shipped:**` / `## Outcome` / `## Delivered` / `**Status:**`). No extra model
  call, and it lets a reader — human or agent — spot a synthesis that has drifted from its source
  without opening the stream.

```yaml
summary:
  intended: >
    Carry an opaque consumer-minted fragment id on IVectorQueryHit alongside the
    existing locator span.
  shipped: >
    Same, plus enforcement that at least one of the two is present — via the
    converter and re-checked in both index implementations.
  diverged: >
    A conditional-required union was considered for that enforcement and rejected;
    the converter does it instead.
  sourceLine: '**Shipped:** fragment identity on `IVectorQueryHit` …'   # verbatim
keywords: [vector-index, fragment, locator, opaque-id, sqlite-vec, re-embed]
```

Where `result.md` is thin or absent, leave the generated fields blank rather than inventing them —
**blank still beats fabricated.** That rule survives from the extractive draft; what changes is
that it is now the fallback rather than the default.

**Keywords stay generated**, for the reason they always were: that is where a model adds recall
over a literal grep, and a bad keyword costs one wasted search rather than a false belief.

#### Staleness

Record `sourceHash` over the artifacts the meta was derived from. If the artifacts are edited
after close, the hash mismatches and the meta is known-stale rather than quietly wrong. The
generator reports mismatches; it does not silently regenerate (regenerating would re-run the model
and could overwrite a human-corrected summary).

#### Backfill

One-time pass over the 52 completed streams. Same rules: extract summaries, generate keywords,
blank where nothing is extractable. Reviewable as its own PR — and it is the moment to catch
whether extraction is actually picking the right line.

### 1b. (superseded) Frontmatter on stream artifacts

Add YAML frontmatter to `brief.md` / `result.md` / `README.md`. Minimum viable set, chosen so
every field is either already known at authoring time or mechanically derivable:

```yaml
---
id: agent-memory-fragment-id
status: shipped            # proposed | in-flight | shipped | abandoned
packages: ['@fgv/ts-agent-memory', '@fgv/ts-agent-memory-sqlite-vec']
prs: [585]
opened: 2026-07-28
closed: 2026-07-31
summary: >
  Fragment identity on IVectorQueryHit — opaque consumer-minted fragmentId
  alongside the advisory locator span.
---
```

**Superseded by §1.** Retained only to record what was considered: per-file YAML frontmatter on
`brief.md` / `result.md` / `README.md`, hand-authored going forward and mechanically backfilled.
Rejected because it needs authoring discipline on every artifact forever, spreads one stream's
metadata across three files, and — unlike a per-stream `meta.yaml` — does not by itself remove
the shared-file conflict problem. The derivable-field and blank-over-fabricated rules carry
forward into §1 unchanged.

### 2. A generated `.ai/tasks/INDEX.md` — **gitignored** (decided 2026-08-14)

One row per stream, generated from frontmatter, sorted active-first then reverse-chronological.
Regenerated by a script, never hand-edited (say so at the top of the file).

Must include, per stream: id, status, packages touched, PR numbers, dates, one-line summary,
and the path to its directory.

**Add it to `.gitignore` — note this is the opposite call from `meta.yaml` in §1, and the reason
is cost.** A `meta.yaml` is expensive to produce (a model call, once) and wants human review, so
it is committed. `INDEX.md` is cheap to derive from the committed metas (parse + collate, no model
call), so nothing is gained by storing it and the conflict cost is avoided.

The question was whether it is useful to someone browsing the repo
from outside; the answer is that **that audience is already served, and better, by
`docs/WORKSTREAMS.md`** — 803 lines, 43 stream entries, with both Active and Completed sections,
curated and narrative. A generated table would duplicate its job for humans while being strictly
worse at it.

The two artifacts have different audiences, and that is the whole resolution:

| | audience | shape | coverage |
|---|---|---|---|
| `docs/WORKSTREAMS.md` | humans | curated, narrative, selective | **43** entries — the ones worth narrating |
| `.ai/tasks/INDEX.md` | agents | mechanical, uniform | **68** — every stream directory on disk |

That coverage gap is the generated index's actual reason to exist: **~25 streams have artifacts
and no ledger entry.** An agent needs all of them; a human reading a ledger wants the curated set.

Gitignoring also removes a failure mode worth avoiding on principle — an agent resolving a merge
conflict in a *generated* file by hand-editing it, producing a corrupt index that then reads as
authoritative.

**Side benefit to take while we are here:** have the generator also emit *"stream directories with
no `docs/WORKSTREAMS.md` entry"*. That turns the 25-stream ledger gap from invisible into a
worklist, and it is nearly free once the corpus is being walked anyway.

### 3. The generator

A script under `common/scripts/` or a small `tools/` project. Requirements:

- **Reads the corpus through `FileTree`** from `@fgv/ts-json-base`, not raw `fs` — per
  `.ai/instructions/LIBRARY_CAPABILITIES.md` and the `/filetree-io` skill. This is repo-internal
  tooling, but the convention is not situational and the corpus walk is exactly what `FileTree`
  is for.
- **`Result<T>` throughout**; no throwing across module boundaries.
- **`meta.yaml` parsing via `Yaml.yamlConverter`** from `@fgv/ts-extras`, not a hand-rolled
  parser, and validated through a Converter so a malformed meta is a typed failure rather than a
  loose object.
- **Fails loudly on a malformed `meta.yaml`**, and **reports** (does not fail on) a stream
  directory that has none — an un-closed stream legitimately has no meta yet. Lists every
  offending file in
  one aggregated error (`MessageAggregator`), rather than silently emitting a partial index. A
  partial index that looks complete is the failure mode this stream exists to prevent.
- Idempotent: running it twice with no corpus change produces a byte-identical `INDEX.md`.

### 4. Invocation — on demand, **not** pre-commit (decided 2026-08-14)

Ship it as a **Rush custom command**, `rush index-tasks`, alongside the existing `rush prettier`
in `common/config/rush/command-line.json`. Regenerating is the whole interface.

**Do not put it in the pre-commit hook.** Two reasons, both concrete:

1. **A pre-commit guarantee is not one, and this repo has the receipts.** `common/git-hooks/pre-commit`
   already exists and runs `rush prettier`. It was bypassed **repeatedly in the 2026-08-14 session**
   via `git -c core.hooksPath=/dev/null commit` — not to evade it, but because the agent was
   committing from bare `git worktree`s where the rush autoinstaller had never been set up and the
   hook would have failed the commit outright. That is exactly the bulk-work situation where index
   freshness matters most, and it is precisely where the hook does not run.
2. **It is a cross-stream conflict magnet.** One generated file that *every* task-touching branch
   rewrites, in a repo that deliberately runs parallel worktrees. Every merge conflicts on
   `INDEX.md`. Resolution is mechanical (re-run the generator) but it is friction on every stream,
   paid forever, to buy a guarantee that item 1 says we do not actually get.

**The move that makes the gate unnecessary: the skill regenerates before it reads** (see §5). Once
the agent path never trusts the committed copy, staleness cannot produce a wrong answer — it can
only show a human a slightly old file on GitHub. That decouples correctness from discipline, which
is the only durable way to win this.

So: **no CI verify at first.** The change-file lesson in `CODING_STANDARDS.md` is that a gate
invisible to the local suite costs more than it saves; adding one here to protect a
human-convenience artifact would be building machinery ahead of the justification. If drift is
later shown to actually mislead someone, add `rush index-tasks --verify` then — and make its
failure message name the one-command fix.

**No generated-at timestamp in the file.** It would break the idempotency requirement above, and
git already carries the file's age.

### 5. `/task-corpus` — the read side

The generator alone does not solve the stated problem. **The failure is not knowing to look**, so a
skill whose description amounts to "read the index" would be nearly useless.

Follow the shape the repo's existing skills use (`.claude/skills/<name>/SKILL.md`, frontmatter
`name` + `description`, with the description carrying explicit **trigger** conditions — see
`filetree-io`'s "Load this skill BEFORE writing `fs.readFile`…"). The triggers are the deliverable.

Trigger on, at minimum:

- before designing anything that sounds like it may have been designed before
- before answering a "did we ever decide…" / "why is X the way it is" question
- before writing a new stream brief (there may be a prior stream, or a deliberate scope cut)
- when a consumer asks about a shipped behavior's rationale
- before recording a lesson (it may already be codified)

Body should teach the corpus's **shape**, because that is the retrieval strategy: `brief.md` is
what a stream was *asked* to do, `result.md` is what it *actually did including deviations*,
`README.md` is the polished record, `design.md` is the bundle, and `state.md` is a live scratchpad
that may be stale by design. Knowing that "what shipped, and what got cut" lives in `result.md` is
most of the skill.

The skill must **regenerate the index before reading it** (`rush index-tasks`), then read. State
that as a step, not an aside.

## Why the write side matters more than the index

The index answers *"what exists?"*. It is only as good as the metadata under it — and the reason
metadata is missing is that **closing a stream is a ritual nobody executes completely**. Build the
index alone and it faithfully reports a corpus that is 37% unregistered. Build `/finalize-task`
and the index gets a corpus worth indexing, plus the ledger stops drifting, plus
`LIBRARY_CAPABILITIES.md` stops needing follow-up PRs that `CODING_STANDARDS.md` § "Docs ship with
the code" already forbids.

If only one half ships, ship the write side.

## Explicitly NOT in scope

- **Semantic / vector search over the corpus.** That is `agent-memory-mcp-server`. Shipping
  this stream is partly an experiment to find out whether that one is needed at all.
- **Restructuring the two-tree layout** or renaming existing artifacts. The layout is fine;
  it is undescribed, not wrong.
- **Auto-committing `docs/WORKSTREAMS.md` or `LIBRARY_CAPABILITIES.md` entries.** `/finalize-task`
  drafts and prompts; a human or reviewing agent accepts. Auto-generated prose would degrade two
  artifacts whose value is that they are curated — see §0.
- **Replacing the orchestrator's judgment.** The skill sequences a ritual; it does not decide
  whether a stream is done.
- **A pre-commit hook, and a CI verify gate.** Both considered and declined with reasoning in
  §4 — the hook because it is demonstrably bypassed in exactly the bulk-work sessions that need
  it and because it conflicts across parallel worktrees, the gate because §5 removes the need.
- **Backfilling `summary` for all 269 files by hand.** Derivable fields only; blanks stay blank.
- **Indexing anything outside `.ai/tasks/`** — `.ai/notes/`, `docs/`, `.claude/project/` are
  adjacent problems. Note that the branch-migration plan that motivated this stream lives in
  `.ai/notes/orchestrator/`, *not* `.ai/tasks/`, so this stream would not by itself have made
  it findable. That is a deliberate scope cut and an argument for a follow-on, not a reason to
  widen this one now.

## Open questions

1. Does frontmatter belong on `state.md` too, or only on the three durable artifacts? (`state.md`
   is a live scratchpad; frontmatter on it may just be churn.)
2. Should `INDEX.md` live at `.ai/tasks/INDEX.md` or be surfaced from `docs/`? The latter is more
   discoverable to humans; the former keeps the generated artifact next to its source.
3. Is `packages` worth maintaining by hand where it is not derivable, or should it be derived
   from the merged PR's touched paths and omitted when unknown?
4. ~~Should `INDEX.md` be committed?~~ **Resolved 2026-08-14: gitignore it.** See §2 — the
   human audience is already served better by `docs/WORKSTREAMS.md`, and the generated index's
   unique value (completeness across all 68 stream dirs vs the ledger's curated 43) is for
   agents, who get it regenerated by the skill.

## Gates

- [ ] `rushx build` / `rushx lint` / `rushx test` green in any package the generator lives in
- [ ] `/task-corpus` skill regenerates before reading — verified by following it, not by reading it
- [ ] **`/finalize-task` runs retroactively** — proven on a real already-completed stream, not
      only on a live one
- [ ] **`/finalize-task` used to close this very stream.** If it cannot finalize itself, it is not
      finished. This is the cheapest possible end-to-end test and it costs nothing extra.
- [ ] 100% coverage on the generator's own logic
- [ ] Change file for every touched package
- [ ] Generator is idempotent (assert it in a test, not by inspection)
- [ ] `INDEX.md` regenerates byte-identically from a clean checkout
- [ ] `code-reviewer` on the final diff before the first push

## How we will know it worked

**For the write side:** the gap stops growing. Count stream dirs against ledger entries before and
after; the number closed without an entry should go to zero for streams closed after it lands. The
existing 25 are a separate backfill, and their count is the second measure.

**For the read side:** the honest test is not "the index exists". It is: **an agent asked a question whose answer is in
a completed stream finds it without knowing the stream's name.** Try it cold on a real question
after landing — e.g. *"did we ever decide whether `rebuild` should fail or skip on a bad
record?"* — and record whether the index got there. If it did not, that is the signal to pick up
`agent-memory-mcp-server`.
