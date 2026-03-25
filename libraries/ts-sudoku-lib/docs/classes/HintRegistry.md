[Home](../README.md) > HintRegistry

# Class: HintRegistry

Implementation of the hint registry that manages and coordinates multiple hint providers.

**Implements:** [`IHintRegistry`](../interfaces/IHintRegistry.md)

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

`constructor()`

</td><td>



</td><td>

Creates a new HintRegistry instance.

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

[providerCount](./HintRegistry.providerCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Gets the number of registered providers.

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

[create(providers)](./HintRegistry.create.md)

</td><td>

`static`

</td><td>

Creates a new HintRegistry with the specified providers pre-registered.

</td></tr>
<tr><td>

[registerProvider(provider)](./HintRegistry.registerProvider.md)

</td><td>



</td><td>

Registers a new hint provider.

</td></tr>
<tr><td>

[unregisterProvider(techniqueId)](./HintRegistry.unregisterProvider.md)

</td><td>



</td><td>

Unregisters a hint provider.

</td></tr>
<tr><td>

[getProvider(techniqueId)](./HintRegistry.getProvider.md)

</td><td>



</td><td>

Gets a specific provider by technique ID.

</td></tr>
<tr><td>

[getProviders(options)](./HintRegistry.getProviders.md)

</td><td>



</td><td>

Gets all registered providers, optionally filtered by criteria.

</td></tr>
<tr><td>

[generateAllHints(puzzle, state, options)](./HintRegistry.generateAllHints.md)

</td><td>



</td><td>

Generates hints using all applicable providers.

</td></tr>
<tr><td>

[getBestHint(puzzle, state, options)](./HintRegistry.getBestHint.md)

</td><td>



</td><td>

Gets the best available hint based on difficulty and confidence.

</td></tr>
<tr><td>

[getRegisteredTechniques()](./HintRegistry.getRegisteredTechniques.md)

</td><td>



</td><td>

Gets all registered technique IDs.

</td></tr>
<tr><td>

[hasProvider(techniqueId)](./HintRegistry.hasProvider.md)

</td><td>



</td><td>

Checks if a specific technique is registered.

</td></tr>
<tr><td>

[clear()](./HintRegistry.clear.md)

</td><td>



</td><td>

Clears all registered providers.

</td></tr>
<tr><td>

[getProvidersByDifficulty()](./HintRegistry.getProvidersByDifficulty.md)

</td><td>



</td><td>

Gets providers grouped by difficulty level.

</td></tr>
</tbody></table>
