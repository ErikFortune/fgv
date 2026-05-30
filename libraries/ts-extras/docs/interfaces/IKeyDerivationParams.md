[Home](../README.md) > IKeyDerivationParams

# Interface: IKeyDerivationParams

Key derivation parameters stored in encrypted files.
Allows decryption with password without needing to know the original salt/iterations.

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

[kdf](./IKeyDerivationParams.kdf.md)

</td><td>

`readonly`

</td><td>

"pbkdf2"

</td><td>

Key derivation function used.

</td></tr>
<tr><td>

[salt](./IKeyDerivationParams.salt.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Base64-encoded salt used for key derivation.

</td></tr>
<tr><td>

[iterations](./IKeyDerivationParams.iterations.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of iterations used for key derivation.

</td></tr>
</tbody></table>
