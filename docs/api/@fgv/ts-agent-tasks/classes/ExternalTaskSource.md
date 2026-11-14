[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ExternalTaskSource

# Class: ExternalTaskSource\<TDetails\>

The external-task helper: wraps a host's typed callbacks as an [ITaskSource](../interfaces/ITaskSource.md).

## Remarks

There is no universal `external` detail kind. A host registers its own kind — detail converter,
encoder and the command handles this helper exposes — and wraps its source with the same encoder,
so a projection's details are what that kind stores. Commands are typed closures around an
`ITaskCommandDescriptor`: parameters are converted through the descriptor before the host's
callback sees them.

The helper holds no state of its own. The source owns execution truth; the broker reconciles it.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tdetails"></a> `TDetails` |

## Implements

- [`ITaskSource`](../interfaces/ITaskSource.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-capabilities"></a> `capabilities?` | `public readonly` | (`binding`) => `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ISourceCapabilities`](../interfaces/ISourceCapabilities.md)\>\> | Optional: what the source declares about stopping one binding — a cascade stop's opt-in (design § 10 step 6). A source without it stops nothing: its tasks are `unsupported` stop targets, which block satisfaction. Asked on every stop pass, never cached across a restart. (T9: design § 5 lists it; T6 left it for the stop slice.) |
| <a id="property-history"></a> `history` | `public readonly` | [`SourceHistoryContract`](../type-aliases/SourceHistoryContract.md) | What the source guarantees about history: `observed-state` or `source-replay`. |
| <a id="property-id"></a> `id` | `public readonly` | `string` | The source id every binding it owns names as `sourceId`. |
| <a id="property-lookupcommand"></a> `lookupCommand?` | `public readonly` | (`binding`, `request`) => `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`SourceCommandLookup`](../type-aliases/SourceCommandLookup.md)\>\> | Optional: resolves an uncertain command by its key. Never a model tool. |

## Accessors

### commandHandles

#### Get Signature

> **get** **commandHandles**(): readonly [`ITaskCommandHandle`](../interfaces/ITaskCommandHandle.md)[]

The erased handles to register on the task kind. Empty for an observation-only source.

##### Returns

readonly [`ITaskCommandHandle`](../interfaces/ITaskCommandHandle.md)[]

## Methods

### compare()

> **compare**(`a`, `b`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`SourceRevisionOrder`](../type-aliases/SourceRevisionOrder.md)\>

Orders two revisions. Fails for a revision the source cannot interpret.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `a` | [`ISourceRevision`](../interfaces/ISourceRevision.md) |
| `b` | [`ISourceRevision`](../interfaces/ISourceRevision.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`SourceRevisionOrder`](../type-aliases/SourceRevisionOrder.md)\>

#### Implementation of

[`ITaskSource`](../interfaces/ITaskSource.md).[`compare`](../interfaces/ITaskSource.md#compare)

***

### dispatch()

> **dispatch**(`binding`, `request`, `expectedSourceRevision?`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`SourceCommandResult`](../type-aliases/SourceCommandResult.md)\>\>

Sends one command. `request.operationId` is the command key a deduplicating source uses.
`expectedSourceRevision` is present for a conditional command.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `binding` | [`ISourceBinding`](../interfaces/ISourceBinding.md) |
| `request` | [`ICommandRequest`](../interfaces/ICommandRequest.md) |
| `expectedSourceRevision?` | [`ISourceRevision`](../interfaces/ISourceRevision.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`SourceCommandResult`](../type-aliases/SourceCommandResult.md)\>\>

#### Implementation of

[`ITaskSource`](../interfaces/ITaskSource.md).[`dispatch`](../interfaces/ITaskSource.md#dispatch)

***

### observe()

> **observe**(`binding`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`SourceRead`](../type-aliases/SourceRead.md)\>\>

Reads one binding's latest state.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `binding` | [`ISourceBinding`](../interfaces/ISourceBinding.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`SourceRead`](../type-aliases/SourceRead.md)\>\>

#### Implementation of

[`ITaskSource`](../interfaces/ITaskSource.md).[`observe`](../interfaces/ITaskSource.md#observe)

***

### reconcile()

> **reconcile**(`cursor?`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ISourceReconcilePage`](../interfaces/ISourceReconcilePage.md)\>\>

One page of the reconciliation listing or ordered feed, from `cursor`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `cursor?` | `string` |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ISourceReconcilePage`](../interfaces/ISourceReconcilePage.md)\>\>

#### Implementation of

[`ITaskSource`](../interfaces/ITaskSource.md).[`reconcile`](../interfaces/ITaskSource.md#reconcile)

***

### recover()

> **recover**(`binding`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`RecoveryResult`](../type-aliases/RecoveryResult.md)\>\>

Asks what became of a task after a restart.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `binding` | [`ISourceBinding`](../interfaces/ISourceBinding.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`RecoveryResult`](../type-aliases/RecoveryResult.md)\>\>

#### Implementation of

[`ITaskSource`](../interfaces/ITaskSource.md).[`recover`](../interfaces/ITaskSource.md#recover)

***

### command()

> `static` **command**\<`TDetails`, `P`\>(`descriptor`, `apply`): [`IExternalCommand`](../interfaces/IExternalCommand.md)\<`TDetails`\>

A typed command: `apply` receives the request's canonical parameters decoded by the
descriptor's schema — which the registered handle guarantees they satisfy — and its handle is
the one to register on the kind.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tdetails-1"></a> `TDetails` |
| <a id="type-parameter-p"></a> `P` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `descriptor` | [`ITaskCommandDescriptor`](../interfaces/ITaskCommandDescriptor.md)\<`P`\> |
| `apply` | (`binding`, `parameters`, `request`, `expectedSourceRevision?`) => `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ExternalCommandResult`](../type-aliases/ExternalCommandResult.md)\<`TDetails`\>\>\> |

#### Returns

[`IExternalCommand`](../interfaces/IExternalCommand.md)\<`TDetails`\>

***

### create()

> `static` **create**\<`TDetails`\>(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`ExternalTaskSource`\<`TDetails`\>\>

Builds a source. Fails when two commands share a name.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tdetails-2"></a> `TDetails` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`IExternalTaskSourceParams`](../interfaces/IExternalTaskSourceParams.md)\<`TDetails`\> |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`ExternalTaskSource`\<`TDetails`\>\>
