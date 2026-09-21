# Agent tasks — phased implementation plan

**Status:** durability boundary and bounded stop presets approved 2026-09-21; awaiting explicit authorization to implement.
**Date:** 2026-09-21. **Source inspection:** `d0ec601c6d67a6016a00a33a69ddee18bec6ddb1`.
**Engineering contract:** [development design](development-design.md).
**Scope authorities:** [library proposal](fgv-library.md), [adoption proposal](multi-agent-chat-adoption.md), [deferred scope](deferred.md).

This plan changes no production code or consumer repository. Every test below is **planned**, not run. Source/document review is the only evidence available at this stage. The slices are dependency-ordered review units; an incomplete internal slice is not a release claiming all task guarantees.

## 1. Decisions and approval status

Adopt `@fgv/ts-agent-tasks` at `libraries/ts-agent-tasks`, one package with integration packlets. Use generic scopes, a single-writer broker, stable task-ID storage, typed kind/command registration, native state plus owed updates in one atomic task record, exact per-consumer acknowledgements, resident query indexes, and explicit source reconciliation. Keep the tracked/list/external helper built-ins and the snapshot-only entry point. Reassignment is included from the first broker release and never changes execution binding.

Both material recommendations were approved on 2026-09-21:

| Approval | Recommended decision | Consequence of a different decision |
|---|---|---|
| A1 — approved 2026-09-21 | Process-crash survival on qualified local Linux/macOS Node FileTree roots; file and directory flushes before acknowledgement. OS-crash and power-loss survival are excluded; reject requests for those guarantees and unqualified backends. | Stronger guarantees or additional platforms require separate design/qualification. Approval sets the intended contract; it does not replace implementation evidence or passing crash tests. |
| A2 — approved 2026-09-21 | Include bounded cascade pause/cancel as a best attempt with an observable result: persisted intent, explicit partial effects/blockers, stable-stop source opt-in, and frozen subtree admission while latched | Acceptance remains distinct from completion. No all-or-nothing execution promise; no silent skipped children or weakening of intent/recovery requirements. |

Package naming, lifecycle vocabulary, strict schemas, pagination and receipt issuance are reasoned technical recommendations, not open product discovery. Document acceptance may approve them together. Consumer rollout choices below remain the consumer's responsibility and do not block standalone library implementation.

## 2. Traceability of every library gate

| Proposal gate | Proposed resolution | Implementation slices | Required review evidence |
|---|---|---|---|
| 1. Name/location/built-ins | One `libraries/ts-agent-tasks` package; tracked, list, external helper; root exports; no agent-memory/runtime consumer dependency | T1, T2, T5, T6, I1, I2 | Dependency graph/API report; standalone use through exports |
| 2. Lifecycle/command/recovery unions | Seven lifecycle states; terminal absorption; independent observation health; rejected/accepted/applied/indeterminate receipts; explicit reattach/resumable/unrecoverable/unavailable recovery | T1, T5, T6 | Transition table, typed fixtures, source-vs-native authority tests, ambiguous-dispatch tests |
| 3. FileTree atomic/durable dependency | Add optional FileTree atomic capability; preserve ordinary saves; same-directory temp/flush/replace/directory-flush; one-task state+obligation commit; ordered inventory creation; A1 bounds guarantees | **F1, F2 before T3 durable path**, T3, T8 | Leaf fault matrix, actual Node subprocess interruption evidence, no business-layer filesystem bypass, exact acknowledgement boundary review |
| 4. Source revisions/reconciliation/migration | Opaque epoch/token with source comparator; stale/same-conflicting/incomparable handling; terminal-inclusive discovery; checkpoint only after page projection commits; catalog owns relationships; explicit version migration | T1, T3, T6, T8 | Complete/partial/gap cases, old-page replay, terminal outage recovery, unknown-version preservation |
| 5. Consumer checkpoints/retention | Pure renderer; bound delivery service persists exact issued receipt manifests; atomic exact-ID acknowledgements; task cleanup follows durable checkpoints; explicit dispositions; no TTL loss | T2, T7, T8 | Cross-consumer forgery/replay, omitted earlier obligation, crash at every boundary, cap/backpressure tests |
| 6. Input protocol | **Closed by agreement: deferred.** Waiting/attention references only | T1, T2, I1 | Export/schema audit: no create/answer request API, inbox or continuation service |
| 7. Prompt cache | Final `PromptLibrary.resolve` with composition; one trailing per-request task slot; positive availability and diagnostics checks; final system body/offset identity | I2, P1 | Progress-only A/B, empty tasks, UTF-16 offsets, unavailable-empty-findings negative control, actual request-body assertions |
| 8. Indexed repository queries | Scope/lifecycle/status union sets, assignee/parent/source indexes, ordered due candidates, independent owed-terminal lookup, keyset paging bound to query/generation, fail-closed rebuild | T3, T4, T5, T8 | Counter-based query-performance tests as terminal history grows, mutations/rebuild/page invalidation tests |
| 9. Cascade stops | Authoritative transitive subtree+root work; per-target current authority/capability; durable latch and operation IDs; partial effects; standing admission freeze; A2 | T9, P1 | Observation-only blockers, source stability declaration, root/child crash windows, overlap/release, new admission rejection |
| Reassignment (unnumbered but required) | Revisioned broker metadata change; stable identity/address/source; independent parent/child responsibility; B explicitly initializes context; A obligations remain or receive disposition | T4, T5, T7, T8, P1 | Parent A→B during child execution, stale writes, revoked authority, actor-local source resolution, separate acknowledgements after reopen |
| Receipt ownership (already settled) | Renderer is pure in both modes; only bound service/checkpoint store mutates acknowledgements | T2, T7, I2 | Snapshot-only render has no store, pure-repeat equality, no model acknowledgement tool |

