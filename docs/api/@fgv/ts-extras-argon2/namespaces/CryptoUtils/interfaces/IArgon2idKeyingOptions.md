[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras-argon2](../../../README.md) / [CryptoUtils](../README.md) / IArgon2idKeyingOptions

# Interface: IArgon2idKeyingOptions

Optional keyed-hashing inputs for [argon2id](IArgon2idProvider.md#argon2id)
(RFC 9106 §3.1). These are distinct from the cost parameters in
[CryptoUtils.IArgon2idParams](IArgon2idParams.md) — they change the derived output but are
not tuning knobs. Both fields are optional; omitting a field (or passing an
empty `Uint8Array`) is a no-op that leaves the output byte-identical to a call
with no options at all.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-associateddata"></a> `associatedData?` | `readonly` | `Uint8Array`\<`ArrayBufferLike`\> | Optional associated data X (RFC 9106 §3.1). When present and non-empty it is mixed into the hash. **Node-only:** the WASM (`hash-wasm`) browser backend has no associated-data input, so `BrowserArgon2Provider` fails loudly rather than silently dropping it (which would produce wrong bytes). Empty or omitted means no associated data and is accepted by both backends. |
| <a id="property-secret"></a> `secret?` | `readonly` | `Uint8Array`\<`ArrayBufferLike`\> | Optional secret key K (RFC 9106 keyed hashing, sometimes called a "pepper"). When present and non-empty it is mixed into the hash so that the derived output cannot be reproduced without also knowing K. Empty or omitted means no secret. Honored by both the Node and browser backends. |
