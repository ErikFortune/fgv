# Result — `agent-tasks-t1`

**T1 does not close the stream.** T2 and beyond follow; artifacts stay in
`.ai/tasks/active/agent-tasks-t1/`. Written 2026-09-22.

---

## What shipped

`@fgv/ts-agent-tasks` at `libraries/ts-agent-tasks`, registered in `rush.json` under the
`base-utils` lockstep policy, with two packlets and nothing else. No storage, no broker, no
side effects at import.

**`types`** — branded identities; `ITaskScope` / `IResponsibility` / `ITaskReference`;
`ITaskReason` / `IWaitingReason` / `ITaskProgress` / `ITaskOutcome`; `TaskLifecycle` and its
status-set helpers; `ObservationHealth`; `ISourceBinding` / `ISourceRevision` /
`ISourceProjection`; `RecoveryDeclaration` / `RecoveryResult`; `SourceHistoryDeclaration` and
`ISourceReplayEnvelope`; `ITaskEnvelope` / `ITaskSnapshot<T>`; `TaskFailureCode` / `ITaskFailure` /
`ICapacityFailure` / `TaskResult<T>`; `ICommandRequest` / `CommandState` / `ICommandReceipt` /
`ITaskCommandDescriptor<P>`; `UpdateCategory`; `ITaskFieldBounds`; the A3 capacity model
(`ITaskCapacityProfile`, `ITaskEncodedBounds`, `ITaskPerOwnerLimits`, `ITaskCapacityClaim`,
`ITaskCapacityStatus`, `maximumClosureCharges`, `maximumSettlementCharges`); the registry
interfaces; and `ITaskEnvironmentParams` / `ITaskEnvironment`.

**`converters`** — `TaskConverters.create({ bounds })` builds every converter against one set of
field bounds; `TaskKindRegistry` and `createTaskCommandHandle`; the two built-in kind descriptors;
`TaskEnvironment`; and the primitives (`instant`, the safe-integer family, the bounded
identifier / single-line / text / array factories).

409 tests. 100% statements, branches, functions and lines.

---

## Declared vs exercised, per union

**This is the table the brief asked for, and it is the part to read.** T1's tests exercise
*shapes*. They cannot exercise *choices*. Every row marked **prediction** is a guess about what a
slice that does not exist yet will need, and later slices hold explicit licence to revise it rather
than inherit it.

