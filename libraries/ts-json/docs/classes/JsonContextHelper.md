[**@fgv/ts-json**](../README.md)

***

[@fgv/ts-json](../README.md) / JsonContextHelper

# Class: JsonContextHelper

Helper class for working with [IJsonContext](../interfaces/IJsonContext.md) objects.

## Constructors

### Constructor

> **new JsonContextHelper**(`context?`): `JsonContextHelper`

Constructs a new JsonContextHelper.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context?` | [`IJsonContext`](../interfaces/IJsonContext.md) | The base [IJsonContext](../interfaces/IJsonContext.md) on which to operate. |

#### Returns

`JsonContextHelper`

## Methods

### extendContext()

> **extendContext**(`add?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IJsonContext`](../interfaces/IJsonContext.md) \| `undefined`\>

Applies static `JsonContextHelper.extendContext` to the
[IJsonContext](../interfaces/IJsonContext.md) associated with this helper.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `add?` | \{ `refs?`: [`IJsonReferenceMap`](../interfaces/IJsonReferenceMap.md)[]; `vars?`: [`VariableValue`](../type-aliases/VariableValue.md)[]; \} | Optional initializer containing [variable values](../type-aliases/VariableValue.md) and/or [reference maps](../interfaces/IJsonReferenceMap.md) to be added to the [context](../interfaces/IJsonContext.md). |
| `add.refs?` | [`IJsonReferenceMap`](../interfaces/IJsonReferenceMap.md)[] | - |
| `add.vars?` | [`VariableValue`](../type-aliases/VariableValue.md)[] | - |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IJsonContext`](../interfaces/IJsonContext.md) \| `undefined`\>

`Success` with a new [IJsonContext](../interfaces/IJsonContext.md) containing the variables and
references from the base context, merged with and overridden by any that were passed in, or
`Failure` with a message if an error occurs.

***

### extendRefs()

> **extendRefs**(`refs?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IJsonReferenceMap`](../interfaces/IJsonReferenceMap.md) \| `undefined`\>

Applies [extendContextRefs](#extendcontextrefs) to the
[IJsonContext](../interfaces/IJsonContext.md) associated with this helper.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `refs?` | [`IJsonReferenceMap`](../interfaces/IJsonReferenceMap.md)[] | Optional [reference maps](../interfaces/IJsonReferenceMap.md) to be added to the |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IJsonReferenceMap`](../interfaces/IJsonReferenceMap.md) \| `undefined`\>

`Success` with a new [reference map](../interfaces/IJsonReferenceMap.md) which projects
the references from the base context, merged with and overridden by any that were passed in,
or `Failure` with a message if an error occurs.

***

### extendVars()

> **extendVars**(`vars?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`TemplateVars`](../type-aliases/TemplateVars.md) \| `undefined`\>

Applies [extendContextVars](#extendcontextvars) to the
[IJsonContext](../interfaces/IJsonContext.md) associated with this helper.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `vars?` | [`VariableValue`](../type-aliases/VariableValue.md)[] | Optional [variable values](../type-aliases/VariableValue.md) to be added to the |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`TemplateVars`](../type-aliases/TemplateVars.md) \| `undefined`\>

`Success` with a new [TemplateVars](../type-aliases/TemplateVars.md) containing the variables
from the base context, merged with and overridden by any that were passed in, or `Failure`
with a message if an error occurs.

***

### mergeContext()

> **mergeContext**(`merge?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IJsonContext`](../interfaces/IJsonContext.md) \| `undefined`\>

Applies static `JsonContextHelper.mergeContext` to the
[IJsonContext](../interfaces/IJsonContext.md) associated with this helper.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `merge?` | [`IJsonContext`](../interfaces/IJsonContext.md) |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IJsonContext`](../interfaces/IJsonContext.md) \| `undefined`\>

`Success` with a new [IJsonContext](../interfaces/IJsonContext.md) containing the variables and
references from the base context, merged with and overridden by any that were passed in, or
`Failure` with a message if an error occurs.

***

### create()

> `static` **create**(`context?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`JsonContextHelper`\>

