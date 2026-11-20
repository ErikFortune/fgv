[Home](../../README.md) > [CryptoUtils](../README.md) > IdbPrivateKeyStorage

# Class: IdbPrivateKeyStorage

CryptoUtils.KeyStore.IPrivateKeyStorage | IPrivateKeyStorage
implementation backed by IndexedDB. Stores `CryptoKey` objects directly via
IndexedDB's structured-clone serialization — no JWK round-trip — so it works
with non-extractable keys.

`supportsNonExtractable` is `true`: because the `CryptoKey` is stored by
reference (structured clone) rather than exported, the keystore may generate
`extractable: false` keys for maximum security on browsers that support it.

The database is opened lazily on first use and cached. Each operation runs in
its own transaction, relying on IndexedDB's default serialization. Multi-tab
concurrency is a known limitation: two tabs writing the same id can race; this
implementation targets single-tab use.

**Implements:** `IPrivateKeyStorage`

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

[supportsNonExtractable](./IdbPrivateKeyStorage.supportsNonExtractable.md)

</td><td>

`readonly`

</td><td>

true

</td><td>

`true` — IndexedDB stores `CryptoKey` objects directly, so non-extractable

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

[create(params)](./IdbPrivateKeyStorage.create.md)

</td><td>

`static`

</td><td>

Creates a new CryptoUtils.IdbPrivateKeyStorage.

</td></tr>
<tr><td>

[store(id, key)](./IdbPrivateKeyStorage.store.md)

</td><td>



</td><td>

Stores `key` under `id`.

</td></tr>
<tr><td>

[load(id)](./IdbPrivateKeyStorage.load.md)

</td><td>



</td><td>

Loads the private key stored under `id`.

</td></tr>
<tr><td>

[delete(id)](./IdbPrivateKeyStorage.delete.md)

</td><td>



</td><td>

Deletes the entry stored under `id`.

</td></tr>
<tr><td>

[list()](./IdbPrivateKeyStorage.list.md)

</td><td>



</td><td>

Lists every stored id.

</td></tr>
</tbody></table>
