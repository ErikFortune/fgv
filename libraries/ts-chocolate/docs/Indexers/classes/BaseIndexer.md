[Home](../../README.md) > [Indexers](../README.md) > BaseIndexer

# Class: BaseIndexer

Abstract base class for indexers providing common functionality.

Subclasses must implement:
- `_buildIndex()`: Build the internal index structure
- `_findInternal(config)`: Execute the query against the index

**Implements:** [`IIndexer<TId, TConfig>`](../../interfaces/IIndexer.md)

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

[ChocolateEntityLibrary](../../classes/ChocolateEntityLibrary.md)

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
