[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json](../../../README.md) / [EditorRules](../README.md) / TemplatedJsonEditorRule

# Class: TemplatedJsonEditorRule

The Templated JSON editor rule applies mustache rendering as
appropriate to any keys or values in the object being edited.

## Extends

- [`JsonEditorRuleBase`](../../../classes/JsonEditorRuleBase.md)

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

[`JsonEditorRuleBase`](../../../classes/JsonEditorRuleBase.md).[`constructor`](../../../classes/JsonEditorRuleBase.md#constructor)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_options"></a> `_options?` | `public` | [`ITemplatedJsonRuleOptions`](../interfaces/ITemplatedJsonRuleOptions.md) | Fully-resolved [configuration options](../interfaces/ITemplatedJsonRuleOptions.md) for this rule. |

## Methods

### \_render()

> `protected` **\_render**(`template`, `state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, [`JsonEditFailureReason`](../../../type-aliases/JsonEditFailureReason.md)\>

**`Internal`**

Renders a single template string for a supplied [editor state](../../../classes/JsonEditorState.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `template` | `string` | The mustache template to be rendered. |
| `state` | [`JsonEditorState`](../../../classes/JsonEditorState.md) | The [editor state](../../../classes/JsonEditorState.md) used to render the template. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, [`JsonEditFailureReason`](../../../type-aliases/JsonEditFailureReason.md)\>

`Success` if the template is rendered.  Returns `Failure` with detail `'error'` if the
template could not be rendered (e.g. due to syntax errors) or with detail `'inapplicable'` if the
string is not a template.

***

### editProperty()

> **editProperty**(`key`, `value`, `state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonPropertyEditFailureReason`](../../../type-aliases/JsonPropertyEditFailureReason.md)\>

Evaluates a property name for template rendering.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key of the property to be considered. |
| `value` | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | The `JsonValue` of the property to be considered. |
| `state` | [`JsonEditorState`](../../../classes/JsonEditorState.md) | The [editor state](../../../classes/JsonEditorState.md) for the object being edited. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonPropertyEditFailureReason`](../../../type-aliases/JsonPropertyEditFailureReason.md)\>

`Success` with detail `'edited'` and an `JsonObject` to
be flattened and merged if the key contained a template. Returns `Failure` with detail `'error'`
if an error occurred or with detail `'inapplicable'` if the property key does not contain
a template or if name rendering is disabled.

#### Overrides

[`JsonEditorRuleBase`](../../../classes/JsonEditorRuleBase.md).[`editProperty`](../../../classes/JsonEditorRuleBase.md#editproperty)

***

### editValue()

> **editValue**(`value`, `state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md), [`JsonEditFailureReason`](../../../type-aliases/JsonEditFailureReason.md)\>

Evaluates a property, array or literal value for template rendering.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | The `JsonValue` to be edited. |
| `state` | [`JsonEditorState`](../../../classes/JsonEditorState.md) | The [editor state](../../../classes/JsonEditorState.md) for the object being edited. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md), [`JsonEditFailureReason`](../../../type-aliases/JsonEditFailureReason.md)\>

`Success` with detail `'edited'` if the value contained a template and was edited.
Returns `Failure` with `'ignore'` if the rendered value should be ignored, with `'error'` if
an error occurs, or with `'inapplicable'` if the value was not a string with a template.

#### Overrides

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

> `static` **create**(`options?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`TemplatedJsonEditorRule`\>

Creates a new TemplatedJsonEditorRule.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`ITemplatedJsonRuleOptions`](../interfaces/ITemplatedJsonRuleOptions.md) | Optional [configuration options](../interfaces/ITemplatedJsonRuleOptions.md) for this rule. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`TemplatedJsonEditorRule`\>
