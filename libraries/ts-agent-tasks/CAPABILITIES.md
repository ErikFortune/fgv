# `@fgv/ts-agent-tasks` — agent task recording and mediation

> **This file is authoritative for what `@fgv/ts-agent-tasks` provides and what not to hand-roll.**
> `README.md` is getting-started material. The always-loaded index at
> [`.ai/instructions/LIBRARY_CAPABILITIES.md`](../../.ai/instructions/LIBRARY_CAPABILITIES.md)
> routes here; it never duplicates this content.

---

[libraries/ts-agent-tasks](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-agent-tasks)

**A library that records work and mediates observations and commands. It runs no agent loop** —
no scheduler, no executor, no model invocation, no retry policy. Hosts call it; nothing here runs
on its own, and importing it has no side effects.

## What ships today

This release is the **vocabulary**: the `types` and `converters` packlets. Storage, the broker,
context rendering, delivery, tools and prompt integration follow in later slices, and are
deliberately absent from the export surface rather than stubbed.

**The common envelope.** `ITaskEnvelope` is what every task carries whatever its kind — branded
`TaskId` / `TaskKind` / `TaskRevision`, a `title` and optional `description`, an optional
`parentId`, a `ParentStopPolicy`, an optional `IResponsibility`, `ITaskScope[]`, the
`TaskLifecycle`, optional `ITaskProgress`, `ITaskReference[]` attention, an optional
`ISourceBinding`, a `RecoveryDeclaration`, `ObservationHealth`, and `createdAt` / `changedAt`
instants. `ITaskSnapshot<T>` pairs it with kind-specific details, which are `JsonValue` at the
heterogeneous boundary and become `T` only through a registered handle.

