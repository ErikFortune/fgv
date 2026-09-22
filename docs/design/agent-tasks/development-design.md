# Agent tasks — development design

**Status:** A1/A2 and finite-horizon capacity amendment A3 approved 2026-09-21; reference-consumer A3 approval is limited to V1 ingestion. **§8.1–§8.2 are implemented and qualified** — the FileTree atomic-write capability and its Node protocol shipped via the `filetree-atomic-write` stream (F1 [#681](https://github.com/ErikFortune/fgv/pull/681), F2 alongside it), with process-crash qualification on **Linux ext2/ext3/ext4 and tmpfs only**. **macOS is NOT qualified**, contrary to A1's intended matrix: Node exposes no stable filesystem-type identifier on darwin, so a darwin root cannot be positively identified and is refused rather than assumed — see `.ai/tasks/completed/2026-09/filetree-atomic-write/result.md`. Every other section remains design-only and awaits explicit implementation authorization. No task-library implementation, FGV test execution beyond the FileTree slice, or resident-memory measurement is claimed.
**Date:** 2026-09-21. **Inspected checkout:** `d0ec601c6d67a6016a00a33a69ddee18bec6ddb1`.
**Agreement:** [library proposal](fgv-library.md), [multi-agent chat adoption](multi-agent-chat-adoption.md), and [deferred scope](deferred.md), read in full.
**Delivery sequence:** [implementation plan](implementation-plan.md).

## 1. Decisions and scope

Recommend `@fgv/ts-agent-tasks` at `libraries/ts-agent-tasks`, with tracked tasks, a task-list preset, an external-source adapter helper, scoped broker APIs, FileTree storage, pure context rendering, ai-assist tools, and prompt-assist integration in one package. The library records work and mediates observations and commands. Hosts call reconciliation and delivery APIs; there is no resident loop, scheduler, executor, model invocation, or automatic retry policy.

Use a single writer per repository root. Native task changes commit their state, command deduplication result, and owed updates in one atomic task record. Consumer records commit acknowledgements separately; ordering makes interruption cause duplicate delivery rather than lost delivery. Task IDs and physical record addresses never depend on responsibility. External execution stays at its original source when responsibility changes.

Approval status for the three material decisions:

1. **Durability — approved 2026-09-21:** qualify the initial Node backend for **process-crash survival**, with atomic replacement, file and directory flushes before acknowledgement. **OS-crash and power-loss survival are excluded in v1**; reject requests for those stronger guarantees. Qualify local Linux filesystems; Windows and network filesystems are initially unsupported for durable mode. *(Amended 2026-09-22: the original read "local Linux and macOS filesystems separately". darwin is dropped from the intended matrix — the reference consumer runs everything in containers, which execute against the Linux kernel, so the darwin gap is never on the execution path. See `implementation-plan.md` § F2.)* Stronger/platform-wide guarantees require an additional qualification slice. Approval establishes the intended contract; implementation and qualification tests must still establish that it is met.
2. **Cascade behavior — approved 2026-09-21:** include the bounded stop presets in §10 as a best attempt with an observable result: persist intent, attempt individually authorized supported stops despite other blockers, expose partial effects, and freeze affected hierarchy admission until explicitly released where permitted. Request acceptance is distinct from confirmed completion; unsupported, unavailable, refused and uncertain targets remain visible blockers. This approval does not require an all-or-nothing stop transaction or weaken the persisted intent and recovery contract.

3. **Residency and finite capacity — A3 approved 2026-09-21:** the user reports orchestrator and reference-consumer approval of minimal archived entries, bounded caches and staged rebuild (§7), plus persisted capacity claims that reserve room to finish accepted work (§8.6). The consumer's approval is specifically for disposable V1 ingestion hubs, not its future always-on autonomous collective. Keep physical deletion, inventory compaction and acknowledgement/dedup-history compaction deferred under this finite-history limitation. The collective requires a separately approved compaction design before adoption. This approves the engineering direction and initial limits for implementation/qualification, not measured resource safety or indefinite operation.

The reference ingestion adapter uses `observed-state`, not `source-replay`; it does not need the finite replay-event envelope. Terminal delivery and applicable attention obligations, ordinary capacity accounting, and protected completion still apply. Consumer-reported execution-record byte measurements and their limitations are recorded in the [adoption proposal](multi-agent-chat-adoption.md#consumer-a3-approval-and-payload-measurements). They do not qualify the broker's memory profile.

All other choices below are recommendations ready for implementation review. Waiting reasons and opaque host attention references are included; input creation, answers, expiry/arbitration, and answer-to-continuation protocols are excluded. Execution migration, multi-process ownership, physical repository migration, general event sourcing, and dependency DAGs remain deferred. No consumer repository changes are authorized.

**Amendment assessment:** the resident-memory observation reviewed against checkout `c5c2e472f092c0ea9fbacd42f34345ba735b653f` is valid, with three corrections to its proposed interpretation. Minimal archived entries reduce bytes per task but still grow with retained identities/edges/source keys. Non-archived includes terminal tasks awaiting acknowledgement/disposition/archive, not just open work. Exact acknowledgement/disposition history and retained command/catalog deduplication evidence grow independently of task archival. Clarifications below make those facts and existing non-deletion semantics explicit. Choosing the resident projection, cache/rebuild budgets, capacity profile/reservations, and measurement gates is **new design work under A3**. No claim of flat total memory or indefinite operation follows from it.

## 2. Source evidence and additions

Paths below are relative to this document. These are source observations, not runtime verification.

| Existing source | What it supplies | Design consequence / proposed addition |
|---|---|---|
| [FileTree accessors](../../../libraries/ts-json-base/src/packlets/file-tree/fileTreeAccessors.ts) | Mutable, binary, strict-text and explicit synchronization interfaces; Result-valued item operations | Add an optional atomic-write capability here, not a task-owned filesystem adapter. `SaveCapability: persistent` and `isPersistentAccessors` are insufficient durability evidence. |
| [FsFileTreeAccessors](../../../libraries/ts-json-base/src/packlets/file-tree/fsTree.ts) | `saveFileContents` / `saveFileBytes` use `fs.writeFileSync`; no temp/replace/flush protocol; does not implement `syncToDisk` | Preserve ordinary saves; add opt-in atomic commits. |
| [DirectoryItem](../../../libraries/ts-json-base/src/packlets/file-tree/directoryItem.ts), [FileItem](../../../libraries/ts-json-base/src/packlets/file-tree/fileItem.ts) | Item wrappers delegate through protected accessors; guards narrow methods, not successful operation | Add directory-level capability inquiry and atomic child write, so task storage only receives a directory item. Never reach into `_hal`. |
| [In-memory tree](../../../libraries/ts-json-base/src/packlets/file-tree/in-memory/inMemoryTree.ts), [localStorage tree](../../../libraries/ts-web-extras/src/packlets/file-tree/localStorageTreeAccessors.ts) | Session fixtures; a buffered adapter with explicit synchronization | In-memory supports only session guarantees. localStorage is not qualified merely because synchronization exists. |
| [Result](../../../libraries/ts-utils/src/packlets/base/result.ts), [brands](../../../libraries/ts-utils/src/packlets/base/brand.ts), [converters](../../../libraries/ts-utils/src/packlets/conversion/converters.ts) | `Result`, `DetailedResult<T, TD>`, `failWithDetail`, `succeedWithDetail`, `Brand<T, B>`, converter composition | Reuse directly; classified failures below use the existing detailed-result family. |
| [JSON Schema types](../../../libraries/ts-json-base/src/packlets/json-schema-builder/types.ts), [factories](../../../libraries/ts-json-base/src/packlets/json-schema-builder/factories.ts) | `JsonSchema.ISchemaValidator<T>` is a validator and emits `.toJson()`; `Static` derives tool types | One schema for runtime command validation and model wire schema; no untyped command bag. |
| [Memory body registry](../../../libraries/ts-agent-memory/src/packlets/converters/bodyConverterRegistry.ts) | Typed registration erased safely with converter closures | Reuse the pattern, not the package; add task-specific versioned registrations. |
| [Memory store](../../../libraries/ts-agent-memory/src/packlets/store/fileTreeMemoryStore.ts) | Injected FileTree root, indexed envelopes, `_persist` writes then patches index; `listEntries` enumerates entries | Useful storage precedent, not a task transaction or `(scope, lifecycle)` query implementation to copy. No memory/vector dependency. |
| [Memory tools](../../../libraries/ts-agent-memory/src/packlets/tools/memoryTools.ts) | Bound scope, read-only defaults, schemas and execution-time revalidation | Adopt this factory pattern. Do not copy its fallback to full-body projection after a projector throws; tasks fail closed. |
| [ai-assist tools](../../../libraries/ts-extras/src/packlets/ai-assist/toolTypes.ts) | `IAiClientTool<T>`, `parametersSchema`, async Result-valued `execute`, advisory annotations | No new tool loop or provider contract. |
| [Prompt bindings](../../../libraries/ts-prompt-assist/src/packlets/types/bindings.ts), [slots](../../../libraries/ts-prompt-assist/src/packlets/types/slot.ts), [resolve](../../../libraries/ts-prompt-assist/src/packlets/resolve/promptLibrary.ts) | Literal/resource bindings, substitutions, `cacheStability`, `resolve({ composition: {} })` | Resolve task data before composition; put the per-request slot last. No broker callbacks inside prompt resolution. |
| [Composition metadata](../../../libraries/ts-prompt-assist/src/packlets/types/trace.ts), [cache analysis](../../../libraries/ts-prompt-assist/src/packlets/resolve/cacheStabilityAnalysis.ts), [toCacheRequest](../../../libraries/ts-prompt-assist/src/packlets/resolve/toCacheRequest.ts) | UTF-16 offsets, `unavailable`, `cacheFindings`, `effectiveStability`, derived breakpoints | Check positive availability and the actual emitted system body. Empty diagnostics alone prove nothing. |
| [Horizontal composition](../../../libraries/ts-prompt-assist/src/packlets/types/composition.ts) | `IComposedPrompt` has body/slots/provenance, no `IPromptComposition` | Default example uses final `PromptLibrary.resolve`, not a cast of horizontal composition. A future horizontal integration needs real final composition evidence. |
| [UUID primitive](../../../libraries/ts-utils/src/packlets/base/uuid.ts), [canonicalization](../../../libraries/ts-utils/src/packlets/base/normalize.ts), [crypto interface](../../../libraries/ts-extras/src/packlets/crypto-utils/model.ts) | UUIDs; `canonicalize`; provider `generateUuid`/random/HMAC capabilities | Inject an ID factory; use canonicalization for exact receipt/payload comparison, not CRC32 as authentication. `ICryptoProvider` actually lives in ts-extras, despite one index shortcut suggesting ts-utils. No new crypto code is needed. |
| [Testbed registry](../../../samples/testbed/src/scenarios/index.ts) | Existing CLI/web scenario home and testable scenario cores | Add one credential-free CLI scenario later; no new application. |
| [Measurement Harnesses guidance](../../../.ai/instructions/TESTING_GUIDELINES.md#measurement-harnesses), [memory harness precedent](../../../libraries/ts-agent-memory/perf/residentMemory.js) | Fixture release sanity check, independent A/B corpora, on-demand `perf/` scripts, predictions written before measurement | Add task-specific real-store residency/rebuild measurements in the implementation plan; the precedent is a location/pattern, not evidence about task memory. |

Source inspection reveals no reason to reopen the agreed product boundary. The durability and composition gaps above are concrete missing capabilities/limitations, addressed rather than silently assumed away.

## 3. Package and module contract

Publish a root export barrel, matching ts-agent-memory, with `sideEffects: false`, the existing Heft rig, API Extractor, lockstep version policy, README and CAPABILITIES documentation. Do not create integration companion packages or speculative subpath exports.

| Packlet | Public surface | Allowed internal dependencies |
|---|---|---|
| `types` | IDs, envelope/snapshot, lifecycle, failures, source/command/update values | ts-utils, ts-json-base types |
| `converters` | Envelope, storage, receipt and command converters; versioned kind registry | types, ts-utils, ts-json-base |
| `storage` | Repository/checkpoint contracts, `FileTreeTaskRepository`, recovery reports | types, converters, FileTree |
| `implementations` | Tracked transitions, list policy, external adapter factory | types, converters; injected repository interfaces |
| `broker` | Bound views, authority checks, catalog operations, commands, reconciliation, stop coordinator | lower packlets; injected context renderer interface where needed |
| `context` | Bounded projections, selection, pure renderer and inclusion receipts | types, converters; no broker/store imports |
| `delivery` | Subscriptions, preparation, exact receipt validation, acknowledgement and retention | broker/view interfaces, context, storage |
| `tools` | `createTaskTools` and registry-derived command tools | broker, context, AiAssist, JsonSchema |
| `prompt` | Fragment/descriptor builders, substitutions, checked final composition helper | context, ts-prompt-assist, AiAssist types |

Direct package dependencies: `ts-utils`, `ts-json-base`, `ts-extras`, `ts-prompt-assist`, plus normal rig/runtime dependencies. Add through Rush when approved. Core packlets do not import integration packlets or ts-extras runtime providers. All arrows point toward foundational libraries; ai-assist and prompt-assist do not learn about tasks. No agent-memory, native database, React, or consumer dependency. The host supplies `Logging.ILogger`, `clock: () => number`, and `newId: () => Result<string>`; boot code can wrap the published UUID primitive or a crypto provider. No module import opens a repository or registers global state.

## 4. Public values, registration and validation

The following are proposed TypeScript contracts, not existing exports. Related declarations in code blocks share a namespace for this design. Imports are `Brand`, `Converter`, `DetailedResult`, `Result` from ts-utils and `JsonValue`, `JsonSchema`, `FileTree` from ts-json-base. Readonly values are defensively copied at boundaries.

```ts
type TaskId = Brand<string, 'TaskId'>;
type TaskKind = Brand<string, 'TaskKind'>;
type TaskRevision = Brand<number, 'TaskRevision'>;
type OperationId = Brand<string, 'OperationId'>;
type UpdateId = Brand<string, 'UpdateId'>;
type ConsumerId = Brand<string, 'ConsumerId'>;
type SubscriptionId = Brand<string, 'SubscriptionId'>;
type DeliveryId = Brand<string, 'DeliveryId'>;
type PageCursor = Brand<string, 'TaskPageCursor'>;
type Instant = Brand<string, 'TaskInstant'>;

interface ITaskScope { readonly namespace: string; readonly key: string; }
interface IResponsibility { readonly namespace: string; readonly key: string; }
interface ITaskReference { readonly namespace: string; readonly key: string; }
type ParentStopPolicy = 'none' | 'cascade-pause' | 'cascade-cancel';
interface ITaskReason {
  readonly code: string;
  readonly summary: string;
  readonly attention?: ReadonlyArray<ITaskReference>;
}
interface IWaitingReason extends ITaskReason { readonly notBefore?: Instant; }
type TaskLifecycle =
  | { readonly status: 'pending' | 'running' }
  | { readonly status: 'waiting'; readonly reason: IWaitingReason }
  | { readonly status: 'paused'; readonly reason: ITaskReason }
  | { readonly status: 'succeeded'; readonly outcome: ITaskOutcome }
  | { readonly status: 'failed' | 'cancelled'; readonly reason: ITaskReason;
      readonly outcome?: ITaskOutcome };
interface ITaskProgress {
  readonly phase?: string;
  readonly completed?: number;
  readonly total?: number;
  readonly unit?: string;
  readonly summary?: string;
}
interface ITaskOutcome {
  readonly summary: string;
  readonly artifacts: ReadonlyArray<ITaskReference>;
}
interface ISourceBinding {
  readonly sourceId: string;
  readonly referenceVersion: number;
  readonly reference: JsonValue;
}
type RecoveryDeclaration = 'reattach' | 'host-resume' | 'not-recoverable';
type ObservationHealth =
  | { readonly state: 'current'; readonly observedAt: Instant }
  | { readonly state: 'stale' | 'unavailable'; readonly checkedAt: Instant;
      readonly lastObservedAt?: Instant; readonly reason: string };
interface ITaskEnvelope {
  readonly schemaVersion: 1;
  readonly id: TaskId;
  readonly kind: TaskKind;
  readonly detailVersion: number;
  readonly revision: TaskRevision;
  readonly title: string;
  readonly description?: string;
  readonly parentId?: TaskId;
  readonly stopPolicy: ParentStopPolicy;
  readonly responsibility?: IResponsibility;
  readonly scopes: ReadonlyArray<ITaskScope>;
  readonly lifecycle: TaskLifecycle;
  readonly progress?: ITaskProgress;
  readonly attention: ReadonlyArray<ITaskReference>;
  readonly binding?: ISourceBinding;
  readonly recovery: RecoveryDeclaration;
  readonly observation: ObservationHealth;
  readonly createdAt: Instant;
  readonly changedAt: Instant;
}
interface ITaskSnapshot<T = JsonValue> {
  readonly envelope: ITaskEnvelope;
  readonly details: T;
}
interface ITaskFailure {
  readonly code: 'invalid' | 'not-found-or-denied' | 'conflict' | 'unsupported'
    | 'storage-unavailable' | 'storage-corrupt' | 'commit-indeterminate'
    | 'source-unavailable' | 'source-gap' | 'unknown-kind-version'
    | 'invalid-receipt' | 'cursor-stale' | 'retention-blocked' | 'backpressure';
  readonly operationId?: OperationId;
  readonly retry: 'safe' | 'reconcile-first' | 'after-host-action';
  readonly capacity?: ICapacityFailure; // only with code: 'backpressure'
}
interface ICapacityFailure {
  readonly reason: 'capacity-exhausted';
  readonly dimension: 'retained-tasks' | 'non-archived-tasks' | 'subscriptions'
    | 'sources' | 'updates' | 'audience-links' | 'acknowledgement-ids'
    | 'operations' | 'record-bytes' | 'logical-bytes' | 'resident-payload-bytes';
  readonly recordId?: string;
  readonly used: number;
  readonly reserved: number;
  readonly requested: number;
  readonly limit: number;
  readonly reclaimableByCleanup: boolean;
}
type TaskResult<T> = DetailedResult<T, ITaskFailure>;
interface ITaskKindDescriptor<T> {
  readonly kind: TaskKind;
  readonly detailVersion: number;
  readonly details: Converter<T>;
  readonly detailSchema?: JsonSchema.ISchemaValidator<T>;
  readonly encode: (value: T) => Result<JsonValue>;
}
interface ITaskKindHandle<T> {
  readonly kind: TaskKind;
  readonly detailVersion: number;
  decode(snapshot: ITaskSnapshot): Result<ITaskSnapshot<T>>;
}
interface ITaskKindRegistry {
  register<T>(descriptor: ITaskKindDescriptor<T>): Result<ITaskKindHandle<T>>;
  convert(snapshot: unknown): TaskResult<ITaskSnapshot>;
}
```

`details` at the heterogeneous boundary is validated JSON, not a promise of a particular application type. The returned kind handle revalidates kind/version and obtains `T` through its converter; there is no `get<T>(id)` that trusts a caller-selected type. The registry stores closures returning validated JSON, following the memory converter registry's erasure pattern. Duplicate `(kind, version)` registrations fail; registrations are frozen when opening a broker. Conversion plus encode/decode roundtrip is required; schema/codec disagreement fails registration fixtures, and tool execution still uses the registered converter for domain invariants.

Use `Converters.strictObject`, `.optional()`, `discriminatedObject`, `arrayOf`, enumerated values and branded converter mappings. JSON parsing goes through the published JSON converter. No manual object tests plus casts. Unknown properties on broker mutations, receipts and tool arguments are rejected. IDs have bounded safe syntax, not user-provided filesystem paths. An `Instant` accepts canonical UTC `YYYY-MM-DDTHH:mm:ss.sssZ`, an unambiguous RFC 3339 subset; reject zone-free, invalid and noncanonical dates. Hosts normalize other offset-qualified input before this boundary. No absolute-instant converter was found in the inspected foundational packlets: propose a task-domain `Converters.string` refinement with shape/length checks and a captured platform Date parse/ISO roundtrip, not a general date parser or dependency. Revisions and schema versions are positive safe integers; overflow fails before write. Amounts are finite and nonnegative; known `total` cannot be less than `completed`. Unknown total remains absent.

Proposed default bounds: title 256 characters; description 4,096; reason/outcome/progress summaries 2,048; 32 attention/artifact references per field; 64 scopes; 64 KiB encoded details. Construction may lower these bounds. A3 adds aggregate encoded-byte, identity, count and reserve limits in §8.6; individual field maxima need not fit simultaneously. Required obligations and command receipts consume capacity before acceptance; backpressure rejects new growth without consuming protected completion/cleanup room. References carry identifiers, not automatic dereference permission. Raw binding and detail fields are not implicitly model-visible.

Version envelope (`schemaVersion`), kind detail (`detailVersion`), source reference, and repository format independently. V1 writes only envelope/storage version 1. Unknown versions retain original bytes and identity in an unresolved recovery report; they are not rewritten with fields dropped. A future migration is an explicit Result-valued, deterministic old-version-to-new-version converter, run under the writer gate with atomic replacement and a migration report. It changes storage representation, not lifecycle or delivery history. No migration is invented merely because the source proposal's baseline differs from this checkout.

### Built-ins

`fgv.tracked@1` details are an empty strict object; all initial tracked fields are common envelope fields. Its commands are `start`, `wait`, `pause`, `resume`, `succeed`, `fail`, `cancel`, plus typed title/description/progress/attention updates. These are narrow transitions, not arbitrary external `setStatus`. Responsibility, scopes and parentage use separate broker metadata operations.

`fgv.task-list@1` adds `{ completion: 'manual' | 'all-children-succeeded' }`. `stopPolicy` is broker-owned envelope metadata, chosen at tracked/list creation and immutable in v1; default `none`. External parents must use `none` in the initial preset implementation. This keeps stop policy expressible on tracked parents without changing their empty details or creating two policy authorities. All children are required in v1; optional children and weighted aggregation are excluded. Automatic completion requires at least one child, an authoritative complete child set, every child succeeded, no own work (intrinsic to this preset), and no active stop. An empty list needs explicit completion. Failure/cancellation of a child leaves the list open for host action. Ordinary tracked parents never aggregate completion. Terminal task edges and terminal parent membership are immutable in v1; there is no reopen command.

List completion is a recoverable derived action, not a cross-record transaction with child success. Child/membership commits update a completion-candidate index; open/rebuild reconstructs candidates from authoritative edges and final child states. Host API `reconcileListCompletions(limit)` rechecks current `complete-list` authority, membership, revisions, all children and active stops under the writer gate before atomically committing the parent success plus its update/operation receipt. It then makes ancestors eligible in turn. Its idempotency key identifies the parent and eligibility revision; an already terminal list is a no-op. Child success may return before the parent is completed, and the host must pump reconciliation after changes/reopen. Repository open alone starts no work; no timer is installed. A crash after child success but before parent completion leaves a discoverable candidate, not an indefinitely forgotten transition.

The external helper is not a universal `external` detail kind. Hosts register their own detail kind, projection and command schemas, then wrap their source. An empty command registry is supported.

## 5. Lifecycle, commands and source truth

### Transitions and revision authority

| Authority | Allowed change |
|---|---|
| Tracked `start` | pending → running |
| Tracked `wait` | pending/running/paused → waiting with reason |
| Tracked `pause` | pending/running/waiting → paused with reason |
| Tracked `resume` | waiting/paused → running, after the host/actor explicitly confirms prerequisites |
| Tracked terminal command | any open state → succeeded/failed/cancelled with required outcome/reason |
| Tracked metadata/progress | permitted in open states; terminal responsibility/scopes may still change, but execution outcome is immutable |
| External observation | any open → any open or terminal state, including skipped intermediate states; source is authoritative |
| Terminal execution state | absorbing in v1; contradictory external reopen/terminal replacement becomes a reconciliation issue |

Same-state semantic no-ops do not advance the task revision; repeated commands return their prior receipt. A changed pause/wait reason does advance it. Execution retry/reopening needs a future explicit attempt contract; v1 does not infer retry from a regressed source status. Observation health is independent: an outage cannot change execution lifecycle. Health changes can advance the catalog revision and emit a recovery/observation update; repeated liveness timestamps alone do not create semantic updates. Numeric completion never auto-succeeds a task.

One serialized mutation gate covers task/consumer/catalog operations in a repository instance. All mutating broker requests carry `operationId` and `expectedRevision` (creation carries an ID and expects absence). Compare under that gate immediately before durable commit. Native revisions are monotonic per task, including broker metadata and committed source projections. No timestamp is a concurrency token. An external command also uses the source precondition where supported; a broker revision is not a distributed lock on the source. Capability metadata states `conditional: true | false` so a host can refuse weaker dispatch.

```ts
interface ICommandRequest {
  readonly taskId: TaskId;
  readonly operationId: OperationId;
  readonly expectedRevision: TaskRevision;
  readonly command: string;
  readonly parameters: JsonValue;
}
type CommandState =
  | { readonly state: 'rejected'; readonly reason: 'denied' | 'unsupported'
      | 'conflict' | 'invalid-transition' | 'stop-active' | 'idempotency-conflict' }
  | { readonly state: 'accepted'; readonly sourceReceipt?: string }
  | { readonly state: 'applied'; readonly appliedRevision: TaskRevision }
  | { readonly state: 'indeterminate'; readonly reason: string };
interface ICommandReceipt {
  readonly taskId: TaskId;
  readonly operationId: OperationId;
  readonly command: string;
  readonly result: CommandState;
}
interface ITaskCommandDescriptor<P> {
  readonly name: string;
  readonly parameters: JsonSchema.ISchemaValidator<P>;
  readonly encode: (parameters: P) => Result<JsonValue>;
  readonly idempotency: 'source-key' | 'none';
  readonly conditional: boolean;
}
```

Invalid wire shape / storage failure is `TaskResult` failure. A well-formed request that reaches policy/transition evaluation returns a rejected receipt; denial involving a hidden ID instead returns sanitized `not-found-or-denied`. Accepted means the broker has durably recorded intent and, when known, source acceptance; it does not imply application. Applied requires authoritative native commit or a source-confirmed effect reconciled into a committed projection. An ambiguous external send returns an indeterminate receipt with the operation ID, never a generic retryable failure. A failure writing that receipt itself is `commit-indeterminate`, with the same operation ID.

Deduplicate by `(repository, taskId, operationId)`, compare the entire validated canonical request (command, parameters, expected revision and bound principal identity), and reject key reuse with different content. Reauthorize even a replay before returning private receipt data. Same-key replay may return the evolving receipt state; it never dispatches a second effect merely because the task revision has advanced. For tracked operations the receipt and transition commit together. Creation retries reuse the requested task ID and operation ID; source-bind registration also deduplicates `(sourceId, canonical reference)` so overlapping scopes do not create duplicate identities.

For external commands: persist intent → release the storage gate → recheck current authority → persist dispatch-attempt state under the gate → dispatch outside the gate → persist returned receipt/observation under the gate. Never hold the repository gate across source I/O. Broker metadata operations may interleave with source execution; source results merge execution fields into the latest record rather than overwriting newer responsibility/scopes. Authorization is checked at the dispatch boundary; revocation cannot retroactively retract a request already sent. A source revision conflict is refusal, not an optimistic status update.

On recovery, an intent with no dispatch marker can be dispatched only by an explicit authorized host pump. A dispatch marker without a known result is uncertain, even if the process died just before the actual send. Query by source command identity when available. Repeat only if the source deduplicates the same key; otherwise hold for source/host resolution. Persisted intent/receipts do not store a permission grant. Source command-key retention must cover the broker's retry horizon; expiry converts retry eligibility to uncertain. Retain native and catalog dedup entries for the retained task lifetime, including after archive; load evidence on demand, not into a permanent operation map. A3 rejects new ordinary operation identities at their admission limit while protecting accepted-command settlement, terminal closeout and archive (§8.6). Authorized same-key replay is resolved before new-capacity admission and allocates no new evidence. Pre-admission backpressure is not an accepted/stored operation and requires no new dedup entry.

### Source API and reconciliation

```ts
interface ISourceRevision { readonly epoch: string; readonly token: string; }
interface ISourceProjection {
  readonly revision: ISourceRevision;
  readonly observedAt: Instant;
  readonly lifecycle: TaskLifecycle;
  readonly progress?: ITaskProgress;
  readonly attention: ReadonlyArray<ITaskReference>;
  readonly details: JsonValue;
}
type SourceRead =
  | { readonly state: 'observed'; readonly value: ISourceProjection }
  | { readonly state: 'unavailable' | 'missing'; readonly reason: string };
type RecoveryResult =
  | { readonly state: 'reattached' | 'completed'; readonly value: ISourceProjection }
  | { readonly state: 'resumable'; readonly reference: JsonValue }
  | { readonly state: 'unrecoverable'; readonly reason: string }
  | { readonly state: 'unavailable' | 'unresolved'; readonly reason: string };
interface ISourceReconcilePage {
  readonly observations: ReadonlyArray<{ readonly binding: ISourceBinding;
    readonly observation: SourceRead }>;
  readonly nextCursor?: string;
  readonly checkpoint?: string;
  readonly completeness: 'complete' | 'partial' | 'gap';
  readonly issues: ReadonlyArray<string>;
}
type SourceCommandResult =
  | { readonly state: 'rejected'; readonly reason: string }
  | { readonly state: 'accepted'; readonly sourceReceipt: string }
  | { readonly state: 'applied'; readonly observation: ISourceProjection }
  | { readonly state: 'indeterminate'; readonly reason: string };
interface ISourceCapabilities {
  readonly contractVersion: string;
  readonly commands: ReadonlyArray<string>;
  readonly pause: 'unsupported' | 'sampled' | 'stable-until-explicit-resume';
  readonly cancel: 'unsupported' | 'terminal-absorbing';
}
interface ITaskSource {
  readonly id: string;
  readonly history: 'latest-snapshot' | 'replayable-updates';
  capabilities(binding: ISourceBinding): Promise<TaskResult<ISourceCapabilities>>;
  compare(a: ISourceRevision, b: ISourceRevision): Result<'older' | 'same' | 'newer' | 'incomparable'>;
  observe(binding: ISourceBinding): Promise<TaskResult<SourceRead>>;
  reconcile(cursor?: string): Promise<TaskResult<ISourceReconcilePage>>;
  dispatch(binding: ISourceBinding, request: ICommandRequest,
    expectedSourceRevision?: ISourceRevision): Promise<TaskResult<SourceCommandResult>>;
  recover(binding: ISourceBinding): Promise<TaskResult<RecoveryResult>>;
}
```

The helper installs a rejecting dispatcher for observation-only sources. Typed command handlers register as closures around `ITaskCommandDescriptor<P>`; they convert parameters before invoking application callbacks. An optional command lookup adapter can resolve uncertain receipts; it does not become a model tool. Optional push notifications are hints to call `observe`/reconcile, never the sole durable delivery record. Closing a subscription returns a useful cancellation result; no new `Result<void>` APIs.

For latest-snapshot sources, serialize observation application per binding and reject older semantic observations. Equal source revision plus equal canonical **semantic projection** is a no-op; compare lifecycle, progress, attention and details, excluding `observedAt` and read-health telemetry. A later successful poll refreshes observation freshness without inventing a semantic revision/update; a stale→current health transition can still create its own catalog update. Equal source revision with different semantic content is `source-gap`/contract violation. Epoch changes are incomparable until an explicit source reset/recovery result establishes the new baseline. Never sort opaque source tokens lexically or by `observedAt`. A source without ordered tokens must provide serialized reads and a stable version/hash adapter contract; it may report latest snapshots only, not ordered event completeness. An unordered push triggers a new read rather than overwriting current state.

For `replayable-updates` sources, all semantic projection application flows through the serialized durable feed cursor, whose pages contain strictly ordered per-binding semantic revisions (duplicate replay is allowed). Latest reads, command observations and pushes are reconciliation hints until that feed reaches their version. They cannot jump current state ahead of an unconsumed required event. Partial-page recovery replays from the last committed source checkpoint; revisions older than an already committed projection are safe duplicates only because that same ordered feed previously committed their obligations. Reject broken ordering/gaps rather than quietly adopting a newer snapshot. Command application may remain accepted pending feed confirmation. This prevents a latest revision 3 read from suppressing a required revision 2 event during later reconciliation.

The same rule applies to `initialObservation` at registration: replayable sources seed it from an established feed checkpoint/order, not an independent latest read that jumps owed history. A host may explicitly initialize a new source/subscription from a current baseline, but that choice must establish the corresponding feed cursor and state that earlier events are outside its starting guarantee. It cannot reset an existing subscription's owed history.

Only execution fields in the projection can update the task. Parent, responsibility, scopes, identity and source binding remain catalog-owned. Source binding changes are not generic metadata patches. An actor-local source reference may contain its original store identity; it must not be resolved through the new assignee. Recovery preserves that reference and reports unavailable source storage if the original actor is removed without a host preservation policy.

Complete reconciliation must include terminal records, or individually resolve every known binding including terminal outcomes. Discovery of previously unknown tasks needs a host-approved catalog mapper for identity/scopes/responsibility; source observations cannot grant visibility. A source listing only active tasks cannot claim complete recovery. `missing` is unresolved, never automatic cancellation/deletion. A latest-snapshot source can recover the latest terminal/attention state but not transient events it discarded. Durable required intermediate events demand source replay/outbox support and source retention until the broker checkpoint; otherwise reject that requested subscription guarantee.

Commit each projected observation plus its local owed updates before advancing a source cursor. Persist the cursor only after every earlier observation in the page commits; on partial failure retain the old cursor and deduplicate replay. The cursor is local progress, not permission to garbage-collect a source independently. Native catalog reopen rebuilds relationships/projections without source I/O. Explicit reconciliation/host recovery then reattaches running work, records completed work, returns resumable work for host approval, or applies a source-confirmed unrecoverable failure. Repository open never starts external work.

## 6. Scope, authority, hierarchy and reassignment

Parentage is a tree within one repository: one parent, no self-parent/cycle, no missing parent. The child's `parentId` is the authoritative edge; reverse indexes are derived. Creation/attach/reparent validates the entire ancestor chain under the writer gate and checks stop admission. Source bindings may differ across an edge. Cross-repository parenting is excluded. Parent completion and stop evaluation use the authoritative graph, never a filtered display tree.

The host constructs a bound view with principal identity, maximum selectors and a current-policy evaluator. Tools receive this view, not policy constructor inputs. Scopes are `(namespace, key)` labels; responsibility is an independent reference. Neither labels, hierarchy, assignment, source binding, nor command receipts grant permission.

```ts
type TaskAction = 'read' | 'create' | 'update-tracked' | 'command'
  | 'reassign' | 'change-scopes' | 'reparent' | 'subscribe' | 'acknowledge'
  | 'stop' | 'release-stop' | 'complete-list' | 'dispose-obligation' | 'archive';
interface ITaskAccessRequest {
  readonly action: TaskAction;
  readonly task?: ITaskSnapshot;
  readonly command?: string;
  readonly targetResponsibility?: IResponsibility;
}
interface ITaskAuthorization {
  // Created by the host for one principal; principal/scope overrides are absent.
  check(request: ITaskAccessRequest): Promise<Result<boolean>>;
  readonly policyEpoch: () => string;
}
interface IReassignTask {
  readonly taskId: TaskId;
  readonly expectedRevision: TaskRevision;
  readonly operationId: OperationId;
  readonly responsibility: IResponsibility | null;
}
interface IReassignmentResult {
  readonly taskId: TaskId;
  readonly revision: TaskRevision;
  readonly previous?: IResponsibility;
  readonly current?: IResponsibility;
  readonly updateId: UpdateId;
}
```

Authorization may be async, so policy epoch/revision is revalidated when reacquiring the mutation gate. Each relationship operation authorizes the child and both affected parents explicitly; never report a hidden parent's identity on refusal. A long-running query or delivery restarts if its bound policy epoch changes. Projection strips private details/binding/artifact metadata; projector failures return failure instead of falling back to full data. Caller-visible counts, omissions, children and cursors contain only authorized selections. Foreign ID and hidden ID failures are indistinguishable. A host-delegated stop authority can control hidden children, but its public progress report says only “restricted work remains” rather than counts/identities.

`reassign` is an initial broker metadata operation, including for observation-only external tasks. Check `reassign` authority for the task and proposed target, validate the expected revision, and atomically write new responsibility, revision, operation receipt and assignment update. Preserve task ID, parent, children, explicit scopes, outcome, history references and source binding byte-for-byte. Update responsibility indexes before success. Clearing assignment uses explicit `null` in the request; absence is not accidental unassignment.

Reassignment does not quiesce A's turn, cancel work, acquire a lease, grant B access, revoke A, or move the record. A stale native mutation conflicts; an already sent external effect may still finish. The host must coordinate quiescence itself if needed. B's subscription is explicitly initialized from current authorized state plus current attention and selected terminal state; A's acknowledgements never seed B's checkpoint. Existing A obligations remain held or receive an explicit disposition under current policy. No unrequested back-history replay or implicit per-child reassignment occurs.

## 7. Repository, query and broker APIs

```ts
interface ITaskSelection {
  readonly scopes: ReadonlyArray<ITaskScope>; // union, never fallback ordering
  readonly responsibility?: IResponsibility;
  readonly parentId?: TaskId; // direct children; descendant traversal is separate
  readonly lifecycleClass: 'open' | 'terminal' | 'all';
  readonly statuses?: ReadonlyArray<TaskLifecycle['status']>;
}
interface ITaskQuery {
  readonly selection: ITaskSelection;
  readonly limit: number;
  readonly cursor?: PageCursor;
}
interface IDueTaskQuery extends ITaskQuery { readonly cutoff: Instant; }
interface ITaskSummary {
  readonly envelope: ITaskEnvelope; // projected/redacted when exposed by a view
}
interface ITaskPage {
  readonly items: ReadonlyArray<ITaskSummary>;
  readonly unresolved: ReadonlyArray<IUnresolvedTaskReference>;
  readonly nextCursor?: PageCursor;
  readonly generation: number;
  readonly completeness: 'complete' | 'partial';
  readonly freshness: 'native-current' | 'source-projection';
  readonly issues: ReadonlyArray<string>;
}
interface IRepositoryHealth {
  readonly state: 'ready' | 'rebuilding' | 'degraded' | 'unavailable';
  readonly generation: number;
  readonly issues: ReadonlyArray<string>;
}
interface ITaskRepository {
  read(id: TaskId): Promise<TaskResult<ITaskSnapshot | undefined>>;
  query(request: ITaskQuery): Promise<TaskResult<ITaskPage>>;
  queryDue(request: IDueTaskQuery): Promise<TaskResult<ITaskPage>>;
  readCommit(id: TaskId): Promise<TaskResult<ITaskCommitRecord | undefined>>;
  withWriter<T>(action: (writer: ITaskRepositoryWriter) => Promise<TaskResult<T>>):
    Promise<TaskResult<T>>;
  listOwed(subscription: SubscriptionId, limit: number,
    cursor?: PageCursor): Promise<TaskResult<IOwedUpdatePage>>;
  rebuildIndexes(): Promise<TaskResult<IRepositoryHealth>>;
  health(): IRepositoryHealth;
}
interface ITaskCommitRequest {
  readonly expectedRevision: TaskRevision | null; // null only for absent task
  readonly expectedRecordRevision: number | null;
  readonly operationId: OperationId;
  readonly record: ITaskCommitRecord;
}
interface ITaskRepositoryWriter {
  readCommit(id: TaskId): Promise<TaskResult<ITaskCommitRecord | undefined>>;
  register(record: ITaskCommitRecord, operationId: OperationId):
    Promise<TaskResult<ITaskCommitRecord>>;
  commit(request: ITaskCommitRequest): Promise<TaskResult<ITaskCommitRecord>>;
  readConsumer(id: SubscriptionId): Promise<TaskResult<IConsumerRecord | undefined>>;
  replaceConsumer(expectedRevision: number | null, record: IConsumerRecord):
    Promise<TaskResult<IConsumerRecord>>;
  readSourceCheckpoint(sourceId: string): Promise<TaskResult<ISourceCheckpoint | undefined>>;
  replaceSourceCheckpoint(expectedRevision: number | null, checkpoint: ISourceCheckpoint):
    Promise<TaskResult<ISourceCheckpoint>>;
}
interface ISourceCheckpoint {
  readonly sourceId: string;
  readonly revision: number;
  readonly cursor?: string;
}
interface IBoundTaskView {
  query(request: Omit<ITaskQuery, 'selection'> & {
    readonly filter?: Partial<Omit<ITaskSelection, 'scopes'>>;
  }): Promise<TaskResult<ITaskPage>>;
  inspect(id: TaskId): Promise<TaskResult<ITaskSnapshot>>;
}
interface ICreateTrackedTask {
  readonly taskId: TaskId;
  readonly operationId: OperationId;
  readonly title: string;
  readonly description?: string;
  readonly parentId?: TaskId;
  readonly responsibility?: IResponsibility;
  readonly stopPolicy?: ParentStopPolicy;
}
interface ICreateTaskList extends ICreateTrackedTask {
  readonly completion: 'manual' | 'all-children-succeeded';
}
interface ITaskMutationIdentity {
  readonly taskId: TaskId;
  readonly operationId: OperationId;
  readonly expectedRevision: TaskRevision;
}
interface IUpdateTrackedTask extends ITaskMutationIdentity {
  readonly patch: {
    readonly title?: string;
    readonly description?: string | null;
    readonly progress?: ITaskProgress | null;
    readonly attention?: ReadonlyArray<ITaskReference>;
  };
}
interface IChangeTaskScopes extends ITaskMutationIdentity {
  readonly scopes: ReadonlyArray<ITaskScope>;
}
interface IReparentTask extends ITaskMutationIdentity { readonly parentId: TaskId | null; }
interface ITaskMutationResult {
  readonly taskId: TaskId;
  readonly revision: TaskRevision;
  readonly operationId: OperationId;
  readonly disposition: 'changed' | 'unchanged';
  readonly updateIds: ReadonlyArray<UpdateId>;
}
interface IBoundTaskWriter extends IBoundTaskView {
  execute(request: ICommandRequest): Promise<TaskResult<ICommandReceipt>>;
  reassign(request: IReassignTask): Promise<TaskResult<IReassignmentResult>>;
  createTracked(request: ICreateTrackedTask): Promise<TaskResult<ITaskMutationResult>>;
  createTaskList(request: ICreateTaskList): Promise<TaskResult<ITaskMutationResult>>;
  updateTracked(request: IUpdateTrackedTask): Promise<TaskResult<ITaskMutationResult>>;
  changeScopes(request: IChangeTaskScopes): Promise<TaskResult<ITaskMutationResult>>;
  reparent(request: IReparentTask): Promise<TaskResult<ITaskMutationResult>>;
  requestStop(request: IStopRequest): Promise<TaskResult<IStopResult>>;
  releaseStop(request: ITaskMutationIdentity & { readonly intentId: OperationId }):
    Promise<TaskResult<IStopResult>>;
}
interface IRegisterExternalTask extends Omit<ICreateTrackedTask, 'stopPolicy'> {
  readonly kind: TaskKind;
  readonly detailVersion: number;
  readonly scopes: ReadonlyArray<ITaskScope>; // trusted host registration only
  readonly binding: ISourceBinding;
  readonly recovery: RecoveryDeclaration;
  readonly initialObservation?: ISourceProjection;
}
type TaskRegistrationResult =
  | { readonly state: 'resolved'; readonly task: ITaskSnapshot }
  | { readonly state: 'unresolved'; readonly reference: IUnresolvedTaskReference };
```

Repository APIs are trusted host integration contracts, not authorization endpoints. `commit` validates task/record identity, expected revision and storage invariants; the broker owns transition/authorization decisions. Custom repositories must implement the same serialized read/modify/commit coordinator and consumer/catalog operations in §8–9, not merely emulate these six read/write methods. A factory returns the repository plus that coordinator; it must not let two brokers independently mutate the same root. `FileTreeTaskRepository.open({ root, mode, logger, clock, newId })` returns the factory result with an explicit recovery report. `mode` is `session` or `{ durable: 'process-crash' }`; stronger modes fail.

`withWriter` supplies an exclusive, lifetime-bound writer handle; nesting is rejected, and using the handle after return fails. It is serialization, **not** a rollback transaction: each successful replacement remains committed if a later callback step fails. Registration methods execute the inventory protocol; consumer/source replacement with expected revision `null` means registered creation. Read APIs expose only a consistent committed generation and do not observe a registration/index patch midway. The default checkpoint-store facade delegates through this coordinator; an injected alternative joins the same host serialization boundary and must preserve its ordering. Source I/O and model calls stay outside it. This is a single-process contract, not a distributed mutex.

The bound creation APIs obtain scopes from host-configured defaults; only an explicitly authorized host catalog API supplies association changes. Mutation conflicts outside the execution-command path are classified `TaskResult` failures. Task revisions order semantic state/metadata; a separate positive safe-integer **record revision** advances on every storage replacement, including command-receipt maintenance, observation telemetry and pruning. Low-level commit compares both expected revisions and merges against the latest record under the coordinator, preventing stale maintenance from erasing a receipt without unnecessarily invalidating a semantic task precondition. Query generations still change whenever query-visible data changes. Rejected/no-op operation evidence may require a record revision without a task revision.

The broker also exports typed `createTracked`, `createTaskList`, `registerExternal`, `updateTracked`, `changeScopes`, `reparent`, `requestStop`, `releaseStop`, `reconcileListCompletions`, `reconcileSource`, and `recoverTask`. Each mutation uses operation identity and expected revision; creation supplies a stable ID, source registration a host-approved mapping. Read factories, registry factories, and view binding return Result-valued instances. Low-level commits, recovery, checkpoint disposition, and scope/view construction are host APIs, never generic tools. Inspect returns a redacted snapshot and separately evaluated command descriptors; persisted records do not cache authority. Missing kinds yield an explicit unresolved host read result with last-known envelope where valid, not a fabricated typed snapshot; ordinary inspect fails safely.

### Index behavior

Keep resident summaries **only for resolved, non-archived tasks**, including terminal tasks awaiting delivery, disposition or archive. Maintain their secondary ordered sets for `(scope, lifecycle-class)`, `(scope, exact-status)`, responsibility and waiting `notBefore`. All retained tasks also have the minimal identity/graph/source projection below. Use per-scope ordered due sets keyed by `(normalized instant, taskId)` so a due query does not inspect all waiting tasks. Intersect selective filters, union scope candidates and deduplicate by task ID **before** paging. The custom-store contract is behavioral; these exact data structures are not public.

An empty scope selection matches nothing; it is never implicit global access. Unresolved references have a separate scope index and no fabricated lifecycle-class membership. An otherwise matching query reports authorized unresolved references separately and `completeness: 'partial'`; they consume the same bounded page budget. Terminal/open totals cannot classify them until source truth is available.

`open` includes pending/running/waiting/paused. Due queries force `waiting`, require a present `notBefore <= cutoff`, and leave all other prerequisites intact. Absent `notBefore` is excluded; querying never starts work. Owed-update indexes are keyed separately by subscription and update ID, including terminal tasks outside all open indexes. Source reconciliation work is independently indexed; a terminal task cannot vanish from discovery merely by leaving an open-work set.

Sort ordinary pages by task ID; due pages by `(notBefore, taskId)`. Use keyset cursors bound to normalized query, repository open epoch/generation and, for views, bound access identity/policy epoch. Reject changed-query, foreign, post-restart or stale-generation cursors. V1 deliberately restarts paging on mutation instead of claiming a cross-page snapshot it does not retain. Use a server-held cursor handle for views; expiration causes `cursor-stale`, not an empty last page. Cursor contents never expose hidden keys. Each page is consistent at its returned generation. A newer page starts from a new query, with task IDs available for host deduplication.

Limit defaults to 50, maximum 200. Authorization checks run after indexed selection and before inclusion; internal candidate continuation may advance across denied records but no denied counts/keys escape. Return a next-page handle when a bounded candidate budget is exhausted, even if the visible page is empty; do not label it exhaustive. A bound filter may only narrow host selectors, never alter scopes. Responsibility filters also confer no access. An `all`/terminal query intentionally visits terminal candidates; the performance requirement concerns unrelated history, not avoiding data the caller asked to enumerate.

Successful commits update in-memory summary/index membership before returning success. Record commit followed by index failure sets repository unavailable, returns `commit-indeterminate`, and requires rebuild; the durable operation may already exist. No healthy stale index or healthy empty fallback is permitted. Warm ordinary summary and owed-update queries use O(selected candidates plus ordered-set/page overhead), with **zero task record-file reads** from the resident projections below. Detail reads and explicit archived inspection load selected records and are outside that zero-read promise. Growth in unrelated history must not increase hot-query candidate visits; test counters, not just timing. Cold open/rebuild may read all retained data in the bounded passes below. Mutations remain O(record size); creation also rewrites the retained inventory.

### Resident state and on-demand reads — A3

| Category | Resident for the repository's open lifetime | Loaded only for a bounded operation |
|---|---|---|
| Resolved non-archived: pending/running/waiting/paused **and terminal awaiting cleanup** | Full `ITaskSummary` and applicable scope/status/assignee/due memberships; minimal graph/source projection; capacity counts; unresolved-command/stop coordination descriptors | Typed details, full stored operation requests/receipts and settled dedup history, stop target evidence beyond the coordination projection |
| Archived terminal | Task ID, record revision/archive flag, parent ID and child adjacency, final terminal status, kind/version discriminator, bounded canonical source identity where present, capacity totals | Entire final envelope/summary, description/scopes/assignee, details, source revision/evidence, settled stop report and operation dedup history. None is retained through a hidden snapshot/closure reference. |
| Unresolved registration | Bounded unresolved reference, scope memberships, identity/graph/source projection and capacity claims; no invented lifecycle | Registration request/evidence. It consumes both retained-task and non-archived capacity. Unknown/corrupt records instead remain recovery diagnostics, not healthy entries. |
| Owed updates/baselines and live receipt pins | Exact update IDs/audiences, pending/pin membership and the bounded immutable presentation payload required by `pending`/`prepare`; counts charged even for terminal tasks | Already satisfied, unpinned payloads awaiting pruning are read only by cleanup/rebuild. No historical revision cache. |
| Subscriptions, including closed retained records | Identity/state/persisted selection and policy, revision, aggregate capacity counts, current owed and unexpired issued-receipt descriptors | Lifetime exact `acknowledged`/`disposed` sets and reasons. Read one bounded consumer record for acknowledgement/replay/cleanup; never retain all histories or one permanent history cache per consumer. |
| Source and repository records | Source identity/current bounded cursor/health, record inventory IDs/states, minimal pending-registration descriptors, derived capacity ledger | Pending canonical creation requests and source diagnostic/history bodies. No second resident copy of the full manifest or all record JSON. |

Archived final statuses suffice for list aggregation; parent→child and source→ID lookups do not load archived details. Disclosure/inspection of an archived task still loads and authorizes its original envelope. Ordinary `all`/terminal queries enumerate **non-archived** candidates; direct archived inspection remains available. Archiving atomically replaces the disk record, then removes the full resident summary/memberships before success. Retained graph/source/inventory entries are not removed.

The approximate growth model is `O(N identities + graph/source keys + M summaries/index memberships + U outstanding/pinned payloads + S subscription metadata + bounded working/cache space)`, where `M` includes all non-archived categories. `N` still grows with archived history. Lifetime acknowledgement/dedup evidence grows on disk and increases per-record read/rewrite work even when absent from steady-state residency. Repository count and byte ceilings (§8.6), not archival alone, bound the process's managed structures. Serialized-byte accounting is not a V8 heap/RSS guarantee; measurements qualify the supported profile.

Default parsed-record cache: **disabled**. An optional shared LRU is limited by both 32 entries and 8 MiB of encoded charge, includes consumer/dedup/detail records, and is invalidated by record revision. No cache per task/subscription/source; caller-held returned snapshots and host logger buffers are outside library ownership and must be reported separately in measurements. View cursor handles are bounded to 256 per repository, five-minute idle expiry; evicting one yields `cursor-stale`, never lost obligations. Receipt manifests have the independent durable limits in §9. Internal diagnostics keep at most 256 bounded 2 KiB entries plus counts, with further details streamed to the host. Read/materialization concurrency defaults to four bounded record operations plus one serialized writer; excess calls receive retryable backpressure instead of an unbounded internal wait queue. Rebuild drains admitted work, fences queries and releases the old generation/caches before constructing its replacement.

### Bounded open/rebuild — A3

Do not collect every full record into an array, parse records through unbounded `Promise.all`, or hold old and new complete index generations together. Inventory parsing/rewriting is still O(N); budget its encoded buffer, parsed entries and temporary serialization copies explicitly. For accepted records within the stored profile, each record pass has one parsed record in flight:

1. Validate the bounded manifest and scan task/source records sequentially. Project summaries or minimal archived entries, operation/capacity totals, graph data, and **update descriptors without payloads**. Release each full parsed record after projection.
2. Read consumer records one at a time. Match exact acknowledgements/dispositions against pending descriptors for that subscription; keep only owed/pinned baseline payloads, current policy/receipt descriptors and totals. Release each historical acknowledgement set. A satisfied update still pinned by a live receipt remains protected.
3. Reload only task records with owed/pinned updates to retain their presentation payloads. Validate graph/capacity invariants, rebuild completion/stop candidates, and publish one healthy generation. Missing checkpoints block cleanup, as before.

This is up to two task-record passes plus one consumer/source pass, not the earlier single-pass suggestion. Temporary descriptors for unpruned satisfied updates are themselves charged to retained-update limits. Graph validation may use O(N + edges) marks/IDs, but never retains archived bodies. Peak includes inventory buffers, descriptor/validation structures, the final resident projection, one bounded record's parse/validation workspace, and adapter/runtime overhead. Capacity claims and counters are rebuilt from authoritative records; open at an admission ceiling succeeds in drain mode (§8.6), rather than treating a full valid repository as corrupt. Predictions and actual reopen/rebuild measurements are specified in the implementation plan; no measured bound is claimed yet.

## 8. FileTree atomic capability and persistence protocol

### 8.1 Fault model and capability

Initial qualified durability covers abrupt termination of the sole writing process at any instruction, while the OS/filesystem continues operating. Disk-full, permission, write, flush, rename and read failures are surfaced. Atomic replacement prevents torn overwrite; it does not establish hardware persistence. Root storage is exclusively host-managed: no concurrent writers, malicious file replacement, symlink races, external deletion, silent media corruption, or rollback of the whole volume. Detectable corruption/missing records still fails recovery (§8.5). The library cannot reconstruct data after arbitrary storage loss or detect an undetectable rollback without an external authority.

**Qualified as shipped: Node on Linux ext2/ext3/ext4 and tmpfs.** Require same-directory replacement and successful directory synchronization; reject durable construction on unqualified platforms/filesystems. Windows, NFS/SMB, FUSE/cloud-synced roots, **overlayfs**, browser/HTTP/zip/localStorage are unqualified. Session mode remains explicit. A platform string or one successful probe alone is not qualification.

*(Amended 2026-09-22. The original read "Recommend qualifying Node on local Linux ext4 and macOS APFS … Qualification is pending, not a claim that these tests ran." Qualification is no longer pending — F2 ran it — and **APFS/darwin is dropped rather than deferred**: containers execute against the Linux kernel, so a consumer developing on macOS never puts this protocol on darwin. The consequential distinction for a containerized deployment is the **filesystem under the root**, not the host platform — overlayfs is refused, a named volume or Linux bind mount qualifies. See `implementation-plan.md` § F2.)*

The new API separates atomic visibility from acknowledged failure survival. A sibling optional capability avoids adding required methods to every established FileTree implementation:

```ts
// Proposed additions in FileTree, not in the tasks package.
type AtomicWriteGuarantee = 'session' | 'process-crash' | 'os-crash' | 'power-loss';
interface IAtomicWriteCapabilities {
  readonly atomicReplace: boolean;
  readonly guarantees: ReadonlyArray<AtomicWriteGuarantee>;
}
interface IAtomicWriteOptions { readonly guarantee: AtomicWriteGuarantee; }
interface IAtomicWriteReceipt {
  readonly guarantee: AtomicWriteGuarantee;
  readonly replaced: boolean;
}
interface IAtomicWriteFailure {
  readonly code: 'unsupported' | 'not-writable' | 'io';
  readonly stage: 'validate' | 'temporary-write' | 'file-flush' | 'replace'
    | 'directory-flush' | 'cleanup';
  readonly visibility: 'unchanged' | 'replaced' | 'unknown';
}
interface IAtomicFileTreeAccessors<TCT extends string = string>
  extends FileTree.IMutableFileTreeAccessors<TCT> {
  getAtomicWriteCapabilities(directory: string): Result<IAtomicWriteCapabilities>;
  writeFileAtomically(path: string, contents: string, options: IAtomicWriteOptions):
    DetailedResult<IAtomicWriteReceipt, IAtomicWriteFailure>;
}
interface IAtomicFileTreeDirectoryItem<TCT extends string = string>
  extends FileTree.IMutableFileTreeDirectoryItem<TCT> {
  getAtomicWriteCapabilities(): Result<IAtomicWriteCapabilities>;
  writeChildAtomically(name: string, contents: string, options: IAtomicWriteOptions):
    DetailedResult<IAtomicWriteReceipt, IAtomicWriteFailure>;
}
```

Export `isAtomicAccessors` and `isAtomicDirectoryItem` through FileTree's Node/browser barrels. `DirectoryItem` delegates like the existing binary capability. Its guard only narrows methods; the inquiry and write Result remain authoritative. Only the Node and in-memory accessors initially implement the capability. In-memory advertises atomic session replacement, never crash survival. Node advertises process-crash only on qualified roots. Stronger requested guarantees fail before mutation; no silent downgrade. Ordinary `setRawContents`/`saveFileContents` retain existing semantics.

Text is sufficient for task JSON; no atomic-binary extension is needed yet. Require strict UTF-8 reads for durable Node records; in-memory string fixtures validate JSON but do not claim byte-corruption detection. The new capability checks existing mutability policy on destination and directory, writability, path confinement, regular-file status, valid single child name, and requested guarantee. Internal temporary names are reserved to FileTree, not an independent path chosen by task logic. Adapter-owned sibling cleanup/recovery uses a narrowly identified temporary naming format; it never removes arbitrary host files.

`isMutableAccessors` means mutation methods exist; instance/path permission still needs checking. `isPersistentAccessors` means `syncToDisk/isDirty/getDirtyPaths` exist. It is neither necessary for Node write-through storage nor sufficient for transactional durability. Buffered adapters must implement and qualify this new commit capability, including their flush boundary, before tasks can accept them in durable mode. Calling `syncToDisk` on a set of ordinary file writes is not a substitute.

### 8.2 Node write and acknowledgement ordering

For an already existing directory, inside FsFileTreeAccessors:

1. Validate destination, capability and requested guarantee; reject unsupported paths before changing anything. Open the containing directory for later flush. Task roots are private directories; v1 atomic records use a single flat root to avoid per-task directory creation.
2. Create a unique sibling temporary file exclusively with restrictive permissions. Write the complete UTF-8 record, handling incomplete writes. Never truncate the old destination. Use the existing destination's permitted mode policy or a documented private-file default, not a world-readable temp.
3. Flush the temporary file's contents/metadata (`fsync`), then close it successfully. A failure here leaves the previous destination authoritative.
4. Rename the temporary file over the destination on the same filesystem. **This is the visibility linearization point**, for initial creation as well as replacement. Never unlink the old destination first; never fall back to copy/delete.
5. Flush the containing directory, including the newly created/replaced directory entry. Only then return success. Root provisioning must itself finish at the host boot edge before repository initialization; for a future OS-crash profile, every newly created ancestor would also require an explicit flush protocol.
6. Clean up uncommitted temporary files on failure or exclusive reopen. A temp file is never promoted merely because its revision looks newer. Once replacement happened, never “rollback” by overwriting with stale data.

Node exposes the necessary file synchronization operations; a flush option on a write does not supply a rename protocol. The rename/flush ordering above is an engineering protocol built on those operations. [Node filesystem API](https://nodejs.org/api/fs.html#fsfsyncsyncfd).

Atomic replacement concerns what readers can see during replacement. Linux's documented rename behavior supports this distinction; it does not create multi-file atomicity. [Linux rename documentation](https://man7.org/linux/man-pages/man2/rename.2.html).

Flushing the file alone does not flush its parent directory entry. Directory flush is required in the proposed acceptance boundary, but process-kill tests still do not prove power-loss safety on a storage stack. V1 deliberately makes no OS/power-loss promise; stronger qualification must account for filesystem, mount, kernel, device-cache and platform flush semantics. [Linux fsync documentation](https://man7.org/linux/man-pages/man2/fsync.2.html).

A failure after rename is `visibility: replaced` (or unknown where the system call result is ambiguous). The repository fences further writes and reconciles the operation by reading the committed record; a failed call is not proof that nothing happened. It may reestablish the requested flush boundary by atomically rewriting the same complete record with the same operation ID. It must not execute a source effect again during storage reconciliation.

### 8.3 Layout and commit units

Use a host-selected FileTree root. Names use validated generated IDs, never actor/scope names or source-provided path fragments:

```text
repository.json                  format/version, repository ID, inventory + creation intents
task-<taskId>.json                one atomic task commit record
consumer-<subscriptionId>.json    one atomic subscription/checkpoint/issued-receipt record
source-<sourceId>.json            committed reconciliation cursor (safe to lag projections)
<FileTree-owned temporary files>  uncommitted, ignored by task discovery
```

**Execution payload ownership:** the source file above is a **broker source-checkpoint record**, not the executor's authoritative job record. Its 1 MiB limit applies to broker reconciliation metadata. External retained source text, segmentation checkpoints, accumulated claims/entities and other restart payloads remain in the executor-owned store, governed by that store's limits and recovery contract. The task's 64 KiB `details` limit applies to the bounded adapter projection; use stable references for larger artifacts rather than copying the execution record into details or the source-checkpoint file. The catalog owns task metadata and delivery obligations, not a second independently writable execution truth. A custom/co-located repository must preserve these logical boundaries. External bytes are outside the broker's logical quota but remain part of the host's total disk/memory budget and durability qualification; broker reservations do not reserve executor storage.

No persisted query indexes in v1. Inventory is not a mutable projection of task status: it names records that must exist and detects deletion. It contains task, consumer and source-record IDs plus pending registration intents and archive tombstones. A3 also stores the versioned capacity policy here. Names of existing tasks never change on reassignment. Creation updates the inventory, which is O(number of record identities); this is an explicit v1 creation-cost tradeoff, not a history scan on queries or updates. Live inventory entries contain IDs/state, not copies of task summaries or creation requests; clear the pending canonical request when registration becomes live because its accepted evidence is in the record.

```ts
type UpdateCategory = 'lifecycle' | 'progress' | 'attention' | 'result'
  | 'assignment' | 'observation' | 'relationship';
interface ITaskUpdate {
  readonly id: UpdateId;
  readonly taskId: TaskId;
  readonly revision: TaskRevision;
  readonly category: UpdateCategory;
  readonly required: boolean;
  readonly snapshot: ITaskSummary; // bounded immutable presentation data for this revision
  readonly audience: ReadonlyArray<SubscriptionId>;
}
interface IStoredCommand {
  readonly type: 'command';
  readonly request: ICommandRequest;
  readonly principalKey: string;
  readonly dispatch: 'not-sent' | 'possibly-sent' | 'settled';
  readonly receipt: ICommandReceipt;
}
type TaskCatalogRequest =
  | { readonly type: 'create-tracked'; readonly request: ICreateTrackedTask }
  | { readonly type: 'create-list'; readonly request: ICreateTaskList }
  | { readonly type: 'register-external'; readonly request: IRegisterExternalTask }
  | { readonly type: 'update-tracked'; readonly request: IUpdateTrackedTask }
  | { readonly type: 'reassign'; readonly request: IReassignTask }
  | { readonly type: 'change-scopes'; readonly request: IChangeTaskScopes }
  | { readonly type: 'reparent'; readonly request: IReparentTask }
  | { readonly type: 'stop'; readonly request: IStopRequest }
  | { readonly type: 'release-stop'; readonly request: ITaskMutationIdentity & {
      readonly intentId: OperationId } }
  | { readonly type: 'archive' | 'complete-list'; readonly request: ITaskMutationIdentity };
interface IStoredCatalogOperation {
  readonly type: 'catalog';
  readonly request: TaskCatalogRequest;
  readonly principalKey: string;
  readonly receipt: ITaskMutationResult | IReassignmentResult | IStopResult | TaskRegistrationResult;
}
type IStoredTaskOperation = IStoredCommand | IStoredCatalogOperation;
interface IResolvedTaskCommitRecord {
  readonly formatVersion: 1;
  readonly recordType: 'resolved';
  readonly recordRevision: number;
  readonly task: ITaskSnapshot;
  readonly sourceRevision?: ISourceRevision;
  readonly operations: ReadonlyArray<IStoredTaskOperation>;
  readonly updates: ReadonlyArray<ITaskUpdate>;
  readonly stop?: IStopIntent;
  readonly archived: boolean;
}
interface IUnresolvedTaskReference {
  readonly id: TaskId;
  readonly revision: TaskRevision;
  readonly kind: TaskKind;
  readonly detailVersion: number;
  readonly title: string;
  readonly parentId?: TaskId;
  readonly responsibility?: IResponsibility;
  readonly scopes: ReadonlyArray<ITaskScope>;
  readonly binding: ISourceBinding;
  readonly reason: string;
}
interface IUnresolvedTaskCommitRecord {
  readonly formatVersion: 1;
  readonly recordType: 'unresolved';
  readonly recordRevision: number;
  readonly reference: IUnresolvedTaskReference;
  readonly registration: IStoredCatalogOperation;
}
type ITaskCommitRecord = IResolvedTaskCommitRecord | IUnresolvedTaskCommitRecord;
interface IOwedUpdatePage {
  readonly updates: ReadonlyArray<ITaskUpdate>;
  readonly nextCursor?: PageCursor;
  readonly generation: number;
  readonly completeness: 'complete' | 'partial';
}
```

Metadata operations and creation use their own discriminated request variants, not fake execution commands. Converters constrain each catalog request to its corresponding receipt shape (for example, reassign→reassignment result); execution-rejected receipts remain execution-command evidence. Update identity is a collision-free tuple encoding of task ID, task revision and category ordinal; never a timestamp or CRC. The revision and complete owed payload are written with task state. Required attention changes and terminal outcomes cannot be replaced by a newer snapshot or reference to mutable current data. Progress may coalesce only under the rule in §9.

External registration without a usable first observation writes an unresolved record and returns that explicit reference, with no pending/running lifecycle invented. Store registration data and original binding; unresolved nodes participate in graph integrity and block all-children completion/stop satisfaction. Initial observation atomically replaces the unresolved record with the first resolved snapshot plus required update payloads, preserving identity/catalog metadata and incrementing semantic/record revisions. Unresolved references are host-inspectable and renderable as bounded observation issues; they never authorize execution commands. V1 disallows metadata changes to an unresolved record until it is resolved, avoiding a second incomplete mutation protocol. Unknown kind/version corruption of an already resolved record is a recovery issue that preserves its original bytes; it is not converted to this registration variant by dropping data.

Task creation protocol, under the single-writer gate:

1. Preflight all capacity dimensions, including closeout/delivery claims (§8.6). Atomically commit an inventory **pending creation** entry with stable task ID, operation ID, canonical creation request and those claims; reject a conflicting reuse. Failure prevents any acceptance.
2. Atomically write the full first task record, including initial update audiences and stored creation receipt.
3. Atomically mark the inventory entry live. Update query indexes, then acknowledge creation.

Pending + valid task on reopen completes step 3 idempotently. Pending + missing task is an explicit incomplete registration, not an accepted task; the original request can be resumed under current host authorization. Live + missing task is corruption. This ordered registration protocol is also used for consumer/source records. It makes missing accepted records detectable without making routine task mutation a multi-file transaction. No success is returned until both record and inventory requirements are satisfied. Pending-to-live transfers capacity ownership by the same stable claim IDs, never double-charges or releases them early; pending entries with no record continue to consume capacity until resolved. There is no v1 promise that abandoning a pending identity recycles a retained-record slot.

Native mutation: lock → validate authorization/revision/transition → compute matching audiences and immutable updates → replace one task record → patch resident indexes → release lock → publish optional hints → return. Audiences are candidate subscription IDs derived from committed subscription selectors, not durable grants. Match the union of **before and after selection for every mutation**, including lifecycle/status, parent, scope and assignment changes. Thus an open-only subscription receives the terminal exit update, and a parent-filtered subscription receives a reparent exit update even though the new state no longer matches. Required exit payloads retain that audience until ack/disposition; current authorization still gates disclosure. Subscription creation is serialized with these commits (§9), preventing a subscribe/mutate lost-update window.

Task archive replaces the task record with a tombstone only after retention/disposition conditions pass; inventory continues to name it. No physical record deletion or inventory compaction in the initial release. The tombstone uses the same commit-record schema with `archived: true`: retain final validated snapshot/details (including parent edge, terminal lifecycle and stop policy), source revision and operation deduplication evidence; remove eligible old update payloads. **This is not necessarily a small disk record:** history and final details remain. Its resident projection, in contrast, is the explicit minimal entry in §7. Retained children still resolve their parent; aggregation uses the minimal terminal status. Archived tasks are excluded from ordinary scope/open queries but remain in graph integrity/source identity indexes; no dangling references or reused IDs. Reparenting/reopening archived or terminal tasks is unsupported. Archive/tombstone storage is not a compliance audit log and does not reclaim lifetime identity, dedup or acknowledgement-history capacity.

### 8.4 Crash windows

| Interruption point | On-disk truth and required recovery |
|---|---|
| Before/during temp write or before rename | Old task remains complete; orphan temp is ignored/cleaned. New creation has at most a pending inventory intent. |
| After file flush, before rename | Same as above; never infer acceptance from the temp file. |
| After rename, before directory flush or before return | New whole record may be authoritative despite no acknowledgement. Fence on reported I/O failure; reopen/read by operation ID and reestablish the flush boundary. Do not replay effects blindly. |
| After task acceptance, before index patch/hint | Task plus owed updates are durable; rebuild indexes, rediscover terminal obligations, republish hints if desired. |
| After source save, before broker observation | Source replay/complete terminal reconciliation recovers the projection; unsupported source history yields an explicit gap. |
| After projected page records, before source cursor save | Replay page; source revisions/update IDs suppress duplicates. |
| After command dispatch marker, before/after external call | Outcome uncertain until source reconciliation/command lookup; only source-key dedup permits safe resend. |
| After context preparation/issuance, before host processing | No checkpoint moved; issued receipt can be abandoned. Owed updates remain. |
| After host processing, before acknowledgement commit | Duplicate presentation is possible and expected; same receipt is safe to retry. |
| After consumer checkpoint commit, before return or task-update cleanup | Acknowledgement is durable; replay is idempotent. Cleanup can lag without losing state. |

The library cannot atomically commit a host's chat turn and its own checkpoint across stores. Host-first then acknowledgement provides at-least-once presentation; stable update IDs support host deduplication. Never reverse the order to hide duplicates.

### 8.5 Open, corruption and recovery

`open` requires an existing valid repository manifest; a separate explicit `initialize` operation accepts only an empty root (apart from recognized FileTree temps). Never interpret a missing manifest in a nonempty directory as a new repository. Validate manifest, all named records, filename/ID agreement, schema versions, revisions, source mappings, operation identities and relationships before marking indexes ready. Open with corruption returns a diagnostic/recovery handle, not a writable healthy repository; the host may explicitly request partial read-only inspection. Missing consumer checkpoints after prior cleanup are equally serious: do not reset them and claim healthy delivery.

Unknown kind/detail/source code leaves valid raw JSON/bytes untouched and reports unresolved records. A valid common envelope may appear in a clearly unresolved host view, but no typed commands or derived list completion use it. Malformed JSON, invalid UTF-8, inconsistent update identity, dangling/cyclic graph, missing live record or unreadable root blocks healthy queries. Do not silently skip corrupt terminal records during rebuild. No automatic backup rollback that could discard an acknowledged newer state. An administrator can restore or explicitly disposition damaged data outside the normal broker path; recovery reports retain the issue until resolved.

All runtime catalog relationships, assignee/scope indexes and owed-terminal indexes rebuild from committed records using §7's staged projection. Recovery never copies records into the incoming assignee's storage. No process lock file is advertised as fencing: exclusivity is a host deployment requirement, with an in-process root-owner guard to catch accidental duplicate instances. Opening the same root in competing processes is unsupported.

### 8.6 Whole-repository capacity and protected completion — A3

**Recommendation:** minimal archived residency plus the following finite capacity policy is sufficient for a bounded deployment, conditional on validation. It does not meet an indefinite always-on retention requirement. A ceiling without protected completion space is insufficient: it could refuse the terminal write or acknowledgement needed to free capacity. A count of tasks alone is also insufficient because one task or subscription can accumulate history indefinitely.

#### Proposed initial profile

Limits are checked together; whichever dimension fills first governs admission. Counts include durable pending registrations, and count claims as well as used slots. Bytes are canonical UTF-8 serialized lengths, not estimated heap sizes. These are concrete proposed engineering defaults, **not measured safe maxima**. The initial profile must pass the planned measurements before being advertised.

| Dimension | Proposed limit / accounting |
|---|---|
| Retained task identities | 10,000, including archived, unresolved and pending; no recycling in v1 |
| Non-archived tasks | 1,000, including unresolved and terminal awaiting cleanup; archive releases this slot only |
| Retained subscriptions / sources | 256 / 128, including closed/disabled/pending records; no recycling |
| Retained task update payloads / audience links | 20,000 / 200,000 repository-wide, including satisfied-but-unpruned and pinned payloads; at most 32 audience subscriptions per update |
| Exact acknowledgement/disposition IDs | 50,000 per subscription; 200,000 across retained subscriptions; accepted future acknowledgements/dispositions already reserve these slots |
| Stored command/catalog operations | 128 per task; 100,000 repository-wide; unresolved, rejected-after-admission, settled and archived evidence all count, plus protected operation slots |
| Encoded records | Task, consumer and inventory each 8 MiB; broker source-checkpoint record 1 MiB (not the executor-owned job payload; see §8.3). Include unused claims for that record's future growth. |
| Encoded value bounds | Summary/envelope 32 KiB, details 64 KiB, update 64 KiB, operation request 128 KiB, stored operation 256 KiB, issued receipt 64 KiB; IDs 128 UTF-8 bytes, canonical source identity 4 KiB, disposition reason 256 UTF-8 bytes |
| Resident query/source descriptors | Normalized selection/query at most 32 KiB; source cursor/revision token at most 4 KiB each. Bound cursor handles retain descriptors only, never result pages. |
| Whole repository logical bytes | 512 MiB of committed record/inventory bytes **plus unused growth reservations**, including consumer history, command evidence, baseline/receipt data, source records and pending inventory requests |
| Resident owed/pinned payload bytes | 64 MiB encoded charge plus reserved future owed payloads; descriptor/link counts are independently limited above |

Field and aggregate limits apply to both source inputs and native operations. A schema registration must have bounded encoded command/result/projection shapes compatible with these limits; unbounded `JsonValue` does not bypass them. Control fields/capacity claims themselves count in encoded records. Allow finite host-selected profiles at initialization; lower limits must still accommodate the minimum closeout bundle. Store the profile/version, so changed host defaults cannot silently reinterpret a repository on reopen. Expose a trusted host `capacityStatus()` with each dimension's used/reserved/available values and limiting record IDs, never through an unredacted model tool. Report pressure at 80% of any dimension, including reservations, and an explicit admission-blocked/draining state when a requested growth cannot fit; capacity pressure is distinct from corruption/index health.

Provide one narrowly scoped host operation to **raise** stored limits under exclusive ownership after assessing resources and measuring the intended profile. Atomically replace the policy; no record migration or semantic quota relaxation occurs implicitly. Reducing limits in place is unsupported in v1. Opening a valid repository at its stored ceiling must permit reads and protected drain work; opening with incompatible/lower requested configuration must not rewrite or discard it. If the process cannot provision the stored profile, fail construction explicitly and retain the data for a sufficiently provisioned host. Do not implement a corrupt-looking, read-only-at-capacity state that prevents acknowledgement or archival.

#### Admission reservations and crash ordering

Use a vector check: for every applicable count/byte dimension, `used + reserved + newCharge <= limit`. A new accepted operation may exchange its own reservation for committed data; ordinary growth may not spend someone else's reservation. Reserve **schema maxima**, not an optimistic average final outcome size. Maintain a derived ledger under the single writer, reconstructed from authoritative records; do not add a manifest rewrite to every ordinary task mutation.

Every pending/owning record carries versioned `capacityClaims`: stable claim ID, owner task/subscription/operation, purpose, bounded dimension charges, and any audience/obligation identities needed to reconstruct consumption. Purposes are terminal closeout, accepted-operation settlement, subscription acknowledgement/disposition, receipt preparation, and admitted source replay. These fields are converter-validated and computed by the repository, never caller-supplied permission to overspend. Mutation and its claims commit in the same existing record. A consumer acknowledgement consumes the claim associated with that exact update/audience; after a crash, join by exact ID so it is counted as committed history rather than also as an unused acknowledgement reservation. Task cleanup releases update payload charge only after the consumer evidence exists. Claim ownership/consumption ambiguity fences admission and cleanup for recovery; never assume the capacity is free.

This is an additive amendment to the semantic record sketches in §8.3 and §9: both task variants, consumer/source records and pending inventory entries include that stored claim collection. Fully define its discriminated converters and dimension/owner references in T1/T3 before implementing admission. There is no separate authoritative quota file; derived counters can be discarded/rebuilt, but committed claims cannot. Terminal audience claims created by a new subscription can be owned by its pending/consumer record until consumed, avoiding an unprotected multi-task activation window.

Required protected allocations are:

1. **Task acceptance:** reserve the maximum final snapshot replacement, one absorbing terminal transition with all its possible required category payloads (at most the seven defined categories), terminal operation evidence, bounded final attention-disposition evidence, and one archive operation receipt/replacement. Reserve their audience links and future per-subscription exact acknowledgement/disposition evidence too. The terminal snapshot is bounded by the same schema maxima as other snapshots. Any unresolved registration also reserves first resolution and the path through terminal closeout. Archived retained tasks no longer need future transition reserves.
2. **Every admitted update/baseline:** reserve one exact acknowledgement **or** disposition slot and worst-case encoded evidence per audience before accepting the update. Completion/disposition converts that charge; it does not require new history capacity. Establish terminal audience reservations for every active selector that could match the task's terminal or exit transition. Subscription creation, scope/parent/assignment changes and other audience changes must expand/transfer those claims before acceptance; reject the proposed expansion when it cannot fit. Serialize this calculation with task commits as already required by §9.
3. **Every accepted command/stop:** reserve its maximum settled receipt and owed result/projection, including per-target evidence for an accepted cascade, before dispatch. Keep capacity while a result is uncertain. An accepted attempt can settle at pressure without another ordinary operation slot. A fresh retry with a new identity is new admission, not an unlimited entitlement created by the first attempt. Release of a pause intent and recording an unresolved cancel disposition get protected bounded maintenance space when the intent is accepted; this neither guarantees external cooperation nor relaxes the agreed stop contract.
4. **Every subscription:** reserve room for at least one maximum-sized cleanup receipt manifest and its state change, reusable after acknowledgement/expiry/abandonment. Additional concurrent preparations use ordinary headroom (still at most 32). With one outstanding manifest the host can process it or release/expire its pin before preparing the next bounded page. Baseline obligations receive the same acknowledgement reserves as task updates. Receipt expiry never releases the underlying obligation or exact-history claim.

Closeout is a bounded path, not an unlimited emergency pool: a task gets one terminal outcome, its bounded disposition/settlement work, and archive. Ordinary progress, repeated attention changes, reassignment, new subscriptions, new command attempts and additional tasks can be refused. Stable closeout operation identities make retries allocation-free. Record-size checks include transient coexistence of current payloads and new immutable required payloads; replacing a snapshot alone does not release a required historical update. Prepare complete request/result shapes and reserve them before sending an external effect; an oversized/contract-violating result is an observable source-contract issue with bounded diagnostics, never silently truncated into a successful receipt.

For multi-record registration or subscription activation, persist one pending claim owner before activation, then transfer ownership by stable IDs as the existing registration protocol advances. Interrupted activation must retain its reservations and remain inactive until recovery finishes. Rebuild joins those claims before admitting any new work. Source-page cursors still advance only after committed records; projected records/cursors include the claims needed for replay. No new distributed transaction, rollback guarantee or scheduler is implied.

**Source-replay qualification:** finite storage cannot reserve an unlimited sequence of required external events. For `source-replay`, registration/subscription admission must declare and reserve a finite remaining required-update/count/byte envelope sufficient to reach terminal state for the accepted work, including replay needed during recovery. The adapter must honor that bound; production control can enforce it, but an ability to pause indefinitely without a bounded closeout path is insufficient. Reject the stronger guarantee when a sufficient finite envelope cannot be declared and honored. Optional progress still follows the existing coalescing rules, not a new complete-tick-history promise. Additional work/envelope extension is new admission before the producer relies on it; completion of the previously accepted unit must not depend on that extension. This is a material new adapter constraint requiring A3 approval. Observed-state sources retain their existing weaker history contract: when ordinary capacity is exhausted, defer optional fresh sampling, show stale/capacity-blocked observation, and keep the protected terminal observation/recovery path available. Never skip an already committed required update or advance a replay cursor over an uncommitted required event to fit the cap. A source violating its declared finite contract remains an explicit issue; no finite store can promise to absorb arbitrary external growth.

#### Behavior at capacity and compaction deferral

Ordinary admission returns `code: 'backpressure'` with structured `capacity.reason: 'capacity-exhausted'`, dimension, used/reserved/requested/limit and whether cleanup could reclaim it. Return it before acceptance, subscription activation or external dispatch; no hidden eviction. Completion/accepted-command settlement, authorized acknowledgement/disposition, receipt cleanup, retained-operation lookup/replay, source reattachment/recovery within admitted bounds, update pruning, and eligible archive use their pre-existing claims and remain callable. Capacity does not waive authorization, required delivery, unresolved-command blockers or stop predicates. This is a guarantee against **logical capacity deadlock**, not a guarantee that an unavailable executor will finish, a user will acknowledge, or real storage allocation/I/O cannot fail.

The host must provision space beyond the logical budget for atomic replacements, inventory serialization and scratch files; at least the largest old/new record pair and crash-temp cleanup are part of qualification. Logical claims do not preallocate physical disk or cap V8/RSS. Repeated I/O failure fences the repository as before; recovery must clean recognized uncommitted temps without dropping accepted records.

At a reclaimable ceiling, a host can stop new admissions, complete accepted tasks, drain/disposition obligations under existing policy, expire/abandon receipt pins, prune eligible updates, and archive eligible tasks. This releases non-archived/payload/cache capacity, **not** retained task identities, exact acknowledgement/disposition IDs, or dedup evidence. Closing subscriptions still retains their history; creating a new subscription does not reset whole-repository counts and may require new terminal reservations.

At a lifetime ceiling, the in-scope choices are (a) keep the repository available for reads/drain but accept no further growth, or (b) explicitly raise finite limits after provisioning/qualification, which postpones exhaustion rather than eliminating it. A host can close a drained repository to release its process memory while retaining its files; that supplies no merged query/history or continuity into a new repository. V1 supplies **no supported deletion, identity reset, repository rotation with continuity, cross-root migration, or compaction escape hatch**. Out-of-band file deletion remains corruption, not maintenance. Do not recommend it as capacity remediation.

Compaction can therefore remain deferred only if the orchestrator/user accept a finite history horizon and these operational choices. Adoption must estimate retained task creation, acknowledgement/disposition IDs and command evidence rates, including cheap short-lived tracked checklist items; report the earliest limiting dimension and reserved drain margin. An always-on host requiring indefinite operation under a fixed resource budget needs a separately approved compaction/deletion design **before that adoption**, covering graph/source identity, operation replay horizons, exact receipt/history retention and crash ordering. Minimal archived entries plus these caps do not settle that larger requirement.

That finite-history tradeoff is accepted for the reference consumer's disposable V1 ingestion hubs. It is explicitly **not** accepted for its future autonomous collective. The consumer does not claim measured production creation/acknowledgement/evidence rates or heap/RSS figures; its reported execution-record bytes do not replace M1 or a measurement of the actual bounded adapter projection. This scoped adoption decision leaves the library's `source-replay` qualification requirement intact for adapters that request it.

## 9. Consumption, pure receipts and durable checkpoints

### Pure rendering in both modes

```ts
interface ITaskContextBudget {
  readonly maxItems: number;
  readonly maxDepth: number;
  readonly maxChars: number;
}
interface IInclusionEntry {
  readonly taskId: TaskId;
  readonly revision: TaskRevision;
  readonly updateIds: ReadonlyArray<UpdateId>;
}
interface ITaskInclusionReceipt {
  readonly version: 1;
  readonly deliveryId?: DeliveryId; // absent for ordinary snapshot-only calls
  readonly included: ReadonlyArray<IInclusionEntry>;
}
interface ITaskContextInput {
  readonly tasks: ReadonlyArray<ITaskSummary>; // a validated snapshot also satisfies this shape
  readonly unresolved?: ReadonlyArray<IUnresolvedTaskReference>;
  readonly updates?: ReadonlyArray<ITaskUpdate>;
  readonly deliveryId?: DeliveryId;
  readonly completeness: 'complete' | 'partial';
}
interface ITaskContext {
  readonly text: string;
  readonly entries: ReadonlyArray<ITaskSummary>;
  readonly receipt: ITaskInclusionReceipt;
  readonly omissions: {
    readonly visibleItems: number;
    readonly requiredUpdates: number;
    readonly reasons: ReadonlyArray<'items' | 'depth' | 'text' | 'partial-input'>;
    readonly exhaustive: boolean;
  };
}
declare function renderTaskContext(input: ITaskContextInput,
  budget: ITaskContextBudget): Result<ITaskContext>;
```

Snapshot-only hosts supply already authorized validated values and own freshness, persistence and optional checkpoint policy. Rendering is deterministic and side-effect-free: no repository, clock reads, issued receipt store, subscription, random ID or acknowledgement. It echoes an optional supplied delivery ID; this never authenticates it. It does not invent update IDs/history. Same task/revision duplicates collapse; conflicting values for the same revision fail. Conflicting revisions in snapshot-only input fail rather than choosing freshness without a declared source contract.

Duplicate comparison concerns semantic presentation data; observation timestamps are telemetry. Use the newest validated observation timestamp for otherwise identical duplicates without inventing an update. Broker unresolved-query issues render in a separate diagnostic block and carry no fictitious task revision inclusion/acknowledgement; live delivery can retain a genuine observation update only when it has a resolved task revision.

Selection priority: outstanding required attention; owed terminal outcomes; assignment/recovery changes; current open work; routine progress. Stable tie breaks use task ID and update ID. Multiple required revisions of one task remain distinct render items. If not all fit, omissions report visible unrendered items/updates only, including an explicit nonexhaustive marker for paged input. Do not count hidden records or infer absence/completion from omitted children. Detail truncation may abbreviate current descriptive prose with a visible marker, but **a required update is acknowledged only if its complete bounded delivery payload fits**. Omit that update's ID from the receipt when abbreviated. A title-only mention is not delivery of an outcome. Never acknowledge a maximum revision across a truncated set.

Default context budget: 20 items, depth 3, 8,000 UTF-16 characters including framing/omission text. Reject impossible budgets; reserve omission/framing space before selection. No claim to count tokens without a supplied tokenizer. Place task prose in an escaped structured-data block under trusted fixed framing; do not recursively render Mustache from task text. Rendered text, titles and outcomes remain untrusted data. Host projection establishes what artifacts/details may be disclosed.

### Subscription creation and obligation audience

A durable subscription has a host-selected consumer identity, immutable subscription ID, selection, delivery guarantee and explicit start policy. Consumer identity can mean actor, actor/context or another host identity; FGV never guesses. V1 start policies are `current` (current selected snapshots, including current attention and selected terminal tasks) or `from-now` (only subsequent commits, requiring explicit host choice). No implicit historical replay. Changing selection creates a new subscription; the old one must be closed with a disposition, not quietly repurposed.

Under the shared writer gate: capture authorized starting snapshots → write a consumer record containing the start obligations and subscription specification via inventory registration → activate it for audience matching → release. Later task commits then include it in audience lists. Do not activate before persistence or compute a baseline outside this serialization window. Recheck policy epoch before commit. Baseline size is bounded by configuration; fail/backpressure rather than pretending a paginated partial baseline is complete. The host can intentionally choose narrower subscriptions. Bootstrap obligation IDs use `(subscriptionId, taskId, revision, 'initial')`; their immutable payload lives in the consumer record, with identical receipt rules.

Required delivery covers the updates committed while the subscription matches, plus its explicit baseline. Native attention/terminal updates are required; assignment/recovery/lifecycle can be required by a fixed subscription policy. Routine progress may retain only the latest undelivered progress revision per task/category, provided it contains no required attention/outcome and is not pinned by an issued receipt. Coalescing emits a range/gap description; no complete tick history is promised. External-source guarantees are capped by §5 source history. Required updates cannot expire or be dropped to satisfy capacity.

`pending`/`prepare` select persisted audiences plus baseline obligations, not a fresh reapplication of lifecycle/parent filters to today's task. Otherwise an owed terminal or reparent-exit update would disappear when it leaves the subscription's current-state selection. Recheck current host disclosure authority, but preserve the original audience until acknowledgement/disposition.

### Receipt provenance and acknowledgement boundary

```ts
interface IAcknowledgementResult {
  readonly subscriptionId: SubscriptionId;
  readonly newlyAcknowledged: ReadonlyArray<UpdateId>;
  readonly alreadyAcknowledged: ReadonlyArray<UpdateId>;
}
interface IBoundTaskDelivery {
  prepare(budget: ITaskContextBudget): Promise<TaskResult<ITaskContext>>;
  acknowledge(receipt: ITaskInclusionReceipt): Promise<TaskResult<IAcknowledgementResult>>;
  pending(limit: number, cursor?: PageCursor): Promise<TaskResult<IOwedUpdatePage>>;
}
interface IConsumerCheckpointStore {
  read(subscriptionId: SubscriptionId): Promise<TaskResult<IConsumerRecord>>;
  replace(expectedRevision: number | null, record: IConsumerRecord): Promise<TaskResult<IConsumerRecord>>;
}
interface ITaskDeliveryPolicy {
  readonly schemaVersion: 1;
  readonly durability: 'session' | 'process-crash';
  readonly history: 'observed-state' | 'source-replay';
  readonly requiredCategories: ReadonlyArray<UpdateCategory>;
  readonly coalesceProgress: boolean;
}
interface IIssuedTaskReceipt {
  readonly receipt: ITaskInclusionReceipt;
  readonly expiresAt: Instant;
  readonly state: 'issued' | 'acknowledged';
}
interface IConsumerRecord {
  readonly formatVersion: 1;
  readonly id: SubscriptionId;
  readonly consumerId: ConsumerId;
  readonly revision: number;
  readonly selection: ITaskSelection;
  readonly start: 'current' | 'from-now';
  readonly policy: ITaskDeliveryPolicy;
  readonly state: 'active' | 'closed';
  readonly baseline: ReadonlyArray<ITaskUpdate>;
  readonly acknowledged: ReadonlyArray<UpdateId>;
  readonly disposed: ReadonlyArray<{ readonly updateId: UpdateId; readonly reason: string }>;
  readonly issued: ReadonlyArray<IIssuedTaskReceipt>;
}
```

`IConsumerCheckpointStore` is injected into the acknowledgement service. The default uses the same FileTree root, capability and writer coordinator. An alternative store must declare and meet at least the task repository's durability profile, capacity/reservation contract and serialized revision replacement. A weak checkpoint store cannot be paired silently with durable task-update deletion. Persist the versioned policy with the subscription; never reconstruct required categories/history from changed host defaults on reopen. Terminal updates and attention are mandatory required delivery, irrespective of optional additional categories; validate that the stored policy expresses this. `source-replay` requires a replayable source and the finite capacity qualification in §8.6 for every covered external binding; admitting an incompatible source into that subscription's selection fails explicitly before registration/association, never downgrades its guarantee. V1 retains exact acknowledged/disposed ID sets while the subscription record is retained, including after closure; neither task archival nor closure compacts them. Load these histories on demand as specified in §7 and charge lifetime count/byte limits. Compaction remains deferred only under §8.6's finite-horizon acceptance; no high-watermark approximation is allowed.

Broker `prepare` is deliberately a service operation around the pure renderer:

1. Capture current authorized projected tasks and owed updates, allocate a delivery ID through the injected ID factory, then invoke the pure renderer.
2. Under the consumer writer gate, recheck current authorization/policy epoch and referenced update availability. Persist an **exact issued-receipt manifest** containing the renderer's complete included entries and expiry, bound by its containing subscription/consumer record. Pin those update payloads. Only return prepared context once this succeeds. If state changed, regenerate; never silently add new revisions.
3. The host retains the receipt outside prompt text and calls acknowledge after its successful-processing boundary. Render itself never performs either write.

On acknowledgement: convert strict receipt shape; locate the exact unexpired issuance in the bound subscription; compare all included task IDs, revisions and update IDs to that issuance using full canonical JSON, not a lossy hash; verify referenced owed/baseline entries or acknowledged tombstones; recheck current access and acknowledgement authority for every entry. Reject fabricated, enlarged, shortened, foreign-consumer, wrong-revision or snapshot-only receipts. A copied valid receipt from the same subscription is a valid replay, not proof of a new presentation. Host API custody and issuance validation are the provenance mechanism; no secret embedded in model-visible text and no custom signature scheme.

Only then atomically replace the consumer record with exact acknowledged IDs and issued state. Return success after its durable boundary. A receipt for revision 4 never acknowledges revision 5 or an omitted revision-3 attention update. The highest seen revision may be retained as a display optimization, never used as the obligation-clearing criterion. A replay returns `alreadyAcknowledged` and cannot consume newer updates. After issuance expiry, reject replay as expired/invalid without changing checkpoints; a fresh preparation can present still-owed updates. Expiry releases receipt pins, **not** required obligations.

Receipt validity proves which library-issued inclusion was processed under a bound host context; it cannot prove that a model saw, understood or acted on text. The host must ensure the actual final prompt/turn still includes the issued context. Prompt edits that remove/abbreviate it invalidate the host's right to acknowledge it. Prompt helper checks in §11 make this concrete. No model tool can acknowledge, forge a consumer context or declare arbitrary revisions read.

### Retention and delivery failures

Keep required updates until every listed subscription acknowledges or explicitly disposes of them. Access revocation blocks delivery; it does not automatically count as acknowledgement. A host-authorized disposition records update ID and reason (consumer retired, access removed, explicit abandonment). Closing a subscription must choose to retain owed work or disposition it explicitly. Reassignment never edits another consumer's acknowledgement sets.

A task update can be pruned only after durable consumer records prove all audiences satisfied/disposed and no live receipt pins it. Prune in a later atomic task replacement. Crash before pruning leaves harmless duplicates; checkpoint loss/corruption blocks pruning. Task archive also requires no unresolved commands, active stop intent, owed/baseline payload references or retained attention without explicit host disposition. Current attention references remain host-owned; task archival does not close those interactions. Source removal must not erase delivery obligations.

Issuance default lifetime is 24 hours with a cap of 32 **unexpired** manifests per subscription, including acknowledged manifests still valid for replay. Remove expired/abandoned issuance records and pins through bounded maintenance; lifetime exact acknowledgement/disposition evidence remains. One manifest slot and its maximum bytes are protected for draining already accepted updates (§8.6); hosts may need to finish and explicitly abandon that preparation before reusing the slot. Abandonment is allowed after acknowledgement too: subsequent receipt replay is invalid, while its exact acknowledgement history remains intact. This permits sequential draining at capacity without waiting for 24-hour expiry. Failed/aborted model calls do not acknowledge. A deliberate abstention may be acknowledged only by explicit host policy after its chosen durable success boundary. Observer exceptions are logged through injected logging and may lose a best-effort hint, never the committed obligation. Backpressure rejects new growth while preserving existing owed work and its drain reservations; source cursors do not advance past an uncommitted required update. No transient notice TTL, `RetainingRingBuffer`, or open-task index replaces this store.

## 10. Exact initial cascade-stop semantics

The preset is available only on broker-managed tracked parents/task lists whose complete tree membership is owned by this repository. It coordinates the root's own work **and every transitive descendant**, not just direct children. A descendant's `stopPolicy: none` does not block ancestor traversal; it only controls requests originating at that descendant. No display-depth/visibility budget limits authoritative traversal. Hosts with externally mutated topology cannot enable this preset without routing all admission through the same broker boundary.

```ts
type StopMode = 'pause' | 'cancel';
type StopTargetState = 'unexamined' | 'pending' | 'confirmed'
  | 'unsupported' | 'denied' | 'unavailable' | 'refused' | 'indeterminate';
interface IStopTarget {
  readonly taskId: TaskId;
  readonly attempt: number;
  readonly operationId: OperationId;
  readonly state: StopTargetState;
  readonly confirmedRevision?: TaskRevision;
  readonly stableSourceEvidence?: {
    readonly sourceId: string;
    readonly contractVersion: string;
    readonly sourceRevision: ISourceRevision;
  };
}
interface IStopIntent {
  readonly id: OperationId;
  readonly rootId: TaskId;
  readonly mode: StopMode;
  readonly requestedBy: string; // provenance; never a retained authorization grant
  readonly targets: ReadonlyArray<IStopTarget>;
  readonly state: 'pending' | 'blocked' | 'satisfied' | 'released' | 'settled';
  readonly topologyGeneration: number;
}
interface IStopRequest {
  readonly taskId: TaskId;
  readonly expectedRevision: TaskRevision;
  readonly operationId: OperationId;
  readonly mode: StopMode;
}
interface IStopResult {
  readonly intentId: OperationId;
  readonly state: IStopIntent['state'];
  readonly targets: ReadonlyArray<IStopTarget>; // view-filtered for caller
  readonly restrictedWorkRemains: boolean;
}
```

1. Check root stop authority, revision, declared policy and topology ownership. Capture the authoritative root+descendant set under the writer gate. Bound the maximum targets (default 1,000); oversized trees are rejected before effects, not silently truncated. Persist the root stop intent, operation receipt, full target IDs, stable per-target command IDs and update obligation **before dispatching any command**. Initial receipt is accepted/pending.
2. The active intent immediately freezes admission: reject attach/create/reparent **into, within or out of** the captured subtree, including below nested descendants. Reject start/resume and new execution attempts that the broker controls anywhere under the latch. Also reject **every transition leaving its required stopped-state set**, including paused→waiting through `wait` under a pause latch; command spelling cannot bypass the invariant. Creation outside it remains possible. A concurrently arriving edge either commits before intent capture and is included, or is rejected afterwards. On recovery enforce the latch before enabling mutations.
3. Dispatch deterministically root first, then breadth-first with task-ID tie breaks. Before every send, including retry/recovery, resolve current host authority separately for that target and recheck capability/current revision. Known unsupported/denied/unavailable/refused targets become blockers; still attempt other eligible targets. Root own stop may therefore apply while children continue. Public lifecycle describes the root's own execution, while the separate stop result remains blocked/pending. No status field falsely represents tree-wide completion.
4. Store each command's native intent/receipt in its own task record via the ordinary command path. Reconcile progress into the root intent; this root summary is allowed to lag those records and is rebuilt by stable target operation IDs. A crash between a child effect and root-summary update must not resend a non-idempotent effect. This is ordered coordination, not a cross-task transaction. Applied effects are never rolled back because another child refuses.
5. A target satisfies **pause** if authoritative state is paused or terminal, and **cancel** if terminal (possibly succeeded/failed before cancellation won). Pending/running/waiting is not stopped. A target already stopped at preflight requires read/coordination authority to establish that state; it need not support a redundant stop command. An observation-only open child is unsupported and blocks satisfaction. A command accepted without confirmed quiescence stays pending. A timeout/unreachable target is unavailable or indeterminate, never confirmed by elapsed time.
6. Before marking satisfied, revisit every target, ensure no unresolved records/topology inconsistencies, and verify the required stopped state plus source stability contract. Native tracked states are held by the admission latch. An external source can opt into a **stable stop** declaration through `ISourceCapabilities.pause` only when its acknowledged stop prevents autonomous restart/new work in that task until an explicitly authorized resume. Terminal observations must satisfy the terminal-absorption contract. Persist the source capability contract version and confirming source revision in the target evidence; revalidate capabilities/evidence after reopen before presenting satisfaction. Sources providing only a sampled paused state can report that observation, but block a standing-stop guarantee. No library assertion can manufacture external fencing.
7. Root satisfaction is persisted only after the target evidence commits. If a later source observation contradicts a purported stable stop, mark intent blocked, emit a required recovery issue, and reconcile under current authority. Never keep an unqualified “stopped forever” claim. The guarantee is conditional on source contract compliance and the sole admission owner; it is not distributed consensus.
8. `releaseStop` is host-authorized, revision-checked and explicit. A pause latch may be released even with blockers after the host accepts the visible partial state. Release stops future coordinated retries; it does not undo applied pauses or retract commands already sent. Children/root resume only through separate authorized commands after all applicable latches are gone. A cancel latch on a terminal root cannot be released to reopen the tree in v1. Once all targets are confirmed terminal and other retention conditions pass, archive may atomically transition its satisfied cancel intent to `settled` while preserving target evidence/final summary and terminal graph edges. Terminal membership/transition rules then preserve closure without an active coordination intent. A blocked cancel cannot be archived as satisfied; explicit disposition may record abandonment but must retain an unresolved partial-stop report and cannot claim success.

Overlapping intents are represented independently. Cancellation is the stronger target condition: it also satisfies a pause target. Never issue resume as compensation, and never weaken an active cancel. Releasing one pause intent leaves other ancestor/descendant latches enforced. Stable child command IDs are derived from `(root intent ID, target ID, mode, attempt)` using validated tuple encoding. Persist each target attempt/precondition before dispatch; a restart discovers its effect by that same key. A definitely unsent or conclusively rejected/no-effect attempt (including revision conflict) may be superseded by a persisted incremented attempt with a fresh current revision, after authorization. An accepted/uncertain/possibly-sent attempt keeps its exact request/key until source reconciliation resolves it; do not change its expected revision and reuse the old key. Earlier attempts remain in task operation evidence. An existing child's in-flight start predating the stop may win at its source; reconcile and apply stop to the authoritative resulting state rather than pretending acceptance prevented the race.

New descendants are **rejected while a stop is pending, blocked or satisfied**, including newly discovered external children requesting attachment. They remain independently registered/unparented only if the host explicitly requested that alternative; the failed attachment is never silently ignored. After a pause latch is released, new admission is an ordinary authorized operation; a remaining ancestor latch still rejects it. Direct out-of-band source work or topology mutation violates the preset's admission contract and is reported as unresolved, not treated as covered. This conservative policy closes the “yesterday's child list” hole without adding an execution scheduler.

An explicit host pump `reconcileStop(intentId)` performs bounded work and returns the latest result; it does not install a timer, start a task, or invoke a model. Blocked intents remain durable and inspectable until resolved/released/dispositioned under policy. Observation-only ingestion cannot validate this command path; the simulated source in the proving ground must do so.

## 11. Tools and prompt integration

### ai-assist factory

```ts
type TaskToolName = 'tasks_list' | 'tasks_inspect' | 'tasks_create_tracked'
  | 'tasks_update_tracked' | 'tasks_reassign';
interface ICreateTaskToolsParams {
  readonly view: IBoundTaskView;
  readonly writer?: IBoundTaskWriter;
  readonly tools?: ReadonlyArray<TaskToolName>;
  readonly commandTools?: ReadonlyArray<string>; // registered kind+command keys
}
declare function createTaskTools(params: ICreateTaskToolsParams):
  Result<ReadonlyArray<AiAssist.IAiClientTool>>;
```

Default to list and inspect only. Mutations and each registered command tool are opt-in. Create/update/reassign use the same bound broker methods, never raw repository mutation. Creating a tool set that requests writer-only methods without the matching `IBoundTaskWriter` fails; if supplied, its bound principal and scope boundary must match the read view. Merely supplying a writer does not enable mutation tools. No create/update tool for externally authoritative lifecycle; no request/answer/acknowledgement/recovery tool.

Generate a statically named tool per enabled kind command, with an outer schema containing task ID, expected revision, operation ID and a **typed parameters schema** derived from its descriptor. Reject duplicate/invalid names at factory construction. Do not expose `tasks_execute(command: string, payload: unknown)` to the model. Direct broker `execute` still converts its `JsonValue` through the registered command schema. `JsonSchema.Static` provides the per-tool TypeScript type; erased tools wrap validation with an `unknown` callback, following memoryTools.

No tool argument chooses principal, consumer, authorization context or scope. Create uses host-approved default scope associations; responsibility targets may be requested only as data checked by policy. List filters narrow lifecycle/status/parent within the bound selection. Revalidate arguments inside `execute` as well as in the ai-assist tool loop, and reject surplus actor/scope fields. Check live capabilities and authority at execution, not just in static descriptions. Bound result sizes and use the same safe projection as context. Tool annotations are advisory; neither descriptions nor prompts replace enforcement.

Use existing `AiAssist.IAiClientToolConfig` with `type: 'client_tool'`, `parametersSchema`, and `execute: (...) => Promise<Result<unknown>>`. Preserve machine-readable command outcome in the success value; serialize classified transport failures into sanitized tool error messages. Hosts retain provider choice, multi-round `executeClientToolTurn` policy, budgets and reactive mutation permissions.

### Prompt fragments and checked composition

Export task fragment descriptor/template factories and `taskContextSubstitutions(context): Result<PromptSubstitutions>`. Use the existing `PromptLibrary`, literal/resource bindings, slot declarations and substitutions. The default uses **one trailing dynamic `taskContext` slot** containing the already bounded current/update/attention sections; fragments may also be consumed individually by a host that owns final placement. Keep the immutable inclusion receipt alongside context, outside text and substitutions.

Default final body structure:

```text
<fixed trusted instructions and task-data interpretation rules>
<stable host context, if any>
{{{taskContext}}}
```

No frozen text or trailing literal suffix is appended after the per-request slot; any closing data delimiter is part of its dynamic value. The task slot is declared `cacheStability: 'per-request'`, uses a noninstruction framing directive supported by prompt-assist (the default literal prose binding plus explicit fixed data framing), and has a bounded length compatible with context budgets. Stable host slots have justified explicit stability hints. Task contents are rendered once as data, never as prompt templates/resources selected by source text.

The helper resolves final body with `composition: {}` and returns `{ resolved, cacheRequest, receipt }` only after these checks:

1. `resolved.composition` exists and `unavailable` is absent; sections are contiguous, gapless and reconstruct `resolved.body`, with correct UTF-16 lengths. Do not accept `cacheFindings: []` as a substitute.
2. The final task slot has per-request effective stability and its full value was included exactly once. Enforced bindings, missing slots, maximum-length safeguards, screening or host overrides that alter/drop issued task context fail this integration check; no acknowledgement of its original receipt is then permitted.
3. There is no unexplained `cache-hostile-ordering` or task-related `stability-refuted` finding. Establish the expected nonempty stable prefix; classify `threshold-unknown` separately, and do not fake token-threshold evidence with a character counter.
4. Call `toCacheRequest(composition, hints)` and verify expected breakpoint offsets. The actual ai-assist `system` string must be exactly `resolved.body`. Any post-resolution prefix/suffix/reordering requires resolving/analyzing the final body again; do not reuse old offsets.
5. With only task progress changed, stable-prefix characters and breakpoint offsets remain identical while the task slot and receipt revision change. Repeat for an empty task set and multibyte/astral text; offsets are UTF-16 code units, not bytes.

Credential-free tests use the existing ai-assist request builders with captured outbound bodies to confirm the tools, system text and cache breakpoints actually reach the request. No provider cache-hit claim follows from composition diagnostics. `HorizontalComposer` does not currently return the needed composition map; either resolve a final enclosing prompt whose metadata describes the complete body, or treat that host integration as unverified. Do not invent offsets by searching finished text for repeated fragments.

## 12. Compatibility check and approval boundary

The multi-agent chat ingestion proposal fits through a source-specific detail kind, stable original-store binding, observation-only command set, broker-owned scopes/parent/responsibility, complete terminal reconciliation and independent consumer checkpoints. If its existing store is retained, its repository adapter must pass the same indexed query and durability/obligation contracts. A source write plus transient notification remains an unsafe dual write; upgrading FileTree dependencies alone cannot strengthen those old call sites. Existing announcement-attempt markers must not be treated as presentation acknowledgements.

Library tests can prove that integration shape with a fake source; they cannot prove the consumer's recipient selection, human priority, room occupancy, turn commit, UI or migration behavior. Those remain adoption decisions, mapped explicitly in the plan. No private application identity is required in the library or example. A single host using snapshot-only rendering or tracked tasks needs no conversation, agent-memory vault or external service.

A1, A2 and A3 in §1 are approved, with reference-consumer acceptance of A3 limited to disposable V1 ingestion hubs. The future autonomous collective still requires a separately approved compaction design before adoption. These choices authorize neither an implicit consumer rollout nor other deferred features. After explicit implementation authorization, begin with F1's isolated upstream FileTree capability contract/session implementation, then F2's Node implementation and crash qualification; only after that gate passes build the durable task repository. Capacity qualification and M1 measurements remain mandatory: design approval and consumer execution-payload measurements are not evidence that those gates have passed.
