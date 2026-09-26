# Tech Debt — fgv

Already-shipped imperfections. Priority-ranked; addressed
opportunistically when the right surface area is touched.

---

## Disposition pass — 2026-08-14

Every entry was verified against current source. **Four retired, ten kept, four of those
rewritten.** The ledger went from 14 entries to 10.

**Retired** (evidence in git history; nothing carried forward):
`IProvenance.derivedFrom` bare-id ambiguity (all three sub-resolutions shipped — the entry was
pure history and longer than any live item) · `ts-web-extras` lint cleanup (`eslint src` now
exits **0**, not the recorded 126 violations) · `"sideEffects": false` convention (already stated
in `MONOREPO_GUIDE.md`; audit of all 25 libraries found one real miss, filed as a chore rather
than standing debt) · `apiClient.ts` at the `max-lines` cap (#620 split it; the only durable
lesson was already codified verbatim in `CODING_STANDARDS.md`).

### Four triggers have already fired without anyone acting

This is the finding worth acting on, and it is the same failure the recent artifact sweep found
everywhere else: **a trigger phrased as "next time someone touches X" depends on a person
recalling a ledger entry at the moment they are busy with something else.** These four fired and
nobody noticed:

| entry | trigger | what actually happened |
|---|---|---|
| `ts-prompt-assist` TSDoc | "once the v0.1 surface is stable" | v0.1 shipped; two features were built on top of it |
| cross-runtime export parity | "anytime an `index.browser.ts` is touched" | `ts-web-extras` took three export-adding features; **9 of 10 packages still untested** |
| `createMemoryTools` codec duplication | "when the temporal write path lands" | it landed, with tests |
| `AsyncDeferredResult` invoker | "the third consumer" | there are now **four** |

The cross-runtime one is the instructive case: its trigger has fired at least three times, so the
fix is not to restate it but to **replace recall with a mechanical gate** — see that entry.

---

## Priority key

- **P1** — blocking / structural; address before resuming major feature work.
- **P2** — fix before the next major feature in the affected area.
- **P3** — opportunistic cleanup.
- **P4** — doc / minor consistency.

## Entry format

```markdown
- **[Pn] Title.**
  Description with file pointers.

  **Trigger**: when this should be addressed.

  **Scope sketch**: one-paragraph fix shape.

  **Not a P(n+1)**: why this priority and not lower.

  **Reference**: PR / commit / session context that surfaced it.
```

---

## P1 — Blocking

*(none currently outstanding — the `ts-prompt-assist` validator-chain caller-controlled `T` cluster was fully retired by the surface-tidy round, which split `resolveAndValidateOutput<T>` into `resolveJsonOutput<K>` + `resolveFreeTextOutput` and replaced the remaining caller-asserted-`T` boundary with a runtime-evidenced kind check.)*

## P2 — Fix before next major feature in affected area

- **[P2] CI reddens for reasons unrelated to the diff — three known causes, each costing an
  investigation before it is recognised.** Every one was hit during the 2026-09-23/24 publish and
  agent-tasks cluster work, and each cost a log read to distinguish from a real failure. None
  affects published output; all of them waste reviewer and agent time and erode the signal that a
  red check means something.

  **(a) Wall-clock assertions.** `libraries/ts-extras/src/test/unit/md5Normalizer.browser.test.ts:165`
  asserts `expect(endTime - startTime).toBeLessThan(300)`. It failed CI at **335 ms** on #691 — 12%
  over a hardcoded threshold on a shared runner — having passed on the same branch nine hours
  earlier. `TESTING_GUIDELINES.md` already states the rule this breaks: *"A millisecond assertion on
  a CI runner measures the runner."* Siblings, tightest first: the same file's 300 ms;
  `ts-extras/.../saferFetchRetry.test.ts:502` at 500 ms; `ts-res` `deltaGenerator.enumeration` at
  2000 ms and `deltaGenerator.core` at 5000 ms. (`ts-sudoku-lib` has four more, out of scope —
  that package is leaving this repo.) **Remedy:** assert the property the test is really about —
  a counter, a call count, an absence of quadratic blowup — or delete the assertion. Raising the
  threshold buys time and keeps the defect. The existing safer-fetch entry in this file is the same
  family and should be closed with this one.

  **(b) `rush install` does not retry a dependency fetch.** On #687 the job died in 71 seconds:
  `onnxruntime-node`'s postinstall hit `ETIMEDOUT`/`ENETUNREACH` fetching its native binary and Rush
  reported *"Giving up after 1 attempts"*, having built nothing. It reads like a broken lockfile
  rather than a network blip. **Remedy:** a retry around the install step, or a cached/vendored
  binary for that package.

  **(c) An Argon2id test mock derives colliding keys from distinct salts.**
  `libraries/ts-extras/src/test/unit/crypto/keystore/keyStoreArgon2id.test.ts`'s
  `makeDeterministicKey` folds the salt in as `seed += salt[i] * (i + 1)` — a weighted **sum**. Two
  different 16-byte salts sharing that sum derive an identical key, so *"returns false when salt does
  not match"* gets `true`. Roughly **1 run in 7,000** by the spread of that sum. Observed once on
  #687. **Remedy:** make the mock's derivation depend on salt *content* rather than a weighted sum —
  hashing the salt bytes, or folding position-sensitively (e.g. `seed = seed * 31 + salt[i]`).

  **Trigger**: the next time any of these reddens a PR, or the next person who has to explain to a
  reviewer that a red check is not real. **(a) is the one worth doing first** — it is the only one
  that fires on ordinary runner load rather than needing bad luck or a network fault.

  **Not a P3**: the cost is not the individual failure, it is that a red check stops meaning
  anything. Three separate "this one isn't real" investigations in two days is the evidence.

  **Reference**: #691 (a), #687 (b and c).

- **[P2] The default capacity profile advertises 1,000 concurrent non-archived tasks and admits
  146 — the two published limits are mutually unreachable.**
  `defaultTaskCapacityLimits` in
  `libraries/ts-agent-tasks/src/packlets/types/capacityProfile.ts` declares both
  `'non-archived-tasks': 1000` and `'resident-payload-bytes': 64 * MiB`. Every registration's
  closeout reserves `allUpdateCategories.length × encoded.maxUpdateBytes` of
  `resident-payload-bytes` — 7 categories × 64 KiB = 448 KiB — so the payload limit is exhausted
  at ⌊64 MiB / 448 KiB⌋ = **146** registrations. The `agent-tasks-t4` implementer confirmed it
  empirically: the 147th registration is refused. Verified independently at orchestration time
  from the three constants.

  This is not the ordinary "maxima are concurrent constraints, not a promise that every maximum
  can be reached together" caveat the implementation plan states at §328. That caveat covers
  limits that trade against each other under unusual mixes. Here the headline limit is
  unreachable by a factor of ~7 under *ordinary* use — registering tasks and nothing else — so a
  consumer sizing against the advertised number is wrong before they start.

  **Not introduced by T4**, which surfaced it and correctly declined to fix it: the arithmetic
  belongs to T1/T3's reservation model and the profile to T8's qualification.

  **T6 amendment (2026-09-24) — the per-registration figure is unchanged; in-flight commands
  lower the ceiling further.** T6 adds two reservations, neither charged at registration of an
  ordinary task: (1) an `accepted-operation-settlement` claim per **in-flight external command**
  (reserved when the intent is recorded, before dispatch; consumed when the command settles),
  charging `maxUpdateBytes` = **64 KiB** of `resident-payload-bytes` (plus one update, 32 audience
  links/acknowledgement ids, and stored-operation + receipt + update record bytes); (2) an
  `admitted-source-replay` claim on a task registered against a `source-replay` source, charging
  exactly the finite envelope the host declares (`remainingRequiredBytes` resident, ≤ 64 KiB per
  declared update). So the registration baseline stays **448 KiB → 146**. With one in-flight
  command per task it is 448 + 64 = 512 KiB → ⌊64 MiB / 512 KiB⌋ = **128**; each further
  concurrent in-flight command on a task costs another 64 KiB, and a `source-replay` task costs
  its envelope on top. A command held as uncertain (non-idempotent, or its key expired) keeps its
  reservation until something settles it — see the T6 hand-off entry below. Whichever resolution
  T8 picks must size these two claims too.

  **T7 amendment (2026-09-25) — resident per registration unchanged; baselines and evidence add
  terms.** T7 charges each audience link's acknowledgement evidence (1 acknowledgement id + E =
  512 B logical) and spends it from the claims above on protected steps. Closeout now reserves
  224 links × 512 B = 112 KiB more `logical-bytes` (1,168 KiB per registration → 448 on
  `logical-bytes`; 224 acknowledgement ids → 892) — both looser than resident, so the ceiling stays
  **146 / 128**. New: a `current` subscription holds one baseline payload (≤ 64 KiB resident) per
  covered task until acknowledged, so with `k` such subscriptions covering every task the worst case
  is ⌊64 MiB / (448 KiB + 64 KiB·k)⌋ — **128** at k = 1, **113** at k = 1 with one in-flight command.
  Each subscription also holds a 64 KiB receipt-preparation reservation (record + logical) and its
  record reserves E per owed or future link. Full arithmetic: `agent-tasks-t7` `result.md` §
  *Reservation arithmetic*.

  **Trigger**: T8 (profile qualification), or the first consumer sizing a deployment against
  `defaultTaskCapacityLimits`, whichever comes first. **T8 cannot sign off the profile without
  resolving this** — that is the load-bearing reason this is recorded here rather than left in a
  stream artifact.

  **Scope sketch**: three candidate resolutions, and the choice is a design decision, not a
  cleanup. (a) The closeout reserve is worst-case-per-category and may be far larger than any
  real task needs — charge actual rather than maximum, if the reservation model permits it.
  (b) Raise `resident-payload-bytes` to whatever actually admits 1,000 (≈448 MiB), which may be
  an honest number or may reveal that 1,000 was never the right target. (c) Lower
  `'non-archived-tasks'` to the number the profile can actually serve, and say so. Note the
  surface is `@public` and its own docstring already calls the profile *proposed* pending
  "the planned residency and reopen measurements before the profile is advertised" — so
  correcting it now costs nothing downstream.

  **Not a P3**: a published default that overstates capacity by 7× is a sizing error consumers
  inherit silently, and the failure surfaces as refused registrations in production rather than
  at build time.

  **Reference**: [#687](https://github.com/ErikFortune/fgv/pull/687), and the T4 stream's
  `result.md` § the orchestrator decision item — at
  `.ai/tasks/active/agent-tasks-t4/` today, moving to
  `.ai/tasks/completed/<month>/agent-tasks-t4/` when the `agent-tasks-v1` cluster finalizes
  (this family finalizes at cluster close, not per slice). The PR link is the stable anchor.

- **[P2] `ts-agent-tasks` broker hand-offs T5 left for T6/T7/T8 by design — each has a trigger
  that is the next slice's first step.**
  (1) ~~**T7:** audiences come from an internal seam that answers "nobody"; filling it must reserve
  per-audience acknowledgement evidence first.~~ **Resolved by T7** — storage computes and verifies
  every audience and charges its evidence in the accepting commit; the seam is removed. (2) **T8:** `archive`
  refuses a task while any retained update has a non-empty audience (`retention-blocked`); T8
  replaces that with acknowledgement/disposition evidence and pruning. (3) ~~**T6:** an external
  task's commands are `rejected: unsupported` and recorded under their key until dispatch exists.~~
  **Resolved by T6** — external commands dispatch through their source (see the next entry for
  what T6 hands on). (4) **T9:** no stop latch is checked by list completion or relationship operations yet.
  **Trigger:** the start of T6, T7, T8 and T9 respectively. **Reference:** the `agent-tasks-t5`
  stream's `result.md` § *What a later slice must decide* (at `.ai/tasks/active/agent-tasks-t5/`
  until the `agent-tasks-v1` cluster finalizes).

