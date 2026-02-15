[Home](../../README.md) > [AiAssist](../README.md) > IIngredientParseResult

# Interface: IIngredientParseResult

Result of parsing AI-generated ingredient JSON.
Contains the validated entity (with notes embedded) and
a convenience accessor for any AI-specific notes.

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

[IngredientEntity](../../type-aliases/IngredientEntity.md)

</td><td>

The validated ingredient entity (notes included on the entity)

</td></tr>
<tr><td>

[notes](./IIngredientParseResult.notes.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

AI notes extracted for convenience display, if present

</td></tr>
</tbody></table>
