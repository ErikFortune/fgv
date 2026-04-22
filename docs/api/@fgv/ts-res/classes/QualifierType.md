[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res](../README.md) / QualifierType

# Abstract Class: QualifierType\<TCFGJSON\>

Abstract base class for qualifier types. Provides default implementations for
the [IQualifierType](../namespaces/QualifierTypes/interfaces/IQualifierType.md) interface.

## Extended by

- [`LanguageQualifierType`](../namespaces/QualifierTypes/classes/LanguageQualifierType.md)
- [`LiteralQualifierType`](../namespaces/QualifierTypes/classes/LiteralQualifierType.md)
- [`TerritoryQualifierType`](../namespaces/QualifierTypes/classes/TerritoryQualifierType.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCFGJSON` *extends* [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) |

## Implements

- [`IQualifierType`](../namespaces/QualifierTypes/interfaces/IQualifierType.md)\<`TCFGJSON`\>

## Constructors

### Constructor

> `protected` **new QualifierType**\<`TCFGJSON`\>(`params`): `QualifierType`\<`TCFGJSON`\>

Constructor for use by derived classes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IQualifierTypeCreateParams`](../namespaces/QualifierTypes/interfaces/IQualifierTypeCreateParams.md) | The [create parameters](../namespaces/QualifierTypes/interfaces/IQualifierTypeCreateParams.md) for this qualifier type. |

#### Returns

`QualifierType`\<`TCFGJSON`\>

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_collectible"></a> `_collectible` | `readonly` | [`Collectible`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierTypeName`](../type-aliases/QualifierTypeName.md), [`QualifierTypeIndex`](../type-aliases/QualifierTypeIndex.md)\> | - |
| <a id="allowcontextlist"></a> `allowContextList` | `readonly` | `boolean` | Flag indicating whether this qualifier type allows a list of values in a context. |
| <a id="name"></a> `name` | `readonly` | [`QualifierTypeName`](../type-aliases/QualifierTypeName.md) | The name of the qualifier type. |
| <a id="systemtypename"></a> `systemTypeName` | `abstract` | [`QualifierTypeName`](../type-aliases/QualifierTypeName.md) | Name of the underlying system type. |

## Accessors

### index

#### Get Signature

> **get** **index**(): [`QualifierTypeIndex`](../type-aliases/QualifierTypeIndex.md) \| `undefined`

