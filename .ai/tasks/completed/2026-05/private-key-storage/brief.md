# Stream brief: `private-key-storage`

**Status:** 🟢 ready to commission
**Integration branch:** `private-key-storage` (off `release`) → squash to `release` at close
**Workflow shape:** single implementation PR onto integration branch (both impls together)
**Package surface:** `@fgv/ts-extras/crypto-utils` (Node — encrypted-file impl) + `@fgv/ts-web-extras/crypto-utils` (browser — IndexedDB impl) + `.ai/instructions/LIBRARY_CAPABILITIES.md`

---

## Mission

Close the long-standing `IPrivateKeyStorage` implementation gap in the published fgv packages. Ship the two impls the existing JSDoc *promises* but doesn't deliver:

- **`IdbPrivateKeyStorage`** in `@fgv/ts-web-extras/crypto-utils` — IndexedDB-backed; stores `CryptoKey` objects directly; `supportsNonExtractable: true`.
- **`EncryptedFilePrivateKeyStorage`** (name TBD) in `@fgv/ts-extras/crypto-utils` — directory-on-disk; one file per stored key; AES-256-GCM-encrypted JWK content; `supportsNonExtractable: false` (Node `CryptoKey` round-trips via JWK).

**Origin.** Cross-repo gap surfaced 2026-05-28 by a hardback agent: `KeyStore.addKeyPair` fails with `'No private key storage configured'` unless the consumer supplies an `IPrivateKeyStorage` backend, and ts-extras ships only the interface. The JSDoc on `privateKeyStorage.ts:25-27` claims impls live in `@fgv/ts-web-extras` and `@fgv/ts-chocolate` — neither is true today. Textbook L18 (docs describe design intent, not shipped behavior); textbook gap-then-fix (consumer "would have rolled their own"; we ship in fgv so every consumer benefits + the JSDoc becomes accurate).

**Status of the gap today (verified against code):**
- `libraries/ts-extras/src/packlets/crypto-utils/keystore/privateKeyStorage.ts` — interface-only.
- `libraries/ts-extras/src/packlets/crypto-utils/keystore/keyStore.ts:922-924` — `addKeyPair` hard-fails without a backend.
- `libraries/ts-web-extras/src/packlets/crypto-utils/` — has only `browserCryptoProvider.ts` + `browserHashProvider.ts`. **No** `IdbPrivateKeyStorage`.
- `@fgv/ts-chocolate` is not in the fgv monorepo; the `IdbPrivateKeyStorage` reference the JSDoc cites lives in chocolate-lab's *consumer* code (`chocolate-lab-ui`), not in any published fgv package.

---

## Locked design — both impls

Each impl satisfies the `IPrivateKeyStorage` interface verbatim (no interface changes). Result-pattern conformant; storage operations return `Promise<Result<...>>`.

### `IdbPrivateKeyStorage` (browser — `@fgv/ts-web-extras/crypto-utils`)

```typescript
interface IIdbPrivateKeyStorageCreateParams {
  /** IDB database name. Default: 'fgv-keystore-private-keys'. */
  readonly databaseName?: string;
  /** IDB object-store name. Default: 'privateKeys'. */
  readonly storeName?: string;
}

class IdbPrivateKeyStorage implements IPrivateKeyStorage {
  public static create(params?: IIdbPrivateKeyStorageCreateParams): Result<IdbPrivateKeyStorage>;
  public readonly supportsNonExtractable: true;
  public store(id: string, key: CryptoKey): Promise<Result<string>>;
  public load(id: string): Promise<Result<CryptoKey>>;
  public delete(id: string): Promise<Result<string>>;
  public list(): Promise<Result<readonly string[]>>;
}
```

- IDB stores `CryptoKey` objects **directly** (structured-clone, no JWK round-trip). `supportsNonExtractable = true` enables non-extractable keys for max security on browsers that support it.
- Lazy DB open + schema migration (current schema version stored in IDB; future migrations additive).
- Per-call transactions; default IDB serialization semantics (good enough for single-tab use). Multi-tab concurrency is a known limit; document it.
- `load(missingId)` → `Result.fail` with "key not found".
- All ops are `Promise<Result<T>>`; never throw across the boundary (use `captureAsyncResult` for IDB request failures).

### `EncryptedFilePrivateKeyStorage` (Node — `@fgv/ts-extras/crypto-utils`)

```typescript
interface IEncryptedFilePrivateKeyStorageCreateParams {
  /** Directory holding the encrypted private-key files. */
  readonly directory: string;
  /** AES-256-GCM key used to encrypt each file's JWK content. Consumer-provided. */
  readonly encryptionKey: CryptoKey;
  /** Crypto provider used for encrypt/decrypt + JWK import/export. */
  readonly cryptoProvider: ICryptoProvider;
  /** Optional FileTree override; defaults to FsTree (Node filesystem). */
  readonly tree?: IFileTreeRootItem;
}

class EncryptedFilePrivateKeyStorage implements IPrivateKeyStorage {
  public static create(params: IEncryptedFilePrivateKeyStorageCreateParams): Result<EncryptedFilePrivateKeyStorage>;
  public readonly supportsNonExtractable: false;
  // ... interface methods as above
}
```

