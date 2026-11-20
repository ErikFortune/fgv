[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskPromptRequest

# Interface: ITaskPromptRequest

The host's part of a resolve request: everything but the composition request, which the helper
always makes, and the task-context substitution, which it supplies.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-cachestability"></a> `cacheStability?` | `readonly` | `ReadonlyMap`\<`SlotName`, `PromptCacheStability`\> | Call-site stability overrides, passed through to the resolve. |
| <a id="property-chain"></a> `chain` | `readonly` | readonly `ScopeKey`[] | - |
| <a id="property-id"></a> `id` | `readonly` | `PromptId` | - |
| <a id="property-qualifiers"></a> `qualifiers` | `readonly` | `Readonly`\<`Partial`\<`Record`\<`string`, `string`\>\>\> | - |
| <a id="property-substitutions"></a> `substitutions?` | `readonly` | `Readonly`\<`Record`\<`string`, `string` \| `SlotBinding`\>\> | The host's substitutions for its own slots. Naming the task slot here fails the check. |
