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
file*: 803 lines, 43 curated stream entries, Active and Completed. The generated index would
duplicate that for humans while being worse at it. Its unique value is **completeness for
machines**: **68 stream directories exist on disk against 43 narrated entries here**, so ~25
streams have artifacts and no ledger entry. Agents need all 68; humans want the curated 43.
Different audiences, different artifacts, no reason to commit the machine one — which also
removes the merge-conflict class and the risk of an agent hand-merging a generated file into
something corrupt that reads as authoritative. **Side benefit taken:** the generator also reports
stream dirs missing a ledger entry, turning that 25-stream gap into a worklist.

**The open question that sizes the second stream** — resolve it before anything else there:
does `ISchemaValidator.toJson()` drop straight into MCP tool registration? If yes the adapter is
small, generic, and belongs beside its inverse in `ts-extras-mcp`. If not, the estimate moves.

---

### `module-resolution-upgrade` 🟢

**Status:** 🟢 implemented — deliverables 1 and 2 landed; **3 is not available and 4 was deliberately not attempted**. Branch `module-resolution-upgrade` from `release` @ `af2178cde` (after #608). Artifacts at `.ai/tasks/active/module-resolution-upgrade/{brief.md, state.md, result.md, findings/inbox/}`; outcomes recorded in `.claude/project/esm-emit-design.md` § "Amendment 2".

**Mission.** The repo resolves modules under **node10 and nobody chose it** — the rig never sets `moduleResolution`, so `module: commonjs` defaults it. Under node10 **TypeScript does not read the `exports` map at all**, which is the structural reason `ts-web-extras-webauthn`'s `default` condition could name a file that never existed for the package's entire life with every build green.

**What shipped.** `moduleResolution: "node10"` is now **stated** in all 31 rig-inheriting projects, and the three freestanding webpack tsconfigs agree on `bundler`, each with the reason recorded. Verified free the way the brief demanded — full `rush rebuild` before and after, hashing every emitted `.js`/`.d.ts`/`.map`/`.json` plus every checked-in `etc/*.api.md`: **8,836 artifacts, zero differences.** No shipped code changed; no change files needed.

**The load-bearing correction — step 3 is not available at the price it was quoted.** `moduleResolution: bundler` **cannot be set on a `module: commonjs` project**, and 29 of those 31 are (the other 2 are the `heft-web-rig` libraries, which declare `module: ES2020`); `node10` is the only legal value there (`bundler` → TS5095, `node16`/`nodenext` → TS5110). The design amendment's probe varied `module` and `moduleResolution` *together* and so never asked whether its `bundler` row was reachable from where the repo sits. **Every path off node10 changes the emit, so steps 3 and 4 share one prerequisite and are one decision, not a cheap rung and an expensive one.**

**OQ-2 answered in the negative, with the substitute ruled out.** A type-check-only `bundler` overlay was built and swept across all 29 projects: **73 errors, of which 70 are one cause** — `bundler` does not set the `node` export condition, so every dual-entry `@fgv` package resolves to its **browser** build and legitimately lacks the Node-only surface. `customConditions: ["node"]` takes it to 3, but only by pinning the resolver to `node` so the pass **never evaluates `default`** — exactly what webauthn got wrong. Neither pass is a gate, and both are weaker than `verify-esm-entrypoints` / `verify-tarball-exports`, which assert every condition at every subpath unconditionally. **Recommendation: do not build it.** **OQ-3** answered too: the per-project shape was **forced, not chosen** — Heft rejects a TS 5.0 `extends` array, and a workspace-symlinked rig's relative paths resolve into the rig's own tree.

**Findings filed (9).** The largest is not from the brief: **21 of 25 published packages declare a `types` condition that can never be selected**, because it sits after `default`, which matches unconditionally — the same *shape* as the webauthn defect. Nothing has broken (TypeScript falls back to the `.d.ts` beside the resolved `.js`), but **our gates check that each named file exists; none checks that it is reachable** — that blind spot, not the ordering itself, is the finding. Note the obvious fix is a trap: there is one API-Extractor rollup per package and it describes the *Node* entry, so hoisting a single `types` key above the branches would hand browser consumers the Node surface. The correct shape needs a browser rollup the build does not yet emit. Also: `@fgv/ts-utils` imported `jest-snapshot/build`, a subpath that package does not export (confirmed `ERR_PACKAGE_PATH_NOT_EXPORTED` at runtime; latent only because the import is type-only and erased) — the sweep's one real defect, **fixed here** by importing `Context` from the package root as `@fgv/ts-utils-jest` already does. And: the three webpack apps compile via `babel-loader` and are **never type-checked**; `ts-res-ui-playground` has 22 pre-existing errors and `apps/sudoku` 13.

**Reframing the emit decision.** Asked what changing the emit would cost consumers, and the answer is *nothing, because none of them are on it*: **25 of 25 packages route `node.import` at `./lib/index.js`, the CommonJS build**, and `main` is `lib/index.js` everywhere. The ESM tree in `dist/` is built and packed and reached by one browser branch (`@fgv/ts-bcp47`). So the choice is stop shipping `dist`, or fix and activate it — and the ~3,520-specifier change usually costed as "the price of `node16`" is really **the price of having a working ESM emit at all**, which we currently pay for and do not get. Note the ordering trap in option 2: adding `dist/package.json` `{"type":"module"}` *first* is what would break the bundler path that works today, by engaging webpack's `fullySpecified` before the specifiers are fixed.

**Gates untouched and green**, as the brief required — and per OQ-2 this work cannot replace them.

---

### `publish-tarball-gate` 🔵

**Status:** 🟢 implemented — gate built, both neutralizations demonstrated, wired per-PR **and** into all six publish workflows. Branch `claude/publish-tarball-gate-omgb9e`; artifacts at `.ai/tasks/active/publish-tarball-gate/{brief.md, state.md, result.md, findings/inbox/}`.
**⚠️ Rebase still owed.** #603 and #605 were **still open** when this ran, so the hard dependency the brief states was not met. The branch remains based on `esm-emit-impl` @ `29d07bcba` (which carries #603's content), and **must be rebased onto `release` once both land** — nothing here conflicts with them by construction, but the base is unmerged. See `result.md` § Deviations.
**Origin:** direct consumer ask from PersonAIlity, 2026-08-09.

**Mission.** Verify that every path named in a published package's `exports` map exists **in the tarball that ships**, not merely in the working tree. Three defects of one class shipped in a single week — `ts-utils`'s unloadable ESM entry, `ts-web-extras-webauthn`'s `default` naming a file that has never existed, and 5.1.0-27 publishing only `src/` with no build output at all. The gate on #603 checks the working tree, which covers the first two and **cannot** cover the third: `lib/` existed locally and never entered the tarball. **This stream builds a detector, not fixes**; anything it flags is a finding.

**What shipped.** `common/scripts/verify-tarball-exports.mjs` + the `rush-pack-check` autoinstaller (`npm-packlist`; shared shrinkwrap untouched). It walks the **whole** `exports` map — every condition, every subpath, plus `main`/`types`/`module`/`browser` — against the packed file list. Superseding the sibling's tree-based existence check was considered and **declined with reasoning**: the two cannot disagree in the dangerous direction, and what remains genuinely the sibling's is loadability, not existence. Cross-referenced in both headers.

**Instrument, measured.** `npm-packlist` costs **5.2 s for all 25 packages**; `npm pack --dry-run --json` costs **7.6–8.2 s per package** (~3.3 min for the repo) — so the brief's ~12.8 s/package held in shape if not in magnitude on this container. Output verified **byte-identical to `npm pack`** on four packages spanning both `.npmignore`/no-`.npmignore` shapes. The cost is in getting `npm-packlist` a tree, not in `npm-packlist`: `Arborist.loadActual()` is 7.7 s/package, so the gate passes a minimal tree node instead and **fails loudly** on `bundleDependencies` rather than under-checking silently.

**OQ-1 (placement) — resolved as both.** Publish-time is the hard gate and is wired into **all six** publish workflows, including the three `-legacy` ones, which are `workflow_dispatch`-triggerable and therefore real bypass paths. Per-PR CI too, because ~5 s is unnoticeable. **OQ-3 (does it *load*?) — existence only**; the loading half is recorded in `docs/FUTURE.md` with its cost and the narrow residual case it would close, and stated plainly in the consumer note since they asked for both.

**Neutralizations — three, all demonstrated.** Reverting the webauthn `default` fix fails the gate (and fires on a condition Node never selects, which a single-condition resolver would miss); a `.npmignore`-excluded build output fails it; and the true 5.1.0-27 shape — build output absent from disk — fails it with the no-build-output diagnosis. Tree restored clean after each.

**Findings filed (2).** 11 packages ship `src/`, compiled tests, and `.rush/` internals — split exactly on presence of `.npmignore`; recommend a `files` allowlist. And: **npm will not prune the directory containing `main`**, so an `.npmignore` `lib/` line is silently inert — reproduced against real `npm pack`, and it corrected the gate's own no-build-output heuristic into a reported count.

---

### `agent-memory-ingest-dedup-scope` 🟢

**Status:** ✅ shipped — PR [#600](https://github.com/ErikFortune/fgv/pull/600) merged to `release` as `02ba90459`. Branch `agent-memory-ingest-dedup-scope` from `release` @ `b392e1534`. All five deliverables landed; suite green at 100% coverage; `code-reviewer` clean, Copilot loop stopped at round 2 on diminishing returns. Ran in parallel with `safer-fetch-s3`; no code overlap, but both edit `.ai/instructions/LIBRARY_CAPABILITIES.md` and this file — **own section only**.
**Substrate:** `.ai/tasks/completed/2026-08/agent-memory-ingest-dedup-scope/{brief.md, state.md, result.md, findings/inbox/}`
**Package surface:** `@fgv/ts-agent-memory` (`ingest`, `store/fileTreeMemoryStore.ts` — `IMemoryStore` lives there, not in the `types/memoryStore.ts` the brief named; that file does not exist).
**Behavior change (OQ-3, intended, unflagged):** ingest layer-1 now honors `dedupScope`, so `'entity'` kinds (`MemoryCapCullPolicy` / `TemporalVersionedPolicy`) stop collapsing distinct entities with identical bodies on the `ingestItem` path. Kinds with no registered policy are unaffected — they resolve through the store's default `KnowledgeLwwPolicy`, which declares `'content'`.
**Origin:** problem report from PersonAIlity (2026-08-04) against 5.1.0-46, triaged and verified against source.

**Mission.** `dedupScope` is honored by the store and ignored by the ingest orchestrator, so a kind declaring `'entity'` still gets `'content'` behavior through `ingestItem` and the declaration is dead on that path. **`dedupScope` has zero references anywhere in `ingest/`.** Blast radius is wider than the report, though narrower than the brief stated: the affected kinds are those registering an `'entity'`-declaring policy (`MemoryCapCullPolicy` / `TemporalVersionedPolicy`) **whose codec puts distinct entities in one scope** — MTM turns and LTM conversations. A kind with no registered policy resolves through the store's default `KnowledgeLwwPolicy` to `'content'` and is unaffected; temporal kinds were already isolated because `TemporalIdentityCodec` gives each entity its own scope. (The brief's "every experience and versioned kind is affected" was corrected in-stream — see `result.md`.) Fixing it needs a seam first — the orchestrator holds an `IMemoryStore`, which exposes no policy accessor, which is why the consumer's proposed fix is not currently expressible. Carries a second, sharper fix the report surfaced: a `duplicate-of` collapse removes an address that sibling edges in the same pass were built against, failing the **whole** ingest item — true even for `'content'` kinds where the collapse is correct. Also writes `.claude/project/agent-memory-ingest-design.md`, the note three source files already cite but which did not exist.

---

### `private-key-storage` ✅

**Status:** ✅ implemented + reviewed (PR #427, gates green) — ready for squash to `release`
**Integration branch:** `private-key-storage` (off `release`) → squash to `release` at close
**Workflow shape:** single implementation PR onto integration branch (both impls together)
**Substrate:** `.ai/tasks/completed/2026-05/private-key-storage/{brief.md, state.md, result.md, README.md}`
**Package surface:** `@fgv/ts-extras/crypto-utils` (encrypted-file impl, Node) + `@fgv/ts-web-extras/crypto-utils` (IndexedDB impl, browser) + `.ai/instructions/LIBRARY_CAPABILITIES.md`
**Out-of-scope:** changes to the `IPrivateKeyStorage` interface, to `KeyStore.addKeyPair` semantics, or to `@fgv/ts-chocolate`. Multi-process/multi-tab concurrency (single-process/single-tab assumption; documented limit). Password-derivation helper for the file impl's encryption key (consumer concern).

**Mission.** Ship the two `IPrivateKeyStorage` implementations the existing JSDoc promises but doesn't deliver: `IdbPrivateKeyStorage` in `@fgv/ts-web-extras/crypto-utils` (IndexedDB, `supportsNonExtractable: true`) and `EncryptedFilePrivateKeyStorage` in `@fgv/ts-extras/crypto-utils` (directory-on-disk, AES-256-GCM-encrypted JWK content, FileTree I/O, `supportsNonExtractable: false`). Both satisfy the interface verbatim — additive, no interface changes. Also fixes the JSDoc that points at non-existent impls (textbook L18). Closes the gap hardback's agent surfaced when `KeyStore.addKeyPair` failed with `'No private key storage configured'`.

**Origin.** Cross-repo gap surfaced 2026-05-28 (hardback agent investigating agent/hub private-key persistence). ts-extras crypto surface is **established** → additive only. Gap-then-fix: every `KeyStore.addKeyPair` consumer currently rolls their own backend or skips the feature; we ship in fgv so consumers benefit + the JSDoc becomes accurate.

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
**Substrate:** `.ai/tasks/active/prompt-assist-screeners/{brief.md, state.md}`
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

### `ai-assist-tool-annotations` ✅

**Status:** ✅ shipped to `release` via PR #524. Precursor to `agent-memory-l2-tools` (L2's write tools consume it). Consumer: PersonAIlity (mediated agent writes).
**Package surface:** `@fgv/ts-extras/ai-assist` (`model.ts`, `clientToolContinuationBuilder.ts`, `index.ts`) + `@fgv/ts-extras-mcp` (`sdk.ts`, `operations.ts`, `model.ts`, `adapter.ts`).
**Brief:** `.ai/tasks/completed/2026-07/ai-assist-tool-annotations/brief.md`.

**Mission.** Add client-tool **behavior annotations** + a **before-execute gate hook** to the ai-assist client-tool surface. Three components: (1) `IAiToolAnnotations` + `IAiClientToolConfig.annotations?` (MCP-native names; host-advisory-only — no provider wire slot, so serialization is unaffected); (2) thread MCP `Tool.annotations` → the field through `adaptMcpTools` (validated, per the untrusted-server warning — currently dropped at 3 layers); (3) `onBeforeToolExecute?` gate on `executeClientToolTurn` (deny → synthesized denial tool-result, turn continues — reuses the tested failure→continuation path). Additive on both active surfaces. **Full design (incl. deny-semantics, locked) is in the brief** — built up front because it's well-understood, low-medium effort, and ships *with* the write tools it protects (avoiding the shovel-ready-then-forgotten carrying cost).

---

### `agent-memory-temporal` ✅

**Status:** ✅ shipped to `release` via PR #526. Keystone of the three (L3 hard-depends on it). Consumer: PersonAIlity.
**Package surface:** `@fgv/ts-agent-memory` (types/envelope, identityCodec, store/fileTreeMemoryStore, writePolicy, retrieve).
**Brief:** `.ai/tasks/completed/2026-07/agent-memory-temporal/brief.md`.

**Mission.** Build the temporal versioned write path + temporal retrievers. All seams ship in v1 but are stubbed to fail loudly (three `if (addr.isVersioned) return fail(...)` fail-stops; every retriever `supportsTemporalQuery:false`; no `temporal-versioned` policy). Adds a versioned codec, the invalidate-don't-delete policy, versioned store branches, and `AsOfRetriever`/`CurrentValidRetriever`/`HistoryRetriever`. **OQ-11 → subtree-per-entity (consumer-backed).** Consumer-pinned: merge-patch `put()` on a temporal-versioned kind = new version + `invalid_at` on prior (composes with versioning); flat/`isVersioned:false` guarantee for Knowledge/LTM/MTM preserved (zero impact until a kind opts in). Converters already round-trip `temporal?`/`valid_at`/`invalid_at` — no serialization work.

---

### `agent-memory-l2-tools` ✅

**Status:** ✅ shipped to `release` via PR #525. Depended on `ai-assist-tool-annotations` (shipped, #524); independent of temporal/L3. Consumer: PersonAIlity (agent-writable memory tools).
**Package surface:** new `@fgv/ts-agent-memory/tools` packlet; consumes `@fgv/ts-extras` ai-assist `IAiClientTool` + `@fgv/ts-json-base` `JsonSchema`.
**Brief:** `.ai/tasks/completed/2026-07/agent-memory-l2-tools/brief.md`.

**Mission.** Expose memory ops as an `IAiClientTool` suite via `createMemoryTools({ store, retriever, registry, tools?, kinds? })`, `JsonSchema.object` schemas (MCP dual-path via `JsonSchema.fromJson`). **Consumer-locked:** scope isolation is constructor-fixed via a **pre-scoped store** — no tool arg carries `scope` (adoption make-or-break); **per-tool `tools?` subset** (default = read-only `search`+`context`; writes opt in) replaces the coarse `readOnly?`; `memory_search` results carry a host-suppliable **mnemonic handle** (`handleFor?`). Still open: tool-boundary safety (admit-reject surfacing, behavior hints); tool count beyond the five.

---

### `agent-memory-l3-ingest` ✅

**Status:** ✅ shipped to `release` via PR #527. Shipped after temporal (#526) for the full `contradicts`→temporal interlock. Largest of the three. Consumer: PersonAIlity.
**Package surface:** new `@fgv/ts-agent-memory/ingest` packlet; reads `retrieve`+`vector`, writes via `store`.
**Brief:** `.ai/tasks/completed/2026-07/agent-memory-l3-ingest/brief.md`.

**Mission.** The fgv-side ingest orchestrator — host brings classify/extract/relate judgment; fgv owns the typed validation boundary, dedup (exact + new similarity layer), write-time edge/cycle safety, provenance stamping, and the `contradicts`→temporal interlock. Green-field packlet composing shipped seams. **Consumer-locked:** OQ-10 → **staged host interfaces** (consumer plugs its own classifiers/extractors); OQ-13 → `IEntityResolver` **optional** (deterministic-key hosts skip it); **single-item incremental ingest first-class** (per-turn streaming, not batch-only); provenance fields land **additive/optional** (no migration of persisted `mtm`/`ltm`).

---

### `ai-assist-alias-capability-guard` 🔵

**Status:** 🔵 in flight (overnight 2026-07-28). Branches from `release` @ `b689c99ca`. Consumer: PersonAIlity (round-2 ask B + A).
**Package surface:** `@fgv/ts-extras/ai-assist` (`registry.ts`, `model.ts` TSDoc only), `samples/testbed` (`scenarios/imageGeneration/`).
**Out-of-scope:** `packlets/ai-assist/jsonResponse.ts` (owned by `ai-assist-fenced-json-diagnostics`), all of `@fgv/ts-agent-memory`, `docs/WORKSTREAMS.md` (orchestrator-owned).
**Brief:** `.ai/tasks/active/ai-assist-alias-capability-guard/brief.md`.

**Mission.** `resolveImageCapability` and `resolveEmbeddingCapability` prefix-match a raw model id with no alias resolution and no `MODEL_ALIAS_SIGIL` guard, so an fgv alias falls through to the catch-all `modelPrefix: ''` and returns a **confidently wrong capability** — verified by execution: the xAI image alias flips both wire format and `acceptsImageReferenceInput`; the OpenAI embedding alias drops `supportsDimensions` + `maxBatchSize`. Guard both resolvers, fix the in-repo instance in the testbed image-generation scenario, and add the `@remarks` note that `tools`/`thinking` are deliberately not model selectors (ask A — the absence of a `'tools'` key has now sent two consumers down an unnecessary hand-rolled walk).

---

### `ai-assist-fenced-json-diagnostics` 🔵

**Status:** 🔵 in flight (overnight 2026-07-28). Branches from `release` @ `b689c99ca`. Consumer: PersonAIlity (round-2 P3).
**Package surface:** `@fgv/ts-extras/ai-assist` (`jsonResponse.ts` + its tests).
**Out-of-scope:** `registry.ts`, `model.ts`, `apiClient.ts`, `samples/testbed`, `docs/WORKSTREAMS.md`.
**Brief:** `.ai/tasks/active/ai-assist-fenced-json-diagnostics/brief.md`.

**Mission.** A property-name-position `JSON.parse` failure surfaces the bare engine message with no typed reason, offending token, or offset — so unquoted key / single-quoted key / unterminated name / elision are indistinguishable, and they want opposite handling (repair vs re-prompt vs fail). Add a typed failure reason in the shape of the `found`/`unclosed`/`none` scan result that #573 introduced. Note #573's truncation diagnosis fires in the *extractor*, before `JSON.parse`, and does not cover this case.

---

### `agent-memory-provenance-contract-doc` 🔵

**Status:** 🔵 in flight (overnight 2026-07-28). Branches from `release` @ `b689c99ca`. Consumer: PersonAIlity (round-2 P0, doc-only outcome).
**Package surface:** `@fgv/ts-agent-memory` (README + `writePolicy.ts` TSDoc).
**Out-of-scope:** all of `@fgv/ts-extras`, any behavior change to the merge path, `docs/WORKSTREAMS.md`.
**Brief:** `.ai/tasks/active/agent-memory-provenance-contract-doc/brief.md`.

**Mission.** The provenance merge contract is already correct and pinned — the ask is answered *yes* on both halves. Document the guarantee where a consumer will find it so the next one doesn't have to ask: per-key merge over `provenance`, sub-key `null` clearing sanctioned, whole-block `null` rejected loudly. **No behavior change** — this stream fails if the merge semantics move.

---

## Completed workstreams

### `esm-emit-impl` ⚠️

**Status:** ⚠️ implemented, and it found that the design's central recommendation does not work — branch `esm-emit-impl`, based on `fix/esm-node-entry-points` @ `cebf10bae` (not on `release` directly). **PR #603 was deliberately not shipped on its own** — this branch contains all of it and supersedes it. **R2 and R3 were implemented, measured, and then reverted: both break the repo's own webpack build.** What ships is R5, two real defect fixes it found, and the evidence. Full monorepo build + test green; both entry-point gates green.
**Substrate:** `.ai/tasks/active/esm-emit-impl/{brief.md, state.md, result.md, findings/inbox/}`
**Package surface:** `libraries/ts-bcp47/src` + config, `libraries/ts-web-extras-webauthn/package.json` (`exports` only), `common/scripts`, `common/autoinstallers/rush-bundler-check`, `.github/workflows/ci.yml`.

**The headline.** The `dist` ESM emit contains extensionless directory imports — which is *why* Node could not load it, and is the bug that started all this. The design assumed bundlers were fine with that ("bundlers resolve extensionless directory imports happily") and built R2 and R3 on it. **That is true of esbuild and false of webpack 5**, which applies `fullySpecified` to anything it treats as ESM. Bisected on an otherwise identical tree: `tools/ts-res-ui-playground` goes **0 webpack errors → 6** with R2, and back to **0** when the single generated `dist/package.json` is deleted. R3 fails the same way on whatever it routes.

So **R2 is not the safe, independent one-liner §4 called it** — it converts a harmless Node warning into a hard webpack failure — and **R3 is not gated on a bundler-resolution check, it is gated on Option B** (explicit specifiers, the ~3,520-edit codemod the design deferred for want of a consumer asking). Option B is the precondition for *any* correct consumer of the ESM emit, browser bundlers included; R3's measured win is not available without it. They are one change, not two competing ones — which materially changes Option B's cost/benefit as the design weighed it.

**What ships.** The R5 gate (`verify-bundler-resolution.mjs`) + CI wiring, which actually bundles every published package's browser entry with node builtins unpolyfilled; **two real shipped defects it found** — `ts-bcp47`'s browser entry pulled `fs`/`path` into a browser graph (fixed), and `ts-web-extras-webauthn`'s non-Node condition pointed at a file that is never built, so no bundler/Deno/edge consumer could resolve the package at all (fixed, `exports`-only); the §5.1 `BUNDLER_ONLY` reason amendment; **6 packages declared node-only** on the record rather than skipped silently. Gate green at 19 checked / 6 declared / 0 failed.

**Measurements kept for the follow-up**, taken before the revert: `ts-app-shell` **7.26×**, `ts-json-base` **3.19×** (corroborating the design's independent 3.48×), `ts-extras` 1.62×, `ts-res` 1.30× — but `ts-json` **0.95×** and `ts-web-extras` **1.01×**, i.e. *larger* as ESM. §7 flagged "the wins generalize" as inferred; the inference was wrong in both directions. A clean bundler probe is a precondition for routing, not a reason to route.

**The gate now encodes what was learned:** `--probe-esm` marks a package **BLOCKED** when esbuild bundles it but its emitted specifiers are not fully specified, so the next attempt fails fast with the reason instead of rediscovering it by breaking a build. Current verdict: **10 dual-rig packages BLOCKED, 4 clean.**

**Open for the orchestrator.** **Option B should be commissioned as its own stream, scoped as the enabler for R2+R3 rather than as native-ESM support** — that is the recommendation this stream ends on. **OQ-3** — #603 contains nothing this branch does not; recommend closing it. The 6 node-only declarations are **inferred, not owner-confirmed**, which the sibling gate's own comment calls the weaker basis; filed as a finding asking for a yes/no per package.

---

### `ts-utils-async-detailed-result` ✅

**Status:** ✅ shipped — PR [#602](https://github.com/ErikFortune/fgv/pull/602) to `release`. Branch `ts-utils-async-detailed-result` from `release` @ `b85b094b7`. All four deliverables landed; full monorepo build green; `ts-utils` and `ts-extras` suites pass at 100% coverage on the touched files. `code-reviewer` returned no P1s; its two P2s and two P3s are all resolved — including a real one, below.
**Substrate:** `.ai/tasks/completed/2026-08/ts-utils-async-detailed-result/{brief.md, state.md, result.md, findings/inbox/}`
**Package surface:** `@fgv/ts-utils` (`base/result.ts`) + `@fgv/ts-extras` (`safer-fetch/saferFetch.ts`, as the first consumer).

**Mission.** Chaining an async step off a `DetailedResult<T, TD>` silently degraded it to a plain `Result<T>` and lost `TD`. `DetailedSuccess`/`DetailedFailure` extend `Success`/`Failure` and inherited `thenOnSuccess<TN>(cb): AsyncResult<TN>`, which carries no detail type, and no `AsyncDetailedResult` existed. **It type-checked** — the loss surfaced later or not at all, so a package whose failure taxonomy *is* its product could lose it by writing idiomatic code. Surfaced by `safer-fetch-s3` (#601), whose Result-chaining deliverable landed only partially for exactly this reason. Extended the primitive rather than tidying the one consumer; `safer-fetch` rode along as the first real caller so the extension didn't ship speculatively.

**Open questions, as resolved.** **OQ-1** — shape (a), an `AsyncDetailedResult<T, TD>` sibling, as recommended. It **extends `AsyncResult<T>`**, which turned out to be forced rather than stylistic: an override's return type must be assignable to the base method's, exactly as `DetailedSuccess extends Success` is what lets `onSuccess` return `DetailedResult`. The brief's escalation trigger (a contravariant position → prefer option (c)) did fire, but only on the **static** `from`, where renaming to `fromDetailed` costs nothing; the instance surface was clean and compiled first try. **OQ-2** — built the ladder, exactly as far as `AsyncResult`'s existing methods; no new combinators, and deliberately no `captureAsyncDetailedResult` (a captured throw has no detail to supply). **OQ-3** — did **not** force the `safer-fetch` pass; see below.

**Measured `saferFetch.ts` pass (the OQ-3 answer).** Of **21** `isFailure()`/`isSuccess()` checks, **7** are on an awaited `DetailedResult` and **3** converted. The other 4 are exempt for reasons unrelated to this gap — 3 are `_walk`'s hop-loop control flow (the `CODING_STANDARDS` exemption, upheld by S3's own reviewer) and 1 is `_runAttempt`'s retry branch, which reads `walked.detail` to decide whether to recurse. The remaining 14 are on synchronous results or plain `Result`s that never had a detail to lose. Net: checks 21→18, chaining calls 12→15, and `_propagate` — a helper that exists *only* because a detail could not survive a chain — dropped from 11 call sites to 8. **The ts-utils gap explained a minority of the file's imperative checks and most of `saferFetch.ts` legitimately stays imperative**, which the brief anticipated and which is recorded rather than papered over.

**Brief numbers corrected in-stream.** The brief's cross-package count (49 non-test files across 7 packages, `ts-utils` 14) measured **51 / 7**, with `ts-utils` at **16**. The `saferFetch.ts` figures were exact on lines (1,174) and chaining calls (12) but the check count is **21, not 22** — 22 *lines* match, and one of them is a comment carrying two occurrences.

**Caught in review (P2, fixed).** Moving `_receive` into a `thenOnSuccess` callback changed the *shape* of one failure: an internal throw used to propagate to `_execute`'s top-level `captureAsyncResult` and be reported as `{kind:'unknown'}` with a `saferFetch: unexpected error:` prefix, but `AsyncDetailedResult` now catches it earlier and yields `detail: undefined`. Verified empirically against both revisions — a public entry point could return a failure carrying **no `FetchFailureReason` at all**, so a caller switching on `detail.kind` would fault. Fixed by re-stamping a detail-less failure as `'unknown'` at `_execute`, the single boundary where an `Outcome` becomes the caller's result; output is now byte-identical to the pre-change behavior, with a regression test pinning it on all three entry points.

**Finding: nothing else is losing detail.** A sweep of all 34 `thenOnSuccess`/`thenOnFailure` call sites outside `ts-utils` found **none on a `DetailedResult`**. The five other `DetailedResult` consumer packages (`ts-json`, `ts-res`, `ts-json-base`, `ts-utils-jest`, `ts-web-extras`) do not use the async bridge at all; `ts-agent-memory`, `ts-prompt-assist` and `tools/ks`, which use it heavily, never reference `DetailedResult`. The trap was armed and only `safer-fetch` had walked into it — so this fix is **preventive, not remedial**, and a future migration stream would be adopting a capability rather than repairing damage. Per the brief, no other consumer package was migrated.

---

### `fetch-primitive-threat-model` ✅

**Status:** ✅ **complete — design landed and fully implemented across four streams.** **S1** (core, #594) and **S2a** (address classification, #592) — both integrated via #597 — **S2b** (DNS-resolving guard + redirect walk, #599 — squashed to `release` @ `b392e1534`), and **S3** (`safer-fetch-s3` — retry, the loop-detection restructure, the Result-chaining pass, the `@fgv/ts-web-extras` browser packlet, both guarantee tables, the `LIBRARY_CAPABILITIES` entry, and a testbed scenario). The design doc's status line reads *fully implemented*, and every place the implementation departed from it is recorded in its **Appendix D**. Consumer: PersonAIlity.
**Workflow shape:** design-first, then phased implementation per design § 14.
**Deliverable:** `.claude/project/fetch-primitive-threat-model.md` (design) + the `safer-fetch` packlets.
**S3 artifacts:** `.ai/tasks/completed/2026-08/safer-fetch-s3/{README.md, brief.md, state.md, result.md}`.
**Package surface:** `@fgv/ts-extras` (`safer-fetch` packlet + conditional export) and `@fgv/ts-web-extras` (`safer-fetch` packlet), plus one `samples/testbed` scenario (`safer-fetch-guard`).
**Out-of-scope:** all source under `libraries/`, the four existing `ai-assist` `fetch(` sites (deliberately left alone — bearer auth + provider error mapping + an SSE site where a buffering size cap is semantically wrong), `docs/STATUS.md`.

**Mission.** PersonAIlity asked for a `Result`-returning fetch primitive with timeout, size cap, allowlist, and a structured failure taxonomy. Write and land the **threat model** before any code, because the security posture is the product. Three findings drive the design: (1) the redirect policy and the SSRF guard are **one mechanism**, not two bullets — a guard on URL₀ alone is defeated by a single `302` to the cloud metadata endpoint, so `redirect: 'manual'` plus per-hop revalidation plus cross-origin credential stripping ship together or not at all; (2) the guard **cannot exist in the browser** (no DNS API, and `redirect: 'manual'` yields an unreadable opaque redirect), so it splits along the established `crypto-utils` cross-runtime pattern with an explicit per-runtime guarantee table; (3) DNS rebinding is a **documented limit**, closed later via seams designed now — `IGuardVerdict.pinnedAddress?` **and** an injectable `IFetchTransport` (a swappable resolver alone cannot close it; pinning is a property of the connect). Framed deliberately **not** as a Result-integration boundary package — there is no upstream to wrap and the opinion is the entire deliverable.

**S3 open questions, as resolved.** **OQ-1** — the browser path keeps `redirect: 'manual'` rather than switching to `'error'`; the guarantee is identical either way and `'error'` would degrade the failure reason from `'redirect-opaque'` to an undifferentiated `'network'`, so §5.4's row was restated instead (design Appendix D-a). **OQ-2** — the browser entry points refuse `'validate-each-hop'` at option resolution, naming the runtime, rather than failing at the first redirect (D-f). **OQ-3** — `classifyAddress` and the pure policies now ship from the browser barrel too, with an explicit note that they cannot substitute for the resolved-address guard (D-g). **OQ-4** — `allowHosts` / `allowPorts` / `allowInsecureHttp` added, so §13 L6's Ollama example is literally runnable; §12's `{443}` *default* was deliberately not adopted, since it would reject a public `:8443` endpoint with a failure reading as an SSRF block (D-c).

**Original exit gate.** Erik answers the eight open questions in § 16 of the design doc (packlet-vs-sibling-package placement; `DetailedResult`'s `@beta` release-tag cost; required-`guard`-with-no-default; whether the primitive ships with zero in-repo consumers; loopback posture given this repo's own Ollama `http://localhost:11434` path; `maxResponseBytes` default; whether retry belongs in v1; whether the browser package earns its keep). Implementation is a separate stream.

---

### `agent-memory-antagonist` ✅

**Status:** ✅ shipped to `release` via PR #528. Adversarial "antagonist" stream (phase 1): hole-driven torture tests over the seven near-miss invariant classes in `@fgv/ts-agent-memory` (write-path union/replace, bi-temporal boundaries, crash-mid-write self-healing, corrupt on-disk data, host-boundary hostility, cycle-guard graphs, enum/convert-validate parity). **Found and fixed two real store bugs** the happy-path suite + single review missed: content-hash dedup swallowing a same-id metadata-only update (all three write paths), and a tampered `envelope.entityId` loading undetected.
**Package surface:** `@fgv/ts-agent-memory` (tests; two `store/fileTreeMemoryStore.ts` fixes).
**Brief:** `.ai/tasks/completed/2026-07/agent-memory-antagonist/brief.md`.

### `ai-assist-antagonist` ✅

**Status:** ✅ shipped to `release` via PR #529. Antagonist phase 2 over the `@fgv/ts-extras/ai-assist` provider surface (finishReason decline-vs-benign, model routing, convert/validate symmetry, thinking↔temperature param-rejection, streaming drift/SSE, client-tool continuation projection, Gemini tool mutual-exclusion). Classes 1–6 held; class 7 surfaced a real gap — **fixed**: `executeClientToolTurn` now fails fast when a Gemini turn combines `web_search` grounding with client tools (Gemini's API 400s on that combination).
**Package surface:** `@fgv/ts-extras/ai-assist` (tests; one `clientToolContinuationBuilder.ts` guard).
**Brief:** `.ai/tasks/completed/2026-07/ai-assist-antagonist/brief.md`.

### `ai-assist-model-tiers` ✅

**Status:** ✅ shipped to integration branch `ai-assist-model-tiers` (B1–B5 via PRs #511–#515; design Phase A + revision ride the branch); **live-verified** (keyed canary: all three providers LIVE across every tier); promotion PR `hmw86u` → `release` open. Constituent commits squash to `release` at cluster-close.
**Branch base:** `release` (integration branch `claude/ai-assist-model-tiers-hmw86u`)
**Package surface:** `@fgv/ts-extras/ai-assist` (`model.ts`, `registry.ts`, `apiClient.ts`, `streamingClient.ts`, streaming adapters, `converters.ts`, README) + `samples/testbed` (per-provider tier canaries) + `.ai/instructions/LIBRARY_CAPABILITIES.md`, `docs/FUTURE.md`

**Mission.** A cross-provider **quality-tier axis** (`base`/`advanced`/`frontier`) on the ai-assist `ModelSpec` with cascade fallback, built on the shipped alias layer; adopt aliases for OpenAI + Anthropic (Gemini already aliased); advance stale/EOL OpenAI defaults.

**What shipped.** `ModelSpecKey = base|advanced|frontier|image|embedding`; a `tier?` request param; `TIER_FALLBACK` cascade (`frontier→advanced→base`). **Composition, not competition:** thinking/tools are orthogonal params/capabilities, never model selectors (the `thinking`/`tools` keys were removed) — every base model is thinking-capable so `tier + thinking` composes freely. OpenAI + Anthropic alias adoption + tiered defaults; DALL·E retirement; `claude-sonnet-5` thinking-detection fix. Plus two completion-path bugs the **live canary** caught (the "100% mocked coverage on an unexercised wire" failure mode): unconditional default `temperature` (now sent only when explicit) and OpenAI frontier `gpt-5.5-pro` being Responses-API-only (frontier now cascades to advanced=`gpt-5.5`).

**Outcome.** Breaking on the active/alpha surface (tier keys added, `thinking`/`tools`/DALL·E removed). Build + lint + 100% coverage green; `none`/`minor` change files. **Live-verified** end-to-end on the real wire. **Locked decisions:** 3 tiers + cascade; composition (thinking orthogonal); OpenAI base=gpt-5.4-mini, Anthropic base=claude-sonnet-5; Anthropic/Gemini/OpenAI frontier cascade to advanced.

**Fast-follow:** OpenAI frontier via Responses routing — ✅ shipped via the `ai-assist-openai-frontier-responses` stream (`responsesOnlyModelPrefixes` marker + `isResponsesOnlyModel`; `frontier: '@openai:pro'` restored, routed on completion + streaming).

**Artifacts:** [`.ai/tasks/completed/2026-07/ai-assist-model-tiers/`](../.ai/tasks/completed/2026-07/ai-assist-model-tiers/) (brief, design, README).

### `ai-assist-model-aliases` ✅

**Status:** ✅ shipped to integration branch `ai-assist-model-aliases` (Tiers 1–3 via PRs #505–#507 + folded-in Gemini `thoughtSignature` fix; design Phase A #503 rides the branch); promotion PR #508 → `release` (CI build green; live Gemini canaries green). Constituent commits squash to `release` at cluster-close.
**Branch base:** `release` (integration branch `ai-assist-model-aliases`)
**Package surface:** `@fgv/ts-extras/ai-assist` (`registry.ts`, `model.ts`, new model-alias module + tests, `streamingAdapters/gemini.ts`, `streamingAdapters/clientToolContinuationBuilder.ts`, packlet README) + `samples/testbed` (canary scenario) + `.ai/instructions/LIBRARY_CAPABILITIES.md`, `docs/TECH_DEBT.md`

**Mission.** An fgv-owned **canonical model-alias layer** (`@<provider>:<role>` sigil) so `defaultModel` and consumers reference stable aliases that resolve centrally to the current concrete provider model — ending the recurring breakage where the registry pins dated snapshots providers later retire. Forcing function: Google retiring the entire Gemini 2.5 line + Imagen (Oct 2026).

**What shipped.** Generic alias core (`MODEL_ALIAS_SIGIL`, `IModelAliasMap`, `resolveModelAlias`/`resolveProviderModel`) resolved at the completion/image/embedding/tool chokepoints (downstream of `ModelSpecKey`, upstream of `idPattern`); raw IDs still work (back-compat). Gemini migrated to alias-based `defaultModel` (incl. `thinking: '@google-gemini:pro'`), Imagen capability removed, `*ModelNames` bumped to 3.x, `/^gemini-3/` idPattern added. Plus a folded-in Gemini wire-fidelity fix: round-trip the part-level `thoughtSignature` on thinking-enabled client-tool continuations (pre-existing latent 400, surfaced by the live canary).

**Outcome.** Additive (Imagen removal is the one break, on the active surface). Build + lint + 100% coverage green; `none` change file. Live Gemini canaries green: `@google-gemini:flash -> gemini-3.5-flash` (client-tools + continuation) and `@google-gemini:embedding -> gemini-embedding-001` (embedding search). **Locked decisions:** thinking alias = Pro; Imagen removed (not aliased); aliases live on the descriptor.

**Fast-follows (deferred):** OpenAI alias adoption (`@openai:reasoning -> gpt-5.1`); retire residual manual axes (idPattern + `*ModelNames`) so a line-bump is a pure map edit (TECH_DEBT P3).

**Artifacts:** [`.ai/tasks/completed/2026-06/ai-assist-model-aliases/`](../.ai/tasks/completed/2026-06/ai-assist-model-aliases/) (brief, design, state, thoughtSignature-fix brief, README).

### `ts-agent-memory` ✅

**Status:** ✅ shipped — `@fgv/ts-agent-memory` v1 (knowledge + memory + semantic recall) promoted to `release` via PR #501 (2026-06-26). Constituent PRs #496–#500 + #502 squashed onto the integration branch; design spike #495 superseded/closed.
**Package surface:** new `libraries/ts-agent-memory` (`@fgv/ts-agent-memory`) + `.ai/instructions/LIBRARY_CAPABILITIES.md`.

**What shipped.** App-agnostic storage + retrieval substrate for agent memory and knowledge: FileTree markdown+frontmatter vault; typed identity envelope + per-kind Converter-validated bodies (knowledge + experience); domain-keyed identity (`IIdentityCodec`, no minted UUIDs); attributed cycle-safe edges; content-hash dedup with per-kind `dedupScope`; injectable `IWritePolicy` (LWW / cap-cull-oldest + RFC-7386 merge-patch); retrieval stable against a future semantic/temporal backend; ring-backed observation; and **operational semantic recall** (`InMemoryCosineIndex` + embed-on-write, consumer-injected embedder). 314 tests, 100% coverage. Consumer #1: PersonAIlity (knowledge-first behind `IKnowledgeSearchProvider`).

**Fast-follows (deferred; seams present):** temporal versioned write path + retrievers; L2 agent-tool surface; L3 ingest orchestrator. See `docs/FUTURE.md`.

**Artifacts:** [`.ai/tasks/completed/2026-06/ts-agent-memory/`](../.ai/tasks/completed/2026-06/ts-agent-memory/) (+ `ts-agent-memory-vector/`).

### `ai-assist-embeddings` ✅

**Status:** ✅ shipped to integration branch `ai-assist-embeddings` (Phases 1–4 via PRs #481–#484; each squash/merge into the integration branch, promotion to `release` to follow with the rest of the branch).
**Branch base:** `release` (integration branch `ai-assist-embeddings`)
**Package surface:** `@fgv/ts-extras/ai-assist` (new `embeddingClient.ts` + shared `http.ts`; `model.ts`, `registry.ts`, `apiClient.ts`, `index.ts`) + `.ai/instructions/LIBRARY_CAPABILITIES.md`

**Mission.** Add the missing third ai-assist modality — `text → vector` embeddings — as a cross-provider HTTP primitive mirroring the completion and image-generation primitives.

**What shipped.** `callProviderEmbedding` + `callProxiedEmbedding` over a two-member `AiEmbeddingApiFormat` dispatch: `openai-embeddings` (OpenAI / Ollama-via-`/v1` / openai-compat / Mistral) and `gemini-embeddings` (Gemini `batchEmbedContents`, `taskType` + `outputDimensionality`). Additive `embedding?` descriptor capability + `'embedding'` `ModelSpecKey` + `supportsEmbedding`/`resolveEmbeddingCapability`. Cross-provider `dimensions`/`taskType` knobs are no-op-where-unsupported (logged, never a failure), preserving Gemini's retrieval asymmetry. `number[][]` result; empty-input short-circuit; `maxBatchSize` fail-fast; OpenAI response-alignment validation.

**Outcome.** Additive only; all phases green (`build` + `lint` + `test` @ 100% coverage; api report regenerated; `none` change files). Shared `http.ts` (`fetchJson` + `IAiApiConfig`) extracted from `apiClient.ts`, reused by both clients. **Resolved ollama-native OQ-1: native Ollama `embed` is CUT** — Ollama embeddings flow through `callProviderEmbedding` via `/v1`.

**Artifacts:** [`.ai/tasks/completed/2026-06/ai-assist-embeddings/`](../.ai/tasks/completed/2026-06/ai-assist-embeddings/) (brief, design, result, README).

### `json-schema-derives-t` ✅

**Status:** ✅ shipped via PR #441 to integration branch `json-schema-derives-t`; cluster-close PR open
**Workflow shape:** alignment stream (single-PR new packlet on integration branch + cluster-close squash to release)
**Substrate:** `.ai/tasks/completed/2026-06/json-schema-derives-t/{state.md, README.md}` + `.ai/tasks/completed/2026-06/json-schema-converter-alignment/{brief.md, state.md, research.md, derives-t-feasibility-brief.md, derives-t-feasibility.md, README.md}` (alignment spike rides with this stream's squash)
**Package surface:** `@fgv/ts-json-base` (new `json-schema-builder` packlet, consumer-facing `JsonSchema` namespace) — ~505 lines impl + ~620 lines tests; no surface change to existing exports.

**Mission.** Typed JSON Schema with derived static types for the LLM-tool subset. **Schema IS the validator.** Each factory returns an `ISchemaValidator<T>` that extends `Validator<T>`, carries the phantom `static: T` for `Static<typeof schema>` extraction, and exposes `validate()` / `convert()` / `toJson()` as methods. `fromJson(rawJsonObject)` parses incoming JSON Schema (e.g. from MCP) into an `ISchemaValidator<JsonValue>` via `Converters.discriminatedObject` with arms recursing through `self` (enabled by PR #442's discriminatedObject self-fix). Consumer authors a single typed value and gets verified-not-asserted type safety end-to-end.

**Origin.** Surfaced during `ai-assist-client-tools` Phase A review: a consumer authoring both JSON Schema (wire) and Converter/Validator (runtime) over the same shape is error-prone. Two-phase spike (`json-schema-converter-alignment`) tested feasibility; phase-1 broad survey + phase-2 schema-derives-T feasibility verdict, both shipped as substrate artifacts. Erik chose Option 1 (commission alignment now, hold ai-assist-client-tools Phase B/C). Four Copilot review rounds + structural pivots; round 3 surfaced a load-bearing validator/convert symmetry bug; loop converged on diminishing returns at round 4 (4 of 10 used per L33).

### `discriminated-object-self-fix` ✅

**Status:** ✅ shipped to `release` via PR #442 (2026-06-03).
**Workflow shape:** single implementation PR direct to `release`
**Substrate:** `.ai/tasks/completed/2026-06/discriminated-object-self-fix/{brief.md, state.md, README.md}`
**Package surface:** `@fgv/ts-utils` — `conversion/{converter.ts, baseConverter.ts, basicConverters.ts}` + tests + api-extractor report + `minor` change file.

**Mission.** Three-part additive fix to `Converters.discriminatedObject` so per-arm converter invocations thread `self` (and `context`) — bringing the primitive in line with every other Converter combinator and unblocking recursive discriminated-union parsers. (1) `Converter.convert` interface gained optional `selfOverride?: Converter<T, TC>`; (2) `BaseConverter.convert` honors it via `_converter(from, selfOverride ?? this, context)`; (3) `discriminatedObject` body wraps a `ConverterFunc` and threads `self`/`context` to arms, with `isValidator(arm)` discriminating the in-place validator path from the recursion-capable converter path. `ValidatorBase.validate` needed no change (already threads `self` correctly). 5 new tests cover the recursive-tree case end-to-end including a direct `self === outerConverter` identity assertion.

**Origin.** Surfaced during `json-schema-derives-t` (PR #441) review — the procedural `_parseNode` switch inside `fromJson` is the manual-type-check-with-cast anti-pattern fgv forbids. Correct shape is `Converters.discriminatedObject('type', { ... })` with arms recursing through `self` for nested schemas. Erik called the missing-`self` an outright bug rather than a workaround-worthy debt; this stream fixed the primitive once instead of accumulating lazy-thunk-closure workarounds in every recursive parser. Unblocks the `json-schema-derives-t` revision.

### `capture-async-result-upgrade` ✅

**Status:** ✅ implementation merged to integration branch (PR #433); cluster-close PR #434 open
**Integration branch:** `capture-async-result-upgrade` (off `release`) → squash to `release` at close
**Workflow shape:** single implementation PR onto integration branch
**Substrate:** `.ai/tasks/completed/2026-05/capture-async-result-upgrade/{brief.md, state.md, README.md}`
**Package surface:** `@fgv/ts-utils` (`base/result.ts` — `captureAsyncResult`, `AsyncSuccessContinuation`, `AsyncFailureContinuation`, `AsyncResult` constructor + tests + api-extractor report); opportunistic call-site cleanups in `@fgv/ts-extras` and `@fgv/ts-prompt-assist`.

**Mission.** Made `AsyncResult<T>` the canonical chainable shape across the async-Result API via three coordinated additive surface changes: (1) `captureAsyncResult<T>` returns `AsyncResult<T>` instead of `Promise<Result<T>>`; (2) `AsyncSuccessContinuation` / `AsyncFailureContinuation` widened to accept `PromiseLike<Result<...>>` so the chaining slots accept what the factory produces (brief amendment surfaced mid-stream); (3) `AsyncResult` constructor parameter widened to `PromiseLike<Result<T>>` so the chaining methods can pass the widened callback return through without re-wrapping (natural cascade from delta 2). Strictly additive at every call site — all 86 monorepo call sites compile unchanged because `AsyncResult` is `PromiseLike<Result<T>>`, every existing `(value) => Promise<Result<TN>>` callback satisfies `(value) => PromiseLike<Result<TN>>`, and every existing `new AsyncResult(somePromise)` still satisfies `PromiseLike`. Three opportunistic call-site cleanups under the 15-site budget; full-repo `rush build` + `rush test` sweep green (modulo one unrelated pre-existing `mutableFsTree` root-uid test failure routed to TECH_DEBT P4).

**Origin.** Surfaced in `.ai/tasks/completed/2026-05/private-key-storage/result.md` Follow-ups (chain seam in `_encryptAndWrite`); commissioned ahead of the -33 publish so the cleanup lands in the same alpha as `ts-app-shell-styling-hardening`. Mid-stream brief amendment for delta 2 demonstrated the cascade-completeness pattern (L29) in action.

### `ts-app-shell-styling-hardening` ✅

**Status:** ✅ shipped to `release` via PR #432 (squash of integration branch).
**Integration branch:** `ts-app-shell-styling-hardening` (off `release`) → squashed to `release` at close
**Workflow shape:** single implementation PR onto integration branch
**Substrate:** `.ai/tasks/completed/2026-05/ts-app-shell-styling-hardening/{brief.md, state.md, README.md}`
**Package surface:** `@fgv/ts-app-shell` `messages` packlet (icon SVGs + `MessagesProvider` + `IMessageAction` discriminated union + `ToastItem`) + README setup section + `.ai/instructions/LIBRARY_CAPABILITIES.md`

**Mission.** Hardened `@fgv/ts-app-shell` against the most common consumer misconfiguration — forgetting to add `'./node_modules/@fgv/ts-app-shell/lib/**/*.{js,jsx}'` to the Tailwind `content` array. Three layers: (1) defensive inline geometry on catastrophic-failure icon SVGs and absolutely-positioned overlays in the `messages` packlet (including inline `position: relative` on the search wrapper — caught in review); (2) self-diagnosing probe in `MessagesProvider` using a sentinel arbitrary-value Tailwind utility (`h-[7.3215px]`, uniquely-named so it can only be generated by Tailwind scanning ts-app-shell's built JS — also caught in review, replacing the original `h-3.5` probe that could be masked by consumer-side usage); (3) targeted README nudges (top-of-doc Required-setup callout, stable `## Setup` anchor, troubleshooting section). `IMessageAction` refactored to a discriminated union (`IMessageHrefAction | IMessageCallbackAction`) so "exactly one of `href` or `onAction`" is enforced at the type level.

**Origin.** Cross-repo debug 2026-05-29: personaility on `@fgv/ts-app-shell@5.1.0-32` reported "no filter button visible" — DOM proved Tailwind geometry classes present without CSS, root cause was missing `content` path entry. README was correct but easy to miss; failure mode silent and catastrophic enough to warrant in-package defenses.

### `local-summarization` ✅

**Status:** ✅ shipped to `release` (integration branch `local-summarization` squash-merged).
**Branch base:** `release` (integration branch `local-summarization`)
**Package surface:** `@fgv/ts-extras-transformers` + `@fgv/ts-web-extras-transformers` (added `summarize`) + `samples/testbed` (CLI scenario) + `.ai/instructions/LIBRARY_CAPABILITIES.md`

**What shipped.** `summarize(summarizer, text, options?) → Promise<Result<SummarizationOutput>>` in both facades (surface parity; thin `captureAsyncResult` boundary over the `summarization` pipeline) + a CLI-only `local-summarization` testbed scenario (`Xenova/distilbart-cnn-6-6`; surfaces via the shell's `no-web` path). Third facade task type (`classify` → `embed` → `summarize`). Consumer-driven: local is the cheap/fast path; cloud (ai-assist) stays for quality on long/complex docs.

**Outcome.** `loadPipeline` task-typing needed no extension; no unsafe cast. Facades 28 tests each @ 100%; testbed 143 @ 100%; full `rush build` + `build:web` green; `minor` change files; api reports regenerated.

**Artifacts:** [`.ai/tasks/completed/2026-05/local-summarization/`](../.ai/tasks/completed/2026-05/local-summarization/) (brief, state, result, README).

### `local-ai-exploration` ✅ (cluster)

**Status:** ✅ shipped — all sub-phases (B-1…B-5) merged into integration branch `local-ai-exploration`; promotion PR `local-ai-exploration` → `release` open (see PRs in the artifacts). (First promotion #410 was closed as premature — reopened for B-5, then re-promoted.)
**Integration branch:** `local-ai-exploration` (off `release`)
**Package surface (new):**
- `samples/testbed/` — long-lived sample-browser app (web + CLI), themed (light/dark), with two working scenarios: `local-classifier-safety`, `local-embedding-search`.
- `@fgv/ts-extras-transformers` + `@fgv/ts-web-extras-transformers` — Result-integration boundary over `@huggingface/transformers` (`loadPipeline`, `classify`, `classifyAll`, `embed`; `generate` deferred).
- `@fgv/ts-app-shell` — gained a default light/dark theme (54-token CSS-var system + Tailwind preset) as a gap-fix; the testbed was its first visual consumer.

**Outcome.** The B-3 done-or-discard gate decided **SHIP**: the facade read cleaner than raw `pipeline()`, survived a real composition (classifier → `ts-prompt-assist` screener), and B-4a confirmed it survives a second model type (embedder). B-5 wired the shell/CLI to actually run scenarios and, via gap-then-fix, gave ts-app-shell a shippable theme. The dual-target consumption pattern (facade-agnostic core; browser facade on web / Node facade via `webpackIgnore` on CLI) proved repeatable. `LIBRARY_CAPABILITIES.md` entries added.

**Sub-phases (all merged to `local-ai-exploration`):** research #402 · substrate #403 · B-1 #404 · B-2 #405 · B-3 #408 · B-4a #409 · B-5 (shell+CLI + ts-app-shell theme + styling) #411.

**Follow-ups (deferred / tracked):** `generate` primitive + a local text-generation scenario; port `samples/ai-image-gen-sample` scenarios into the testbed (P3 tech debt); optional Heroicons theme-toggle icon; palette retuning (CSS-var overridable); a "remaining gaps → which yield real value" review thread.

**Artifacts:** [`.ai/tasks/completed/2026-05/local-ai-exploration/`](../.ai/tasks/completed/2026-05/local-ai-exploration/) (brief, all phase briefs/results, state).

### `ts-prompt-assist-features` ✅ (cluster)

**Status:** ✅ shipped — cluster integration branch `claude/ts-prompt-assist-features` ready for promotion to `release`
**Cluster scope:** `@fgv/ts-prompt-assist` v0.1 (new library) + `@fgv/ts-extras/mustache` additive extension + `@fgv/ts-res` typed-conditions support (sub-stream below) + sample-app demonstration in `samples/ai-image-gen-sample`
**Sub-stream:** [`ts-res-typed-conditions`](#ts-res-typed-conditions-) (below)

**What shipped.**
- `PromptLibrary.create` factory; `resolve` (lookup-then-compose), `resolveJsonOutput<K>` (runtime-evidenced kind dispatch), `resolveFreeTextOutput`, `describe` (cross-scope structural-equality check).
- `IPromptStore` storage abstraction (read-only at v0.1); `FileTreePromptStore` canonical adapter; `PromptStoreFixture.build(seed)` canonical in-memory test/demo fixture.
- `PromptRegistry<TResponse>` with three typed sub-registries (`converters` / `slotKinds` / `outputValidations`).
- `IPromptSafetyPolicy` — length cap, suspicious-pattern screen with `lastIndex` reset, slot-source allowlist, `onSuspicious: 'warn' | 'reject'`, consumer-supplied `antiJailbreakPreface` seam.
- `buildSimpleDescriptor` helper for trivial free-text chat case (JSON-output paths still use full `IPromptDescriptor` to preserve `output.kind` dispatch).
- Resource bindings as first-class with RFC 8785 canonical-JSON cycle detection + depth cap.
- `MustacheTemplate.create(template, { escape: 'none' | 'html' | callback })` additive extension on `@fgv/ts-extras`.

**Decomposition history.** Phase A (#357 design lock) + Phase B (#358 brief) opened the cluster. PR #359's single-agent Phase B attempt retired after mid-run context drift produced ~35 reviewer-flagged issues; rescoped into sub-phase commissions (B-0a / B-0b / B-1a / B-1b / B-2 / B-3 / B-4 / B-5) per `brief-phase-b.md`. All sub-phases landed clean under the decomposed discipline. Orchestrator-driven post-merge cleanup PRs (#367, #370) absorbed sub-phase nits per the cluster's ship-then-tidy mechanic. Surface-tidy round (#372) split `resolveAndValidateOutput<T>` into `resolveJsonOutput<K>` + `resolveFreeTextOutput`, replacing the last caller-asserted-`T` boundary with a runtime-evidenced kind check.

**Pressure-test refinement.** Round 1 (#373 held; findings cherry-picked via #374) — 14 findings; ergonomics absorbed via #375 (`withType()`) + #376 (mixed-shape `QualifierCollector` + `IQualifierContext` Partial-widen) + #377 (ts-extras Yaml browser export bug + L13 cross-runtime micro-test) + #380 (F3 + F9 + F12 + F14 ergonomics). Round 2 (#384) — fresh sample-app integration "materially smoother than round-1"; F1/F2/F6 absorbed via the `ts-res-typed-conditions` sub-stream (sample updated to demonstrate the typed flow end-to-end).

**Artifacts:** [`.ai/tasks/completed/2026-05/ts-prompt-assist/`](../.ai/tasks/completed/2026-05/ts-prompt-assist/) (root README plus full design / brief / state / findings / phase-result docs).

**Followup streams (queued in `docs/FUTURE.md`):** `ts-prompt-assist-samples`, `ts-prompt-assist-editor-ui`, typed qualifier VALUES (round-2 F5).

### `ts-res-typed-conditions` ✅

**Status:** ✅ shipped — three sub-phases merged into `claude/ts-prompt-assist-features` (sub-stream of the `ts-prompt-assist-features` cluster above)
**Package surface:** `@fgv/ts-res` (`resource-json/` Decl tree + `conditions/convert/` Converter pipeline) + `@fgv/ts-prompt-assist` (B-3 consumer port)

**What shipped.**
- **B-1 (#391)** — Decl-tree type cascade. 17 types in `resource-json/json.ts` + `conditions/` parameterized on `TQualifierNames extends string = string` with default-string back-compat. Two latent fixes (`getKeyFromLooseDecl` undefined-handling; type-guard `'id' in decl && typeof decl.id === 'string'` runtime soundness) carried forward from closed PR #386.
- **B-2 (#394)** — Sibling `typed*` Converter exports over a shared parameterized core. 16 typed siblings (4 in `Conditions.Convert`, 12 in `ResourceJson.Convert`); existing untyped exports preserved at signature and behavior level. Drift-protection markers (`// keep in sync with X`) inline. `IConditionDecl` / `IConditionSetDecl` parameterized.
- **B-3 (#395)** — `@fgv/ts-prompt-assist` consumer port. 6 container types parameterized; `typedPromptFileConverter<T>(qc)` factory; `qualifierNameConverter?` threaded into `FileTreePromptStore.create` and `PromptStoreFixture.build`. F2 (`buildSimpleDescriptor`) and F6 (README React-wiring) absorbed from closed PR #385; F1's local sibling types obsoleted by the ts-res-layer ownership.

**Sample-app demo (#384).** `samples/ai-image-gen-sample/src/promptLibrary.ts` wires a typed `qualifierNameConverter` for `'tone'`; the round-2 pressure-test integration now demonstrates the cluster's deliverable end-to-end.

**Decision-track.** PR #386 (leaf-only parameterization) closed superseded after a senior-developer stress-test addendum (#389) caught the structural correction: #386 had no plumbing through container types, so the narrow couldn't reach the leaf from any realistic authoring chain. Option D (sibling `typed*` exports over a shared core) chosen as the non-breaking shape that preserves existing call sites. Full design-track at [`ts-res-typed-conditions-design.md`](../.ai/tasks/completed/2026-05/ts-prompt-assist/ts-res-typed-conditions-design.md) + [evaluation.md](../.ai/tasks/completed/2026-05/ts-prompt-assist/ts-res-typed-conditions-evaluation.md).

**Artifacts:** [`.ai/tasks/completed/2026-05/ts-res-typed-conditions/`](../.ai/tasks/completed/2026-05/ts-res-typed-conditions/) (brief, design notes, all three phase-result docs, polished README).

### `crypto-batch-2-hpke` ✅

**Status:** ✅ shipped — merged in [#348](https://github.com/ErikFortune/fgv/pull/348) into `claude/crypto-batch-2-features` integration branch; phase A design in [#343](https://github.com/ErikFortune/fgv/pull/343); phase B brief in [#346](https://github.com/ErikFortune/fgv/pull/346); branch `claude/crypto-batch-2-hpke-impl-pR3QU`
**Package surface:** `@fgv/ts-extras/crypto-utils`, `@fgv/ts-web-extras/crypto-utils`, `.ai/instructions/LIBRARY_CAPABILITIES.md`

**What shipped.**
- `HpkeProvider` class (private constructor + static `create(subtle)` factory) implementing HPKE base mode (RFC 9180) with cipher suite DHKEM(X25519, HKDF-SHA256) + HKDF-SHA256 + AES-256-GCM
- Public surface: `sealBase`, `openBase`, `hkdf`, `encodeEnvelope`, `decodeEnvelope`. Internal Encap/Decap/KeySchedule stay private.
- Single implementation in `ts-extras` re-exported from `ts-web-extras` for browser callers; `CryptoUtils.HpkeProvider` namespace path works for both `moduleResolution: node` and `bundler` consumers
- B.0 RFC verification caught a design-vs-RFC discrepancy: design.md §1 used label `"dh"` in ExtractAndExpand; RFC 9180 §4.1 specifies `"eae_prk"`. Agent stopped, surfaced, corrected (confirmed via OpenSSL happykey + multiple independent implementations)
- Cross-runtime anchor vectors: Node-sealed ciphertext opens correctly on jsdom Web Crypto. 24 Node tests + 18 browser tests, 100% coverage.

**Artifacts:** `.ai/tasks/completed/2026-05/crypto-batch-2-hpke/`

### `crypto-batch-2-argon2id` ✅

**Status:** ✅ shipped — merged in [#349](https://github.com/ErikFortune/fgv/pull/349) into `claude/crypto-batch-2-features` integration branch; phase A design in [#344](https://github.com/ErikFortune/fgv/pull/344); phase B brief in [#346](https://github.com/ErikFortune/fgv/pull/346); branch `claude/crypto-batch-2-argon2id-impl-bOXwM`
**Package surface:** NEW packages `@fgv/ts-extras-argon2` (Node, wraps `argon2`) and `@fgv/ts-web-extras-argon2` (browser, wraps `hash-wasm`); model additions in `@fgv/ts-extras/crypto-utils`; `KeyStore` integration; `.ai/instructions/LIBRARY_CAPABILITIES.md`

**What shipped.**
- `IArgon2idProvider`, `IArgon2idParams`, `ARGON2ID_OWASP_MIN`, `ARGON2ID_PASSPHRASE` in `@fgv/ts-extras/crypto-utils/model.ts`
- `IKeyDerivationParams` converted to discriminated union (`'pbkdf2'` | `'argon2id'`)
- `NodeArgon2Provider` in `@fgv/ts-extras-argon2` backed by `argon2` (kelektiv v0.44.0)
- `BrowserArgon2Provider` in `@fgv/ts-web-extras-argon2` backed by `hash-wasm` v4.12.0 — pure WASM, runs identically in Node and browsers
- `KeyStore.addSecretFromPasswordArgon2id` and `verifySecretFromPasswordArgon2id` (explicit `IArgon2idProvider` injection — KeyStore does not hold one by default)
- Cross-runtime byte-identical output verified: RFC 9106 §B.3 vector produces `03aab965...6d0c2e` on both providers; plus 7-case parameter sweep. 100% coverage across all three packages.

**Artifacts:** `.ai/tasks/completed/2026-05/crypto-batch-2-argon2id/`

### `crypto-batch-2-webauthn` ✅

**Status:** ✅ shipped — merged in [#347](https://github.com/ErikFortune/fgv/pull/347) into `claude/crypto-batch-2-features` integration branch; phase A design in [#342](https://github.com/ErikFortune/fgv/pull/342); phase B brief in [#346](https://github.com/ErikFortune/fgv/pull/346); branch `claude/crypto-batch-2-webauthn-impl-6XN80`
**Package surface:** NEW packages `@fgv/ts-extras-webauthn` (wraps `@simplewebauthn/server`) and `@fgv/ts-web-extras-webauthn` (wraps `@simplewebauthn/browser`); `common/config/rush/common-versions.json`; `.ai/instructions/LIBRARY_CAPABILITIES.md`

**What shipped.** Result-integration boundary — six primitive functions, nothing else:
- Server: `generateRegistrationOptions`, `verifyRegistrationResponse`, `generateAuthenticationOptions`, `verifyAuthenticationResponse`
- Browser: `startRegistration`, `startAuthentication`
- Each a one-line `captureAsyncResult(() => upstream(options))` over `@simplewebauthn/*` v13
- No challenge generators, no PRF helpers, no autofill validators, no credential builders, no ceremony orchestration (four temptations explicitly considered and rejected per OQ-4)
- Type re-exports limited to direct-signature types; `jest.mock` upstream entirely (no real WebAuthn ceremony in tests). 100% coverage in both packages.

**Followup**: `integrations/` vs `libraries/` directory convention (parked to FUTURE.md); see also TECH_DEBT P3 entry on `"sideEffects": false` field consistency for new pure-library packages.

**Artifacts:** `.ai/tasks/completed/2026-05/crypto-batch-2-webauthn/`

### `crypto-batch-2-misc` ✅

**Status:** ✅ shipped — merged in [#345](https://github.com/ErikFortune/fgv/pull/345) into `claude/crypto-batch-2-features` integration branch; branch `claude/add-crypto-provider-methods-hHMYd`
**Package surface:** `@fgv/ts-extras/crypto-utils`, `@fgv/ts-web-extras/crypto-utils`, `.ai/instructions/LIBRARY_CAPABILITIES.md`

**What shipped.** Five new methods on `ICryptoProvider` (and both concrete implementations):
- `sign(privateKey, data)` / `verify(publicKey, signature, data)` — Ed25519 and ECDSA-P256, algorithm inferred from key
- `timingSafeEqual(a, b)` — constant-time byte comparison (Node `crypto.timingSafeEqual`; browser XOR-walk accumulator)
- `hmacSha256(key, data)` / `verifyHmacSha256(key, signature, data)` — HMAC-SHA256 MAC with constant-time verification via `timingSafeEqual`

`sign`/`verify`/`timingSafeEqual` were specified in the stream brief; `hmacSha256`/`verifyHmacSha256` added during implementation per orchestrator review request (cross-repo consumer surfaced the need).

**Artifacts:** `.ai/tasks/completed/2026-05/crypto-batch-2-misc/`

### `ai-assist-thinking-config` ✅

**Status:** ✅ shipped — merged in [#334](https://github.com/ErikFortune/fgv/pull/334) into `claude/ai-assist-features` integration branch; phase A v2 design in [#332](https://github.com/ErikFortune/fgv/pull/332); commission prep in [#330](https://github.com/ErikFortune/fgv/pull/330) + [#333](https://github.com/ErikFortune/fgv/pull/333); phase B branch `claude/ai-assist-thinking-phase-b-aIY1Y`
**Package surface:** `@fgv/ts-extras/ai-assist`, `.ai/instructions/LIBRARY_CAPABILITIES.md`

**What shipped.**
- Layered thinking-config architecture: `IThinkingConfig` with generic `effort?: 'low' | 'medium' | 'high'` + `providers?: ReadonlyArray<IThinkingProviderConfig>` array of per-provider blocks (Anthropic, OpenAI, Google, xAI, Other escape hatch). Per-provider configs expose full provider knobs first-class (Anthropic `'max'`, OpenAI `'xhigh'`/`'none'`/`'minimal'`, Gemini `thinkingBudget`, xAI `'none'`)
- `thinkingOptionsResolver.ts`: 4-tier merge logic + `checkTemperatureConflict` (temperature + thinking = `Result.fail` on Anthropic / OpenAI non-'none' / xAI conservative; Gemini accepts both)
- Registry signaling: `AiModelCapability` + `ModelSpecKey` gain `'thinking'`; `IAiProviderDescriptor.thinkingMode` (`'optional'`/`'required'`/`'unsupported'`); capability rules per provider
- xAI registry staleness fix: retired `grok-4-1-fast`/`grok-4-1-fast-reasoning` removed; defaults updated to `grok-4.3`
- Anthropic non-streaming validator fix: `extractAnthropicText` used unconditionally (handles thinking blocks, tools, plain text)
- All four chat-completion paths (non-streaming + streaming) updated with thinking wire encoding; proxy passthrough wired
- OpenAI `'none'` edge case correctly handled: setting `effort: 'none'` on gpt-5.x disables reasoning AND accepts temperature

**Followup**: `ai-assist-thinking-events` (queued; thinking-event surfacing to callers; the `includeThoughts?: boolean` field placed but inert in this stream gets wired up there)

**Artifacts:** `.ai/tasks/completed/2026-05/ai-assist-thinking-config/`

### `ai-assist-image-generation` ✅

**Status:** ✅ shipped — PR [#329](https://github.com/ErikFortune/fgv/pull/329) → `claude/ai-assist-features`; branch `claude/implement-image-generation-m7xMi`
**Package surface:** `@fgv/ts-extras/ai-assist`, `.ai/instructions/LIBRARY_CAPABILITIES.md`

**What shipped.**
- Layered image generation options architecture: `IAiImageGenerationOptions` with generic top-level fields (`size`, `quality`, `seed`, `count`) + `models?: ReadonlyArray<IModelFamilyConfig>` for family-scoped blocks (`IDallEModelOptions`, `IGptImageModelOptions`, `IGrokImagineModelOptions`, `IImagen4ModelOptions`, `IGeminiFlashImageModelOptions`, `IOtherModelOptions` escape hatch)
- `imageOptionsResolver.ts`: 4-tier merge logic (generic → family-generic → model-specific ≈ Other) + registry-driven validation
- Registry updated: deprecated models dropped (`imagen-3.*`, `grok-2-image-1212`, `grok-imagine-image-pro`); xAI default corrected to `grok-imagine-image-quality`; all models annotated with `acceptedSizes`, `supportsQualityParam`, `acceptedQualities`, `maxCount`, `outputParamStyle`
- `apiClient.ts`: gpt-image-1 `output_format` fix (edits + generations paths); xAI JSON-body edits adapter; Imagen 4 params; Gemini aspect-ratio support; fail-fast for >3 xAI reference images
- Root cause fixes: gpt-image-1 HTTP 400 on `response_format`; dall-e-3 `count > 1`; dall-e-3 quality `'hd'` encoding

**Artifacts:** `.ai/tasks/completed/2026-05/ai-assist-image-generation/`

### `auth-primitives-batch1` ✅

**Status:** ✅ shipped — merged in [#322](https://github.com/ErikFortune/fgv/pull/322) (`bb913392`); published in `5.1.0-26` alpha
**Package surface:** `@fgv/ts-extras` (crypto-utils), `@fgv/ts-web-extras` (crypto-utils), `@fgv/ts-utils` (base/normalize), `.ai/instructions/LIBRARY_CAPABILITIES.md`
**Cross-repo consumer:** [`ErikFortune/personaility`](https://github.com/ErikFortune/personaility) — `claude/auth-primitives-foundation-h34cG` (unblocked on `5.1.0-26` publish)

**What shipped.** Four primitives:
1. X25519 keypair (`'x25519'` added to `KeyPairAlgorithm`; both providers picked it up table-driven)
2. RFC 8785 `canonicalize()` on the base `Normalizer` (moved from `HashingNormalizer` per code review)
3. Multibase/SPKI helpers in `@fgv/ts-extras/crypto-utils` (`exportPublicKeyAsMultibaseSpki`, `importPublicKeyFromMultibaseSpki`, `multibaseBase64UrlEncode`/`Decode`)
4. `LIBRARY_CAPABILITIES.md` cryptography + canonicalization sections

**Artifacts:** `.ai/tasks/completed/2026-05/auth-primitives-batch1/` ([README](../.ai/tasks/completed/2026-05/auth-primitives-batch1/README.md))
