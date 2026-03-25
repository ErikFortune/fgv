[**@fgv/ts-json**](../README.md)

***

[@fgv/ts-json](../README.md) / JsonEditorRuleBase

# Class: JsonEditorRuleBase

Default base implementation of [IJsonEditorRule](../interfaces/IJsonEditorRule.md) returns inapplicable for all operations so that
derived classes need only implement the operations they actually support.

## Extended by

- [`ConditionalJsonEditorRule`](../@fgv/namespaces/EditorRules/classes/ConditionalJsonEditorRule.md)
- [`MultiValueJsonEditorRule`](../@fgv/namespaces/EditorRules/classes/MultiValueJsonEditorRule.md)
- [`ReferenceJsonEditorRule`](../@fgv/namespaces/EditorRules/classes/ReferenceJsonEditorRule.md)
- [`TemplatedJsonEditorRule`](../@fgv/namespaces/EditorRules/classes/TemplatedJsonEditorRule.md)

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

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `__key` | `string` |
| `__value` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) |
| `__state` | [`JsonEditorState`](JsonEditorState.md) |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonPropertyEditFailureReason`](../type-aliases/JsonPropertyEditFailureReason.md)\>

#### Implementation of

[`IJsonEditorRule`](../interfaces/IJsonEditorRule.md).[`editProperty`](../interfaces/IJsonEditorRule.md#editproperty)

***

### editValue()

> **editValue**(`__value`, `__state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `__value` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) |
| `__state` | [`JsonEditorState`](JsonEditorState.md) |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

#### Implementation of

[`IJsonEditorRule`](../interfaces/IJsonEditorRule.md).[`editValue`](../interfaces/IJsonEditorRule.md#editvalue)

***

### finalizeProperties()

> **finalizeProperties**(`__deferred`, `__state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[], [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `__deferred` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[] |
| `__state` | [`JsonEditorState`](JsonEditorState.md) |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[], [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

#### Implementation of

[`IJsonEditorRule`](../interfaces/IJsonEditorRule.md).[`finalizeProperties`](../interfaces/IJsonEditorRule.md#finalizeproperties)
