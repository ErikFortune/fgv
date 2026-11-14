[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskDeliveryPage

# Interface: ITaskDeliveryPage

A page of the updates a bound delivery is owed and may currently see, projected.

## Remarks

`withheld` counts owed updates on this page that the principal may not currently see: they stay
owed — revocation blocks delivery, it never acknowledges — and they are not described.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-nextcursor"></a> `nextCursor?` | `readonly` | [`PageCursor`](../type-aliases/PageCursor.md) |
| <a id="property-updates"></a> `updates` | `readonly` | readonly [`ITaskUpdate`](ITaskUpdate.md)[] |
| <a id="property-withheld"></a> `withheld` | `readonly` | `number` |
