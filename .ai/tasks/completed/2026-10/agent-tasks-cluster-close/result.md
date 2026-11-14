**Shipped:** the agent-tasks cluster is closed — all eighteen slices finalized into `.ai/tasks/completed/2026-10/` with a checked `meta.yaml` and `README.md` each, their ledger entries archived with an errata list, three capability lines in the feed instead of eighteen, and the plan's § 8 release evidence written from the slices' own results.

# Result — `agent-tasks-cluster-close`

One PR into `integration/agent-tasks-v1` (not `release`). No file under any `src/` changed.

## The eighteen, finalized

All into `.ai/tasks/completed/2026-10/`, beside `personality-intake` (untouched). Every PR verified
merged into `integration/agent-tasks-v1` on GitHub; no closed-unmerged PR exists against that base, so
no stream needed a `prHistory`.

| stream | `prs` | merged (UTC) | feed |
|---|---|---|---|
| `agent-tasks-t1` | [684] | 2026-09-22 | **headline** — the library |
| `agent-tasks-t2` | [685] | 2026-09-22 | opt-out (→ t1) |
| `agent-tasks-t3` | [686] | 2026-09-23 | opt-out (→ t1) |
| `agent-tasks-t4` | [687] | 2026-09-23 | opt-out (→ t1) |
| `agent-tasks-t5` | [691] | 2026-09-24 | opt-out (→ t1) |
| `agent-tasks-t6` | [693] | 2026-09-25 | opt-out (→ t1) |
| `agent-tasks-t7` | [695] | 2026-09-26 | opt-out (→ t1) |
| `agent-tasks-t8` | [698] | 2026-09-26 | opt-out (→ t1) |
| `agent-tasks-t8b` | [699] | 2026-09-27 | opt-out (→ t1) |
| `agent-tasks-t9` | [701] | 2026-09-28 | opt-out (→ t1) |
| `agent-tasks-i1a` | [702] | 2026-09-29 | **headline** — model tools |
| `agent-tasks-i1b` | [703] | 2026-09-29 | opt-out (→ i1a) |
| `agent-tasks-i1c` | [704] | 2026-09-30 | opt-out (→ i1a) |
| `agent-tasks-tracked-commands` | [705] | 2026-10-01 | opt-out (→ i1a) |
| `agent-tasks-i1d` | [706] | 2026-10-01 | opt-out (→ i1a) |
| `agent-tasks-i2` | [707] | 2026-10-01 | **headline** — checked prompt composition |
| `agent-tasks-m1-stop` | [708] | 2026-10-01 | opt-out (measurement, not a capability) |
| `agent-tasks-p1` | [709] | 2026-10-01 | opt-out (proving ground, not a capability) |

`t8` and `t8b` each carry only their own PR and point at each other through `relatedStreams`.

**Nothing lost in the move.** The eighteen active directories held 63 files at the integration
base. On the final tree, **61 are byte-identical** (`git diff -M100%`: 61 `R100`) and **two are
deliberately edited**, plus 18 `meta.yaml` and 18 `README.md`. The two edits:
`agent-tasks-p1/p1Matrix.js` resolves the testbed's `node_modules` relative to its own directory,
which is one level deeper after the move, so `'../../../../'` became `'../../../../../'`, and its
usage comment names the new path; `agent-tasks-i2/i2Matrix.js` changes only its usage comment, to the
new path. Without the first the P1 matrix — cited by the release evidence — would no longer run.

