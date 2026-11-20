# All-up status — fgv

**Last updated:** 2026-07-31 (orchestrator, post-merge). Snapshot of everything in flight:
open PRs, running agent streams, consumer asks, and what is blocking the next publish.

This is the "what is happening right now" doc. `docs/WORKSTREAMS.md` is the per-stream
kickoff ledger; `docs/FUTURE.md` and `docs/TECH_DEBT.md` are the deferred-work backlogs.

---

## Publish state

**Last published alpha: `5.1.0-45`.** No `-46` tags exist — **the next alpha has not been
published.** `release` is at `d792fb82d`, thirteen PRs past `-45`. The publish is the single
highest-value open item.

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
| Capability resolvers guarded against unresolved aliases | #577 | consumer-reported; sibling embedding resolver had the same flaw |
| Provenance merge-contract TSDoc | #578 | answers the round-2 consumer ask on record |
| Typed JSON-parse failure reasons | #579 | + `classifyJsonParseFailure` non-string guard (#583) |
| Derived record index injectable on the store | #582 | instrumentation seam, explicitly not a resident-memory fix |
| Durable fragment identity (`fragmentId` + advisory `locator`) | #585 | round-3 ask 1 |
| FileTree binary (raw bytes) capability | #586 | round-3 ask 2; three packages |

The adaptive-thinking fix is still the one with consumer-visible urgency.

---

## Open PRs

