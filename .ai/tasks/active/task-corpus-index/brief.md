# Stream brief — `task-corpus-index`

**Status: PROPOSED — not started.** Drafted 2026-08-14.

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

### 5. A repo skill — `/task-corpus`

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

## Explicitly NOT in scope

- **Semantic / vector search over the corpus.** That is `agent-memory-mcp-server`. Shipping
  this stream is partly an experiment to find out whether that one is needed at all.
- **Restructuring the two-tree layout** or renaming existing artifacts. The layout is fine;
  it is undescribed, not wrong.
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
- [ ] 100% coverage on the generator's own logic
- [ ] Change file for every touched package
- [ ] Generator is idempotent (assert it in a test, not by inspection)
- [ ] `INDEX.md` regenerates byte-identically from a clean checkout
- [ ] `code-reviewer` on the final diff before the first push

## How we will know it worked

The honest test is not "the index exists". It is: **an agent asked a question whose answer is in
a completed stream finds it without knowing the stream's name.** Try it cold on a real question
after landing — e.g. *"did we ever decide whether `rebuild` should fail or skip on a bad
record?"* — and record whether the index got there. If it did not, that is the signal to pick up
`agent-memory-mcp-server`.
