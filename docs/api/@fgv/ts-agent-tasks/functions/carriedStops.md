[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / carriedStops

# Function: carriedStops()

> **carriedStops**(`record`): `object`

The stops a replacement of a record carries forward. Every draft built from a record keeps its
intents — storage refuses a replacement that drops one — so every draft builder spreads this.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | \{ `stops?`: readonly [`IStopIntent`](../interfaces/IStopIntent.md)[]; \} |
| `record.stops?` | readonly [`IStopIntent`](../interfaces/IStopIntent.md)[] |

## Returns

`object`

| Name | Type |
| ------ | ------ |
| `stops?` | readonly [`IStopIntent`](../interfaces/IStopIntent.md)[] |
