[Home](../README.md) > Logging

# Namespace: Logging

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[BootLogger](./classes/BootLogger.md)

</td><td>

A logger that buffers log entries during startup, then replays them

</td></tr>
<tr><td>

[LoggerBase](./classes/LoggerBase.md)

</td><td>

Abstract base class which implements Logging.IDetailLogger | IDetailLogger.

</td></tr>
<tr><td>

[InMemoryLogger](./classes/InMemoryLogger.md)

</td><td>

An in-memory logger that stores logged and suppressed messages.

</td></tr>
<tr><td>

[ConsoleLogger](./classes/ConsoleLogger.md)

</td><td>

A console logger that outputs messages to the console.

</td></tr>
<tr><td>

[NoOpLogger](./classes/NoOpLogger.md)

</td><td>

A no-op Logging.LoggerBase | LoggerBase that does not log anything.

</td></tr>
<tr><td>

[LogReporter](./classes/LogReporter.md)

</td><td>

Abstract base class which wraps an existing Logging.ILogger | ILogger to implement

</td></tr>
<tr><td>

[MultiLogger](./classes/MultiLogger.md)

</td><td>

An Logging.ILogger | ILogger that fans every log call out to N child loggers,

</td></tr>
<tr><td>

[RetainingLogger](./classes/RetainingLogger.md)

</td><td>

An Logging.ILogger | ILogger that retains structured log records in a bounded

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ILogReporterCreateParams](./interfaces/ILogReporterCreateParams.md)

</td><td>

Parameters for creating a Logging.LogReporter | LogReporter.

</td></tr>
<tr><td>

[ILogRecord](./interfaces/ILogRecord.md)

</td><td>

A retained log record.

</td></tr>
<tr><td>

[IGetRecordsOptions](./interfaces/IGetRecordsOptions.md)

</td><td>

Options for Logging.RetainingLogger.getRecords | RetainingLogger.getRecords.

</td></tr>
<tr><td>

[ILogger](./interfaces/ILogger.md)

</td><td>

Generic Result-aware logger interface with multiple levels of logging.

</td></tr>
<tr><td>

[IDetailLogger](./interfaces/IDetailLogger.md)

</td><td>

Extended logger interface that supports logging a short summary message at a
primary level (error/warn) while emitting the full detail at `detail` level.

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[LogValueFormatter](./type-aliases/LogValueFormatter.md)

</td><td>

A function that formats a value for logging.

</td></tr>
<tr><td>

[LogMessageFormatter](./type-aliases/LogMessageFormatter.md)

</td><td>

A function that formats a message for logging.

</td></tr>
<tr><td>

[ReporterLogLevel](./type-aliases/ReporterLogLevel.md)

</td><td>

The level of logging to be used.

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[shouldLog](./functions/shouldLog.md)

</td><td>

Compares two log levels.

</td></tr>
<tr><td>

[stringifyLogValue](./functions/stringifyLogValue.md)

</td><td>

Stringifies an arbitrary value for logging.

</td></tr>
<tr><td>

[isDetailLogger](./functions/isDetailLogger.md)

</td><td>

Type guard that checks whether a logger implements IDetailLogger.

</td></tr>
</tbody></table>
