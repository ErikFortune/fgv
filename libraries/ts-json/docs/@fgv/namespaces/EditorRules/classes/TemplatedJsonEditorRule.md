[**@fgv/ts-json**](../../../../README.md)

***

[@fgv/ts-json](../../../../README.md) / [EditorRules](../README.md) / TemplatedJsonEditorRule

# Class: TemplatedJsonEditorRule

The Templated JSON editor rule applies mustache rendering as
appropriate to any keys or values in the object being edited.

## Extends

- [`JsonEditorRuleBase`](../../../../classes/JsonEditorRuleBase.md)

## Constructors

### Constructor

> **new TemplatedJsonEditorRule**(`options?`): `TemplatedJsonEditorRule`

Creates a new TemplatedJsonEditorRule.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`ITemplatedJsonRuleOptions`](../interfaces/ITemplatedJsonRuleOptions.md) | Optional [configuration options](../interfaces/ITemplatedJsonRuleOptions.md) for this rule. |

#### Returns

`TemplatedJsonEditorRule`

#### Overrides

[`JsonEditorRuleBase`](../../../../classes/JsonEditorRuleBase.md).[`constructor`](../../../../classes/JsonEditorRuleBase.md#constructor)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_options"></a> `_options?` | `public` | [`ITemplatedJsonRuleOptions`](../interfaces/ITemplatedJsonRuleOptions.md) | Fully-resolved [configuration options](../interfaces/ITemplatedJsonRuleOptions.md) for this rule. |

## Methods

### editProperty()

> **editProperty**(`key`, `value`, `state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonPropertyEditFailureReason`](../../../../type-aliases/JsonPropertyEditFailureReason.md)\>

Evaluates a property name for template rendering.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key of the property to be considered. |
| `value` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The `JsonValue` of the property to be considered. |
| `state` | [`JsonEditorState`](../../../../classes/JsonEditorState.md) | The [editor state](../../../../classes/JsonEditorState.md) for the object being edited. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonPropertyEditFailureReason`](../../../../type-aliases/JsonPropertyEditFailureReason.md)\>

`Success` with detail `'edited'` and an `JsonObject` to
be flattened and merged if the key contained a template. Returns `Failure` with detail `'error'`
if an error occurred or with detail `'inapplicable'` if the property key does not contain
a template or if name rendering is disabled.

#### Overrides

[`JsonEditorRuleBase`](../../../../classes/JsonEditorRuleBase.md).[`editProperty`](../../../../classes/JsonEditorRuleBase.md#editproperty)

***

### editValue()

> **editValue**(`value`, `state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonEditFailureReason`](../../../../type-aliases/JsonEditFailureReason.md)\>

Evaluates a property, array or literal value for template rendering.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The `JsonValue` to be edited. |
| `state` | [`JsonEditorState`](../../../../classes/JsonEditorState.md) | The [editor state](../../../../classes/JsonEditorState.md) for the object being edited. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonEditFailureReason`](../../../../type-aliases/JsonEditFailureReason.md)\>

`Success` with detail `'edited'` if the value contained a template and was edited.
Returns `Failure` with `'ignore'` if the rendered value should be ignored, with `'error'` if
an error occurs, or with `'inapplicable'` if the value was not a string with a template.

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

> `static` **create**(`options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TemplatedJsonEditorRule`\>

Creates a new TemplatedJsonEditorRule.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`ITemplatedJsonRuleOptions`](../interfaces/ITemplatedJsonRuleOptions.md) | Optional [configuration options](../interfaces/ITemplatedJsonRuleOptions.md) for this rule. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TemplatedJsonEditorRule`\>
