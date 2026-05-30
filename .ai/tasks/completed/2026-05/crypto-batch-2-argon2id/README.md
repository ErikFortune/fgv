# Stream: crypto-batch-2-argon2id

**Completed:** 2026-05-12  
**Branch:** `claude/crypto-batch-2-argon2id-impl-bOXwM`  
**PR target:** `claude/crypto-batch-2-features`

---

## What was delivered

### New packages

| Package | Purpose |
|---------|---------|
| `@fgv/ts-extras-argon2` | Node.js Argon2id provider — `NodeArgon2Provider` backed by `argon2` (kelektiv v0.44.0) |
| `@fgv/ts-web-extras-argon2` | Browser/WASM Argon2id provider — `BrowserArgon2Provider` backed by `hash-wasm` v4.12.0 |

Both implement `CryptoUtils.IArgon2idProvider` from `@fgv/ts-extras`. Output is byte-identical for the same inputs, verified by RFC 9106 §B.3 parameter set test vector and a 7-case parameter sweep.

### Changes to `@fgv/ts-extras`

- **`crypto-utils/model.ts`**: Added `IArgon2idProvider`, `IArgon2idParams`, `ARGON2ID_OWASP_MIN`, `ARGON2ID_PASSPHRASE`; converted `IKeyDerivationParams` to a discriminated union (`'pbkdf2'` | `'argon2id'`)
- **`crypto-utils/converters.ts`**: Added `pbkdf2KeyDerivationParams`, `argon2idKeyDerivationParams`, `keyDerivationParams` converters
- **`crypto-utils/keystore/keyStore.ts`**: Added `addSecretFromPasswordArgon2id`, `verifySecretFromPasswordArgon2id`

### Documentation

- `LIBRARY_CAPABILITIES.md` updated with entries for both new packages, updated `crypto-utils` section, new `IArgon2idProvider` cross-runtime interface row, and Argon2id decision shortcuts

---

## Test coverage

All packages ship at 100% coverage (branches, functions, lines, statements).

| Package | Tests |
|---------|-------|
| `@fgv/ts-extras` | 100% — includes `keyStoreArgon2id.test.ts` (20 tests for new KeyStore methods) and `converters.test.ts` additions |
| `@fgv/ts-extras-argon2` | 13 NodeArgon2Provider unit tests + 8 cross-runtime equivalence tests |
| `@fgv/ts-web-extras-argon2` | 12 BrowserArgon2Provider unit tests |

---

## Cross-runtime equivalence

RFC 9106 §B.3 parameter set (t=3, m=32, p=4, password=32×0x01, salt=16×0x02, no secret/AD) produces:

```
03aab965c12001c9d7d0d2de33192c0494b684bb148196d73c1df1acaf6d0c2e
```

Both `NodeArgon2Provider` and `BrowserArgon2Provider` agree on this output.

---

## Key decisions

- **Node library:** `argon2` (kelektiv) v0.44.0 — native performance, raw bytes via `raw: true`
- **Browser library:** `hash-wasm` v4.12.0 — pure WASM, no Web Crypto dependency, runs in Node (enabling plain Jest cross-runtime tests)
- **`IArgon2idProvider` is standalone** — not injected into `ICryptoProvider`; explicit opt-in at call sites
- **OWASP preset constants** (`ARGON2ID_OWASP_MIN`, `ARGON2ID_PASSPHRASE`) exported for consumer guidance
- **`parallelism > 1` in WASM**: JSDoc warning only — no runtime log; output is still correct
