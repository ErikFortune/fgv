[Home](../../README.md) > [Settings](../README.md) > IBootstrapSettings

# Interface: IBootstrapSettings

Preload configuration that determines what data sources to set up.
Stored in: `data/settings/bootstrap.json` (always in fixed local location).

Editable from the settings UI; changes require a page reload.

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

[schemaVersion](./IBootstrapSettings.schemaVersion.md)

</td><td>

`readonly`

</td><td>

1

</td><td>

Schema version for migration support

</td></tr>
<tr><td>

[includeBuiltIn](./IBootstrapSettings.includeBuiltIn.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether to include built-in (embedded) library data.

</td></tr>
<tr><td>

[localStorage](./IBootstrapSettings.localStorage.md)

</td><td>

`readonly`

</td><td>

[ILocalStorageConfig](../../interfaces/ILocalStorageConfig.md)

</td><td>

What to include from local storage.

</td></tr>
<tr><td>

[externalLibraries](./IBootstrapSettings.externalLibraries.md)

</td><td>

`readonly`

</td><td>

readonly [IExternalLibraryRefConfig](../../interfaces/IExternalLibraryRefConfig.md)[]

</td><td>

External roots to load and their configuration

</td></tr>
<tr><td>

[preferencesLocation](./IBootstrapSettings.preferencesLocation.md)

</td><td>

`readonly`

</td><td>

[ISettingsFileLocation](../../type-aliases/ISettingsFileLocation.md)

</td><td>

Where to find the preferences file.

</td></tr>
<tr><td>

[keystoreLocation](./IBootstrapSettings.keystoreLocation.md)

</td><td>

`readonly`

</td><td>

[ISettingsFileLocation](../../type-aliases/ISettingsFileLocation.md)

</td><td>

Where to find the keystore file.

</td></tr>
<tr><td>

[fileTreeOverrides](./IBootstrapSettings.fileTreeOverrides.md)

</td><td>

`readonly`

</td><td>

[IDeviceFileTreeOverrides](../../interfaces/IDeviceFileTreeOverrides.md)

</td><td>

Platform-specific file tree overrides (moved from device settings).

</td></tr>
</tbody></table>
