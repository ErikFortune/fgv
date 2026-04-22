[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / useCascadeOps

# Function: useCascadeOps()

> **useCascadeOps**\<`TEntry`\>(`cascadeStack`, `squashCascade`): [`ICascadeOps`](../interfaces/ICascadeOps.md)\<`TEntry`\>

Hook providing semantic cascade operations.

Takes the cascade stack and a squash function as parameters, making it
independent of any specific state management solution. Domain-specific
applications typically provide a convenience wrapper that reads these
values from their own store.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `TEntry` *extends* [`ICascadeEntryBase`](../interfaces/ICascadeEntryBase.md) | The cascade entry type. Inferred from `cascadeStack`. |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `cascadeStack` | readonly `TEntry`[] |
| `squashCascade` | (`entries`) => `void` |

## Returns

[`ICascadeOps`](../interfaces/ICascadeOps.md)\<`TEntry`\>
