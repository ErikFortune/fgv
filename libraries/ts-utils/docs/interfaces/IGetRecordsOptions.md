[Home](../README.md) > IGetRecordsOptions

# Interface: IGetRecordsOptions

Options for Logging.RetainingLogger.getRecords | RetainingLogger.getRecords.

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[minLevel](./IGetRecordsOptions.minLevel.md)

</td><td>

`readonly`

</td><td>

[ReporterLogLevel](../type-aliases/ReporterLogLevel.md)

</td><td>

If supplied, only records whose level would be emitted at this threshold

</td></tr>
<tr><td>

[sinceSeq](./IGetRecordsOptions.sinceSeq.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

If supplied, only records with `seq > sinceSeq` are returned, enabling

</td></tr>
<tr><td>

[limit](./IGetRecordsOptions.limit.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

If supplied, returns at most this many records — the most recent N (tail),

</td></tr>
</tbody></table>
