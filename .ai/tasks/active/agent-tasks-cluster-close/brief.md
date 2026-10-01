# Stream brief — `agent-tasks-cluster-close`

**Cluster close for the agent-tasks family: finalize eighteen streams, write the release evidence,
and leave `integration/agent-tasks-v1` ready to promote.** One PR.

Every slice in this cluster deferred `/finalize-task` to cluster close. This is that close. No
implementation work; no change to anything under `libraries/*/src` or `samples/*/src`.

## Branch and PR posture

- **Branch:** `claude/agent-tasks-cluster-close`, cut off `integration/agent-tasks-v1` at `2a95fbb21`
  (the P1 landing — all implementation slices in) and pushed.
- **One PR into `integration/agent-tasks-v1`** — **not `release`.** The orchestrator squashes the
  integration branch onto `release` after this lands; that promotion is not yours.
- **Artifacts for this stream** in `.ai/tasks/active/agent-tasks-cluster-close/`, and this stream
  finalizes itself last, into the same bucket as the others.

---

## Scope: exactly these eighteen

```
agent-tasks-t1  t2  t3  t4  t5  t6  t7  t8  t8b  t9
agent-tasks-i1a i1b i1c i1d
agent-tasks-i2  agent-tasks-tracked-commands  agent-tasks-m1-stop  agent-tasks-p1
```

**Finalize exactly those eighteen and leave every other entry in `.ai/tasks/active/` alone**, whatever
it is and whenever it arrived. Known at the time of writing: `agent-memory-mcp-server`,
`library-capabilities-split`, `mistakes-log`, `task-corpus-index` (the last two are standing artifacts
rather than streams), plus `personality-intake` and `orchestrator-handoff`, both of which are expected
to land on this same integration branch while you work. **More may appear** — the rule is the
eighteen-item list above, not a count of what remains. If you find an entry you cannot classify from
its own `brief.md`, leave it and say so in `result.md`; do not finalize it to tidy the directory.

**Bucket:** `.ai/tasks/completed/2026-10/` (new; the existing buckets run 2026-05 … 2026-09).

## Use `/finalize-task`

Load it and follow its ritual per stream — `meta.yaml` synthesis, migration, the polished `README.md`,
the ledger entry, the `LIBRARY_CAPABILITIES.md` and design-doc prompts, and **its antagonist pass,
which tries to refute its own output before handing over**. Run that pass; eighteen summaries written
quickly is exactly where an inaccurate one hides.

`meta.yaml` shape, from the corpus (all 63 completed streams have one):
`id`, `status`, `packages`, `prs` (order matters — the feed links `prs[0]`), `opened`, `closed`,
`summary` with `intended` / `shipped` / `diverged`, and a feed line (`headline`, falling back to
`sourceLine`). Read `.ai/tasks/completed/2026-09/ai-assist-prompt-caching/meta.yaml` as the model —
including its inline comment explaining why its `prs` are not in chronological order.

## The capability feed — mechanics, and the one editorial question

**An earlier draft of this brief claimed the feed forced a hard decision here. It does not; that was
the orchestrator's error, corrected before you started.** What the script actually does
(`common/scripts/generate-capability-feed.mjs`, read it):

- It writes **full per-package history** into each `libraries/<pkg>/CAPABILITIES.md`, filtered by the
  stream's `packages`. All eighteen entries land in `libraries/ts-agent-tasks/CAPABILITIES.md`
  automatically, which is correct and needs no decision.
- It writes only the **ten most recent across all packages** into
  `.ai/instructions/LIBRARY_CAPABILITIES.md` (`ROUTER_LIMIT = 10`), under a line that already says
  *"Per-package history is in each `CAPABILITIES.md`."* That region is bounded at ten entries
  **however many streams exist**, so the 24,000-character router budget is not affected by the count.

So the only consequence is that the router's ten recent slots are agent-tasks-heavy for a while and
then roll over. That is what a rolling recent-changes feed is for; it is not a problem to solve.

**The rule, from the user (2026-10-01): one line per externally interesting capability. Nobody cares
how we broke up the work.**

So the feed is **not** eighteen lines. It is as many lines as this cluster added capabilities a
consumer would care about, and the rest of the eighteen carry a `meta.yaml` with **no headline**. The
stream count is an implementation detail of how the work was scheduled; it has no place in a file whose
job is telling a consumer what they can now do.

Apply it yourself — you have read all eighteen results and the orchestrator has not — but as a sanity
check on the order of magnitude: T1–T9 are slices of one recording-and-mediation capability; I1a–I1d
and tracked-commands are slices of the model-tool surface; I2 is checked prompt composition; **M1 is
measurement and qualification evidence, not a capability**; **P1 is a proving ground and a sample, not
a published capability**. That suggests a small handful of lines, not eighteen. If your reading of the
results says otherwise, follow the results and say why.

Where one capability spans several streams, the headline goes on the stream that best represents it —
remember the feed links `prs[0]`, so pick the stream whose first PR a reader should land on — and the
siblings get none.

**Verify the script tolerates a `meta.yaml` with no headline** before relying on it: all 63 existing
streams have one, so the absent path may be untested. The script already counts "unusable" sourceLines
separately, which suggests it does, but check rather than assume. If it does not, that is a **script
bug to fix in this PR** — the rule is the user's and the script serves it, not the other way round.

**Record the rule durably, in this PR.** It is a standing principle, not a decision about this cluster,
and the next finalization will otherwise re-derive it from scratch — or default to one line per stream,
which is what eighteen streams almost produced here. Put it where the next person finalizing a stream
will actually meet it: `generate-capability-feed.mjs`'s header already explains `headline` vs
`sourceLine` carefully and is the natural home, and/or the `/finalize-task` skill's guidance on
`meta.yaml`. One or two sentences, in the user's terms: *the feed carries one line per externally
interesting capability; how the work was broken into streams is not interesting to a consumer.*

