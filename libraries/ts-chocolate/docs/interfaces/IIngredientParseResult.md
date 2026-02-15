[Home](../README.md) > IIngredientParseResult

# Interface: IIngredientParseResult

Result of parsing AI-generated ingredient JSON.
Contains the validated entity and any notes the AI included.

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

[entity](./IIngredientParseResult.entity.md)

</td><td>

`readonly`

</td><td>

[IngredientEntity](../type-aliases/IngredientEntity.md)

</td><td>

The validated ingredient entity

</td></tr>
<tr><td>

[notes](./IIngredientParseResult.notes.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Notes from the AI about assumptions and estimates, if present

</td></tr>
</tbody></table>
