[Home](../README.md) > ILogSettings

# Interface: ILogSettings

Controls the logging verbosity for the application.
All three settings use the full @fgv/ts-utils#Logging.ReporterLogLevel | ReporterLogLevel range.

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

[storeLevel](./ILogSettings.storeLevel.md)

</td><td>

`readonly`

</td><td>

ReporterLogLevel

</td><td>

Minimum level stored in the message log.

</td></tr>
<tr><td>

[displayLevel](./ILogSettings.displayLevel.md)

</td><td>

`readonly`

</td><td>

ReporterLogLevel

</td><td>

Initial minimum level shown in the status bar log panel.

</td></tr>
<tr><td>

[toastLevel](./ILogSettings.toastLevel.md)

</td><td>

`readonly`

</td><td>

ReporterLogLevel

</td><td>

Minimum level that triggers a toast popup.

</td></tr>
</tbody></table>
