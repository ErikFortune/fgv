[Home](../../README.md) > [Editing](../README.md) > EditorContextValidator

# Class: EditorContextValidator

Validating wrapper for EditorContext.
Provides methods that accept raw (unknown) input, validate using converters,
and delegate to the base editor context.
Follows the ResultMapValidator pattern from ts-utils.

**Implements:** [`IEditorContextValidator<T, TBaseId, TId>`](../../interfaces/IEditorContextValidator.md)

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

`constructor(params)`

</td><td>



</td><td>

Create an editor context validator.

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

[create(baseId, rawEntity)](./EditorContextValidator.create.md)

</td><td>



</td><td>

Create new entity with validation.

</td></tr>
<tr><td>

[update(id, rawEntity)](./EditorContextValidator.update.md)

</td><td>



</td><td>

Update existing entity with validation.

</td></tr>
<tr><td>

[validate(rawEntity)](./EditorContextValidator.validate.md)

</td><td>



</td><td>

Validate raw entity data using converter and semantic validator.

</td></tr>
</tbody></table>
