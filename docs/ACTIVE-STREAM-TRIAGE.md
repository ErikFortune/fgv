# Active-stream triage — nine directories in `.ai/tasks/active/`

**Produced:** 2026-08-14. **This is a report, not an action.** Nothing was moved, renamed,
created or deleted. `docs/WORKSTREAMS.md`, `.ai/instructions/LIBRARY_CAPABILITIES.md` and every
stream artifact are untouched.

**Why a report.** Migrating a shipped stream out of `active/` is `/finalize-task` **`close`**
mode, which moves directories (`active/<id>/` → `completed/<bucket>/<id>/`) and ships that move
in the same PR as the work. Eight of these nine shipped weeks ago, so the "same PR" is long
merged and the honest mode for each is a judgement call the owner makes — `close`-after-the-fact
(move now, backfill `meta.yaml` + README + ledger entry) versus leaving them and running
`retroactive` where they sit. That call is not mine, and getting it wrong scatters artifacts.

## Method — what counted as evidence

Per the task framing, **the presence or absence of `result.md` was treated as suggestive only**.
For each stream I extracted the brief's concrete deliverable, grepped current source for it, then
confirmed the carrying commit is an ancestor of `origin/release` (`git merge-base --is-ancestor`).
Three of these streams shipped and wrote no exit artifact at all; one shipped with **no brief at
all**. Neither absence changed the verdict.

`origin/release` HEAD at time of writing: `b25b5f277`.

---

## Summary table

| stream | classification | strongest evidence | PRs (merged, verified on `release`) | bucket if migrated | recommendation |
|---|---|---|---|---|---|
| `heft-rig-coverage-gate` | **SHIPPED-UNMIGRATED** | `rigs/heft-dual-rig/profiles/default/config/coverageResultsProcessor.js` exists and is wired via `jest.config.json` `testResultsProcessor` | #517, #518 | `2026-07` | migrate — **and file its un-ledgered deferral first** |
| `agent-memory-index-injection-seam` | **SHIPPED-UNMIGRATED** | `fileTreeMemoryStore.ts:373` `readonly index?: IMemoryIndex;` + `_resolveIndex` at :644 | #582 | `2026-07` | migrate; file the deferred redesign |
| `agent-memory-fragment-id` | **SHIPPED-UNMIGRATED** | `vectorIndex.ts:91,214` `fragmentId?`; new `fragmentConverters.ts`; `+fragment_id` column in `sqliteVecFragmentIndex.ts` | #585 | `2026-07` | migrate; correct the `result.md` "not merged" claim in the README |
| `testbed-web-scenarios` | **SHIPPED-UNMIGRATED** | `samples/testbed/src/scenarios/{imageGeneration,streamingChat}/` + `web/SecretsModal.tsx` + `web/ScenarioRunnerPanel.tsx` | #569, #570 | `2026-07` | migrate as one stream (A + B + B.2) |
| `async-result-family` | **SHIPPED-UNMIGRATED** | `libraries/ts-utils/src/packlets/base/mapResultsAsync.ts`; 7 exports in `etc/ts-utils.api.md` | #596 | `2026-08` | migrate; `result.md` absent — README from brief + PR |
| `packaging-prepublish-fixes` | **SHIPPED-UNMIGRATED** | `files` allowlist on the 11 leaking packages; 25/25 `libraries/*/LICENSE` present | #608 | `2026-08` | migrate; **its own finding is now stale and says "not fixed"** |
| `safer-fetch` | **SHIPPED-UNMIGRATED** (design/decomposition parent) | all four sub-streams merged; `libraries/ts-extras/src/packlets/safer-fetch/` (15 files) + `ts-web-extras/.../safer-fetch/` | #592, #594, #597, #599, #601 | `2026-08` | migrate **with `ledgerEntry: fetch-primitive-threat-model`** |
| `esm-emit-design` | **SHIPPED-UNMIGRATED**, with a caveat | `.claude/project/esm-emit-design.md` is on `release` (49 KB, carries its own status line) | reached `release` in #607 | `2026-08` | migrate **only alongside `esm-emit-impl`** — see § below |
| `agent-memory-mcp-server` | **PROPOSED** | brief line 3: *"Do not start until `task-corpus-index` has shipped and been shown insufficient"* | none | — | leave in place |

