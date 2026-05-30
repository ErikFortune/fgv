[Home](../README.md) > ConsoleUserLogger

# Class: ConsoleUserLogger

Console-based user logger that extends diagnostic logging with success method.

**Extends:** `LoggerBase`

**Implements:** [`IUserLogger`](../interfaces/IUserLogger.md)

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

Creates a new console user logger.

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

[logLevel](./ConsoleUserLogger.logLevel.md)

</td><td>



</td><td>

ReporterLogLevel

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

[success(message, parameters)](./ConsoleUserLogger.success.md)

</td><td>



</td><td>

Logs a success message for user feedback.

</td></tr>
<tr><td>

[detail(message, parameters)](./ConsoleUserLogger.detail.md)

</td><td>



</td><td>

Logs a detail message.

</td></tr>
<tr><td>

[info(message, parameters)](./ConsoleUserLogger.info.md)

</td><td>



</td><td>

Logs an info message.

</td></tr>
<tr><td>

[warn(message, parameters)](./ConsoleUserLogger.warn.md)

</td><td>



</td><td>

Logs a warning message.

</td></tr>
<tr><td>

[error(message, parameters)](./ConsoleUserLogger.error.md)

</td><td>



</td><td>

Logs an error message.

</td></tr>
<tr><td>

[errorWithDetail(message, detail)](./ConsoleUserLogger.errorWithDetail.md)

</td><td>



</td><td>

Logs a short error summary at `error` level, then emits `detail` at `detail` level.

</td></tr>
<tr><td>

[warnWithDetail(message, detail)](./ConsoleUserLogger.warnWithDetail.md)

</td><td>



</td><td>

Logs a short warning summary at `warning` level, then emits `detail` at `detail` level.

</td></tr>
<tr><td>

[log(level, message, parameters)](./ConsoleUserLogger.log.md)

</td><td>



</td><td>

Logs a message at the given level.

</td></tr>
<tr><td>

[_format(message, parameters)](./ConsoleUserLogger._format.md)

</td><td>



</td><td>

Formats a message and parameters into a string.

</td></tr>
<tr><td>

[_suppressLog(__level, __message, __parameters)](./ConsoleUserLogger._suppressLog.md)

</td><td>



</td><td>

Inner method called for suppressed log messages.

</td></tr>
</tbody></table>
