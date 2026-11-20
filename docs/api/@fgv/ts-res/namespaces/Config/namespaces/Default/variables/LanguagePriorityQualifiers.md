[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Config](../../../README.md) / [Default](../README.md) / LanguagePriorityQualifiers

# Variable: LanguagePriorityQualifiers

> `const` **LanguagePriorityQualifiers**: `ReadonlyArray`\<[`IQualifierDecl`](../../../../Qualifiers/interfaces/IQualifierDecl.md)\>

Qualifier definitions in which language is the primary qualifier, with
territory as a secondary qualifier.

## Remarks

The default qualifiers are:
- language(token: lang): language qualifier, priority 850
- currentTerritory(token: geo): territory qualifier, priority 800