No numbered gate is left to an implementer to “discover later.” A1 and A2 are approved decisions; their implementation and qualification gates remain mandatory. Implementation may expose a new contradiction; stop that dependent slice and amend the design openly rather than weakening its acceptance criteria.

## 3. Upstream FileTree slices

### F1 — Optional atomic-write contracts and session implementation

**Dependencies:** design approval; A1 fixes the advertised guarantee vocabulary. **Affected package:** `ts-json-base` only.

**Deliverables:** optional atomic accessor/directory interfaces, classified result types and capability guards; directory delegation; additive exports in Node/browser barrels; atomic session replacement in in-memory accessors; API/CAPABILITIES documentation that separates method presence, writability, atomic visibility and durability. No changes to ordinary save behavior or required members on existing base interfaces.

**Acceptance:** task code can perform an atomic child write through an injected directory without native paths/accessor internals. A read-only or unsupported tree fails explicitly. In-memory never advertises process-crash survival. Unsupported guarantees fail before changing data. Every existing accessor still typechecks without implementing the optional interface.

**Tests:** accessor/item guard distinction, delegate unsupported branch, per-path permissions/mutability filter, existing/new file, invalid child names, unchanged old value on failure, requested-guarantee mismatch, byte-vs-text read differences. Re-run existing FileTree suites; search all implementers/test doubles, including web/extras/sample packages.

**Review gate:** stable-surface compatibility and browser import review; public API Extractor diff; shared-contract build gate. This is the **first implementation slice**, after explicit approval. It does not claim a durable task repository.

### F2 — Node atomic replacement and process-crash qualification

**Dependencies:** F1, A1. **Affected package:** `ts-json-base`; CI configuration only if necessary to run the approved platform matrix.

**Deliverables:** Node leaf protocol with exclusive sibling temp creation, complete write, file flush/close, same-directory replacement, directory flush, and precise unchanged/replaced/unknown error classification; qualified-root capability inquiry; reserved-temp cleanup/reopen policy. Ordinary saves remain unchanged. Publish the tested runtime/OS/filesystem matrix and unsupported cases.

**Acceptance:** no interrupted replacement tears the previous accepted record; creation/replacement success waits for the declared boundary. Post-replace failure cannot be mistaken for nonapplication. No unlink-before-replace, copy fallback, or silent durability downgrade. Unqualified platform/root requests fail. No OS/power-loss claims emerge from process-kill evidence.

**Tests:** leaf fault injection at open, partial write, file flush, close, rename, directory flush, cleanup and readback; real Node temporary-directory tests; child-process termination synchronized to protocol boundaries rather than sleeps. Include first creation, replacement, orphan temps, disk/permission failures, destination directory/symlink rejection, read-only/mutability filters, and retry after ambiguous replacement. Use a typed internal filesystem boundary/test harness, not new public fault-injection flags or task-level filesystem bypasses. Actual Node tests complement, not replace, injected failures.

