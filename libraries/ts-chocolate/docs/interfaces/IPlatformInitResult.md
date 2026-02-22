[Home](../README.md) > IPlatformInitResult

# Interface: IPlatformInitResult

Result of platform-specific initialization (Stage 1).
Contains all platform-resolved resources ready for workspace creation.

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

[cryptoProvider](./IPlatformInitResult.cryptoProvider.md)

</td><td>

`readonly`

</td><td>

ICryptoProvider

</td><td>

The crypto provider for this platform.

</td></tr>
<tr><td>

[userLibraryTree](./IPlatformInitResult.userLibraryTree.md)

</td><td>

`readonly`

</td><td>

IFileTreeDirectoryItem

</td><td>

The user library root directory (contains data/journals, data/sessions, data/settings).

</td></tr>
<tr><td>

[externalLibraries](./IPlatformInitResult.externalLibraries.md)

</td><td>

`readonly`

</td><td>

readonly [IResolvedExternalLibrary](IResolvedExternalLibrary.md)[]

</td><td>

External libraries with resolved file trees.

</td></tr>
<tr><td>

[keyStoreFile](./IPlatformInitResult.keyStoreFile.md)

</td><td>

`readonly`

</td><td>

IKeyStoreFile

</td><td>

The key store file contents, if found.

</td></tr>
<tr><td>

[bootstrapSettings](./IPlatformInitResult.bootstrapSettings.md)

</td><td>

`readonly`

</td><td>

[IBootstrapSettings](IBootstrapSettings.md)

</td><td>

The bootstrap settings loaded during platform init.

</td></tr>
<tr><td>

[commonSettings](./IPlatformInitResult.commonSettings.md)

</td><td>

`readonly`

</td><td>

[ICommonSettings](ICommonSettings.md)

</td><td>

The common settings (loaded from file or defaults).

</td></tr>
<tr><td>

[deviceSettings](./IPlatformInitResult.deviceSettings.md)

</td><td>

`readonly`

</td><td>

[IDeviceSettings](IDeviceSettings.md)

</td><td>

The device settings (loaded from file or defaults).

</td></tr>
<tr><td>

[resolvedSettings](./IPlatformInitResult.resolvedSettings.md)

</td><td>

`readonly`

</td><td>

[IResolvedSettings](IResolvedSettings.md)

</td><td>

The merged resolved settings.

</td></tr>
<tr><td>

[deviceId](./IPlatformInitResult.deviceId.md)

</td><td>

`readonly`

</td><td>

[DeviceId](../type-aliases/DeviceId.md)

</td><td>

The device identifier for this instance.

</td></tr>
</tbody></table>
