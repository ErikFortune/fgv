# Workstreams — fgv

The canonical doc for in-flight and completed parallel workstreams.
Each entry is a kickoff brief — designed so a fresh agent (or fresh
human) can pick it up cold from this doc plus the linked reading
list, without re-creating any of the design discussion that produced
it.

---

## Repo shape (load-bearing context)

This repo is a set of related but distinct utility libraries under
`libraries/` (plus CLI tools under `tools/`), not a single coherent
product. Work is mostly **reactive, consumer-driven, feature-shaped**:
external consumers batch up feature requests as they do major work;
we service those batches and publish an alpha; consumers integrate;
once at least one consumer has applied a feature end-to-end, we
treat that surface as validated. A feature commonly touches 1–3
packages, so the unit of work is the **feature**, not the package.

**Lockstep version policy.** When we publish, we publish everything.
Independent roadmaps per library, single shared version. Sizing the
blast radius of any stream needs to account for this — a change in
one package ships in the same alpha as every other package's changes.

**Stability-via-consumption.** We presume instability until at least
one consumer has applied a feature end-to-end. `release` and the
alphas published from `prerelease` are post-feature-PR but
pre-validation. Production promotion is gated on observed consumer
use, not just CI green. Case in point: a -25 → -26 type-tightening
that would have been a production regression if -25 had shipped to
main.

## Branch flow

```
agent feature branches ─PR─▶ release ──mirror──▶ prerelease ──npm-publish─▶ alpha
                                │
                                └── promote (test/docs gate, not code review) ──▶ main
```

- **`release`** is the buffer line. Feature PRs merge here. Iterative
  review cycles, followups, and slips are absorbed here.
- **`prerelease`** mirrors `release` immediately. The only deltas vs.
  `release` are `package.json` / version-policy files and Rush
  changelogs. Alphas publish from `prerelease` via the
  `npm-publish` GitHub workflow.
- **`main`** is the canonical line. Promotion `release` → `main` is
  a release event — it accumulates a long delta and is gated on
  **test/docs/sibling-sweep, not code review** (each constituent PR
  was reviewed on its way into `release`; the unified delta is too
  large for meaningful re-review).

A branch-model evolution to a more conventional "main is tip,
hotfix branches off main" topology is on the roadmap; see the
relevant entry in this file when it's drafted.

## Status conventions

- 🟢 ready to start (all hard dependencies met)
- 🟡 ready but trailing on a soft dependency, or trigger TBD
- 🔵 in flight (active design or implementation)
- 🔴 blocked (hard dependency unmet)
- ✅ shipped (merged to `release`)

## Stream entry shape

Every stream entry declares, at minimum:

- **Mission** — 1–2 sentences.
- **Package surface** — explicit list of packages this stream
  expects to modify (e.g. `ts-extras/ai-assist`, `ts-app-shell/ai-assist`).
  This is both the reading-aid and the collision-avoidance metadata
  for parallel streams.
- **Out-of-scope** — paths this stream will NOT touch, when
  collision avoidance with another stream depends on it.
- **Acceptance criteria** — exit gates.
- **Artifact pointer** — `.ai/tasks/active/<stream-id>/`.

Full kickoff-prompt shape: `.ai/conventions/workflow/kickoff-prompt-shape.md`.

## Branch base

New streams branch from current `release` HEAD. There is no shared
"wave base" — streams are mostly independent, and the few real
file-boundary conflicts are caught by the package-surface and
out-of-scope declarations in the stream entry. `.ai/BASELINE.md`
pins the last `release` → `main` promotion (i.e. the last
published lockstep version), used as a recovery referent and for
sizing blast radius, not as a stream-start gate.

## Stream versions

Used when a stream's deliverable splits into independently-shippable
phases. Each version has its own brief, status, dependencies, PR,
and task-artifact directory. Reserve for streams where the phases
are genuinely separable shipping units.

## Shared types between parallel streams

When two parallel streams share a type, pick exactly one pattern:

1. **Coordination commit**: land the shared type as a small commit
   before either stream branches.
2. **Narrower consumer interface**: consumer defines a smaller,
   distinctly-named interface exposing only the methods it needs.
3. **Lock ownership in kickoff prompts**: exactly one stream owns
   each shared symbol; the other is told explicitly NOT to define it.

Never have two parallel streams publishing the same symbol.

## Artifact protocol

Every workstream maintains live artifacts at
`.ai/tasks/active/<stream-id>/{brief.md, state.md, result.md}`
throughout the run. **Migrate to `.ai/tasks/completed/<YYYY-MM>/<stream-id>/`
and write a polished `README.md` as part of the PR — before merge,
not as a follow-up.** See `.ai/conventions/workflow/artifact-protocol.md`.

## Out-of-scope packages

The sudoku packages (`ts-sudoku-lib`, `ts-sudoku-ui`) are slated to
move to their own monorepo and are out of scope for the workflow
substrate. Don't queue streams against them here.

---

## Active workstreams

### `personaility-asks-2026-08` (Stream A — the embedding lane) 🟢

