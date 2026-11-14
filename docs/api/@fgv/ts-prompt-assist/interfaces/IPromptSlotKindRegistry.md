[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptSlotKindRegistry

# Interface: IPromptSlotKindRegistry

Slot-kind serializer sub-registry. Closed-vocabulary slot kinds (non
`'string'`) require a registered serializer.

## Methods

### get()

> **get**(`kind`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ISlotSerializer`](ISlotSerializer.md)\>

Returns the registered serializer for `kind`. Fails if not registered.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `kind` | `string` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ISlotSerializer`](ISlotSerializer.md)\>

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
| `serializer` | [`ISlotSerializer`](ISlotSerializer.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>
