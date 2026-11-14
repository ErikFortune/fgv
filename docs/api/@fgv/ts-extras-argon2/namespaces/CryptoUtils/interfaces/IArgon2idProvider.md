[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras-argon2](../../../README.md) / [CryptoUtils](../README.md) / IArgon2idProvider

# Interface: IArgon2idProvider

Argon2id key derivation provider (RFC 9106).

Implementations are in separate packages to avoid WASM bundle costs for
consumers who don't need Argon2id:
- Node: `@fgv/ts-extras-argon2` (`NodeArgon2Provider`)
- Browser: `@fgv/ts-web-extras-argon2` (`BrowserArgon2Provider`)

## Methods

### argon2id()

> **argon2id**(`password`, `salt`, `params`, `options?`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Derives key material from a password using Argon2id (RFC 9106 §3.1).

Returns the raw derived bytes as a `Uint8Array`. For the same inputs that
both backends support, the Node and browser implementations produce
byte-identical output. The optional `associatedData` in
[CryptoUtils.IArgon2idKeyingOptions](IArgon2idKeyingOptions.md) is the one exception: it is
Node-only (the browser WASM backend has no associated-data input), so a call
that supplies non-empty `associatedData` is not portable to the browser
backend. Every input the browser backend *does* support (including the
optional `secret`) is byte-identical across the two.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `password` | `string` \| `Uint8Array`\<`ArrayBufferLike`\> | Password or passphrase. Accepts string (UTF-8) or raw bytes. |
| `salt` | `Uint8Array` | Salt bytes. Must be random and unique per credential (\>= 16 bytes recommended). |
| `params` | [`IArgon2idParams`](IArgon2idParams.md) | Argon2id parameters. Use `ARGON2ID_OWASP_MIN` as a starting point. |
| `options?` | [`IArgon2idKeyingOptions`](IArgon2idKeyingOptions.md) | Optional [keyed-hashing inputs](IArgon2idKeyingOptions.md) (secret K and/or associated data X). Omitting them (the default) leaves the output byte-identical to prior behavior. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Success with derived bytes, Failure with error context.