**`.ai/tasks/active/` afterwards** holds no agent-tasks slice. Left untouched, as the brief requires:
`agent-memory-mcp-server`, `library-capabilities-split`, `mistakes-log`, `task-corpus-index` — every
non-listed entry, each still byte-identical to the base. `orchestrator-handoff` had not landed on the
integration branch by the time this PR opened (head `0f17dd36`, which is #711). This stream's own
directory moves last, in this PR.

## The feed decision

**Three lines.** The rule is the user's: one line per externally interesting capability; nobody
cares how the work was broken up. Reading all eighteen results, the cluster added three things a
consumer can do that they could not before:

1. **Record and mediate agent work without running it** — the library itself. T1–T9 are slices of
   this: typed envelopes and registry (T1), rendering (T2), durable storage (T3), queries (T4), the
   principal-bound broker (T5), external sources (T6), subscriptions and receipts (T7), retention
   (T8/T8b), cascade stop (T9). Headline on **T1**, because `prs[0]` = #684 creates the package and
   is where a reader should start. Cascade stop was the closest call for a separate line; it is a
   broker operation over the same records, and the router's decision shortcuts already route
   "pause or cancel a subtree" to it, so it stays inside the library line.
2. **Give a model bounded, authorized tools over those tasks** — I1a–I1d plus tracked-commands.
   Headline on **I1a** (#702 creates the factory and the read-only surface every later slice
   extends).
3. **Put task context in a cacheable prompt and acknowledge only what was sent** — I2 alone.

M1 is measurement and P1 is a proving ground; neither is a published capability. Both opt out.

**The script did not support this, and is fixed in this PR.** An absent `headline` falls back to
`sourceLine`, so the fifteen siblings — each carrying a verbatim `sourceLine`, as the finalize skill
requires — would all have landed in the feed. The only way out was to blank `sourceLine`, destroying
its audit-trail value; `personality-intake` (#711) did exactly that, and its `''` was in fact only
skipped by accident: the trailing `# comment` defeated the quoted-string regex, so the field read as
absent, not as empty. The brief's one data point was therefore not evidence that the path worked.
`generate-capability-feed.mjs` now treats an explicitly empty `headline` (`''`, `""` or bare,
optionally commented) as "not in the feed", honours the older spelling — an empty `sourceLine`
carrying a comment that gives the reason — as the same opt-out (so `personality-intake` is untouched
and still out), and tolerates a trailing comment on quoted `headline` / `sourceLine`. Existing output
is unchanged (`--check` 0 stale before the metadata landed), and the set of unusable streams is
exactly the ten it was before this PR. On the final tree: `50 usable, 10 unusable, 17 opted out`
(the fifteen siblings, this stream, `personality-intake`). The comment-tolerance half was a Copilot
round-1 catch: without the second rule it turned `personality-intake` into a false "unusable".

**Recorded durably** in the script's header (*One line per capability, not one per stream*) and in
`/finalize-task`'s `headline` guidance.

**Size:** `.ai/instructions/LIBRARY_CAPABILITIES.md` is **22,071 / 24,000 characters** after the feed
(22,038 before); `verify-capability-docs` passes (102 shortcuts, longest 225/240, 75 reflexes).
`libraries/ts-agent-tasks/CAPABILITIES.md` gains the three entries.

## Summaries corrected against `result.md` — the antagonist pass

Six drafting agents wrote the 36 files; three independent `code-reviewer` agents then asked one
question of each stream — *does any summary claim something its `result.md` does not support?* — and
fixed what they found. I verified two counts they passed over. **Corrections, by stream:**

- **`m1-stop`** — the most consequential. The draft repeated `result.md`'s "binds at 519–533 live
  tasks in every live mix" and "97–99% reservation". 519 is fanout's *admitted* count and 533 plain's
  *refused-at* ordinal; consistently, **519–532 admitted, refused at the 520th–533rd**, and only for
  plain/owed/fanout (unresolved refuses at the 364th, inventory at the 443rd live, with 93.7 MB written
  against 442.6 MB reserved). Fixed in `meta.yaml`/`README.md`; the verbatim `sourceLine` keeps
  `result.md`'s looseness and carries a comment saying so. The brief's "520–533" is the refused-at
  range; the plan's and ledger's "519–533" is the mixed one. The plan's § M1 paragraph is corrected.
- **`t5`** — "eight protections reverted **on the final source**": that check predates the seven
  Copilot rounds, each of which recorded its own reverts.
- **`t6`** — `result.md` says 38 protections reverted; it names 36 (18 listed + M21–M38). The first
  antagonist checked "38 (18 + 20)" and passed it; the drafter's count was right. `meta.yaml` now
  states the claim and the mismatch.
- **`t1`** — "15 closed sets, 101 members" is `result.md`'s line; its own table has 18 rows summing
  to 100. Stated beside the quote.
- **`i1d`** — "27 rows, 56 red tests": the per-row verdicts sum to 59. No total is now asserted.
- **`i2`** — a hash in the receipt was not "verified unbuildable"; its carrier was outside the
  slice's surface. Round 1's high was serialization, not terminal refusal.
- **`p1`** — `relatedStreams` claimed step 7 "drives I1d's rule that a model may request and read a
  stop"; the journey calls the writer directly, no stop tools. Step 3 likewise overclaimed for I1c.
- **`tracked-commands`** — "each command moves the task and `task_inspect` reports it": only `start`
  goes through a model turn; the `set-*` rows show committed envelope fields.
- **`i1a`** — three revert rows were wrong on a first run, not two; "five rounds against a shorter
  expectation" misread the brief (five *is* shorter than T9's ten).
- **`t8`** — attributed T8's own conclusion about candidate (a) to the brief; and `result.md`'s
  "no *unexpired* unacknowledged receipt" overstates — `retention.ts` pins on any unacknowledged
  manifest. Not repeated as fact.
- **`i1c`**, **`t4`**, **`t6`**, **`t9`**, **`i1b`** — smaller: a finding credited to Copilot that the
  stream made; three record reads outside a bound, not two; W4 found by a post-layer-1 self-audit;
  file counts that included files outside the package; "no `.ai/instructions/` file changed" when
  `LIBRARY_CAPABILITIES.md` had.

**Checked and unchanged:** every `sourceLine` verbatim in its `result.md`; every `prs`/`opened`/
`closed` against GitHub; every `sourceHash` recomputed; `diverged` non-empty and substantive in all
eighteen; the two known traps (t8b's "routed in this PR", t8's "unexpired") not repeated as fact.

## The ledger

The eighteen entries moved verbatim from `docs/WORKSTREAMS.md`'s *Active workstreams* to
`docs/workstreams/2026-10.md` below `personality-intake` (paths rewritten to `completed/2026-10/`),
and the index line now names twenty (the eighteen, `personality-intake` and this stream). The in-flight section holds no agent-tasks stream.

Archived verbatim, the entries carried claims their slices' results contradict, so the archive
opens the block with **Corrections at archive time**: wrong ship dates in six entries (t5, t7, t8,
t8b, t9, i1a — five PRs, each entry written before its PR merged), m1-stop's mixed range and its "decision stays open" (overtaken the
same day), i2's "unbuildable", t8b's "six profile changes" listing three, t8's "M1 on the final
source", t7's "adds 64 KiB" (at most), t6's § 5 location, t5's unrecorded rebuild figure, and t1's
gate count and two items since resolved.

## Docs that ship with the code

- **`implementation-plan.md`.** The status header still said every slice after T3 "remains
  unimplemented and awaits explicit authorization"; it now says all are implemented and finalized.
  § M1's outcome said "the profile decision stays open"; it now records the user's 2026-10-01
  decision. **§ 8 *Evidence at the cluster close*** is new — see below.
- **`docs/TECH_DEBT.md`.** Dangling `.ai/tasks/active/agent-tasks-*` references repointed (also in
  `development-design.md` and the plan). T7 hand-off (2) struck through — resolved by T8b's 32 MiB
  consumer-record bound. The stale-storage-rows entry's attribution corrected (first recorded by T8b,
  not found by I1b). The I1d-triggered "do not send it again" P3 re-triggered: **I1d neither took nor
  mentioned it, so that trigger passed unacted**. And one new P3 collects every deferral found
  recorded only in a slice's `result.md` (below).
