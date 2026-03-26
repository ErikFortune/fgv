[Home](../README.md) > MustacheTemplate

# Class: MustacheTemplate

A helper class for working with Mustache templates that provides
validation, variable extraction, and context validation utilities.

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

[template](./MustacheTemplate.template.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The original template string

</td></tr>
<tr><td>

[options](./MustacheTemplate.options.md)

</td><td>

`readonly`

</td><td>

Readonly&lt;IRequiredMustacheTemplateOptions&gt;

</td><td>

The options used for parsing this template

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[create(template, options)](./MustacheTemplate.create.md)

</td><td>

`static`

</td><td>

Creates a new MustacheTemplate instance.

</td></tr>
<tr><td>

[validate(template, options)](./MustacheTemplate.validate.md)

</td><td>

`static`

</td><td>

Validates that a template string has valid Mustache syntax.

</td></tr>
<tr><td>

[validate()](./MustacheTemplate.validate.md)

</td><td>



</td><td>

Checks if this template instance has valid syntax.

</td></tr>
<tr><td>

[extractVariables()](./MustacheTemplate.extractVariables.md)

</td><td>



</td><td>

Extracts all variable references from the template.

</td></tr>
<tr><td>

[extractVariableNames()](./MustacheTemplate.extractVariableNames.md)

</td><td>



</td><td>

Extracts unique variable names from the template.

</td></tr>
<tr><td>

[validateContext(context)](./MustacheTemplate.validateContext.md)

</td><td>



</td><td>

Validates that a context object has all required variables.

</td></tr>
<tr><td>

[render(context)](./MustacheTemplate.render.md)

</td><td>



</td><td>

Renders the template with the given context.

</td></tr>
<tr><td>

[validateAndRender(context)](./MustacheTemplate.validateAndRender.md)

</td><td>



</td><td>

Validates the context and renders the template if validation passes.

</td></tr>
</tbody></table>
