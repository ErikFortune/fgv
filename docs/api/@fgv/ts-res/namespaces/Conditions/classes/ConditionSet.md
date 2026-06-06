[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Conditions](../README.md) / ConditionSet

# Class: ConditionSet

Represents a set of [conditions](../../../classes/Condition.md) that must all be met in some runtime
context for a resource instance to be valid.

## Implements

- [`IValidatedConditionSetDecl`](../interfaces/IValidatedConditionSetDecl.md)

## Constructors

### Constructor

> `protected` **new ConditionSet**(`params`): `ConditionSet`

Constructor for a ConditionSet object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IValidatedConditionSetDecl`](../interfaces/IValidatedConditionSetDecl.md) | [Validated declaration](../interfaces/IValidatedConditionSetDecl.md) used to create the condition set. |

#### Returns

`ConditionSet`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_collectible"></a> `_collectible` | `readonly` | [`Collectible`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ConditionSetKey`](../../../type-aliases/ConditionSetKey.md), [`ConditionSetIndex`](../../../type-aliases/ConditionSetIndex.md)\> | - |
| <a id="conditions"></a> `conditions` | `readonly` | readonly [`Condition`](../../../classes/Condition.md)[] | The [conditions](../../../classes/Condition.md) that make up this condition set. |
| <a id="unconditionalkey"></a> `UnconditionalKey` | `static` | [`ConditionSetKey`](../../../type-aliases/ConditionSetKey.md) | The key for an unconditional condition set. |

## Accessors

### index

#### Get Signature

> **get** **index**(): [`ConditionSetIndex`](../../../type-aliases/ConditionSetIndex.md) \| `undefined`

The index for this condition set.

##### Returns

[`ConditionSetIndex`](../../../type-aliases/ConditionSetIndex.md) \| `undefined`

#### Implementation of

[`IValidatedConditionSetDecl`](../interfaces/IValidatedConditionSetDecl.md).[`index`](../interfaces/IValidatedConditionSetDecl.md#index)

***

### key

#### Get Signature

> **get** **key**(): [`ConditionSetKey`](../../../type-aliases/ConditionSetKey.md)

The key for this condition set.

##### Returns

[`ConditionSetKey`](../../../type-aliases/ConditionSetKey.md)

***

### size

#### Get Signature

> **get** **size**(): `number`

The number of conditions in this condition set.

##### Returns

`number`

## Methods

### canMatchPartialContext()

> **canMatchPartialContext**(`context`, `options?`): `boolean`

Determines if this condition set can match a supplied context, even if the context is partial.
Returns true if all conditions in the set can match the context (using canMatchPartialContext).
Returns false otherwise.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | [`IValidatedContextDecl`](../../Context/type-aliases/IValidatedContextDecl.md) | The context to match. |
| `options?` | [`IContextMatchOptions`](../../Context/interfaces/IContextMatchOptions.md) | Options to use when matching. |

#### Returns

`boolean`

`true` if all conditions can match the context, `false` otherwise.

***

### setIndex()

> **setIndex**(`index`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionSetIndex`](../../../type-aliases/ConditionSetIndex.md)\>

Sets the global index for this condition set.  Once set, the index cannot be changed.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `index` | `number` | The index to set for this condition set. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionSetIndex`](../../../type-aliases/ConditionSetIndex.md)\>

`Success` with the index if successful, `Failure` otherwise.

***

### toCompiled()

> **toCompiled**(`options?`): [`ICompiledConditionSet`](../../ResourceJson/namespaces/Compiled/interfaces/ICompiledConditionSet.md)

Converts this condition set to a compiled condition set representation.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`ICompiledResourceOptions`](../../ResourceJson/namespaces/Compiled/interfaces/ICompiledResourceOptions.md) | Optional compilation options controlling the output format. |

#### Returns

[`ICompiledConditionSet`](../../ResourceJson/namespaces/Compiled/interfaces/ICompiledConditionSet.md)

A compiled condition set object that can be used for serialization or runtime processing.

***

### toConditionSetArrayDecl()

> **toConditionSetArrayDecl**(`options?`): [`ConditionSetDeclAsArray`](../../ResourceJson/namespaces/Json/type-aliases/ConditionSetDeclAsArray.md)

