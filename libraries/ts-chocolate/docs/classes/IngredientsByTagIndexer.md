[Home](../README.md) > IngredientsByTagIndexer

# Class: IngredientsByTagIndexer

Indexer that finds ingredients with a specific tag.
Tag matching is case-insensitive.

**Extends:** [`BaseIndexer<IngredientId, IIngredientsByTagConfig>`](BaseIndexer.md)

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

Creates a new IngredientsByTagIndexer.

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

[getAllTags()](./IngredientsByTagIndexer.getAllTags.md)

</td><td>



</td><td>

Gets all unique tags used across ingredients.

</td></tr>
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
