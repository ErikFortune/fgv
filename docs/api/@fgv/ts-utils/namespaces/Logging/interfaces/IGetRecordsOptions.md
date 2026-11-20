[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-utils](../../../README.md) / [Logging](../README.md) / IGetRecordsOptions

# Interface: IGetRecordsOptions

Options for [RetainingLogger.getRecords](../classes/RetainingLogger.md#getrecords).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-limit"></a> `limit?` | `readonly` | `number` | If supplied, returns at most this many records — the most recent N (tail), still ordered oldest-first. |
| <a id="property-minlevel"></a> `minLevel?` | `readonly` | [`ReporterLogLevel`](../type-aliases/ReporterLogLevel.md) | If supplied, only records whose level would be emitted at this threshold (per [shouldLog](../functions/shouldLog.md)) are returned. |
| <a id="property-sinceseq"></a> `sinceSeq?` | `readonly` | `number` | If supplied, only records with `seq > sinceSeq` are returned, enabling incremental paging from a previously-held cursor. |
