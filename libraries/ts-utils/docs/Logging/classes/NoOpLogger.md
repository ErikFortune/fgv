[Home](../../README.md) > [Logging](../README.md) > NoOpLogger

# Class: NoOpLogger

A no-op Logging.LoggerBase | LoggerBase that does not log anything.

**Extends:** [`LoggerBase`](../../classes/LoggerBase.md)

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

`constructor(logLevel)`

</td><td>



</td><td>

Creates a new no-op logger.

</td></tr>
</tbody></table>

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

[logLevel](./LoggerBase.logLevel.md)

</td><td>



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

[detail(message, parameters)](./LoggerBase.detail.md)

</td><td>



</td><td>

Logs a detail message.

</td></tr>
<tr><td>

[info(message, parameters)](./LoggerBase.info.md)

</td><td>



</td><td>

Logs an info message.

</td></tr>
<tr><td>

[warn(message, parameters)](./LoggerBase.warn.md)

</td><td>



</td><td>

Logs a warning message.

</td></tr>
<tr><td>

[error(message, parameters)](./LoggerBase.error.md)

</td><td>



</td><td>

Logs an error message.

</td></tr>
<tr><td>

[errorWithDetail(message, detail)](./LoggerBase.errorWithDetail.md)

</td><td>



</td><td>

Logs a short error summary at `error` level, then emits `detail` at `detail` level.

</td></tr>
<tr><td>

[warnWithDetail(message, detail)](./LoggerBase.warnWithDetail.md)

</td><td>



</td><td>

Logs a short warning summary at `warning` level, then emits `detail` at `detail` level.

</td></tr>
<tr><td>

[log(level, message, parameters)](./LoggerBase.log.md)

</td><td>



</td><td>

Logs a message at the given level.

</td></tr>
<tr><td>

[_format(message, parameters)](./LoggerBase._format.md)

</td><td>



</td><td>

Formats a message and parameters into a string.

</td></tr>
<tr><td>

[_suppressLog(__level, __message, __parameters)](./LoggerBase._suppressLog.md)

</td><td>



</td><td>

Inner method called for suppressed log messages.

</td></tr>
</tbody></table>
