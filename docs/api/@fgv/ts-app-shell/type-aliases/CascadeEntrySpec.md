[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / CascadeEntrySpec

# Type Alias: CascadeEntrySpec\<TEntry\>

> **CascadeEntrySpec**\<`TEntry`\> = `Omit`\<`TEntry`, `"mode"` \| `"origin"`\> & `object`

Partial cascade entry for operations that set mode and origin automatically.

## Type Declaration

| Name | Type |
| ------ | ------ |
| `mode?` | [`CascadeColumnMode`](CascadeColumnMode.md) |

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TEntry` *extends* [`ICascadeEntryBase`](../interfaces/ICascadeEntryBase.md) | [`ICascadeEntryBase`](../interfaces/ICascadeEntryBase.md) |