**Review gate:** persistence/fault-model review and 100% FileTree coverage after functional review. Record exactly which guarantees each test proves. Block durable T3 until F2 passes on the release's claimed matrix; do not mark missing platform evidence “passed.”

## 4. Task foundations and storage

### T1 — Package, values, converters and registry

**Dependencies:** approved model; F1 contract available. **Affected package:** new `ts-agent-tasks`; Rush project/dependency/version-policy configuration via normal tooling.

**Deliverables:** package scaffold, root exports, types/converters packlets, bounded common envelope, lifecycle/observation/command/recovery unions, versioned detail and command registration, typed handles, Result-valued factories, injected clock/ID/logger contracts. Built-in tracked/list detail schemas; no storage side effects at import.

**Acceptance:** runtime validation produces the same public shape the type declarations promise; registry erasure uses converter closures without unsafe generic casts. Unknown versions/kinds cannot be treated as validated current types. Independent schema versions and metadata/source ownership are explicit. Bound waiting state contains only opaque host attention references.

**Tests:** valid/invalid envelopes and every discriminant, zone-free/invalid instants, revision overflow, progress bounds, unknown/additional fields, limits, unknown kind/version, duplicate registry keys, converter/encoder roundtrip, typed handle mismatch, schema consistency and command names. Use malicious property/shape inputs as `unknown`, not `any`.

**Review gate:** public contract/dependency review; no deferred input protocol, task runner, source-specific fields or consumer vocabulary. API report and package capability entry describe proposed shipped values accurately when this slice later lands.

### T2 — Pure context and snapshot-only use

**Dependencies:** T1. **Affected package:** `ts-agent-tasks` context/converters.

**Deliverables:** deterministic selection/rendering, current/update/attention fragments, budgets/omissions, pure inclusion receipt and safe bounded projection seam. This is a complete usable snapshot-only entry point without a broker.

**Acceptance:** same validated input/budget produces same output; no filesystem/clock/random/checkpoint calls. Only actual included revisions/update IDs appear in receipts. Required delivery payload that does not fit remains unacknowledged. Partial visible trees never establish parent completion. Treat task prose as data.

**Tests:** overlapping scopes already reduced to duplicate snapshots, duplicate conflicting revision data, all budget boundaries including framing reserve, depth omissions, unknown totals, empty data, partial/nonexhaustive input, multi-revision required updates, truncation of results, hostile task text/Mustache/control characters, and snapshot receipts without event history. Spy on injected dependencies or module boundaries to establish zero writes, not merely equal final checkpoints.

**Review gate:** disclosure/omission and receipt semantics; pure API independent of live infrastructure.

### T3 — FileTree records, durable commit and reopen

**Dependencies:** T1, **F2**. **Affected package:** `ts-agent-tasks` storage.

**Deliverables:** injected-root session/durable factories; private single-writer coordinator; strict JSON storage records; flat repository inventory; ordered record registration; one-task state/update/operation atomic replacement; inventory-backed missing-record detection; diagnostic recovery handle. Use the same repository implementation with in-memory and Node adapters.

**Acceptance:** no durable success precedes the new FileTree boundary. Each accepted mutation has complete current state plus owed-update data and dedup evidence. Canonical addresses are task-ID based. Open never initializes over a missing/corrupt manifest or starts source execution. Pending registration has explicit recovery behavior. Unknown data is retained without lossy rewrite.

**Tests:** absent/empty/nonempty root initialization, missing manifest, pending/live creation permutations, repeated operation identity, full-record replacement failures, corrupted JSON/UTF-8, filename/ID mismatch, missing named task/consumer, unknown schema/kind/source, archive tombstones, duplicate in-process root instances. Crash acceptance matrix runs through the real Node FileTree path; no mocked successful store substitutes for it.

Also cover separate record-vs-task revisions, stale receipt/pruning maintenance, writer-handle lifetime/nesting, and callback failure after an earlier committed replacement (no rollback claim). Register an unavailable external source as an unresolved reference without invented lifecycle; its first observation must preserve identity/catalog metadata and atomically establish state plus obligations.

