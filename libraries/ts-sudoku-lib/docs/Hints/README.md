[Home](../README.md) > Hints

# Namespace: Hints

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[BaseHintProvider](./classes/BaseHintProvider.md)

</td><td>

Abstract base class providing common functionality for hint providers.

</td></tr>
<tr><td>

[HintRegistry](./classes/HintRegistry.md)

</td><td>

Implementation of the hint registry that manages and coordinates multiple hint providers.

</td></tr>
<tr><td>

[NakedSinglesProvider](./classes/NakedSinglesProvider.md)

</td><td>

Hint provider for the Naked Singles technique.

</td></tr>
<tr><td>

[HiddenSinglesProvider](./classes/HiddenSinglesProvider.md)

</td><td>

Hint provider for the Hidden Singles technique.

</td></tr>
<tr><td>

[ExplanationRegistry](./classes/ExplanationRegistry.md)

</td><td>

Registry for managing hint explanation providers.

</td></tr>
<tr><td>

[ExplanationFormatter](./classes/ExplanationFormatter.md)

</td><td>

Utility class for formatting and displaying hint explanations.

</td></tr>
<tr><td>

[EducationalContent](./classes/EducationalContent.md)

</td><td>

Educational content manager for Sudoku solving techniques.

</td></tr>
<tr><td>

[DefaultHintApplicator](./classes/DefaultHintApplicator.md)

</td><td>

Default hint applicator that converts hints to cell state updates.

</td></tr>
<tr><td>

[HintSystem](./classes/HintSystem.md)

</td><td>

Main hint system that provides comprehensive hint generation and management.

</td></tr>
<tr><td>

[PuzzleSessionHints](./classes/PuzzleSessionHints.md)

</td><td>

Wrapper class that integrates hint functionality with PuzzleSession.

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ICellAction](./interfaces/ICellAction.md)

</td><td>

Describes an action to be taken on a specific cell as part of a hint.

</td></tr>
<tr><td>

[IRelevantCells](./interfaces/IRelevantCells.md)

</td><td>

Information about the cells that are relevant to understanding a hint.

</td></tr>
<tr><td>

[IHintExplanation](./interfaces/IHintExplanation.md)

</td><td>

A hint explanation at a specific level of detail.

</td></tr>
<tr><td>

[IHint](./interfaces/IHint.md)

</td><td>

A complete hint with all necessary information for display and application.

</td></tr>
<tr><td>

[IHintGenerationOptions](./interfaces/IHintGenerationOptions.md)

</td><td>

Configuration options for hint generation.

</td></tr>
<tr><td>

[IHintProvider](./interfaces/IHintProvider.md)

</td><td>

Interface for classes that can provide hints using a specific solving technique.

</td></tr>
<tr><td>

[IHintRegistry](./interfaces/IHintRegistry.md)

</td><td>

Interface for managing and coordinating multiple hint providers.

</td></tr>
<tr><td>

[IHintExplanationProvider](./interfaces/IHintExplanationProvider.md)

</td><td>

Interface for hint explanation generation and formatting.

</td></tr>
<tr><td>

[IHintApplicator](./interfaces/IHintApplicator.md)

</td><td>

Interface for hint application and validation.

</td></tr>
<tr><td>

[IBaseHintProviderConfig](./interfaces/IBaseHintProviderConfig.md)

</td><td>

Configuration for a Hints.BaseHintProvider | BaseHintProvider instance.

</td></tr>
<tr><td>

[IHintSystemConfig](./interfaces/IHintSystemConfig.md)

</td><td>

Configuration options for the hint system.

</td></tr>
<tr><td>

[IPuzzleSessionHintsConfig](./interfaces/IPuzzleSessionHintsConfig.md)

</td><td>

Configuration options for the PuzzleSessionHints integration.

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[TechniqueId](./type-aliases/TechniqueId.md)

</td><td>

Nominal identifier for a hint generation technique.

</td></tr>
<tr><td>

[ConfidenceLevel](./type-aliases/ConfidenceLevel.md)

</td><td>

Confidence level for a generated hint, ranging from 1 (low) to 5 (high).

</td></tr>
<tr><td>

[CellAction](./type-aliases/CellAction.md)

</td><td>

The type of action that should be taken on a cell as part of a hint.

</td></tr>
<tr><td>

[ExplanationLevel](./type-aliases/ExplanationLevel.md)

</td><td>

The level of detail for hint explanations.

</td></tr>
<tr><td>

[DifficultyLevel](./type-aliases/DifficultyLevel.md)

</td><td>

Standard difficulty classifications for Sudoku techniques.

</td></tr>
</tbody></table>

## Variables

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[TechniqueIds](./variables/TechniqueIds.md)

</td><td>

Standard technique identifiers for built-in solving techniques.

</td></tr>
<tr><td>

[ConfidenceLevels](./variables/ConfidenceLevels.md)

</td><td>

Standard confidence levels as branded types.

</td></tr>
</tbody></table>
