[Home](../README.md) > IMultiRootParams

# Interface: IMultiRootParams

Parameters for multi-root directory layout.
One installation directory and multiple library collection directories.

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

[mode](./IMultiRootParams.mode.md)

</td><td>

`readonly`

</td><td>

"multi-root"

</td><td>

Layout mode identifier.

</td></tr>
<tr><td>

[installationPath](./IMultiRootParams.installationPath.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Path to installation data (settings, keystore, user data).

</td></tr>
<tr><td>

[libraryPaths](./IMultiRootParams.libraryPaths.md)

</td><td>

`readonly`

</td><td>

readonly { path: string; readOnly?: boolean }[]

</td><td>

Paths to library collection directories.

</td></tr>
</tbody></table>
