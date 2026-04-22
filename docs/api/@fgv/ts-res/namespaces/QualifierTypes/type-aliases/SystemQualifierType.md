[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [QualifierTypes](../README.md) / SystemQualifierType

# Type Alias: SystemQualifierType

> **SystemQualifierType** = [`LanguageQualifierType`](../classes/LanguageQualifierType.md) \| [`TerritoryQualifierType`](../classes/TerritoryQualifierType.md) \| [`LiteralQualifierType`](../classes/LiteralQualifierType.md)

A discriminated union of all system qualifier types.
This allows TypeScript to properly discriminate between specific qualifier type implementations
and access their specific methods like getConfiguration().
