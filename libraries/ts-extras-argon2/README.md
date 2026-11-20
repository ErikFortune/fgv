# @fgv/ts-extras-argon2

Argon2id key derivation (RFC 9106) for Node.js. `NodeArgon2Provider` implements
`CryptoUtils.IArgon2idProvider` from [`@fgv/ts-extras`](../ts-extras) over the native
[`argon2`](https://www.npmjs.com/package/argon2) binding, and returns `Result<T>` from
`@fgv/ts-utils` instead of throwing. For browsers, use the WASM sibling
[`@fgv/ts-web-extras-argon2`](../ts-web-extras-argon2); for the same inputs the two produce
byte-identical output.

## Installation

```sh
npm install @fgv/ts-extras-argon2 @fgv/ts-extras @fgv/ts-utils
```

`@fgv/ts-extras` and `@fgv/ts-utils` are peer dependencies. `argon2` is a direct dependency and
builds a native module on install.

## Usage

```ts
import { CryptoUtils, NodeArgon2Provider } from '@fgv/ts-extras-argon2';

const provider = NodeArgon2Provider.create().orThrow();
const salt = crypto.getRandomValues(new Uint8Array(16));

const derived = await provider.argon2id('correct horse battery staple', salt, CryptoUtils.ARGON2ID_PASSPHRASE);
if (derived.isSuccess()) {
  // derived.value is a Uint8Array of params.outputBytes (32) bytes
}
```

`CryptoUtils` is re-exported from `@fgv/ts-extras` for convenience. `ARGON2ID_OWASP_MIN` and
`ARGON2ID_PASSPHRASE` are the two parameter presets; invalid parameters (for example
`memoryKiB < 8`) fail rather than throw.

To store a password-derived secret, pass the provider to `KeyStore.addSecretFromPasswordArgon2id`
and `KeyStore.verifySecretFromPasswordArgon2id` in `@fgv/ts-extras`.

The optional `associatedData` keying input is supported here but not by the browser provider, so a
derivation that uses it cannot be reproduced in the browser.

See [CAPABILITIES.md](./CAPABILITIES.md) for what this package provides.

## License

MIT — see [LICENSE](./LICENSE).
