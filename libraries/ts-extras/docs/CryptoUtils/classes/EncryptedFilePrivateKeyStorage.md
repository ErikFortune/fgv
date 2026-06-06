[Home](../../README.md) > [CryptoUtils](../README.md) > EncryptedFilePrivateKeyStorage

# Class: EncryptedFilePrivateKeyStorage

CryptoUtils.KeyStore.IPrivateKeyStorage | IPrivateKeyStorage
implementation that persists each private key as its own AES-256-GCM-encrypted
file in a directory. The file content is the key's JWK, encrypted with a
consumer-supplied 32-byte key via the supplied
CryptoUtils.ICryptoProvider | crypto provider.

`supportsNonExtractable` is `false`: persisting to disk requires exporting the
private key to JWK, which only works for `extractable: true` keys. The
keystore generates extractable keys when a backend reports `false` here.

I/O goes through the FileTree.FileTree | FileTree abstraction (default
`FsTree`), so the same implementation works against an in-memory tree (tests)
or any other Node-compatible backend.

This backend is **Node-only**: it round-trips private keys through
`node:crypto` (`crypto.webcrypto.subtle`), so it is intentionally excluded
from the browser entry point. Browser consumers should use
`IdbPrivateKeyStorage` from `@fgv/ts-web-extras` instead.

Single-process assumption: there is no inter-process locking. Concurrent
writers to the same directory may race.

**Implements:** [`IPrivateKeyStorage`](../../interfaces/IPrivateKeyStorage.md)

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

[supportsNonExtractable](./EncryptedFilePrivateKeyStorage.supportsNonExtractable.md)

</td><td>

`readonly`

</td><td>

false

</td><td>

`false` — disk persistence round-trips via JWK, which requires extractable

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

[create(params)](./EncryptedFilePrivateKeyStorage.create.md)

</td><td>

`static`

</td><td>

Creates a new CryptoUtils.KeyStore.EncryptedFilePrivateKeyStorage.

</td></tr>
<tr><td>

[store(id, key)](./EncryptedFilePrivateKeyStorage.store.md)

</td><td>



</td><td>

Stores `key` under `id` as an encrypted JWK file.

</td></tr>
<tr><td>

[load(id)](./EncryptedFilePrivateKeyStorage.load.md)

</td><td>



</td><td>

Loads the private key stored under `id`, decrypting and re-importing it from

</td></tr>
<tr><td>

[delete(id)](./EncryptedFilePrivateKeyStorage.delete.md)

</td><td>



</td><td>

Deletes the entry stored under `id`.

</td></tr>
<tr><td>

[list()](./EncryptedFilePrivateKeyStorage.list.md)

</td><td>



</td><td>

Lists every stored id.

</td></tr>
</tbody></table>