**Review gate:** inspect task commit contents and return ordering; validate each crash window against design §8.4. Release remains blocked until indexed behavior in T4 and durable obligations in T7–T8 are complete.

### T4 — Indexed selection, paging, due and outstanding discovery

**Dependencies:** T3. **Affected package:** `ts-agent-tasks` storage/query modules.

**Deliverables:** resident summary and secondary indexes for scope/class/status, assignee, parent, source identity and ordered due selection; separately indexed owed updates; rebuild/generation/health; bounded keyset pagination contract.

**Acceptance:** native mutation updates every affected index before success. Index failure after record commit fences queries and reports indeterminate commit until rebuild. Warm summary queries perform no task-file reads. Terminal obligations stay discoverable after leaving open work. Rebuild is explicit, never a healthy empty result. Custom repositories have a reusable conformance suite.

**Tests:** scope unions/dedup before paging; exact-status/class compatibility; due absent/equal/before/after cutoff; remaining non-time prerequisites; parent/reassignment/source dedup index changes; all page boundaries; cursor query mismatch, restart and concurrent mutation; tombstone removal; rebuild after interrupted record/index update. Hold open/matching sets fixed while growing unrelated retained terminal records through 0, 1,000 and 10,000; assert candidate visits and record reads, not environment-dependent milliseconds. Due tests grow future/nonmatching candidates independently. `listOwed` must not scan terminal history.

**Review gate:** algorithm/data structure inspection plus counter evidence. An implementation that filters a full `listEntries()` array fails even if a small fixture is fast.

## 5. Broker and delivery

### T5 — Bound authority, tracked hierarchy and reassignment

**Dependencies:** T1, T3, T4. **Affected package:** `ts-agent-tasks` broker/implementations.

**Deliverables:** host-bound views and sanitized projections; create/update tracked work; task-list completion; scopes and graph integrity; current authority and policy-epoch checks; revisioned responsibility operation with assignment updates. Typed direct API with no native business I/O.

**Acceptance:** parentage, responsibility, visibility and authority remain independent. One writer rejects stale updates and serializes parent changes against cycle checks. List completion uses the complete authoritative child set. Reassignment preserves ID, record path, children, scopes, results and source binding; it updates only responsibility plus revision/operation/update metadata. An observation-only external registration permits authorized catalog reassignment.

**Tests:** exhaustive tracked transition table; duplicate/no-op mutation; self/cyclic/missing parents; cross-source children; empty/manual/automatic lists; hidden/partial children; policy revocation between check and commit; foreign IDs; fabricated principal/scope filters; projector failure without full-data fallback. Concurrent A→B versus stale A write; no implicit child reassignment; no artifact/visibility grant; source lookup still targets original actor-local store. Tools are not required yet to exercise the authority contract.

Crash after the last child succeeds but before list completion; reopen must rebuild a completion candidate and the authorized host pump must recheck current membership/stops before completing it. An unresolved child prevents completion. Test terminal/archived graph-edge immutability and parent resolution through tombstones.

**Review gate:** threat-model/ownership pass, authorization at every read and mutation boundary, source metadata immutability.

### T6 — Source adapters, commands and reconciliation

**Dependencies:** T5. **Affected package:** `ts-agent-tasks` implementations/broker/storage.

**Deliverables:** external helper with typed projections/commands, source revision comparator, optional push hints, explicit paged reconciliation and recovery, source cursor storage, native/external operation receipts and safe uncertain-outcome handling. Include deterministic controllable and observation-only test sources.

**Acceptance:** source owns execution truth; broker never sets external status optimistically. Accepted differs from applied. Outage/missing implementation does not fail execution. Terminal reconciliation works after missed publication. Old pages and commands deduplicate; unsupported/non-idempotent uncertain dispatch is held rather than replayed. Source cursor advances only after committed projections. Restart opens storage without external side effects.

**Tests:** ordered stale/duplicate/conflicting-same-token/incomparable-epoch observations; push-vs-poll ordering; source without history; active-only reconciliation rejected for required terminal discovery; source save before missed publication; page failure/cursor replay; all recovery union outcomes. Commands: denial, unsupported, source conflict, accepted then applied, deterministic source-key duplicate, same key/different payload, changed principal, lost response, failure persisting result, revocation before retry, source dedup-key expiry and non-idempotent uncertainty. Reassign during an in-flight source command and prove result merge preserves new metadata.

