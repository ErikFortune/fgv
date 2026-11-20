[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / isTemporalIdentityCodec

# Function: isTemporalIdentityCodec()

> **isTemporalIdentityCodec**(`codec`): `codec is ITemporalIdentityCodec`

Narrow an [IIdentityCodec](../interfaces/IIdentityCodec.md) to [ITemporalIdentityCodec](../interfaces/ITemporalIdentityCodec.md) by probing
for the versioned methods. Used by the store when an `encode` result reports
`isVersioned: true`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `codec` | [`IIdentityCodec`](../interfaces/IIdentityCodec.md) |

## Returns

`codec is ITemporalIdentityCodec`
