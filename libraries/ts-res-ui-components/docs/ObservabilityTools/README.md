[Home](../README.md) > ObservabilityTools

# Namespace: ObservabilityTools

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ConsoleUserLogger](./classes/ConsoleUserLogger.md)

</td><td>

Console-based user logger that extends diagnostic logging with success method.

</td></tr>
<tr><td>

[NoOpUserLogger](./classes/NoOpUserLogger.md)

</td><td>

No-op user logger that suppresses all output.

</td></tr>
<tr><td>

[ViewStateUserLogger](./classes/ViewStateUserLogger.md)

</td><td>

ViewState-connected user logger that forwards messages to viewState.addMessage().

</td></tr>
<tr><td>

[ObservabilityContext](./classes/ObservabilityContext.md)

</td><td>

Observability context that provides both diagnostic and user logging capabilities.

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

[IUserLogger](./interfaces/IUserLogger.md)

</td><td>

User logger interface that extends ILogger with success method for UI feedback.

</td></tr>
<tr><td>

[IObservabilityContext](./interfaces/IObservabilityContext.md)

</td><td>

Observability context that provides both diagnostic and user logging capabilities.

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

[ObservabilityContextType](./type-aliases/ObservabilityContextType.md)

</td><td>

Context type classification for observability contexts.

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

[createConsoleObservabilityContext](./functions/createConsoleObservabilityContext.md)

</td><td>

Creates a console-based observability context for development and debugging.

</td></tr>
<tr><td>

[createNoOpObservabilityContext](./functions/createNoOpObservabilityContext.md)

</td><td>

Creates a no-op observability context that suppresses all logging.

</td></tr>
<tr><td>

[createViewStateObservabilityContext](./functions/createViewStateObservabilityContext.md)

</td><td>

Creates an observability context that forwards user messages to viewState.addMessage().

</td></tr>
<tr><td>

[detectObservabilityContextType](./functions/detectObservabilityContextType.md)

</td><td>

Detects the type of observability context based on the user logger implementation.

</td></tr>
<tr><td>

[isViewStateConnected](./functions/isViewStateConnected.md)

</td><td>

Checks if an observability context is connected to ViewState for UI message display.

</td></tr>
<tr><td>

[isConsoleOnlyContext](./functions/isConsoleOnlyContext.md)

</td><td>

Checks if an observability context only outputs to console (not UI messages).

</td></tr>
</tbody></table>

## Variables

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[DefaultObservabilityContext](./variables/DefaultObservabilityContext.md)

</td><td>

Default console-only observability context for general use.

</td></tr>
<tr><td>

[TestObservabilityContext](./variables/TestObservabilityContext.md)

</td><td>

Test observability context with no-op loggers.

</td></tr>
</tbody></table>
