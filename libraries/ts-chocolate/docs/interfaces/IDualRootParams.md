[Home](../README.md) > IDualRootParams

# Interface: IDualRootParams

Parameters for dual-root directory layout.
Separate directories for installation data and library collections.

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

[mode](./IDualRootParams.mode.md)

</td><td>

`readonly`

</td><td>

"dual-root"

</td><td>

Layout mode identifier.

</td></tr>
<tr><td>

[installationPath](./IDualRootParams.installationPath.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Path to installation data (settings, keystore, user data, possibly additional libraries).

</td></tr>
<tr><td>

[libraryPath](./IDualRootParams.libraryPath.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Path to library collections directory (possibly read-only).

</td></tr>
<tr><td>

[libraryReadOnly](./IDualRootParams.libraryReadOnly.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether the library path is read-only.

</td></tr>
</tbody></table>
