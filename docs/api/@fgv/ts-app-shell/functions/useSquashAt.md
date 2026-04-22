[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / useSquashAt

# Function: useSquashAt()

> **useSquashAt**(`cascadeStack`, `squashCascade`): (`depth`, `entry`) => `void`

Returns a depth-aware squash helper used by cascade views.

Keeps stack entries up to and including `depth`, then appends `entry`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `cascadeStack` | readonly [`ICascadeEntryBase`](../interfaces/ICascadeEntryBase.md)[] |
| `squashCascade` | (`entries`) => `void` |

## Returns

> (`depth`, `entry`): `void`

### Parameters

| Parameter | Type |
| ------ | ------ |
| `depth` | `number` |
| `entry` | [`ICascadeEntryBase`](../interfaces/ICascadeEntryBase.md) |

### Returns

`void`
