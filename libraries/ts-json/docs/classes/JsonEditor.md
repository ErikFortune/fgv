[**@fgv/ts-json**](../README.md)

***

[@fgv/ts-json](../README.md) / JsonEditor

# Class: JsonEditor

A JsonEditor can be used to edit JSON objects in place or to
clone any JSON value, applying a default context and optional set of editor rules that
were supplied at initialization.

## Implements

- [`IJsonCloneEditor`](../interfaces/IJsonCloneEditor.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="options"></a> `options` | `public` | [`IJsonEditorOptions`](../interfaces/IJsonEditorOptions.md) | Full set of [editor options](../interfaces/IJsonEditorOptions.md) in effect for this editor. |

## Accessors

### default

#### Get Signature

> **get** `static` **default**(): `JsonEditor`

Default singleton JsonEditor for simple use. Applies all rules
but with no default context.

##### Returns

`JsonEditor`

## Methods

### clone()

> **clone**(`src`, `context?`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

Deep clones a supplied `JsonValue`, applying all editor rules and a default
or optionally supplied context

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `src` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The `JsonValue` to be cloned. |
| `context?` | [`IJsonContext`](../interfaces/IJsonContext.md) | An optional [JSON context](../interfaces/IJsonContext.md) supplying variables and references. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

#### Implementation of

[`IJsonCloneEditor`](../interfaces/IJsonCloneEditor.md).[`clone`](../interfaces/IJsonCloneEditor.md#clone)

***

### mergeObjectInPlace()

> **mergeObjectInPlace**(`target`, `src`, `runtimeContext?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

Merges a supplied source object into a supplied target, updating the target object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `target` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The target `JsonObject` to be updated |
| `src` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The source `JsonObject` to be merged |
| `runtimeContext?` | [`IJsonContext`](../interfaces/IJsonContext.md) | An optional [IJsonContext](../interfaces/IJsonContext.md) supplying variables and references. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

`Success` with the original source `JsonObject` if merge was successful.
Returns `Failure` with details if an error occurs.

***

### mergeObjectsInPlace()

> **mergeObjectsInPlace**(`target`, `srcObjects`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

Merges multiple supplied source objects into a supplied target, updating the target
object and using the default context supplied at creation time.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `target` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The target `JsonObject` to be updated |
| `srcObjects` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[] | `JsonObject`s to be merged into the target object, in the order supplied. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

`Success` with the original source `JsonObject` if merge was successful.
Returns `Failure` with details if an error occurs.

***

### mergeObjectsInPlaceWithContext()

> **mergeObjectsInPlaceWithContext**(`context`, `base`, `srcObjects`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

Merges multiple supplied source objects into a supplied target, updating the target
object and using an optional [context](../interfaces/IJsonContext.md) supplied in the call.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | [`IJsonContext`](../interfaces/IJsonContext.md) \| `undefined` | An optional [IJsonContext](../interfaces/IJsonContext.md) supplying variables and references. |
| `base` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The base `JsonObject` to be updated |
| `srcObjects` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[] | Objects to be merged into the target object, in the order supplied. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

`Success` with the original source `JsonObject` if merge was successful.
Returns `Failure` with details if an error occurs.

***

### create()

> `static` **create**(`options?`, `rules?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`JsonEditor`\>

Constructs a new JsonEditor.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | `Partial`\<[`IJsonEditorOptions`](../interfaces/IJsonEditorOptions.md)\> | Optional partial [editor options](../interfaces/IJsonEditorOptions.md) for the constructed editor. |
| `rules?` | [`IJsonEditorRule`](../interfaces/IJsonEditorRule.md)[] | Optional set of [editor rules](../interfaces/IJsonEditorRule.md) to be applied by the editor. A new JsonEditor. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`JsonEditor`\>

***

### getDefaultRules()

> `static` **getDefaultRules**(`options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IJsonEditorRule`](../interfaces/IJsonEditorRule.md)[]\>

Gets the default set of rules to be applied for a given set of options.
By default, all available rules (templates, conditionals, multi-value and references)
are applied.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IJsonEditorOptions`](../interfaces/IJsonEditorOptions.md) | Optional partial [editor options](../interfaces/IJsonEditorOptions.md) for all rules. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IJsonEditorRule`](../interfaces/IJsonEditorRule.md)[]\>

Default [editor rules](../interfaces/IJsonEditorRule.md) with any supplied options
applied.
