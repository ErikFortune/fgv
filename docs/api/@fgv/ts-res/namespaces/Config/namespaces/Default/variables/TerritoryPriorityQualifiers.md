[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Config](../../../README.md) / [Default](../README.md) / TerritoryPriorityQualifiers

# Variable: TerritoryPriorityQualifiers

> `const` **TerritoryPriorityQualifiers**: `ReadonlyArray`\<[`IQualifierDecl`](../../../../Qualifiers/interfaces/IQualifierDecl.md)\>

Qualifier definitions in which territory is the primary qualifier, with
language as a secondary qualifier.

## Remarks

The default qualifiers are:
- currentTerritory(token: geo): territory qualifier, priority 850
- language(token: lang): language qualifier, priority 800
