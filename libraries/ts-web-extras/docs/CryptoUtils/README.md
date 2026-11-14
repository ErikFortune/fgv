[Home](../README.md) > CryptoUtils

# Namespace: CryptoUtils

Browser-compatible cryptographic utilities using the Web Crypto API.

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[BrowserHashProvider](./classes/BrowserHashProvider.md)

</td><td>

Browser-compatible hash provider using the Web Crypto API.

</td></tr>
<tr><td>

[BrowserCryptoProvider](./classes/BrowserCryptoProvider.md)

</td><td>

Browser implementation of `ICryptoProvider` using the Web Crypto API.

</td></tr>
<tr><td>

[IdbPrivateKeyStorage](./classes/IdbPrivateKeyStorage.md)

</td><td>

CryptoUtils.KeyStore.IPrivateKeyStorage | IPrivateKeyStorage
implementation backed by IndexedDB.

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IIdbPrivateKeyStorageCreateParams](./interfaces/IIdbPrivateKeyStorageCreateParams.md)

</td><td>

Parameters for CryptoUtils.IdbPrivateKeyStorage.create.

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IHpkeSealResult](./type-aliases/IHpkeSealResult.md)

</td><td>

Output of `HpkeProvider.sealBase`.

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[createBrowserCryptoProvider](./functions/createBrowserCryptoProvider.md)

</td><td>

Creates a CryptoUtils.BrowserCryptoProvider | BrowserCryptoProvider if Web

</td></tr>
</tbody></table>

## Variables

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[HpkeProvider](./variables/HpkeProvider.md)

</td><td>

HPKE base mode (RFC 9180) — `DHKEM(X25519, HKDF-SHA256) + HKDF-SHA256 + AES-256-GCM`.

</td></tr>
</tbody></table>
