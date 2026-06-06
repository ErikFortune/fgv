[Home](../README.md) > IObservabilityContext

# Interface: IObservabilityContext

Observability context that provides both diagnostic and user logging capabilities.

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

[diag](./IObservabilityContext.diag.md)

</td><td>

`readonly`

</td><td>

LogReporter&lt;unknown&gt;

</td><td>

Diagnostic logger for internal system diagnostics.

</td></tr>
<tr><td>

[user](./IObservabilityContext.user.md)

</td><td>

`readonly`

</td><td>

IUserLogReporter

</td><td>

User logger for user-facing messages and feedback.

</td></tr>
<tr><td>

[policy](./IObservabilityContext.policy.md)

</td><td>

`readonly`

</td><td>

IObservabilityPolicy

</td><td>

Optional policy configuration for context behavior.

</td></tr>
</tbody></table>