For unchanged source revision with later `observedAt`, prove freshness refresh is not a semantic-contract violation. For a replayable source, deliver a latest revision-3 hint before required feed revision 2 and prove the feed commits revision 2's obligation before advancing projection to 3. Neither command observations nor ordinary polling may bypass that cursor order.

**Review gate:** no blind re-execution and no second authoritative lifecycle store. Verify the simulated source actually applies commands; the ingestion compatibility adapter's empty command set supplies no command evidence.

### T7 — Subscriptions, exact issued receipts and acknowledgement

**Dependencies:** T2, T5, T6. **Affected package:** `ts-agent-tasks` delivery/storage.

**Deliverables:** explicit consumer/subscription identity and start policies; serialized baseline creation; candidate audiences committed with updates; broker preparation around pure rendering; injected checkpoint store; exact issued-receipt manifests, expiry/pins and durable exact-ID acknowledgement.

**Acceptance:** no subscribe/mutate gap, no renderer write, no global read flag. Ack only exact library-issued inclusion under the current bound consumer/policy. Old and truncated receipts cannot consume newer or omitted obligations. Issuance failure returns no acknowledgeable context. Host processing precedes checkpoint commit. B's baseline is independent of A's acknowledgements.

**Tests:** concurrent baseline creation/task terminal transition; explicit current/from-now starts; baseline capacity failure; update between capture and issuance; update during model/host processing; scope revocation before prepare/ack; fabricated delivery ID; modified task/revision/update list; shortened/enlarged receipt; foreign consumer/subscription/store receipt; unissued snapshot receipt; duplicate entries; replay before/after ack and after expiry. Omit a revision-3 attention change, include revision-4 progress, and prove ack does not clear revision 3. Simulate host/provider abort and deliberate abstention policies separately. Reassignment with two consumers must leave checkpoints independent after reopen.

An open-only subscription must retain its terminal exit update; parent/status-filtered subscriptions must retain required exit updates after reparent/transition. Pending delivery uses stored audiences, not current selection membership. Reopen under changed host defaults and verify the persisted delivery policy stays authoritative; reject selection changes/admission incompatible with a required source-replay guarantee.

**Review gate:** adversarial receipts and checkpoint custody; verify exact-ID logic rather than max revision, and fail-closed behavior of custom checkpoint stores.

### T8 — Retention, backpressure and recovery journeys

**Dependencies:** T3–T7. **Affected package:** `ts-agent-tasks` storage/delivery/broker.

**Deliverables:** explicit obligation disposition/consumer closure, safe progress coalescing, issued-receipt pins, tombstone archive, bounded capacities/backpressure, end-to-end reopen reconciliation, recovery reports and index repair. Keep physical deletion/compaction out of initial scope.

**Acceptance:** no undelivered required terminal/attention update expires; transient hints can expire harmlessly. Checkpoint commits precede update pruning. Consumer corruption blocks cleanup. Closed/revoked subscriptions retain or explicitly dispose obligations. Unknown source/kind does not erase the task. Bound state/operations do not silently evict dedup evidence. Durable registration plus observation obligations survives all qualified process-crash windows.

**Tests:** failure before/after checkpoint replace, after acknowledgement before response, before/after task update cleanup; source cursor lag; observer throwing; terminal work outside open list; temporary source outage; stale checkpoint store; deletion/corruption of required files; issued payload versus coalescing; max-record/issuance/obligation/dedup capacities. Required updates survive simulated transient-notice TTL. A actor removal preserves original source binding or surfaces unavailable, never redirects to B. Test initial creation and repeated replacement through subprocess restart, not just serial close/open.

**Review gate:** independent persistence/delivery antagonist pass; every recovery case must be either preserved state/obligation, explicit incomplete operation, or explicit error—never unexplained absence. This closes durable library correctness before integration polish.

### T9 — Persistent cascade stop with admission enforcement

**Dependencies:** T5, T6, T8, A2. **Affected package:** `ts-agent-tasks` broker/implementations/storage.

**Deliverables:** root+transitive target capture, persisted latch/target operation identities, bounded host-driven reconciliation, current per-target authority, classified partial outcomes, stable-stop source declaration and explicit pause-latch release. Full hierarchy admission gate enforced on reopen before mutations.

