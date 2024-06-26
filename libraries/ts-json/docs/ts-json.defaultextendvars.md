<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-json](./ts-json.md) &gt; [defaultExtendVars](./ts-json.defaultextendvars.md)

## defaultExtendVars() function

This default implementation of a [TemplateVarsExtendFunction](./ts-json.templatevarsextendfunction.md) creates a new collection via inheritance from the supplied collection.

**Signature:**

```typescript
export declare function defaultExtendVars(base: TemplateVars | undefined, values: VariableValue[]): Result<TemplateVars | undefined>;
```

## Parameters

<table><thead><tr><th>

Parameter


</th><th>

Type


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

base


</td><td>

[TemplateVars](./ts-json.templatevars.md) \| undefined


</td><td>

The base [variables](./ts-json.templatevars.md) to be extended.


</td></tr>
<tr><td>

values


</td><td>

[VariableValue](./ts-json.variablevalue.md)<!-- -->\[\]


</td><td>

The [values](./ts-json.variablevalue.md) to be added or overridden in the new variables.


</td></tr>
</tbody></table>
**Returns:**

Result&lt;[TemplateVars](./ts-json.templatevars.md) \| undefined&gt;