Creates a new [context](../interfaces/IJsonContext.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context?` | [`IJsonContext`](../interfaces/IJsonContext.md) | The base [IJsonContext](../interfaces/IJsonContext.md) on which to operate. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`JsonContextHelper`\>

`Success` with the new [IJsonContext](../interfaces/IJsonContext.md),
or `Failure` with more information if an error occurs.

***

### extendContext()

> `static` **extendContext**(`baseContext?`, `add?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IJsonContext`](../interfaces/IJsonContext.md) \| `undefined`\>

Static helper to extend context variables and references for a supplied [IJsonContext](../interfaces/IJsonContext.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `baseContext?` | [`IJsonContext`](../interfaces/IJsonContext.md) | The [IJsonContext](../interfaces/IJsonContext.md) to be extended, or `undefined` to start from an empty context. |
| `add?` | \{ `refs?`: [`IJsonReferenceMap`](../interfaces/IJsonReferenceMap.md)[]; `vars?`: [`VariableValue`](../type-aliases/VariableValue.md)[]; \} | Optional initializer containing [variable values](../type-aliases/VariableValue.md) and/or [reference maps](../interfaces/IJsonReferenceMap.md) to be added to the [context](../interfaces/IJsonContext.md). |
| `add.refs?` | [`IJsonReferenceMap`](../interfaces/IJsonReferenceMap.md)[] | - |
| `add.vars?` | [`VariableValue`](../type-aliases/VariableValue.md)[] | - |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IJsonContext`](../interfaces/IJsonContext.md) \| `undefined`\>

`Success` with a new [IJsonContext](../interfaces/IJsonContext.md) containing the variables and
references from the base context, merged with and overridden by any that were passed in, or
`Failure` with a message if an error occurs.

***

### extendContextRefs()

> `static` **extendContextRefs**(`baseContext`, `refs?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IJsonReferenceMap`](../interfaces/IJsonReferenceMap.md) \| `undefined`\>

Static helper to extend context references for a supplied [IJsonContext](../interfaces/IJsonContext.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `baseContext` | [`IJsonContext`](../interfaces/IJsonContext.md) \| `undefined` | The [IJsonContext](../interfaces/IJsonContext.md) to be extended, or `undefined` to start from an empty context. |
| `refs?` | [`IJsonReferenceMap`](../interfaces/IJsonReferenceMap.md)[] | Optional [reference maps](../interfaces/IJsonReferenceMap.md) to be added to the [context](../interfaces/IJsonContext.md). |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IJsonReferenceMap`](../interfaces/IJsonReferenceMap.md) \| `undefined`\>

`Success` with a new [reference map](../interfaces/IJsonReferenceMap.md) which projects
the references from the base context, merged with and overridden by any that were passed in,
or `Failure` with a message if an error occurs.

***

### extendContextVars()

> `static` **extendContextVars**(`baseContext`, `vars?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`TemplateVars`](../type-aliases/TemplateVars.md) \| `undefined`\>

Static helper to extend context variables for a supplied [IJsonContext](../interfaces/IJsonContext.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `baseContext` | [`IJsonContext`](../interfaces/IJsonContext.md) \| `undefined` | The [IJsonContext](../interfaces/IJsonContext.md) to be extended, or `undefined` to start from an empty context. |
| `vars?` | [`VariableValue`](../type-aliases/VariableValue.md)[] | Optional [variable values](../type-aliases/VariableValue.md) to be added to the [context](../interfaces/IJsonContext.md). |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`TemplateVars`](../type-aliases/TemplateVars.md) \| `undefined`\>

`Success` with a new [TemplateVars](../type-aliases/TemplateVars.md) containing the variables
from the base context, merged with and overridden by any that were passed in, or `Failure`
with a message if an error occurs.

***

### mergeContext()

> `static` **mergeContext**(`baseContext`, `add`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IJsonContext`](../interfaces/IJsonContext.md) \| `undefined`\>

Static helper to merge context variables and references for a supplied [IJsonContext](../interfaces/IJsonContext.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `baseContext` | [`IJsonContext`](../interfaces/IJsonContext.md) \| `undefined` | The [IJsonContext](../interfaces/IJsonContext.md) into which variables and references are to be merged, or `undefined` to start from an empty context. |
| `add` | [`IJsonContext`](../interfaces/IJsonContext.md) \| `undefined` | Optional initializer containing [variable values](../type-aliases/VariableValue.md) and/or [reference maps](../interfaces/IJsonReferenceMap.md) to be added to the [context](../interfaces/IJsonContext.md). |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IJsonContext`](../interfaces/IJsonContext.md) \| `undefined`\>

`Success` with a new [IJsonContext](../interfaces/IJsonContext.md) containing the variables and
references from the base context, merged with and overridden by any that were passed in, or
`Failure` with a message if an error occurs.
