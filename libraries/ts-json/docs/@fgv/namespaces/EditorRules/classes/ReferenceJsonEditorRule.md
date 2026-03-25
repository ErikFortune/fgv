[**@fgv/ts-json**](../../../../README.md)

***

[@fgv/ts-json](../../../../README.md) / [EditorRules](../README.md) / ReferenceJsonEditorRule

# Class: ReferenceJsonEditorRule

The Reference JSON editor rule replaces property
keys or values that match some known object with a copy of that referenced object, formatted
according to the current context.

A property key is matched if it matches any known referenced value.
- If the value of the matched key is `'default'`, then the entire object is formatted
  with the current context, flattened and merged into the current object.
- If the value of the matched key is some other string, then the entire
  object is formatted with the current context, and the child of the resulting
  object at the specified path is flattened and merged into the current object.
- If the value of the matched key is an object, then the entire object is
  formatted with the current context extended to include any properties of
  that object, flattened, and merged into the current object.
- It is an error if the referenced value is not an object.

Any property, array or literal value is matched if it matches any known
value reference. The referenced value is replaced by the referenced
value, formatted using the current editor context.

## Extends

- [`JsonEditorRuleBase`](../../../../classes/JsonEditorRuleBase.md)

## Constructors

### Constructor

> **new ReferenceJsonEditorRule**(`options?`): `ReferenceJsonEditorRule`

Creates a new ReferenceJsonEditorRule.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IJsonEditorOptions`](../../../../interfaces/IJsonEditorOptions.md) | Optional [configuration options](../../../../interfaces/IJsonEditorOptions.md) for this rule. |

#### Returns

`ReferenceJsonEditorRule`

#### Overrides

[`JsonEditorRuleBase`](../../../../classes/JsonEditorRuleBase.md).[`constructor`](../../../../classes/JsonEditorRuleBase.md#constructor)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_options"></a> `_options?` | `public` | [`IJsonEditorOptions`](../../../../interfaces/IJsonEditorOptions.md) | Stored fully-resolved [editor options](../../../../interfaces/IJsonEditorOptions.md) for this rule. |

## Methods

### editProperty()

> **editProperty**(`key`, `value`, `state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonPropertyEditFailureReason`](../../../../type-aliases/JsonPropertyEditFailureReason.md)\>

Evaluates a property for reference expansion.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key of the property to be considered. |
| `value` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The `JsonValue` of the property to be considered. |
| `state` | [`JsonEditorState`](../../../../classes/JsonEditorState.md) | The [editor state](../../../../classes/JsonEditorState.md) for the object being edited. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonPropertyEditFailureReason`](../../../../type-aliases/JsonPropertyEditFailureReason.md)\>

If the reference is successful, returns `Success` with a `JsonObject`
to be flattened and merged into the current object. Returns `Failure` with detail `'inapplicable'`
for non-reference keys or with detail `'error'` if an error occurs.

#### Overrides

[`JsonEditorRuleBase`](../../../../classes/JsonEditorRuleBase.md).[`editProperty`](../../../../classes/JsonEditorRuleBase.md#editproperty)

***

### editValue()

> **editValue**(`value`, `state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonEditFailureReason`](../../../../type-aliases/JsonEditFailureReason.md)\>

Evaluates a property, array or literal value for reference replacement.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The `JsonValue` of the property to be considered. |
| `state` | [`JsonEditorState`](../../../../classes/JsonEditorState.md) | The [editor state](../../../../classes/JsonEditorState.md) for the object being edited. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonEditFailureReason`](../../../../type-aliases/JsonEditFailureReason.md)\>

#### Overrides

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

> `static` **create**(`options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ReferenceJsonEditorRule`\>

Creates a new ReferenceJsonEditorRule.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IJsonEditorOptions`](../../../../interfaces/IJsonEditorOptions.md) | Optional [configuration options](../../../../interfaces/IJsonEditorOptions.md) for this rule. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ReferenceJsonEditorRule`\>
