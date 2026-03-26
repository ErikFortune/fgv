[Home](../README.md) > IHintRegistry

# Interface: IHintRegistry

Interface for managing and coordinating multiple hint providers.

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

[registerProvider(provider)](./IHintRegistry.registerProvider.md)

</td><td>



</td><td>

Registers a new hint provider.

</td></tr>
<tr><td>

[unregisterProvider(techniqueId)](./IHintRegistry.unregisterProvider.md)

</td><td>



</td><td>

Unregisters a hint provider.

</td></tr>
<tr><td>

[getProvider(techniqueId)](./IHintRegistry.getProvider.md)

</td><td>



</td><td>

Gets a specific provider by technique ID.

</td></tr>
<tr><td>

[getProviders(options)](./IHintRegistry.getProviders.md)

</td><td>



</td><td>

Gets all registered providers, optionally filtered by criteria.

</td></tr>
<tr><td>

[generateAllHints(puzzle, state, options)](./IHintRegistry.generateAllHints.md)

</td><td>



</td><td>

Generates hints using all applicable providers.

</td></tr>
<tr><td>

[getBestHint(puzzle, state, options)](./IHintRegistry.getBestHint.md)

</td><td>



</td><td>

Gets the best available hint based on difficulty and confidence.

</td></tr>
<tr><td>

[getRegisteredTechniques()](./IHintRegistry.getRegisteredTechniques.md)

</td><td>



</td><td>

Gets all registered technique IDs.

</td></tr>
</tbody></table>
