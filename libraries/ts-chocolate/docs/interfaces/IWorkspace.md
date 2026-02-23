[Home](../README.md) > IWorkspace

# Interface: IWorkspace

The primary entry point for chocolate applications.

A workspace provides unified access to:
- Library runtime for materialized library objects (ingredients, fillings, confections, etc.)
- User runtime for materialized user data (sessions, journals, inventory)
- Key store for encrypted collection support
- Settings management

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

[data](./IWorkspace.data.md)

</td><td>

`readonly`

</td><td>

[ChocolateLibrary](../classes/ChocolateLibrary.md)

</td><td>

The chocolate library providing materialized library objects.

</td></tr>
<tr><td>

[userData](./IWorkspace.userData.md)

</td><td>

`readonly`

</td><td>

[IUserLibrary](IUserLibrary.md)

</td><td>

User library runtime for materialized user data.

</td></tr>
<tr><td>

[keyStore](./IWorkspace.keyStore.md)

</td><td>

`readonly`

</td><td>

KeyStore_2 | undefined

</td><td>

The key store for encryption key management, if configured.

</td></tr>
<tr><td>

[settings](./IWorkspace.settings.md)

</td><td>

`readonly`

</td><td>

[ISettingsManager](ISettingsManager.md) | undefined

</td><td>

The settings manager for workspace configuration.

</td></tr>
<tr><td>

[configName](./IWorkspace.configName.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

Optional configuration name for this workspace instance (e.g.

</td></tr>
<tr><td>

[state](./IWorkspace.state.md)

</td><td>

`readonly`

</td><td>

[WorkspaceState](../type-aliases/WorkspaceState.md)

</td><td>

Current state of the workspace with respect to key store.

</td></tr>
<tr><td>

[isReady](./IWorkspace.isReady.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether the workspace is ready for use (unlocked or no key store configured).

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

[unlock(password)](./IWorkspace.unlock.md)

</td><td>



</td><td>

Unlocks the workspace with a password.

</td></tr>
<tr><td>

[lock()](./IWorkspace.lock.md)

</td><td>



</td><td>

Locks the workspace.

</td></tr>
</tbody></table>
