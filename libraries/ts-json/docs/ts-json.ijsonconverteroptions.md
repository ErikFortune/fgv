<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-json](./ts-json.md) &gt; [IJsonConverterOptions](./ts-json.ijsonconverteroptions.md)

## IJsonConverterOptions interface

Conversion options for [JsonConverter](./ts-json.jsonconverter.md)<!-- -->.

**Signature:**

```typescript
export interface IJsonConverterOptions 
```

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [extendVars?](./ts-json.ijsonconverteroptions.extendvars.md) |  | [TemplateVarsExtendFunction](./ts-json.templatevarsextendfunction.md) | _(Optional)_ Method used to extend variables for children of an array node during expansion. Default is to use a built-in extension function unless [extendVars](./ts-json.ijsonconverteroptions.extendvars.md) is explicitly set to undefined. |
|  [flattenUnconditionalValues](./ts-json.ijsonconverteroptions.flattenunconditionalvalues.md) |  | boolean | If <code>true</code> (default) then properties with unconditional names (which start with !) are flattened. |
|  [onInvalidPropertyName](./ts-json.ijsonconverteroptions.oninvalidpropertyname.md) |  | 'error' \| 'ignore' | If [onInvalidPropertyName](./ts-json.ijsonconverteroptions.oninvalidpropertyname.md) is <code>'error'</code> (default) then any property name that is invalid after template rendering causes an error and stops conversion. If [onInvalidPropertyName](./ts-json.ijsonconverteroptions.oninvalidpropertyname.md) is <code>'ignore'</code>, then names which are invalid after template rendering are passed through unchanged. |
|  [onInvalidPropertyValue](./ts-json.ijsonconverteroptions.oninvalidpropertyvalue.md) |  | 'error' \| 'ignore' | If [onInvalidPropertyValue](./ts-json.ijsonconverteroptions.oninvalidpropertyvalue.md) is <code>'error'</code> (default) then any illegal property value causes an error and stops conversion. If [onInvalidPropertyValue](./ts-json.ijsonconverteroptions.oninvalidpropertyvalue.md) is <code>'ignore'</code> then any invalid property values are silently ignored. |
|  [onUndefinedPropertyValue](./ts-json.ijsonconverteroptions.onundefinedpropertyvalue.md) |  | 'error' \| 'ignore' | If [onUndefinedPropertyValue](./ts-json.ijsonconverteroptions.onundefinedpropertyvalue.md) is <code>'error'</code>, then any property with value <code>undefined</code> will cause an error and stop conversion. If [onUndefinedPropertyValue](./ts-json.ijsonconverteroptions.onundefinedpropertyvalue.md) is <code>'ignore'</code> (default) then any property with value <code>undefined</code> is silently ignored. |
|  [refs?](./ts-json.ijsonconverteroptions.refs.md) |  | [IJsonReferenceMap](./ts-json.ijsonreferencemap.md) | _(Optional)_ An optional [reference map](./ts-json.ijsonreferencemap.md) used to insert any references in the converted JSON. |
|  [useConditionalNames](./ts-json.ijsonconverteroptions.useconditionalnames.md) |  | boolean | <p>If <code>true</code> and if template variables are available, then string property names will be considered for conditionals.</p><p>Default is to match [useNameTemplates](./ts-json.ijsonconverteroptions.usenametemplates.md)<!-- -->.</p> |
|  [useMultiValueTemplateNames](./ts-json.ijsonconverteroptions.usemultivaluetemplatenames.md) |  | boolean | <p>If <code>true</code> and if both template variables and a context derivation function is available, then properties which match the multi-value name pattern will be expanded. Default matches [useNameTemplates](./ts-json.ijsonconverteroptions.usenametemplates.md)<!-- -->.</p><p>Default is <code>true</code> unless [extendVars](./ts-json.ijsonconverteroptions.extendvars.md) is explicitly set to <code>undefined</code>.</p> |
|  [useNameTemplates](./ts-json.ijsonconverteroptions.usenametemplates.md) |  | boolean | <p>If <code>true</code> and if template variables are available, then property names will be rendered using mustache and those variable values. Otherwise property names are copied without modification.</p><p>Defaults to <code>true</code> if vars are supplied with options, <code>false</code> otherwise.</p> |
|  [useReferences](./ts-json.ijsonconverteroptions.usereferences.md) |  | boolean | <p>If <code>true</code> and if a [references map](./ts-json.ijsonreferencemap.md) is supplied in [refs](./ts-json.ijsonconverteroptions.refs.md)<!-- -->, then references in the source object will be replaced with the corresponding value from the reference map.</p><p>Default is <code>true</code> if [refs](./ts-json.ijsonconverteroptions.refs.md) are present in options, <code>false</code> otherwise.</p> |
|  [useValueTemplates](./ts-json.ijsonconverteroptions.usevaluetemplates.md) |  | boolean | <p>If <code>true</code> and if template variables are available, then string property values will be rendered using mustache and those variable values. Otherwise string properties are copied without modification.</p><p>Defaults to <code>true</code> if vars are supplied with options, <code>false</code> otherwise.</p> |
|  [vars?](./ts-json.ijsonconverteroptions.vars.md) |  | [TemplateVars](./ts-json.templatevars.md) | _(Optional)_ The variables (mustache view) used to render templated string names and properties. See the mustache documentation for details of mustache syntax and the template view. |

