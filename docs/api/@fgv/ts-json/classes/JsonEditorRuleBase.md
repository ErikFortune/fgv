[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-json](../README.md) / JsonEditorRuleBase

# Class: JsonEditorRuleBase

Default base implementation of [IJsonEditorRule](../interfaces/IJsonEditorRule.md) returns inapplicable for all operations so that
derived classes need only implement the operations they actually support.

## Extended by

- [`ConditionalJsonEditorRule`](../namespaces/EditorRules/classes/ConditionalJsonEditorRule.md)
- [`MultiValueJsonEditorRule`](../namespaces/EditorRules/classes/MultiValueJsonEditorRule.md)
- [`ReferenceJsonEditorRule`](../namespaces/EditorRules/classes/ReferenceJsonEditorRule.md)
- [`TemplatedJsonEditorRule`](../namespaces/EditorRules/classes/TemplatedJsonEditorRule.md)

## Implements

- [`IJsonEditorRule`](../interfaces/IJsonEditorRule.md)

## Constructors

### Constructor

> **new JsonEditorRuleBase**(): `JsonEditorRuleBase`

#### Returns

`JsonEditorRuleBase`

## Methods

### editProperty()

> **editProperty**(`__key`, `__value`, `__state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonPropertyEditFailureReason`](../type-aliases/JsonPropertyEditFailureReason.md)\>

Called by a [JsonEditor](JsonEditor.md) to possibly edit one of the properties being
merged into a target object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `__key` | `string` | The key of the property to be edited. |
| `__value` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) | The `JsonValue` of the property to be edited. |
| `__state` | [`JsonEditorState`](JsonEditorState.md) | [Editor state](JsonEditorState.md) which applies to the edit. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonPropertyEditFailureReason`](../type-aliases/JsonPropertyEditFailureReason.md)\>

If the property was edited, returns `Success` with a `JsonObject` containing
the edited results and with detail `'edited'`. If this property should be deferred for later consideration
or merge, `Success` with detail `'deferred'` and a `JsonObject` to be finalized.  If
the rule does not affect this property, returns `Failure` with detail `'inapplicable'`. If an error occurred
while processing the error, returns `Failure` with detail `'error'`.

#### Implementation of

[`IJsonEditorRule`](../interfaces/IJsonEditorRule.md).[`editProperty`](../interfaces/IJsonEditorRule.md#editproperty)

***

### editValue()

> **editValue**(`__value`, `__state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

Called by a [JsonEditor](JsonEditor.md) to possibly edit a property value or array element.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `__value` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) | The `JsonValue` of the property to be edited. |
| `__state` | [`JsonEditorState`](JsonEditorState.md) | [Editor state](JsonEditorState.md) which applies to the edit. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

Returns `Success` with the `JsonValue` to be inserted, with detail `'edited'` if
the value was edited.  Returns `Failure` with `'inapplicable'` if the rule does not affect this value.
Fails with detail `'ignore'` if the value is to be ignored, or with `'error'` if an error occurs.

#### Implementation of

[`IJsonEditorRule`](../interfaces/IJsonEditorRule.md).[`editValue`](../interfaces/IJsonEditorRule.md#editvalue)

***

### finalizeProperties()

> **finalizeProperties**(`__deferred`, `__state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[], [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

Called for each rule after all properties have been merged.  Any properties that were deferred
during the initial edit pass are supplied as input.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `__deferred` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[] | Any JSON objects that were deferred during the first edit pass. |
| `__state` | [`JsonEditorState`](JsonEditorState.md) | [Editor state](JsonEditorState.md) which applies to the edit. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[], [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

On `Success` return, any returned objects are merged in order and finalization
is stopped. Finalization is also stopped on `Failure` with detail `'ignore'`. On `Failure`
with detail `'inapplicable'`, finalization continues with the next rule. Fails with an
error detail `'error'` and an informative message if an error occurs.

#### Implementation of

[`IJsonEditorRule`](../interfaces/IJsonEditorRule.md).[`finalizeProperties`](../interfaces/IJsonEditorRule.md#finalizeproperties)
