[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / ITemporalBlock

# Interface: ITemporalBlock

Optional bi-temporal validity block on an envelope. Present only on
temporal kinds; absent = zero cost for atemporal kinds.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-invalid_at"></a> `invalid_at?` | `readonly` | `number` \| `null` | World-truth validity end (epoch ms). `null` = still valid. |
| <a id="property-valid_at"></a> `valid_at?` | `readonly` | `number` | World-truth validity start (epoch ms). |
