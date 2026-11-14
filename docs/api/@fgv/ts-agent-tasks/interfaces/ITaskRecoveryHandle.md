[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskRecoveryHandle

# Interface: ITaskRecoveryHandle

A read-only diagnostic handle for a repository that could not open healthily.

## Remarks

It holds the root exclusively (so nothing else writes while a host inspects) and never
writes: no record is repaired, rewritten or deleted. An administrator restores or
dispositions damaged data outside the broker path, then reopens.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-report"></a> `report` | `readonly` | [`ITaskRecoveryReport`](ITaskRecoveryReport.md) |

## Methods

### close()

> **close**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

***

### readRaw()

> **readRaw**(`name`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Reads one record's raw text, for inspection.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>
