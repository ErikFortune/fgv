[Home](../README.md) > IDecoration

# Interface: IDecoration

A resolved view of a decoration with materialized ingredient and procedure references.

This interface provides runtime-layer access to decoration data with:
- Composite identity (`id`, `baseId`) for cross-source references
- Resolved ingredient references (preferred ingredient materialized)
- Resolved procedure references (lazily materialized)
- Ratings, notes, and tags

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

[id](./IDecoration.id.md)

</td><td>

`readonly`

</td><td>

[DecorationId](../type-aliases/DecorationId.md)

</td><td>

The composite decoration ID (e.g., "common.gold-leaf-accent").

</td></tr>
<tr><td>

[baseId](./IDecoration.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseDecorationId](../type-aliases/BaseDecorationId.md)

</td><td>

The base decoration ID within the source.

</td></tr>
<tr><td>

[name](./IDecoration.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Human-readable name

</td></tr>
<tr><td>

[description](./IDecoration.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional description

</td></tr>
<tr><td>

[ingredients](./IDecoration.ingredients.md)

</td><td>

`readonly`

</td><td>

readonly [IResolvedDecorationIngredient](IResolvedDecorationIngredient.md)[]

</td><td>

Resolved ingredients with materialized preferred ingredient

</td></tr>
<tr><td>

[procedures](./IDecoration.procedures.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](IOptionsWithPreferred.md)&lt;IResolvedDecorationProcedure, [ProcedureId](../type-aliases/ProcedureId.md)&gt;

</td><td>

Optional resolved procedures with preferred selection

</td></tr>
<tr><td>

[preferredProcedure](./IDecoration.preferredProcedure.md)

</td><td>

`readonly`

</td><td>

IResolvedDecorationProcedure | undefined

</td><td>

The preferred procedure (or first if no preference is set), or undefined if no procedures

</td></tr>
<tr><td>

[ratings](./IDecoration.ratings.md)

</td><td>

`readonly`

</td><td>

readonly [IDecorationRating](IDecorationRating.md)[]

</td><td>

Optional ratings

</td></tr>
<tr><td>

[tags](./IDecoration.tags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Optional tags

</td></tr>
<tr><td>

[notes](./IDecoration.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional categorized notes

</td></tr>
<tr><td>

[entity](./IDecoration.entity.md)

</td><td>

`readonly`

</td><td>

[IDecorationEntity](IDecorationEntity.md)

</td><td>

Gets the underlying decoration data entity.

</td></tr>
</tbody></table>
