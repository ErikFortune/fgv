[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-web-extras-argon2](../README.md) / BrowserArgon2Provider

# Class: BrowserArgon2Provider

Browser (and Node) implementation of @fgv/ts-extras#IArgon2idProvider backed by
`hash-wasm` (pure WASM — no Web Crypto dependency). Runs identically in both Node and
browser environments, enabling cross-runtime test equivalence.

## Implements

- [`IArgon2idProvider`](../namespaces/CryptoUtils/interfaces/IArgon2idProvider.md)

## Methods

### argon2id()

> **argon2id**(`password`, `salt`, `params`, `options?`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Derives a key using Argon2id via the hash-wasm WASM implementation.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `password` | `string` \| `Uint8Array`\<`ArrayBufferLike`\> | The password or passphrase (string or raw bytes). |
| `salt` | `Uint8Array` | The salt (must be at least 8 bytes; 16+ bytes recommended). |
| `params` | [`IArgon2idParams`](../namespaces/CryptoUtils/interfaces/IArgon2idParams.md) | Argon2id parameters. All values are validated before derivation. |
| `options?` | [`IArgon2idKeyingOptions`](../namespaces/CryptoUtils/interfaces/IArgon2idKeyingOptions.md) | Optional @fgv/ts-extras#CryptoUtils.IArgon2idKeyingOptions \| keyed-hashing inputs. `secret` is honored; non-empty `associatedData` fails (Node-only). |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Success with the derived key bytes, or Failure with a descriptive message.

#### Remarks

`hash-wasm` computes Argon2id sequentially regardless of the `parallelism` value —
the WASM engine does not spawn worker threads. The `parallelism` value IS still wired
into the hash computation; output bytes differ for different parallelism values.
For interoperability with server-side Node derivations, ensure both sides use the same
`parallelism` value (recommend `parallelism: 1` unless compatibility requires otherwise).

The optional secret K (RFC 9106 keyed hashing) is wired through to `hash-wasm`
and produces output byte-identical to the Node backend. Associated data X, by
contrast, is **not supported** by `hash-wasm` (its `argon2id` options have no
associated-data field), so a call that supplies non-empty `associatedData`
fails loudly rather than silently dropping it and producing wrong bytes —
associated data is a Node-only feature. An empty/omitted `associatedData` is a
no-op and is accepted.

#### Implementation of

[`IArgon2idProvider`](../namespaces/CryptoUtils/interfaces/IArgon2idProvider.md).[`argon2id`](../namespaces/CryptoUtils/interfaces/IArgon2idProvider.md#argon2id)

***

### create()

> `static` **create**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`BrowserArgon2Provider`\>

Creates a new BrowserArgon2Provider instance.

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`BrowserArgon2Provider`\>

Success with a new provider instance.
