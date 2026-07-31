# All-up status — fgv

**Last updated:** 2026-07-31 (orchestrator). Snapshot of everything in flight: open PRs,
running agent streams, consumer asks, and what is blocking the next publish.

This is the "what is happening right now" doc. `docs/WORKSTREAMS.md` is the per-stream
kickoff ledger; `docs/FUTURE.md` and `docs/TECH_DEBT.md` are the deferred-work backlogs.

---

## Publish state

**Last published alpha: `5.1.0-45`.** No `-46` tags exist — **the next alpha has not been
published.** `release` has advanced four PRs past `-45` (#570, #573, #574, #575), so the
publish is pending, not done.

`prerelease` (PR #256, standing) mirrors `release` for the npm-publish workflow.

**What `-46` will carry that `-45` does not:**

| Change | PR | Note |
|---|---|---|
| Anthropic adaptive-thinking fix | #570 | `-45` **carries this bug** — Claude 5 + thinking HTTP 400s |
| `AiAssist.providerApiKeySecretName` | #570 | new canonical provider-secret naming |
| Caller-configurable `maxTokens` | #573 | + truncation-aware `extractJsonText` diagnosis |
| xAI alias registry + `grok-4.5` advanced tier | #574 | live-verified by Erik |
| `ai-image-gen-sample` retired | #574 | testbed is the canonical sample app |
| Root rush shim lockfile repair | #575 | was invalid JSON; `npm ci` at repo root was broken |

The adaptive-thinking fix is the one with consumer-visible urgency.

---

## Open PRs

| PR | Title | Base | State |
|---|---|---|---|
| [#577](https://github.com/ErikFortune/fgv/pull/577) | `fix(ai-assist)`: guard capability resolvers against unresolved model aliases | `release` | 🔵 open — needs review |
| [#576](https://github.com/ErikFortune/fgv/pull/576) | `docs`: triage personaility round-2 asks | `release` | 🔵 open — docs only |
| [#256](https://github.com/ErikFortune/fgv/pull/256) | Prerelease branch changes | `release` | ⏸️ standing (publish plumbing) |
| [#154](https://github.com/ErikFortune/fgv/pull/154) | Release branch | `main` | ⏸️ standing (promotion) |
| [#572](https://github.com/ErikFortune/fgv/pull/572) | Bump `@microsoft/rush` 5.177.2 → 5.178.0 | `main` | 🟡 superseded on `release` by #575 |
| [#567](https://github.com/ErikFortune/fgv/pull/567) | Bump `fast-xml-parser` 5.10.0 → 5.10.1 | `main` | 🟡 superseded on `release` by #575 |

**Recently merged:** #570, #573, #574 (the pre-publish stack), #575 (root shim repair).

**Note on #572 / #567:** both target `main` and only touch the repo-root rush bootstrap shim.
`release` got the equivalent (and a repair of a pre-existing invalid lockfile) via #575. They
will likely close as superseded once `release` merges up to `main`; no action before publish.

---

## Agent streams in flight

Commissioned from the personaility round-2 triage. All branch from `release`, all open PRs
against `release`, none self-merge.

| Stream | State | Notes |
|---|---|---|
| `ai-assist-alias-capability-guard` | ✅ **PR #577 open** | The one real defect from round 2 |
| `ai-assist-fenced-json-diagnostics` | 🔵 **resumed** | Agent stalled pre-commit overnight; work intact in worktree, resumed 2026-07-31 |
| `agent-memory-provenance-contract-doc` | 🔵 **resumed** | Same — stalled pre-commit, work intact, resumed 2026-07-31 |

**Overnight-stall postmortem.** Two of three agents completed their implementation work but
stopped before committing. Nothing was lost — the worktrees retained the full diffs
(`.claude/worktrees/agent-*`), and both were resumed from their transcripts with context
intact. **Lesson: a stream is not "done" when the agent goes quiet — verify by branch push +
PR existence, not by absence of a failure.** The check that surfaced this is cheap and worth
making routine:

```sh
git ls-remote --heads origin <branch>   # did it push?
git worktree list                        # is there uncommitted work stranded?
git -C .claude/worktrees/agent-<id> status --short
```

---

## Consumer asks — personaility

### Round 2 (2026-07-28) — triaged, answered

Full triage: `.ai/notes/cross-repo-handoffs/personaility-asks-2026-07-round2.md`.
Reply draft: `.ai/notes/cross-repo-handoffs/personaility-reply-2026-07-round2.md`.

| Ask | Verdict | Status |
|---|---|---|
| (A) no `'tools'` in `ModelSpecKey` | Working as designed; doc defect real | TSDoc in #577 |
| (B) capability resolvers alias-unsafe | **Real, broader than reported** | PR #577 |
| Provenance merge contract | **Answered yes, both halves** | Doc stream resumed |
| WebAuthn R11 / R12 | **Already shipped** 2026-05-12 (#351) | Nothing to build |
| Fenced-JSON diagnostics | Real, P3 | Stream resumed |

### Round 3 (2026-07-31) — incoming

| Ask | State |
|---|---|
| N-Ask5 Q3 — opaque `fragmentId` alongside the span | 🟡 assessed, not yet commissioned — see below |
| (further asks) | ⏳ awaiting relay from Erik |

**N-Ask5 Q3 assessment.** Accept. Type-level change is genuinely additive — `fragmentId?` on
`IEmbeddedFragment` and `IVectorQueryHit`, and `FragmentEmbedder` is consumer-supplied so the
id needs no new store plumbing. Two findings to carry back: (1) the SQLite schema change is
**not** additive on disk — see the re-index policy below; (2) `IEmbeddedFragment.locator` is
**required** on input while `IVectorQueryHit.locator` is optional on output, so a rewriting
segmenter with no honest span must fabricate offsets — ask them whether `locator` should
become optional on input when `fragmentId` is present.

---

## Policy: schema changes to persistent vector indexes require a full re-index

**Decided 2026-07-31 (Erik).** Formalized here because the `@fgv/ts-agent-memory-sqlite-vec`
indexes persist across process restarts, so any change to their `vec0` table shape is a
migration event for existing databases.

**The policy.** A change to the `vec0` schema of `SqliteVecVectorIndex` or
`SqliteVecFragmentIndex` — adding, removing, or retyping a column, including auxiliary
columns — **requires consumers to drop the table and re-index**. We do not ship in-place
migrations for these tables.

**Why this is acceptable.** `@fgv/ts-agent-memory` is on the active-development surface
(breaking changes land freely without shims), the sqlite-vec package is new, and the vectors
are always re-derivable from the records — a re-index costs embedding time, never data.

**What the policy obliges us to do.** Because "no re-embedding on open" is the package's
headline value, a consumer must not discover the migration as an opaque SQLite error:

1. **Detect the schema mismatch on open** — the index already recovers the established
   dimension by parsing the stored `CREATE VIRTUAL TABLE` SQL; the same parse can compare the
   auxiliary-column set.
2. **Fail loudly and actionably** — name the expected vs. found columns and say a re-index is
   required. Today a widened `INSERT` against a narrower table surfaces as
   `no such column: <name>` at statement-prepare time, which is not diagnosable.
3. **Say it in the package README**, so it is a known contract rather than a surprise.

**Current status:** not an issue in practice today — the fragment index shipped 2026-07-20
and the only consumer is re-ingesting anyway as it moves to model-chosen segmentation. The
policy is being formalized *before* the first schema change (the N-Ask5 Q3 `fragmentId`
column) rather than after.

---

## What needs Erik

1. **Review + merge #577** (capability-resolver guard) and **#576** (docs).
2. **Publish `-46`** — carries the adaptive-thinking fix that `-45` is missing.
3. **Relay the round-2 reply** to personaility.
4. **Round-3 asks** — relay the rest of the batch so they can be scoped together (they may
   share `vectorIndex.ts`, and overlapping streams on one file are the thing the
   package-surface declarations exist to prevent).
