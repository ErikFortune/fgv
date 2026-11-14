[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskKindRegistry

# Interface: ITaskKindRegistry

Registry of task kinds and their commands.

## Remarks

Duplicate `(kind, detailVersion)` registrations fail. Registrations are frozen when a
broker is opened, so a kind cannot appear or change underneath committed data.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-isfrozen"></a> `isFrozen` | `readonly` | `boolean` |

## Methods

### convert()

> **convert**(`snapshot`): [`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskSnapshot`](ITaskSnapshot.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\>\>

Validates an unknown snapshot into its common envelope plus validated JSON details.
Fails with `unknown-kind-version` when the `(kind, detailVersion)` pair is not
registered — an unknown version is never treated as a validated current type.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `snapshot` | `unknown` |

#### Returns

[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskSnapshot`](ITaskSnapshot.md)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\>\>

***

### freeze()

> **freeze**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`number`\>

Freezes the registry, and reports how many registrations it holds.

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`number`\>

***

### getCommand()

> **getCommand**(`kind`, `detailVersion`, `name`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskCommandHandle`](ITaskCommandHandle.md)\>

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

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskCommandHandle`](ITaskCommandHandle.md)\>

***

### has()

> **has**(`kind`, `detailVersion`): `boolean`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `kind` | [`TaskKind`](../type-aliases/TaskKind.md) |
| `detailVersion` | `number` |

#### Returns

`boolean`

***

### register()

> **register**\<`T`\>(`descriptor`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskKindHandle`](ITaskKindHandle.md)\<`T`\>\>

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `descriptor` | [`ITaskKindDescriptor`](ITaskKindDescriptor.md)\<`T`\> |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskKindHandle`](ITaskKindHandle.md)\<`T`\>\>
