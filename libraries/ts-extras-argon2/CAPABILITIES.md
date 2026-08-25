# `@fgv/ts-extras-argon2` — Node Argon2id provider

> **This file is authoritative for what ``@fgv/ts-extras-argon2`` provides and what not to hand-roll.**
> `README.md`, where present, is getting-started material. The always-loaded index at
> [`.ai/instructions/LIBRARY_CAPABILITIES.md`](../../.ai/instructions/LIBRARY_CAPABILITIES.md)
> routes here; it never duplicates this content.


---

[libraries/ts-extras-argon2](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras-argon2)

`NodeArgon2Provider` — Node.js implementation of `IArgon2idProvider` backed by the `argon2` (kelektiv) native binding. Use `NodeArgon2Provider.create()` and pass the instance to `KeyStore.addSecretFromPasswordArgon2id` / `verifySecretFromPasswordArgon2id`. Also re-exports `CryptoUtils` from `@fgv/ts-extras` for consumer convenience. **Node-only; for browser use `@fgv/ts-web-extras-argon2` instead.**

---

## Decision shortcuts

- **Need an Argon2id provider (Node)?** → `NodeArgon2Provider.create()` from `@fgv/ts-extras-argon2`.

---

## Recent additions

*Newest first. Populated from each stream's `summary.sourceLine` — see the split brief's phase 2.*
