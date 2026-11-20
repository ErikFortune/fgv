[Home](../README.md) > IArgon2idKeyDerivationParams

# Interface: IArgon2idKeyDerivationParams

Argon2id key derivation parameters (RFC 9106).

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

[kdf](./IArgon2idKeyDerivationParams.kdf.md)

</td><td>

`readonly`

</td><td>

"argon2id"

</td><td>

Key derivation function discriminator.

</td></tr>
<tr><td>

[salt](./IArgon2idKeyDerivationParams.salt.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Base64-encoded salt used for key derivation.

</td></tr>
<tr><td>

[memoryKiB](./IArgon2idKeyDerivationParams.memoryKiB.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Memory cost in kibibytes.

</td></tr>
<tr><td>

[iterations](./IArgon2idKeyDerivationParams.iterations.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of passes (time cost).

</td></tr>
<tr><td>

[parallelism](./IArgon2idKeyDerivationParams.parallelism.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Degree of parallelism.

</td></tr>
</tbody></table>