| union / closed set | members | converter-exercised | what the tests establish | what they cannot |
|---|---|---|---|---|
| `TaskLifecycle` | 7 (`pending` `running` `waiting` `paused` `succeeded` `failed` `cancelled`) | **7/7** | each discriminant converts; each state's required payload is required; unknown status converts to nothing | whether the payload attached to each state is the *right* payload once transitions exist (T5) <br>**T2 (2026-09-22):** first *choice* exercise — the terminal/open partition drives render priority, and each state's payload (reason, `notBefore`, outcome) is what the renderer presents. No member revised. |
| `TaskLifecycleStatus` sets | 7, partitioned 4 open / 3 terminal | **7/7** | the partition is exhaustive and disjoint | nothing — this one is fully settled <br>**T4 (2026-09-23):** the open/terminal partition is now an index key — `(scope, class)` and `(scope, exact status)` ordered sets, and the query converter refuses a status outside its class. No member revised. |
| `ObservationHealth` | 3 (`current` `stale` `unavailable`) | **3/3** | health is independent of lifecycle; `current` cannot carry a failure reason | whether `stale` vs `unavailable` is the distinction reconciliation actually needs (T6) <br>**T2:** `current` vs not-current is a presentation distinction (a non-current observation renders its state and reason); timestamps are telemetry that duplicate-collapse picks the newest of. No member revised. |
| `RecoveryDeclaration` | 3 (`reattach` `host-resume` `not-recoverable`) | **3/3** | each converts; unknown fails | whether three host declarations are enough (T6/T8) <br>**T3 (2026-09-22):** stored on envelopes and preserved through first resolution; no choice exercised (T6). No member revised. |
| `RecoveryResult` | 6 (`reattached` `completed` `resumable` `unrecoverable` `unavailable` `unresolved`) | **6/6** | each converts with its required payload | **prediction.** Nothing in T1 produces or consumes one. The plan's gate-2 row names four of the six ("explicit reattach/resumable/unrecoverable/unavailable recovery"); `completed` and `unresolved` come from design §5 and are the least-evidenced members here |
| `CommandState` | 4 (`rejected` `accepted` `applied` `indeterminate`) | **4/4** | the four do not collapse; `applied` requires its revision; `indeterminate` requires its reason | whether `accepted`'s optional `sourceReceipt` is the right carrier (T6) <br>**T3:** stored inside `IStoredCommandOperation.receipt` and allowed to evolve across maintenance commits while the request stays fixed; storage exercises the *shape*, not the choice. No member revised. |
| `CommandRejectionReason` | 6 | **6/6** | each converts; unknown fails | **partial prediction.** `stop-active` presumes T9's latch and `idempotency-conflict` presumes T3's dedup store; neither exists <br>**T3:** `idempotency-conflict`'s precondition now exists — storage refuses an operation id reused with a different request (as a `conflict` failure, since there is no broker yet to turn it into a rejected receipt). T5 decides whether that surfaces as this reason. No member revised. |
| `TaskFailureCode` | 14 | **14/14** | each converts with a retry disposition; `capacity` detail is coupled to `backpressure` and to nothing else | **prediction for 9 of 14.** Only `invalid`, `unknown-kind-version`, `backpressure`, `conflict` and `not-found-or-denied` have any T1-side meaning; the storage, source, receipt and cursor codes describe slices that do not exist <br>**T2:** `invalid` and `conflict` now exercised for real — `conflict` for input describing one revision two ways, two current revisions, a duplicated category or a too-new update. `invalid-receipt` stays a prediction: it belongs to T7's acknowledgement, not to a pure renderer. No member revised. <br>**T3:** exercised for real — `storage-unavailable` (a write that provably changed nothing, a closed or fenced repository, an empty root), `storage-corrupt` (a record changed or lost out of band), `commit-indeterminate` (write visibility `replaced`/`unknown`, always with its operation id), `unsupported` (a root that cannot honor the mode; lowering limits), `source-gap` (one source revision, two projections), `not-found-or-denied`, `unknown-kind-version`, `backpressure` with capacity detail. Still predictions: `source-unavailable`, `invalid-receipt`, `cursor-stale`, `retention-blocked`. No member revised. <br>**T4:** `cursor-stale` exercised for real (unknown, expired, evicted or other-generation cursor handles; `retry: 'safe'`), and `commit-indeterminate` gains a second producer — an index update that fails after its record committed. `backpressure` deliberately **not** used for the read-concurrency gate: the converter couples it to a capacity dimension, which a working-space limit lacks, so the gate refuses `conflict`/`safe`. Still predictions: `source-unavailable`, `invalid-receipt`, `retention-blocked`. No member revised. |
| `CapacityDimension` | 11 | **11/11** | each converts; the profile names a limit for each; the closeout/settlement computations charge a subset | **prediction.** Which dimension actually fills first is an empirical question M1 answers. The limits are engineering defaults, not measured safe maxima <br>**T4 finding, no revision:** under `defaultTaskCapacityProfile` the earliest limiting dimension for concurrent non-archived tasks is `resident-payload-bytes` — each closeout reserves 7 × 64 KiB = 448 KiB of 64 MiB, so the **147th** registration is refused (measured), far below the 1,000 non-archived limit; `audience-links`/`acknowledgement-ids` bind at 892 and `logical-bytes` at 496. T4's counter cohorts and M1 declare a fixture profile. Whether the default or the reservation arithmetic changes is T8/M1's (see `agent-tasks-t4/result.md`). |
| `CapacityClaimPurpose` | 5 | **5/5** | each variant carries the identities needed to rejoin it after a crash; a claim cannot borrow another purpose's identities | **prediction.** No claim is generated anywhere in T1; T3 is the first slice that mints one <br>**T3: REVISED, 5 → 6 members.** Added `first-resolution`: §8.6 requires an unresolved registration to reserve "first resolution *and* the path through terminal closeout" — two bundles — and five purposes had nowhere to put the first. `terminal-closeout` and `first-resolution` are now minted, spent and consumed for real; the other four remain predictions for T6/T7. |
| `CapacityClaimOwnership` | 2 (`pending` `live`) | **2/2** | transfer keeps the claim id and charges | whether ownership transfer needs a third state during recovery (T3) <br>**T3:** both exercised — `pending` in the inventory entry, `live` in the record, transferred by the same claim ids. **Settled: no third state is needed**; the crash windows between the two are recovered by joining on claim id (open completes a pending entry whose record carries exactly its claims). |
| `CapacityClaimDisposition` | 3 (`reserved` `consumed` `indeterminate`) | **3/3** | conversion is a disposition change, not a charge change | **`indeterminate` is a prediction.** It exists because §8.6 says ambiguity must fence admission; nothing yet produces it <br>**T3: semantics REVISED.** `reserved` and `consumed` now exercised. A reserved claim's charges **shrink** as a protected step spends from them (T1 described conversion as disposition-only, which cannot express a closeout that spends across the terminal transition and the archive). `indeterminate` still has no producer; the ledger fences all growth when one is read from disk, which is tested. |
| `TaskCapacityState` | 4 (`ok` `pressure` `admission-blocked` `draining`) | **4/4** | capacity state is not an index-health state | whether `admission-blocked` and `draining` are two states or one (T3/T8) <br>**T3: settled as two states.** `draining` = some dimension has no headroom; `admission-blocked` = growth fenced regardless of headroom because a claim is `indeterminate`. All four are now produced by the ledger. |
| `SourceHistoryDeclaration` | 2 (`observed-state` `source-replay`) | **2/2** | a replay declaration without a finite envelope is not representable; an observed-state one may not smuggle an envelope in | whether a two-member union survives contact with a real adapter (T6) |
| `UpdateCategory` | 7 | count only | the count is the arithmetic input to closeout | **prediction.** No update is constructed in T1; the seven names come from design §8.3 <br>**T2:** now exercised — `attention` (when required) and non-`progress` categories drive priority, and categories are rendered. T2 enforces one update per `(task, revision, category)`, which bounds a receipt entry to seven update IDs; **T7 must fit baseline obligations to that or revise it.** No member revised. <br>**T3:** update identity is now `taskUpdateId(task, revision, category)` = `<taskId>:<revision>:<ordinal>`, checked on every stored update; the category ordinal is part of the identity, so **reordering `allUpdateCategories` is now a storage-format change.** The update-id bound grew by `maxUpdateIdSuffixLength` (19) so a maximum-length task id still has one. <br>**T4:** the category ordinal also orders the owed-update index key (`task, revision, ordinal`) — in memory only, derived at open, so reordering still changes storage identity (T3) and nothing more. No member revised. |
| `ParentStopPolicy` | 3 | **3/3** | each converts; unknown fails | whether v1's immutability holds (T9) |
| `TrackedTaskCommandName` | 11 | names only | each satisfies the command-name syntax; none is an external `setStatus` | **the parameter schemas do not exist.** Deliberately: they belong to the slice implementing the transitions |
| `TaskListCompletion` | 2 | **2/2** | both convert; unknown fails | whether `all-children-succeeded` needs sub-modes (T5) |

