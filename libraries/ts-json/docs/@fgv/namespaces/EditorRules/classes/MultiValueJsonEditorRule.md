[**@fgv/ts-json**](../../../../README.md)

***

[@fgv/ts-json](../../../../README.md) / [EditorRules](../README.md) / MultiValueJsonEditorRule

# Class: MultiValueJsonEditorRule

The Multi-Value JSON editor rule
expands matching keys multiple times, projecting the value into the template
context for any child objects rendered by the rule.

The default syntax for a multi-value key is:
 "[[var]]=value1,value2,value3"
Where "var" is the name of the variable that will be passed to
child template resolution, and "value1,value2,value3" is a
comma-separated list of values to be expanded.

## Extends

- [`JsonEditorRuleBase`](../../../../classes/JsonEditorRuleBase.md)

## Constructors

### Constructor

> **new MultiValueJsonEditorRule**(`options?`): `MultiValueJsonEditorRule`

Creates a new MultiValueJsonEditorRule.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IJsonEditorOptions`](../../../../interfaces/IJsonEditorOptions.md) | Optional [configuration options](../../../../interfaces/IJsonEditorOptions.md). |

#### Returns

`MultiValueJsonEditorRule`

#### Overrides

[`JsonEditorRuleBase`](../../../../classes/JsonEditorRuleBase.md).[`constructor`](../../../../classes/JsonEditorRuleBase.md#constructor)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_options"></a> `_options?` | `public` | [`IJsonEditorOptions`](../../../../interfaces/IJsonEditorOptions.md) | Stored fully-resolved [editor options](../../../../interfaces/IJsonEditorOptions.md) for this rule. |

## Methods

### \_deriveContext()

> **\_deriveContext**(`state`, ...`values`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IJsonContext`](../../../../interfaces/IJsonContext.md) \| `undefined`\>

Extends the [current context](../../../../interfaces/IJsonContext.md) with a supplied state and values.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `state` | [`JsonEditorState`](../../../../classes/JsonEditorState.md) | The [editor state](../../../../classes/JsonEditorState.md) for the object being edited. |
| ...`values` | [`VariableValue`](../../../../type-aliases/VariableValue.md)[] | An array of [VariableValue](../../../../type-aliases/VariableValue.md) to be added to the context. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IJsonContext`](../../../../interfaces/IJsonContext.md) \| `undefined`\>

The extended [context](../../../../interfaces/IJsonContext.md).

***

### \_tryParse()

> **\_tryParse**(`token`, `state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMultiValuePropertyParts`](../interfaces/IMultiValuePropertyParts.md), [`JsonEditFailureReason`](../../../../type-aliases/JsonEditFailureReason.md)\>

Determines if a given property key is multi-value. Derived classes can override this
method to use a different format for multi-value properties.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | - |
| `state` | [`JsonEditorState`](../../../../classes/JsonEditorState.md) | The [editor state](../../../../classes/JsonEditorState.md) for the object being edited. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMultiValuePropertyParts`](../interfaces/IMultiValuePropertyParts.md), [`JsonEditFailureReason`](../../../../type-aliases/JsonEditFailureReason.md)\>

`Success` with detail `'deferred'` and an
[IMultiValuePropertyParts](../interfaces/IMultiValuePropertyParts.md)
describing the match for matching multi-value property.  Returns `Failure` with detail `'error'` if an error occurs
or with detail `'inapplicable'` if the key does not represent a multi-value property.

***

### editProperty()

> **editProperty**(`key`, `value`, `state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonPropertyEditFailureReason`](../../../../type-aliases/JsonPropertyEditFailureReason.md)\>

Evaluates a property for multi-value expansion.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key of the property to be considered |
| `value` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The `JsonValue` of the property to be considered. |
| `state` | [`JsonEditorState`](../../../../classes/JsonEditorState.md) | The [editor state](../../../../classes/JsonEditorState.md) for the object being edited. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonPropertyEditFailureReason`](../../../../type-aliases/JsonPropertyEditFailureReason.md)\>

`Success` with an object containing the fully-resolved child values to be merged for
matching multi-value property. Returns `Failure` with detail `'error'` if an error occurs or
with detail `'inapplicable'` if the property key is not a conditional property.

#### Overrides

[`JsonEditorRuleBase`](../../../../classes/JsonEditorRuleBase.md).[`editProperty`](../../../../classes/JsonEditorRuleBase.md#editproperty)

***

### editValue()

> **editValue**(`__value`, `__state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonEditFailureReason`](../../../../type-aliases/JsonEditFailureReason.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `__value` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) |
| `__state` | [`JsonEditorState`](../../../../classes/JsonEditorState.md) |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonEditFailureReason`](../../../../type-aliases/JsonEditFailureReason.md)\>

#### Inherited from

[`JsonEditorRuleBase`](../../../../classes/JsonEditorRuleBase.md).[`editValue`](../../../../classes/JsonEditorRuleBase.md#editvalue)

***

### finalizeProperties()

> **finalizeProperties**(`__deferred`, `__state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[], [`JsonEditFailureReason`](../../../../type-aliases/JsonEditFailureReason.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `__deferred` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[] |
| `__state` | [`JsonEditorState`](../../../../classes/JsonEditorState.md) |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[], [`JsonEditFailureReason`](../../../../type-aliases/JsonEditFailureReason.md)\>

#### Inherited from

[`JsonEditorRuleBase`](../../../../classes/JsonEditorRuleBase.md).[`finalizeProperties`](../../../../classes/JsonEditorRuleBase.md#finalizeproperties)

***

### create()

> `static` **create**(`options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`MultiValueJsonEditorRule`\>

Creates a new MultiValueJsonEditorRule.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IJsonEditorOptions`](../../../../interfaces/IJsonEditorOptions.md) | Optional [configuration options](../../../../interfaces/IJsonEditorOptions.md). |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`MultiValueJsonEditorRule`\>
