# Cross-runtime interfaces — Node and browser implementations

> The capabilities index carries a compact form of this table. **This is the full one**, with
> the per-interface notes — kept whole by the `library-capabilities-split` stream so nothing
> was lost to compression.

---

Several core abstractions are defined once and have separate Node and browser implementations. Code against the interface; pick the implementation at the composition root.

| Interface | Node impl | Browser impl | Notes |
|---|---|---|---|
| `FileTree` (`@fgv/ts-json-base/file-tree`) | `FsTree` (`ts-json-base/file-tree`) | `FileTree` over File System Access API (`ts-web-extras/file-tree`) | Also: `ZipFileTreeAccessors` (`ts-extras/zip-file-tree`), in-memory tree (`ts-json-base/file-tree`). |
| `ICryptoProvider` (`@fgv/ts-extras/crypto-utils`) | `NodeCryptoProvider` (`ts-extras/crypto-utils`) | `BrowserCryptoProvider` (`ts-web-extras/crypto-utils`) | Same surface for AES-GCM, PBKDF2, SHA-256, random bytes, asymmetric key ops, ECIES wrap/unwrap, digital sign/verify, HMAC-SHA256, constant-time compare. |
| Hash normalizer | `Md5Normalizer` (`ts-extras/hash`), `Crc32Normalizer` (`ts-utils/hash`) | `Md5Normalizer.browser` (`ts-extras/hash`), `BrowserHashProvider` (`ts-web-extras/crypto-utils`) | `Crc32Normalizer` is pure JS and runs everywhere. |
| `IEncryptionProvider` (`@fgv/ts-extras/crypto-utils`) | `KeyStore`, `DirectEncryptionProvider` | same (back with `BrowserCryptoProvider`) | The provider is runtime-agnostic; only the underlying `ICryptoProvider` differs. |
| `IArgon2idProvider` (`@fgv/ts-extras/crypto-utils`) | `NodeArgon2Provider` (`ts-extras-argon2`) | `BrowserArgon2Provider` (`ts-web-extras-argon2`) | Pure-WASM browser impl is byte-identical to Node impl for same inputs. |
| `IPrivateKeyStorage` (`@fgv/ts-extras/crypto-utils`) | `EncryptedFilePrivateKeyStorage` (`ts-extras/crypto-utils`) | `IdbPrivateKeyStorage` (`ts-web-extras/crypto-utils`) | KeyStore private-key backend. Node round-trips via encrypted JWK (`supportsNonExtractable: false`); browser stores `CryptoKey` directly in IndexedDB (`supportsNonExtractable: true`). |
| Local transformers facade (`loadPipeline`/`classify`/`classifyAll`/`embed`) | `@fgv/ts-extras-transformers` (native ONNX) | `@fgv/ts-web-extras-transformers` (WASM/WebGPU) | Identical surface; thin `Result` boundary over `@huggingface/transformers`. In a browser bundle keep the core facade-agnostic and load the Node side via `webpackIgnore` dynamic import. |

---