- **`CODING_STANDARDS.md`** said T5's layer 1 found "one P2"; it found two, one about the artifact.
  One-clause fix, since the passage is cited as a calibration figure.
- **`LIBRARY_CAPABILITIES.md`** — only the generated feed changed; no shortcut entry was needed.

### Recorded nowhere durable — now routed

One P3 in `docs/TECH_DEBT.md`: M1's history-growth and cache-saturation cohorts (unbuilt, recorded
only in the plan's heading); M1's allocation-profile arm for peak sizing (T4); a per-source
reconciliation index and a distinct read-concurrency refusal (T4); I2's trusted snapshot pairing
(layer-1 P2-a); I1d's inspect-only stop surface; T2's unmeasured input bounds and `allTaskResults`;
`development-design.md` § 9's tie-break wording; T1/T3's undisposed limit-structure question; T3's two
FileTree upstream gaps; T8's `_taskOf` decoder and its brief's unaddressed "index repair"; the
`rushx coverage` babel-parser failure; and a stale `.ai/tasks/active/` path in a comment in
`src/test/unit/journey/publicJourney.test.ts`, left because this close changes no `src/` file.
Each affected `README.md` notes the routing under its *Followups*.

## The release evidence

`implementation-plan.md` § 8 *Evidence at the cluster close* maps each of the twelve release-blocking
suites to deterministic tests, fault injection / revert matrices, and measurement, each with a
citation into a slice's `result.md`; states M1's qualification gate (the default profile kept by the
user, qualified as a host budget — ~140 MiB, ~300 MiB near the record or consumer ceilings, ≥ 512 MiB
disk — not as a universal RSS number); lists P1's three surface findings; and names the matrix counts
that do not reproduce from their own tables.

**What it does not establish:** durability beyond `'process-crash'` on Linux ext4/tmpfs; peak memory
near the 8 MiB record and 50,000-id ceilings (the cold-history bound fails there; the consumer
worst case is extrapolated); M1's history-growth and cache-saturation cohorts; anything about
provider cache hits or live providers; runtime agreement between a host's command schemas and
converters; and, for seven slices (T5, T9, I1a–I1d, TC), final gates or matrices on the exact merged head (each says which
head and why; CI was green on every head). Five of T6's brief acceptance items have no evidence line
in T6's `result.md`. **Nothing was re-run at the close** except `mutationMatrix.js --check`, which
shows pattern presence only (run by the I1c/I1d/TC drafting agent: all those rows ok; the six storage
rows still UNVERIFIED).

