[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-json](../README.md) / defaultExtendVars

# Function: defaultExtendVars()

> **defaultExtendVars**(`base`, `values`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`TemplateVars`](../type-aliases/TemplateVars.md) \| `undefined`\>

This default implementation of a [TemplateVarsExtendFunction](../type-aliases/TemplateVarsExtendFunction.md)
creates a new collection via inheritance from the supplied collection.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `base` | [`TemplateVars`](../type-aliases/TemplateVars.md) \| `undefined` | The base [variables](../type-aliases/TemplateVars.md) to be extended. |
| `values` | [`VariableValue`](../type-aliases/VariableValue.md)[] | The [values](../type-aliases/VariableValue.md) to be added or overridden in the new variables. |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`TemplateVars`](../type-aliases/TemplateVars.md) \| `undefined`\>
