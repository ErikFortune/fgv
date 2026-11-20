[Home](../README.md) > BootLogger

# Class: BootLogger

A logger that buffers log entries during startup, then replays them
to a real logger once it becomes available.

**Implements:** [`IDetailLogger`](../interfaces/IDetailLogger.md)

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

Creates a new boot logger.

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

[logLevel](./BootLogger.logLevel.md)

</td><td>

`readonly`

</td><td>

[ReporterLogLevel](../type-aliases/ReporterLogLevel.md)

</td><td>

The level of logging to be used.

</td></tr>
<tr><td>

[isReady](./BootLogger.isReady.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether the boot logger has been connected to a real logger.

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

[ready(logger)](./BootLogger.ready.md)

</td><td>



</td><td>

Connects this boot logger to a real logger.

</td></tr>
<tr><td>

[log(level, message, parameters)](./BootLogger.log.md)

</td><td>



</td><td>

Logs a message at the given level.

</td></tr>
<tr><td>

[detail(message, parameters)](./BootLogger.detail.md)

</td><td>



</td><td>

Logs a detail message.

</td></tr>
<tr><td>

[info(message, parameters)](./BootLogger.info.md)

</td><td>



</td><td>

Logs an info message.

</td></tr>
<tr><td>

[warn(message, parameters)](./BootLogger.warn.md)

</td><td>



</td><td>

Logs a warning message.

</td></tr>
<tr><td>

[error(message, parameters)](./BootLogger.error.md)

</td><td>



</td><td>

Logs an error message.

</td></tr>
<tr><td>

[errorWithDetail(message, detail)](./BootLogger.errorWithDetail.md)

</td><td>



</td><td>

Logs a short error summary at `error` level, then emits `detail` at `detail` level.

</td></tr>
<tr><td>

[warnWithDetail(message, detail)](./BootLogger.warnWithDetail.md)

</td><td>



</td><td>

Logs a short warning summary at `warning` level, then emits `detail` at `detail` level.

</td></tr>
</tbody></table>