- One file per stored key, named by `id` (id-sanitization required; reject `/`, `..`, etc. — surface as design call if any in-band id format conflicts with safe filenames).
- File content: AES-256-GCM-encrypted JWK of the private key. JWK round-trip via the supplied `ICryptoProvider` (`exportPublicKeyJwk` is for public — for private, use the Subtle `crypto.subtle.exportKey('jwk', key)` path; the provider's existing `encrypt`/`decrypt` handles AES-GCM).
- **Consumer supplies the encryption key.** The KeyStore-level password derivation is the consumer's responsibility — typically the same password-derived key the KeyStore vault uses, but kept explicit so the impl stays decoupled. This is the load-bearing design call: **DO NOT** bake password-derivation into this impl; take a `CryptoKey` for AES-256-GCM.
- Uses `FileTree` (default `FsTree`) for I/O — consistent with the rest of fgv (per `/filetree-io` skill); enables in-memory testing without touching disk.
- `supportsNonExtractable: false` is mandatory — Node CryptoKey isn't structured-cloneable to disk; must round-trip via JWK, which requires extractable keys.
- Single-process assumption (no inter-process locking); document.

### The interface stays unchanged

`IPrivateKeyStorage` itself is **not** modified. Both impls satisfy the existing contract verbatim. (If the agent discovers a real interface gap during implementation — surface; the interface is canonical and changing it ripples.)

### JSDoc fix (load-bearing — closes the L18 gap)

Update `libraries/ts-extras/src/packlets/crypto-utils/keystore/privateKeyStorage.ts:25-27` to point at the **actual shipping locations**:
- `@fgv/ts-web-extras/crypto-utils` for `IdbPrivateKeyStorage`
- `@fgv/ts-extras/crypto-utils` for `EncryptedFilePrivateKeyStorage`

Remove the now-incorrect `@fgv/ts-chocolate` reference (chocolate-lab's consumer-side impl is informational; not the canonical one).

---

## In-scope

- `libraries/ts-extras/src/packlets/crypto-utils/` — new file (e.g. `keystore/encryptedFilePrivateKeyStorage.ts`); barrel export under `CryptoUtils.KeyStore.EncryptedFilePrivateKeyStorage` (or wherever matches the existing keystore module layout).
- `libraries/ts-web-extras/src/packlets/crypto-utils/` — new file (e.g. `idbPrivateKeyStorage.ts`); barrel export.
- `libraries/ts-extras/src/packlets/crypto-utils/keystore/privateKeyStorage.ts` — JSDoc fix.
- Tests in both packages — 100% coverage. Web tests use `fake-indexeddb` (already in `ts-web-extras` test deps per the existing browser tests).
- `libraries/ts-extras/etc/ts-extras.api.md` + `libraries/ts-web-extras/etc/ts-web-extras.api.md` — regenerated.
- `.ai/instructions/LIBRARY_CAPABILITIES.md` — add both impls under the KeyStore decision-shortcuts and the crypto-utils packlet entries.
- `common/changes/@fgv/ts-extras/` + `common/changes/@fgv/ts-web-extras/` — rush change files (`minor`; pure-additive).

## Out-of-scope

- Changing the `IPrivateKeyStorage` interface (canonical; surface if a real gap).
- Changing `KeyStore.addKeyPair` semantics (works against the new impls without changes).
- Multi-process / multi-tab concurrency (single-tab/single-process assumption; document as known limit).
- Schema-migration story beyond v1 (additive future migrations; not v1 scope).
- Password-derivation helper for the file impl's encryption key (consumer concern; the impl takes a `CryptoKey` directly).
- `@fgv/ts-chocolate` — out of scope; not in this monorepo.

## Acceptance criteria

- [ ] `IdbPrivateKeyStorage` ships in `@fgv/ts-web-extras/crypto-utils` satisfying `IPrivateKeyStorage`; `supportsNonExtractable: true`; lazy DB open; default/configurable db/store names.
- [ ] `EncryptedFilePrivateKeyStorage` ships in `@fgv/ts-extras/crypto-utils` satisfying `IPrivateKeyStorage`; `supportsNonExtractable: false`; consumer-supplied encryption `CryptoKey` (no in-band password derivation); FileTree-based I/O.
- [ ] **Integration test**: each impl wired into `KeyStore.addKeyPair` end-to-end — generate keypair → store private → retrieve via `KeyStore.getKeyPair` (or whatever the read path is) → sign/verify or wrap/unwrap to prove the loaded key works.
- [ ] `IPrivateKeyStorage` JSDoc updated to point at the new shipping locations; `@fgv/ts-chocolate` reference removed.
- [ ] `rush build` full repo clean; `rushx lint` clean in both packages (separate gate); `rushx fixlint` before final commit.
- [ ] `rushx test` 100% coverage all 4 metrics in both packages. Cover: store/load/delete/list happy path; load-missing → fail; delete-missing → fail or no-op (pick one — surface if ambiguous); list after stores/deletes returns correct ids; concurrent ops on the same id (define semantics); IDB schema-version handling; file-impl encryption round-trip; file-impl id-sanitization rejects unsafe ids.
- [ ] api-extractor regenerated in both packages.
- [ ] Rush change files (`minor`) in both packages.
- [ ] LIBRARY_CAPABILITIES updated.
- [ ] No `any`; no unsafe casts; no `Result<void>`.
- [ ] `result.md` written; substrate migrated to `.ai/tasks/completed/2026-05/private-key-storage/` with polished README, in the implementation PR (before the squash).

## Required reading

1. This brief.
2. `libraries/ts-extras/src/packlets/crypto-utils/keystore/privateKeyStorage.ts` — the interface contract you're implementing. Note the storage-first / vault-second ordering described in the JSDoc — your impls don't drive that ordering (`KeyStore` does), but understand it.
3. `libraries/ts-extras/src/packlets/crypto-utils/keystore/keyStore.ts:915-960` (`addKeyPair`) + the read path — understand how the keystore drives `IPrivateKeyStorage.store`/`load`/`delete`, what `id` shape it passes, and how it correlates to vault entries.
4. `libraries/ts-extras/src/packlets/crypto-utils/model.ts` (the `ICryptoProvider` interface — `encrypt`/`decrypt`/`generateRandomBytes`).
5. `libraries/ts-extras/src/packlets/crypto-utils/nodeCryptoProvider.ts` + `libraries/ts-web-extras/src/packlets/crypto-utils/browserCryptoProvider.ts` — runtime-specific provider code; how AES-256-GCM is used.
6. Existing FileTree-using code in ts-extras for I/O patterns (`/filetree-io` skill).
7. `CLAUDE.md` + `.ai/instructions/ACTIVE_DEVELOPMENT.md` — note: `ts-extras` crypto surface is **established** (not active-dev). Additive only; no breaking changes. `ts-web-extras` is active-dev but this addition is also pure-additive.

## Skills to load

| When | Skill |
|---|---|
| Before any Result-returning code | `/result-pattern` (especially `captureAsyncResult` for IDB and async file ops) |
| Before writing tests | `/result-tests` |
| Before any file I/O | `/filetree-io` |
| Before reaching for utility code | `/published-primitives-reflex` |

## Stop-and-surface

- The file impl's `id`-sanitization needs to reject ids that would escape the storage directory (`/`, `..`, etc.). If `KeyStore`'s `addKeyPair` passes ids that don't fit the safe-filename set, surface — we may need an internal mapping layer (e.g. base64url of the id) rather than rejecting consumer-visible ids.
- The IDB impl needs `fake-indexeddb` or equivalent for tests; if it's not already a test dep on `@fgv/ts-web-extras`, surface (it likely is — the existing browser tests probably use it).
- The Node `crypto.subtle.exportKey('jwk', privateKey)` path requires the key to be `extractable: true`. Confirm that's how `KeyStore.addKeyPair` generates keys when `supportsNonExtractable: false` (it should, per the brief's read of the code).
- The interface's "storage-first, vault-second" ordering claim in the JSDoc — if the impls' tests can't observe that ordering reliably, surface; it's the keystore's contract, not the impl's, but the impls need to behave correctly under partial-failure scenarios.

## fgv-conventions pre-load (per L22)

- No sibling-package re-exports — the IDB impl in `ts-web-extras` imports `IPrivateKeyStorage` directly from `@fgv/ts-extras` (where the interface lives).
- All fallible ops return `Result<T>`; no `Result<void>`; `captureAsyncResult` for async upstream (IDB requests, file I/O) wrapping.
- `@fgv/ts-extras` crypto surface is **established** — additive only; no changes to existing exports, the interface, or `KeyStore.addKeyPair`.
- `rushx lint` is a separate gate from `rushx build`.

## Branch + PR posture

- **Integration branch:** `private-key-storage` (off `release`). Work targets it, NOT `release`.
- **Work branch stem:** `feat/private-key-storage` (harness may suffix; record in state.md).
- **PR target:** `private-key-storage`.
- **PR title:** `feat(crypto-utils): IdbPrivateKeyStorage + EncryptedFilePrivateKeyStorage`
- **Close (orchestrator-handled):** squash `private-key-storage` → `release` after gates pass + substrate migrated.

---

## Downstream

After ship: handoff-back note appended to the logging-observability cross-repo reply (`.ai/notes/cross-repo-handoffs/...`) noting the IPKS impls landed in the next alpha — closes the gap hardback surfaced.