**Acceptance:** root own work and all authoritative descendants are accounted for; no visibility-filtered traversal. Open observation-only children block satisfaction. Supported children may stop while other children remain blocked, with no rollback claim. Accepted commands remain pending until authority confirms quiescence. New subtree admission/reparent/start/resume is rejected under a latch. External autonomous restart violates the stable-stop contract and degrades satisfaction visibly.

**Tests:** every stop target state, root own execution, deep trees/target limit, hidden-but-delegated target, revoked authority on resumed pump, unsupported and unavailable children alongside already applied effects, source accepted/pending/indeterminate, real child stop vs mere receipt. Nested `none`, overlapping pause/cancel, stronger cancellation, release of one of multiple latches, pending pause release with commands in flight, terminal cancel membership. Crash after root intent, after child command commit/effect, before root summary and satisfaction; recover by child operation IDs. Concurrent attachment before/after latch, attachment below descendants, reparent out/within, newly discovered external child, and attempts to bypass via update tools. No timer or work-start behavior in the pump.

Exercise paused→waiting as well as start/resume against the stopped-state invariant. A definitely rejected revision-conflict attempt gets a new persisted attempt/key; an uncertain attempt retains its original request/key. Revalidate persisted source stop-contract evidence after restart. Archive a fully satisfied cancel into a settled summary with retained graph closure; a blocked cancel must not become a successful archived stop.

**Review gate:** semantic review against design §10 plus the cascade adversarial journey. A standing guarantee is withheld for sources without the stable-stop contract; no “success with skipped child” fallback.

## 6. Integration and proving ground

### I1 — ai-assist tool factory

**Dependencies:** T5–T8 (T9 only for opting into stop tools). **Affected package:** `ts-agent-tasks` tools. No ai-assist provider changes expected.

**Deliverables:** read-only defaults, explicit tracked/reassignment mutation opt-ins, statically generated typed command tools, bounded outputs, schema revalidation inside execute.

**Acceptance:** no principal/scope/consumer overrides in schemas or execution; direct calls with surplus fields fail. Model cannot call ack, change source binding, set external lifecycle, or acquire authority. Capability checks remain live. Tool schemas encode registered parameter types rather than arbitrary payload objects.

**Tests:** `JsonSchema.toJson` wire assertions; execute malformed arguments without the harness; foreign task/parent IDs and hidden child traversal; forged actor/scope fields; revoked command authority; disabled mutation tools; command schema/name collision; result bounding/projector failure; tracked and simulated external command outcomes. Capture ai-assist outbound request and assert tools were really sent—mocking a tool-call response alone is inadequate.

**Review gate:** reuse of `IAiClientTool` and memory-tool precedent without its permissive full-body fallback; read-only use has no mutation dependency.

### I2 — Prompt fragments and final composition check

**Dependencies:** T2, T7, I1. **Affected package:** `ts-agent-tasks` prompt. Existing ts-prompt-assist/ai-assist are consumed unchanged unless a demonstrated upstream bug requires a separately reviewed fix.

**Deliverables:** reusable fragment/descriptor factories, literal substitutions, final checked resolve/cache-request helper, host receipt handoff example. One trailing per-request task-context slot after the intended stable prefix.

**Acceptance:** composition is positively available; emitted system text equals the analyzed body; full issued task context is included exactly once. Required cache-ordering/refutation findings are handled; no claim about actual provider hits. Receipt is never in prompt text or silently acknowledged by composition. A changed/dropped task slot prevents acknowledging its original receipt.

**Tests:** two requests changing progress only; stable prefix and exact UTF-16 breakpoints unchanged; empty task set, repeated text, Unicode/astral characters, post-analysis suffix/prefix mutation, enforced slot override, missing or repeated task slot. Deliberately unavailable composition with empty findings must fail. Intentionally cache-hostile placement and false frozen declaration must trigger checks. Threshold-unknown is classified, not treated as generic failure or proof. Use real PromptLibrary and final request builder, not fabricated composition metadata; assert outbound system body and breakpoint plan.

**Review gate:** prompt trust framing, composition availability, exact inclusion and outbound-wire evidence. `HorizontalComposer` output alone cannot satisfy this gate at the inspected baseline.

### P1 — Credential-free public-API proving ground

**Dependencies:** T8, T9, I1, I2. **Affected packages:** `samples/testbed` and `ts-agent-tasks` public contract/journey tests.

