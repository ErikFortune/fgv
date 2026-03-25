[Home](../../README.md) > [Hints](../README.md) > HintSystem

# Class: HintSystem

Main hint system that provides comprehensive hint generation and management.

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

`constructor(registry, applicator, config)`

</td><td>



</td><td>

Creates a new HintSystem instance.

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

[registry](./HintSystem.registry.md)

</td><td>

`readonly`

</td><td>

[IHintRegistry](../../interfaces/IHintRegistry.md)

</td><td>

Gets the hint registry.

</td></tr>
<tr><td>

[applicator](./HintSystem.applicator.md)

</td><td>

`readonly`

</td><td>

[IHintApplicator](../../interfaces/IHintApplicator.md)

</td><td>

Gets the hint applicator.

</td></tr>
<tr><td>

[config](./HintSystem.config.md)

</td><td>

`readonly`

</td><td>

[IHintSystemConfig](../../interfaces/IHintSystemConfig.md)

</td><td>

Gets the system configuration.

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

[create(config)](./HintSystem.create.md)

</td><td>

`static`

</td><td>

Creates a new HintSystem with default providers and configuration.

</td></tr>
<tr><td>

[generateHints(puzzle, state, options)](./HintSystem.generateHints.md)

</td><td>



</td><td>

Generates all available hints for the current puzzle state.

</td></tr>
<tr><td>

[getBestHint(puzzle, state, options)](./HintSystem.getBestHint.md)

</td><td>



</td><td>

Gets the best available hint for the current puzzle state.

</td></tr>
<tr><td>

[applyHint(hint, puzzle, state)](./HintSystem.applyHint.md)

</td><td>



</td><td>

Applies a hint to generate cell state updates.

</td></tr>
<tr><td>

[validateHint(hint, puzzle, state)](./HintSystem.validateHint.md)

</td><td>



</td><td>

Validates that a hint can be applied to the current state.

</td></tr>
<tr><td>

[formatHintExplanation(hint, level)](./HintSystem.formatHintExplanation.md)

</td><td>



</td><td>

Formats a hint explanation for display.

</td></tr>
<tr><td>

[getSystemSummary()](./HintSystem.getSystemSummary.md)

</td><td>



</td><td>

Gets a summary of the hint system capabilities.

</td></tr>
<tr><td>

[hasHints(puzzle, state)](./HintSystem.hasHints.md)

</td><td>



</td><td>

Checks if the puzzle state has any available hints.

</td></tr>
<tr><td>

[getHintStatistics(puzzle, state)](./HintSystem.getHintStatistics.md)

</td><td>



</td><td>

Gets statistics about available hints for the current state.

</td></tr>
</tbody></table>
