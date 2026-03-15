[Home](../../README.md) > [Indexers](../README.md) > IIndexer

# Interface: IIndexer

Interface for a single indexer that can find entity IDs matching a query config.

Indexers are templated by:
- TId: The ID type for the entity (e.g., RecipeId)
- TConfig: The specific config type for this indexer

Indexers return only IDs - the orchestrator resolves IDs to entities.

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

[find(config)](./IIndexer.find.md)

</td><td>



</td><td>

Finds IDs matching the given configuration.

</td></tr>
<tr><td>

[invalidate()](./IIndexer.invalidate.md)

</td><td>



</td><td>

Invalidates any cached index data.

</td></tr>
<tr><td>

[warmUp()](./IIndexer.warmUp.md)

</td><td>



</td><td>

Pre-builds the index for efficient queries.

</td></tr>
</tbody></table>
