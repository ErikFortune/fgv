[Home](../../README.md) > [KeyStore](../README.md) > IKeyStoreCreateParams

# Interface: IKeyStoreCreateParams

Parameters for creating a new key store.

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

[cryptoProvider](./IKeyStoreCreateParams.cryptoProvider.md)

</td><td>

`readonly`

</td><td>

[ICryptoProvider](../../interfaces/ICryptoProvider.md)

</td><td>

Crypto provider to use.

</td></tr>
<tr><td>

[iterations](./IKeyStoreCreateParams.iterations.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

PBKDF2 iterations (defaults to DEFAULT_KEYSTORE_ITERATIONS).

</td></tr>
</tbody></table>
