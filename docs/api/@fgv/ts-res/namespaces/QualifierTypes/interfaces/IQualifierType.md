[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [QualifierTypes](../README.md) / IQualifierType

# Interface: IQualifierType\<TCFGJSON\>

Interface for a qualifier type. A qualifier type implements the build and
runtime semantics for some class of related qualifiers (e.g. language,
territories, etc).

## Extends

- [`ICollectible`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md), [`QualifierTypeIndex`](../../../type-aliases/QualifierTypeIndex.md)\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCFGJSON` *extends* [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="index"></a> `index` | `readonly` | [`QualifierTypeIndex`](../../../type-aliases/QualifierTypeIndex.md) \| `undefined` | Global index for this qualifier type. Immutable once set, either at construction or using [setIndex](#setindex). |
| <a id="key"></a> `key` | `readonly` | [`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md) | Unique key for this qualifier. |
| <a id="name"></a> `name` | `readonly` | [`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md) | The name of the qualifier type. |
| <a id="systemtypename"></a> `systemTypeName` | `readonly` | [`QualifierTypeName`](../../../type-aliases/QualifierTypeName.md) | Name of the underlying system type. |

## Methods

### getConfigurationJson()

> **getConfigurationJson**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<\{ `configuration?`: [`JsonCompatibleType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCFGJSON` \| `undefined`\>; `name`: `string`; `systemType`: `string`; \}\>

Gets the configuration for this qualifier type.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<\{ `configuration?`: [`JsonCompatibleType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCFGJSON` \| `undefined`\>; `name`: `string`; `systemType`: `string`; \}\>

`Success` with the configuration if successful, `Failure` with an error message otherwise.

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

***

### isValidConditionValue()

> **isValidConditionValue**(`value`): `value is QualifierConditionValue`

Validates a condition value for this qualifier type.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `string` | The string value to validate. |

#### Returns

`value is QualifierConditionValue`

`Success` with the [validated value](../../../type-aliases/QualifierConditionValue.md)
if the value is valid for use in a condition, `Failure` with error details
otherwise.

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

#### Overrides

`ICollectible.setIndex`

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

***

### validateConfigurationJson()

> **validateConfigurationJson**(`from`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<\{ `configuration?`: [`JsonCompatibleType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCFGJSON` \| `undefined`\>; `name`: `string`; `systemType`: `string`; \}\>

Validates configuration JSON data for this qualifier type.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The unknown data to validate as configuration JSON. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<\{ `configuration?`: [`JsonCompatibleType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCFGJSON` \| `undefined`\>; `name`: `string`; `systemType`: `string`; \}\>

`Success` with validated JSON configuration if valid, `Failure` with an error message otherwise.

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
