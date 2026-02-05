[Home](../README.md) > IEditorContextValidator

# Interface: IEditorContextValidator

Validating wrapper interface for editor context.
Provides methods that accept raw (unknown) input, validate using converters,
and delegate to the base editor context.

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

[create](./IEditorContextValidator.create.md)

</td><td>

`readonly`

</td><td>

(baseId: string, rawEntity: unknown) =&gt; Result&lt;TId&gt;

</td><td>

Create new entity with validation.

</td></tr>
<tr><td>

[update](./IEditorContextValidator.update.md)

</td><td>

`readonly`

</td><td>

(id: TId, rawEntity: unknown) =&gt; Result&lt;T&gt;

</td><td>

Update existing entity with validation.

</td></tr>
<tr><td>

[validate](./IEditorContextValidator.validate.md)

</td><td>

`readonly`

</td><td>

(rawEntity: unknown) =&gt; Result&lt;[IValidationReport](IValidationReport.md)&gt;

</td><td>

Validate raw entity data using converter and semantic validator.

</td></tr>
</tbody></table>
