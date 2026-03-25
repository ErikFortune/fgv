[Home](../../README.md) > [ObservabilityTools](../README.md) > NoOpUserLogger

# Class: NoOpUserLogger

No-op user logger that suppresses all output.

**Extends:** `LoggerBase`

**Implements:** [`IUserLogger`](../../interfaces/IUserLogger.md)

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

Creates a new no-op user logger.

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

[logLevel](./NoOpUserLogger.logLevel.md)

</td><td>



</td><td>

ReporterLogLevel

</td><td>

Logging.ILogger.logLevel

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

[success(message, parameters)](./NoOpUserLogger.success.md)

</td><td>



</td><td>

Logs a success message for user feedback.

</td></tr>
<tr><td>

[detail(message, parameters)](./NoOpUserLogger.detail.md)

</td><td>



</td><td>

Logging.ILogger.detail

</td></tr>
<tr><td>

[info(message, parameters)](./NoOpUserLogger.info.md)

</td><td>



</td><td>

Logging.ILogger.info

</td></tr>
<tr><td>

[warn(message, parameters)](./NoOpUserLogger.warn.md)

</td><td>



</td><td>

Logging.ILogger.warn

</td></tr>
<tr><td>

[error(message, parameters)](./NoOpUserLogger.error.md)

</td><td>



</td><td>

Logging.ILogger.error

</td></tr>
<tr><td>

[errorWithDetail(message, detail)](./NoOpUserLogger.errorWithDetail.md)

</td><td>



</td><td>

Logging.IDetailLogger.errorWithDetail

</td></tr>
<tr><td>

[warnWithDetail(message, detail)](./NoOpUserLogger.warnWithDetail.md)

</td><td>



</td><td>

Logging.IDetailLogger.warnWithDetail

</td></tr>
<tr><td>

[log(level, message, parameters)](./NoOpUserLogger.log.md)

</td><td>



</td><td>

Logging.ILogger.log

</td></tr>
<tr><td>

[_format(message, parameters)](./NoOpUserLogger._format.md)

</td><td>



</td><td>

Formats a message and parameters into a string.

</td></tr>
<tr><td>

[_suppressLog(__level, __message, __parameters)](./NoOpUserLogger._suppressLog.md)

</td><td>



</td><td>

Inner method called for suppressed log messages.

</td></tr>
</tbody></table>
