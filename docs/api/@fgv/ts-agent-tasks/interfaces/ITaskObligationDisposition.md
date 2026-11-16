[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskObligationDisposition

# Interface: ITaskObligationDisposition

One obligation a subscription ended without acknowledging it (design § 9, *Retention*): the exact
update id and the host's reason — consumer retired, access removed, explicit abandonment.

## Remarks

A disposition is history, exactly like an acknowledgement: it discharges the obligation for this
subscription alone, consumes the acknowledgement-evidence slot the obligation already reserved,
and is retained for the record's life. An id is in `acknowledged` or `disposed`, never both.
`reason` is bounded by the profile's `maxDispositionReasonBytes`.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-reason"></a> `reason` | `readonly` | `string` |
| <a id="property-updateid"></a> `updateId` | `readonly` | [`UpdateId`](../type-aliases/UpdateId.md) |
