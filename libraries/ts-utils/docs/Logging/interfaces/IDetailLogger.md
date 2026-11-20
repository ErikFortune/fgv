[Home](../../README.md) > [Logging](../README.md) > IDetailLogger

# Interface: IDetailLogger

Extended logger interface that supports logging a short summary message at a
primary level (error/warn) while emitting the full detail at `detail` level.

The detail is suppressed by default (requires log level `'detail'` or `'all'`),
keeping the primary log clean while preserving the full context for debugging.

**Extends:** [`ILogger`](../../interfaces/ILogger.md)

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

[logLevel](./ILogger.logLevel.md)

</td><td>

`readonly`

</td><td>

[ReporterLogLevel](../../type-aliases/ReporterLogLevel.md)

</td><td>

The level of logging to be used.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[errorWithDetail(message, detail)](./IDetailLogger.errorWithDetail.md)

</td><td>



</td><td>

Logs a short error summary at `error` level, then emits `detail` at `detail` level.

</td></tr>
<tr><td>

[warnWithDetail(message, detail)](./IDetailLogger.warnWithDetail.md)

</td><td>



</td><td>

Logs a short warning summary at `warning` level, then emits `detail` at `detail` level.

</td></tr>
<tr><td>

[log(level, message, parameters)](./ILogger.log.md)

</td><td>



</td><td>

Logs a message at the given level.

</td></tr>
<tr><td>

[detail(message, parameters)](./ILogger.detail.md)

</td><td>



</td><td>

Logs a detail message.

</td></tr>
<tr><td>

[info(message, parameters)](./ILogger.info.md)

</td><td>



</td><td>

Logs an info message.

</td></tr>
<tr><td>

[warn(message, parameters)](./ILogger.warn.md)

</td><td>



</td><td>

Logs a warning message.

</td></tr>
<tr><td>

[error(message, parameters)](./ILogger.error.md)

</td><td>



</td><td>

Logs an error message.

</td></tr>
</tbody></table>