**Status:** 🟢 **shipped to `release`** — all five units merged 2026-08-12, plus one unplanned refactor that unblocked them. Nothing published yet; the alpha still has to go out. Artifacts: `.ai/notes/cross-repo-handoffs/personaility-asks-2026-08-triage.md`, `…-reply-2026-08-11-ask-package.md`, `…-status-2026-08-12-stream-a.md`, `…-status-2026-08-12-shipped.md`.

**Origin.** One consolidated ask package from PersonAIlity, 2026-08-11 — nine open items, none blocking them, every one carrying a workaround they are already running. They explicitly invited "not now" on the whole package. We re-verified every load-bearing mechanic against our own source before acting (both sides shipped a wrong sweep this month); **all their claims held**, down to exact control flow.

**The through-line, adopted as ours.** Four of the nine are one species — **a failure reported as a success**. We already solved it well once on the record path (`onRecordError: 'skip'` + structural `skippedRecords`); items 1, 4 and 5 ask for that same shape in three more places.

| item | change | shipped |
|---|---|---|
| **4** | `MemoryEmbedder` may resolve `undefined` to **decline** a record — no `embeddingRef`, no failure, and the decline itself logs nothing. A decline on an already-embedded record drops the inherited reference *and* prunes the vector it named, **after** the commit | #611 |
| **2** | `embedKinds?: ReadonlySet<Kind>` + `IMemoryStore.embedsKind`; absent means every kind participates. The gate sits **before** the embedder call, so an excluded kind costs nothing, and narrowing it on an existing vault retires the embeddings it no longer maintains | #612 |
| **1** | partial-tolerant `rebuild` returning `IVectorRebuildReport` (`indexed` / `declined` / `skipped`), `onRecordError` defaulting to `'fail'` | #613 |
| **3** | `size` + `rebuild` promoted onto `IVectorIndex`, with `SqliteVecVectorIndex` implementing both | #614 |
| **5** *(added mid-stream, at the consumer's ask)* | `embed?: MemoryEmbedOutcome` on write observations + a matching query axis — the write-path axis the first status note told them was still open | #615 |

**One unplanned unit: #616.** CI rejected the stack on a `max-lines` warning; the store had crossed 2000 lines. Extracting a `VectorMaintenance` collaborator took it from 1991 → 1758 with no test file changed and a byte-identical `api.md`.

**Two bugs this stream found in its own work, both worth recording.** `rebuild` cleared the index *before* attempting to list — so a transient list failure destroyed a healthy index, **durably** on the sqlite sibling. A pre-existing test pinned the destructive behavior as intended, and the package was at 100% coverage the whole time; no test had ever seeded a populated index before a failing list. And the decline path pruned its stale vector *before* `_persist`, so a failed write would have deleted a vector that was still accurate for the content actually on disk.

**Three process lessons, all codified in `CODING_STANDARDS.md`:** a local warning is a CI failure (`rush rebuild` exits non-zero on "success with warnings" where `rushx build` exits 0); widening a shared interface needs a repo-wide build, not a per-package one (a test double in `samples/testbed` broke #614); and a green Copilot check only means the job ran — three of the five PRs had substantive findings recorded solely in *suppressed* comments.

**Answered without scheduling:** item 5's original scope (strict text read — half already shipped in `-47`), 6 (provenance query axis — **intent stated so they can design against it existing**), 7 (index read surface — deferred deliberately, breaking, wants its own design), 8 (prompt-slot writability — the one-sentence "advisory" doc remedy), 9 (`ts-res` `addResource` — fold into the next touch).

**Published as `5.1.0-48`** (alpha tag, 2026-08-13T04:23Z) — and the consumer found the version before we named it, because the status note that promised to tell them was drafted hours before the publish and never revisited.

**Still owed back to them:**

| item | state |
|---|---|
| An **alpha is sitting on the `latest` tag** for two packages | **Open, and narrower than we had been describing it.** The established packages are correct — `ts-utils` / `ts-extras` / `ts-json-base` are all `latest: 5.0.2` (a real release), `alpha: 5.1.0-48`. But `ts-agent-memory` (`latest: 5.1.0-36`) and `ts-agent-memory-sqlite-vec` (`latest: 5.1.0-42`) have never had a stable release, and an accidental publish left an **alpha** on their `latest` tag. **The harm is misrepresentation, not staleness:** pre-1.0 consumers track `@alpha` and were never going to install from `latest`, so this did not hide Stream A from anyone — but anyone who does install from `latest` gets a months-old alpha *presented as a stable release*. **Correct the earlier framing:** we had recorded this as "the mechanism by which our shipped work looks unshipped" and told the consumer a tag fix would help them. Both overstated it. Fix: leave `latest` unset on a pre-1.0 co-developed package until there is a deliberate release, and stop accidental publishes moving it. |
| 21-of-25 unreachable `types` condition | Open. Needs a browser API-Extractor rollup the build does not yet emit (module-resolution stream, finding 1). |

### Why these packages stay in alpha — the co-development posture

`ts-agent-memory`, `ts-agent-memory-sqlite-vec` and the surfaces around them are **co-developed with
consumers**, currently PersonAIlity (active) and chocolate-lab (dormant). Staying on the alpha channel
is **deliberate**, not a backlog item: it is what lets us take the breaking changes we keep discovering
*while* the consumer adopts brand-new code, without a compatibility tax on work whose shape is still
being learned. `rebuild`'s signature change breaking their one call site is the system working, not
failing.

Two things follow, and both have already been got wrong once:

- **The alpha tag is the product channel for these consumers.** Do not describe `@alpha` to them as a
  workaround, and do not offer a `latest` fix as though it would change what they install. Both were
  said in a draft of the 2026-08-13 note and corrected before sending.
- **`latest` on a package that has never had a stable release should be unset**, not pointed
  somewhere. There is no "current stable" to name, and naming an alpha misrepresents it as one.

The corollary for reviewers: on these packages, "this is breaking" is not an objection by itself. The
objection is "this is breaking *and* the new shape isn't better", or "this breaks silently".

### Open asks carried forward — the 2026-08-12 delta

Three items from their post-`-48` sweep, **tracked here with verdicts so "deferred" has somewhere to live**. Their §3 diagnosis was that our ledger had no state between *done* and *silent*, and they were right: items 2 and 3 below were in the original package, answered with intent rather than a verdict, and decayed into silence.

| ask | verdict | notes |
|---|---|---|
| **`rank` has no backfill** — a projector registered on a populated store ranks nothing already written, and because absent-`rank` sorts last, every pre-registration record lands *below* every post-registration one regardless of score | **Will do** | **Verified in source, not taken on faith:** `_stampRank` is called only from the two write paths and nothing walks; `_compareByRank` returns `1` for absent-vs-present before any value comparison. Not a partial ordering — **inverted relative to the projector's intent, and it looks like it works.** The docs are complicit (`rank` says "on every put/update", never "only after you register"). **Never sent to us before** — found after their package was assembled. **Design wrinkle:** a reconcile routed through `put` would bump `updated`/`seq` and fire a write observation per record, trading a wrong `rank` order for a wrong recency order; it needs a path that restamps `rank` only. That is the work — the walk is trivial. A plain count is enough; no report shape. |
| **No query axis for provenance** | **Will do**, small | Exact-match on `provenance.source`, `StructuredFilterRetriever` as the home. We asked for the shape twice; they described the same use three times ("show me everything this source produced"). Building to the stated use rather than asking again. |
| **Strict UTF-8 text read** (`ts-json-base`) | **Will do** — *reversed from an initial won't-do* | The initial answer pointed at `getFileBytes` + a fatal `TextDecoder`. On learning the consumer is moving to the **HTTP** adapter we checked it properly: `HttpTreeAccessors` is seeded from the REST payload's `contents: string`, so `JSON.parse` has already decoded leniently and substituted U+FFFD **before this code runs**; the inherited `getFileBytes` then re-encodes that string. A fatal decode over those bytes **succeeds, having nothing left to check** — the recommended escape hatch is a green light on a check that cannot fail. **Its class docstring asserted the opposite and is corrected in this PR** (a live doc bug, independent of the feature). **Shape:** strict read on byte-faithful adapters, and a **loud unsupported** on HTTP rather than a success — the precedent is browser `safer-fetch` refusing `validate-each-hop` at option resolution instead of failing later. **Open question back to them:** do they need detection *over HTTP*? That needs a bytes-native transport (a wire-format change), not a flag. |

**Closed by them, not to be re-actioned:** record-index read surface (we declined in the contract text; they agree), empty-index-vs-unmatched-query (`size` + `declined` answer it a different way), `addResource` input type (bundle or drop).

**Owed process change:** alpha release notes should carry a "breaking on the active surface" line — `rebuild`'s signature change broke their call site and no release note surfaced it.

---


### `task-corpus-index` 🔵 → `agent-memory-mcp-server` 🔵 (a conditional pair)

**Status:** 🔵 both **proposed, neither started**. Briefs at
`.ai/tasks/active/task-corpus-index/brief.md` and
`.ai/tasks/active/agent-memory-mcp-server/brief.md`.
**Ordering is a hard dependency and the second is conditional on the first's outcome.**

**Scope moved during drafting.** It began as an index; it is now **two skills and the metadata
contract between them** — `/finalize-task` (write side) and `/task-corpus` (read side).
**If only one half ships, ship the write side**, because the index is only as good as the metadata
under it.

**Why `/finalize-task`, and why the evidence is unusually strong.** Closing a stream is a
multi-part ritual — generate metadata, migrate `active/` → `completed/`, write the polished
README, update this ledger, update `LIBRARY_CAPABILITIES.md`, verify change files. The rule is
already written down and unambiguous (`artifact-protocol.md`: *"the migration ships in the same PR
as the work"*), and it **already failed twice**: the protocol names its own recurrence on the
`ai-assist-client-tools` cluster close (#451 → #452), where *"the codified rule existed; the
failure was the orchestrator's pre-promotion checklist not gating on it"* — and the fix applied
then was *another checklist gate*. The result today is **68 stream directories against 43 ledger
entries**. Writing it down did not work; adding a gate did not work. The remaining move is to make
it **one invocation** rather than a list a tired agent is asked to remember at the end of a long
stream.

**And an antagonist pass before anything is handed over.** Every artifact the ritual produces is a
claim about what happened, written by whoever just spent a long stream forming a view of what
happened — the exact condition under which a confidently wrong claim goes unnoticed. `STATUS.md`
already measured this: *"Independent layer-1 passes earn their cost … commissioning independent
`code-reviewer` passes retroactively found: a real P2 on #582."* So the pass is independent where a
reviewer can be spawned, refute-first by framing, and required to state what it checked — *"looks
right"* is not an output. It targets **inaccuracies** (every claim traces to a quotable line;
`sourceLine` appears verbatim; PR numbers belong to this stream) and, harder and more valuable,
**omissions** — the highest-yield being *"`diverged` is empty: true, or unexamined?"*, since an
empty `diverged` on a stream that visibly changed shape is the characteristic failure of the whole
ritual. It is **not optional in retroactive mode** — more important there, not less, since you are
reconstructing a stream you did not run.

**The design line: script what cannot be wrong, prompt what needs judgment.** Directory moves,
bucket derivation, index regeneration and `rush change --verify` get automated. The
`WORKSTREAMS.md` entry is **drafted for review**, and `LIBRARY_CAPABILITIES.md` is **prompted, not
written** — auto-generated prose would degrade two artifacts whose whole value is that they are
curated. Must run **retroactively** — and in that mode it **moves nothing**, since those streams already
sit in `completed/`; it backfills metadata and ledger entries in place, skipping the migration and
the change-file gate. And it should close *itself*: if `/finalize-task` cannot finalize its own
stream, it is not finished.

**The skill is written and usable now** — `.claude/skills/finalize-task/SKILL.md`, authored ahead
of the tooling because every step is doable by hand. The generator would make some steps cheaper;
it was never a prerequisite. So the retroactive backfill can start immediately, and what remains
in this stream is tooling that accelerates a ritual already running.

**Origin.** Erik, 2026-08-14: *"Can you suggest a memory tool to index our task files so you can
read them? Prefer to just adopt if there's something that meets our needs but we can build if
needed."*

**The problem, stated precisely.** `.ai/tasks/` is **269 markdown files / 3.1 MB** across 14
active and 52 completed streams, and it is the repo's institutional memory. An agent picking up
cold cannot use most of it — but **not because retrieval is hard**. 3 MB is instantly greppable
and every agent already has `Grep`/`Glob`/`Read`. The failure is **discovery**: you cannot grep
for a stream whose existence you do not suspect. Demonstrated in the same session — the
branch-migration plan existed, complete and current, and took four searches across three wrong
guesses to find. One search less and it would have been re-derived.

**Why two streams and not one.** The corpus already has strong file conventions (`brief.md` 59,
`state.md` 47, `result.md` 32, `README.md` 28, `design.md` 16) and a documented two-tree layout —
but **no frontmatter and no index**. So the cheap hypothesis is that discovery is a *metadata*
problem, not a *search* problem, and `task-corpus-index` tests it: frontmatter plus a generated
`INDEX.md` plus a generator that fails loudly rather than emitting a partial index.

`agent-memory-mcp-server` is the expensive half, and it is **deliberately gated on evidence**.
It builds `@fgv/ts-agent-memory-mcp` — a Result-integration boundary over the MCP SDK's *server*
side — and ingests the corpus into a vault. Worth doing if the index falls short; a large build
in search of a justification if it doesn't. **Start it only on a recorded instance of a real
question the index failed to surface.**

**The adopt-vs-build finding.** Surveyed before proposing a build, per the ask:
- **Off-the-shelf MCP memory servers** are knowledge-graph shaped (entities/relations for
  conversational recall), not corpus indexers for an existing markdown tree. Adopting one still
  leaves the ingest pass — which is the actual work. Poor fit. *(Not exhaustively surveyed;
  worth a second look before committing to the build.)*
- **Our own `@fgv/ts-agent-memory` is the right substrate** and is unreachable for one specific,
  verified reason: `createMemoryTools` returns `AiAssist.IAiClientTool[]` for ai-assist loops
  (`memoryTools.ts:693`), and `@fgv/ts-extras-mcp` is an MCP **client** that adapts the other
  direction and puts a server explicitly out of scope. **The missing piece is a server, not a
  capability.**

**Invocation decided (2026-08-14): on demand, not pre-commit.** A `rush index-tasks` custom
command, and a `/task-corpus` skill that **regenerates before reading**. The hook was declined on
evidence: `common/git-hooks/pre-commit` already exists, and it was bypassed repeatedly in the very
session that motivated this — agents committing from bare worktrees where the rush autoinstaller
was never installed, so the hook would have failed the commit. It does not run in exactly the
bulk-work sessions where freshness matters, and it would conflict across parallel worktrees on one
shared generated file. Because the skill regenerates first, no agent depends on the committed copy
being fresh, which removes the need for a CI verify gate too — consistent with the change-file
lesson about gates invisible to the local suite.

**Metadata is a per-stream `meta.yaml`, built once at stream completion (decided 2026-08-14).**
Not hand-authored frontmatter across 269 files. It hooks the completion transition that already
exists, lands in the stream-closing PR where a human still has context to review it, and — because
each stream writes only its own directory — **removes the shared-file conflict class entirely**.
**`summary` is a generated synthesis** across `brief.md` and `result.md` — because the most useful
fact about a closed stream is the delta between what it was asked to do and what it actually did,
including what got cut, and no authored line contains that (it spans two files). An extraction-only
draft was considered and **rejected as over-cautious**: it yields the outcome while silently
dropping that the outcome changed shape, which is exactly where `orchestrator.md` says drift
lives. The risk was never generation but *unreviewed* generation, and building at completion
already puts it in the closing PR in front of someone with full context. Made auditable by
structuring it (`intended` / `shipped` / `diverged` as named fields, so a wrong claim is visible
rather than buried) and by carrying the extracted authored line verbatim as `sourceLine`, a
free check a reader can compare against without opening the stream. **`keywords` are generated**
too — that is where a model adds recall, and a bad keyword costs one wasted grep rather than a
false belief. Blank beats fabricated wherever `result.md` is thin. A `sourceHash` makes
post-close edits detectably stale rather than quietly wrong.

**`INDEX.md` is gitignored (decided 2026-08-14).** The question was whether it is useful to
someone browsing from outside the repo — and that audience is already served, better, by *this
file*: 803 lines, 41 curated stream entries, Active and Completed. The generated index would
duplicate that for humans while being worse at it. Its unique value is **completeness for
machines**: **68 stream directories exist on disk against 41 narrated entries here**, and
**31 of those directories have no entry under their own name — 20 of them are not mentioned
anywhere in this file, even in passing.** Agents need all 68; humans want the curated 41.
Different audiences, different artifacts, no reason to commit the machine one — which also
removes the merge-conflict class and the risk of an agent hand-merging a generated file into
something corrupt that reads as authoritative. **Side benefit taken:** the generator also reports
stream dirs missing a ledger entry, turning that 31-stream gap into a worklist.

*(Counts measured 2026-08-14. An earlier draft of this section said "43 narrated entries" and
"~25 streams" — both wrong. The 43 counted this file's two prose section headings as if they
were streams, and the 25 was a subtraction of two totals rather than a set difference, which
silently nets naming mismatches against genuine gaps. Four ledger entries name a stream with no
matching directory (`ai-assist-thinking-events`, `fetch-primitive-threat-model`,
`personaility-asks-2026-08`, `ts-prompt-assist-features`); some of those are the same stream as
a differently-named directory, which is exactly the reconciliation a set difference surfaces and
a subtraction hides.)*

**The open question that sizes the second stream** — resolve it before anything else there:
does `ISchemaValidator.toJson()` drop straight into MCP tool registration? If yes the adapter is
small, generic, and belongs beside its inverse in `ts-extras-mcp`. If not, the estimate moves.

---

### `agent-memory-ingest-dedup-scope` 🟢

**Status:** ✅ shipped — PR [#600](https://github.com/ErikFortune/fgv/pull/600) merged to `release` as `02ba90459`. Branch `agent-memory-ingest-dedup-scope` from `release` @ `b392e1534`. All five deliverables landed; suite green at 100% coverage; `code-reviewer` clean, Copilot loop stopped at round 2 on diminishing returns. Ran in parallel with `safer-fetch-s3`; no code overlap, but both edit `.ai/instructions/LIBRARY_CAPABILITIES.md` and this file — **own section only**.
**Substrate:** `.ai/tasks/completed/2026-08/agent-memory-ingest-dedup-scope/{brief.md, state.md, result.md, findings/inbox/}`
**Package surface:** `@fgv/ts-agent-memory` (`ingest`, `store/fileTreeMemoryStore.ts` — `IMemoryStore` lives there, not in the `types/memoryStore.ts` the brief named; that file does not exist).
**Behavior change (OQ-3, intended, unflagged):** ingest layer-1 now honors `dedupScope`, so `'entity'` kinds (`MemoryCapCullPolicy` / `TemporalVersionedPolicy`) stop collapsing distinct entities with identical bodies on the `ingestItem` path. Kinds with no registered policy are unaffected — they resolve through the store's default `KnowledgeLwwPolicy`, which declares `'content'`.
**Origin:** problem report from PersonAIlity (2026-08-04) against 5.1.0-46, triaged and verified against source.

**Mission.** `dedupScope` is honored by the store and ignored by the ingest orchestrator, so a kind declaring `'entity'` still gets `'content'` behavior through `ingestItem` and the declaration is dead on that path. **`dedupScope` has zero references anywhere in `ingest/`.** Blast radius is wider than the report, though narrower than the brief stated: the affected kinds are those registering an `'entity'`-declaring policy (`MemoryCapCullPolicy` / `TemporalVersionedPolicy`) **whose codec puts distinct entities in one scope** — MTM turns and LTM conversations. A kind with no registered policy resolves through the store's default `KnowledgeLwwPolicy` to `'content'` and is unaffected; temporal kinds were already isolated because `TemporalIdentityCodec` gives each entity its own scope. (The brief's "every experience and versioned kind is affected" was corrected in-stream — see `result.md`.) Fixing it needs a seam first — the orchestrator holds an `IMemoryStore`, which exposes no policy accessor, which is why the consumer's proposed fix is not currently expressible. Carries a second, sharper fix the report surfaced: a `duplicate-of` collapse removes an address that sibling edges in the same pass were built against, failing the **whole** ingest item — true even for `'content'` kinds where the collapse is correct. Also writes `.claude/project/agent-memory-ingest-design.md`, the note three source files already cite but which did not exist.

---

### `messages-log-levels` 🟢

**Status:** ✅ implementation complete — PR open onto `messages-log-levels`; ready to squash → `release`
**Integration branch:** `messages-log-levels` (off `release`) → squash to `release` at close
**Workflow shape:** single implementation PR onto integration branch
**Substrate:** `.ai/tasks/completed/2026-05/messages-log-levels/{brief.md, state.md, result.md, README.md}`
**Package surface:** `@fgv/ts-app-shell` `messages` packlet + `.ai/instructions/LIBRARY_CAPABILITIES.md`
**Out-of-scope:** ts-utils log-level types (consumed as-is; no `'success'` added there); the shipped `RetainingLogger`/`MultiLogger`; non-messages ts-app-shell packlets.

**Mission.** Align the `messages` packlet's filter to `@fgv/ts-utils`'s canonical `MessageLogLevel`/`ReporterLogLevel` so the panel can filter at logger granularity — making the `RetainingLogger` → panel bridge lossless. Current `MessageSeverity` filter lacks `detail`/`quiet` (coarser than the logger) and conflates verbosity-filter with display-styling. Fix (fork a): two axes — `IMessage.level: MessageLogLevel` drives filtering (`shouldLog`-based threshold); `severity?: MessageSeverity` (incl. `'success'`) is styling-only, defaulting via a level→severity derivation. Breaking on the messages packlet — cheap, ts-app-shell is active-dev.

**Origin.** Gap in the observability journey (same as `logging-observability`): `RetainingLogger` retains rich levels server-side; this completes the display half. Cross-library semantic alignment (L19 family). Soft-blocker for personaility's client-side observability.

### `logging-observability` 🟢

**Status:** ✅ implementation complete — PR #418 review satisfied; ready to squash → `release`
**Integration branch:** `logging-observability` (off `release`) → squash to `release` at close
**Workflow shape:** single implementation PR onto integration branch
**Substrate:** `.ai/tasks/completed/2026-05/logging-observability/{brief.md, state.md, result.md, README.md}`
**Package surface:** `@fgv/ts-utils` logging packlet (`LoggerBase` additive `_logStructured` hook + `RetainingLogger` + `MultiLogger` + `ILogRecord`) + `.ai/instructions/LIBRARY_CAPABILITIES.md`
**Out-of-scope:** changing the existing `_log` seam / `InMemoryLogger`; `IDetailLogger` fan-out; template-substitution formatting; the consumer's log-query endpoint + display (consumer side; `ts-app-shell` messages packlet covers display).

**Mission.** Add two observability primitives to `@fgv/ts-utils`'s `logging` packlet (consumer request from personaility): `RetainingLogger` (bounded most-recent-N structured-record ring with severity + since-cursor query API) and `MultiLogger` (fan-out one log call to N children, each with its own threshold — feeds both `ConsoleLogger` and a retainer from one pinned `ILogger`). Plus the enabler: an additive `LoggerBase._logStructured` hook (default no-op) that exposes the structured `(level, formatted, message, params)` to retaining subclasses without breaking the existing `_log` seam.

**Origin.** Cross-repo handoff (`.ai/notes/cross-repo-handoffs/logging-observability-2026-05.md`). Extend-the-primitive: general logging infra, not consumer-specific. `@fgv/ts-utils` established surface → additive-only, 100% coverage. Soft-blocker for a downstream observability stream. Q5 (record shape) resolved to structured via the `_logStructured` hook — see brief.

### `prompt-assist-screeners` 🟢

**Status:** 🟢 ready to commission (substrate prep in flight)
**Branch base:** `release`
**Workflow shape:** single-PR breaking-change feature
**Substrate:** `.ai/tasks/completed/2026-05/prompt-assist-screeners/{brief.md, state.md}`
**Package surface:** `@fgv/ts-prompt-assist` (safety packlet) + `.ai/instructions/LIBRARY_CAPABILITIES.md` + in-repo consumers of the dropped fields
**Out-of-scope:** the local-classifier screener itself (B-3 of `local-ai-exploration`); LLM-based screening; screener caching; parallel execution; whole-prompt/post-render screening hook.

**Mission.** Replace `@fgv/ts-prompt-assist`'s regex-only / sync / closed-kind safety pipeline with a pluggable `IScreener` model. Consumers wire arbitrary screening logic (async ML classifiers, network calls, custom rule engines) into prompt resolution. Breaking change; no compat shims. The existing regex screener becomes a built-in `createPatternScreener` factory; `IPromptSafetyPolicy.screeners` replaces `suspiciousPatterns`/`screenedSources`/`onSuspicious`; `applySafeguards` becomes async; findings carry per-finding disposition + optional structured metadata; finding kinds open via `string & {}`.

**Origin / dependency.** Upstream gap-fix for `local-ai-exploration` B-3 (local classifier → `IPromptSafetyPolicy` backend), which can't be built against today's surface. Per the gap-then-fix tenet, fix the primitive here first → ship to `release` → `local-ai-exploration` absorbs (merge `release` → integration) before B-3. Runs parallel to `local-ai-exploration` B-2 (independent surfaces). Independent of the local-ai experiment's outcome — benefits any consumer wanting custom screeners.

### `ai-assist-thinking-events` 🟡

**Status:** 🟡 ready; sequencing after `ai-assist-thinking-config` phase B lands (now satisfied; ai-assist cluster shipped via #336)
**Branch base:** `release` HEAD with `.ai/tasks/completed/2026-05/ai-assist-thinking-config/` and `ai-assist-image-generation/` available as reference
**Package surface:** `@fgv/ts-extras/ai-assist` (streaming adapters, model.ts, apiClient.ts), `@fgv/ts-app-shell/ai-assist`, `.ai/instructions/LIBRARY_CAPABILITIES.md`
**Out-of-scope:** the core thinking-config architecture (already shipped via `ai-assist-thinking-config`); sudoku packages

**Mission.** Surface thinking/reasoning content to callers in streaming and non-streaming responses. The `ai-assist-thinking-config` stream silently discards thinking content; this stream adds the explicit surface. Likely scope:
- New `IAiStreamEvent` variant for thinking deltas (or alternative shape)
- Non-streaming response shape: `thinking?: string` field (or similar) on `IAiCompletionResponse`
- Opt-in plumbing (`IGeminiThinkingOptions.config.includeThoughts` placed by thinking-config stream — wire it up here for all providers)
- Per-provider surfacing logic (Anthropic `thinking_delta` events; Gemini `thought: true` parts; OpenAI encrypted reasoning items if exposed)
- Token accounting (`thinkingTokens?: number` on response)

Design-triage-implement shape is likely; new public API has real consequences.

**Origin.** Carved out of `ai-assist-thinking-config` phase A v2 (D9). Required because v1's "future extension point" hand-wave didn't meet the bar of "concrete trackable followup."

**Phase A artifacts:** TBD when stream is commissioned; will live at `.ai/tasks/active/ai-assist-thinking-events/`.

---

### `esm-emit-impl` ⚠️

**Status:** ⚠️ **shipped to `release` 2026-08-09 inside #607** (`71787e798`) — implemented, and it found that the design's central recommendation does not work. Branch `esm-emit-impl`, based on `fix/esm-node-entry-points` @ `cebf10bae`. **PR #603 was deliberately not shipped on its own** — this branch contains all of it and supersedes it, and #603 has no commit on any ref. **R2 and R3 were implemented, measured, and then reverted: both break the repo's own webpack build.** What ships is R5, two real defect fixes it found, and the evidence. Full monorepo build + test green; both entry-point gates green.
**Paired with `esm-emit-design`** (`.ai/tasks/completed/2026-08/esm-emit-design/`), which is **deliberately left uncorrected**: that a signed-off design was wrong and step-zero verification caught it is the most valuable thing the pair records, and editing it would make the divergence read as an oversight.
**Substrate:** `.ai/tasks/completed/2026-08/esm-emit-impl/{brief.md, state.md, result.md, findings/inbox/}`
**Package surface:** `libraries/ts-bcp47/src` + config, `libraries/ts-web-extras-webauthn/package.json` (`exports` only), `common/scripts`, `common/autoinstallers/rush-bundler-check`, `.github/workflows/ci.yml`.

**The headline.** The `dist` ESM emit contains extensionless directory imports — which is *why* Node could not load it, and is the bug that started all this. The design assumed bundlers were fine with that ("bundlers resolve extensionless directory imports happily") and built R2 and R3 on it. **That is true of esbuild and false of webpack 5**, which applies `fullySpecified` to anything it treats as ESM. Bisected on an otherwise identical tree: `tools/ts-res-ui-playground` goes **0 webpack errors → 6** with R2, and back to **0** when the single generated `dist/package.json` is deleted. R3 fails the same way on whatever it routes.

So **R2 is not the safe, independent one-liner §4 called it** — it converts a harmless Node warning into a hard webpack failure — and **R3 is not gated on a bundler-resolution check, it is gated on Option B** (explicit specifiers, the ~3,520-edit codemod the design deferred for want of a consumer asking). Option B is the precondition for *any* correct consumer of the ESM emit, browser bundlers included; R3's measured win is not available without it. They are one change, not two competing ones — which materially changes Option B's cost/benefit as the design weighed it.

**What ships.** The R5 gate (`verify-bundler-resolution.mjs`) + CI wiring, which actually bundles every published package's browser entry with node builtins unpolyfilled; **two real shipped defects it found** — `ts-bcp47`'s browser entry pulled `fs`/`path` into a browser graph (fixed), and `ts-web-extras-webauthn`'s non-Node condition pointed at a file that is never built, so no bundler/Deno/edge consumer could resolve the package at all (fixed, `exports`-only); the §5.1 `BUNDLER_ONLY` reason amendment; **6 packages declared node-only** on the record rather than skipped silently. Gate green at 19 checked / 6 declared / 0 failed.

**Measurements kept for the follow-up**, taken before the revert: `ts-app-shell` **7.26×**, `ts-json-base` **3.19×** (corroborating the design's independent 3.48×), `ts-extras` 1.62×, `ts-res` 1.30× — but `ts-json` **0.95×** and `ts-web-extras` **1.01×**, i.e. *larger* as ESM. §7 flagged "the wins generalize" as inferred; the inference was wrong in both directions. A clean bundler probe is a precondition for routing, not a reason to route.

**The gate now encodes what was learned:** `--probe-esm` marks a package **BLOCKED** when esbuild bundles it but its emitted specifiers are not fully specified, so the next attempt fails fast with the reason instead of rediscovering it by breaking a build. Current verdict: **10 dual-rig packages BLOCKED, 4 clean.**

**Open for the orchestrator.** **Option B should be commissioned as its own stream, scoped as the enabler for R2+R3 rather than as native-ESM support** — that is the recommendation this stream ends on. **OQ-3** — #603 contains nothing this branch does not; recommend closing it. The 6 node-only declarations are **inferred, not owner-confirmed**, which the sibling gate's own comment calls the weaker basis; filed as a finding asking for a yes/no per package.

---

---

## Shipped streams

The full entries are archived by month under [`docs/workstreams/`](workstreams/). This index is
here so a stream can be found by id without opening them; each archive links back.

**When a stream ships, its entry goes straight into the month archive and its id is added here** —
the same "docs ship with the code" rule as everywhere else, so the working ledger never
accumulates history again.

**[2026-09](workstreams/2026-09.md)** — 1 shipped
`prompt-composition-metadata`

**[2026-08](workstreams/2026-08.md)** — 19 shipped
`converters-single-line` · `schema-optional-translation` · `json-schema-nullable` · `sqlite-vec-throwaway-clear-statement` · `filetree-faithful-copy` · `ai-assist-structured-output` · `agent-memory-kind-collision-guard` · `sqlite-vec-statement-lifetime` · `fragment-query-scoping` · `agent-memory-derived-state-reconciliation` · `agent-memory-index-partial-read` · `vector-rebuild-report-by-kind` · `sqlite-vec-path-open` · `module-resolution-upgrade` · `publish-tarball-gate` · `ts-utils-async-detailed-result` · `fetch-primitive-threat-model` · `ts-prompt-assist-features` · `async-result-family`

**[2026-07](workstreams/2026-07.md)** — 17 shipped
`ai-assist-tool-annotations` · `agent-memory-temporal` · `agent-memory-l2-tools` · `agent-memory-l3-ingest` · `ai-assist-alias-capability-guard` · `ai-assist-fenced-json-diagnostics` · `agent-memory-provenance-contract-doc` · `agent-memory-antagonist` · `ai-assist-antagonist` · `ai-assist-model-tiers` · `ai-assist-gemini-image-refusal` · `ai-assist-openai-frontier-responses` · `agent-memory-fragment-id` · `agent-memory-index-injection-seam` · `testbed-web-scenarios` · `heft-rig-coverage-gate` · `crypto-utils-base64url-hardening`

**[2026-06](workstreams/2026-06.md)** — 18 shipped
`ai-assist-model-aliases` · `ts-agent-memory` · `ai-assist-embeddings` · `json-schema-derives-t` · `discriminated-object-self-fix` · `ai-assist-client-tools` · `ai-assist-client-tool-id-fix` · `ai-assist-cross-provider-continuation` · `ai-assist-tool-continuation` · `ai-assist-message-ordering` · `per-provider-testbed-scenarios` · `ai-assist-cross-provider-fixes` · `ai-assist-responses-reasoning-events` · `ollama-native` · `ts-extras-mcp` · `prompt-assist-horizontal-composition` · `ts-prompt-assist-observability` · `retaining-logger-ring-buffer-refactor`

**[2026-05](workstreams/2026-05.md)** — 15 shipped
`private-key-storage` · `capture-async-result-upgrade` · `ts-app-shell-styling-hardening` · `local-summarization` · `local-ai-exploration` · `ts-res-typed-conditions` · `crypto-batch-2-hpke` · `crypto-batch-2-argon2id` · `crypto-batch-2-webauthn` · `crypto-batch-2-misc` · `ai-assist-thinking-config` · `ai-assist-image-generation` · `auth-primitives-batch1` · `ks-encoding` · `result-should-not-fail`
