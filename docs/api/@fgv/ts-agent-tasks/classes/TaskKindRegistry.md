[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskKindRegistry

# Class: TaskKindRegistry

The default [ITaskKindRegistry](../interfaces/ITaskKindRegistry.md).

## Remarks

Heterogeneous registrations are stored as `Converter<JsonValue>` closures built with
`Converters.generic`, exactly as the agent-memory body registry stores its per-kind
converters. A `Converter<T>` is not structurally a `Converter<JsonValue>` — `map`
makes it invariant — so the generic wrapper is the type-safe bridge, and there is no
`any` and no cast anywhere on the path.

## Implements

- [`ITaskKindRegistry`](../interfaces/ITaskKindRegistry.md)

## Accessors

### isFrozen

#### Get Signature

> **get** **isFrozen**(): `boolean`

ITaskKindRegistry.isFrozen

##### Returns

`boolean`

#### Implementation of

[`ITaskKindRegistry`](../interfaces/ITaskKindRegistry.md).[`isFrozen`](../interfaces/ITaskKindRegistry.md#property-isfrozen)

## Methods

### convert()

> **convert**(`snapshot`): [`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskSnapshot`](../interfaces/ITaskSnapshot.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\>\>

Validates an unknown snapshot into its common envelope plus validated JSON details.
Fails with `unknown-kind-version` when the `(kind, detailVersion)` pair is not
registered — an unknown version is never treated as a validated current type.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `snapshot` | `unknown` |

#### Returns

[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskSnapshot`](../interfaces/ITaskSnapshot.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\>\>

#### Implementation of

[`ITaskKindRegistry`](../interfaces/ITaskKindRegistry.md).[`convert`](../interfaces/ITaskKindRegistry.md#convert)

***

### freeze()

> **freeze**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`number`\>

Freezes the registry, and reports how many registrations it holds.

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`number`\>

#### Implementation of

[`ITaskKindRegistry`](../interfaces/ITaskKindRegistry.md).[`freeze`](../interfaces/ITaskKindRegistry.md#freeze)

***

### getCommand()

> **getCommand**(`kind`, `detailVersion`, `name`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskCommandHandle`](../interfaces/ITaskCommandHandle.md)\>

The command handle a registered kind declares under `name`. Fails for an unregistered kind or
an undeclared command. (T6: the broker validates an external command's parameters through the
kind that registered them, the one authority for its schema.)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `kind` | [`TaskKind`](../type-aliases/TaskKind.md) |
| `detailVersion` | `number` |
| `name` | `string` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskCommandHandle`](../interfaces/ITaskCommandHandle.md)\>

#### Implementation of

[`ITaskKindRegistry`](../interfaces/ITaskKindRegistry.md).[`getCommand`](../interfaces/ITaskKindRegistry.md#getcommand)

***

### has()

> **has**(`kind`, `detailVersion`): `boolean`

ITaskKindRegistry.has

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `kind` | [`TaskKind`](../type-aliases/TaskKind.md) |
| `detailVersion` | `number` |

#### Returns

`boolean`

#### Implementation of

[`ITaskKindRegistry`](../interfaces/ITaskKindRegistry.md).[`has`](../interfaces/ITaskKindRegistry.md#has)

***

### register()

> **register**\<`T`\>(`descriptor`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskKindHandle`](../interfaces/ITaskKindHandle.md)\<`T`\>\>

ITaskKindRegistry.register

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `descriptor` | [`ITaskKindDescriptor`](../interfaces/ITaskKindDescriptor.md)\<`T`\> |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskKindHandle`](../interfaces/ITaskKindHandle.md)\<`T`\>\>

#### Implementation of

[`ITaskKindRegistry`](../interfaces/ITaskKindRegistry.md).[`register`](../interfaces/ITaskKindRegistry.md#register)

***

### create()

> `static` **create**(`snapshot`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TaskKindRegistry`\>

Creates an empty registry. Each call returns an independent registry — this module
holds no shared mutable state and registers nothing at import.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `snapshot` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskSnapshot`](../interfaces/ITaskSnapshot.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\>\> |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TaskKindRegistry`\>