## Revert matrix

**None, and deliberately.** This close adds no protection — no source, no test — so there is nothing
to revert. The gate is not silently unmet: it does not apply.

## Gates

| gate | result |
|---|---|
| `rush change --verify --target-branch origin/integration/agent-tasks-v1` | **fails without a change file** — the regenerated `libraries/ts-agent-tasks/CAPABILITIES.md` makes `@fgv/ts-agent-tasks` a touched project (docs/ and .ai/ alone touch none). One `type: none` change file added; passes |
| `generate-capability-feed --check` | 0 stale (50 usable, 10 unusable, 17 opted out), re-run on the final tree |
| `verify-capability-docs` | pass; router **22,071 / 24,000** chars |
| `verify-esm-entrypoints` / `verify-bundler-resolution` / `verify-tarball-exports` | pass — 24 checked / 20 checked / 26 packages, 205 manifest paths; 0 failed each |
| `rushx build/lint/test` in touched packages | the only touched package file is `CAPABILITIES.md` (generated docs); no source, so none applies — covered by the repo-wide rebuild below |
| no `src/` file changed | `git diff --name-only origin/integration/agent-tasks-v1... | grep '/src/'` → empty |
| migration complete | 61 × `R100` + 2 archived matrix scripts edited for their new path + 18 `meta.yaml` + 18 `README.md`; no agent-tasks slice left in `active/` |

**Gate run** (local, after `rush install`): repo-wide `rush rebuild` — **SUCCESS, 37 operations**,
4 min 17 s, no warnings; then the three export verifiers in CI's order, all 0 failed. Repo-wide
`rush test` was not run: nothing here changes what any function accepts, returns or classifies
(`CODING_STANDARDS.md`'s trigger for it), and no source changed.

## Review

**Layer 1** was run as the brief asked — one question, not a general review: three independent
`code-reviewer` agents, six streams each, asked whether any summary claims something its `result.md`
does not support, defaulting to "wrong" under uncertainty (findings above). **Layer 2:**
Copilot, on #712. **Trigger:** the `request_copilot_review` API call fired
(review within ~5 minutes); no `@copilot review` comment was needed or posted — the same as I2 and P1,
the reverse of I1b. *Round 1* — one medium, three lows, all real and all fixed: the parser change
turned `personality-intake`'s deliberate blank into a false "unusable" (fixed by honouring the older
spelling as an opt-out, not by editing that stream); two stale figures in this file (the index count,
the feed totals); and § 8's evidence taxonomy repeating the "on the final source" claim this close had
just corrected in T5's summary. *Round 2* — two lows plus one
"previously missed" item, all real and fixed: this placeholder itself; the plan's closing
"Approval handoff" still telling readers to await authorization and start F1 (now preceded by a
cluster-close handoff, the original kept and marked superseded); and — the one that mattered — **my
`PRNUM` → `712` substitution had also rewritten a literal `PRNUM` placeholder in T7's archived
`state.md`**, an in-flight artifact the finalize skill says never to edit. Restored from the base;
all 61 archived non-script files are again `R100`. *Round 3* — one low plus five "previously missed", all one defect
class and all fixed: this paragraph deferring the round-3 outcome to the PR thread; and the "63
byte-identical" migration claim, still repeated in `meta.yaml`, this file's move paragraph and gate
table, and the archive's entry, after two archived scripts had been edited for their new path (true
count: 61 `R100` + 2 edited); plus the PR description's opt-out count (16 → 17). **Loop stopped at
three rounds on diminishing returns:** round 1 found a real parser defect, round 2 a real artifact
corruption, round 3 only stale counts — each of which this close had itself introduced.

## Still owed before promotion

- Nothing in this PR's scope. The promotion squash is the orchestrator's.
- Routed, none blocking: the I2/P1 matrix fold-in, `structuredClone`, the query-work counter,
  per-call ai-assist transport, stop residue, the flaky `ts-extras` Argon2id test, and the new P3
  above.

## Notes for the next close

- **The drafting/antagonist split worked, and the antagonist is not infallible.** The first reviewer
  passed T6's "38 (18 + 20)" that the drafter had already flagged as 36. Two passes disagreeing is
  the signal; a count needs someone to actually count.
- **A ledger entry written in flight carries its pre-merge date.** Six of eighteen carried a date
  a day early. The archive's errata list is cheaper than rewriting verbatim entries; writing the entry
  after the merge is cheaper still, but the protocol anticipates the merge deliberately.
- **Copilot trigger:** I2 and P1 both recorded the bare `@copilot review` comment doing nothing and
  the API request working — the reverse of I1b. Neither is reliable; see *Layer 2* above for this PR.
