[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IExternalTaskSourceParams

# Interface: IExternalTaskSourceParams\<TDetails\>

What a host supplies to build an [ITaskSource](ITaskSource.md).

## Remarks

Every callback is ordinary host code returning a `Result`; a failure or a throw is reported as an
unavailable source, never as a changed task. `feed` is the reconciliation listing — for a
`source-replay` source, the ordered durable feed. `commands` may be empty: an observation-only
source then refuses every command as `unsupported`, and supplies no command evidence.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tdetails"></a> `TDetails` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-capabilities"></a> `capabilities?` | `readonly` | (`binding`) => `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ISourceCapabilities`](ISourceCapabilities.md)\>\> | What the source declares about stopping a binding — the cascade-stop opt-in (T9). Without it the source stops nothing, and its tasks are `unsupported` stop targets. |
| <a id="property-commands"></a> `commands?` | `readonly` | readonly [`IExternalCommand`](IExternalCommand.md)\<`TDetails`\>[] | - |
| <a id="property-compare"></a> `compare` | `readonly` | (`a`, `b`) => [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`SourceRevisionOrder`](../type-aliases/SourceRevisionOrder.md)\> | - |
| <a id="property-encodedetails"></a> `encodeDetails` | `readonly` | (`details`) => [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\> | Encodes the host's detail type to the JSON the task kind stores — its registered `encode`. |
| <a id="property-feed"></a> `feed` | `readonly` | (`cursor`) => `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IExternalPage`](IExternalPage.md)\<`TDetails`\>\>\> | - |
| <a id="property-history"></a> `history` | `readonly` | [`SourceHistoryContract`](../type-aliases/SourceHistoryContract.md) | What the source guarantees about history: `observed-state` or `source-replay`. |
| <a id="property-id"></a> `id` | `readonly` | `string` | The source id every binding it owns names as `sourceId`. |
| <a id="property-lookupcommand"></a> `lookupCommand?` | `readonly` | (`binding`, `request`) => `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ExternalCommandResult`](../type-aliases/ExternalCommandResult.md)\<`TDetails`\> \| \{ `state`: `"not-found"`; \}\>\> | - |
| <a id="property-read"></a> `read` | `readonly` | (`binding`) => `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ExternalRead`](../type-aliases/ExternalRead.md)\<`TDetails`\>\>\> | - |
| <a id="property-recover"></a> `recover` | `readonly` | (`binding`) => `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ExternalRecovery`](../type-aliases/ExternalRecovery.md)\<`TDetails`\>\>\> | - |
