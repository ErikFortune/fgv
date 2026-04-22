[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-json](../README.md) / JsonEditorState

# Class: JsonEditorState

Represents the internal state of a [JsonEditor](JsonEditor.md).

## Constructors

### Constructor

> **new JsonEditorState**(`editor`, `baseOptions`, `runtimeContext?`): `JsonEditorState`

Constructs a new JsonEditorState.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `editor` | [`IJsonCloneEditor`](../interfaces/IJsonCloneEditor.md) | The [editor](../interfaces/IJsonCloneEditor.md) to which this state applies. |
| `baseOptions` | [`IJsonEditorOptions`](../interfaces/IJsonEditorOptions.md) | The [editor options](../interfaces/IJsonEditorOptions.md) that apply to this rule. |
| `runtimeContext?` | [`IJsonContext`](../interfaces/IJsonContext.md) | An optional [JSON context](../interfaces/IJsonContext.md) to be used for json value conversion. |

#### Returns

`JsonEditorState`

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="_deferred"></a> `_deferred` | `readonly` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[] | `[]` | **`Internal`** Any deferred JSON objects to be merged during finalization. |
| <a id="_id"></a> `_id` | `readonly` | `number` | `undefined` | **`Internal`** Unique global identifier for this state object. |
| <a id="editor"></a> `editor` | `readonly` | [`IJsonCloneEditor`](../interfaces/IJsonCloneEditor.md) | `undefined` | The [editor](../interfaces/IJsonCloneEditor.md) for which this state applies. |
| <a id="options"></a> `options` | `readonly` | [`IJsonEditorOptions`](../interfaces/IJsonEditorOptions.md) | `undefined` | Fully resolved [editor options](../interfaces/IJsonEditorOptions.md) that apply to the operation for which this state applies. |
| <a id="_nextid"></a> `_nextId` | `static` | `number` | `0` | **`Internal`** Static global counter used to assign each JsonEditorState a unique identifier. |

## Accessors

### context

#### Get Signature

> **get** **context**(): [`IJsonContext`](../interfaces/IJsonContext.md) \| `undefined`

The optional [JSON context](../interfaces/IJsonContext.md) for this state.

##### Returns

[`IJsonContext`](../interfaces/IJsonContext.md) \| `undefined`

***

### deferred

#### Get Signature

