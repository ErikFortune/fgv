[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskEnvironment

# Interface: ITaskEnvironment

A validated [ITaskEnvironmentParams](ITaskEnvironmentParams.md) that mints branded values through the
library's own converters.

## Extends

- [`ITaskEnvironmentParams`](ITaskEnvironmentParams.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-clock"></a> `clock` | `readonly` | () => `number` |
| <a id="property-logger"></a> `logger` | `readonly` | [`ILogger`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) |
| <a id="property-newid"></a> `newId` | `readonly` | () => [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\> |

## Methods

### newOperationId()

> **newOperationId**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`OperationId`](../type-aliases/OperationId.md)\>

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`OperationId`](../type-aliases/OperationId.md)\>

***

### newSubscriptionId()

> **newSubscriptionId**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`SubscriptionId`](../type-aliases/SubscriptionId.md)\>

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`SubscriptionId`](../type-aliases/SubscriptionId.md)\>

***

### newTaskId()

> **newTaskId**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`TaskId`](../type-aliases/TaskId.md)\>

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`TaskId`](../type-aliases/TaskId.md)\>

***

### now()

> **now**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`Instant`](../type-aliases/Instant.md)\>

The current instant, canonicalized and validated.

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`Instant`](../type-aliases/Instant.md)\>