- **[P2] `ts-agent-tasks` source hand-offs T6 left for T7/T8/T9 — each is the named slice's to
  decide, and none is safe to leave implicit.**
  (1) **T8 — held commands never settle on their own.** A `possibly-sent` command the pump holds
  (non-idempotent with no lookup answer, or its source key expired) stays unsettled indefinitely,
  keeping its 64 KiB settlement reservation and blocking `archive` (`retention-blocked`, "unsettled
  command"). Only a later `lookupCommand` that finds it settles it; an ordinary observation does
  not, and a source with no lookup never will. The same holds for a `source-replay` command settled
  `accepted` while it awaits a feed revision the feed never reaches (e.g. one reported under an
  epoch the feed cannot order against): archive is refused while it awaits. T8 needs an explicit, audited host disposition for a held command
  (e.g. "abandoned: outcome unknown") that consumes the reservation without claiming an outcome.
  (2) **T8 — a `source-replay` task registered after the feed passed its revisions.** The feed
  reports an observation for a binding no task holds as `unknown-binding` and the pass moves on,
  so revisions emitted before registration are never replayed into the task. Hosts must register
  (or register with an `initialObservation`) before the source emits for that binding; T8's
  recovery journeys should either enforce that ordering or detect the gap.
  (3) ~~**T7 — audience charges on the T6 claims.**~~ **Resolved by T7** — the evidence is spent
  from these claims, pinned by the charge (`agent-tasks-t7` `result.md` § *How the T6 claims were
  spent*).
  (4) **T9 — `ITaskSource.capabilities()` and the source side of a stop.** Design §5 lists
  `capabilities()`; T6 omitted it (commands are declared by the kind registry, which is the one
  authority T6 needed). A cascade stop that must ask a source to stop is T9's to add, together
  with whatever capability report it needs.
  **Trigger:** the start of T7, T8 and T9 respectively. **Reference:** the `agent-tasks-t6`
  stream's `result.md` § *Hand-offs* (at `.ai/tasks/active/agent-tasks-t6/` until the
  `agent-tasks-v1` cluster finalizes).

- **[P2] `ts-agent-tasks` delivery hand-offs T7 left for T8 — each is T8's to decide.**
  (1) **`archive` is `retention-blocked` for every task a subscription covers, even fully
  acknowledged.** The inherited rule refuses archive while any retained update names an audience,
  and T7 never prunes a stored audience; with one matching subscription no covered task can ever be
  archived. T8's pruning against exact acknowledgement history and disposition evidence is what
  unblocks it (evidence: `delivery/retention.test.ts`). (2) **Profile inconsistency:** a
  subscription record reserves E (512 B) record bytes per owed or future link, so
  `maxConsumerRecordBytes` (8 MiB) admits ≈16,384 while `maxAcknowledgementIdsPerSubscription`
  advertises 50,000. (3) **Subscription closure and disposition** (`closed`, `disposed`,
  `coalesceProgress`) and the capacity each releases — T7 subscriptions are only ever active, and
  their exact history is a lifetime charge. (4) Baseline payloads of `current` subscriptions hold
  resident bytes until acknowledged (sized in the capacity entry above).
  **Trigger:** the start of T8. **Reference:** the `agent-tasks-t7` stream's `result.md` §
  *Hand-offs* (at `.ai/tasks/active/agent-tasks-t7/` until the `agent-tasks-v1` cluster finalizes).

