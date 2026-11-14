[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskSource

# Interface: ITaskSource

An external source of task execution truth.

## Remarks

The source owns execution state. The broker commits what a source reports — lifecycle, progress,
attention and details, ordered by the source's own comparator — and never sets external status
optimistically. Parent, responsibility, scopes, identity and the binding stay catalog-owned.

Every method is host code the broker calls **outside** its repository writer; a throw is treated
as an unavailable source. Repository open never calls a source.

`history`:
- `observed-state` — latest snapshots only. `observe` results commit directly, serialized per
  binding; transient events the source discarded are not recoverable.
- `source-replay` — an ordered durable feed through `reconcile`. **Only the feed commits
  projections**: `observe` results, push hints and command observations are hints that start a
  feed pass, and can never move a task past a revision the feed has not yet delivered.

Use [ExternalTaskSource](../classes/ExternalTaskSource.md) to build one from typed callbacks.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-history"></a> `history` | `readonly` | [`SourceHistoryContract`](../type-aliases/SourceHistoryContract.md) | What the source guarantees about history: `observed-state` or `source-replay`. |
| <a id="property-id"></a> `id` | `readonly` | `string` | The source id every binding it owns names as `sourceId`. |

## Methods

### capabilities()?

> `optional` **capabilities**(`binding`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ISourceCapabilities`](ISourceCapabilities.md)\>\>

Optional: what the source declares about stopping one binding — a cascade stop's opt-in
(design § 10 step 6). A source without it stops nothing: its tasks are `unsupported` stop
targets, which block satisfaction. Asked on every stop pass, never cached across a restart.
(T9: design § 5 lists it; T6 left it for the stop slice.)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `binding` | [`ISourceBinding`](ISourceBinding.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ISourceCapabilities`](ISourceCapabilities.md)\>\>

***

### compare()

> **compare**(`a`, `b`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`SourceRevisionOrder`](../type-aliases/SourceRevisionOrder.md)\>

Orders two revisions. Fails for a revision the source cannot interpret.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `a` | [`ISourceRevision`](ISourceRevision.md) |
| `b` | [`ISourceRevision`](ISourceRevision.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`SourceRevisionOrder`](../type-aliases/SourceRevisionOrder.md)\>

***

### dispatch()

> **dispatch**(`binding`, `request`, `expectedSourceRevision?`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`SourceCommandResult`](../type-aliases/SourceCommandResult.md)\>\>

Sends one command. `request.operationId` is the command key a deduplicating source uses.
`expectedSourceRevision` is present for a conditional command.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `binding` | [`ISourceBinding`](ISourceBinding.md) |
| `request` | [`ICommandRequest`](ICommandRequest.md) |
| `expectedSourceRevision?` | [`ISourceRevision`](ISourceRevision.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`SourceCommandResult`](../type-aliases/SourceCommandResult.md)\>\>

***

### lookupCommand()?

> `optional` **lookupCommand**(`binding`, `request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`SourceCommandLookup`](../type-aliases/SourceCommandLookup.md)\>\>

Optional: resolves an uncertain command by its key. Never a model tool.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `binding` | [`ISourceBinding`](ISourceBinding.md) |
| `request` | [`ICommandRequest`](ICommandRequest.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`SourceCommandLookup`](../type-aliases/SourceCommandLookup.md)\>\>

***

### observe()

> **observe**(`binding`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`SourceRead`](../type-aliases/SourceRead.md)\>\>

Reads one binding's latest state.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `binding` | [`ISourceBinding`](ISourceBinding.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`SourceRead`](../type-aliases/SourceRead.md)\>\>

***

### reconcile()

> **reconcile**(`cursor?`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ISourceReconcilePage`](ISourceReconcilePage.md)\>\>

One page of the reconciliation listing or ordered feed, from `cursor`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `cursor?` | `string` |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ISourceReconcilePage`](ISourceReconcilePage.md)\>\>

***

### recover()

> **recover**(`binding`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`RecoveryResult`](../type-aliases/RecoveryResult.md)\>\>

Asks what became of a task after a restart.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `binding` | [`ISourceBinding`](ISourceBinding.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`RecoveryResult`](../type-aliases/RecoveryResult.md)\>\>
