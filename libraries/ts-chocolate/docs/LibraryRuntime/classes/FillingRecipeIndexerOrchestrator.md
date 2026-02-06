[Home](../../README.md) > [LibraryRuntime](../README.md) > FillingRecipeIndexerOrchestrator

# Class: FillingRecipeIndexerOrchestrator

Orchestrator for filling recipe indexers.

Encapsulates all filling recipe-related indexers and provides a unified
find interface. The resolver is provided by the RuntimeContext
to enable ID-to-entity resolution.

**Extends:** [`BaseIndexerOrchestrator<FillingRecipe, FillingId>`](../../classes/BaseIndexerOrchestrator.md)

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

`constructor(library, resolver)`

</td><td>



</td><td>

Creates a new FillingRecipeIndexerOrchestrator.

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

[library](./BaseIndexerOrchestrator.library.md)

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

[find(spec, options)](./FillingRecipeIndexerOrchestrator.find.md)

</td><td>



</td><td>

Finds recipes matching a query specification.

</td></tr>
<tr><td>

[convertConfig(json)](./FillingRecipeIndexerOrchestrator.convertConfig.md)

</td><td>



</td><td>

Converts a JSON query specification to a typed config.

</td></tr>
<tr><td>

[invalidate()](./FillingRecipeIndexerOrchestrator.invalidate.md)

</td><td>



</td><td>

Invalidates all indexer caches.

</td></tr>
<tr><td>

[warmUp()](./FillingRecipeIndexerOrchestrator.warmUp.md)

</td><td>



</td><td>

Pre-warms all indexers.

</td></tr>
</tbody></table>
