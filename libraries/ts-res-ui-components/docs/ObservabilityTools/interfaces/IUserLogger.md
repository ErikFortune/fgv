[Home](../../README.md) > [ObservabilityTools](../README.md) > IUserLogger

# Interface: IUserLogger

User logger interface that extends ILogger with success method for UI feedback.

**Extends:** `ILogger`

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

[logLevel](./IUserLogger.logLevel.md)

</td><td>

`readonly`

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

[success(message, parameters)](./IUserLogger.success.md)

</td><td>



</td><td>

Logs a success message for user feedback.

</td></tr>
<tr><td>

[log(level, message, parameters)](./IUserLogger.log.md)

</td><td>



</td><td>

Logs a message at the given level.

</td></tr>
<tr><td>

[detail(message, parameters)](./IUserLogger.detail.md)

</td><td>



</td><td>

Logs a detail message.

</td></tr>
<tr><td>

[info(message, parameters)](./IUserLogger.info.md)

</td><td>



</td><td>

Logs an info message.

</td></tr>
<tr><td>

[warn(message, parameters)](./IUserLogger.warn.md)

</td><td>



</td><td>

Logs a warning message.

</td></tr>
<tr><td>

[error(message, parameters)](./IUserLogger.error.md)

</td><td>



</td><td>

Logs an error message.

</td></tr>
</tbody></table>
