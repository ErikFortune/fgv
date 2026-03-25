[**@fgv/ts-json**](../README.md)

***

[@fgv/ts-json](../README.md) / IJsonEditorRule

# Interface: IJsonEditorRule

An IJsonEditorRule represents a single configurable
rule to be applied by a [JsonEditor](../classes/JsonEditor.md).

## Methods

### editProperty()

> **editProperty**(`key`, `value`, `state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonPropertyEditFailureReason`](../type-aliases/JsonPropertyEditFailureReason.md)\>

Called by a [JsonEditor](../classes/JsonEditor.md) to possibly edit one of the properties being
merged into a target object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key of the property to be edited. |
| `value` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The `JsonValue` of the property to be edited. |
| `state` | [`JsonEditorState`](../classes/JsonEditorState.md) | [Editor state](../classes/JsonEditorState.md) which applies to the edit. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonPropertyEditFailureReason`](../type-aliases/JsonPropertyEditFailureReason.md)\>

If the property was edited, returns `Success` with a `JsonObject` containing
the edited results and with detail `'edited'`. If this property should be deferred for later consideration
or merge, `Success` with detail `'deferred'` and a `JsonObject` to be finalized.  If
the rule does not affect this property, returns `Failure` with detail `'inapplicable'`. If an error occurred
while processing the error, returns `Failure` with detail `'error'`.

***

### editValue()

> **editValue**(`value`, `state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

Called by a [JsonEditor](../classes/JsonEditor.md) to possibly edit a property value or array element.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The `JsonValue` of the property to be edited. |
| `state` | [`JsonEditorState`](../classes/JsonEditorState.md) | [Editor state](../classes/JsonEditorState.md) which applies to the edit. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

Returns `Success` with the `JsonValue` to be inserted, with detail `'edited'` if
the value was edited.  Returns `Failure` with `'inapplicable'` if the rule does not affect this value.
Fails with detail `'ignore'` if the value is to be ignored, or with `'error'` if an error occurs.

***

### finalizeProperties()

> **finalizeProperties**(`deferred`, `state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[], [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

Called for each rule after all properties have been merged.  Any properties that were deferred
during the initial edit pass are supplied as input.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `deferred` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[] | Any JSON objects that were deferred during the first edit pass. |
| `state` | [`JsonEditorState`](../classes/JsonEditorState.md) | [Editor state](../classes/JsonEditorState.md) which applies to the edit. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[], [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

On `Success` return, any returned objects are merged in order and finalization
is stopped. Finalization is also stopped on `Failure` with detail `'ignore'`. On `Failure`
with detail `'inapplicable'`, finalization continues with the next rule. Fails with an
error detail `'error'` and an informative message if an error occurs.
