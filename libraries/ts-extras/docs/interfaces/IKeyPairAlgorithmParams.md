[Home](../README.md) > IKeyPairAlgorithmParams

# Interface: IKeyPairAlgorithmParams

WebCrypto parameters for a single CryptoUtils.KeyPairAlgorithm.
Implementations of CryptoUtils.ICryptoProvider use this table to
translate the small public algorithm enum into the WebCrypto algorithm
objects and key-usage arrays expected by `crypto.subtle`.

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

[generateKey](./IKeyPairAlgorithmParams.generateKey.md)

</td><td>

`readonly`

</td><td>

EcKeyGenParams | RsaHashedKeyGenParams | { name: "Ed25519" }

</td><td>

Algorithm parameters for `crypto.subtle.generateKey`.

</td></tr>
<tr><td>

[importPublicKey](./IKeyPairAlgorithmParams.importPublicKey.md)

</td><td>

`readonly`

</td><td>

EcKeyImportParams | RsaHashedImportParams | { name: "Ed25519" }

</td><td>

Algorithm parameters for `crypto.subtle.importKey('jwk', ...)` when
importing the public half of a keypair.

</td></tr>
<tr><td>

[keyPairUsages](./IKeyPairAlgorithmParams.keyPairUsages.md)

</td><td>

`readonly`

</td><td>

readonly KeyUsage[]

</td><td>

Default key usages for the generated `CryptoKeyPair`.

</td></tr>
<tr><td>

[publicKeyUsages](./IKeyPairAlgorithmParams.publicKeyUsages.md)

</td><td>

`readonly`

</td><td>

readonly KeyUsage[]

</td><td>

Key usages applied when re-importing only the public key.

</td></tr>
</tbody></table>