**T3 addendum (2026-09-22).** T3 revised one set (`CapacityClaimPurpose` 5 → 6) and the
semantics of another (`CapacityClaimDisposition`'s charges now shrink as they are spent), settled
`CapacityClaimOwnership` and `TaskCapacityState`, fixed update identity (whose category ordinal is
now on disk), and added storage vocabulary of its own — `TaskCatalogOperationType` (11),
`StoredCommandDispatch` (3), `TaskInventoryRecordKind` (3), `TaskRecoveryIssueCode` (11). Details
and reasoning in `.ai/tasks/active/agent-tasks-t3/result.md`.

**T4 addendum (2026-09-23).** T4 revised no T1 member and no persisted shape. It exercised
`TaskLifecycleStatus` as index keys, `PageCursor` (now an opaque server-held handle token with a
syntax converter; the brand is unchanged), `cursor-stale`, and `maxQueryDescriptorBytes` (first
producer: the normalized query a cursor handle retains). One runtime T3 type widened:
`ITaskRepositoryHealth['state']` gains `'rebuilding'` — never persisted. New closed set:
`TaskLifecycleClass` (3). Details in `.ai/tasks/active/agent-tasks-t4/result.md`.

**Honest summary of the above: 15 closed sets, 101 members, every one shape-exercised and roughly
half of them choice-unexercised.** That is the F1 shape the brief named, and it is why this lands
on an integration branch.

### What was *not* declared, on purpose

- **No `PageCursor` converter.** The brand exists (design §4 declares it); the encoding is T4's,
  and this slice cannot exercise that choice.
- **No `SourceRead`.** Declared in a first pass, then cut on review: it is `ITaskSource.observe`'s
  return type, no T1 gate names it, and nothing here consumes it.
- **No `ITaskSource` or `ISourceCapabilities`.** The source *interface* is T6.
- **No `ITaskUpdate`, `ITaskSummary` or commit-record shapes.** *(T2 has since declared `ITaskSummary`, `ITaskUpdate` and `IUnresolvedTaskReference`, because the renderer's input is made of them; commit records remain T3's.)* Storage is T3. Only
  `UpdateCategory` was pulled forward, because the plan requires closeout charges be computable.
- **No tracked command parameter schemas.** Eleven names, zero schemas. An empty command registry
  is explicitly supported, and the schemas are transition implementation.

---

## Which test establishes which acceptance criterion

| plan acceptance criterion | established by |
|---|---|
| Runtime validation produces the same public shape the type declarations promise | `envelopeConverters.test.ts` — every required field is individually removed and fails; the converted object's key set is compared against the fixture's; each optional field is absent on the minimal envelope and present on the full one |
| Registry erasure uses converter closures, not unsafe generic casts | `kindRegistry.test.ts` — conversion enforces a domain invariant (`width > 0`) that no schema expresses, proving the registered *converter* runs and not a cast; decode/encode round-trips through the registered codec; a failing encoder surfaces under its kind |
| Unknown versions/kinds cannot be treated as validated current types | `kindRegistry.test.ts` — an unknown kind and an unknown *version of a known kind* both fail `toFailWithDetail(..., { code: 'unknown-kind-version' })`; a typed handle refuses both another kind and another version of its own |
| Independent schema versions, and metadata/source ownership, are explicit | `envelopeConverters.test.ts` (schemaVersion 2 rejected; detailVersion validated separately), `valueConverters.test.ts` (a source projection carrying `responsibility` or `scopes` fails — execution fields only), `capacityConverters.test.ts` (`claimVersion` and `profileVersion` each rejected at 2) |
| Bound waiting state contains only opaque host attention references | `envelopeConverters.test.ts` — a waiting reason's attention survives as bare `(namespace, key)` pairs, and a reason carrying a `request` or `answer` fails; `publicSurface.test.ts` asserts no export matches `/inputrequest\|answer\|inbox\|continuation/i` |
| *(review gate)* no task runner, scheduler, executor or retry policy; no storage or broker | `publicSurface.test.ts` — regex assertions over the whole export surface |
| *(A3)* claims are repository-generated, not caller-issued | `commandConverters.test.ts` (a request carrying `capacityClaims` fails), `envelopeConverters.test.ts` (same at the envelope), `publicSurface.test.ts` (no claim-minting export) |
| *(A3)* count/byte schemas make maximum completion and settlement charges computable before acceptance | `types/capacityProfile.test.ts` — both computations are checked term by term against the profile's own maxima, shown to depend on nothing but the profile, and shown to claim no new task identity; and shown to **fail rather than answer inexactly** when a profile's bounds push a product or sum past the safe-integer range |

The plan's named test topics all have homes: envelopes and every discriminant, zone-free and
invalid instants, revision overflow, progress bounds, unknown and additional fields, limits,
unknown kind/version, duplicate registry keys, converter/encoder round-trip, typed handle
mismatch, schema consistency, and command names. Hostile inputs are `unknown`, never `any`.

---

## Review

`code-reviewer` ran on the final diff before the first push, per layer 1.

**P1: none.** Verified clean on `any`, `c8 ignore`, `Result<void>`, converter-closure erasure,
unknown-kind handling, claim unreachability from caller shapes, and the absent input protocol.

**P2 (3), all resolved:**

1. *`ISourceRevision` / `ISourceProjection` / `SourceRead` / `RecoveryResult` are out-of-slice
   gold-plating (T6).* **Partly accepted.** `SourceRead` was cut — the reviewer is right that
   nothing names it and nothing exercises it. The other three stay: the plan's gate-2 row names
   "explicit reattach/resumable/unrecoverable/unavailable recovery" and lists **T1** among its
   slices, and `RecoveryResult` structurally requires the projection and the revision. They are
   recorded above as predictions and `CAPABILITIES.md` now describes them.
2. *`ISourceReplayEnvelope`'s counts reject `0`.* **Accepted and fixed.** §8.6 requires the
   envelope be *finite*, not perpetually non-empty; it shrinks toward zero as accepted work
   finishes, so zero remaining is the state a bounded replay exists to reach. Now
   `nonNegativeSafeInteger`, with a test pinning zero as valid and negative as not.
3. *Imperative `isFailure()` assertions where `toFailWithDetail` applies.* **Accepted and fixed** —
   three sites in `kindRegistry.test.ts`.

**P3 (3):**

- *`TaskKindRegistry.create()` is a vacuously-succeeding `Result`.* **Dispositioned, kept.** It
  matches `TaskConverters.create` and `TaskEnvironment.create`, both of which can fail, and T3
  will give it real validation to do. A non-Result outlier in the family costs more than a
  vacuous success.
- *Built-in kind literals are cast rather than converted.* **Addressed where it can be.**
  `types` cannot depend on `converters`, so the literals stay literals; a test now checks both
  against the library's own `taskKind` converter.
- *`CAPABILITIES.md` omits the source-observation types.* **Fixed**, for what survived the cut.

**Layer 2 — Copilot, round 1: 5 medium + 2 low, all 7 real, all fixed.** Three were genuine
defects rather than polish:

1. **`handle.encode` bypassed the details converter** while `decode` ran it — a
   validate/convert symmetry hole. A JS caller or an assertion could push a `T` violating a
   domain invariant straight through to a successful snapshot. `encode` now validates first,
   with a test that casts an invalid `width` past the type system and watches it fail.
2. **The capacity-status converter accepted duplicate and missing dimension rows.** Two
   `updates` rows cannot both be the used figure, and an absent row reads as "no pressure" —
   the wrong default for an admission input. Now unique *and* complete, naming what is missing.
3. **`maximumClosureCharges` / `maximumSettlementCharges` used unchecked arithmetic.** A
   profile with large encoded bounds pushed a product or sum past 2^53, so the advertised
   *maximum* stopped being exact — silently, in the values admission reserves from. Both are
   now `Result`-valued and fail on an inexact product or sum. **This is an API change to the
   two functions, made before anything consumed them.**

The other four: a throwing injected `newId` escaped the Result-valued seam (`now()` already
captured a throwing clock; `_mint` now matches); the `ITaskKindDescriptor` TSDoc claimed
registration checks schema/converter agreement, which it does not and cannot — walked back to
what ships, naming the fixture obligation the design itself assigns; a README sentence described
reconciliation and delivery APIs in the present tense; and a typo in a test description.

**Layer 2 — Copilot, round 2: one finding, high severity, real.** The `capacityClaims`
collection converter bounded its length but not its identities, so a record could carry two
claims with the same `claimId`. That id is the stable join key §8.6 says recovery reconstructs
reservations by ("after a crash, join by exact ID"), and the safe reading of an ambiguous
reservation is that it is still held — so a duplicate silently double-counts. Fixed, with tests
for distinct claims, an empty collection, two different claims sharing an id, and the same claim
twice.

**It is the third instance of one blind spot.** Round 1 caught duplicate *charges* within a
claim and duplicate *status rows*; I fixed both and still did not check the collection of claims
itself. The pattern — "a bounded array whose entries carry an identity needs a uniqueness
constraint, not just a length cap" — is worth carrying into T3, where these collections are
written and read for real.

**Layer 2 — Copilot, round 3: zero findings *posted*, six real ones in the summaries.** This is
the round worth recording, because the naive reading of it is wrong. Round 3's posted count was
`Findings: None` and it marked the duplicate-claim-id thread resolved. But its summary carried a
**"Previously missed (5)"** block — findings in code that had not changed since the last review,
surfaced in prose and never posted as comments — and round 2's summary carried three more. Six
were distinct; all six were real on inspection, and all six are fixed:

1. **A profile could be admitted that cannot finish the work it accepts.** `updates: 1` converted
   happily while `maximumClosureCharges` asked for seven. §8.6 says in as many words that "lower
   limits must still accommodate the minimum closeout bundle" — design text this slice
   schematized without enforcing. The profile converter now computes both protected bundles and
   rejects a profile whose limits cannot hold them. **The deepest finding of the whole loop**: it
   is the logical-capacity-deadlock case the protected-completion design exists to prevent,
   reachable through a valid-looking profile.
2. **`encode` returned the caller's envelope unchecked.** The round-1 fix made it validate
   *details*; the envelope beside them was still whatever the caller built, so an empty title came
   back as a successful snapshot. It now goes through the registry's snapshot converter. The same
   symmetry hole as round 1, one level up.
3. **Host-supplied `encode` callbacks were invoked bare.** A descriptor whose encoder throws made
   `validate` and `convert` throw, escaping the Result boundary — the same defect as the `newId`
   seam fixed in round 1, in the two places I did not then look.
4. **`commit-indeterminate` did not require its operation id.** The code exists to say "this may
   or may not have happened", and the operation id is the only way to settle it later; the type's
   own TSDoc said so and the converter did not enforce it.
5. **A dimension status could contradict itself** — `used: 10, reserved: 0, available: 0,
   limit: 1`, or a `pressure` flag disagreeing with the threshold the type documents it as derived
   from. `capacityStatus()` is a *trusted* host API, so a row admission cannot believe is worse
   than no row. The accounting identity and the derived flag are both enforced now.
6. **A terminal-closeout claim accepted a duplicate audience id** — the fourth instance of the
   uniqueness blind spot, after charges, status rows and claim collections.

**The process lesson is sharper than any individual fix.** Copilot's *posted* finding count went
7 → 1 → 0, which reads like textbook convergence; its *summaries* went on describing real
defects the whole time. Stopping at round 3 on the posted count would have shipped all six. So:
**read the summary's "previously missed" block, not just the posted comments** — and a round that
posts nothing is not evidence of a clean diff.

**Layer 2 — Copilot, round 4: two real findings and two real doc inconsistencies.**

1. **A claim's audience used a private 256 cap instead of the shared reference bound.** The
   consequence is not cosmetic: `maximumClosureCharges` reserves `maxAudiencePerUpdate` links per
   payload, so an audience above that bound records more obligation than its own claim reserved
   capacity for. Now bounded by `bounds.maxReferences`, which also means a host lowering that
   bound sees it applied here. A test pins the two numbers as equal, so a future divergence fails
   rather than drifts.
2. **`validate()` and the registry's details closure trusted the encoder's *output*.** Input was
   validated; whatever the encoder returned was not, so a descriptor returning a non-JSON value
   produced a success whose value is then stored and deduplicated against. Both paths now run the
   encoder's result through `jsonValue`.
3. **The streams ledger quoted a stale test count**, and **the implementation plan still said
   every T slice was unimplemented** while this PR implements T1. Both corrected — and the ledger
   no longer quotes a count at all, because three copies of a number that changes every round is
   the defect, not the one stale instance.

**The stop call, and why here.** Across four rounds the profile went: three structural defects →
one structural defect → six (summary-only, including the deepest of the loop) → **one consistency
bug, one robustness hole, two doc corrections**. That last profile is the diminishing-returns
signal the discipline describes: no round-4 finding was a hole in the design's guarantees, and the
two doc items are the class that appears when a reviewer has run out of code to object to.
Stopping the Copilot loop here, at four rounds, on finding profile rather than the ten-round cap.

### Layer 2, second reviewer — CodeRabbit, one review: one major finding, and it was the converse of my own last fix

CodeRabbit's single manual review (its auto-review is off for non-default base branches) returned
one actionable major finding, one nitpick, and a docstring-coverage warning.

**The major finding is the instructive one, because it is the mirror image of Copilot's round-4
finding and I had just "fixed" that area.** Round 4 said a claim's audience used a private 256 cap
instead of `bounds.maxReferences`, so I bound it to the shared bound. CodeRabbit pointed out the
other direction was still open: `maxAudiencePerUpdate` in the profile remained any positive safe
integer, so a profile with `maxAudiencePerUpdate: 33` against the default `maxReferences: 32`
validates, and `maximumClosureCharges` *reserves* 33 audience links per payload — for a claim the
converter would then refuse to encode. **Capacity reserved for a claim that cannot exist.**

My round-4 test was part of the reason I missed it: it pinned
`bounds.maxReferences === perOwner.maxAudiencePerUpdate` **for the default profile only**, which
made the invariant look guarded while saying nothing about a custom profile. The fix binds the two
in the `perOwner` converter, where both are in scope, with tests in both directions and for a
lowered bound.

The nitpick was also right and worth taking: `publicSurface.test.ts` had a test named "importing
the library performs no I/O" that enumerated `Object.keys(TaskLib)` and asserted each key exists —
tautological, incapable of failing, and not testing its own name. Removed; the meaningful
no-shared-state assertions (two independent registries, two independent converter sets) carry that
claim.

**Dispositioned, not fixed:** CodeRabbit's docstring-coverage check reports 62.5% against its own
80% threshold. Every *exported* symbol in the package has a doc comment — verified by walking every
`export` in `src/packlets` for a preceding comment block, with zero hits. The shortfall is inline
arrow callbacks, chiefly `withConstraint` predicates. The repo's documentation gates are API
Extractor (zero warnings, report checked in) and the tsdoc ESLint plugin (clean); neither asks for
docstrings on inline callbacks, and adding them would be noise.

---

## Things a later slice must decide

1. **The source-history spelling is not settled in the design.** §5's `ITaskSource.history` is
   `'latest-snapshot' | 'replayable-updates'`; §1 and §8.6 say `'observed-state'` and
   `'source-replay'` for the same distinction. T1 unified on the §8.6 spelling because A3 is the
   authority for the declaration that keys off it. **T6 confirms or revises.** Nothing in T1
   depends on which wins.
2. **`maximumClosureCharges` and `maximumSettlementCharges` are engineering derivations, not
   transcriptions.** §8.6 states *what* must be reserved in prose; the arithmetic — 7 categories ×
   audience for links and acknowledgement evidence, 2 operation slots, schema maxima summed for
   bytes — is T1's reading of it. T3 admits work against these numbers and is the first slice that
   can say whether they are right. If a reservation turns out to be short, the fix is here.
3. **The capacity limits are proposed defaults, not measured safe maxima.** M1 qualifies them.
   `defaultTaskCapacityProfile` says so in its own TSDoc.
4. **Per-owner limits are modelled separately from repository-wide dimensions**
   (`ITaskPerOwnerLimits` vs `TaskCapacityLimits`) because §8.6's table mixes both scopes —
   50,000 acknowledgement IDs *per subscription* and 200,000 across all, 128 operations *per task*
   and 100,000 repository-wide. Whether the ledger wants them in one structure is T3's call.
5. **Record-byte ceilings are per record *type*** (`maxTaskRecordBytes`, `maxConsumerRecordBytes`,
   `maxInventoryRecordBytes`, `maxSourceRecordBytes`) while `record-bytes` is a single admission
   *dimension*. That split is a T1 reading of a table that gives four numbers under one heading.
6. **An upstream robustness gap, escalated rather than fixed.**
   `Converters.strictObject(...).convert()` **throws** rather than failing on a null-prototype
   object, because `ts-utils`' `isKeyOf` calls `item.hasOwnProperty(key)` instead of
   `Object.prototype.hasOwnProperty.call(item, key)`. `JSON.parse` never produces such an object,
   so wire data does not reach it; a host passing an `Object.create(null)` value to a converter
   does. Per the brief, a demonstrated upstream bug is an escalation, not a fix folded in here.
7. **The §8.3 / T6 / T8 executor-payload-dereference question did not reach this slice.**
   `ITaskReference` is opaque identity with no dereference permission, and no T1 type needed
   either answer. Nothing to surface.

---

## Gate results

| gate | result |
|---|---|
| `rushx build` | clean, zero warnings; `etc/ts-agent-tasks.api.md` checked in |
| `rushx lint` | clean; `rushx fixlint` run before the final commit |
| `rushx test` | 409 passed; 100% statements, branches, functions, lines |
| `rush rebuild` (repo-wide) | green — required, since a new Rush project changes the build graph |
| `rush change --verify --target-branch origin/integration/agent-tasks-v1` | change file found |
| `verify-capability-docs.mjs` | router 19,158/24,000 chars, 24/24 libraries documented, 75 reflexes intact |
| `generate-capability-feed.mjs --check` | 0 stale — **the gate this stream tripped; see below** |
| `verify-esm-entrypoints.mjs` | 24 checked, 0 failed |
| `verify-bundler-resolution.mjs` | 20 checked, 0 failed |
| `verify-tarball-exports.mjs` | 26 packages, 205 manifest paths, 0 failed |

A repo-wide `rush test` was run, because CI runs one and a red push costs a cycle. The
argument for skipping it still holds on the merits — this slice adds a package nothing consumes
yet, so it widens no existing function's accepted set and there is no downstream assertion to
move — but "the applicable gate" is whichever gate CI actually runs.

### The gate this stream tripped, and why the checklist did not catch it

**`generate-capability-feed.mjs --check` is a CI step that no local checklist named, and it went
red on the first two pushes.** A new package's `CAPABILITIES.md` ships empty
`<!-- BEGIN/END GENERATED: recent-additions -->` markers; the generator considers that *stale*
until it has written the content itself — here, the line saying no stream has recorded a
`sourceLine` against the package yet. Running the generator and committing its output is the fix.

It belongs with the change-file gate in the family of traps this repo already documents: **it is
invisible to the entire local build/lint/test loop, and it keys off a file existing rather than a
surface changing.** The stream brief listed four export/capability gates to run locally and this
was not among them, which is precisely how it got missed — so the durable form of this lesson is
"read `.github/workflows/ci.yml` and run *every* step it runs", not "remember the feed gate". The
full list, for a later slice: `rush change --verify`, `rush install`, `rush rebuild`, `rush test`,
`verify-capability-docs`, `generate-capability-feed --check`, `verify-esm-entrypoints`,
`verify-bundler-resolution`, `verify-tarball-exports`.

**A new package is the shape that trips it**, because an existing package's markers were filled in
long ago. T2 and later slices will not hit it for `ts-agent-tasks` again.

`rushx coverage` (the `jest --coverage` script) fails with a babel-parser error on every TS test
file. Reproduced on the already-shipped `ts-prompt-assist`, so it is pre-existing tooling rather
than this package; `rushx test` carries the coverage gate.

---

## One shape worth keeping

The only coverage gap this slice produced was a redundant empty-string check inside
`boundedSingleLine` — `singleLine()` already rejects empty. Running the scenario tests *before*
chasing coverage is what surfaced it as a branch that should not exist rather than as a line
needing a `c8` directive. There are no coverage directives in this package.