> **get** **deferred**(): [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[]

An array of JSON objects that were deferred for merge during
finalization.

##### Returns

[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)[]

## Methods

### defer()

> **defer**(`obj`): `void`

Adds a supplied `JsonObject` to the deferred list.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `obj` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The `JsonObject` to be deferred. |

#### Returns

`void`

***

### extendContext()

> **extendContext**(`baseContext`, `add`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IJsonContext`](../interfaces/IJsonContext.md) \| `undefined`\>

Constructs a new [IJsonContext](../interfaces/IJsonContext.md) by merging supplied variables
and references into a supplied existing context.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `baseContext` | [`IJsonContext`](../interfaces/IJsonContext.md) \| `undefined` | The [IJsonContext](../interfaces/IJsonContext.md) into which variables and references are to be merged, or `undefined` to start with a default empty context. |
| `add` | \{ `refs?`: [`IJsonReferenceMap`](../interfaces/IJsonReferenceMap.md)[]; `vars?`: [`VariableValue`](../type-aliases/VariableValue.md)[]; \} | The [variable values](../type-aliases/VariableValue.md) and/or [JSON entity references](../interfaces/IJsonReferenceMap.md) to be merged into the base context. |
| `add.refs?` | [`IJsonReferenceMap`](../interfaces/IJsonReferenceMap.md)[] | - |
| `add.vars?` | [`VariableValue`](../type-aliases/VariableValue.md)[] | - |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IJsonContext`](../interfaces/IJsonContext.md) \| `undefined`\>

A new [IJsonContext](../interfaces/IJsonContext.md) created by merging the supplied values.

***

### failValidation()

> **failValidation**\<`T`\>(`rule`, `message?`, `validation?`): [`DetailedFailure`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

Helper method to constructs  `DetailedFailure` with appropriate details and messaging
for various validation failures.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `rule` | [`JsonEditorValidationRules`](../type-aliases/JsonEditorValidationRules.md) | The [validation rule](../type-aliases/JsonEditorValidationRules.md) that failed. |
| `message?` | `string` | A string message describing the failed validation. |
| `validation?` | [`IJsonEditorValidationOptions`](../interfaces/IJsonEditorValidationOptions.md) | The [validation options](../interfaces/IJsonEditorValidationOptions.md) in effect. |

#### Returns

[`DetailedFailure`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`JsonEditFailureReason`](../type-aliases/JsonEditFailureReason.md)\>

A `DetailedFailure` with appropriate detail and message.

***

### getContext()

> **getContext**(`defaultContext?`): [`IJsonContext`](../interfaces/IJsonContext.md) \| `undefined`

Gets the context of this JsonEditorState or an optionally
supplied default context if this state has no context.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `defaultContext?` | [`IJsonContext`](../interfaces/IJsonContext.md) | The default [JSON context](../interfaces/IJsonContext.md) to use as default if this state has no context. |

#### Returns

[`IJsonContext`](../interfaces/IJsonContext.md) \| `undefined`

The appropriate [IJsonContext](../interfaces/IJsonContext.md) or `undefined` if no context
is available.

***

### getRefs()

> **getRefs**(`defaultContext?`): [`IJsonReferenceMap`](../interfaces/IJsonReferenceMap.md) \| `undefined`

Gets an [reference map](../interfaces/IJsonReferenceMap.md) containing any other values
referenced during the operation.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `defaultContext?` | [`IJsonContext`](../interfaces/IJsonContext.md) | An optional default [IJsonContext](../interfaces/IJsonContext.md) to use as [TemplateVars](../type-aliases/TemplateVars.md) if the current state does not have context. |

#### Returns

[`IJsonReferenceMap`](../interfaces/IJsonReferenceMap.md) \| `undefined`

An [IJsonReferenceMap](../interfaces/IJsonReferenceMap.md) containing any values referenced
during this operation.

***

### getVars()

> **getVars**(`defaultContext?`): [`TemplateVars`](../type-aliases/TemplateVars.md) \| `undefined`

Gets a [TemplateVars](../type-aliases/TemplateVars.md) from the context of this JsonEditorState,
or from an optional supplied [IJsonContext](../interfaces/IJsonContext.md) if the current state has no default
context.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `defaultContext?` | [`IJsonContext`](../interfaces/IJsonContext.md) | An optional default [IJsonContext](../interfaces/IJsonContext.md) to use as `TemplateVars` if the current state does not have context. |

#### Returns

[`TemplateVars`](../type-aliases/TemplateVars.md) \| `undefined`

A [TemplateVars](../type-aliases/TemplateVars.md) reflecting the appropriate [JSON context](../interfaces/IJsonContext.md), or
`undefined` if no vars are found.

***

### \_getEffectiveOptions()

> `protected` `static` **\_getEffectiveOptions**(`options`, `context?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IJsonEditorOptions`](../interfaces/IJsonEditorOptions.md)\>

**`Internal`**

Merges an optional [JSON context](../interfaces/IJsonContext.md) into a supplied set
of [JSON editor options](../interfaces/IJsonEditorOptions.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`IJsonEditorOptions`](../interfaces/IJsonEditorOptions.md) | The [IJsonEditorOptions](../interfaces/IJsonEditorOptions.md) into which the the new context is to be merged. |
| `context?` | [`IJsonContext`](../interfaces/IJsonContext.md) | The [JSON context](../interfaces/IJsonContext.md) to be merged into the editor options. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IJsonEditorOptions`](../interfaces/IJsonEditorOptions.md)\>

`Success` with the supplied [options](../interfaces/IJsonEditorOptions.md) if
there was nothing to merge, or aa new [IJsonEditorOptions](../interfaces/IJsonEditorOptions.md)
constructed from the base options merged with the supplied context.  Returns `Failure`
with more information if an error occurs.