Global index for this qualifier type. Immutable once set, either at
construction or using [setIndex](../namespaces/QualifierTypes/interfaces/IQualifierType.md#setindex).

##### Returns

[`QualifierTypeIndex`](../type-aliases/QualifierTypeIndex.md) \| `undefined`

Global index for this qualifier type. Immutable once set, either at
construction or using [setIndex](../namespaces/QualifierTypes/interfaces/IQualifierType.md#setindex).

#### Implementation of

[`IQualifierType`](../namespaces/QualifierTypes/interfaces/IQualifierType.md).[`index`](../namespaces/QualifierTypes/interfaces/IQualifierType.md#index)

***

### key

#### Get Signature

> **get** **key**(): [`QualifierTypeName`](../type-aliases/QualifierTypeName.md)

Unique key for this qualifier.

##### Returns

[`QualifierTypeName`](../type-aliases/QualifierTypeName.md)

Unique key for this qualifier.

#### Implementation of

[`IQualifierType`](../namespaces/QualifierTypes/interfaces/IQualifierType.md).[`key`](../namespaces/QualifierTypes/interfaces/IQualifierType.md#key)

## Methods

### \_matchList()

> **\_matchList**(`condition`, `context`, `operator`): [`QualifierMatchScore`](../type-aliases/QualifierMatchScore.md)

Matches a single condition value against a list of context values.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `condition` | [`QualifierConditionValue`](../type-aliases/QualifierConditionValue.md) | The [condition value](../type-aliases/QualifierConditionValue.md) to match. |
| `context` | [`QualifierContextValue`](../type-aliases/QualifierContextValue.md)[] | The comma-separated list of [context values](../type-aliases/QualifierContextValue.md) to match. |
| `operator` | [`ConditionOperator`](../type-aliases/ConditionOperator.md) | The [operator](../type-aliases/ConditionOperator.md) to use in the match. |

#### Returns

[`QualifierMatchScore`](../type-aliases/QualifierMatchScore.md)

a [score](../type-aliases/QualifierMatchScore.md) indicating the extent to which
the condition matches the context value.

***

### \_matchOne()

> `abstract` **\_matchOne**(`condition`, `context`, `operator`): [`QualifierMatchScore`](../type-aliases/QualifierMatchScore.md)

Matches a single condition value against a single context value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `condition` | [`QualifierConditionValue`](../type-aliases/QualifierConditionValue.md) | The [condition value](../type-aliases/QualifierConditionValue.md) to match. |
| `context` | [`QualifierContextValue`](../type-aliases/QualifierContextValue.md) | The [context value](../type-aliases/QualifierContextValue.md) to match. |
| `operator` | [`ConditionOperator`](../type-aliases/ConditionOperator.md) | The [operator](../type-aliases/ConditionOperator.md) to use in the match. |

#### Returns

[`QualifierMatchScore`](../type-aliases/QualifierMatchScore.md)

a [score](../type-aliases/QualifierMatchScore.md) indicating the extent to which
the condition matches the context value.

***

### getConfigurationJson()

> `abstract` **getConfigurationJson**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<\{ `configuration?`: [`JsonCompatibleType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCFGJSON` \| `undefined`\>; `name`: `string`; `systemType`: `string`; \}\>

Gets the configuration for this qualifier type.

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<\{ `configuration?`: [`JsonCompatibleType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCFGJSON` \| `undefined`\>; `name`: `string`; `systemType`: `string`; \}\>

`Success` with the configuration if successful, `Failure` with an error message otherwise.

#### Implementation of

[`IQualifierType`](../namespaces/QualifierTypes/interfaces/IQualifierType.md).[`getConfigurationJson`](../namespaces/QualifierTypes/interfaces/IQualifierType.md#getconfigurationjson)

***

### isPotentialMatch()

> **isPotentialMatch**(`conditionValue`, `contextValue`): `boolean`

Determines if a supplied condition value is a potential match for a possible context value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `conditionValue` | `string` | The condition value. |
| `contextValue` | `string` | The context value. |

#### Returns

`boolean`

`true` if the condition value is a potential match for the context value, `false` otherwise.

#### Implementation of

[`IQualifierType`](../namespaces/QualifierTypes/interfaces/IQualifierType.md).[`isPotentialMatch`](../namespaces/QualifierTypes/interfaces/IQualifierType.md#ispotentialmatch)

***

### isValidConditionValue()

> `abstract` **isValidConditionValue**(`value`): `value is QualifierConditionValue`

Validates a condition value for this qualifier type.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `string` | The string value to validate. |

#### Returns

`value is QualifierConditionValue`

`Success` with the [validated value](../type-aliases/QualifierConditionValue.md)
if the value is valid for use in a condition, `Failure` with error details
otherwise.

#### Implementation of

[`IQualifierType`](../namespaces/QualifierTypes/interfaces/IQualifierType.md).[`isValidConditionValue`](../namespaces/QualifierTypes/interfaces/IQualifierType.md#isvalidconditionvalue)

***

### isValidContextValue()

> **isValidContextValue**(`value`): `value is QualifierContextValue`

Validates a context value for this qualifier type.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `string` | The string value to validate. |

#### Returns

`value is QualifierContextValue`

`Success` with the [validated value](../type-aliases/QualifierContextValue.md)
if the value is valid for use in a runtime context, `Failure` with error
details otherwise.

#### Implementation of

[`IQualifierType`](../namespaces/QualifierTypes/interfaces/IQualifierType.md).[`isValidContextValue`](../namespaces/QualifierTypes/interfaces/IQualifierType.md#isvalidcontextvalue)

***

### matches()

> **matches**(`condition`, `context`, `operator`): [`QualifierMatchScore`](../type-aliases/QualifierMatchScore.md)

Determines the extent to which a condition matches a context value for this
qualifier type.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `condition` | [`QualifierConditionValue`](../type-aliases/QualifierConditionValue.md) | The condition value to evaluate. |
| `context` | [`QualifierContextValue`](../type-aliases/QualifierContextValue.md) | The context value to evaluate. |
| `operator` | [`ConditionOperator`](../type-aliases/ConditionOperator.md) | The operator to use in evaluating the match. |

#### Returns

[`QualifierMatchScore`](../type-aliases/QualifierMatchScore.md)

a [score](../type-aliases/QualifierMatchScore.md) indicating the extent to which
the condition matches the context value.

#### Implementation of

[`IQualifierType`](../namespaces/QualifierTypes/interfaces/IQualifierType.md).[`matches`](../namespaces/QualifierTypes/interfaces/IQualifierType.md#matches)

***

### setIndex()

> **setIndex**(`index`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierTypeIndex`](../type-aliases/QualifierTypeIndex.md)\>

Sets the index for this qualifier type. Once set, index is immutable.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `index` | `number` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierTypeIndex`](../type-aliases/QualifierTypeIndex.md)\>

#### Implementation of

[`IQualifierType`](../namespaces/QualifierTypes/interfaces/IQualifierType.md).[`setIndex`](../namespaces/QualifierTypes/interfaces/IQualifierType.md#setindex)

***

### validateCondition()

> **validateCondition**(`value`, `operator?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierConditionValue`](../type-aliases/QualifierConditionValue.md)\>

Validates that a value and optional operator are valid for use in a condition
for qualifiers of this type.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `string` | The string value to validate. |
| `operator?` | [`ConditionOperator`](../type-aliases/ConditionOperator.md) | An optional operator to validate. Defaults to 'matches'. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierConditionValue`](../type-aliases/QualifierConditionValue.md)\>

#### Implementation of

[`IQualifierType`](../namespaces/QualifierTypes/interfaces/IQualifierType.md).[`validateCondition`](../namespaces/QualifierTypes/interfaces/IQualifierType.md#validatecondition)

***

### validateConfigurationJson()

> `abstract` **validateConfigurationJson**(`from`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<\{ `configuration?`: [`JsonCompatibleType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCFGJSON` \| `undefined`\>; `name`: `string`; `systemType`: `string`; \}\>

Validates configuration JSON data for this qualifier type.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The unknown data to validate as configuration JSON. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<\{ `configuration?`: [`JsonCompatibleType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCFGJSON` \| `undefined`\>; `name`: `string`; `systemType`: `string`; \}\>

`Success` with validated JSON configuration if valid, `Failure` with an error message otherwise.

#### Implementation of

[`IQualifierType`](../namespaces/QualifierTypes/interfaces/IQualifierType.md).[`validateConfigurationJson`](../namespaces/QualifierTypes/interfaces/IQualifierType.md#validateconfigurationjson)

***

### validateContextValue()

> **validateContextValue**(`value`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../type-aliases/QualifierContextValue.md)\>

Validates that a value is valid for use in a runtime context for qualifiers
of this type.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `string` | The string value to validate. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../type-aliases/QualifierContextValue.md)\>

`Success` with the [validated value](../type-aliases/QualifierContextValue.md)
if the value is valid for use in a runtime context, `Failure` with error
details otherwise.

#### Implementation of

[`IQualifierType`](../namespaces/QualifierTypes/interfaces/IQualifierType.md).[`validateContextValue`](../namespaces/QualifierTypes/interfaces/IQualifierType.md#validatecontextvalue)

***

### \_splitContext()

> `static` **\_splitContext**(`value`): [`QualifierContextValue`](../type-aliases/QualifierContextValue.md)[]

Splits a comma-separated [context value](../type-aliases/QualifierContextValue.md) into an
array of individual values.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | [`QualifierContextValue`](../type-aliases/QualifierContextValue.md) | The value to split. |

#### Returns

[`QualifierContextValue`](../type-aliases/QualifierContextValue.md)[]

an array of individual context values.

***

### compare()

> `static` **compare**(`t1`, `t2`): `number`

Compares two qualifier types by index.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `t1` | `QualifierType` | The first qualifier type to compare. |
| `t2` | `QualifierType` | The second qualifier type to compare. |

#### Returns

`number`

a number indicating the relative order of the two qualifier types.

***

### isValidIndex()

> `static` **isValidIndex**(`index`): `index is QualifierTypeIndex`

Determines whether a number is a valid qualifier type index.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `index` | `number` | the number to validate |

#### Returns

`index is QualifierTypeIndex`

true if the number is a valid qualifier type index, false otherwise.

***

### isValidName()

> `static` **isValidName**(`name`): `name is QualifierTypeName`

Determines whether a string is a valid qualifier type name.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | the string to validate |

#### Returns

`name is QualifierTypeName`

true if the string is a valid qualifier type name, false otherwise.
