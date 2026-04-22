[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-json](../README.md) / JsonEditor

# Class: JsonEditor

A JsonEditor can be used to edit JSON objects in place or to
clone any JSON value, applying a default context and optional set of editor rules that
were supplied at initialization.

## Implements

- [`IJsonCloneEditor`](../interfaces/IJsonCloneEditor.md)

## Constructors

### Constructor

> `protected` **new JsonEditor**(`options?`, `rules?`): `JsonEditor`

**`Internal`**

Protected constructor for JsonEditor and derived classes.
External consumers should instantiate via the [create static method](#create).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | `Partial`\<[`IJsonEditorOptions`](../interfaces/IJsonEditorOptions.md)\> | Optional partial [editor options](../interfaces/IJsonEditorOptions.md) for the constructed editor. |
| `rules?` | [`IJsonEditorRule`](../interfaces/IJsonEditorRule.md)[] | Any [editor rules](../interfaces/IJsonEditorRule.md) to be applied by the editor. |

#### Returns

`JsonEditor`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_rules"></a> `_rules` | `protected` | [`IJsonEditorRule`](../interfaces/IJsonEditorRule.md)[] | **`Internal`** The set of [editor rules](../interfaces/IJsonEditorRule.md) applied by this editor. |
| <a id="options"></a> `options` | `public` | [`IJsonEditorOptions`](../interfaces/IJsonEditorOptions.md) | Full set of [editor options](../interfaces/IJsonEditorOptions.md) in effect for this editor. |
| <a id="_default"></a> `_default?` | `static` | `JsonEditor` | **`Internal`** Default singleton JsonEditor. |

## Accessors

### default

#### Get Signature

> **get** `static` **default**(): `JsonEditor`

Default singleton JsonEditor for simple use. Applies all rules
but with no default context.

##### Returns

`JsonEditor`

## Methods

### \_cloneArray()

> `protected` **\_cloneArray**(`src`, `context?`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonArray`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

**`Internal`**

Creates a deep clone of a JSON array by recursively cloning each element.
Each array element is cloned using the main clone method, preserving the
editor's rules and validation settings.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `src` | [`JsonArray`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The source JSON array to clone |
| `context?` | [`IJsonContext`](../interfaces/IJsonContext.md) | Optional JSON context for cloning operations |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonArray`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

Success with the cloned array, or Failure with error details

***

### \_cloneObjectWithoutNullAsDelete()

> `protected` **\_cloneObjectWithoutNullAsDelete**(`target`, `src`, `state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

**`Internal`**

Clone an object without applying null-as-delete behavior.
This preserves null values during cloning so they can be used for deletion signaling during merge.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `target` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The target object to clone into |
| `src` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The source object to clone |
| `state` | [`JsonEditorState`](JsonEditorState.md) | The editor state |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

The cloned object

***

### \_editProperty()

> `protected` **\_editProperty**(`key`, `value`, `state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonPropertyEditFailureReason`](../type-aliases/JsonPropertyEditFailureReason.md)\>

**`Internal`**

Applies editor rules to a single property during merge operations. This method
iterates through all configured editor rules to process the property, handling
templates, conditionals, multi-value properties, and references.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The property key to edit |
| `value` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) | The property value to edit |
| `state` | [`JsonEditorState`](JsonEditorState.md) | The editor state containing rules and context |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonPropertyEditFailureReason`](../type-aliases/JsonPropertyEditFailureReason.md)\>

Success with transformed property object, or Failure if rules cannot process

***

### \_editValue()

> `protected` **\_editValue**(`value`, `state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

**`Internal`**

Applies editor rules to a single JSON value during clone operations. This method
iterates through all configured editor rules to process the value, handling
templates, conditionals, multi-value expressions, and references.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) | The JSON value to edit and transform |
| `state` | [`JsonEditorState`](JsonEditorState.md) | The editor state containing rules and context |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

Success with transformed value, or Failure if rules cannot process

***

### \_finalizeAndMerge()

> `protected` **\_finalizeAndMerge**(`target`, `state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

**`Internal`**

Finalizes the merge operation by processing any deferred properties and merging
them into the target object. Deferred properties are those that require special
processing after the initial merge phase, such as references that depend on
other properties being resolved first.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `target` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The target object that has been merged |
| `state` | [`JsonEditorState`](JsonEditorState.md) | The editor state containing deferred properties and rules |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs), [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

Success with the finalized target object, or Failure with error details

***

### \_mergeClonedProperty()

> `protected` **\_mergeClonedProperty**(`target`, `key`, `newValue`, `state`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

**`Internal`**

Merges a single cloned property value into a target object. This method handles
the core merge logic including null-as-delete behavior, array merging, and
recursive object merging. The null-as-delete check occurs before primitive
handling to ensure null values can signal property deletion.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `target` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The target object to merge the property into |
| `key` | `string` | The property key being merged |
| `newValue` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) | The cloned value to merge (from source object) |
| `state` | [`JsonEditorState`](JsonEditorState.md) | The editor state containing merge options and context |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

Success with the merged value, or Failure with error details

***

### \_mergeObjectInPlace()

> `protected` **\_mergeObjectInPlace**(`target`, `src`, `state`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

**`Internal`**

Merges properties from a source object into a target object, applying editor rules and
null-as-delete logic. This is the core merge implementation that handles property-by-property
merging with rule processing and deferred property handling.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `target` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The target object to merge properties into |
| `src` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The source object containing properties to merge |
| `state` | [`JsonEditorState`](JsonEditorState.md) | The editor state containing options and context |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

Success with the modified target object, or Failure with error details

***

### clone()

> **clone**(`src`, `context?`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

Deep clones a supplied `JsonValue`, applying all editor rules and a default
or optionally supplied context

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `src` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) | The `JsonValue` to be cloned. |
| `context?` | [`IJsonContext`](../interfaces/IJsonContext.md) | An optional [JSON context](../interfaces/IJsonContext.md) supplying variables and references. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md), [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

#### Implementation of

[`IJsonCloneEditor`](../interfaces/IJsonCloneEditor.md).[`clone`](../interfaces/IJsonCloneEditor.md#clone)

***

### mergeObjectInPlace()

> **mergeObjectInPlace**(`target`, `src`, `runtimeContext?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

Merges a supplied source object into a supplied target, updating the target object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `target` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The target `JsonObject` to be updated |
| `src` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The source `JsonObject` to be merged |
| `runtimeContext?` | [`IJsonContext`](../interfaces/IJsonContext.md) | An optional [IJsonContext](../interfaces/IJsonContext.md) supplying variables and references. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

`Success` with the original source `JsonObject` if merge was successful.
Returns `Failure` with details if an error occurs.

***

### mergeObjectsInPlace()

> **mergeObjectsInPlace**(`target`, `srcObjects`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

Merges multiple supplied source objects into a supplied target, updating the target
object and using the default context supplied at creation time.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `target` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The target `JsonObject` to be updated |
| `srcObjects` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[] | `JsonObject`s to be merged into the target object, in the order supplied. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

`Success` with the original source `JsonObject` if merge was successful.
Returns `Failure` with details if an error occurs.

***

### mergeObjectsInPlaceWithContext()

> **mergeObjectsInPlaceWithContext**(`context`, `base`, `srcObjects`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

Merges multiple supplied source objects into a supplied target, updating the target
object and using an optional [context](../interfaces/IJsonContext.md) supplied in the call.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | [`IJsonContext`](../interfaces/IJsonContext.md) \| `undefined` | An optional [IJsonContext](../interfaces/IJsonContext.md) supplying variables and references. |
| `base` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The base `JsonObject` to be updated |
| `srcObjects` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[] | Objects to be merged into the target object, in the order supplied. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

`Success` with the original source `JsonObject` if merge was successful.
Returns `Failure` with details if an error occurs.

***

### \_getDefaultOptions()

> `protected` `static` **\_getDefaultOptions**(`options?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IJsonEditorOptions`](../interfaces/IJsonEditorOptions.md)\>

**`Internal`**

Creates a complete IJsonEditorOptions object from partial options, filling in
default values for any missing properties. This ensures all editor instances
have consistent, complete configuration including validation rules and merge behavior.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | `Partial`\<[`IJsonEditorOptions`](../interfaces/IJsonEditorOptions.md)\> | Optional partial editor options to merge with defaults |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IJsonEditorOptions`](../interfaces/IJsonEditorOptions.md)\>

Success with complete editor options, or Failure if validation fails

***

### create()

> `static` **create**(`options?`, `rules?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`JsonEditor`\>

Constructs a new JsonEditor.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | `Partial`\<[`IJsonEditorOptions`](../interfaces/IJsonEditorOptions.md)\> | Optional partial [editor options](../interfaces/IJsonEditorOptions.md) for the constructed editor. |
| `rules?` | [`IJsonEditorRule`](../interfaces/IJsonEditorRule.md)[] | Optional set of [editor rules](../interfaces/IJsonEditorRule.md) to be applied by the editor. A new JsonEditor. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`JsonEditor`\>

***

### getDefaultRules()

> `static` **getDefaultRules**(`options?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IJsonEditorRule`](../interfaces/IJsonEditorRule.md)[]\>

Gets the default set of rules to be applied for a given set of options.
By default, all available rules (templates, conditionals, multi-value and references)
are applied.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IJsonEditorOptions`](../interfaces/IJsonEditorOptions.md) | Optional partial [editor options](../interfaces/IJsonEditorOptions.md) for all rules. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IJsonEditorRule`](../interfaces/IJsonEditorRule.md)[]\>

Default [editor rules](../interfaces/IJsonEditorRule.md) with any supplied options
applied.
