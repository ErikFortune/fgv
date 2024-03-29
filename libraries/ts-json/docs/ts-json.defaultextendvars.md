<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-json](./ts-json.md) &gt; [defaultExtendVars](./ts-json.defaultextendvars.md)

## defaultExtendVars() function

This default implementation of a [TemplateVarsExtendFunction](./ts-json.templatevarsextendfunction.md) creates a new collection via inheritance from the supplied collection.

**Signature:**

```typescript
export declare function defaultExtendVars(base: TemplateVars | undefined, values: VariableValue[]): Result<TemplateVars | undefined>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  base | [TemplateVars](./ts-json.templatevars.md) \| undefined | The base [variables](./ts-json.templatevars.md) to be extended. |
|  values | [VariableValue](./ts-json.variablevalue.md)<!-- -->\[\] | The [values](./ts-json.variablevalue.md) to be added or overridden in the new variables. |

**Returns:**

Result&lt;[TemplateVars](./ts-json.templatevars.md) \| undefined&gt;

