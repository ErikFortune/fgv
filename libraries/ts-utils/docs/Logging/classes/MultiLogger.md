[Home](../../README.md) > [Logging](../README.md) > MultiLogger

# Class: MultiLogger

An Logging.ILogger | ILogger that fans every log call out to N child loggers,
each applying its own threshold.

**Implements:** [`ILogger`](../../interfaces/ILogger.md)

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

`constructor(loggers)`

</td><td>



</td><td>

Creates a new multi logger.

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

[logLevel](./MultiLogger.logLevel.md)

</td><td>

`readonly`

</td><td>

[ReporterLogLevel](../../type-aliases/ReporterLogLevel.md)

</td><td>

The most-verbose (most-permissive) level among the children, so an upstream
`shouldLog` gate does not suppress a call before it can fan out to a more
permissive child.

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

[log(level, message, parameters)](./MultiLogger.log.md)

</td><td>



</td><td>

Logs a message at the given level.

</td></tr>
<tr><td>

[detail(message, parameters)](./MultiLogger.detail.md)

</td><td>



</td><td>

Logs a detail message.

</td></tr>
<tr><td>

[info(message, parameters)](./MultiLogger.info.md)

</td><td>



</td><td>

Logs an info message.

</td></tr>
<tr><td>

[warn(message, parameters)](./MultiLogger.warn.md)

</td><td>



</td><td>

Logs a warning message.

</td></tr>
<tr><td>

[error(message, parameters)](./MultiLogger.error.md)

</td><td>



</td><td>

Logs an error message.

</td></tr>
</tbody></table>
