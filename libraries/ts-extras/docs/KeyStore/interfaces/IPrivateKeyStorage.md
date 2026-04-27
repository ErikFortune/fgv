[Home](../../README.md) > [KeyStore](../README.md) > IPrivateKeyStorage

# Interface: IPrivateKeyStorage

Pluggable backend that persists raw asymmetric private keys outside of the
encrypted keystore vault. Concrete implementations live in platform-specific
packages (e.g. an IndexedDB-backed implementation in `@fgv/ts-web-extras` or
an encrypted-file implementation in `@fgv/ts-chocolate`).

The keystore writes storage-first: a private key is always stored here
before the corresponding public-key vault entry is committed. Conversely,
deletes hit the vault first and then this storage best-effort. As a result,
crashes or skipped saves can leave orphaned blobs here; callers are expected
to reconcile via CryptoUtils.KeyStore.IPrivateKeyStorage.list cross-referenced
against the keystore's asymmetric entries.

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

[supportsNonExtractable](./IPrivateKeyStorage.supportsNonExtractable.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether keys generated for this backend may be marked
`extractable: false`.

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

[store(id, key)](./IPrivateKeyStorage.store.md)

</td><td>



</td><td>

Stores `key` under `id`.

</td></tr>
<tr><td>

[load(id)](./IPrivateKeyStorage.load.md)

</td><td>



</td><td>

Loads the private key previously stored under `id`.

</td></tr>
<tr><td>

[delete(id)](./IPrivateKeyStorage.delete.md)

</td><td>



</td><td>

Deletes the entry stored under `id`.

</td></tr>
<tr><td>

[list()](./IPrivateKeyStorage.list.md)

</td><td>



</td><td>

Lists every `id` currently held by the backend.

</td></tr>
</tbody></table>
