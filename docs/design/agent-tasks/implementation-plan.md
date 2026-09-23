# Agent tasks — phased implementation plan

**Status:** A1/A2 and finite-horizon capacity amendment A3 approved 2026-09-21; reference-consumer A3 approval is limited to V1 ingestion. A1 **amended 2026-09-22** to Linux-only — see § *F2*.
**F1 and F2 are shipped** ([#683](https://github.com/ErikFortune/fgv/pull/683), squashing [#681](https://github.com/ErikFortune/fgv/pull/681) and [#682](https://github.com/ErikFortune/fgv/pull/682)): the upstream `ts-json-base` FileTree atomic-write capability and its qualified Node protocol exist and are on `release`. **T1 is implemented** and lands on `integration/agent-tasks-v1` via
[#684](https://github.com/ErikFortune/fgv/pull/684) — it is *not* on `release`, and reaches it only
in the integration branch's squash. **T2 is implemented** on the same branch via
[#685](https://github.com/ErikFortune/fgv/pull/685), and **T3** via [#686](https://github.com/ErikFortune/fgv/pull/686) — durable mode qualified on Linux ext4/tmpfs by a real-Node crash matrix (`.ai/tasks/active/agent-tasks-t3/result.md`). **Every other T slice, and every I, P and M slice, remains
unimplemented and awaits explicit authorization**, taken one slice at a time.
**Date:** 2026-09-21. **Source inspection:** `d0ec601c6d67a6016a00a33a69ddee18bec6ddb1`.
**Engineering contract:** [development design](development-design.md).
**Scope authorities:** [library proposal](fgv-library.md), [adoption proposal](multi-agent-chat-adoption.md), [deferred scope](deferred.md).

This plan document itself changes no production code or consumer repository. **F1's and F2's tests are run and their results recorded** (`.ai/tasks/completed/2026-09/filetree-atomic-write/result.md` — fault injection at every protocol boundary, subprocess crash tests on two filesystems, and fourteen mutations watched to fail), and so are T3's (`.ai/tasks/active/agent-tasks-t3/result.md` — a real-Node crash matrix on ext4 and tmpfs and twenty-six mutations watched to fail). **Every other implementation test below, and the M1 measurement, remain planned and not run.** Source/document review and the separately attributed consumer execution-record measurements in the adoption proposal are the available evidence; those measurements do not qualify broker limits or memory. The slices are dependency-ordered review units; an incomplete internal slice is not a release claiming all task guarantees.

## 1. Decisions and approval status

Adopt `@fgv/ts-agent-tasks` at `libraries/ts-agent-tasks`, one package with integration packlets. Use generic scopes, a single-writer broker, stable task-ID storage, typed kind/command registration, native state plus owed updates in one atomic task record, exact per-consumer acknowledgements, resident query indexes, and explicit source reconciliation. Keep the tracked/list/external helper built-ins and the snapshot-only entry point. Reassignment is included from the first broker release and never changes execution binding.

All three material decisions were approved on 2026-09-21. The user reports orchestrator and reference-consumer agreement; the consumer's A3 acceptance is scoped to disposable V1 ingestion hubs:

| Approval | Recommended decision | Consequence of a different decision |
|---|---|---|
| A1 — approved 2026-09-21, **amended 2026-09-22** | Process-crash survival on qualified local **Linux** Node FileTree roots; file and directory flushes before acknowledgement. OS-crash and power-loss survival are excluded; reject requests for those guarantees and unqualified backends. *(Amendment: the original text read "Linux/macOS". darwin is dropped from the intended matrix, not merely unqualified — see below.)* | Stronger guarantees or additional platforms require separate design/qualification. Approval sets the intended contract; it does not replace implementation evidence or passing crash tests. |
| A2 — approved 2026-09-21 | Include bounded cascade pause/cancel as a best attempt with an observable result: persisted intent, explicit partial effects/blockers, stable-stop source opt-in, and frozen subtree admission while latched | Acceptance remains distinct from completion. No all-or-nothing execution promise; no silent skipped children or weakening of intent/recovery requirements. |
| A3 — approved 2026-09-21; consumer acceptance limited to V1 ingestion | Minimal archived resident projection; on-demand historical evidence; bounded caches/rebuild; design §8.6's finite whole-repository limits and persisted reservations for completing accepted work; explicitly qualified source-replay bounds | Adds capacity accounting, admission and recovery work across T1/T3–T9, a narrow host limit-increase API, and measurements M1. Initial limits remain subject to qualification. The reference consumer accepts a finite horizon for disposable hubs only; its future always-on collective requires a separately approved compaction design before adoption. |

Package naming, lifecycle vocabulary, strict schemas, pagination and receipt issuance are reasoned technical recommendations, not open product discovery. Document acceptance may approve them together. Consumer rollout choices below remain the consumer's responsibility and do not block standalone library implementation.

**Clarification versus new decision:** retained inventory/graph/source entries grow with archived history; non-archived includes terminal tasks awaiting cleanup; task archival does not erase exact subscription or operation history. Those correct ambiguities in the previous text. Selecting minimal resident projections, staged rather than single-pass rebuild, finite defaults, protected completion claims, replay-source admission bounds and empirical qualification is new design under A3. It is not authorized by A1/A2. The observation's suggested flat-memory prediction is rejected; the relevant prediction is a smaller per-archived-task slope plus bounded payload/history residency.

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
| Residency/capacity amendment (A3) | Design §7 category projections and staged rebuild; §8.6 finite counts/bytes, persisted closeout/acknowledgement claims and finite-horizon limitation | T1, T3–T9, **M1**, P1 | Deterministic retained-shape/counter and saturation/crash evidence; separate on-demand steady-state and peak memory report including lifetime subscription and dedup history |

No numbered gate is left to an implementer to “discover later.” A1, A2 and the scoped A3 decision are approved; implementation and qualification gates remain mandatory. If reservations cannot cover the admitted source/closeout semantics, or memory predictions fail, amend the design openly rather than weaken guarantees or choose thresholds after seeing results.

## 3. Upstream FileTree slices

### F1 — Optional atomic-write contracts and session implementation — ✅ shipped ([#681](https://github.com/ErikFortune/fgv/pull/681))

**Dependencies:** design approval; A1 fixes the advertised guarantee vocabulary. **Affected package:** `ts-json-base` only.

**Deliverables:** optional atomic accessor/directory interfaces, classified result types and capability guards; directory delegation; additive exports in Node/browser barrels; atomic session replacement in in-memory accessors; API/CAPABILITIES documentation that separates method presence, writability, atomic visibility and durability. No changes to ordinary save behavior or required members on existing base interfaces.

**Acceptance:** task code can perform an atomic child write through an injected directory without native paths/accessor internals. A read-only or unsupported tree fails explicitly. In-memory never advertises process-crash survival. Unsupported guarantees fail before changing data. Every existing accessor still typechecks without implementing the optional interface.

**Tests:** accessor/item guard distinction, delegate unsupported branch, per-path permissions/mutability filter, existing/new file, invalid child names, unchanged old value on failure, requested-guarantee mismatch, byte-vs-text read differences. Re-run existing FileTree suites; search all implementers/test doubles, including web/extras/sample packages.

**Review gate:** stable-surface compatibility and browser import review; public API Extractor diff; shared-contract build gate. This is the **first implementation slice**, after explicit approval. It does not claim a durable task repository.

### F2 — Node atomic replacement and process-crash qualification — ✅ shipped

**Qualified matrix as shipped: Linux ext2/ext3/ext4 and tmpfs. macOS is NOT qualified** — Node exposes no stable filesystem-type identifier on darwin, so a darwin root cannot be positively identified from inside the package and is refused rather than assumed. The review gate below says not to mark missing platform evidence “passed”; accordingly, **T3's durable path is unblocked on Linux only**.

**A1 amendment, 2026-09-22 — darwin is dropped from the intended matrix, and no darwin qualification slice is queued.** The reference consumer develops on macOS but **runs everything in containers, nothing on bare iron**. A container executes against the Linux kernel, so `process.platform` is `'linux'` and `statfs` returns a real magic number: the darwin gap is never on the execution path, and qualifying it would buy nothing. A1's decision text is amended from "Linux/macOS" to "Linux" above.

**The live question this replaces it with is the filesystem, not the platform.** F2's allowlist is ext2/ext3/ext4 and tmpfs; **overlayfs is deliberately absent**, because rename and flush semantics over a lower layer (copy-up) differ from the local case. So a containerized deployment qualifies or refuses according to *where the repository root is mounted*, not what the developer's laptop runs:

| root location | filesystem | outcome |
|---|---|---|
| container writable layer (overlay2 driver) | overlayfs | **refused** |
| named volume, or bind mount from a Linux host | usually ext4 | qualifies |
| bind mount from a macOS host (Docker Desktop VirtioFS) | FUSE-like | **refused** |
| tmpfs mount | tmpfs | qualifies |

A durable root belongs on a volume rather than the container's ephemeral writable layer regardless of this protocol, so the refusal points at the right practice. **Measure rather than assume** — the refusal message names the magic number it found and the qualified list, and the same value is readable directly:

```bash
node -e "console.log('0x'+require('fs').statfsSync('<root>').type.toString(16))"
```

Qualifying overlayfs remains available as a future slice — it means running the crash suite on it and answering what `fsync` on an upper-dir file guarantees after a copy-up — but it is **not queued**, because no measured consumer need has been shown for it.

**Dependencies:** F1, A1. **Affected package:** `ts-json-base`; CI configuration only if necessary to run the approved platform matrix.

**Deliverables:** Node leaf protocol with exclusive sibling temp creation, complete write, file flush/close, same-directory replacement, directory flush, and precise unchanged/replaced/unknown error classification; qualified-root capability inquiry; reserved-temp cleanup/reopen policy. Ordinary saves remain unchanged. Publish the tested runtime/OS/filesystem matrix and unsupported cases.

**Acceptance:** no interrupted replacement tears the previous accepted record; creation/replacement success waits for the declared boundary. Post-replace failure cannot be mistaken for nonapplication. No unlink-before-replace, copy fallback, or silent durability downgrade. Unqualified platform/root requests fail. No OS/power-loss claims emerge from process-kill evidence.

**Tests:** leaf fault injection at open, partial write, file flush, close, rename, directory flush, cleanup and readback; real Node temporary-directory tests; child-process termination synchronized to protocol boundaries rather than sleeps. Include first creation, replacement, orphan temps, disk/permission failures, destination directory/symlink rejection, read-only/mutability filters, and retry after ambiguous replacement. Use a typed internal filesystem boundary/test harness, not new public fault-injection flags or task-level filesystem bypasses. Actual Node tests complement, not replace, injected failures.

**Review gate:** persistence/fault-model review and 100% FileTree coverage after functional review. Record exactly which guarantees each test proves. Block durable T3 until F2 passes on the release's claimed matrix; do not mark missing platform evidence “passed.”

## 4. Task foundations and storage

### T1 — Package, values, converters and registry — ✅ implemented on `integration/agent-tasks-v1` ([#684](https://github.com/ErikFortune/fgv/pull/684))

**Dependencies:** approved model; F1 contract available. **Affected package:** new `ts-agent-tasks`; Rush project/dependency/version-policy configuration via normal tooling.

**Deliverables:** package scaffold, root exports, types/converters packlets, bounded common envelope, lifecycle/observation/command/recovery unions, versioned detail and command registration, typed handles, Result-valued factories, injected clock/ID/logger contracts. Built-in tracked/list detail schemas; no storage side effects at import.

Under A3 also define the versioned capacity profile and typed dimension failures/status, bounded source replay declarations, and internal discriminated `capacityClaims` schema from design §8.6. Cover owner/obligation identities, pending-to-live transfer and reserved-to-used conversion; claims are repository-generated data, not caller-issued authority. Count/byte schemas must make maximum completion and settlement charges computable before acceptance.

**Acceptance:** runtime validation produces the same public shape the type declarations promise; registry erasure uses converter closures without unsafe generic casts. Unknown versions/kinds cannot be treated as validated current types. Independent schema versions and metadata/source ownership are explicit. Bound waiting state contains only opaque host attention references.

**Tests:** valid/invalid envelopes and every discriminant, zone-free/invalid instants, revision overflow, progress bounds, unknown/additional fields, limits, unknown kind/version, duplicate registry keys, converter/encoder roundtrip, typed handle mismatch, schema consistency and command names. Use malicious property/shape inputs as `unknown`, not `any`.

**Review gate:** public contract/dependency review; no deferred input protocol, task runner, source-specific fields or consumer vocabulary. API report and package capability entry describe proposed shipped values accurately when this slice later lands.

### T2 — Pure context and snapshot-only use — ✅ implemented on `integration/agent-tasks-v1` ([#685](https://github.com/ErikFortune/fgv/pull/685))

**Dependencies:** T1. **Affected package:** `ts-agent-tasks` context/converters.

**Deliverables:** deterministic selection/rendering, current/update/attention fragments, budgets/omissions, pure inclusion receipt and safe bounded projection seam. This is a complete usable snapshot-only entry point without a broker.

**Acceptance:** same validated input/budget produces same output; no filesystem/clock/random/checkpoint calls. Only actual included revisions/update IDs appear in receipts. Required delivery payload that does not fit remains unacknowledged. Partial visible trees never establish parent completion. Treat task prose as data.

**Tests:** overlapping scopes already reduced to duplicate snapshots, duplicate conflicting revision data, all budget boundaries including framing reserve, depth omissions, unknown totals, empty data, partial/nonexhaustive input, multi-revision required updates, truncation of results, hostile task text/Mustache/control characters, and snapshot receipts without event history. Spy on injected dependencies or module boundaries to establish zero writes, not merely equal final checkpoints.

**Review gate:** disclosure/omission and receipt semantics; pure API independent of live infrastructure.

### T3 — FileTree records, durable commit and reopen — ✅ implemented on `integration/agent-tasks-v1` ([#686](https://github.com/ErikFortune/fgv/pull/686))

**Dependencies:** T1, **F2**. **Affected package:** `ts-agent-tasks` storage.

**Deliverables:** injected-root session/durable factories; private single-writer coordinator; strict JSON storage records; flat repository inventory; ordered record registration; one-task state/update/operation atomic replacement; inventory-backed missing-record detection; diagnostic recovery handle. Use the same repository implementation with in-memory and Node adapters.

**A3 additions:** persist the profile and claims in their owning records; construct the derived capacity ledger; preflight all count/byte dimensions under the writer; pending registration owns reservations until live transfer. Expose trusted capacity status and explicit finite-limit increase, with no in-place lowering or silent reinterpretation on reopen. Test accounting foundation before T5 admits work; T7/T8 finish cross-record acknowledgement/cleanup behavior.

**Acceptance:** no durable success precedes the new FileTree boundary. Each accepted mutation has complete current state plus owed-update data and dedup evidence. Canonical addresses are task-ID based. Open never initializes over a missing/corrupt manifest or starts source execution. Pending registration has explicit recovery behavior. Unknown data is retained without lossy rewrite.

**Tests:** absent/empty/nonempty root initialization, missing manifest, pending/live creation permutations, repeated operation identity, full-record replacement failures, corrupted JSON/UTF-8, filename/ID mismatch, missing named task/consumer, unknown schema/kind/source, archive tombstones, duplicate in-process root instances. Crash acceptance matrix runs through the real Node FileTree path; no mocked successful store substitutes for it.

Also cover separate record-vs-task revisions, stale receipt/pruning maintenance, writer-handle lifetime/nesting, and callback failure after an earlier committed replacement (no rollback claim). Register an unavailable external source as an unresolved reference without invented lifecycle; its first observation must preserve identity/catalog metadata and atomically establish state plus obligations.

Test exact-fit/one-over counts and encoded bytes; old defaults versus stored policy; lower/incompatible configuration; atomic limit-increase failure; valid-at-capacity reopen; and lost-response registration retries with neither double-charge nor early release. Reservations must survive the same Node process-crash boundaries as acceptance. No global quota-file dual write or per-mutation inventory rewrite may be introduced silently.

**Review gate:** inspect task commit contents and return ordering; validate each crash window against design §8.4. Release remains blocked until indexed behavior in T4 and durable obligations in T7–T8 are complete.

### T4 — Indexed selection, paging, due and outstanding discovery — ✅ implemented on `integration/agent-tasks-v1` ([#687](https://github.com/ErikFortune/fgv/pull/687))

**Dependencies:** T3. **Affected package:** `ts-agent-tasks` storage/query modules.

**Deliverables:** full resident summaries/indexes for non-archived tasks, minimal archived identity/graph/source/status projection, unresolved reference projection, separately indexed bounded owed/pinned payloads, and design §7's bounded caches/working concurrency. Implement staged rebuild/generation/health and bounded keyset pagination. Lifetime operation and acknowledgement/disposition history is on-demand data, not resident index content.

**Acceptance:** native mutation updates every affected index before success. Index failure after record commit fences queries and reports indeterminate commit until rebuild. Warm ordinary summary/owed queries perform no task-file reads; explicit archived inspection/detail/replay reads selected records. Terminal non-archived tasks remain fully represented; archive removes their summary, not identity/edges. Terminal obligations stay discoverable after leaving open work. Rebuild releases the old generation and performs bounded sequential projection/reconciliation passes, never a healthy empty fallback. Custom repositories have a reusable conformance suite.

**Tests:** scope unions/dedup before paging; exact-status/class compatibility; due absent/equal/before/after cutoff; remaining non-time prerequisites; parent/reassignment/source dedup index changes; all page boundaries; cursor query mismatch, restart and concurrent mutation; archive projection; rebuild after interrupted record/index update. Hold open/matching sets fixed while growing unrelated retained terminal history through 0, 1,000 and 10,000 using an explicit finite fixture profile that admits those counts. Test archived and non-archived terminal cohorts separately; assert candidate visits and record reads, not milliseconds. Due tests grow future/nonmatching candidates independently. `listOwed` must not scan terminal history.

Deterministically inspect the internal projection shape and counters: archived summaries/details/operation bodies absent; full-summary count equals resolved non-archived count; exact graph/source/inventory entry counts; no resident historical acknowledgement sets; cache entries/encoded charge/cursor handles within limits; bounded in-flight record materializations. Rebuild must parse/project/release each body, not collect an all-record array. Test task→consumer→selected-task passes, graph-validation workspace, unpruned-but-satisfied descriptors, live pins, and old-generation release. These assertions belong in normal tests; heap/RSS claims belong only in M1. Author the M1 harness/prediction manifest here and run early measurements once the real open/rebuild path exists; repeat after T7/T8 add history and reservations.

**Review gate:** algorithm/data structure inspection plus counter evidence. An implementation that filters a full `listEntries()` array fails even if a small fixture is fast.

## 5. Broker and delivery

### T5 — Bound authority, tracked hierarchy and reassignment

**Dependencies:** T1, T3, T4. **Affected package:** `ts-agent-tasks` broker/implementations.

**Deliverables:** host-bound views and sanitized projections; create/update tracked work; task-list completion; scopes and graph integrity; current authority and policy-epoch checks; revisioned responsibility operation with assignment updates. Typed direct API with no native business I/O.

A3: task acceptance reserves first resolution where needed, terminal outcome/audiences, bounded disposition and archive. Metadata/audience changes must preserve or increase those claims before acceptance. At ordinary operation limits reject new identities, while same-key replay, reserved terminal completion and eligible archive remain possible. Completion of a parent from already accepted children must use its reserved terminal path.

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

A3: reserve maximum command result/settlement before dispatch; load retained dedup evidence on demand, including archived-task replay. Qualify finite source-replay envelopes or reject that stronger guarantee before registration/subscription activation. Test bound exhaustion/extension, over-bound source-contract failure, unchanged cursor on backpressure, and a reserved terminal observation while ordinary observed-state sampling is capacity-blocked. No arbitrary replay history may be skipped to reach terminal state.

Add a layering fixture with an executor-owned payload larger than 64 KiB and a bounded task projection that fits `details`. Prove that task/source-checkpoint records do not copy retained source text or execution checkpoints, and that recovery resolves the original source binding. Measure the serialized adapter projection independently of the execution record. The 1 MiB broker source-checkpoint bound is not an executor-job limit; external storage retains its own capacity/durability contract.

**Review gate:** no blind re-execution and no second authoritative lifecycle store. Verify the simulated source actually applies commands; the ingestion compatibility adapter's empty command set supplies no command evidence.

### T7 — Subscriptions, exact issued receipts and acknowledgement

**Dependencies:** T2, T5, T6. **Affected package:** `ts-agent-tasks` delivery/storage.

**Deliverables:** explicit consumer/subscription identity and start policies; serialized baseline creation; candidate audiences committed with updates; broker preparation around pure rendering; injected checkpoint store; exact issued-receipt manifests, expiry/pins and durable exact-ID acknowledgement.

**Acceptance:** no subscribe/mutate gap, no renderer write, no global read flag. Ack only exact library-issued inclusion under the current bound consumer/policy. Old and truncated receipts cannot consume newer or omitted obligations. Issuance failure returns no acknowledgeable context. Host processing precedes checkpoint commit. B's baseline is independent of A's acknowledgements.

**Tests:** concurrent baseline creation/task terminal transition; explicit current/from-now starts; baseline capacity failure; update between capture and issuance; update during model/host processing; scope revocation before prepare/ack; fabricated delivery ID; modified task/revision/update list; shortened/enlarged receipt; foreign consumer/subscription/store receipt; unissued snapshot receipt; duplicate entries; replay before/after ack and after expiry. Omit a revision-3 attention change, include revision-4 progress, and prove ack does not clear revision 3. Simulate host/provider abort and deliberate abstention policies separately. Reassignment with two consumers must leave checkpoints independent after reopen.

An open-only subscription must retain its terminal exit update; parent/status-filtered subscriptions must retain required exit updates after reparent/transition. Pending delivery uses stored audiences, not current selection membership. Reopen under changed host defaults and verify the persisted delivery policy stays authoritative; reject selection changes/admission incompatible with a required source-replay guarantee.

A3: reserve each accepted update/baseline's future acknowledgement-or-disposition evidence before acceptance, and reserve one reusable cleanup preparation per subscription. New subscriptions reserve possible terminal audiences before activation. Test activation crash with pending claims, exact-ID reservation conversion after ack-before-cleanup crash, and duplicate receipts consuming no second slot. Grow one long-lived subscription's acknowledged/disposed history independently of open/archived task counts; archive/close must not reduce its lifetime charge. Evict expired issuance manifests separately from exact history and prove prepare/ack can drain at ordinary admission saturation.

**Review gate:** adversarial receipts and checkpoint custody; verify exact-ID logic rather than max revision, and fail-closed behavior of custom checkpoint stores.

### T8 — Retention, backpressure and recovery journeys

**Dependencies:** T3–T7. **Affected package:** `ts-agent-tasks` storage/delivery/broker.

**Deliverables:** explicit obligation disposition/consumer closure, safe progress coalescing, issued-receipt pins, tombstone archive with minimal resident projection, full A3 capacity accounting/protected drain behavior, end-to-end reopen reconciliation, recovery reports and index repair. Keep physical deletion and inventory/acknowledgement/dedup compaction out of scope only under A3's explicit finite-history limitation.

**Acceptance:** no undelivered required terminal/attention update expires; transient hints can expire harmlessly. Checkpoint commits precede update pruning. Consumer corruption blocks cleanup. Closed/revoked subscriptions retain or explicitly dispose obligations. Unknown source/kind does not erase the task. Bound state/operations do not silently evict dedup evidence. Durable registration plus observation obligations survives all qualified process-crash windows.

**Tests:** failure before/after checkpoint replace, after acknowledgement before response, before/after task update cleanup; source cursor lag; observer throwing; terminal work outside open list; temporary source outage; stale checkpoint store; deletion/corruption of required files; issued payload versus coalescing; max-record/issuance/obligation/dedup capacities. Required updates survive simulated transient-notice TTL. A actor removal preserves original source binding or surfaces unavailable, never redirects to B. Test initial creation and repeated replacement through subprocess restart, not just serial close/open.

For every §8.6 dimension, use small finite profiles to reach ordinary saturation while preserving claims. Reject new growth and then complete the largest allowed accepted task, settle an accepted uncertain command after source resolution, prepare/ack or explicitly dispose every accepted update, prune, archive, close and reopen. Assert exact used/reserved transfers across every crash point, including pending subscription activation and acknowledged-but-unpruned records. Distinguish transient capacity released by cleanup from identity/ack/dedup ceilings that never shrink in v1. An already admitted required event must not need new unreserved acknowledgement space. Test lifetime acknowledgement exhaustion on one subscription and across many closed subscriptions; repeated ordinary command identities/rejected-after-admission operations; pinned receipts; oversized results; and claimed-but-never-resolved pending registrations. Cleanup cannot invent successful outcomes, abandon obligations without authority, or bypass stop blockers.

Record the host runbook in the package documentation at implementation time: status/80% pressure, stop new admissions, drain reclaimable space, explicit finite-limit raise after resource review, or leave a full repository available for reads/drain. No deletion or migration workaround. Run final M1 cohorts on this implementation before accepting its default profile.

**Review gate:** independent persistence/delivery antagonist pass; every recovery case must be either preserved state/obligation, explicit incomplete operation, or explicit error—never unexplained absence. This closes durable library correctness before integration polish.

### T9 — Persistent cascade stop with admission enforcement

**Dependencies:** T5, T6, T8, A2. **Affected package:** `ts-agent-tasks` broker/implementations/storage.

**Deliverables:** root+transitive target capture, persisted latch/target operation identities, bounded host-driven reconciliation, current per-target authority, classified partial outcomes, stable-stop source declaration and explicit pause-latch release. Full hierarchy admission gate enforced on reopen before mutations.

**Acceptance:** root own work and all authoritative descendants are accounted for; no visibility-filtered traversal. Open observation-only children block satisfaction. Supported children may stop while other children remain blocked, with no rollback claim. Accepted commands remain pending until authority confirms quiescence. New subtree admission/reparent/start/resume is rejected under a latch. External autonomous restart violates the stable-stop contract and degrades satisfaction visibly.

**Tests:** every stop target state, root own execution, deep trees/target limit, hidden-but-delegated target, revoked authority on resumed pump, unsupported and unavailable children alongside already applied effects, source accepted/pending/indeterminate, real child stop vs mere receipt. Nested `none`, overlapping pause/cancel, stronger cancellation, release of one of multiple latches, pending pause release with commands in flight, terminal cancel membership. Crash after root intent, after child command commit/effect, before root summary and satisfaction; recover by child operation IDs. Concurrent attachment before/after latch, attachment below descendants, reparent out/within, newly discovered external child, and attempts to bypass via update tools. No timer or work-start behavior in the pump.

Exercise paused→waiting as well as start/resume against the stopped-state invariant. A definitely rejected revision-conflict attempt gets a new persisted attempt/key; an uncertain attempt retains its original request/key. Revalidate persisted source stop-contract evidence after restart. Archive a fully satisfied cancel into a settled summary with retained graph closure; a blocked cancel must not become a successful archived stop.

A3: preflight/reserve root and per-target settlement, required audiences and permitted release/disposition before accepting a stop. At saturation, accepted attempts can settle and the intent can be maintained/released where authorized; a fresh attempt may fail admission with an observable capacity blocker. Prove no partial dispatch occurs merely because later targets lack reserved capacity.

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

**Scoped A3 adoption acceptance:** the reference consumer approves the finite history horizon for disposable V1 ingestion hubs, not the future autonomous collective. Its adapter uses `observed-state`: optional/coalescible progress and required terminal delivery, with applicable attention obligations preserved. The finite `source-replay` envelope therefore does not constrain this port; generic replayable-source tests remain required. Keep the executor's retained source/checkpoints/curation state in its authoritative store and pass only bounded projections/references to FGV. Consumer-reported byte measurements and unmeasured rates are recorded in the [adoption proposal](multi-agent-chat-adoption.md#consumer-a3-approval-and-payload-measurements); they neither establish a broker byte-bound violation nor satisfy M1. Compaction is a prerequisite for collective adoption, not F1/F2 or the V1 ingestion port. Deferred per-turn work is not planned as one task per deferral in this consumer; this is a consumer modeling choice, not a library prohibition on short-lived tracked tasks.

## 8. Cross-cutting validation and release gate

Each implementation slice starts with behavior-driven positive, negative, boundary and integration tests. Run the repository's `code-reviewer` pass **before** closing coverage gaps; resolve findings, then reach meaningful 100% statements, branches, functions and lines in each affected package. Use `@fgv/ts-utils-jest`, Result assertions and setup-only throwing. Do not paper over failures, add public test-only exports, or use coverage ignores without the repository-required approval. Use typed lower-boundary fakes to inject real error paths; do not fake a Result implementation or mock away the contract being tested.

### M1 — Resident-memory and reopen/rebuild qualification (planned)

**Dependencies:** first useful run after T4; complete matrix after T7/T8 and stop-state cohort after T9. **Future artifact:** `libraries/ts-agent-tasks/perf/residentMemory.js`, invoked on demand against the built package with `node --expose-gc`. Follow [Measurement Harnesses](../../../.ai/instructions/TESTING_GUIDELINES.md#measurement-harnesses) and the [agent-memory precedent](../../../libraries/ts-agent-memory/perf/residentMemory.js). No harness, fixtures, result artifact or measurements are created/run by this design amendment.

**Two different evidence lanes:** T3–T9's normal tests assert projection fields, retained entry counts/encoded charges, candidate/file-read counts, materialization concurrency, reservation conservation and crash behavior. Those are deterministic correctness gates. M1 measures machine-dependent bytes/peaks and informs profile qualification; it is not a Jest test, not excluded from coverage to make the suite pass, and not a heap/RSS threshold in CI. A small measured heap cannot replace structural evidence that the real rebuild/acknowledgement lane ran.

Before the first run, freeze a run manifest containing the predictions below, implementation revision, Node/V8/OS/architecture, adapter, finite capacity profile, fixture counts/shapes, sample method, repetition count (five fresh processes per cohort), and tolerances. Publish raw per-run data plus medians/ranges, not just percentage improvements. Put that manifest and output in the implementation stream's existing `result.md` when implementation happens. A failed prediction triggers harness diagnosis and then design/profile revision with an explicit explanation; do not lower the threshold after observing the result and relabel the original prediction as passed.

#### Fixture validity and real paths

- Use independently generated incompressible random hex for descriptions, outcomes, details and operation payloads, plus unique bounded IDs. Do not use `padEnd`, shared payload arrays, repeated-string backing stores or source closures retaining all records. Each A/B arm creates/releases its own corpus in a fresh process; neither shares a prebuilt corpus nor retains seeding inputs.
- Before trusting results, measure fixture baseline → held → released with repeated GC. For a fixture of at least 16 MiB of unique ASCII payload, predict allocation of at least **80% of that payload volume** and release of **80–120% of the measured allocation**, allowing 1 MiB noise. If either check fails, stop and fix the fixture. Also drop/close the real repository, caches, returned pages and adapter references after each cohort; report residual memory separately rather than hiding it in a later baseline.
- Seed a real qualified Node FileTree root in a separate process, then measure a fresh process using the production repository `open`, hot queries, `inspect`, `acknowledge`, `archive`, and explicit rebuild paths. No in-memory fixture retaining all serialized bodies may be used to claim Node-store residency. Measure session/in-memory adapter ownership separately and label its intentionally resident backing data.
- Include cold reopen and warm rebuild; drain callers, release previous-generation objects, and compare measurements before open, after settled GC, during rebuild and after cleanup/close. Capture `heapUsed`, `heapTotal`, `external`, `arrayBuffers`, RSS and process high-water RSS, with platform units. No forced GC inside a measured production open/rebuild phase: it would change peak behavior.
- Peak measurement must catch synchronous materialization. Use phase samples at real read/parse/project/release boundaries through internal instrumentation (no public test-only API), alongside a separate process sampling RSS and the OS high-water mark. A timer in the blocked worker or post-open forced GC alone cannot establish peak. Label highest-observed heap as sampled, not an exact allocator maximum; OS high-water RSS covers the child lifetime, including imports. Use a fresh child and matched empty-root/import baseline; report warm rebuild's phase samples alongside, not as if lifetime high-water isolated that phase.
- Exercise and count the actual inventory parse/rewrite, two-pass task projection, per-consumer exact-history join, graph validation and cache invalidation. Include a deliberate perf-only full-summary retention control and an all-record-buffering control to show that the harness detects the unwanted behaviors. Controls use independent fixtures and are not production alternatives or shipped storage modes.

#### Cohorts and predictions, stated before measurement

Use 0/1,000/10,000 archived-history cohorts with 100 fixed non-archived tasks, declaring a 20,000-retained-task finite test profile before seeding (the production default is 10,000 **total**). Use other limits unchanged where the cohort fits; any necessary fixture-profile increase must be declared before the run. Separately qualify the proposed production profile at its actual earliest limiting dimension, including worst-case schema reservations; its maxima are concurrent constraints, not a promise that every maximum can be reached together.

| Cohort | Pre-run falsifiable prediction | What a miss means |
|---|---|---|
| Archived count grows, fixed active/owed work; one parent edge per archived child, 128-byte source keys and about 8 KiB of unique archived presentation data | Identity/edge/source entry counts grow linearly. At 1,000→10,000, the minimal projection's incremental post-GC heap is **at most 25%** of the independent full-summary-retaining control's increment. Total heap is **not flat**. | If the control itself retains/frees the expected payload but the ratio fails, minimal entries/index structures cost more than expected or retain forbidden bodies. Inspect retaining paths and revise the profile/design. |
| Fixed identities/edges/source keys; increase archived presentation/details/settled operation payload volume independently | With caches disabled, the steady-state heap difference is at most `max(2 MiB, 5% of added on-disk cold payload bytes)`. Full-summary/full-record controls must instead retain a substantial fraction (at least 50%, allowing 2 MiB noise) of their corresponding added unique string payload. | Unexpected payload-sensitive residency or an invalid control; no claim that archival fixed memory until distinguished. |
| Fixed retained population; vary resolved non-archived tasks through 100/500/900, then archive them; compare open with terminal already acknowledged but not archived | Both non-archived categories retain their full summaries. After accounting for known owed-payload differences, extra unique presentation bytes contribute at least 50% of their volume to post-GC heap (2 MiB noise); archive releases that contribution while identity/index metadata remains. | Missing terminal retention, a shared/nonresident fixture, or retained summary references after archive. Terminal tasks still owing outcomes are an additional cohort with separately reported payload charge. |
| One long-lived subscription with 0/1,000/10,000/40,000 distinct acknowledged/disposed IDs, and repeated many-subscription closure cohorts; fixed current obligations | Disk bytes and lifetime charges grow. With caches disabled and no operation in flight, heap change is at most `max(2 MiB, 5% of added serialized history bytes)`; exact histories are absent from resident structures. Read/ack/rebuild peak and rewrite time **do** reflect the largest consumer record. | Per-subscription history accidentally remains resident, or history processing/record limits require a lower profile. Task archival must not be credited for reducing this history. |
| Independent per-task dedup-history growth and source/graph/scope-index fanout | Cold settled command bodies follow the same 5%/2 MiB steady-state prediction. Graph/source/index **metadata** grows with entry count and key bytes; maximal 4 KiB source identities and 64-scope active envelopes are measured separately, not subject to the 25% small-key ratio. | Identify whether cost belongs to required metadata or accidentally resident evidence. Report marginal bytes per task, edge, source key, scope/status membership and owed audience link; do not sum nonindependent deltas as if shared objects were disjoint. |
| Cold reopen and warm rebuild with fixed final projection, inventory counts and maximum record size, but at least 64 MiB more archived/ack/dedup cold history distributed across records | The increase in peak heap/RSS **above each cohort's settled resident state** is no more than `25% of added cold-history bytes + 16 MiB`. The all-record-buffering control must exceed that bound. Maximum record size is held fixed using a common independently generated largest-record fixture. | A records/history accumulation bug, inadequate GC/adapter working-space assumptions, or invalid peak sampling. Inspect source/retaining paths; revise the algorithm or supported profile, not the claim that post-GC steady state alone proves reopen safety. |
| Cache saturation, repeated inspect/ack/rebuild and release | After reaching configured LRU/cursor/receipt bounds, ten further equivalent workload cycles add no more than `max(2 MiB, 10% of the first saturated post-GC heap delta)`; structural counts remain exactly bounded. Closing/dropping library-owned references releases at least 80% of their measured heap delta, allowing 2 MiB noise. | Hidden history/per-owner cache, cursor/receipt leak, old index generation, host-held result, or adapter ownership. Isolate the owner before asserting a library bound. |

Also report absolute steady-state and peak memory for the production profile's limiting fixtures: many short-lived tracked checklist items; all allowed non-archived tasks terminal-but-unacknowledged; maximum owed/pinned fanout; many closed subscriptions near the global history ceiling; large operation evidence; unresolved registrations/stop intents; and a full inventory with mixed archived/live tasks. All fixtures must obey count/byte **and reservation** limits; record which limit actually stopped seeding. Measure receipt preparation and acknowledgement as well as open: making history cold trades steady residency for bounded but potentially expensive parsing and rewriting. Report throughput/latency as descriptive measurements, separate from query-work correctness counters.

**Qualification gate:** the orchestrator reviews actual memory curves, peaks, fixture release checks and capacity-conservation tests before endorsing a default/raised profile for a host. The report must explain how the measured process plus other host workloads fits that host's provisioned memory and disk/scratch budget. No universal safe RSS number or indefinite-operation claim is implied by the default limits. Missing measurements keep A3's resource profile unqualified even if deterministic tests and coverage pass.

### Release evidence

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
| Residency structure and capacity | Category projections; bounded working/cache structures; exact used/reserved conservation; finish/ack/recover/archive at ordinary admission ceilings; lifetime limits survive close/reopen |
| Prompt/wire | Available real composition, cache ordering/refutations, exact outgoing system/tool definitions/breakpoints, progress-only stable prefix |
| Credential-free journey | The exported API composes into useful tracked+external workflows without model/provider/consumer services |

For code slices, run `rushx build`, `rushx lint`, `rushx test` and coverage in affected packages; treat warnings as blocking. Run fixlint before a later final implementation commit. Shared FileTree contract changes require a repository-wide rebuild (or exhaustively justified dependent closure); behavior-boundary changes require dependent/repository tests as prescribed by shared guidance. Include API report, capability documentation and change files for each touched package and validate with `rush change --verify --target-branch origin/release`. These are future implementation gates, not commands executed by this design task.

At implementation close, load the repository's finalize-task skill before any closing PR, update the shared workstream/design/capability artifacts in that implementation change, and follow the normal internal/external review process. That later workflow must not cause this design task to alter ledgers, production code, dependencies or proposals: the current authorized output is only these two documents, with no commit or PR.

**Approval handoff:** A1, A2 and A3 are approved; consumer acceptance of A3's finite horizon is limited to disposable V1 ingestion hubs. The future autonomous collective requires a separate compaction design before adoption. Approval and consumer execution-record byte measurements do not certify the broker's memory profile; M1 supplies that later evidence. Await explicit implementation authorization and start F1 as an isolated upstream FileTree slice, followed by F2's Node implementation and crash qualification before a durable task path is advertised. These adoption clarifications do not block F1/F2 or authorize consumer rollout. Branch/squash operations and shared orchestration artifacts remain with the user/orchestrator.