| PR | Title | Base | State |
|---|---|---|---|
| [#584](https://github.com/ErikFortune/fgv/pull/584) | `docs`: refresh all-up STATUS tracker | `release` | 🔵 this doc |
| [#581](https://github.com/ErikFortune/fgv/pull/581) | `docs`: personaility reply drafts | `release` | ⏸️ **HOLD — deliberately open** while the exchange is live |
| [#256](https://github.com/ErikFortune/fgv/pull/256) | Prerelease branch changes | `release` | ⏸️ standing (publish plumbing) |
| [#154](https://github.com/ErikFortune/fgv/pull/154) | Release branch | `main` | ⏸️ standing (promotion) |
| [#572](https://github.com/ErikFortune/fgv/pull/572) | Bump `@microsoft/rush` 5.177.2 → 5.178.0 | `main` | 🟡 superseded on `release` by #575 |
| [#567](https://github.com/ErikFortune/fgv/pull/567) | Bump `fast-xml-parser` 5.10.0 → 5.10.1 | `main` | 🟡 superseded on `release` by #575 |

**Merged 2026-07-31:** #570, #573, #574, #575 (pre-publish stack), #576, #577, #578, #579,
#580, #582, #583, #585, #586.

**Why #581 is open on purpose.** It carries the drafted replies to PersonAIlity, and the
conversation is still live — round-3 answers landed 2026-07-31, plus a correction we owe them
(below). Merging it would freeze a draft mid-exchange. It closes when the exchange settles.
This split came out of #576 accumulating six commits of mixed durable-and-draft content:
durable artifacts went to #580, drafts stayed here.

**Note on #572 / #567:** both target `main` and only touch the repo-root rush bootstrap shim.
`release` got the equivalent (and a repair of a pre-existing invalid lockfile) via #575. They
will likely close as superseded once `release` merges up to `main`; no action before publish.

---

## Agent streams

All branched from `release`, all opened PRs against `release`, none self-merged.

| Stream | Ask | State |
|---|---|---|
| `ai-assist-alias-capability-guard` | round-2 (B) | ✅ merged (#577) |
| `ai-assist-fenced-json-diagnostics` | round-2 | ✅ merged (#579, follow-up #583) |
| `agent-memory-provenance-contract-doc` | round-2 | ✅ merged (#578) |
| `agent-memory-fragment-id` | round-3 #1 | ✅ merged (#585) |
| `agent-memory-index-injection-seam` | round-3 #3 (part 1) | ✅ merged (#582) |
| `filetree-bytes-capability` | round-3 #2 | ✅ merged (#586) |
| `fetch-primitive-threat-model` | round-3 #5 | 🔵 **running** — design doc only, no implementation |

### Review-loop notes worth keeping

**Independent layer-1 passes earn their cost.** Four streams ran without an agent-spawn tool
in their session and self-reviewed instead. Commissioning independent `code-reviewer` passes
retroactively found: a real P2 on #582 (the temporal/cap-cull claims were asserted but never
test-evidenced *with an injected index* — 100% measured coverage on those paths came from
pre-existing tests using the default index, which said nothing about the seam), and clean
approvals on #585 and #586. The #582 finding is the canonical
coverage-measures-the-lines-you-have failure mode from `TESTING_GUIDELINES.md`.

**Copilot's suppressed comments are worth reading.** Three separate suppressed (low-confidence)
comments turned out correct and were fixed: the `ModelSpecKey` thinking-availability pointer
(#577), `_resolveIndex` treating only `undefined` as absent while all eight sibling params use
`??` (#582), and the file-item binary guards' TSDoc claiming a guarantee the guard does not
give (#586, where Copilot and the independent reviewer converged on the same point from
opposite directions).

**Two stall modes observed 2026-07-30/31**, both now covered by standing brief language:

1. *Stalled pre-commit.* Agents completed implementation but stopped before committing. Nothing
   was lost — worktrees retained the diffs and both resumed from transcript.
   **A stream is not "done" when the agent goes quiet — verify by branch push + PR existence.**
   ```sh
   git ls-remote --heads origin <branch>   # did it push?
   git worktree list                        # is there uncommitted work stranded?
   git -C .claude/worktrees/agent-<id> status --short
   ```
2. *Sub-agent deadlock.* An implementing agent spawned a reviewer that had no tool to message
   its parent — it reported to the top-level orchestrator instead, and the parent waited on a
   message that could never arrive. Every brief now carries an explicit **"do not block waiting
   for a spawned sub-agent to report"** note.

**Verify agent-reported CI claims.** One stream reported CI "stalled ~80 minutes, stalled-runner
signature." It had not stalled: checks started two minutes after its final push and completed
normally. "CI is stalled" is the kind of claim that stops a human from looking, so it is worth
one API call to confirm.

**Known sandbox artifact.** `mutableFsTree.test.ts` › "returns permission-denied for read-only
file" fails locally because this container runs as **root** (uid 0), which bypasses the `chmod`
the test relies on. It passes in CI. Not a finding against any branch.

---

## Consumer asks — personaility

### Round 2 (2026-07-28) — closed

Triage: `.ai/notes/cross-repo-handoffs/personaility-asks-2026-07-round2.md`.
Reply: `.ai/notes/cross-repo-handoffs/personaility-reply-2026-07-round2.md`.

| Ask | Verdict | Status |
|---|---|---|
| (A) no `'tools'` in `ModelSpecKey` | Working as designed; doc defect real | ✅ #577 |
| (B) capability resolvers alias-unsafe | **Real, broader than reported** | ✅ #577 |
| Provenance merge contract | **Answered yes, both halves** | ✅ #578 |
| WebAuthn R11 / R12 | **Already shipped** 2026-05-12 (#351) | Nothing to build |
| Fenced-JSON diagnostics | Real, P3 | ✅ #579 + #583 |

### Round 3 (2026-07-31) — four of five shipped

Consolidated reply, their answers, and our correction:
`.ai/notes/cross-repo-handoffs/personaility-reply-2026-07-round3-rollup.md`.

| # | Ask | Decision | Status |
|---|---|---|---|
| 1 | N-Ask5 Q3 — opaque `fragmentId` | Accepted as specified, plus their `locator?` follow-up | ✅ #585 |
| 2 | FileTree bytes path | Accepted — as a **capability interface**, not widened core interfaces | ✅ #586 |
| 3 | Record index seam | Accepted, **split in two** — most of it already existed | ✅ #582 (part 1); part 2 design-gated |
| 4 | Provenance query axis | Accepted, as the sharper version of their option 1 | ⏸️ sequenced with ask 3 part 2 |
| 5 | `Result`-returning fetch primitive | Accepted, **design-first** — the ask as written has an SSRF hole | 🔵 threat model in flight |

**Their four answers, all binding on the streams:**

1. **Self-describing hits** — not needed; "you know which index you queried" is sufficient.
2. **Strict text decoding** — bytes + docstring is enough. No `getRawContentsStrict`, no
   `strictTextDecoding` flag.
3. **DNS rebinding** — a documented limit is accepted, **but the API must keep pinned-IP
   connection additive** (option or swappable resolver), so closing it later is not breaking.
4. **Ask 3 priority** — take the injection point early, framed as an **instrumentation** seam
   rather than an experimentation one. #582's TSDoc says exactly that, in those words.

**Corrections in both directions.**

*They corrected us twice.* "Neither field is a discriminant" was too strong — the *pair*
discriminates, so the accurate claim is that **no single field** does. And `httpTreeAccessors`
does have a real named consumer: a hosted built-in corpus for agent creation.

*We owe them one correction.* Our round-3 reply justified flagging `httpTreeAccessors` by
saying "bytes are *more* natural there (`response.arrayBuffer()`)." **That was wrong.** It
preloads from a JSON REST API whose `contents` field is typed `string`, and the whole
`IFileTreeAccessors` read surface is synchronous, so `arrayBuffer()` can never be reached from
`getFileBytes`. Their use case is still served, but **binary corpus content is not safe through
that adapter today** — the bytes it returns are a UTF-8 encode of an already-decoded string.
Recorded in the rollup; goes back with the next reply.

**Sequencing constraint.** Asks 3 and 4 both rewrite `MemoryIndex`, so they are one sequenced
work item and must not run as parallel streams.

---

## Policy: schema changes to persistent vector indexes require a full re-index

**Decided 2026-07-31 (Erik).** Formalized because the `@fgv/ts-agent-memory-sqlite-vec` indexes
persist across process restarts, so any change to their `vec0` table shape is a migration event
for existing databases.

**The policy.** A change to the `vec0` schema of `SqliteVecVectorIndex` or
`SqliteVecFragmentIndex` — adding, removing, or retyping a column, including auxiliary
columns — **requires consumers to drop the table and re-index**. We do not ship in-place
migrations for these tables.

**Why this is acceptable.** `@fgv/ts-agent-memory` is on the active-development surface
(breaking changes land freely without shims), the sqlite-vec package is new, and the vectors
are always re-derivable from the records — a re-index costs embedding time, never data.

**What the policy obliges us to do**, because "no re-embedding on open" is the package's
headline value and a consumer must not meet the migration as an opaque SQLite error:

1. **Detect the schema mismatch on open** — the index already recovers the established
   dimension by parsing the stored `CREATE VIRTUAL TABLE` SQL; the same parse compares the
   auxiliary-column set.
2. **Fail loudly and actionably** — name expected vs. found columns and say a re-index is
   required, rather than surfacing `no such column: <name>` at statement-prepare time.
3. **Say it in the package README**, so it is a known contract rather than a surprise.

**Status: implemented.** #585 was the first schema change under this policy and carries all
three obligations — `SqliteVecFragmentIndex.create` now rejects a pre-existing wrong-schema
table at create time with a diagnosable message, and the README gained an "Upgrading" section.
The policy was formalized *before* its first exercise rather than after.

---

## What needs Erik

1. **Publish `-46`.** Thirteen PRs past `-45`, and `-45` carries the adaptive-thinking bug.
   Everything else is downstream of this.
2. **Merge #584** (this doc). #581 stays open by design.
3. **Nothing else is blocked on you.** The one running stream produces a design doc for review,
   not code.
