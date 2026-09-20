# `@fgv/ts-web-extras-argon2` — Browser/WASM Argon2id provider

> **This file is authoritative for what ``@fgv/ts-web-extras-argon2`` provides and what not to hand-roll.**
> `README.md`, where present, is getting-started material. The always-loaded index at
> [`.ai/instructions/LIBRARY_CAPABILITIES.md`](../../.ai/instructions/LIBRARY_CAPABILITIES.md)
> routes here; it never duplicates this content.


---

[libraries/ts-web-extras-argon2](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-web-extras-argon2)

`BrowserArgon2Provider` — pure-WASM implementation of `IArgon2idProvider` backed by `hash-wasm`. No Web Crypto dependency; runs identically in browsers and Node.js. The WASM engine does not spawn threads — `parallelism` affects the hash value but execution is always sequential; recommend `parallelism: 1` for browser use unless you need server/client key-derivation agreement with a server that uses a different parallelism. **Output is byte-identical to `NodeArgon2Provider` for the same inputs and parameters**, verified by the cross-runtime test suite in `ts-extras-argon2`.

---

## Decision shortcuts

- **Need an Argon2id provider (browser / WASM)?** → `BrowserArgon2Provider.create()` from `@fgv/ts-web-extras-argon2`.

---

## Recent additions

*Newest first. **Generated** — see the repo index; do not hand-edit inside the markers.*

<!-- BEGIN GENERATED: recent-additions -->

- **2026-05** — Both implement `CryptoUtils.IArgon2idProvider` from `@fgv/ts-extras`. Output is byte-identical for the same inputs, verified by RFC 9106 §B.3 parameter set test vector and a 7-case parameter sweep. ([#344](https://github.com/ErikFortune/fgv/pull/344))

<!-- END GENERATED: recent-additions -->
