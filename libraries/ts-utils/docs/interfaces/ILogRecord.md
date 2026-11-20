[Home](../README.md) > ILogRecord

# Interface: ILogRecord

A retained log record. Preserves the level and an ordering cursor so consumers
can filter by severity and page incrementally.

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

[seq](./ILogRecord.seq.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Monotonic 1-based sequence number, stable across ring eviction.

</td></tr>
<tr><td>

[timestamp](./ILogRecord.timestamp.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Milliseconds since epoch when the record was logged (from the injected clock).

</td></tr>
<tr><td>

[level](./ILogRecord.level.md)

</td><td>

`readonly`

</td><td>

[MessageLogLevel](../type-aliases/MessageLogLevel.md)

</td><td>

The level the record was logged at.

</td></tr>
<tr><td>

[message](./ILogRecord.message.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The formatted message (same formatting Logging.LoggerBase._format | LoggerBase._format produces).

</td></tr>
<tr><td>

[args](./ILogRecord.args.md)

</td><td>

`readonly`

</td><td>

readonly unknown[]

</td><td>

The raw structured inputs `[message, ...parameters]` before formatting.

</td></tr>
</tbody></table>