Gets the [condition set declaration as an array](../../ResourceJson/namespaces/Json/type-aliases/ConditionSetDeclAsArray.md) for this condition set.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IConditionSetDeclOptions`](../interfaces/IConditionSetDeclOptions.md) | [options](../../ResourceJson/namespaces/Helpers/interfaces/IDeclarationOptions.md) for the condition set declaration. |

#### Returns

[`ConditionSetDeclAsArray`](../../ResourceJson/namespaces/Json/type-aliases/ConditionSetDeclAsArray.md)

The [condition set declaration as an array](../../ResourceJson/namespaces/Json/type-aliases/ConditionSetDeclAsArray.md) for this condition set.

***

### toConditionSetRecordDecl()

> **toConditionSetRecordDecl**(`options?`): [`ConditionSetDeclAsRecord`](../../ResourceJson/namespaces/Json/type-aliases/ConditionSetDeclAsRecord.md)

Gets the [condition set declaration as a record](../../ResourceJson/namespaces/Json/type-aliases/ConditionSetDeclAsRecord.md) for this condition set.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IConditionSetDeclOptions`](../interfaces/IConditionSetDeclOptions.md) | [options](../../ResourceJson/namespaces/Helpers/interfaces/IDeclarationOptions.md) for the condition set declaration. |

#### Returns

[`ConditionSetDeclAsRecord`](../../ResourceJson/namespaces/Json/type-aliases/ConditionSetDeclAsRecord.md)

The [condition set declaration as a record](../../ResourceJson/namespaces/Json/type-aliases/ConditionSetDeclAsRecord.md) for this condition set.

***

### toHash()

> **toHash**(): `string`

Gets a hash of this condition set.

#### Returns

`string`

A hash of this condition
set key.

***

### toKey()

> **toKey**(): [`ConditionSetKey`](../../../type-aliases/ConditionSetKey.md)

Gets the [key](../../../type-aliases/ConditionSetKey.md) for this condition set.

#### Returns

[`ConditionSetKey`](../../../type-aliases/ConditionSetKey.md)

The key for this condition set.

***

### toString()

> **toString**(): `string`

Gets a human-readable string representation of this condition set.

#### Returns

`string`

A string representation of this condition set.

***

### toToken()

> **toToken**(`terse?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Gets a [condition set token](../../../type-aliases/ConditionSetToken.md) for this condition set,
if possible.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `terse?` | `boolean` | If true, the token will be terse, omitting qualifier names where possible. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

`Success` with the [condition set token](../../../type-aliases/ConditionSetToken.md) if successful,
`Failure` with an error message otherwise.

***

### compare()

> `static` **compare**(`cs1`, `cs2`): `number`

Compares two ConditionSets for sorting purposes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cs1` | `ConditionSet` | The first ConditionSet to compare. |
| `cs2` | `ConditionSet` | The second ConditionSet to compare. |

#### Returns

`number`

A negative number if `cs1` should come before `cs2`, a positive
number if `cs1` should come after `cs2`, or zero if they are equivalent.

***

### create()

> `static` **create**(`params`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ConditionSet`\>

Creates a new ConditionSet object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IValidatedConditionSetDecl`](../interfaces/IValidatedConditionSetDecl.md) | [Validated declaration](../interfaces/IValidatedConditionSetDecl.md) used to create the condition set. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ConditionSet`\>

`Success` with the new ConditionSet object if successful,
or `Failure` with an error message if not.

***

### getKeyForDecl()

> `static` **getKeyForDecl**(`decl`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionSetKey`](../../../type-aliases/ConditionSetKey.md)\>

Gets the [key](../../../type-aliases/ConditionSetKey.md) for a supplied [condition set declaration](../interfaces/IValidatedConditionSetDecl.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `decl` | [`IValidatedConditionSetDecl`](../interfaces/IValidatedConditionSetDecl.md) | The [condition set declaration](../interfaces/IValidatedConditionSetDecl.md) for which to get the key. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionSetKey`](../../../type-aliases/ConditionSetKey.md)\>

`Success` with the condition set key if successful, `Failure` otherwise.

***

### getKeyFromLooseDecl()

> `static` **getKeyFromLooseDecl**(`conditionSet`, `conditionCollector`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionSetKey`](../../../type-aliases/ConditionSetKey.md)\>

Gets a condition set key from a loose condition set declaration.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `conditionSet` | [`ConditionSetDecl`](../../ResourceJson/namespaces/Json/type-aliases/ConditionSetDecl.md) \| `undefined` | The loose condition set declaration to convert. |
| `conditionCollector` | [`ConditionCollector`](ConditionCollector.md) | The condition collector used for validation. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionSetKey`](../../../type-aliases/ConditionSetKey.md)\>

`Success` with the condition set key if successful, `Failure` otherwise.
