[Home](../README.md) > Workspace

# Class: Workspace

The primary entry point for chocolate applications.

Workspace is a thin coordinator that wraps:
- RuntimeContext for library access and session creation
- KeyStore for encrypted collection support

**Implements:** [`IWorkspace`](../interfaces/IWorkspace.md)

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

[data](./Workspace.data.md)

</td><td>

`readonly`

</td><td>

[RuntimeContext](RuntimeContext.md)

</td><td>

The runtime context providing materialized library objects.

</td></tr>
<tr><td>

[userData](./Workspace.userData.md)

</td><td>

`readonly`

</td><td>

[IUserLibrary](../interfaces/IUserLibrary.md)

</td><td>

User library runtime for materialized user data.

</td></tr>
<tr><td>

[keyStore](./Workspace.keyStore.md)

</td><td>

`readonly`

</td><td>

KeyStore_2 | undefined

</td><td>

The key store for encryption key management, if configured.

</td></tr>
<tr><td>

[settings](./Workspace.settings.md)

</td><td>

`readonly`

</td><td>

ISettingsManager | undefined

</td><td>

The settings manager for workspace configuration.

</td></tr>
<tr><td>

[state](./Workspace.state.md)

</td><td>

`readonly`

</td><td>

[WorkspaceState](../type-aliases/WorkspaceState.md)

</td><td>

Current state of the workspace with respect to key store.

</td></tr>
<tr><td>

[isReady](./Workspace.isReady.md)

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

[create(params)](./Workspace.create.md)

</td><td>

`static`

</td><td>

Creates a new workspace with the specified configuration.

</td></tr>
<tr><td>

[createWithSettings(params)](./Workspace.createWithSettings.md)

</td><td>

`static`

</td><td>

Creates a new workspace with a pre-created settings manager.

</td></tr>
<tr><td>

[unlock(password)](./Workspace.unlock.md)

</td><td>



</td><td>

Unlocks the workspace with a password.

</td></tr>
<tr><td>

[lock()](./Workspace.lock.md)

</td><td>



</td><td>

Locks the workspace.

</td></tr>
</tbody></table>