**Deliverables:** `samples/testbed/src/scenarios/agentTasks` scenario, registered through the existing scenario registry; testable core plus thin Node CLI bootstrap. Inject a fixed clock and deterministic ID factory, in-memory FileTree or a host-created temporary Node root, and an explicitly advanced simulated external source. No credentials, network, downloads, model weights, sleeps or real-time race oracle. Use exported APIs only; simulation implementation remains test/example code.

**Journey:**

1. Create a tracked research plan A owns, a tracked waiting child with an opaque host attention reference, and a simulated running external child with typed details. Register overlapping project/personal scopes and show deduplicated views.
2. Start two independent subscriptions; render current work using both broker-backed and snapshot-only APIs. Show that both return pure receipts and rendering changes no checkpoint.
3. Invoke real tracked and simulated external command handlers through typed tools. Exercise rejected, accepted, applied and indeterminate results; demonstrate source-key duplicate suppression and refusal to resend an uncertain non-idempotent command.
4. Prepare A's bounded context, advance external progress and complete the child while that context is in flight, then acknowledge only its included IDs. Show the newer terminal update still pending after it leaves open work. Show an omitted earlier attention update also remains pending.
5. Reassign the parent A→B while the external child runs in a separate branch of the deterministic journey. Prove same task path/ID/source, unchanged child responsibility/scopes, stale A revision conflict, explicit B starting context and independent checkpoints. Reopen and resolve the original source reference.
6. Demonstrate due candidates on both sides of a supplied cutoff without changing lifecycle. Grow retained terminal history and show measured query work remains tied to matching candidates.
7. Request cascade pause with one observation-only blocker and one controllable child. Show partial effects, durable blocked intent and rejected new admission. Reopen, reauthorize reconciliation, resolve the blocker under explicit host action, and show release/resume are separate operations. Separate scenario branches cover cancel and uncertainty.
8. Reopen durable state and reconcile running, completed, temporarily unavailable and unrecoverable external work. Recover missed publication/owed outcomes without starting duplicate execution. Fault-injection suites, not the example's happy-path text, establish crash claims.
9. Resolve the final prompt with real prompt-assist composition; capture the ai-assist request without making a network call. Change only progress and compare stable prefix/breakpoints. Reject foreign/modified receipt attempts and show normal valid replay.

**Acceptance/tests:** deterministic structured journey assertions accompany readable CLI output. Every claimed behavior is asserted through public APIs; a “VERIFIED” printed label is not evidence by itself. Unit-test the scenario core and smoke-test CLI registration/output with fake host interfaces. Live models remain optional future demonstration, outside this plan.

**Review gate:** portability and adversarial end-to-end review. No dependency on multi-agent chat or memory infrastructure; ingestion observation does not substitute for command proof.

## 7. Consumer compatibility decisions — explicitly not implementation authorization

All ten remaining adoption gates are accounted for here. These are proposed handoff resolutions or explicitly unresolved host decisions, not changes to the consumer.

| Adoption gate | Library compatibility / proposed host resolution | Status before consumer adoption |
|---|---|---|
| 1. Source registration, reconciliation, terminal discovery | Map original store/job to one stable task; durable source revision plus terminal-inclusive replay/query; evaluate actual authoritative save boundary | **Unresolved host implementation choice.** Library T6 contract/proving source supplies compatibility evidence only. |
| 2. Visibility and responsible wakeup recipient | Host constructs authorized agent+shared-scope union and selects recipient; responsibility metadata may help but is not scheduling | **Unresolved host policy**, outside FGV. |
| 3. Human priority, occupancy, abstention | Host must test human arrival during background work and define intentional-abstention success boundary before enabling wakeups | **Unresolved behavior gate**, blocks proactive consumer rollout, not FGV. |
| 4. Trigger provenance/re-entry | Carry task/update IDs in a distinct task-change trigger; preserve existing authority/loop constraints | Proposed direction; **host design/re-entry tests still required**. |
| 5. Job/announcement migration | Backfill stable bindings/current state; announcement-attempt is not acknowledged; initialize each consumer explicitly | Proposed safe rule; **host migration/backfill strategy unresolved**. |
| 6. UI/wire/rollout | Follow existing four bounded journeys: view, awareness, proactive response, recovery/cutover; every enabled behavior reachable in existing UI | **Host wire/UI/rollout choices unresolved**; no generic dashboard required. |
| 7. Fragment placement/cache | Adopt final-body checked composition from I2; inspect any host post-composition mutation | Library pattern resolved; **consumer final-prompt verification still required**. |
| 8. Repository choice and indexes | Either FileTree default or conforming host repository; preserve authoritative source write-admission checks | **Host storage choice unresolved**; T4 conformance suite is the gate, not compulsory migration. |
| 9. TTL-only delivery replacement | Durable source/broker obligation lasts until ack/disposition; expiring notices are optional hints | Recommended resolution; **host cutover/retention migration still required**. |
| 10. Reassignment/actor removal/checkpoints | Stable source binding independent of assignee; host preserves original source store/access; B starts explicitly, A retains/disposes own obligations | Library contract resolved; **host actor-removal/access policy unresolved**. |

