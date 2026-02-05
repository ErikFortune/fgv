[Home](../../README.md) > [LibraryRuntime](../README.md) > IngredientIndexerOrchestrator

# Class: IngredientIndexerOrchestrator

Orchestrator for ingredient indexers.

Encapsulates all ingredient-related indexers and provides a unified
find interface. The resolver is provided by the RuntimeContext
to enable ID-to-entity resolution.

**Extends:** [`BaseIndexerOrchestrator<AnyIngredient, IngredientId>`](../../classes/BaseIndexerOrchestrator.md)

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

Creates a new IngredientIndexerOrchestrator.

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

[ChocolateLibrary](../../classes/ChocolateLibrary.md)

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

[find(spec, options)](./IngredientIndexerOrchestrator.find.md)

</td><td>



</td><td>

Finds ingredients matching a query specification.

</td></tr>
<tr><td>

[convertConfig(json)](./IngredientIndexerOrchestrator.convertConfig.md)

</td><td>



</td><td>

Converts a JSON query specification to a typed config.

</td></tr>
<tr><td>

[invalidate()](./IngredientIndexerOrchestrator.invalidate.md)

</td><td>



</td><td>

Invalidates all indexer caches.

</td></tr>
<tr><td>

[warmUp()](./IngredientIndexerOrchestrator.warmUp.md)

</td><td>



</td><td>

Pre-warms all indexers.

</td></tr>
</tbody></table>
