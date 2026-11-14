[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskEnvironment

# Class: TaskEnvironment

The host-injected clock, ID factory and logger, validated once and then used to mint
branded values through this library's own converters.

## Remarks

Nothing here constructs a logger, reads a clock at construction time, or opens
anything. A host that hands over an ID factory producing values outside the library's
bounded identifier syntax learns so at the first mint, as a `Result` failure, rather
than when a record filename is written.

## Implements

- [`ITaskEnvironment`](../interfaces/ITaskEnvironment.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-clock"></a> `clock` | `public readonly` | () => `number` | ITaskEnvironmentParams.clock |
| <a id="property-logger"></a> `logger` | `public readonly` | [`ILogger`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | ITaskEnvironmentParams.logger |
| <a id="property-newid"></a> `newId` | `public readonly` | () => [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\> | ITaskEnvironmentParams.newId |

## Methods

### newOperationId()

> **newOperationId**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`OperationId`](../type-aliases/OperationId.md)\>

ITaskEnvironment.newOperationId

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`OperationId`](../type-aliases/OperationId.md)\>

#### Implementation of

[`ITaskEnvironment`](../interfaces/ITaskEnvironment.md).[`newOperationId`](../interfaces/ITaskEnvironment.md#newoperationid)

***

### newSubscriptionId()

> **newSubscriptionId**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`SubscriptionId`](../type-aliases/SubscriptionId.md)\>

ITaskEnvironment.newSubscriptionId

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`SubscriptionId`](../type-aliases/SubscriptionId.md)\>

#### Implementation of

[`ITaskEnvironment`](../interfaces/ITaskEnvironment.md).[`newSubscriptionId`](../interfaces/ITaskEnvironment.md#newsubscriptionid)

***

### newTaskId()

> **newTaskId**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`TaskId`](../type-aliases/TaskId.md)\>

ITaskEnvironment.newTaskId

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`TaskId`](../type-aliases/TaskId.md)\>

#### Implementation of

[`ITaskEnvironment`](../interfaces/ITaskEnvironment.md).[`newTaskId`](../interfaces/ITaskEnvironment.md#newtaskid)

***

### now()

> **now**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`Instant`](../type-aliases/Instant.md)\>

The current instant, canonicalized and validated.

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`Instant`](../type-aliases/Instant.md)\>

#### Implementation of

[`ITaskEnvironment`](../interfaces/ITaskEnvironment.md).[`now`](../interfaces/ITaskEnvironment.md#now)

***

### create()

> `static` **create**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TaskEnvironment`\>

Validates the injected capabilities and returns an environment.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`ITaskEnvironmentCreateParams`](../interfaces/ITaskEnvironmentCreateParams.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TaskEnvironment`\>