The ingestion adapter advertises no execution commands. It can validate current/terminal projection, scoped visibility, indexing and receipts. It cannot demonstrate cancellation, pause, retry, reliable cascade completion, or execution migration. Human-input request/answer protocols stay deferred in all journeys.

## 8. Cross-cutting validation and release gate

Each implementation slice starts with behavior-driven positive, negative, boundary and integration tests. Run the repository's `code-reviewer` pass **before** closing coverage gaps; resolve findings, then reach meaningful 100% statements, branches, functions and lines in each affected package. Use `@fgv/ts-utils-jest`, Result assertions and setup-only throwing. Do not paper over failures, add public test-only exports, or use coverage ignores without the repository-required approval. Use typed lower-boundary fakes to inject real error paths; do not fake a Result implementation or mock away the contract being tested.

Release-blocking suites:

| Suite | Must prove |
|---|---|
| Values/typed extensions | All boundary converters/unions and command/detail schemas are sound; no unsafe type escape |
| Storage fault matrix | All creation/replacement/acknowledgement crash windows; old/new complete records; inventory detects missing accepted data; accepted state+owed update inseparable |
| Authorization/adversarial scopes | Tool schema and execution enforcement, foreign IDs, hidden traversal/counts, revoked memberships/subscriptions, fail-closed projection |
| Concurrency/idempotency | Stale native writes, metadata/source interleaving, key reuse with changed payload, uncertain external outcomes and safe recovery |
| Reassignment | Stable identity/address/source and child responsibility; incoming baseline; independent prior/outgoing obligations after restart |
| Receipts/retention | Actual inclusion, forged/foreign/replayed/expired receipts, old omitted obligations, new in-flight revisions, no pre-processing ack, explicit disposition/backpressure |
| Reconciliation | Stale observations, incomplete source history, terminal discovery, source checkpoint crash ordering, unresolved implementation and corruption |
| Cascade | Authoritative full subtree, root own work, unsupported/refused/unavailable children, partial effects, restart, overlaps/release, frozen admission and stable external stop |
| Query performance | Counter invariants under growing unrelated history; paging/dedup/due correctness and fail-closed rebuild |
| Prompt/wire | Available real composition, cache ordering/refutations, exact outgoing system/tool definitions/breakpoints, progress-only stable prefix |
| Credential-free journey | The exported API composes into useful tracked+external workflows without model/provider/consumer services |

For code slices, run `rushx build`, `rushx lint`, `rushx test` and coverage in affected packages; treat warnings as blocking. Run fixlint before a later final implementation commit. Shared FileTree contract changes require a repository-wide rebuild (or exhaustively justified dependent closure); behavior-boundary changes require dependent/repository tests as prescribed by shared guidance. Include API report, capability documentation and change files for each touched package and validate with `rush change --verify --target-branch origin/release`. These are future implementation gates, not commands executed by this design task.

At implementation close, load the repository's finalize-task skill before any closing PR, update the shared workstream/design/capability artifacts in that implementation change, and follow the normal internal/external review process. That later workflow must not cause this design task to alter ledgers, production code, dependencies or proposals: the current authorized output is only these two documents, with no commit or PR.

Approval handoff: A1 and A2 are approved. Await explicit implementation authorization, then start F1 as an isolated upstream FileTree slice; F2 must establish the promised backend behavior before a durable task path is advertised. No consumer rollout is implied by those decisions.
