[**@fgv/ts-json**](../../../../README.md)

***

[@fgv/ts-json](../../../../README.md) / [EditorRules](../README.md) / ConditionalJsonEditorRule

# Class: ConditionalJsonEditorRule

The ConditionalJsonEditorRule evaluates
properties with conditional keys, omitting non-matching keys and merging keys that match,
or default keys only if no other keys match.

The default syntax for a conditional key is:
   "?value1=value2" - matches if value1 and value2 are the same, is ignored otherwise.
   "?value" - matches if value is a non-empty, non-whitespace string. Is ignored otherwise.
   "?default" - matches only if no other conditional blocks in the same object were matched.

## Extends

- [`JsonEditorRuleBase`](../../../../classes/JsonEditorRuleBase.md)

## Constructors

### Constructor

> **new ConditionalJsonEditorRule**(`options?`): `ConditionalJsonEditorRule`

Creates a new ConditionalJsonEditorRule.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IConditionalJsonRuleOptions`](../interfaces/IConditionalJsonRuleOptions.md) | Optional [configuration options](../interfaces/IConditionalJsonRuleOptions.md) used for this rule. |

#### Returns

`ConditionalJsonEditorRule`

#### Overrides

[`JsonEditorRuleBase`](../../../../classes/JsonEditorRuleBase.md).[`constructor`](../../../../classes/JsonEditorRuleBase.md#constructor)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_options"></a> `_options?` | `public` | [`IConditionalJsonRuleOptions`](../interfaces/IConditionalJsonRuleOptions.md) | Stored fully-resolved [options](../interfaces/IConditionalJsonRuleOptions.md) for this rule. |

## Methods

### \_tryParseCondition()

> **\_tryParseCondition**(`key`, `state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IConditionalJsonKeyResult`](../interfaces/IConditionalJsonKeyResult.md), [`JsonPropertyEditFailureReason`](../../../../type-aliases/JsonPropertyEditFailureReason.md)\>

Determines if a given property key is conditional. Derived classes can override this
method to use a different format for conditional properties.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | - |
| `state` | [`JsonEditorState`](../../../../classes/JsonEditorState.md) | The [editor state](../../../../classes/JsonEditorState.md) for the object being edited. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IConditionalJsonKeyResult`](../interfaces/IConditionalJsonKeyResult.md), [`JsonPropertyEditFailureReason`](../../../../type-aliases/JsonPropertyEditFailureReason.md)\>

`Success` with detail `'deferred'` and a
[IConditionalJsonKeyResult](../interfaces/IConditionalJsonKeyResult.md) describing the
match for a default or matching conditional property.  Returns `Failure` with detail `'ignore'`
for a non-matching conditional property. Fails with detail `'error'` if an error occurs
or with detail `'inapplicable'` if the key does not represent a conditional property.

***

### editProperty()

> **editProperty**(`key`, `value`, `state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonPropertyEditFailureReason`](../../../../type-aliases/JsonPropertyEditFailureReason.md)\>

Evaluates a property for conditional application.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key of the property to be considered |
| `value` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The `JsonValue` of the property to be considered. |
| `state` | [`JsonEditorState`](../../../../classes/JsonEditorState.md) | The [editor state](../../../../classes/JsonEditorState.md) for the object being edited. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonPropertyEditFailureReason`](../../../../type-aliases/JsonPropertyEditFailureReason.md)\>

Returns `Success` with detail `'deferred'` and a
[IConditionalJsonDeferredObject](../interfaces/IConditionalJsonDeferredObject.md).
for a matching, default or unconditional key. Returns `Failure` with detail `'ignore'` for
a non-matching conditional, or with detail `'error'` if an error occurs. Otherwise
fails with detail `'inapplicable'`.

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

> **finalizeProperties**(`finalized`, `__state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[], [`JsonEditFailureReason`](../../../../type-aliases/JsonEditFailureReason.md)\>

Finalizes any deferred conditional properties. If the only deferred property is
default, that property is emitted. Otherwise all matching properties are emitted.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `finalized` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[] | The deferred properties to be considered for merge. |
| `__state` | [`JsonEditorState`](../../../../classes/JsonEditorState.md) | The [editor state](../../../../classes/JsonEditorState.md) for the object being edited. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[], [`JsonEditFailureReason`](../../../../type-aliases/JsonEditFailureReason.md)\>

#### Overrides

[`JsonEditorRuleBase`](../../../../classes/JsonEditorRuleBase.md).[`finalizeProperties`](../../../../classes/JsonEditorRuleBase.md#finalizeproperties)

***

### create()

> `static` **create**(`options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ConditionalJsonEditorRule`\>

Creates a new ConditionalJsonEditorRule.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IConditionalJsonRuleOptions`](../interfaces/IConditionalJsonRuleOptions.md) | Optional [configuration options](../interfaces/IConditionalJsonRuleOptions.md) used for this rule. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ConditionalJsonEditorRule`\>
