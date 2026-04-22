[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json](../../../README.md) / [EditorRules](../README.md) / MultiValueJsonEditorRule

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

- [`JsonEditorRuleBase`](../../../classes/JsonEditorRuleBase.md)

## Constructors

### Constructor

> **new MultiValueJsonEditorRule**(`options?`): `MultiValueJsonEditorRule`

Creates a new MultiValueJsonEditorRule.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IJsonEditorOptions`](../../../interfaces/IJsonEditorOptions.md) | Optional [configuration options](../../../interfaces/IJsonEditorOptions.md). |

#### Returns

`MultiValueJsonEditorRule`

#### Overrides

[`JsonEditorRuleBase`](../../../classes/JsonEditorRuleBase.md).[`constructor`](../../../classes/JsonEditorRuleBase.md#constructor)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_options"></a> `_options?` | `public` | [`IJsonEditorOptions`](../../../interfaces/IJsonEditorOptions.md) | Stored fully-resolved [editor options](../../../interfaces/IJsonEditorOptions.md) for this rule. |

## Methods

### \_deriveContext()

> **\_deriveContext**(`state`, ...`values`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IJsonContext`](../../../interfaces/IJsonContext.md) \| `undefined`\>

Extends the [current context](../../../interfaces/IJsonContext.md) with a supplied state and values.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `state` | [`JsonEditorState`](../../../classes/JsonEditorState.md) | The [editor state](../../../classes/JsonEditorState.md) for the object being edited. |
| ...`values` | [`VariableValue`](../../../type-aliases/VariableValue.md)[] | An array of [VariableValue](../../../type-aliases/VariableValue.md) to be added to the context. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IJsonContext`](../../../interfaces/IJsonContext.md) \| `undefined`\>

The extended [context](../../../interfaces/IJsonContext.md).

***

### \_tryParse()

> **\_tryParse**(`token`, `state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMultiValuePropertyParts`](../interfaces/IMultiValuePropertyParts.md), [`JsonEditFailureReason`](../../../type-aliases/JsonEditFailureReason.md)\>

Determines if a given property key is multi-value. Derived classes can override this
method to use a different format for multi-value properties.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | The property key token to be considered. |
| `state` | [`JsonEditorState`](../../../classes/JsonEditorState.md) | The [editor state](../../../classes/JsonEditorState.md) for the object being edited. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMultiValuePropertyParts`](../interfaces/IMultiValuePropertyParts.md), [`JsonEditFailureReason`](../../../type-aliases/JsonEditFailureReason.md)\>

`Success` with detail `'deferred'` and an
[IMultiValuePropertyParts](../interfaces/IMultiValuePropertyParts.md)
describing the match for matching multi-value property.  Returns `Failure` with detail `'error'` if an error occurs
or with detail `'inapplicable'` if the key does not represent a multi-value property.

***

### editProperty()

> **editProperty**(`key`, `value`, `state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonPropertyEditFailureReason`](../../../type-aliases/JsonPropertyEditFailureReason.md)\>

Evaluates a property for multi-value expansion.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key of the property to be considered |
| `value` | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | The `JsonValue` of the property to be considered. |
| `state` | [`JsonEditorState`](../../../classes/JsonEditorState.md) | The [editor state](../../../classes/JsonEditorState.md) for the object being edited. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonPropertyEditFailureReason`](../../../type-aliases/JsonPropertyEditFailureReason.md)\>

`Success` with an object containing the fully-resolved child values to be merged for
matching multi-value property. Returns `Failure` with detail `'error'` if an error occurs or
with detail `'inapplicable'` if the property key is not a conditional property.

#### Overrides

[`JsonEditorRuleBase`](../../../classes/JsonEditorRuleBase.md).[`editProperty`](../../../classes/JsonEditorRuleBase.md#editproperty)

***

### editValue()

> **editValue**(`__value`, `__state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md), [`JsonEditFailureReason`](../../../type-aliases/JsonEditFailureReason.md)\>

Called by a [JsonEditor](../../../classes/JsonEditor.md) to possibly edit a property value or array element.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `__value` | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | The `JsonValue` of the property to be edited. |
| `__state` | [`JsonEditorState`](../../../classes/JsonEditorState.md) | [Editor state](../../../classes/JsonEditorState.md) which applies to the edit. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md), [`JsonEditFailureReason`](../../../type-aliases/JsonEditFailureReason.md)\>

Returns `Success` with the `JsonValue` to be inserted, with detail `'edited'` if
the value was edited.  Returns `Failure` with `'inapplicable'` if the rule does not affect this value.
Fails with detail `'ignore'` if the value is to be ignored, or with `'error'` if an error occurs.

#### Inherited from

[`JsonEditorRuleBase`](../../../classes/JsonEditorRuleBase.md).[`editValue`](../../../classes/JsonEditorRuleBase.md#editvalue)

***

### finalizeProperties()

> **finalizeProperties**(`__deferred`, `__state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[], [`JsonEditFailureReason`](../../../type-aliases/JsonEditFailureReason.md)\>

Called for each rule after all properties have been merged.  Any properties that were deferred
during the initial edit pass are supplied as input.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `__deferred` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[] | Any JSON objects that were deferred during the first edit pass. |
| `__state` | [`JsonEditorState`](../../../classes/JsonEditorState.md) | [Editor state](../../../classes/JsonEditorState.md) which applies to the edit. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[], [`JsonEditFailureReason`](../../../type-aliases/JsonEditFailureReason.md)\>

On `Success` return, any returned objects are merged in order and finalization
is stopped. Finalization is also stopped on `Failure` with detail `'ignore'`. On `Failure`
with detail `'inapplicable'`, finalization continues with the next rule. Fails with an
error detail `'error'` and an informative message if an error occurs.

#### Inherited from

[`JsonEditorRuleBase`](../../../classes/JsonEditorRuleBase.md).[`finalizeProperties`](../../../classes/JsonEditorRuleBase.md#finalizeproperties)

***

### create()

> `static` **create**(`options?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`MultiValueJsonEditorRule`\>

Creates a new MultiValueJsonEditorRule.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IJsonEditorOptions`](../../../interfaces/IJsonEditorOptions.md) | Optional [configuration options](../../../interfaces/IJsonEditorOptions.md). |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`MultiValueJsonEditorRule`\>
