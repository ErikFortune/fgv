[Home](../README.md) > FillingRecipesByIngredientIndexer

# Class: FillingRecipesByIngredientIndexer

Indexer that finds recipes using a specific ingredient.

Supports filtering by:
- Primary usage only
- Alternate usage only
- Any usage

**Extends:** [`BaseIndexer<FillingId, IFillingRecipesByIngredientConfig>`](BaseIndexer.md)

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

`constructor(library)`

</td><td>



</td><td>

Creates a new FillingRecipesByIngredientIndexer.

</td></tr>
</tbody></table>

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

[library](./BaseIndexer.library.md)

</td><td>

`readonly`

</td><td>

[ChocolateLibrary](ChocolateLibrary.md)

</td><td>

The chocolate library being indexed.

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

[find(config)](./BaseIndexer.find.md)

</td><td>



</td><td>

Finds IDs matching the given configuration.

</td></tr>
<tr><td>

[invalidate()](./BaseIndexer.invalidate.md)

</td><td>



</td><td>

Invalidates any cached index data.

</td></tr>
<tr><td>

[warmUp()](./BaseIndexer.warmUp.md)

</td><td>



</td><td>

Pre-builds the index for efficient queries.

</td></tr>
</tbody></table>
