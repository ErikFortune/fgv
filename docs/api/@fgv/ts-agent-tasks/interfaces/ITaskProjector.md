[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskProjector

# Interface: ITaskProjector

Turns authorized data into what a view may show.

## Remarks

Runs only on data the principal is already authorized to read. Its output is validated, not
trusted: a projection that fails, throws, carries a property the projected shape lacks, or
describes a different task or revision **fails the call**. Nothing falls back to the
unprojected value.
`details`, when present, is the only way a view exposes kind details; without it a view
exposes none.

## Methods

### details()?

> `optional` **details**(`snapshot`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `snapshot` | [`ITaskSnapshot`](ITaskSnapshot.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\>

***

### envelope()

> **envelope**(`envelope`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IProjectedTaskEnvelope`](../type-aliases/IProjectedTaskEnvelope.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `envelope` | [`ITaskEnvelope`](ITaskEnvelope.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IProjectedTaskEnvelope`](../type-aliases/IProjectedTaskEnvelope.md)\>
