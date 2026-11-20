[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskSourceCommitRequest

# Interface: ITaskSourceCommitRequest

A replacement of one broker source-checkpoint record.

## Remarks

`expectedRecordRevision` is `0` to create the record. A cursor is committed only after every
observation of the page it follows has committed; the repository cannot check that ordering —
it is the caller's — but it does refuse a stale revision, so two passes cannot interleave.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-cursor"></a> `cursor?` | `readonly` | `string` | The source cursor the next pass resumes from; absent starts the next pass from the beginning. |
| <a id="property-expectedrecordrevision"></a> `expectedRecordRevision` | `readonly` | `number` | The record revision this commit replaces (`0` creates the record). |
| <a id="property-history"></a> `history` | `readonly` | [`SourceHistoryContract`](../type-aliases/SourceHistoryContract.md) | The source's history contract; it must match the record's once written. |
| <a id="property-pages"></a> `pages` | `readonly` | `number` | The running count of pages committed against this source, as of this commit. |
| <a id="property-sourceid"></a> `sourceId` | `readonly` | `string` | The source whose checkpoint record this writes. |
