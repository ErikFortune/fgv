[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-json](../README.md) / IJsonConverterOptions

# Interface: IJsonConverterOptions

Conversion options for [JsonConverter](../classes/JsonConverter.md).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="extendvars"></a> `extendVars?` | [`TemplateVarsExtendFunction`](../type-aliases/TemplateVarsExtendFunction.md) | Method used to extend variables for children of an array node during expansion. Default is to use a built-in extension function unless [extendVars](#extendvars) is explicitly set to undefined. |
| <a id="flattenunconditionalvalues"></a> `flattenUnconditionalValues` | `boolean` | If `true` (default) then properties with unconditional names (which start with !) are flattened. |
| <a id="oninvalidpropertyname"></a> `onInvalidPropertyName` | `"error"` \| `"ignore"` | If [onInvalidPropertyName](#oninvalidpropertyname) is `'error'` (default) then any property name that is invalid after template rendering causes an error and stops conversion. If [onInvalidPropertyName](#oninvalidpropertyname) is `'ignore'`, then names which are invalid after template rendering are passed through unchanged. |
| <a id="oninvalidpropertyvalue"></a> `onInvalidPropertyValue` | `"error"` \| `"ignore"` | If [onInvalidPropertyValue](#oninvalidpropertyvalue) is `'error'` (default) then any illegal property value causes an error and stops conversion. If [onInvalidPropertyValue](#oninvalidpropertyvalue) is `'ignore'` then any invalid property values are silently ignored. |
| <a id="onundefinedpropertyvalue"></a> `onUndefinedPropertyValue` | `"error"` \| `"ignore"` | If [onUndefinedPropertyValue](#onundefinedpropertyvalue) is `'error'`, then any property with value `undefined` will cause an error and stop conversion. If [onUndefinedPropertyValue](#onundefinedpropertyvalue) is `'ignore'` (default) then any property with value `undefined` is silently ignored. |
| <a id="refs"></a> `refs?` | [`IJsonReferenceMap`](IJsonReferenceMap.md) | An optional [reference map](IJsonReferenceMap.md) used to insert any references in the converted JSON. |
| <a id="useconditionalnames"></a> `useConditionalNames` | `boolean` | If `true` and if template variables are available, then string property names will be considered for conditionals. Default is to match [useNameTemplates](#usenametemplates). |
| <a id="usemultivaluetemplatenames"></a> `useMultiValueTemplateNames` | `boolean` | If `true` and if both template variables and a context derivation function is available, then properties which match the multi-value name pattern will be expanded. Default matches [useNameTemplates](#usenametemplates). Default is `true` unless [extendVars](#extendvars) is explicitly set to `undefined`. |
| <a id="usenametemplates"></a> `useNameTemplates` | `boolean` | If `true` and if template variables are available, then property names will be rendered using mustache and those variable values. Otherwise property names are copied without modification. Defaults to `true` if vars are supplied with options, `false` otherwise. |
| <a id="usereferences"></a> `useReferences` | `boolean` | If `true` and if a [references map](IJsonReferenceMap.md) is supplied in [refs](#refs), then references in the source object will be replaced with the corresponding value from the reference map. Default is `true` if [refs](#refs) are present in options, `false` otherwise. |
| <a id="usevaluetemplates"></a> `useValueTemplates` | `boolean` | If `true` and if template variables are available, then string property values will be rendered using mustache and those variable values. Otherwise string properties are copied without modification. Defaults to `true` if vars are supplied with options, `false` otherwise. |
| <a id="vars"></a> `vars?` | [`TemplateVars`](../type-aliases/TemplateVars.md) | The variables (mustache view) used to render templated string names and properties. See the mustache documentation for details of mustache syntax and the template view. |