Gates either way: `generate-capability-feed --check` reports 0 stale, `verify-capability-docs` passes,
and you report the resulting `LIBRARY_CAPABILITIES.md` size.

## The ledger

`docs/WORKSTREAMS.md` carries the in-flight entries plus a `## Shipped streams` index (line ~1278);
`docs/workstreams/<YYYY-MM>.md` holds the archived per-month entries (2026-06 … 2026-09 exist).

- Create `docs/workstreams/2026-10.md` and move the eighteen entries into it.
- Leave the index lines in `docs/WORKSTREAMS.md` under `## Shipped streams`.
- The in-flight section should end up with no agent-tasks stream in it.

## The release evidence

`docs/design/agent-tasks/implementation-plan.md` § 8 has a **Release evidence** section that the
per-stream results feed. Write it from the streams' own `result.md` files — not from memory, and not
by re-asserting claims without a pointer to where each was demonstrated.

It should let a reader answer, with a citation per answer: what is covered by deterministic tests,
what by fault injection, what by measurement, and what is explicitly *not* established. M1's
qualification gate and P1's three surface findings both belong here, as does the capacity decision
(default profile kept; measured ceiling 520–533 live tasks).

## What this close does **not** do

- **No promotion to `release`.** The orchestrator squashes the integration branch afterwards.
- **No source changes.** Nothing under `libraries/*/src` or `samples/*/src`.
- **Do not fold I2's and P1's matrix scripts into `perf/`.** They sit beside their artifacts because
  M1 owned `perf/` while they ran; that contention is over, but the fold-in is routed debt and a
  code change. Leave it routed.
- **Do not drain the other routed debt** (`structuredClone`, the query-work counter, per-call
  ai-assist transport, stop residue, the flaky `ts-extras` Argon2id test). All stay routed; none
  blocks promotion.

## Gates

- [ ] `rush change --verify --target-branch origin/integration/agent-tasks-v1` — **CI's first gate
      keys off files touched, not surface changed.** This PR touches `docs/` and `.ai/`; run the
      verify and do exactly what it says
- [ ] `generate-capability-feed --check` → 0 stale; `verify-capability-docs` passes with
      `LIBRARY_CAPABILITIES.md` **under 24,000 characters** (report the figure)
- [ ] `verify-esm-entrypoints`, `verify-bundler-resolution`, `verify-tarball-exports`
- [ ] `rushx build` / `rushx lint` / `rushx test` in any package you touch — expected: none
- [ ] **No file under any `src/` changed** — verify with `git diff --name-only ...` and say so
- [ ] Every one of the eighteen migrated, with nothing lost: the migrated directory contains every
      file the active one did, plus `meta.yaml` and `README.md`
- [ ] `.ai/tasks/active/` contains **no agent-tasks stream** afterwards (this one included, once it
      finalizes itself), and **every out-of-scope entry is still there, untouched** — list them in
      `result.md`. Do not assert a count; assert that the eighteen are gone and nothing else moved
- [ ] No revert-matrix rows — there is no protection here to revert. **Say so in `result.md`** rather
      than leaving the gate silently unmet

## Review

Layer 1 (`code-reviewer`) is weak on prose accuracy, so lean on `/finalize-task`'s antagonist pass and
ask layer 1 one specific question instead: **does any `meta.yaml` summary claim something its
stream's `result.md` does not support?** Then the Copilot loop, driven by a bare `@copilot review`
**comment** (the API request silently did nothing four times on I1b, and on I2 the comment did nothing
and the API request worked — try both, and record which fired).

## Traps this cluster paid for

1. **A summary is a claim.** The cluster's worst near-miss was an exit artifact asserting a live
   testbed success that the code could not have produced. Eighteen summaries is eighteen chances to
   repeat it: every `shipped:` line must be traceable to something in that stream's `result.md`.
2. **Quote a total someone can count.** I1c said a grep gave five files; it gave six. The
   orchestrator said this cluster was twelve streams, then thirteen; it is **eighteen**.
3. **A review round that posts zero comments is not evidence of a clean diff** — read the
   previously-missed block. I1d's round 3 posted no findings and listed two real missed items.
4. **A PR anticipates its own merge** (`.ai/conventions/workflow/artifact-protocol.md`): write the
   shipped markers in this PR rather than planning to flip them after.
5. **Route anything outliving this close to `docs/TECH_DEBT.md` in this PR.**

## Exit artifact

`result.md`, opening with a one-line `**Shipped:** …`. It must record:

- **The feed decision**, argued, with the measured `LIBRARY_CAPABILITIES.md` size after it.
- The eighteen finalized, with each one's `prs` and the bucket they went to.
- **Any summary you had to correct** against its stream's `result.md` during the antagonist pass —
  this is the most valuable thing this close can surface, and "none" is a legitimate answer stated as
  one.
- Confirmation that no `src/` file changed.
- What the release-evidence section does **not** establish.
- Anything still owed before promotion.

Keep `state.md` current.

## Required reading, in order

1. This brief.
2. The `/finalize-task` skill.
3. `.ai/tasks/completed/2026-09/ai-assist-prompt-caching/` — a finalized stream, as the model.
4. `.ai/conventions/workflow/artifact-protocol.md`.
5. `docs/design/agent-tasks/implementation-plan.md` § 8.
6. `common/scripts/generate-capability-feed.mjs` and `common/scripts/verify-capability-docs.mjs` —
   before deciding what the feed shows.
7. Each of the eighteen `result.md` files, as you finalize that stream.

## Missing-input rule

If a required-reading file does not exist, or does not say what this brief claims, **STOP and surface
the gap.** Do not reconstruct intent and proceed.
