[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Runtime](../README.md) / DecisionResolutionResult

# Type Alias: DecisionResolutionResult

> **DecisionResolutionResult** = \{ `success`: `false`; \} \| \{ `defaultInstanceIndices`: `ReadonlyArray`\<`number`\>; `instanceIndices`: `ReadonlyArray`\<`number`\>; `success`: `true`; \}

Represents the cached result of resolving a decision.
Contains either a failure indicator or a list of instance indices for matching condition sets,
ordered by condition set priority.
