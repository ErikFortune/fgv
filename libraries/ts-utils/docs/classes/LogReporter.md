[Home](../README.md) > LogReporter

# Class: LogReporter

Abstract base class which wraps an existing Logging.ILogger | ILogger to implement
both Logging.ILogger | ILogger and IResultReporter | IResultReporter.

**Implements:** [`IDetailLogger`](../interfaces/IDetailLogger.md), [`IResultReporter<T, TD>`](../interfaces/IResultReporter.md)

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

`constructor(params)`

</td><td>



</td><td>

Creates a new Logging.LogReporter | LogReporter.

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

[logger](./LogReporter.logger.md)

</td><td>

`readonly`

</td><td>

[ILogger](../interfaces/ILogger.md)

</td><td>

Base logger used to by this reporter.

</td></tr>
<tr><td>

[logLevel](./LogReporter.logLevel.md)

</td><td>

`readonly`

</td><td>

[ReporterLogLevel](../type-aliases/ReporterLogLevel.md)

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

[createDefault(logger)](./LogReporter.createDefault.md)

</td><td>

`static`

</td><td>

Creates a default Logging.LogReporter | LogReporter with a Logging.NoOpLogger | NoOpLogger with the

</td></tr>
<tr><td>

[tryFormatObject(value, detail)](./LogReporter.tryFormatObject.md)

</td><td>

`static`

</td><td>

Generic method to try to format an object for logging.

</td></tr>
<tr><td>

[detail(message, parameters)](./LogReporter.detail.md)

</td><td>



</td><td>

Logs a detail message.

</td></tr>
<tr><td>

[info(message, parameters)](./LogReporter.info.md)

</td><td>



</td><td>

Logs an info message.

</td></tr>
<tr><td>

[warn(message, parameters)](./LogReporter.warn.md)

</td><td>



</td><td>

Logs a warning message.

</td></tr>
<tr><td>

[error(message, parameters)](./LogReporter.error.md)

</td><td>



</td><td>

Logs an error message.

</td></tr>
<tr><td>

[errorWithDetail(message, detail)](./LogReporter.errorWithDetail.md)

</td><td>



</td><td>

Logs a short error summary at `error` level, then emits `detail` at `detail` level.

</td></tr>
<tr><td>

[warnWithDetail(message, detail)](./LogReporter.warnWithDetail.md)

</td><td>



</td><td>

Logs a short warning summary at `warning` level, then emits `detail` at `detail` level.

</td></tr>
<tr><td>

[log(level, message, parameters)](./LogReporter.log.md)

</td><td>



</td><td>

Logs a message at the given level.

</td></tr>
<tr><td>

[reportSuccess(level, value, detail, message)](./LogReporter.reportSuccess.md)

</td><td>



</td><td>

Reports a successful result at the specified log level.

</td></tr>
<tr><td>

[reportFailure(level, message, detail)](./LogReporter.reportFailure.md)

</td><td>



</td><td>

Reports a failed result at the specified log level.

</td></tr>
<tr><td>

[withValueFormatter(valueFormatter)](./LogReporter.withValueFormatter.md)

</td><td>



</td><td>

Creates a new Logging.LogReporter | LogReporter with the same logger but a different value formatter.

</td></tr>
</tbody></table>
