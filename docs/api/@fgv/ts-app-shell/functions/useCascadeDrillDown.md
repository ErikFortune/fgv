[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / useCascadeDrillDown

# Function: useCascadeDrillDown()

> **useCascadeDrillDown**(`cascadeStack`, `squashCascade`, `squashAt`): (`depth`, `entityType`, `entityId`, `extra?`) => `void`

Returns a shared drill-down toggle helper for cascade columns.

If the target entry is already immediately to the right of `depth`, it collapses
back to `depth`. Otherwise, it appends a new view entry at `depth + 1`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `cascadeStack` | readonly [`ICascadeEntryBase`](../interfaces/ICascadeEntryBase.md)[] |
| `squashCascade` | (`entries`) => `void` |
| `squashAt` | (`depth`, `entry`) => `void` |

## Returns

> (`depth`, `entityType`, `entityId`, `extra?`): `void`

### Parameters

| Parameter | Type |
| ------ | ------ |
| `depth` | `number` |
| `entityType` | `string` |
| `entityId` | `string` |
| `extra?` | `Partial`\<[`ICascadeEntryBase`](../interfaces/ICascadeEntryBase.md)\> |

### Returns

`void`
