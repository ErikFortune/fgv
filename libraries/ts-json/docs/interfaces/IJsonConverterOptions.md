[Home](../README.md) > IJsonConverterOptions

# Interface: IJsonConverterOptions

Conversion options for JsonConverter | JsonConverter.

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[useValueTemplates](./IJsonConverterOptions.useValueTemplates.md)

</td><td>



</td><td>

boolean

</td><td>

If `true` and if template variables are available,
then string property values will be rendered using
mustache and those variable values.

</td></tr>
<tr><td>

[useNameTemplates](./IJsonConverterOptions.useNameTemplates.md)

</td><td>



</td><td>

boolean

</td><td>

If `true` and if template variables are available,
then property names will be rendered using
mustache and those variable values.

</td></tr>
<tr><td>

[useConditionalNames](./IJsonConverterOptions.useConditionalNames.md)

</td><td>



</td><td>

boolean

</td><td>

If `true` and if template variables are available,
then string property names will be considered for
conditionals.

</td></tr>
<tr><td>

[flattenUnconditionalValues](./IJsonConverterOptions.flattenUnconditionalValues.md)

</td><td>



</td><td>

boolean

</td><td>

If `true` (default) then properties with unconditional names

</td></tr>
<tr><td>

[useMultiValueTemplateNames](./IJsonConverterOptions.useMultiValueTemplateNames.md)

</td><td>



</td><td>

boolean

</td><td>

If `true` and if both template variables and a
context derivation function is available, then properties
which match the multi-value name pattern will be expanded.

</td></tr>
<tr><td>

[vars](./IJsonConverterOptions.vars.md)

</td><td>



</td><td>

[TemplateVars](../type-aliases/TemplateVars.md)

</td><td>

The variables (mustache view) used to render templated string names
and properties.

</td></tr>
<tr><td>

[extendVars](./IJsonConverterOptions.extendVars.md)

</td><td>



</td><td>

[TemplateVarsExtendFunction](../type-aliases/TemplateVarsExtendFunction.md)

</td><td>

Method used to extend variables for children of an array node during
expansion.

</td></tr>
<tr><td>

[useReferences](./IJsonConverterOptions.useReferences.md)

</td><td>



</td><td>

boolean

</td><td>

If `true` and if a IJsonReferenceMap | references map is supplied
in IJsonConverterOptions.refs | refs, then references in the source
object will be replaced with the corresponding value from the reference map.

</td></tr>
<tr><td>

[refs](./IJsonConverterOptions.refs.md)

</td><td>



</td><td>

[IJsonReferenceMap](IJsonReferenceMap.md)

</td><td>

An optional IJsonReferenceMap | reference map used to insert any references

</td></tr>
<tr><td>

[onInvalidPropertyName](./IJsonConverterOptions.onInvalidPropertyName.md)

</td><td>



</td><td>

"error" | "ignore"

</td><td>

If IJsonConverterOptions.onInvalidPropertyName | onInvalidPropertyName is `'error'`
(default) then any property name that is invalid after template rendering causes an error
and stops conversion.

</td></tr>
<tr><td>

[onInvalidPropertyValue](./IJsonConverterOptions.onInvalidPropertyValue.md)

</td><td>



</td><td>

"error" | "ignore"

</td><td>

If IJsonConverterOptions.onInvalidPropertyValue | onInvalidPropertyValue is `'error'`
(default) then any illegal property value causes an error and stops conversion.

</td></tr>
<tr><td>

[onUndefinedPropertyValue](./IJsonConverterOptions.onUndefinedPropertyValue.md)

</td><td>



</td><td>

"error" | "ignore"

</td><td>

If IJsonConverterOptions.onUndefinedPropertyValue | onUndefinedPropertyValue is `'error'`,
then any property with value `undefined` will cause an error and stop conversion.

</td></tr>
</tbody></table>