**Four things version independently, and are spelled separately.** `schemaVersion` (the envelope,
always `1` in v1), `detailVersion` (the kind's detail schema), `ISourceBinding.referenceVersion`
(the source's opaque reference), and the repository storage format. Capacity claims and the
capacity profile carry their own `claimVersion` / `profileVersion` for the same reason.

**The lifecycle is seven states, and each carries what makes it meaningful.** `TaskLifecycle` is
discriminated on `status`: `pending` / `running` carry nothing, `waiting` carries an
`IWaitingReason`, `paused` carries an `ITaskReason`, `succeeded` carries an `ITaskOutcome`, and
`failed` / `cancelled` carry a reason plus an optional outcome. `terminalTaskStatuses` /
`openTaskStatuses` / `isTerminalTaskStatus` name the partition. **Observation health is a separate
union** (`ObservationHealth`) precisely so that a source outage cannot move a task through its
lifecycle — an outage makes the observation `stale` or `unavailable` and nothing else.

**Waiting carries only opaque attention references.** `ITaskReference` is a `(namespace, key)`
pair and nothing more: identity, never permission to dereference. There is **no input-request,
answer, expiry, arbitration or continuation protocol** in this library, by decision rather than
by omission — do not add one downstream by putting a request payload in a reason.

**Classified failures.** `TaskResult<T>` is `DetailedResult<T, ITaskFailure>`; `ITaskFailure`
carries one of fourteen `TaskFailureCode`s, a retry disposition (`safe` / `reconcile-first` /
`after-host-action`), an optional `operationId`, and — for `backpressure` and *only* for
`backpressure`, enforced by the converter — an `ICapacityFailure`. `not-found-or-denied` is
deliberately one code so a foreign identity and a hidden one are indistinguishable;
`commit-indeterminate` says the durable effect may or may not exist and names the operation to
resolve it by.

**Commands are four states that do not collapse into each other.** `CommandState` is `rejected`
(with one of six reasons), `accepted` (intent durably recorded — *not* applied), `applied` (with
the revision it reached), or `indeterminate` (with its reason, keeping the operation ID rather
than degrading into a generic retryable failure). `ICommandRequest` always carries an
`operationId` and an `expectedRevision`; no timestamp is a concurrency token.

**The detail converter runs on every path.** `convert`, `decode` *and* `encode` all validate
through the registered `Converter<T>`: TypeScript cannot stop a JS caller or an assertion handing
over a `T` that violates a domain invariant, so an encoder that trusted its argument would turn
that into a successful snapshot. `detailSchema`, where a kind supplies one, is the wire schema a
model is offered; **registration does not check that the two agree** — agreement is a claim about
every value, and it is established by a registration's own fixtures, as the built-ins' are here.

**The registry erases kinds through converter closures, never casts.** `TaskKindRegistry.create`
returns an independent registry — nothing is registered at import. `register<T>(descriptor)`
stores a `Converter<JsonValue>` built with `Converters.generic` that runs the descriptor's own
converter and re-encodes, and returns an `ITaskKindHandle<T>` whose `decode` / `encode` re-check
kind **and** detail version every time. There is no `get<T>(id)` that trusts a caller-selected
type, duplicate `(kind, detailVersion)` registration fails, `convert()` on an unregistered pair
fails with `unknown-kind-version` rather than being treated as a validated current type, and
`freeze()` closes the registry when a broker opens. `createTaskCommandHandle<P>` is the same
erasure for command parameters: it closes over the descriptor's `JsonSchema` and encoder, so the
only way to produce canonical parameters is to have passed that schema.

**Built-ins.** `fgv.tracked@1` has *empty strict* details — every field a tracked task needs is
already an envelope field, and a second place to put them would be a second authority. Its eleven
command **names** are `trackedTaskCommandNames` (narrow transitions plus typed metadata updates;
no external `setStatus`); their parameter schemas belong to the slice that implements the
transitions. `fgv.task-list@1` adds `{ completion: 'manual' | 'all-children-succeeded' }`.
An empty command registry is supported.

**Bounds are constructor-lowerable, never raisable.** `TaskConverters.create({ bounds })` builds
the whole converter set against `ITaskFieldBounds` (title 256, description 4096, summaries 2048,
codes 128, 32 references per field, 64 scopes, 128-byte identifiers). A supplied bound above the
default is a `create()` failure, not a silent clamp. Two converter sets share nothing, so two
hosts in one process cannot see each other's limits. Identifiers use one bounded safe syntax
(`[A-Za-z0-9][A-Za-z0-9._:-]*`) that excludes `/`, `\`, whitespace and control characters — an
ID reaches a record filename and an index key, so it is never a caller-supplied path fragment.

**One instant spelling.** `instant` accepts canonical UTC `YYYY-MM-DDTHH:mm:ss.sssZ` only. It is a
shape check, a platform parse, and an ISO round-trip — the round-trip is what rejects a
well-shaped impossible date like `2026-02-30T00:00:00.000Z` that `Date` would otherwise roll
forward. Zone-free and offset-qualified spellings fail; hosts normalize before this boundary.
**Do not add a date parser or a date dependency for this.**

**Finite capacity (A3).** `ITaskCapacityProfile` is versioned and stored, so a host's changed
defaults cannot silently reinterpret a repository on reopen. It names a limit for each of eleven
`CapacityDimension`s, per-owner sub-limits, and the encoded-size maxima every reservation is
computed from — bytes are canonical UTF-8 lengths, never estimated heap sizes.
`defaultTaskCapacityProfile` publishes the proposed initial limits; **they are engineering
defaults, not measured safe maxima.** `maximumClosureCharges(profile)` and
`maximumSettlementCharges(profile)` compute the protected completion and settlement charges from
the profile alone, which is what lets admission reserve room to *finish* accepted work before
accepting it — a ceiling without that room could refuse the terminal write that would free
capacity. Both are `Result`-valued and **fail rather than return an inexact figure** when a
profile's bounds push a product or sum past the safe-integer range: a charge is an admission
input, so "approximately the maximum" is not a usable answer.

**A capacity status reports every dimension exactly once.** The converter enforces both halves —
a duplicated row is ambiguous, and a missing one would silently read as a dimension under no
pressure, which is the wrong default for something admission consults.

**Capacity claims are repository-generated data, never caller-issued authority.**
`ITaskCapacityClaim` is discriminated on one of five `CapacityClaimPurpose`s, carries the
identities needed to reconstruct its consumption after a crash (an acknowledgement claim joins by
exact subscription *and* update), and tracks `ownership: 'pending' | 'live'` for the
pending-to-live transfer and `disposition: 'reserved' | 'consumed' | 'indeterminate'` for the
reserved-to-used conversion. `indeterminate` is not a state to clear on sight — ambiguity fences
admission and cleanup until recovery resolves it. **Nothing in the library lets a caller mint
one**, and every request converter is strict, so a caller-supplied `capacityClaims` property is a
conversion failure rather than an overspend.

**Recovery is an explicit union, and it never resumes on its own.** `RecoveryDeclaration`
(`reattach` / `host-resume` / `not-recoverable`) is what a host declares on the envelope;
`RecoveryResult` is what a source answers — `reattached` / `completed` (carrying an
`ISourceProjection`), `resumable` (returning work for explicit host approval), `unrecoverable`,
`unavailable`, or `unresolved`. The last two are deliberately different: the source being down is
not the same as the source answering and being unable to say what became of the work.
`ISourceProjection` carries execution fields only — parent, responsibility, scopes, identity and
the binding stay catalog-owned, so an observation can never rewrite them — and orders itself by an
opaque `ISourceRevision`, never by observation time and never by sorting tokens lexically.

**Source-replay must declare a finite envelope.** `SourceHistoryDeclaration` is a union, not a
flag plus an optional field, so a `source-replay` declaration without an
`ISourceReplayEnvelope` — remaining required updates and bytes — is not representable. Finite
storage cannot reserve an unbounded sequence of required external events; reject the stronger
guarantee rather than admitting it. The envelope's counts are non-negative rather than positive —
it is supposed to be able to shrink to zero as accepted work finishes. `observed-state` keeps the
weaker latest-snapshot contract.

**Injected seams.** `TaskEnvironment.create({ logger, clock, newId })` validates the host's
`Logging.ILogger`, `() => number` clock and `() => Result<string>` ID factory. Nothing constructs
a logger or reads a clock at construction time. `now()` canonicalizes the clock into an `Instant`
and fails rather than producing a bad one; `newTaskId()` / `newOperationId()` /
`newSubscriptionId()` mint through the library's converters, so a factory producing a path
fragment is caught at the mint rather than at the filename.

## Not in scope

No storage, repository, broker, context renderer, delivery service, tool factory or prompt
integration **yet** — those are later slices, and their absence from the export surface is
deliberate. **Permanently** out of scope: an input-request/answer protocol, a task runner or
scheduler, an executor, a retry policy, cross-repository parenting, execution migration,
multi-process ownership, general event sourcing, and dependency DAGs.

---

## Recent additions

*Newest first. **Generated** — see the repo index; do not hand-edit inside the markers.*

<!-- BEGIN GENERATED: recent-additions -->
<!-- END GENERATED: recent-additions -->
