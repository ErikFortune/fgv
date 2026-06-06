[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [QualifierTypes](../README.md) / LiteralQualifierType

# Class: LiteralQualifierType

A [qualifier](../../../classes/QualifierType.md) that matches a literal value,
optionally case-sensitive or matching against an ordered list of values at runtime.

## Extends

- [`QualifierType`](../../../classes/QualifierType.md)\<[`JsonCompatibleType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<[`ILiteralQualifierTypeConfig`](../namespaces/Config/interfaces/ILiteralQualifierTypeConfig.md)\>\>

## Constructors

### Constructor

> `protected` **new LiteralQualifierType**(`params`): `LiteralQualifierType`

Constructs a new LiteralQualifierType.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ILiteralQualifierTypeCreateParams`](../interfaces/ILiteralQualifierTypeCreateParams.md) | The [create parameters](../interfaces/ILiteralQualifierTypeCreateParams.md) for this qualifier type. |

#### Returns

`LiteralQualifierType`

#### Overrides

[`QualifierType`](../../../classes/QualifierType.md).[`constructor`](../../../classes/QualifierType.md#constructor)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_collectible"></a> `_collectible` | `readonly` | [`Collectible`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md), [`QualifierTypeIndex`](../../../type-aliases/QualifierTypeIndex.md)\> | - |
| <a id="allowcontextlist"></a> `allowContextList` | `readonly` | `boolean` | Flag indicating whether this qualifier type allows a list of values in a context. |
| <a id="casesensitive"></a> `caseSensitive` | `readonly` | `boolean` | Indicates whether the qualifier match is case-sensitive. |
| <a id="enumeratedvalues"></a> `enumeratedValues?` | `readonly` | readonly [`QualifierConditionValue`](../../../type-aliases/QualifierConditionValue.md)[] | Optional array of enumerated values to further constrain the type. |
| <a id="hierarchy"></a> `hierarchy?` | `readonly` | [`LiteralValueHierarchy`](LiteralValueHierarchy.md)\<`string`\> | Optional [hierarchy](LiteralValueHierarchy.md) of literal values to use for matching. If not provided, no hierarchy will be used. |
| <a id="name"></a> `name` | `readonly` | [`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md) | The name of the qualifier type. |
| <a id="systemtypename"></a> `systemTypeName` | `readonly` | [`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md) | Name of the underlying system type. |

## Accessors

### index

#### Get Signature

> **get** **index**(): [`QualifierTypeIndex`](../../../type-aliases/QualifierTypeIndex.md) \| `undefined`

Global index for this qualifier type. Immutable once set, either at
construction or using [setIndex](../interfaces/IQualifierType.md#setindex).

##### Returns

[`QualifierTypeIndex`](../../../type-aliases/QualifierTypeIndex.md) \| `undefined`

Global index for this qualifier type. Immutable once set, either at
construction or using [setIndex](../interfaces/IQualifierType.md#setindex).

#### Inherited from

[`QualifierType`](../../../classes/QualifierType.md).[`index`](../../../classes/QualifierType.md#index)

***

### key

#### Get Signature

> **get** **key**(): [`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md)

Unique key for this qualifier.

##### Returns

[`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md)

Unique key for this qualifier.

#### Inherited from

[`QualifierType`](../../../classes/QualifierType.md).[`key`](../../../classes/QualifierType.md#key)

## Methods

### \_matchList()

> **\_matchList**(`condition`, `context`, `operator`): [`QualifierMatchScore`](../../../type-aliases/QualifierMatchScore.md)

Matches a single condition value against a list of context values.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `condition` | [`QualifierConditionValue`](../../../type-aliases/QualifierConditionValue.md) | The [condition value](../../../type-aliases/QualifierConditionValue.md) to match. |
| `context` | [`QualifierContextValue`](../../../type-aliases/QualifierContextValue.md)[] | The comma-separated list of [context values](../../../type-aliases/QualifierContextValue.md) to match. |
| `operator` | [`ConditionOperator`](../../../type-aliases/ConditionOperator.md) | The [operator](../../../type-aliases/ConditionOperator.md) to use in the match. |

#### Returns

[`QualifierMatchScore`](../../../type-aliases/QualifierMatchScore.md)

a [score](../../../type-aliases/QualifierMatchScore.md) indicating the extent to which
the condition matches the context value.

#### Inherited from

[`QualifierType`](../../../classes/QualifierType.md).[`_matchList`](../../../classes/QualifierType.md#_matchlist)

***

### \_matchOne()

> `protected` **\_matchOne**(`condition`, `context`, `__operator`): [`QualifierMatchScore`](../../../type-aliases/QualifierMatchScore.md)

Matches a single condition value against a single context value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `condition` | [`QualifierConditionValue`](../../../type-aliases/QualifierConditionValue.md) | The [condition value](../../../type-aliases/QualifierConditionValue.md) to match. |
| `context` | [`QualifierContextValue`](../../../type-aliases/QualifierContextValue.md) | The [context value](../../../type-aliases/QualifierContextValue.md) to match. |
| `__operator` | [`ConditionOperator`](../../../type-aliases/ConditionOperator.md) | The [operator](../../../type-aliases/ConditionOperator.md) to use in the match. |

#### Returns

[`QualifierMatchScore`](../../../type-aliases/QualifierMatchScore.md)

a [score](../../../type-aliases/QualifierMatchScore.md) indicating the extent to which
the condition matches the context value.

#### Overrides

[`QualifierType`](../../../classes/QualifierType.md).[`_matchOne`](../../../classes/QualifierType.md#_matchone)

***

### getConfiguration()

> **getConfiguration**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ISystemLiteralQualifierTypeConfig`](../namespaces/Config/interfaces/ISystemLiteralQualifierTypeConfig.md)\>

Gets a [strongly typed configuration object](../namespaces/Config/interfaces/ISystemLiteralQualifierTypeConfig.md)
for this qualifier type.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ISystemLiteralQualifierTypeConfig`](../namespaces/Config/interfaces/ISystemLiteralQualifierTypeConfig.md)\>

`Success` with the configuration if successful, `Failure` with an error message otherwise.

***

### getConfigurationJson()

> **getConfigurationJson**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<\{ `configuration?`: \{ `allowContextList?`: `boolean`; `caseSensitive?`: `boolean`; `enumeratedValues?`: [`JsonCompatibleArray`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>; `hierarchy?`: \{\[`key`: `string`\]: `string`; \}; \}; `name`: `string`; `systemType`: `"literal"`; \}\>

Gets the configuration for this qualifier type.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<\{ `configuration?`: \{ `allowContextList?`: `boolean`; `caseSensitive?`: `boolean`; `enumeratedValues?`: [`JsonCompatibleArray`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>; `hierarchy?`: \{\[`key`: `string`\]: `string`; \}; \}; `name`: `string`; `systemType`: `"literal"`; \}\>

`Success` with the configuration if successful, `Failure` with an error message otherwise.

#### Overrides

[`QualifierType`](../../../classes/QualifierType.md).[`getConfigurationJson`](../../../classes/QualifierType.md#getconfigurationjson)

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

#### Overrides

[`QualifierType`](../../../classes/QualifierType.md).[`isPotentialMatch`](../../../classes/QualifierType.md#ispotentialmatch)

***

### isValidConditionValue()

> **isValidConditionValue**(`value`): `value is QualifierConditionValue`

Determines whether a value is a valid condition value for a literal qualifier.
The LiteralQualifierType accepts
any identifier as a valid condition value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `string` | The value to validate. |

#### Returns

`value is QualifierConditionValue`

`true` if the value is a valid condition value, `false` otherwise.

#### Overrides

[`QualifierType`](../../../classes/QualifierType.md).[`isValidConditionValue`](../../../classes/QualifierType.md#isvalidconditionvalue)

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

`Success` with the [validated value](../../../type-aliases/QualifierContextValue.md)
if the value is valid for use in a runtime context, `Failure` with error
details otherwise.

#### Inherited from

[`QualifierType`](../../../classes/QualifierType.md).[`isValidContextValue`](../../../classes/QualifierType.md#isvalidcontextvalue)

***

### matches()

> **matches**(`condition`, `context`, `operator`): [`QualifierMatchScore`](../../../type-aliases/QualifierMatchScore.md)

Determines the extent to which a condition matches a context value for this
qualifier type.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `condition` | [`QualifierConditionValue`](../../../type-aliases/QualifierConditionValue.md) | The condition value to evaluate. |
| `context` | [`QualifierContextValue`](../../../type-aliases/QualifierContextValue.md) | The context value to evaluate. |
| `operator` | [`ConditionOperator`](../../../type-aliases/ConditionOperator.md) | The operator to use in evaluating the match. |

#### Returns

[`QualifierMatchScore`](../../../type-aliases/QualifierMatchScore.md)

a [score](../../../type-aliases/QualifierMatchScore.md) indicating the extent to which
the condition matches the context value.

#### Inherited from

[`QualifierType`](../../../classes/QualifierType.md).[`matches`](../../../classes/QualifierType.md#matches)

***

### setIndex()

> **setIndex**(`index`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierTypeIndex`](../../../type-aliases/QualifierTypeIndex.md)\>

Sets the index for this qualifier type. Once set, index is immutable.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `index` | `number` |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierTypeIndex`](../../../type-aliases/QualifierTypeIndex.md)\>

#### Inherited from

[`QualifierType`](../../../classes/QualifierType.md).[`setIndex`](../../../classes/QualifierType.md#setindex)

***

### validateCondition()

> **validateCondition**(`value`, `operator?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierConditionValue`](../../../type-aliases/QualifierConditionValue.md)\>

Validates that a value and optional operator are valid for use in a condition
for qualifiers of this type.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `string` | The string value to validate. |
| `operator?` | [`ConditionOperator`](../../../type-aliases/ConditionOperator.md) | An optional operator to validate. Defaults to 'matches'. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierConditionValue`](../../../type-aliases/QualifierConditionValue.md)\>

#### Inherited from

[`QualifierType`](../../../classes/QualifierType.md).[`validateCondition`](../../../classes/QualifierType.md#validatecondition)

***

### validateConfiguration()

> **validateConfiguration**(`from`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ISystemLiteralQualifierTypeConfig`](../namespaces/Config/interfaces/ISystemLiteralQualifierTypeConfig.md)\>

Validates a [strongly typed configuration object](../namespaces/Config/interfaces/ISystemLiteralQualifierTypeConfig.md)
for this qualifier type.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The unknown data to validate as a configuration object. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ISystemLiteralQualifierTypeConfig`](../namespaces/Config/interfaces/ISystemLiteralQualifierTypeConfig.md)\>

`Success` with the validated configuration if successful, `Failure` with an error message otherwise.

***

### validateConfigurationJson()

> **validateConfigurationJson**(`from`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<\{ `configuration?`: \{ `allowContextList?`: `boolean`; `caseSensitive?`: `boolean`; `enumeratedValues?`: [`JsonCompatibleArray`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>; `hierarchy?`: \{\[`key`: `string`\]: `string`; \}; \}; `name`: `string`; `systemType`: `"literal"`; \}\>

Validates configuration JSON data for this qualifier type.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The unknown data to validate as configuration JSON. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<\{ `configuration?`: \{ `allowContextList?`: `boolean`; `caseSensitive?`: `boolean`; `enumeratedValues?`: [`JsonCompatibleArray`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>; `hierarchy?`: \{\[`key`: `string`\]: `string`; \}; \}; `name`: `string`; `systemType`: `"literal"`; \}\>

`Success` with validated JSON configuration if valid, `Failure` with an error message otherwise.

#### Overrides

[`QualifierType`](../../../classes/QualifierType.md).[`validateConfigurationJson`](../../../classes/QualifierType.md#validateconfigurationjson)

***

### validateContextValue()

> **validateContextValue**(`value`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../type-aliases/QualifierContextValue.md)\>

Validates that a value is valid for use in a runtime context for qualifiers
of this type.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `string` | The string value to validate. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../type-aliases/QualifierContextValue.md)\>

`Success` with the [validated value](../../../type-aliases/QualifierContextValue.md)
if the value is valid for use in a runtime context, `Failure` with error
details otherwise.

#### Inherited from

[`QualifierType`](../../../classes/QualifierType.md).[`validateContextValue`](../../../classes/QualifierType.md#validatecontextvalue)

***

### \_splitContext()

> `static` **\_splitContext**(`value`): [`QualifierContextValue`](../../../type-aliases/QualifierContextValue.md)[]

Splits a comma-separated [context value](../../../type-aliases/QualifierContextValue.md) into an
array of individual values.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | [`QualifierContextValue`](../../../type-aliases/QualifierContextValue.md) | The value to split. |

#### Returns

[`QualifierContextValue`](../../../type-aliases/QualifierContextValue.md)[]

an array of individual context values.

#### Inherited from

[`QualifierType`](../../../classes/QualifierType.md).[`_splitContext`](../../../classes/QualifierType.md#_splitcontext)

***

### compare()

> `static` **compare**(`t1`, `t2`): `number`

Compares two qualifier types by index.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `t1` | [`QualifierType`](../../../classes/QualifierType.md) | The first qualifier type to compare. |
| `t2` | [`QualifierType`](../../../classes/QualifierType.md) | The second qualifier type to compare. |

#### Returns

`number`

a number indicating the relative order of the two qualifier types.

#### Inherited from

[`QualifierType`](../../../classes/QualifierType.md).[`compare`](../../../classes/QualifierType.md#compare)

***

### create()

> `static` **create**(`params?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LiteralQualifierType`\>

Creates a new LiteralQualifierType.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | [`ILiteralQualifierTypeCreateParams`](../interfaces/ILiteralQualifierTypeCreateParams.md) | Optional [parameters](../interfaces/ILiteralQualifierTypeCreateParams.md) to use when creating the new instance. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LiteralQualifierType`\>

`Success` with the new LiteralQualifierType
if successful, `Failure` with an error message otherwise.

***

### createFromConfig()

> `static` **createFromConfig**(`config`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LiteralQualifierType`\>

Creates a new LiteralQualifierType from a configuration object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | [`IQualifierTypeConfig`](../namespaces/Config/interfaces/IQualifierTypeConfig.md)\<[`ILiteralQualifierTypeConfig`](../namespaces/Config/interfaces/ILiteralQualifierTypeConfig.md)\> | The [configuration object](../namespaces/Config/interfaces/IQualifierTypeConfig.md) containing the name, systemType, and optional literal-specific configuration including case sensitivity, enumerated values, and hierarchy information. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`LiteralQualifierType`\>

`Success` with the new LiteralQualifierType
if successful, `Failure` with an error message otherwise.

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

#### Inherited from

[`QualifierType`](../../../classes/QualifierType.md).[`isValidIndex`](../../../classes/QualifierType.md#isvalidindex)

***

### isValidLiteralConditionValue()

> `static` **isValidLiteralConditionValue**(`from`): `from is QualifierConditionValue`

Checks if the given value is a valid literal condition value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `string` | The value to validate. |

#### Returns

`from is QualifierConditionValue`

`true` if the value is a valid literal condition value, otherwise `false`.

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

#### Inherited from

[`QualifierType`](../../../classes/QualifierType.md).[`isValidName`](../../../classes/QualifierType.md#isvalidname)

***

### toLiteralConditionValue()

> `static` **toLiteralConditionValue**(`from`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierConditionValue`](../../../type-aliases/QualifierConditionValue.md)\>

Converts a string to a [literal condition value](../../../type-aliases/QualifierConditionValue.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `string` | The string to convert. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierConditionValue`](../../../type-aliases/QualifierConditionValue.md)\>

`Success` with the converted value if valid, or `Failure` with an error
message if not.
