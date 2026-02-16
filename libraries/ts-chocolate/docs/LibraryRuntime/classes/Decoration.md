[Home](../../README.md) > [LibraryRuntime](../README.md) > Decoration

# Class: Decoration

A resolved view of a decoration with materialized ingredient references.

Decoration wraps a data-layer IDecorationEntity and provides:
- Composite identity (DecorationId) for cross-source references
- Resolved ingredient references (preferred ingredient materialized)
- Resolved procedure references (lazily materialized)
- Passthrough for ratings, notes, and tags

**Implements:** [`IDecoration`](../../interfaces/IDecoration.md)

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

[id](./Decoration.id.md)

</td><td>

`readonly`

</td><td>

[DecorationId](../../type-aliases/DecorationId.md)

</td><td>

The composite decoration ID (e.g., "common.gold-leaf-accent")

</td></tr>
<tr><td>

[baseId](./Decoration.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseDecorationId](../../type-aliases/BaseDecorationId.md)

</td><td>

The base decoration ID within the source

</td></tr>
<tr><td>

[name](./Decoration.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Human-readable name of the decoration

</td></tr>
<tr><td>

[description](./Decoration.description.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

Optional description

</td></tr>
<tr><td>

[ingredients](./Decoration.ingredients.md)

</td><td>

`readonly`

</td><td>

readonly [IResolvedDecorationIngredient](../../interfaces/IResolvedDecorationIngredient.md)[]

</td><td>

Resolved ingredients with materialized preferred ingredient.

</td></tr>
<tr><td>

[procedures](./Decoration.procedures.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;IResolvedDecorationProcedure, [ProcedureId](../../type-aliases/ProcedureId.md)&gt; | undefined

</td><td>

Optional resolved procedures with preferred selection.

</td></tr>
<tr><td>

[preferredProcedure](./Decoration.preferredProcedure.md)

</td><td>

`readonly`

</td><td>

IResolvedDecorationProcedure | undefined

</td><td>

The preferred procedure (or first if no preference is set), or undefined if no procedures.

</td></tr>
<tr><td>

[ratings](./Decoration.ratings.md)

</td><td>

`readonly`

</td><td>

readonly [IDecorationRating](../../interfaces/IDecorationRating.md)[] | undefined

</td><td>

Optional ratings

</td></tr>
<tr><td>

[tags](./Decoration.tags.md)

</td><td>

`readonly`

</td><td>

readonly string[] | undefined

</td><td>

Optional tags

</td></tr>
<tr><td>

[notes](./Decoration.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[] | undefined

</td><td>

Optional categorized notes

</td></tr>
<tr><td>

[entity](./Decoration.entity.md)

</td><td>

`readonly`

</td><td>

[IDecorationEntity](../../interfaces/IDecorationEntity.md)

</td><td>

Gets the underlying decoration data entity

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

[create(context, id, entity)](./Decoration.create.md)

</td><td>

`static`

</td><td>

Factory method for creating a Decoration.

</td></tr>
</tbody></table>
