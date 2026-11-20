[Home](../README.md) > IArgon2idParams

# Interface: IArgon2idParams

Parameters for Argon2id key derivation (RFC 9106).
All fields are required; fgv does not pick defaults silently.

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

[memoryKiB](./IArgon2idParams.memoryKiB.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Memory cost in kibibytes (KiB).

</td></tr>
<tr><td>

[iterations](./IArgon2idParams.iterations.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of passes (iterations / time cost).

</td></tr>
<tr><td>

[parallelism](./IArgon2idParams.parallelism.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Degree of parallelism (threads).

</td></tr>
<tr><td>

[outputBytes](./IArgon2idParams.outputBytes.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of output bytes (hash length).

</td></tr>
</tbody></table>
