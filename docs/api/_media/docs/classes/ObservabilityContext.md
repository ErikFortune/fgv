[Home](../README.md) > ObservabilityContext

# Class: ObservabilityContext

Observability context that provides both diagnostic and user logging capabilities.

**Implements:** [`IObservabilityContext`](../interfaces/IObservabilityContext.md)

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

`constructor(diag, user, policy)`

</td><td>



</td><td>

Creates a new observability context.

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

[diag](./ObservabilityContext.diag.md)

</td><td>

`readonly`

</td><td>

LogReporter&lt;unknown&gt;

</td><td>

Diagnostic logger for internal system diagnostics.

</td></tr>
<tr><td>

[user](./ObservabilityContext.user.md)

</td><td>

`readonly`

</td><td>

IUserLogReporter

</td><td>

User logger for user-facing messages and feedback.

</td></tr>
<tr><td>

[policy](./ObservabilityContext.policy.md)

</td><td>

`readonly`

</td><td>

IObservabilityPolicy

</td><td>

Optional policy configuration for context behavior.

</td></tr>
</tbody></table>
