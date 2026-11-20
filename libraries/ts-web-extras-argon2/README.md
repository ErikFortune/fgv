# @fgv/ts-web-extras-argon2

Argon2id key derivation (RFC 9106) in pure WebAssembly, for browsers and Node.js.
`BrowserArgon2Provider` implements `CryptoUtils.IArgon2idProvider` from
[`@fgv/ts-extras`](../ts-extras) over [`hash-wasm`](https://www.npmjs.com/package/hash-wasm), and
returns `Result<T>` from `@fgv/ts-utils` instead of throwing. It needs no Web Crypto and no native
module. For the same inputs its output is byte-identical to `NodeArgon2Provider` in
[`@fgv/ts-extras-argon2`](../ts-extras-argon2).

## Installation

```sh
npm install @fgv/ts-web-extras-argon2 @fgv/ts-extras @fgv/ts-utils
```

`@fgv/ts-extras` and `@fgv/ts-utils` are peer dependencies.

## Usage

```ts
import { BrowserArgon2Provider, CryptoUtils } from '@fgv/ts-web-extras-argon2';

const provider = BrowserArgon2Provider.create().orThrow();
const salt = crypto.getRandomValues(new Uint8Array(16));

const derived = await provider.argon2id('correct horse battery staple', salt, CryptoUtils.ARGON2ID_PASSPHRASE);
if (derived.isSuccess()) {
  // derived.value is a Uint8Array of params.outputBytes (32) bytes
}
```

`CryptoUtils` is re-exported from `@fgv/ts-extras` for convenience. To store a password-derived
secret, pass the provider to `KeyStore.addSecretFromPasswordArgon2id` and
`KeyStore.verifySecretFromPasswordArgon2id` in `@fgv/ts-extras`.

Things that differ from the Node provider:

- The WASM engine runs single-threaded. `parallelism` changes the hash value but not how it is
  computed, so `parallelism: 1` is the sensible choice unless you must agree with a server that uses
  another value.
- The optional `associatedData` keying input is not supported; a call that supplies it fails rather
  than silently producing different bytes. The optional `secret` is supported.

See [CAPABILITIES.md](./CAPABILITIES.md) for what this package provides.

## License

MIT — see [LICENSE](./LICENSE).