**Nothing here is IN-FLIGHT, ABANDONED, or UNCLEAR.** Eight shipped; one is a gated proposal.
That is the actionable headline: `active/` is currently 8/9 wrong about these nine, and every
one of those eight is a stream a future agent could read as live work.

---

## Per-stream detail

### `heft-rig-coverage-gate` — SHIPPED-UNMIGRATED

**Strongest evidence.** `rigs/heft-dual-rig/profiles/default/config/coverageResultsProcessor.js`
exists in the working tree and on `release`, referenced from
`rigs/heft-dual-rig/profiles/default/config/jest.config.json:10`. Carried by `e0300c1c4`
(*"fix(heft-dual-rig): enforce jest coverage-threshold misses as build failures (#517)"*,
2026-07-06), verified an ancestor of `origin/release`.

**What the brief asked for.** A coverage-threshold miss must make `rushx test` exit non-zero. It
exited 0 while printing the Jest warning, so *"the repo's '100% coverage to merge' rule is
currently unenforced by CI."*

**Does it exist in source?** Yes. `coverageResultsProcessor.js` implements exactly the fix
`findings.md` describes: when Jest reports `success === false` with
`numFailedTests === 0 && numFailedTestSuites === 0`, it bumps `numFailedTestSuites` so
`@rushstack/heft-jest-plugin`'s existing check fires.

**PRs.** **#517** (the rig fix). Also **#518** — `8e84cf0e6`, *"ci: run rush test so the coverage
gate is enforced in CI"*, 2026-07-07, which added `.github/workflows/ci.yml:35`. `findings.md`
calls that CI wiring *"a separate phase-2 follow-up"* and says `ci.yml` was intentionally not
touched — so #518 is the follow-up landing, one day later. Both belong on this stream's record.

**Bucket.** `2026-07`, from #518's merge date (2026-07-07), the later of the two.

**Deferred and now in no durable ledger — the highest-value finding in this report.**
`findings.md` closes with *"the web-rig packages and tools remain out of scope"*. Concretely,
`libraries/ts-res-ui-components/config/jest.config.json` declares
`coverageThreshold.global` of **`{branches: 0, functions: 0, lines: 0, statements: 0}`**. It
extends `@rushstack/heft-web-rig`, not `@fgv/heft-dual-rig`, so the fix does not reach it and its
threshold is a no-op even if it did. I grepped `docs/TECH_DEBT.md`, `docs/FUTURE.md` and
`docs/CHORES.md` for this and found **nothing**. The repo's headline "100% coverage" rule is
still unenforced for the web-rig packages, and the only record of that is a `findings.md` inside
a directory this report exists to empty. **File this before migrating** — migration is exactly
the event that buries it.

**Recommendation.** Migrate to `completed/2026-07/heft-rig-coverage-gate/`. `findings.md` is the
exit artifact (there is no `result.md`); it is substantive enough to found a README on. File the
web-rig gap in `docs/TECH_DEBT.md` in the same change.

---

### `agent-memory-index-injection-seam` — SHIPPED-UNMIGRATED

**Strongest evidence.** `libraries/ts-agent-memory/src/packlets/store/fileTreeMemoryStore.ts:373`
declares `readonly index?: IMemoryIndex;` and `create()` routes through
`FileTreeMemoryStore._resolveIndex(params.index)` at :614/:644 — precisely the shape `result.md`
claims. `etc/ts-agent-memory.api.md:264` carries the same line, so it is public surface.

**What the brief asked for.** One thing: *"Expose the index as an optional injection point on the
public `create()` params, defaulting to the current concrete implementation. That is the whole
deliverable."* Plus TSDoc stating the explicit non-guarantee (instrumentation seam, **not** a
resident-memory fix), and a test that an injected index receives `rebuild`/`patch`.

