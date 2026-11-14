[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / SlotKindRegistry

# Class: SlotKindRegistry

In-memory implementation of [IPromptSlotKindRegistry](../interfaces/IPromptSlotKindRegistry.md).

## Implements

- [`IPromptSlotKindRegistry`](../interfaces/IPromptSlotKindRegistry.md)

## Methods

### get()

> **get**(`kind`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ISlotSerializer`](../interfaces/ISlotSerializer.md)\>

Returns the registered serializer for `kind`. Fails if not registered.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `kind` | `string` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ISlotSerializer`](../interfaces/ISlotSerializer.md)\>

#### Implementation of

[`IPromptSlotKindRegistry`](../interfaces/IPromptSlotKindRegistry.md).[`get`](../interfaces/IPromptSlotKindRegistry.md#get)

***

### has()

> **has**(`kind`): `boolean`

True iff a serializer is registered for `kind`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `kind` | `string` |

#### Returns

`boolean`

#### Implementation of

[`IPromptSlotKindRegistry`](../interfaces/IPromptSlotKindRegistry.md).[`has`](../interfaces/IPromptSlotKindRegistry.md#has)

***

### register()

> **register**(`kind`, `serializer`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Registers a serializer for the given slot kind. Fails if `kind` is
empty or if `kind` is already registered. `kind` is a plain string
(not a branded id), so the implementation enforces non-emptiness
here.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `kind` | `string` |
| `serializer` | [`ISlotSerializer`](../interfaces/ISlotSerializer.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

#### Implementation of

[`IPromptSlotKindRegistry`](../interfaces/IPromptSlotKindRegistry.md).[`register`](../interfaces/IPromptSlotKindRegistry.md#register)

***

### create()

> `static` **create**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`SlotKindRegistry`\>

Family-convention factory.

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`SlotKindRegistry`\>