*(The `checkThreshold` zero-byte-section measure gap (shipped in C2, #669) was fixed by C3 of
`ai-assist-prompt-caching`: a section with `chars === 0` now contributes `0` to the measured total
via an explicit filter before every check in `checkThreshold`, rather than being incidentally
in-or-out of the slice depending on `prefixEnd`'s position. Regression tests use non-zero
`measured` on the empty section in both of the original bug's layouts — see
`cacheStabilityAnalysis.test.ts`, the tests following "counts genuinely cacheable bytes past a
zero-byte stable run in the prefix". Design rule recorded at design.md §5.1b. This item is
retired; the `as Record<string, …>` item below remains outstanding.)*

- **[P2] D2 does not treat a body as conditional when no winning candidate is a conditional
  `'match'` — a conditional candidate that lost this resolve is invisible to it.**
  `checkConditionalBody` in `libraries/ts-prompt-assist/src/packlets/resolve/cacheStabilityAnalysis.ts`
  marks a body qualifier-conditional only when a *winning* candidate matched (`matchType ===
  'match'`, not `'matchAsDefault'`) on a non-empty condition set. The same blind spot covers a
  body whose only conditional winners matched as `matchAsDefault`: their axes are folded in when
  some other winner is a conditional `'match'`, and ignored otherwise. Take the common shape: an unconditional full base plus partials conditioned on a
  volatile axis. On a resolve where no partial matches, the body reads `'frozen'`. On the next
  resolve a partial can match and change it. That is a false `'frozen'`, the expensive direction
  under design.md §1's asymmetry.
  `prompt-assist-qualifier-stability` (#689) folds losing candidates in **once some winner is
  conditional**, because its own relaxation would otherwise have introduced exactly this shape. It
  left the all-unconditional-winners case as it found it: closing it adds refutations to bodies
  that are not refuted today, which was outside that stream's compatibility contract.

  **Trigger**: the next change to D2, or the first report of a cache miss on a prompt whose
  diagnostics called it `'frozen'`.

  **Scope sketch**: when `candidates` is supplied, treat any candidate with a non-empty condition
  set as conditioning the body whether or not it won. With the axis declarations from #689 this
  costs a consumer nothing on `'frozen'`-declared axes. It will add refutations for undeclared
  ones, so run the repo-wide `rush test` and expect downstream fixtures that count findings.

  **Not a P3**: it produces a false `'frozen'` on an ordinary authoring shape, and a false
  `'frozen'` costs the whole prefix silently on every request.

  **Reference**: `.ai/tasks/completed/2026-09/prompt-assist-qualifier-stability/result.md`
  § "Found during implementation — losing candidates".

- **[P2] `as Record<string, …>` after a `typeof` guard — a P1 anti-pattern, 32 sites in
  production source across 11 packages.**
  `CODE_REVIEW_CHECKLIST.md` lists "manual type checking with unsafe casts" as **P1 CRITICAL** and
  names `as Record<string, unknown>` in its own quick-detection greps. The recurring shape is:

  ```ts
  if (raw === null || typeof raw !== 'object') { return false; }
  const node = raw as Record<string, JsonValue | undefined>;   // ← the violation
  ```

  **Measured, not assumed.** `grep -rn "as Record<string" --include=*.ts libraries/*/src tools/*/src`
  excluding tests returns 33 lines, one of which is a comment (`fromJson.ts:58`) — so **32 code
  sites** across 11 packages (`ts-extras` 12, `ts-json-base` 5, `ts-res-ui-components` 4, `ts-web-extras` / `ts-utils` / `ts-app-shell` 2 each, and one each in `ts-res`, `ts-prompt-assist`, `ts-agent-memory`, `repo-template`, `ks`).

  **Triaged and queued as a chore batch** — see `CHORES.md` § *"`as Record<string, …>` after a type
  guard"*, which splits the sites into mechanically-removable (≈8), missing-Converter (≈16, design
  work, do not batch with the rest) and benign (≈8).

  **At least the `JsonValue` family of them is unnecessary, proven by construction.** `JsonObject` is
  `{ [key: string]: JsonValue }`, so once the `typeof` / `null` / `Array.isArray` guard has run,
  TypeScript has already narrowed to `JsonObject` and the property is directly accessible. Three such
  casts were removed from `structuredOutput.ts` in the `schema-optional-translation` stream with **no
  signature change, no behaviour change, lint clean and coverage still 100%** — including one in
  `hasOptionalProperties` that had shipped, and which a later stream copied *because it was there*.
  That copy is the whole reason this entry exists: the checklist calls the pattern blocking, and it
  still propagated, because the nearest example in the file was a violation.

  Not every instance will be the same shape — some cast a genuinely-`unknown` value where a Converter
  is the right answer instead. **Triage before bulk-editing**; the `JsonValue`-narrowing ones are the
  cheap and provably-safe subset.

*(The repo-wide `rush test` gate is **fully restored as of 2026-09-19**, in two steps. #673 fixed
the root-only `mutableFsTree` assertion that stopped the run at `@fgv/ts-json-base` with 29 of 36
packages never executing. The Jest 30 / Heft 1.3 upgrade then removed the four `SUCCESS WITH
WARNINGS` packages, whose only warning was the Node `punycode` DEP0040 deprecation emitted by
`tr46@3`'s `require("punycode")` — jsdom 26 brings tr46 5, which requires `"punycode/"` instead.
Both `rush test` and `rush rebuild` are now exit 0 with no warnings bucket at all, so
`CODING_STANDARDS.md`'s repo-wide-test acceptance checkbox is honestly tickable for the first
time. The override route that looked cheaper was never taken and was right to avoid: pnpm itself
logged "The `pnpm` field in package.json is no longer read by pnpm … `pnpm.overrides` ignored"
during the upgrade, confirming it would have done nothing on Rush 5.177.2. This item is retired.)*




- **[P2] A `safer-fetch` retry test asserts a probabilistic outcome, and flakes CI for every
  unrelated PR at roughly 1 run in 170.**
  `libraries/ts-extras/src/test/unit/safer-fetch/saferFetchRetry.test.ts` §
  *"an exhausted deadline fails with the attempt's own failure"* drives
  `{ timeoutMs: 30, retry: { attempts: 5, baseDelayMs: 10_000 } }` and asserts
  `expect(transport.calls).toHaveLength(1)` — i.e. that the backoff outlasts the 30 ms overall
  deadline so no second attempt is made.

  **The implementation is correct; the test is over-specified.** `computeRetryDelayMs` applies
  **full jitter** — the delay is uniform on `[0, cap)` where `cap = min(baseDelayMs * 2^attempt,
  maxDelayMs)`. With `DEFAULT_RETRY_MAX_DELAY_MS = 5_000` the cap is 5 000 ms, so the delay lands
  under the 30 ms deadline about **0.6% of the time**, and a second attempt is then both legal and
  correct. Observed 2026-08-18 on #640 — a promotion PR touching only `ts-agent-memory`,
  `ts-agent-memory-sqlite-vec` and docs — where it failed `rush test`, blocked 18 downstream
  projects as `BLOCKED: operations failed`, and cost a full re-run. The same suite passed 5/5
  locally immediately after.

  **The fix is small and the seam already exists.** `IRetryDelayParams.random` is documented
  *"Injected for determinism in tests; the call path passes `Math.random`"* — and `grep -n random`
  in that test file returns **nothing**. The test should inject a `random` that returns a value
  putting the delay safely past the deadline (or the deadline/base pair should be chosen so the
  assertion holds for every point in `[0, cap)`). Worth a sweep of the sibling retry tests for the
  same shape while in there.

  **Why P2 rather than P3**: it is not this package's own gate that suffers, it is *everyone's* — a
  flake in a widely-depended-on package fails `rush test` for PRs that never touched it, and the
  failure reads as "your change broke `ts-extras`" to whoever is looking. That is a tax on unrelated
  work plus an erosion of the one gate this repo trusts most.

- **[P2] The `samples/testbed` fake `IVectorIndex` has broken on two consecutive `ts-agent-memory`
  contract changes, with the rule codified in between.**
  `samples/testbed/src/test/unit/scenarios/sqliteVecMemoryPersistence.test.ts` hand-implements
  `IVectorIndex` (via `fakeIndex(overrides: Partial<IVectorIndex>)`). It broke on
  `personaility-asks-2026-08` (#614, which promoted `size` / `rebuild` onto the contract) and again
  on `vector-rebuild-report-by-kind` (2026-08-15, which reshaped the report and widened `rebuild`'s
  return type). Both times it was invisible to `rushx build` / `rushx test` in **both** libraries
  and surfaced only in a repo-wide `rush rebuild`.

  `CODING_STANDARDS.md` § "Widening a shared interface needs a repo-wide build" is written **from
  this exact file**, and it did not prevent the second break — because it is advice a person has to
  recall at the moment they are busy with something else, which is the failure mode the 2026-08-14
  disposition pass named as the reason four tech-debt triggers fired unnoticed. A third restatement
  is not the answer.

  **Trigger**: the next change to `IVectorIndex`, `IFragmentVectorIndex`, `IMemoryIndex` or
  `IMemoryRecordSource`.

  **RESOLVED (b), 2026-08-15, after a FOURTH firing.** `derived-state-phase1` broke the same file
  again — two fake indexes in `sqliteVec*Persistence.test.ts` — bringing it to four consecutive
  streams on this contract family. Remedy (b) is adopted: the repo-wide `rush rebuild` is now an
  **acceptance-criteria checkbox** in `CODING_STANDARDS.md` for any stream changing a shared
  contract, rather than advice a person has to recall. Remedy (a), the shared exported test double,
  is **not** adopted and is downgraded to a P3: of the four observed casualties one was a *source*
  file, so (a) covers half the cases and (b) covers all of them. This entry stays open only for that
  P3 remnant.

  **THIRD FIRING, 2026-08-15 — and it widened the class.** `agent-memory-index-partial-read` broke
  `samples/testbed` again, and this time the casualty was **`scenarios/memoryToolsGate/index.ts`, a
  *source* file**, not a test double: it constructs retrievers, and the `{ index, resolver }`
  widening reached it. So remedy (a) — a shared exported test double — would **not** have caught
  this one; only (b), the repo-wide build, did. That reweights the sketch: (b) is no longer merely
  the cheap option, it is the only one demonstrated to cover the observed cases. Three streams,
  three catches, all by `rush rebuild` after green per-package gates.

  **Scope sketch**: two candidates, not exclusive. (a) Replace the hand-rolled fake with a shared
  test double exported from a single place, so a contract change updates one file rather than
  N — this is the `succeed()`/`fail()`-over-hand-rolled-Result-shapes lesson applied to interfaces.
  (b) Put `node common/scripts/install-run-rush.js rebuild` on the acceptance-criteria list for any
  stream whose brief declares a shared-contract change, so it is a checked box rather than a
  remembered practice. (b) is cheap and mechanical; (a) removes the class.

  **Not a P3**: P3 is opportunistic, and the trigger has now fired **three times in three
  consecutive streams** on the same contract. The cost each time is a red repo-wide build discovered after the
  per-package gates were green — i.e. after an implementer reasonably believed they were done.

  **Reference**: `docs/WORKSTREAMS.md` § `personaility-asks-2026-08` (the #614 break) and
  § `vector-rebuild-report-by-kind` (the second). Escalated by that stream's antagonist pass, which
  observed that its README had closed the same observation with "nothing new to codify" while the
  *other* recurrence it hit — this file's line cap — was correctly escalated.

- **[P1] The 2000-line `max-lines` cap is collected as a per-stream toll — PROMOTED 2026-08-18,
  widened from one file to the pattern 2026-08-22.**

  **`fileTreeMemoryStore.ts`** is the origin instance and paid the toll in four consecutive streams,
  which is exactly the promotion condition this entry wrote for itself. `fragment-query-scoping`
  (2026-08-18) needed `IMemoryStore` to implement `IIdentityResolver`, found the file already at
  **1999** with no room at all, and extracted
  `libraries/ts-agent-memory/src/packlets/store/storeIdentity.ts` (codec lookup, identity resolution,
  loaded-identity verification) to get under it — landing at **1989**. Then a fifth: the
  kind-collision fix (#648) needed a `verifyOccupantKind` guard threaded through the read paths, and
  extracted `storeFileAccess.ts` (scope-directory resolution, record file write/delete) to make room
  — **1907** as of that merge. Five extractions in five streams is not debt being deferred; it is a
  toll being collected, and every one of them was discovered mid-implementation rather than planned.

  **The second file arrived 2026-08-22, which is what widens this entry.** `orDefaultWith` (#649) —
  a *four-line* addition to `libraries/ts-utils/src/packlets/base/result.ts` — took that file from
  1992 to 2000 and turned a green `rushx build` into a repo-wide `rush rebuild` failure, and its test
  file (`result.test.ts`, 1989) has the same one stream of headroom left. The seam was chosen under
  the same pressure the four `ts-agent-memory` extractions were: the first candidate
  (moving `AsyncResult` / `AsyncDetailedResult`) had to be abandoned after finding `new AsyncResult(…)`
  constructed at runtime in ten places, which would have introduced a circular import into ts-utils'
  foundation file. The types-only cut that shipped (`resultTypes.ts`, re-exported from `result.ts`,
  516 lines) is defensible and leaves the public surface byte-identical — but it was not *designed*,
  it was the seam that fit.

  **What this means for the entry:** the problem is not that one store class grew large. It is that
  the repo has no mechanism that notices a file approaching the cap, so the discovery is always a red
  check on a PR whose actual change is unrelated and often tiny, and the remedy is always chosen in
  the worst possible frame of mind.

  **The sweep nobody had run, run 2026-08-22** (`find libraries tools -name '*.ts' -not -path
  '*/node_modules/*' -not -path '*/lib/*' -not -path '*/dist/*' -exec wc -l {} + | sort -rn`):

  | lines | file | headroom |
  |---|---|---|
  | **2000** | `ts-extras/src/test/unit/ai-assist/streamingAdapters.test.ts` | **none** |
  | **2000** | `ts-extras/src/test/unit/ai-assist/clientToolContinuationBuilder.test.ts` | **none** |
  | 1997 | `ts-extras/src/test/unit/ai-assist/apiClient.test.ts` | 3 |
  | 1989 | `ts-utils/src/test/unit/result.test.ts` | 11 |
  | 1982 | `ts-json-base/src/test/unit/jsonCompatible.test.ts` | 18 |
  | 1957 | `ts-extras/src/packlets/ai-assist/model.ts` | 43 |
  | 1945 | `ts-extras/src/test/unit/crypto/keystore/keyStore.test.ts` | 55 |
  | 1907 | `ts-agent-memory/src/packlets/store/fileTreeMemoryStore.ts` | 93 |

  **Three of the top four are `ai-assist` test files with 0–3 lines between them, and
  `ai-assist-structured-output` is the next stream queued.** That stream adds a capability-reporting
  surface and a structured-output path — work that lands tests in exactly those files. It will hit
  this wall on its first commit unless the splits are done first, which is the whole point of the
  promotion: this is now a **prerequisite of that stream**, not something to discover inside it.

  **What P1 changes**: the split is no longer something to fold into the next feature stream. It is
  its own piece of work, to be scheduled before the next `ts-agent-memory` feature rather than
  alongside it — because folding it in is precisely what the last four streams did, and each one
  chose its extraction under time pressure to clear a cap rather than on the seam that belonged
  there. The `storeIdentity` / `storeCoverage` / `vectorRecordSource` boundaries are all defensible,
  but none of them was chosen; they were the smallest thing that fit.

  *(Superseded framing, kept for the measurement trail:)* **1995 lines as of
  `agent-memory-derived-state-reconciliation` (2026-08-15)** — the headroom
  narrowed again, and by the mechanism this entry predicted. It was 1991 after
  `vector-rebuild-report-by-kind` (2026-08-15), which spent most of its own headroom: that stream's
  inline version measured 2012, and the `asRecordSource()` filter-and-tally had to be extracted to
  `libraries/ts-agent-memory/src/packlets/store/vectorRecordSource.ts` purely to get back under the
  cap — a saving of 4 lines, leaving 9. The derived-state stream then hit the same wall a third
  time: `coverage()` inlined took the file to 2009, and `storeCoverage.ts` was extracted for the
  same reason, landing at 1995. In this repo a `max-lines` warning is a **CI failure** — `rush
  rebuild` exits non-zero on "SUCCESS WITH WARNINGS" while a per-project `rushx build` exits 0 — so
  the next feature that adds a handful of lines to this file turns a green local build into a red PR.

  This file has been here before. `CODING_STANDARDS.md` § "A local warning is a CI failure" is
  written from *this exact file* crossing the cap on the PersonAIlity Stream A stack. There is no
  standing entry for it because the only max-lines entry the ledger carried was `apiClient.ts`,
  retired 2026-08-14 when #620 split it.

  **Trigger**: the next stream that adds a public member, a create param, or a write-path branch to
  `FileTreeMemoryStore` — i.e. almost any `ts-agent-memory` feature — or the next one that adds a
  member to `IResult`, since `result.test.ts` will need the corresponding test. Do the split first,
  not after the red check. The cheap prophylactic, which nothing currently runs:
  `find libraries tools -name '*.ts' -exec wc -l {} + | sort -rn | head -20` before starting a stream
  that will touch any file it names.

  **Scope sketch**: the collaborator-extraction pattern already used four times on
  `fileTreeMemoryStore.ts` is the answer there — `VectorMaintenance` (`agent-memory-store-vector-slice`), `vectorRecordSource`
  (`vector-rebuild-report-by-kind`), and `storeCoverage` / `storeReconcile`
  (`agent-memory-derived-state-reconciliation`). The next candidates are the temporal projection
  helpers (`_projectAsOf` and friends) and the observation fan-out, both of which are self-contained
  and take the store structurally rather than importing it. Neither is a public-surface change, so
  both ship as `"type": "none"`.

  **Not a P3, and the evidence is now four streams deep**: P3 is opportunistic, and single-digit
  headroom means the trigger is not "if someone touches this" but "the next time anyone does" —
  which has now been *every* consecutive `ts-agent-memory` stream, each of which discovered the cap
  mid-implementation and paid an unplanned extraction to get under it. The failure mode is also
  invisible locally, which is what makes it cost a review cycle rather than a minute. The
  "consider promoting to P1 if a fourth stream pays this tax" condition written here fired on
  2026-08-18; the promotion is recorded above.

  **Reference**: `vector-rebuild-report-by-kind` (2026-08-15) — its `result.md` records the first
  extraction as a deviation from its brief, with the measured 2012 / 1995 / 1991 numbers —
  `agent-memory-derived-state-reconciliation` (2026-08-15) for the 2009 → 1995 repeat, and
  `fragment-query-scoping` (2026-08-18) for the fourth — which started from **1999** (the file had
  drifted up 4 lines since the 1995 measurement above) with *no* room for the identity resolution it
  needed, and landed at 1989 after extracting `storeIdentity.ts`.

- **[P2] `ts-prompt-assist` needs a *member-level* TSDoc pass — 66 undocumented members, plus one thrice-repeated inline union.**
  **Re-scoped 2026-08-14. The top-level half of this entry is DONE and the original framing is now
  misleading.** Measured against `etc/ts-prompt-assist.api.md`: **135 of 135 top-level exported
  symbols carry TSDoc; zero undocumented.** What remains is **66 `(undocumented)` markers on
  interface and class *members*** — concentrated in `IPromptSlot` (5), `IChainWalkResult` (4),
  `IPromptStoreFixtureSeedRecord` (4), `IResourceSlotBinding` (4), `ISafeguardFinding` (4),
  `IStoredPromptRecord` (4), then a tail of threes.

  The named anti-pattern also still stands: `Qualifiers.IReadOnlyQualifierCollector | ReadonlyArray<string | Qualifiers.IQualifierDecl>`
  is spelled inline **three times** in `resolve/promptLibrary.ts` (`:90`, `:1342`, `:1362`) with no
  named type to attach docs to.

  That makes this a bounded, gradeable task rather than the open-ended audit it was written as —
  which is the main reason it has sat: "audit TSDoc presence and quality" has no finish line, and
  "close 66 markers and extract one union" does.

  *Original framing, superseded: it described the surface as carrying "minimal TSDoc" on methods,
  parameters and return shapes. True in 2026-06; not true now.*

  PR #380 review surfaced that the recently-extended `ts-prompt-assist` surface — `PromptLibrary` + `IPromptLibraryCreateParams` + `IPromptResolveRequest` + the related fixture / resource-binding / resolve-output types — carries minimal TSDoc on individual methods, parameters, and return shapes. The v0.1 surface has been moving fast (Phase B sub-phases + post-merge cleanups + surface-tidy + round-1 ergonomics absorption), so documenting heavily during churn was the right call; with v0.1 effectively settled now, the next concern is consumer-facing TSDoc quality on the public surface.

  A related pattern Erik flagged in the same PR #380 review: **inline anonymous types + union types should be extracted to named `type` / `interface` declarations** so they have a single place to attach TSDoc. The library currently has a few patterns like `qualifiers: IReadOnlyQualifierCollector | ReadonlyArray<TAxes | (IQualifierDecl & { readonly name: TAxes })>` that would benefit from a named extracted type.

  **Trigger — FIRED.** The stated trigger was "post-round-2 pressure-test, once the surface is
  stable". v0.1 shipped, `LIBRARY_CAPABILITIES.md` documents it as settled, and both
  `HorizontalComposer` and the observation store have since been built *on top of* it. The
  surface is stable; the wait is over. Re-triggered on: just do it, or the next substantive
  change to the packlet.

  **Scope sketch**: commission a documentation-pass agent against `@fgv/ts-prompt-assist`'s public surface (and any new `@fgv/ts-res` qualifier surface from PR B). For each exported type / class / method:
  - Audit TSDoc presence + quality (does it answer "why" not just "what"; do `@public` symbols have useful `@remarks`).
  - Extract inline anonymous types + unions to named declarations where extraction creates a meaningful single-attach-point for documentation.
  - Cross-link related types via `{@link}` directives.
  - Run api-extractor; verify all `// @public` types have non-`(undocumented)` flags.

  Compare quality bar to `@fgv/ts-utils`'s base packlet, which is the reference for documentation depth.

  **Not a P3**: the surface is public alpha-stage and being consumed; opaque type signatures degrade the consumer-port experience materially. P2 trigger ("post-round-2 stable") puts it on a natural cadence.

  **Not a P1**: no functional gap; the surface works; this is documentation polish on shipped code.

  **Reference**: PR #380 (round-1 ergonomics PR C) — Erik's review surfaced both the doc gap and the inline-types pattern. Cluster spans `libraries/ts-prompt-assist` + the `ts-res` qualifier collector surface PR B extended.

- **[P2] Cross-runtime entry-point export parity is not systematically tested.**
  Libraries with both Node (`src/index.ts`) and browser (`src/index.browser.ts`) entry points can drift in export names without CI catching it. api-extractor runs only on the Node entry point, so a typo or rename in the browser entry slips through. Pattern has bitten the team three times: `@fgv/ts-extras` exported `Crypto` instead of `CryptoUtils` (personaility web app); `@fgv/ts-extras` missed `Yaml` entirely (ts-prompt-assist sample app, fixed in #377); plus the earlier `repo-template` issue. **`@fgv/ts-extras` now has the recommended micro-test** (`src/test/unit/index.browser.test.ts` asserts every top-level name in `index.ts` is also in `index.browser.ts`); other libraries with browser entries still need it.

  Comprehensive per-export coverage on every library is too expensive given the API surface. The right scope is opportunistic per-library micro-tests.

  **Libraries with `*.browser.ts` entries that still need the micro-test:** `ts-bcp47`, `ts-res`, `ts-web-extras`, `ts-app-shell`, `ts-res-ui-components`, `ts-json`, `ts-json-base`, `ts-sudoku-lib`, `ts-sudoku-ui`.

  **Trigger — FIRED repeatedly without effect; needs replacing, not restating (2026-08-14).**
  The stated trigger is "anytime one of those libraries' `index.browser.ts` is touched
  substantively". Verified today: **nine of the ten packages shipping an `index.browser.ts` still
  have no parity test** — `grep -rl "index.browser" --include=*.test.ts` returns three files, all
  in `ts-extras`. Meanwhile `ts-web-extras` alone has taken safer-fetch, `IdbPrivateKeyStorage`
  and the base64 `contentEncoding` work since this was written, every one of them export-adding,
  and still has none.

  A trigger that has fired three times unnoticed is not a trigger — it relies on an author
  remembering a ledger entry at the moment they are busy with something else. **Replace it with a
  mechanical gate**: fold the parity check into something CI already runs (the change-file gate is
  the natural host, since it already keys off "which packages did this branch touch"), so the
  question is asked by the machine rather than recalled by a person. That reframing is the actual
  work item now; the per-package micro-tests are the easy part.

  **Scope sketch**: copy the pattern from `@fgv/ts-extras/src/test/unit/index.browser.test.ts` — imports both `index.ts` and `index.browser.ts` directly via relative paths, asserts every top-level name exported from Node is also exported from browser. Browser may have additional names (e.g. back-compat aliases) but nothing Node ships may go missing on browser. Per-library cost: ~15 lines.

  **Not a P3**: the pattern has recurred multiple times across the team; the consumer-impact cost (production-visible undefined exports) is real. P2 trigger ("next time the browser entry is touched") puts it on a natural cadence.

  **Reference**: PR #377 (ts-extras Yaml fix + micro-test pattern landed); original L13 lessons-pending entry; earlier ts-extras `Crypto` bug.

## P3 — Opportunistic cleanup

- **[P3] ai-assist sends a forced `tool_choice` alongside manual extended thinking on pre-Claude-5 Anthropic lines, which Anthropic rejects.**
  On a model outside `adaptiveThinkingModelPrefixes` (`claude-haiku-4-5-20251001`, which `@anthropic:haiku` reaches, and the `claude-opus-4-*` / `claude-sonnet-4-*` lines), a completion with a thinking `effort` sends `thinking: { type: 'enabled', budget_tokens }`. With `structuredOutput` on the same request, the `''` catch-all adds `anthropic-tool-forced`'s `tool_choice: { type: 'tool' }`. Anthropic's thinking page: *"tool use with manual extended thinking (`thinking: {type: "enabled"}`) only supports `tool_choice: {"type": "auto"}` … or `{"type": "none"}`. Using `{"type": "any"}` or `{"type": "tool", …}` results in an error"* (<https://platform.claude.com/docs/en/build-with-claude/thinking> § "Thinking with tool use", fetched 2026-09-25). Nothing in `resolveStructuredOutput` or the adapter refuses the combination, so it fails at the provider. The same page says forced tool use *"works with adaptive thinking"*, so the Claude 5 lines on the forced format (`claude-sonnet-5`, `claude-opus-5`, `claude-fable-5`) are unaffected.

  **Trigger**: a caller using thinking with structured output on `@anthropic:haiku` or a 4.x `modelOverride`, or the next change to the forced format.

  **Scope sketch**: the cheapest correct fix is to route manual-thinking requests on those lines through `anthropic-output-format` rather than refusing. The structured-outputs page lists `claude-haiku-4-5-20251001`, `claude-opus-4-5` through `4-8`, `claude-sonnet-4-5` and `4-6` as supported, and JSON outputs set no `tool_choice`. A narrower alternative is a thinking-aware conflict check routed through `onUnsupported`. Either needs a request-body test for effort + schema on a manual-thinking id, and a live row (the canary's `structuredOutputEfforts` on an `@anthropic:haiku` extra model would do).

  **Not a P2**: no tier reaches a manual-thinking line, since base and advanced are both adaptive. `@anthropic:haiku` retires not sooner than 2026-10-15, and the failure is a loud provider 400, not a silent one.

  **Reference**: found while adding the effort + schema canary rows in `ai-assist-anthropic-structured-output` (`.ai/tasks/completed/2026-09/ai-assist-anthropic-structured-output/result.md` §6).

- **[P3] ai-assist refuses `anthropic-output-format` structured output with `web_search` on documented grounds that the docs do not settle for web search itself.**
  `resolveStructuredOutput` (`ts-extras/src/packlets/ai-assist/structuredOutput.ts`) refuses a schema request on `claude-opus-5-5` / `claude-fable-5-1` / `claude-mythos-5-1` when `web_search` is on the same request. This is not the forced format's wire clash (`output_config.format` is nowhere near `tools`, and Anthropic documents JSON outputs combined with tools). It rests on citations: web search "always" returns them, and Anthropic documents citations as incompatible with `output_config.format` because they "require interleaving citation blocks with text output". The documented 400 is scoped to citations on user-provided `document` / `search_result` blocks. No fetched page says whether web search's own citations trigger it or are dropped (<https://platform.claude.com/docs/en/build-with-claude/structured-outputs> § "Feature compatibility", <https://platform.claude.com/docs/en/build-with-claude/citations>, <https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool> § "Citations", all fetched 2026-09-25). If the combination is actually accepted with citations intact, the refusal withholds a working capability.

  **Trigger**: a consumer that wants grounded search and a schema-constrained reply from the same Anthropic call, or an Anthropic doc change that addresses it.

  **Scope sketch**: send one raw request (web search + `output_config.format`) to `claude-opus-5-5` from a keyed environment, outside the library, since the library refuses it. If the call succeeds and the reply still carries citations, drop `anthropic-output-format` from `conflictsWithServerTools`, drop its arm of the comment, and flip the test in `apiClient.structuredOutput.test.ts` § *anthropic output format*. If it 400s, cite the error in the comment and close this entry.

  **Not a P2**: the refusal is loud and names its reason, so nothing fails silently, and no consumer has asked for the combination.

  **Reference**: `ai-assist-anthropic-structured-output` stream (`.ai/tasks/completed/2026-09/ai-assist-anthropic-structured-output/result.md`).

- **[P3] `createChildFile` / `createChildFileBytes` accept a child name containing a path
  separator and silently `joinPaths` it into a nested path.**
  `DirectoryItem.createChildFile` / `createChildFileBytes`
  (`ts-json-base/src/packlets/file-tree/directoryItem.ts`) pass `name` straight to
  `hal.joinPaths(this.absolutePath, name)` with no validation. A caller handing them
  `'sub/child.txt'` gets a file one level down; on Windows `'sub\\child.txt'` does the same,
  because `joinPaths` is `path.join`. `'..'` is worse, because `path.join` **normalizes** it —
  `joinPaths('/a/b', '..')` is `/a`, a path outside the directory entirely.

  The sibling `writeChildAtomically`, added by the `filetree-atomic-write` stream, rejects all
  of these before touching the store. So the package now has two adjacent child-creating methods
  with different name contracts, which is the actual defect: a caller who learns the strict rule
  from one reasonably assumes it of the other.

  **Trigger**: the next change that touches `DirectoryItem`'s child-creation methods for any
  other reason, or the first consumer report of a traversal through one of them.

  **Scope sketch**: lift the validation `writeChildAtomically` already performs into a shared
  private helper and call it from all three. The work is small; the cost is that it is a
  **behavior change on two established methods** of a stability-obligated package — a call that
  succeeds today starts failing. That needs its own change file and a note in
  `CAPABILITIES.md`, and it wants to be someone's deliberate decision rather than a rider on an
  unrelated stream.

  **Not a P2**: no known consumer passes a separator-bearing name, and neither method is
  reachable from the atomic protocol, so nothing is currently exposed to it. It is a contract
  inconsistency and a latent traversal, not a live one.

  **Reference**: dispositioned out of F1 of `filetree-atomic-write` by its `code-reviewer` pass,
  and out of F2 for the same reason — see
  `.ai/tasks/completed/2026-09/filetree-atomic-write/result.md` § *Known follow-up*.

- **[P3] A field added to a converted entity can be silently dropped — and the compiler cannot
  catch it. The dangerous shape is an entity with *more than one* converter.**
  `FieldConverters<T>` (`ts-utils/src/packlets/conversion/objectConverter.ts:61`) is
  `{ [key in keyof T]: Converter<T[key]> | Validator<T[key]> }` — a **homomorphic** mapped type,
  so it preserves `?` from `T`. An optional interface field is therefore optional in the
  converter's field map, and a converter that omits it type-checks clean. Verified 2026-09-18
  against the real project config. This is a structural property of the pattern, not a defect in
  `Converters.object` (the mandated idiom) or in any particular converter: interface and
  converter are two declarations with nothing linking them, and the compiler enforces only the
  *required* half.

  **The single-converter case is largely handled by practice, and the entry should say so.**
  The working habit is to define the model entity and its converter as a pair, and to update
  them as a pair. That discipline holds well and is why this is P3 rather than higher.

  **What the habit does not scale to is N.** The habit is singular — *"the* converter" — so an
  entity with a second converter (a legacy reader, a wire-format transformer, a persisted-JSON
  shape) has no moment that prompts you about the others. You update the primary, the sibling
  goes stale, and every gate stays green. Reported as a recurring real-world miss by the repo
  owner, independent of the instance below.

  **And that case evades the obvious detector**, which is why it is worth writing down. A sibling
  converter usually converts a *differently named* type — `Converters.object<IFooJson>`, not a
  second `Converters.object<IFoo>` — so grepping for two converters over the same type parameter
  finds nothing. Checked 2026-09-18: **no production entity in `libraries/*/src` has two
  converters over the same type**, so the easy form is currently absent.

  **The live shape is in `ts-extras`' KeyStore**: `IKeyStoreAsymmetricEntry` /
  `IKeyStoreAsymmetricEntryJson` and the symmetric pair (`crypto-utils/keystore/model.ts:207`
  and `:342`), each with its own converter. **Currently in sync — 8 fields each on the
  asymmetric pair, 7 each on the symmetric** — so this is a place to check when either side
  changes, not a present defect. (An earlier revision of this entry said 5 each; that count came
  from a `grep -A 25` window that truncated both interface bodies. Corrected 2026-09-18 from the
  sweep below, which counted full bodies.)

  **Observed live (single-converter form)**: C2 (#669) added `IPromptSlot.cacheStability?` and
  `slotConverter` silently discarded it on every load through the store, with build, lint and
  type-check green. Caught only by end-to-end tests that happened to round-trip through the
  store; a unit test of the analysis would have passed.

  **Trigger**: adding a field to any entity that has a converter — and especially to one with a
  `*Json` / legacy / wire sibling.

  **Scope sketch**, two parts of very different difficulty:
  (a) *Single-converter sweep* — for each `Converters.object<T>`, diff `keyof T` against the
  declared field map. Mechanical and cheap; tells you whether #669 was the only instance.
  (b) *Sibling drift* — compare the field sets of naming-convention-paired types
  (`I<X>` ↔ `I<X>Json` / `Raw` / `Dto` / `Legacy`). Heuristic rather than sound, since the two
  shapes legitimately differ, so it wants to report *asymmetries for review* rather than fail a
  gate. This is the half that matches the recurring real-world miss, and the half no type-level
  trick fixes.

  **Not a P2**: it drops data rather than corrupting it, the omission is inert until someone sets
  the field, and (a) is cheap enough that exposure is measurable on demand.

  **Reference**: #669; `objectConverter.ts:61`; `ts-prompt-assist/src/packlets/converters/descriptorConverter.ts`; `ts-extras/src/packlets/crypto-utils/keystore/model.ts`.


- **[P3] `supportsCacheUsageReporting` withholds *all* token usage from Groq, Mistral, Ollama
  and `openai-compat`, not just cache fields.**
  C1 (#668) attaches `IAiCompletionResponse.usage` on the shared `apiFormat: 'openai'` path only
  when `supportsCacheUsageReporting(descriptor)` is true, which is `'openai' || 'xai-grok'`
  (`streamUsageCapability.ts`). The gate exists for a real reason — Copilot round 4 found that
  every `apiFormat: 'openai'` descriptor shares those call sites, so an ordinary usage block
  from a provider with no cache concept was being normalized into a **false cache-reporting
  signal**.

  But the gate is cache-scoped and it is withholding **general** token accounting as collateral.
  Groq, Mistral, Ollama and self-hosted `openai-compat` all report `prompt_tokens` /
  `completion_tokens`; C1 now discards those for exactly the providers a cost-conscious consumer
  is most likely to be self-hosting. Anthropic and Gemini are unaffected — their paths are not
  behind this gate.

  **Trigger**: a consumer asks why token counts are missing on a self-hosted or non-flagship
  provider, or any stream that touches `streamUsageCapability.ts`.

  **Scope sketch**: separate the two questions the single predicate currently conflates — *does
  this provider report tokens at all* versus *does it report cache fields*. Arguably `reports`
  is already the right home for the second, which would let usage attach broadly while
  `reports` stays honest about the cache half. Note the `'none'` member that C1's layer-1 review
  removed from `AiCacheReportingLevel` may want reconsidering as part of that — it was dropped
  because nothing produced it, and this would give it a producer.

  **Not a P2**: it withholds a number rather than reporting a wrong one, and the providers
  affected are the ones with no cache concept, so nothing about caching is misreported.

  **Reference**: #668; `design.md` §8; `streamUsageCapability.ts`.

- **[P3] Generic `effort: 'none'` maps to a Gemini value that errors on Pro-family models.**
  `ai-assist-thinking-anchoring` (#667) added `'none'` to `IThinkingConfig.effort` as the
  cross-provider spelling for "thinking off". On Gemini it maps to `thinkingBudget: 0` in
  `thinkingOptionsResolver.ts`'s `genericEffortToGemini`. But
  `IGeminiThinkingConfig.thinkingBudget`'s own doc comment — one field away in `model.ts` —
  states that `0` is valid on **Flash and Flash-Lite only and errors on Pro**. So a caller who
  writes `thinking: { effort: 'none' }` and routes to a Gemini Pro model gets a provider-side
  400.

  The stream's layer-1 `code-reviewer` pass caught the *doc comment* overclaiming this and fixed
  it by adding the caveat, on the reasoning that the same footgun already existed via an explicit
  `providers: [{ provider: 'google', config: { thinkingBudget: 0 } }]` block. That reasoning is
  sound but incomplete, which is why this entry exists: the pre-existing door was **Gemini-
  specific**, where reading the Gemini field's docs is the natural thing to do, while the new one
  is the **generic** field whose entire purpose is not having to think about providers. The
  library's own cross-provider abstraction is where the leak now is.

  **Not covered by the `FUTURE.md` entry it looks adjacent to.** That entry ("Gate thinking
  requests on the per-model capability table") is about models that cannot think at all. Gemini
  Pro *does* think — it simply cannot express "off" as a budget of zero. Different problem, and
  it would survive that entry being implemented.

  **Trigger**: a consumer reports a Gemini Pro 400 on `effort: 'none'`, or any stream that
  touches `genericEffortToGemini`.

  **Scope sketch**: the resolver already has model-prefix machinery
  (`isExactOrDashBoundedPrefix`, used by `isAdaptiveThinkingModel`), so the cheap fix is to fail
  fast in `mergeThinkingConfig` with a message naming the Pro-family constraint, rather than
  emitting a value the provider will reject. Note the alternatives are both worse: omitting
  `thinkingConfig` entirely means "model default", which on a thinking-by-default Pro model
  leaves thinking **on** and silently fails to honour `'none'`; and `-1` is dynamic, not off.

  **Not a P4**: it is a wrong value on the wire reachable from the generic public surface, not a
  documentation inconsistency. The failure is loud (a provider 400 rather than silent corruption),
  which is what keeps it out of P2.

  **Reference**: #667; `.ai/tasks/completed/2026-09/ai-assist-thinking-anchoring/` (README
  § "The easy part hid a real edge", `meta.yaml` `summary.diverged`); surfaced by the
  `finalize-task` antagonist pass, not by the stream itself.

- **[P3] `rushx update-snapshot` writes snapshots with a different Jest config than
  `rushx test` reads them with — nine packages.**
  The two halves of the snapshot loop disagree: `"test": "heft test --clean"` runs under
  Heft, which applies the package's `config/jest.config.json` (test environment, and
  crucially Heft's **pinned** jest / `pretty-format` version), while
  `"update-snapshot": "jest --updateSnapshot"` runs plain Jest with none of it.

  Two consequences, and the second is the expensive one. Under jsdom-configured packages
  the update run also *fails* unrelated DOM-dependent tests, which is noisy but obvious.
  The quiet one is that the two `pretty-format` versions serialize an array header
  differently — `Array [` vs `[` — so a freshly "updated" snapshot **does not match** and
  has to be hand-corrected line by line. Observed 2026-08-22 in `samples/testbed` while
  adding four scenario ids: the regenerated file differed from the expected one in exactly
  that header, and nothing about the failure says so.

  **Verified repo-wide** rather than assumed — nine packages carry the plain form:
  `ts-agent-memory-sqlite-vec`, `ts-extras-mcp`, `ts-extras-ollama`, `ts-extras-transformers`,
  `ts-extras-webauthn`, `ts-utils-jest`, `ts-web-extras-transformers`,
  `ts-web-extras-webauthn`, `samples/testbed`. (`ts-utils-jest` — the package that *ships*
  this repo's Result matchers — is among them, which is the tell that nobody has exercised
  this path recently.)

  **Trigger**: the next time anyone regenerates a snapshot, in any of the nine.

  **Scope sketch**: point the script at the same config the test run uses — `jest --config
  config/jest.config.json --updateSnapshot`, or better a Heft-native equivalent so the
  pinned toolchain is used by construction rather than by a path that can drift again.
  One-line edit per package; worth doing all nine at once since the fix is mechanical and
  the diagnosis is not.

  **Not a P2**: it never reddens CI — the checked-in snapshots are correct. It costs a
  confusing half-hour to whoever next updates one.

  **Reference**: surfaced by the `ai-assist-structured-output` stream's testbed scenarios,
  which added four registry ids and had to hand-fix the regenerated snapshot's header.

- **[P3] A `ts-json-base` file-tree test asserts a permission denial that cannot occur for
  uid 0, so it fails on any root container and passes in CI.**
  `libraries/ts-json-base/src/test/unit/file-tree/mutableFsTree.test.ts` §
  *"returns permission-denied for read-only file"* (line ~83) chmods a file to `0o444` and
  expects `fileIsMutable` to fail with `'permission-denied'`. **Root bypasses the file mode
  bits**, so the write succeeds and the assertion fails — verified 2026-08-22 in a root
  dev container (`id -u` → 0; appending to a fresh `0444` file succeeds).

  The implementation is correct and CI is green, because CI's runner is not root. What is
  wrong is a test whose verdict is a function of the uid it happens to run under, with no
  signal saying so — the same defect class as the `openFdCountFor` helper two files over,
  which *does* say so out loud (`console.warn`: "the connection-leak assertion is NOT
  running") rather than degrading silently.

  **Trigger**: the next stream that touches `ts-json-base`'s file-tree packlet, or the
  next time someone loses ten minutes to a red local suite on a clean tree.

  **Scope sketch**: follow the sibling's precedent — detect `process.getuid?.() === 0`,
  skip the assertion, and `console.warn` that it was skipped. Do **not** delete the test:
  it is the only coverage of the `'permission-denied'` detail, and it is real on the
  runner that matters.

  **Not a P2**: it costs local-only confusion, never a red PR.

  **Reference**: surfaced incidentally by the `ai-assist-structured-output` stream, which
  ran `rushx test` in `ts-json-base` after adding `isSchemaValidator` and had to establish
  that the one red test predated the change.

- **[P3] `etc/*.api.md` is not a faithful proxy for what a consumer's editor shows, and a stale doc comment used that gap to ship.**
  A member can carry **two** stacked doc comments — an older prose block, then a
  `/** {@inheritDoc Other.member} */` line immediately above the declaration. TSDoc binds the
  *second*, so the first documents nothing and **never appears in `etc/*.api.md`** — but
  API Extractor's rollup emits both, and `"types"` points at the rollup
  (`dist/<pkg>.d.ts`). So the orphaned text is **invisible to the api.md review gate and fully
  visible on IDE hover** for every consumer.

  Found 2026-08-18 when PersonAIlity reported that
  `InMemoryFragmentCosineIndex.rebuild`'s `@remarks` still said it "deliberately still returns a
  bare count" long after it began returning a `DetailedResult<IFragmentVectorRebuildReport>`.
  Their report was right and the diagnosis on our side was initially wrong: a first pass checked
  `api.md`, found nothing, and nearly concluded the text had never shipped. It had — twice over
  in `dist/ts-agent-memory.d.ts`. Fixed by deleting the orphaned block; the `{@inheritDoc}` line
  below it already delegated to an accurate interface doc, so rewording would have re-created the
  second drift-prone account that `{@inheritDoc}` exists to prevent.

  **Why it matters beyond the one instance.** `CODE_REVIEW_CHECKLIST.md` § "PR description and
  docs accurately frame the change" asks that TSDoc claims be walked back to the implementation
  before merge — and a reviewer doing exactly that, against the artifact the repo treats as the
  API record, would not have seen this. The stale claim also did not merely misdescribe the
  return: it *justified an asymmetry that no longer exists*, so a reader who trusted it would
  conclude the fragment path is less observable than it is and never look for the report.

  **The sweep was run 2026-08-18** — a doc block immediately followed by another doc block, over
  every non-test `libraries/*/src` and `tools/*/src` file. **33 sites, of which one is a genuine
  instance of this defect and the rest are not**, so this is a small cleanup rather than a
  contagion:

  | shape | count | verdict |
  |---|---|---|
  | column-0 file-level block above the first member | 23 | **benign** — an intentional file-header note (e.g. `ts-utils/base/shouldNotFail.ts`) |
  | indented section-header comment inside an interface (`/** Visibility options */`) | 9 | **cosmetic** — all in `ts-res-ui-components`; should be `//`, since `/** */` silently orphans, but nothing is misdescribed |
  | indented orphaned member doc carrying `@param`/`@returns` | **1** | **the real one** |

  The real one is `libraries/ts-res/src/packlets/resources/resourceManagerBuilder.ts:837`: an
  orphaned block documenting a condition-set-token helper sits directly above
  `_applyEditsToResourceDeclaration`, so a reader hovering gets `@param`/`@returns` for **a
  different method entirely**. It is `@internal`, so unlike the `ts-agent-memory` case it never
  reached a published rollup — which is exactly why it is P3 and not higher.

  **No lint rule proposed.** One genuine instance across the repo does not earn one, and the
  discriminator that matters (is the first block orphaned, or a deliberate section header?) is
  not mechanically decidable — the 9 cosmetic hits would all be false positives. Re-run the sweep
  opportunistically instead.

- **[P3] `@fgv/ts-web-extras`'s safer-fetch suite cannot exercise a successful response — jsdom ships no Fetch globals.**
  `libraries/ts-web-extras/src/test/unit/browserSaferFetch.test.ts` drives only a *failing*
  scripted transport, because the jsdom test environment provides no `Response` constructor, so
  the suite cannot build one to return. Every success-path semantic on the browser entry points —
  the content-type gate firing on a real header set, the streaming size cap counting decoded
  bytes, body-guard dispatch, the shape of a returned `ISaferFetchResponse<T>` — is covered
  **solely** by the `@fgv/ts-extras` suite, on the shared runtime-agnostic core.

  That is *mostly* fine by construction: the core genuinely is shared verbatim, which is the
  design's whole premise. The gap is that the premise is untested on the browser side, so a
  browser-specific regression in the thin wrapper — an option not threaded, a guard not passed
  through — would not be caught by either suite.

  **Trigger**: next substantive change to the browser safer-fetch packlet, or whenever the test
  environment gains Fetch globals.

  **Scope sketch**: either point the browser package's jest environment at one that supplies
  `Response` (Node 20+ has it natively — `testEnvironment: 'node'` for this file alone, since it
  tests no DOM), or inject a minimal `Response` polyfill into the suite's setup. Then port the
  success-path cases from the `ts-extras` suite so the wrapper is exercised end to end.

  **Not a P2**: the shared core is well covered and the wrapper is thin; this is a coverage-shape
  gap rather than a known defect. It earns an entry because it is a **security** primitive whose
  browser posture is already the weaker of the two — three guarantees are structurally absent
  there and stated rather than degraded — so the wrapper is exactly where a silent regression
  would be least visible and most costly.

  **Reference**: `safer-fetch-s3` (#601) `result.md` / `README.md`, which record the constraint;
  surfaced 2026-08-14 by the retroactive `finalize-task` sweep, which found it recorded in no
  durable ledger. Note `docs/TECH_DEBT.md` and `docs/FUTURE.md` contain no other safer-fetch
  entry at all.

- **[P3] `importPublicKeyFromMultibaseSpki` still early-returns instead of chaining; the bridge pattern it was waiting for has shipped.**
  `libraries/ts-extras/src/packlets/crypto-utils/spkiHelpers.ts` breaks its `Result` chain at the
  sync→async transition — `const decodeResult = multibaseBase64UrlDecode(encoded); if
  (decodeResult.isFailure()) { return fail(...); }` — rather than chaining into the awaited
  `provider.importPublicKeySpki(...)`. Its sibling `exportPublicKeyAsMultibaseSpki` chains cleanly, so
  the two read differently for no reason a caller can see.

  **Trigger**: fired already, and that is the point of this entry. The
  `auth-primitives-batch1` README deferred it explicitly — "a candidate to revisit if a clean
  `Result`-to-`AsyncResult` bridge pattern emerges" — and `AsyncResult` with `thenOnSuccess` /
  `thenOnFailure` has since shipped in `@fgv/ts-utils` and is documented in `CODING_STANDARDS.md`
  § "Async Result Chaining". Address on the next substantive change to `crypto-utils`.

  **Scope sketch**: `return multibaseBase64UrlDecode(encoded).thenOnSuccess(async (bytes) =>
  provider.importPublicKeySpki(bytes, algorithm)).withErrorFormat((e) =>
  `importPublicKeyFromMultibaseSpki: ${e}`)`. Behaviour-preserving; the existing tests should pass
  unchanged, which is the check that it was purely stylistic.

  **Not a P2**: it is a readability defect in a correct function, not a correctness or type-safety
  one. It earns an entry only because it was a *recorded deferral whose stated precondition is now
  met* — the class of debt that otherwise disappears, since a deferral living solely in a completed
  stream's README has no reader at the moment its trigger fires.

  **Reference**: `auth-primitives-batch1` (#322) "Notes for sibling-sweep / future cleanup"; surfaced
  2026-08-14 by the retroactive `finalize-task` antagonist pass over that stream.

- **[P3] `@fgv/ts-utils` should export a single-`AsyncDeferredResult` invoker; FOUR packages now carry a private copy.**
  **Recount 2026-08-14 — the entry said two; there are four, so its own trigger fired twice over.**
  Beyond the two named below, `@fgv/ts-extras` has `_capture<T>` in
  `safer-fetch/saferFetch.ts:223-224` (same body, different name) and `@fgv/ts-prompt-assist`
  inlines the flatten at `safeguards/safeguardEngine.ts:128` with a comment explaining it.
  `_invokeDeferred` is still unexported (`mapResultsAsync.ts:235`) and absent from
  `etc/ts-utils.api.md`.

  **This also retires the entry's own "why not done inline" reasoning**, which argued the carry
  was cheaper than widening one consumer's PR stack. That held for two copies inside one stack.
  It does not hold for four independent packages, two of which have nothing to do with agent
  memory — at that point the duplication is a repo-wide pattern and the export is the cheaper
  end state.

  Invoking one consumer-supplied `() => Promise<Result<T>>` and turning a synchronous throw or a rejection
  into a `Failure` requires `captureAsyncResult` plus a flatten (`.onSuccess((inner) => inner)`), because
  `captureAsyncResult` wraps the hook's own `Result` and yields `Result<Result<T>>`. `ts-utils` already has
  exactly this as `_invokeDeferred` in `mapResultsAsync.ts`, but it is `@internal` and unexported, so
  `@fgv/ts-agent-memory` (`inMemoryCosineIndex.ts`) and `@fgv/ts-agent-memory-sqlite-vec`
  (`sqliteVecVectorIndex.ts`) each define an identical private `invokeHook`.

  **Trigger — FIRED (twice). Re-triggered on:** the next time the async `Result` family is
  touched, or simply do it — this is a ~20-line additive export on `ts-utils` plus four deletions.

  **Scope sketch**: export the existing `_invokeDeferred` under a public name (`captureDeferredResult` reads
  naturally alongside `captureResult` / `captureAsyncResult`, and `AsyncDeferredResult<T>` is already
  exported), with tests + a change file, then delete both private copies. Purely additive on `ts-utils`.

  **Why not done inline**: `ts-utils` is a foundational, non-active-development surface and was outside the
  declared package scope of the PersonAIlity Stream A stack. Widening a four-PR stack a consumer is waiting
  on to add a public export to the repo's most-depended-on library is the wrong trade; three duplicated
  lines twice is the cheaper carry. Recorded rather than left as a silent copy-paste.

  **Reference**: PersonAIlity Stream A (#611, #614); Copilot round 1 on #611 finding 1.

- **[P3] `ai-assist` fence extraction mis-slices a fenced body that itself contains a triple backtick.**
  `FENCED_BLOCK` in `libraries/ts-extras/src/packlets/ai-assist/jsonResponse.ts` is a single lazy-body regex (`([\s\S]*?)` between an opening fence and the first following ` ``` `). When a model emits a fenced JSON block whose *body* contains a literal triple backtick — most plausibly inside a string value, e.g. ` ```json\n{"snippet": "``` foo ```"}\n``` ` — the lazy body stops at the inner backticks and `extractJsonText` hands `JSON.parse` a truncated candidate. Long-standing and **not introduced by the `ai-assist-fenced-json-diagnostics` stream**: that stream only renumbered the regex's capture groups (opening fence became group 1, body group 2, so a body offset can be mapped back to the original text), verified behaviour-preserving over a 6804-input fuzz. The new `classifyJsonParseFailure` degrades safely here — it reports `'unknown'` rather than compounding the mis-slice with a confident wrong verdict.

  **Reproduced 2026-08-14.** Input ` ```json\n{"snippet": "``` foo ```"}\n``` ` yields capture
  group 2 = `{"snippet": "`, which reaches `findBalancedJsonSubstring`, classifies as
  `'unclosed'`, and fails with: *"JSON structure opened but never closed (depth 1 at end of
  input) — response may have been truncated (check IAiCompletionResponse.truncated / raise
  maxTokens)"*.

  **That message is a confidently wrong verdict**, which sharpens this entry considerably. The
  original text claimed the failure is merely "loud (a parse failure), not silent" and credited
  `classifyJsonParseFailure` with degrading safely to `'unknown'`. Both are too generous: the
  consumer is told the response was truncated and to raise `maxTokens`, on a response the model
  formed correctly and that was never truncated. Acting on that advice cannot fix it. Being
  loudly wrong about the cause is worse than failing opaquely, and it is exactly the class of
  misdiagnosis `classifyJsonParseFailure` exists to prevent.

  **Trigger**: the next time fence extraction is touched, or the first consumer report of a
  fenced response with embedded backticks failing to parse — which will most likely arrive
  *described as a truncation problem*, because that is what the library told them.

  **Scope sketch**: harden the fence scan — prefer counting the opening run's backtick length and matching a closing run of at least that length at a line start (the CommonMark rule), instead of the current first-` ``` `-wins lazy match. Keep `extractJsonText`'s messages unchanged; `locateJsonCandidate` is already the single source of truth for the strip-wrappers step, so the change lands in one place and both the extractor and the classifier follow.

  **Not a P4**: it produces a wrong parse candidate, not just a cosmetic wart — a consumer sees a confusing `JSON.parse` failure on output the model actually formed correctly.

  **Reference**: `ai-assist-fenced-json-diagnostics` stream; code-reviewer pass on that diff (2026-07-31), P3 finding 3.

- **[P3] `ts-agent-memory` L2 `createMemoryTools` duplicates the store's codec wiring instead of delegating.**
  `createMemoryTools({ codecs?, defaultCodec? })` (`libraries/ts-agent-memory/src/packlets/tools/memoryTools.ts`) accepts the per-kind identity codecs a second time, in addition to `FileTreeMemoryStore.create({ codecs })`. `memory_write` needs them because `IMemoryStore.put` (`fileTreeMemoryStore.ts:496-502`) validates `envelope.id === codec-derived idStem` and does not derive/stamp the id itself — so a caller building a new `IMemoryRecord` must compute the same `idStem` up front, which requires the same codec the store was constructed with. The testbed scenario passes the same `codecs` map to both constructors, illustrating the drift risk: a host that re-wires the store's codecs but forgets the mirrored `createMemoryTools` config gets a confusing "envelope id does not match codec-derived stem" failure at `put()` time. Scope isolation is NOT compromised (codec `scope` is derived deterministically from `kind`, not from agent input; a mismatch loudly rejects the write rather than writing cross-scope), so this is a DX/robustness smell, not a security gap.

  **Trigger — ALREADY FIRED, unnoticed (2026-08-14).** The stated trigger was "when the temporal
  write path lands". It landed: `TemporalVersionedPolicy` is in `packlets/types/writePolicy.ts`
  and wired in `fileTreeMemoryStore.ts`, with `test/unit/store/temporalStore.test.ts` alongside.
  Nobody acted. Re-triggered on: the next time `createMemoryTools` is extended, or the next
  substantive change to the store's write path.

  **Scope sketch — now cheaper than when written.** Add an additive method to `IMemoryStore` —
  `resolveWriteAddress(kind, entityId): Result<IIdentityCodecResult>` delegating to the store's
  already-configured `codecs`/`defaultCodec` — and have `memory_write` call it, dropping the
  `codecs?`/`defaultCodec?` params from `ICreateMemoryToolsParams`.

  When this was written that was a novel shape. It is not any more: `IMemoryStore.dedupScopeFor(kind)`
  and `embedsKind(kind)` both shipped since, and both are exactly this pattern — a total,
  synchronous, store-owned accessor existing so that two code paths cannot disagree about a
  store-owned fact. `dedupScopeFor`'s own docstring makes the argument. So the proposal is now a
  third sibling of two shipped accessors rather than a new idea, and it should be scoped as such.

  **Reference**: `agent-memory-l2-tools` stream; code-reviewer pass on the L2 diff (2026-07-07).

- **[P3] ai-assist model-alias layer does NOT cover capability-detection or the typed `*ModelNames` unions — both stay manual on a provider line rotation.**
  The `@<provider>:<role>` alias layer (`ai-assist-model-aliases` stream) fixes model *selection/default* churn: a line rotation is one edit to a descriptor's `aliases` map plus a testbed run. It deliberately does **not** touch two adjacent axes, which still need a manual bump (design §3):

  1. **The capability-detection `idPattern` rules** (`libraries/ts-extras/src/packlets/ai-assist/registry.ts`, the `DEFAULT_MODEL_CAPABILITY_CONFIG.perProvider` block). These classify the concrete ids a provider's `listModels` endpoint returns (never aliases). When a new line ships (e.g. `gemini-4.x`), the rules need a matching `idPattern` sibling — without it, new ids fall to the base capability set and are mis-classified (e.g. a thinking-capable model detected as non-thinking). Tier 2 added `/^gemini-3/ → ['chat','tools','vision','thinking']`; the next line needs the same hand-edit.
  2. **The typed `*ModelNames` unions** (`model.ts` — `GeminiThinkingModelNames`, `GeminiFlashImageModelNames`, the parallel `OpenAiThinkingModelNames`, etc.) used by the layered-options `models?` filter arrays. They enumerate concrete ids for compile-time ergonomics and must track real ids on a deprecation. Tier 2 bumped the Gemini unions to the 3.x ids by hand.

  **Trigger**: any future provider line rotation (Google/OpenAI/etc.), or when a `listModels` mis-classification or a stale `models?` filter id surfaces.

  **Scope sketch**: per rotation, add/adjust the provider's `idPattern` rule(s) and bump the corresponding `*ModelNames` union(s) alongside the one-line `aliases` map edit. A follow-on could additively allow aliases inside the `models?` arrays (so the unions stop enumerating concrete ids), but that is a separate design — out of the alias stream's scope.

  **Not a P2**: no shipped-behavior regression; the alias layer's value is precisely bounded and the doc (`LIBRARY_CAPABILITIES.md`, packlet README) states the boundary explicitly. This entry exists so the two manual axes are not forgotten on the next rotation.

  **2026-09 rotation (executed this entry)**: added `/^gpt-6/`, `/^grok-4\.7/`, `/^grok-4\.6/`; bumped the OpenAI/Gemini/xAI/Anthropic thinking unions and the GPT Image / Grok Imagine unions; dropped `o3-deep-research` / `o4-mini-deep-research` (shut down 2026-07-23). It also showed there is a **third** manual axis this entry did not name: the per-model capability declarations (`structuredOutput`, `imageGeneration`, `responsesOnlyModelPrefixes`, `adaptiveThinkingModelPrefixes`). A successor can change what a declared mechanism does — see the P2 Anthropic structured-output entry, which held two aliases back. The id-by-id record, with sources, is in `.ai/tasks/completed/2026-09/ai-assist-model-catalog-2026-09/result.md`.

  **Reference**: `ai-assist-model-aliases` design §3 + Tier 2 manual-axis bumps (`.ai/tasks/completed/2026-06/ai-assist-model-aliases/state.md`).

- **[P3] ai-assist provider knobs narrower than the model now allows, and two listModels/registry loose ends.** *(Item 1, the thinking-`'none'` gate, was resolved in #692.)*
  All documented 2026-09-24 on the pages cited in `.ai/tasks/completed/2026-09/ai-assist-model-catalog-2026-09/result.md`:
  1. ~~**`'none'` effort has no per-model gate.**~~ **Resolved in #692.** The live testbed run (2026-09-25) confirmed 400s on `gpt-6-astra`, `grok-4.7` and `gemini-3.1-pro-preview`. Descriptors now declare `thinkingRequiredModelPrefixes`, and `IThinkingConfig.onUnsupported` (default `'degrade'`: `'none'` is sent as `'low'`; `'fail'`: refused before the wire) handles the generic `'none'` on them. Two gaps remain. Provider blocks are sent unchecked. Anthropic's always-on models (`claude-opus-5-5`, `claude-fable-5-1`) are not declared, because `'none'` there omits the `thinking` field, which Anthropic accepts.
  2. **`gpt-image-2.5-*` qualities `xhigh` / `max`** are not expressible: `GptImageQuality` is `low | medium | high | auto`, so `@openai:image` cannot reach them (refused locally, not silently).
  3. **xAI image edits are capped at 3 reference images** (`imageGenerationClient.ts`); `grok-imagine-image-2.0` accepts "up to five source images for editing" (xAI's `imagine-image-quality-nov-2` migration guide). Refused locally, not silently.
  4. **`/^gemini-3/` over-matches.** It classifies `gemini-3.8-live`, `*-tts` and `*-transcribe` ids as chat + thinking in `listModels`. This predates the rotation (`gemini-3.1-flash-tts-preview` had it). Detection accumulates across rules, so a sibling rule cannot subtract it; the fix is a narrower pattern.
  5. **Unconfirmed retirement claim.** A registry comment says `gpt-5.1` was "retired March 2026", yet `OpenAiThinkingModelNames` still lists it, and OpenAI's deprecations page (fetched 2026-09-24) records no `gpt-5.1` shutdown. One of the two is wrong.
  6. **For the next rotation:** `gemini-3.8-pro` appears in code samples on Google's thinking page but on no model or deprecation page as of 2026-09-24. Check whether it is listed before moving `@google-gemini:pro` off `gemini-3.1-pro-preview`.
  7. **The `'other'`-block override check does not know the endpoint.** The `'none'` gate stands aside when an applicable `'other'` block carries either OpenAI/xAI effort key (`reasoning_effort` or `reasoning`). Blocks are merged with a shallow `Object.assign`, so a key that *is* on the wire replaces the resolved effort, and key presence is the right test. But Chat Completions sends `reasoning_effort` and Responses sends `reasoning`, and the resolver runs before the endpoint is chosen. A block carrying only the other endpoint's key makes the gate stand aside while the generic `'none'` still reaches the wire. The result is a loud provider 400, and `onUnsupported: 'fail'` does not refuse it locally. The fix threads the chosen endpoint into `resolveThinkingConfig`.
  8. **`gemini-2.5-pro` is gated but not in `GeminiThinkingModelNames`.** It is in `thinkingRequiredModelPrefixes` for callers who still reach it by `modelOverride`, but the union never listed it (neither did `release`). Google withdrew the 2026-10-16 shutdown and serves the 2.5 line to existing users only (as of 2026-09-24), so it is not a model new projects can pick. Decide at the next rotation: list it in the union, or drop it from the prefixes once Google shuts it down.

  **Trigger**: a testbed run that 400s on item 1, or a consumer asking for the higher qualities / more references.

  **Scope sketch**: item 1 wants a per-model accepted-effort declaration on the descriptor (sibling of `adaptiveThinkingModelPrefixes`) checked before the wire, failing or clamping by an explicit policy. Items 2–3 are additive widenings (a union member; a per-capability `maxReferenceImages`).

  **Not a P2**: none is silent — each is either a loud provider error or a local refusal — and item 1 applies only to an explicit `'none'` request on those tiers.

  **Reference**: `ai-assist-model-catalog-2026-09` stream.

- **[P3] The capability resolvers in `ai-assist/registry.ts` return `| undefined` instead of `Result<T>`, and `undefined` is now three-ways ambiguous.**
  **Two functions, not one** (the original entry named only the first, and its line reference was
  stale): `resolveImageCapability` at `registry.ts:428-433` → `IAiImageModelCapability | undefined`,
  and `resolveEmbeddingCapability` at `registry.ts:469-474` → `IAiEmbeddingModelCapability | undefined`.
  Both delegate to the same private `resolveCapabilityForModel`, so the fix is one shared helper
  plus two public wrappers.

  **The case is stronger than "non-idiomatic" now.** When the alias layer landed, these gained a
  third failure mode, so `undefined` collapses three distinct outcomes: no capability rule matched
  the model; the provider declares no capabilities of that modality at all; or **`modelId` was an
  unresolvable or cyclic `@alias`** — a real error, flattened into "not found". The docstrings at
  `:418-419` and `:465-466` acknowledge the alias case explicitly, which means the code already
  knows a distinction it has no way to return.

  **Trigger**: next substantive change to the provider registry or capability resolution path.

  **Scope sketch**: change both return types to `Result<T>`; fail with a message that
  distinguishes the three cases (an unresolvable alias should not read as "model not found");
  update call sites to chain. Note the original sketch pointed at call sites "primarily in
  `apiClient.ts`" — **that file no longer exists**; the callers now live in
  `imageGenerationClient.ts` and `embeddingClient.ts`.

  **Not a P2**: callers currently handle `undefined` defensively, so behaviour is correct today.
  The ambiguity is a latent diagnostic failure, not a live bug.

  **Reference**: PR #329 review — pattern pre-existed the PR, absolved from that review.

## P4 — Doc / minor consistency

- **[P4] `mutableFsTree` `permission-denied for read-only file` test fails when the test container runs as root.**
  `@fgv/ts-json-base` `mutableFsTree` suite — one test expects `chmod`-based read-only enforcement to block a write. When the test container runs as root (the default in the cloud-agent harness), `chmod` is advisory; the kernel lets root write read-only files regardless. Reproduces on the `release` baseline; **not a regression** from any recent stream. Surfaced (and explicitly dispositioned as unrelated) during the `capture-async-result-upgrade` full-repo `rush test` sweep (PR #433).

  **Confirmed still failing, live, 2026-08-14.** Reproduced in this container (`id -u` → 0):
  `npx heft test --test-path-pattern mutableFsTree` fails on
  *`FsFileTreeAccessors › fileIsMutable › returns permission-denied for read-only file`*. Root
  cause verified directly — `fs.accessSync(<0o444 file>, W_OK)` **succeeds** as root, so
  `fsTree.ts:237` never throws and `:245` returns `succeedWithDetail(true, 'persistent')`. The
  test at `mutableFsTree.test.ts:83-94` is unguarded: no `process.getuid` check, no `.skip`.

  **Second symptom the entry missed, and the reason to raise this above pure cosmetics:**
  `fsTree.ts:246` carries `/* c8 ignore next 3 - unreachable when running as root (CI), tested in
  mutableFsTree.test.ts */`. That justification is **self-contradictory** — it excuses itself by
  pointing at the very test that cannot pass under the condition it names. So the debt has
  already leaked out of the test and into a coverage directive with a false rationale, which is
  the kind of thing a later reader will trust. Fix both in the same change.

  **Trigger**: opportunistic — next time the `mutableFsTree` test surface is open, or when CI logs become a meaningful nuisance.

  **Scope sketch**: gate the assertion on `process.getuid?.() !== 0` (skip the read-only-enforcement check under root); or rewrite the assertion to use a `FileTree` adapter capability check rather than relying on `chmod` semantics. Single-test scope; behavior of the production code is fine.

  **Not a P3**: no shipped-behavior impact and no functional regression; this is a sandbox-specific test-environment quirk.

  **Reference**: PR #433 (`capture-async-result-upgrade`) full-repo `rush test` sweep; reproduced on `release` baseline.