**Does it exist in source?** Yes, all three parts. The test file is
`libraries/ts-agent-memory/src/test/unit/store/indexInjection.test.ts`. The non-guarantee is also
already documented in `LIBRARY_CAPABILITIES.md` (*"This is an instrumentation seam, not a
resident-memory fix"*), so the docs-ship-with-the-code obligation was met.

**PRs.** **#582** — `6593668ad`, *"feat(ts-agent-memory): inject the derived record index into
FileTreeMemoryStore.create()"*, 2026-07-31, ancestor of `origin/release`.

**Bucket.** `2026-07`.

**Deferred and now in no durable ledger.** The brief and the shipped TSDoc both point at a
**breaking, design-first partial-read redesign of `IMemoryIndex`** as the thing that would
actually lower the resident-memory ceiling. `grep -niE "partial-read|resident memory|IMemoryIndex"`
over `docs/FUTURE.md` and `docs/TECH_DEBT.md` returns **nothing**. The idea survives only in
TSDoc prose and one `LIBRARY_CAPABILITIES.md` sentence. It is the natural sequel to this stream
and has no ledger home.

**One thing a README should carry forward.** `result.md` is explicit that the review pass was a
**self-review, not an independent `code-reviewer` pass** (no agent-spawn tool in that session),
and asks the orchestrator to commission one. Whether that ever happened is not determinable from
inside this repo; the request should not be lost in migration.

---

### `agent-memory-fragment-id` — SHIPPED-UNMIGRATED

**Strongest evidence.** `libraries/ts-agent-memory/src/packlets/vector/vectorIndex.ts` carries
`readonly fragmentId?: string;` at both :91 (`IVectorQueryHit`) and :214 (`IEmbeddedFragment`);
`fragmentConverters.ts` exists in the same packlet; and
`libraries/ts-agent-memory-sqlite-vec/src/packlets/sqlite-vec-index/sqliteVecFragmentIndex.ts:33`
declares `AUXILIARY_COLUMNS = ['start_off', 'end_off', 'fragment_id']`. Carried by `67e128480`
(#585), 2026-07-31, ancestor of `origin/release`.

**What the brief asked for.** `fragmentId?` on both sides, `locator` made optional, the
at-least-one invariant enforced **in a converter not the type**, the `+fragment_id` auxiliary
column with schema-migration detection, and the drop-and-re-index policy written into
`LIBRARY_CAPABILITIES.md` + the package README.

**Does it exist in source?** All of it. The docstring rewrite landed too —
`vectorIndex.ts:53` opens *"record hit carries neither `locator` nor `fragmentId`; a fragment hit
carries at least one of the two"*, matching the exact wording `result.md` quotes. The
drop-and-re-index rule is in `LIBRARY_CAPABILITIES.md` under
`@fgv/ts-agent-memory-sqlite-vec` (*"`vec0` schema changes require a drop-and-re-index"*).

**PRs.** **#585**, merged.

**A wrong claim to correct on migration.** `result.md` line 3 says PR #585 is
*"**(not merged)**"*. It merged. That was true when written and is false now — exactly the class
of stale synthesis the `/finalize-task` correction convention exists for (inline fix + verbatim
appendix quote). Do **not** edit `result.md` itself; it is in-flight evidence.

**Bucket.** `2026-07`.

**Deferrals.** None lost. Fragment-id stability across re-embeds was explicitly assigned to the
consumer and that assignment is documented in `LIBRARY_CAPABILITIES.md`.

---

### `testbed-web-scenarios` — SHIPPED-UNMIGRATED

**Strongest evidence.** `samples/testbed/src/scenarios/imageGeneration/` and `.../streamingChat/`
both exist, alongside `samples/testbed/src/web/SecretsModal.tsx` and
`samples/testbed/src/shell/sessionSecretsStore.ts` (Phase A), and
`samples/testbed/src/web/ScenarioRunnerPanel.tsx` (Phase B). All on `release`.

**What the brief asked for.** Phase A: port the two `ai-image-gen-sample` scenarios into
`samples/testbed` as `IScenario` web implementations, plus a shell-owned session-secrets store and
modal feeding `resolveSecret`. Phase B (`brief-phase-b.md`): a generic web runner for
browser-clean CLI scenarios.

**Does it exist in source?** Yes, and so does the undocumented **Phase B.2** the `state.md` tail
describes — `memoryToolsGate/index.ts:181` carries `webRunnable: true` on `origin/release`, and
`localSummarization/` is the dual-target `index.tsx` + `summarizeAdapter.ts` shape. All three
phases are on `release`.

**PRs.** **#569** (`f9ba07975`, Phase A, 2026-07-26) and **#570** (`9af7826bd`, Phase B, plus the
B.2 work, 2026-07-27). Brief anchors to #568 as its base; #568 is a different stream
(`ai-assist-model-rotation`) and should not be attributed here.

**Bucket.** `2026-07`.

**Notable — a resolved open question worth preserving.** `state.md` records that Erik validated
parity and **retired `samples/ai-image-gen-sample`** on 2026-07-27 (project removed from
`rush.json`). The brief's decision 4 said explicitly *"Do NOT retire … in this phase"*, so this is
a genuine `diverged` for the record, and it moots the stream's other flagged follow-up (the
sample's own type drift against the current `IAiImageGenerationOptions` shape).

**Recommendation.** Migrate as **one** stream covering A + B + B.2 — three phases, two PRs, one
directory. There is no `result.md`; `state.md` is unusually complete and can found the README,
but it is a live scratchpad by convention and its claims should be checked, not copied.

---

### `async-result-family` — SHIPPED-UNMIGRATED

**Strongest evidence.** `libraries/ts-utils/src/packlets/base/mapResultsAsync.ts` exists, and
`libraries/ts-utils/etc/ts-utils.api.md` exports the full family — `mapResultsAsync` (:2035,
both overloads), `allSucceedAsync` (:114/:117), `firstSuccessAsync` (:1107),
`populateObjectAsync` (:2383), and `DEFAULT_RESULT_CONCURRENCY` (:888). Carried by `1220dae50`
(*"feat(ts-utils): the async Result family (#596)"*, 2026-08-02), ancestor of `origin/release`.

**What the brief asked for.** Five bounded-parallel collectors each with a thunk form and an
`(items, fn)` overload, two transitively-async serial members taking no `IAsyncResultOptions`,
one scheduler, `AsyncDeferredResult<T>` / `AsyncFieldInitializers<T>` / `IAsyncResultOptions`, and
a finite exported default-concurrency constant. Everything `@public`, not `@beta`.

**Does it exist in source?** Yes — and the api.md signatures confirm the two shape decisions the
brief called load-bearing: `firstSuccessAsync` and `populateObjectAsync` take an
`IMessageAggregator` and **no** `IAsyncResultOptions`, exactly as specified. The surface is also
already documented at length in `LIBRARY_CAPABILITIES.md`.

**PRs.** **#596**. The `#588` / `#594` / `#595` numbers in the brief are references, not this
stream's PRs — #595 is the design doc (`.claude/project/async-result-family-design.md`), #588 is
the `DetailedResult` `@public` promotion, #594 is safer-fetch S1 cited as a cautionary example.
Do not put them in `prs:`.

**Bucket.** `2026-08`.

**No `result.md`.** The directory holds only `brief.md`. That is not evidence of anything — the
work is unambiguously in `ts-utils`. Any README will have to be synthesized from the brief, the
design doc, and the commit series (`a22482206` → `c9dfe3df3` → `98c28fc92` → #596).

**Deferrals, all recorded.** Cancellation / `AbortSignal` (OQ-4, deferred as safely
retrofittable) and *"migrating the in-repo hand-rolled call sites (`HybridRetriever`, the
prompt-assist observer fan-out, the bcp47 registry loader)"* are both named in the brief as
out-of-scope. The `AbortSignal` deferral is echoed in `LIBRARY_CAPABILITIES.md`. **The call-site
migration follow-up is not** — worth a `docs/FUTURE.md` line if it is still wanted.

---

### `packaging-prepublish-fixes` — SHIPPED-UNMIGRATED

**Strongest evidence.** `af2178cde` — *"fix(packaging): files allowlist, audited node-only
declarations, and MIT licence text (#608)"*, 2026-08-09, ancestor of `origin/release`. Its commit
body maps one-to-one onto this directory's finding, including the allowlist rationale and the
548 → 251 file measurement.

**What the brief asked for.** **There is no brief.** The directory contains exactly one file —
`findings/inbox/2026-08-09-fifteen-packages-declare-mit-with-no-license-file.md` — and I confirmed
via `git ls-tree -r origin/packaging-prepublish-fixes` that no brief ever existed on the stream's
own branch either. This was an unbriefed/incidental stream. That is the whole artifact record.

**Does the work exist in source?** Yes, both halves:
- `files` allowlist present on the 11 previously-leaking packages (e.g.
  `libraries/ts-agent-memory/package.json`:
  `["lib","dist","CHANGELOG.json","README.md","LICENSE","!lib/test","!dist/test","!**/*.test.*"]`).
- **All 25** `libraries/*/LICENSE` files now exist, added in `e4b9676ba`
  (*"chore: add missing LICENSE files and normalize every copyright to 2026"*), which is part of
  #608's series.

**PRs.** **#608**.

**Bucket.** `2026-08`.

**Its own finding is stale in the dangerous direction.** The finding's header reads
**`**Status:** detected, **not fixed**, deliberately`** and its "Suggested resolution" asks
someone to *"pick the intended year per package"*. That was resolved inside the very PR the
finding belongs to — the year question was settled by normalizing everything to 2026. Anyone
reading this inbox today concludes 15 packages still ship no licence text. They do not. **This
is the correction to make before or during migration**, per the appendix convention (the finding
is in-flight evidence, so correct it in a README/appendix rather than rewriting the file).

**A related item that is *not* this stream's.** `files` allowlists exist on 11 of 25 libraries —
by design, since the split was exactly the presence of an `.npmignore` and the other 14 had a
declared position already. That is not an outstanding gap.

---

### `safer-fetch` — SHIPPED-UNMIGRATED (design/decomposition parent)

**Strongest evidence.** `docs/WORKSTREAMS.md` § `fetch-primitive-threat-model` reads
*"✅ **complete — design landed and fully implemented across four streams**"* and names **S1**
(#594), **S2a** (#592), **S2b** (#599) and **S3** (`safer-fetch-s3`). `plan.md` in this directory
is the decomposition that defines exactly those four streams (its dependency diagram is S1 ‖ S2a
→ S2b → S3), and the four sibling `brief-s*.md` files are their briefs. So the hypothesis in the
task framing is confirmed: **this directory is the design parent's substrate.**

Independently in source: `libraries/ts-extras/src/packlets/safer-fetch/` holds 15 files
(`addressClassification.ts`, `nodeAddressGuard.ts`, `redirect.ts`, `retry.ts`, `transport.ts`,
`index.browser.ts`, …) and `libraries/ts-web-extras/src/packlets/safer-fetch/` holds the browser
packlet. `7636f5f09` (#597, S1+S2a integration) and `b85b094b7` (#601, S3) are both ancestors of
`origin/release`.

**PRs.** #592, #594 (integrated via **#597**), **#599**, **#601**. The design itself was **#587**.
Note the `#582` appearing in this directory is **not** safer-fetch's — it is the
`agent-memory-index-injection-seam` PR and its presence here is incidental.

**Bucket.** `2026-08` — from S3 (#601, 2026-08-05), and consistent with
`.ai/tasks/completed/2026-08/safer-fetch-s3/` already sitting there.

**No `result.md`, and correctly so.** A design/decomposition parent's outcome *is* its
children's. S3's exit artifact is already archived at
`completed/2026-08/safer-fetch-s3/{README.md, brief.md, state.md, result.md}`. S1 / S2a / S2b
appear to have **no archived directories of their own** — their briefs live only here. That makes
this directory the sole surviving artifact record for three of the four sub-streams, which is an
argument for migrating it intact rather than dissolving it.

**Naming mismatch — must be recorded.** The ledger narrates this work under
**`fetch-primitive-threat-model`**, not `safer-fetch`. Per the skill, a migrated `meta.yaml`
needs `ledgerEntry: fetch-primitive-threat-model`, or every future reconciliation reports it as
un-narrated and someone re-derives this section. (`safer-fetch-s3` has the identical mismatch and
is already listed as a known instance in the skill's own text.)

**Recommendation.** Migrate to `completed/2026-08/safer-fetch/` as the design parent, with
`relatedStreams` pointing at `safer-fetch-s3` and `ts-utils-async-detailed-result` (the latter was
*surfaced by* S3 — see its ledger entry).

---

### `esm-emit-design` — SHIPPED-UNMIGRATED, but do not migrate alone

**Strongest evidence.** The deliverable `.claude/project/esm-emit-design.md` exists on
`origin/release` (49 KB). The brief is unambiguous that this is the deliverable and that the
stream is **design only, no implementation code** — and `result.md` confirms the diff contained
no source, config, rig or `package.json` changes. Both conditions hold.

**What the brief asked for.** Decide how `@fgv` should emit ESM so a Node ESM consumer can
`import` any published package natively, without losing tree-shakeable ESM for browsers. Design
only; implementation commissioned separately.

**Does it exist?** Yes, with the recommendation `result.md` describes: keep Node on CJS, add
`emitModulePackageJson: true`, route browser bundlers at the existing ESM emit behind a new
bundler-resolution gate, and defer native Node ESM (Option B, ~3,520 specifier rewrites) until a
consumer asks.

**PRs.** The original design commit `e16b7c6cf` is **not** an ancestor of `origin/release`; the
doc reached `release` folded into **#607** (`71787e798`, *"fix(packaging): Node ESM entry points,
browser/tarball gates, and the ts-bcp47 browser fix"*, 2026-08-09) and was amended again in
**#609**. I could not identify a standalone merged PR for the design branch itself — if the owner
wants a `prs:` list here, that number needs confirming from GitHub rather than from git.

**Bucket.** `2026-08` (findings dated 2026-08-08; doc on `release` 2026-08-09).

**The caveat, and why this one is not a clean migrate.** The design's own status line now reads
**"partially implemented, and the core recommendation is BLOCKED"** — its implementing stream
`esm-emit-impl` found that R2 and R3 break the repo's own webpack build and reverted both. That
implementing stream is **also still in `active/`** (it is not one of the nine, but
`docs/WORKSTREAMS.md` lists it under *Completed workstreams* with a ⚠️ marker and points at
`.ai/tasks/active/esm-emit-impl/…`). Migrating the design without the impl splits a
design→implement pair across two locations and leaves a live ledger entry pointing at an
`active/` path that no longer exists. **Triage `esm-emit-impl` and move the pair together, or
leave both.**

**Findings — substance carried forward, files not dispositioned.** Two sit in
`findings/inbox/`:
- *17 dual-rig packages publish a `dist` JS emit that nothing references* — **carried forward**,
  now `docs/FUTURE.md` § "R4 — stop emitting `dist` JS for packages nothing routes at it", with
  the post-`esm-emit-impl` update and the two measured never-worth-routing packages named.
- *`@fgv/ts-bcp47`'s browser entry transitively imports node `path` and `fs`* — **fixed**, by
  `esm-emit-impl` and shipped in #607.

Both are effectively closed but neither inbox file says so. Low stakes, but the same stale-status
hazard as the packaging finding.

---

### `agent-memory-mcp-server` — PROPOSED

**Strongest evidence.** `brief.md` line 3: **"Status: PROPOSED — conditional. Do not start until
`task-corpus-index` has shipped and been shown insufficient."** Drafted 2026-08-14 — *today*. It
is PROPOSED by construction, as the task framing states.

Corroborated by `docs/WORKSTREAMS.md` line 201, which narrates it as half of a conditional pair:
*"🔵 both **proposed, neither started**. … Ordering is a hard dependency and the second is
conditional on the first's outcome."*

**Gate status — worth a note, since it moves.** The gating stream `task-corpus-index` is
*partially* delivered: its write side, the `/finalize-task` skill, exists at
`.claude/skills/finalize-task/SKILL.md` (commits `682cc2f48`, `ce4f99b17`) and this very triage
is downstream of it. Its read side (`/task-corpus`) and the index itself do not exist. So the
gate is **not yet open**: the brief requires not merely that `task-corpus-index` shipped, but
that it was *"shown insufficient"* — *"a recorded instance of a real question whose answer sat in
the corpus and the index did not surface it."* No such instance is recorded anywhere I can find.

**Recommendation.** **Leave in place.** This is the one directory of the nine that is correctly
where it is. `active/` is the right home for a briefed-but-unstarted conditional proposal.

---

## Recommended actions, in order

1. **File the two un-ledgered deferrals — before any migration.** Migration is the event that
   buries them.
   - `docs/TECH_DEBT.md`: **the web-rig packages have no coverage gate.**
     `libraries/ts-res-ui-components/config/jest.config.json` declares thresholds of `0` on all
     four metrics and extends `@rushstack/heft-web-rig`, so #517's rig fix does not reach it. The
     repo's "100% coverage to merge" rule is enforced for the 21 dual-rig libraries and **not**
     for the web-rig ones. Currently recorded only inside
     `.ai/tasks/active/heft-rig-coverage-gate/findings.md`.
   - `docs/FUTURE.md`: **the `IMemoryIndex` partial-read redesign** — breaking, design-first, and
     the only thing that actually lowers `FileTreeMemoryStore`'s resident-memory ceiling. Named
     in `agent-memory-index-injection-seam`'s brief and in shipped TSDoc; absent from both
     ledgers. (Optionally also: `async-result-family`'s deferred migration of the three
     hand-rolled in-repo call sites.)

2. **Migrate the six unambiguous SHIPPED-UNMIGRATED streams**, each via `/finalize-task <id>` in
   `close`-after-the-fact mode (`meta.yaml` + polished README + drafted ledger entry, drafts
   presented not committed):
   - → `completed/2026-07/`: `heft-rig-coverage-gate` (#517, #518),
     `agent-memory-index-injection-seam` (#582), `agent-memory-fragment-id` (#585),
     `testbed-web-scenarios` (#569, #570)
   - → `completed/2026-08/`: `async-result-family` (#596), `packaging-prepublish-fixes` (#608)

   Three corrections belong in READMEs/appendices, not in the in-flight artifacts:
   `agent-memory-fragment-id`'s *"PR #585 … (not merged)"* (it merged);
   `packaging-prepublish-fixes`'s finding header *"not fixed, deliberately"* (it was fixed in the
   same PR — all 25 LICENSE files now exist); and `agent-memory-index-injection-seam`'s
   still-outstanding request for an independent `code-reviewer` pass.

3. **Handle the two that need a decision, not a script.**
   - `safer-fetch` → `completed/2026-08/safer-fetch/`, but **only with
     `ledgerEntry: fetch-primitive-threat-model`** in its `meta.yaml`, and migrated *intact* — it
     is the sole surviving artifact record for sub-streams S1 / S2a / S2b, which have no archived
     directories of their own.
   - `esm-emit-design` → **do not migrate alone.** Triage its implementing sibling
     `esm-emit-impl` (still in `active/`, narrated in the ledger's *Completed* section with a ⚠️)
     and move the design→implement pair together, updating the ledger's `active/` path references
     in the same change. Leaving both is also defensible; splitting them is not.

`agent-memory-mcp-server` stays exactly where it is.
