# KeyStore — Asymmetric Keypair Support

Status: completed
Owner library: `@fgv/ts-extras` (interface + algorithm wiring only)
Related downstream consumers: `@fgv/ts-web-extras` (browser IDB backend),
`@fgv/ts-chocolate` (Node encrypted-file backend) — separate follow-on tasks

## Goal

Extend `KeyStore` to support asymmetric keypairs. The vault entry stays
portable (public key as JWK, persisted in the existing encrypted vault).
Private key persistence is delegated to a pluggable, platform-specific
`IPrivateKeyStorage` provider supplied at construction time.

## Non-goals

- **Concrete backend implementations.** Browser IDB and Node encrypted-file
  backends are separate tasks owned by `@fgv/ts-web-extras` and
  `@fgv/ts-chocolate` respectively. This plan delivers only the
  `@fgv/ts-extras` interface, model changes, and `KeyStore` API.
- **Generic crypto wrapper.** `KeyStore` does not become a general-purpose
  asymmetric crypto API. Sign/verify/encrypt/decrypt are out of scope.
  Callers receive `CryptoKey` handles and use `crypto.subtle` directly for
  operations.
- **Backwards-compatible entry shape.** The internal entry model becomes
  a discriminated union. The public `getSecret` API is preserved for
  symmetric entries; asymmetric entries require `getKeyPair`. See
  [API Surface](#api-surface).
- **Vault format migration tooling.** The new vault format is a strict
  superset (new `'asymmetric-keypair'` discriminator value). Old vaults
  load unchanged. There is no need for a migration utility.

---

## Design Decisions

### 1. Orphan / transactionality model: **storage-first, vault-as-source-of-truth**

Writes always hit `IPrivateKeyStorage` first, then the vault. Deletes hit
the vault first, then storage. The vault is the canonical record of which
keypairs the user owns; orphaned blobs in storage are a recoverable
garbage-collection problem.

- `addKeyPair`: `IPrivateKeyStorage.store(id, privateKey)` → write vault
  entry → mark dirty. If the storage write fails, no vault entry is
  written and the operation returns `Failure`. If `KeyStore.save()` is
  never called (or the process crashes before save), the storage blob is
  orphaned. **This is documented behavior, not a bug.**
- `removeSecret` for asymmetric entries: remove vault entry → call
  `IPrivateKeyStorage.delete(id)` (best-effort). If the storage delete
  fails, log/return-with-warning but still report the vault removal as
  successful. The user wanted the entry gone; an orphaned blob is
  recoverable.

`IPrivateKeyStorage.list()` exists specifically to enable consumer-side
GC. The keystore itself does not invoke it automatically.

### 2. Algorithm surface: **small enum, mapped internally**

Public API takes a `KeyPairAlgorithm` enum, not raw WebCrypto algorithm
objects. Initial values:

```typescript
export type KeyPairAlgorithm =
  | 'ecdsa-p256'      // signing — ECDSA over P-256
  | 'rsa-oaep-2048';  // encryption — RSA-OAEP, 2048-bit, SHA-256
```

These are the two we actually need for the first downstream use case. We
add new values as needed; we do not pre-build for hypothetical algorithms.

The internal `_algorithmToParams` mapping owns:
- WebCrypto `AlgorithmIdentifier` (e.g. `{ name: 'ECDSA', namedCurve: 'P-256' }`)
- Default `usages` array (e.g. `['sign', 'verify']` for ECDSA)
- Whether the platform must generate as `extractable: true` or can use
  `extractable: false` — controlled by a constructor option on
  `IPrivateKeyStorage` (see [Backend contract](#backend-contract)).

### 3. Asymmetric crypto goes through `ICryptoProvider`

`ICryptoProvider` is extended with three asymmetric methods:

```typescript
generateKeyPair(
  algorithm: KeyPairAlgorithm,
  extractable: boolean
): Promise<Result<CryptoKeyPair>>;

exportPublicKeyJwk(publicKey: CryptoKey): Promise<Result<JsonWebKey>>;

importPublicKeyJwk(
  jwk: JsonWebKey,
  algorithm: KeyPairAlgorithm
): Promise<Result<CryptoKey>>;
```

Rationale: keeps the existing test-substitution pattern intact and
matches how symmetric crypto is already abstracted. Both Node and
browser provider implementations are thin wrappers over `crypto.subtle`,
which is identical on both platforms (Node 20+).

### 4. Async API split is acknowledged and documented

Existing sync vault accessors (`getSecret`, `hasSecret`, `listSecrets`,
`listSecretsByType`, `renameSecret`, `removeSecret`) remain sync **except
where they must touch `IPrivateKeyStorage`**:

- `removeSecret` becomes **async** (breaking change — see
  [Breaking Changes](#breaking-changes)). It calls
  `IPrivateKeyStorage.delete(id)` for asymmetric entries.
- `getKeyPair` is async (loads from `IPrivateKeyStorage`).
- `getSecret`, `getPublicKeyJwk`, `listSecrets*`, `hasSecret`,
  `renameSecret` remain sync. Vault metadata is in memory; rename
  doesn't touch storage because `id` (the storage handle) is independent
  of `name`.

### 5. Entry shape: **discriminated union**

The existing `IKeyStoreSecretEntry.key: Uint8Array` shape doesn't fit
asymmetric entries (which have `{ id, publicKeyJwk }` and no in-memory
private key bytes). The internal model becomes:

```typescript
export type IKeyStoreEntry =
  | IKeyStoreSymmetricEntry
  | IKeyStoreAsymmetricEntry;

export interface IKeyStoreSymmetricEntry {
  readonly name: string;
  readonly type: 'encryption-key' | 'api-key';
  readonly key: Uint8Array;
  readonly description?: string;
  readonly createdAt: string;
}

export interface IKeyStoreAsymmetricEntry {
  readonly name: string;
  readonly type: 'asymmetric-keypair';
  readonly id: string;            // immutable handle for IPrivateKeyStorage
  readonly algorithm: KeyPairAlgorithm;
  readonly publicKeyJwk: JsonWebKey;
  readonly description?: string;
  readonly createdAt: string;
}
```

Same union shape for the JSON variant (`IKeyStoreEntryJson`). The
existing `IKeyStoreSecretEntry` type alias is preserved as
`IKeyStoreSymmetricEntry` for backwards compatibility (see
[Breaking Changes](#breaking-changes)).

### 6. `id` vs `name`: separate concerns

`name` is the user-facing handle (renameable, used for vault lookup).
`id` is the immutable handle for `IPrivateKeyStorage` (UUID, never
visible to users, never changes). `renameSecret` on an asymmetric entry
must not touch `id` — the storage handle survives rename.

### 7. CryptoKey memory lifecycle: **never cache private keys**

`getKeyPair` always loads from `IPrivateKeyStorage` on every call. The
keystore does not retain private `CryptoKey` references between calls.

- Avoids the "how do you zero a CryptoKey on `lock()`" problem (you
  can't — `CryptoKey` doesn't expose bytes).
- Public keys can be re-imported from JWK on demand; caching them is a
  perf decision left for later.
- A consumer that needs to perform many operations on the same private
  key can hold the `CryptoKey` reference itself for the duration.

### 8. `addKeyPair` with `replace: true`: **mint a fresh `id`, best-effort delete the old blob**

When `addKeyPair(name, { replace: true })` targets an existing
asymmetric entry, the operation:

1. Generates a fresh `id` (does not reuse the existing one).
2. Stores the new private key under the new `id`.
3. Overwrites the vault entry to point at the new `id`.
4. Best-effort calls `privateKeyStorage.delete(oldId)`. Failure here is
   logged in the returned message but does not roll back the
   replacement — the user got the new keypair they asked for, and the
   stale blob is reconciled by GC like any other orphan.

Rationale: this is consistent with the rest of the orphan model
(storage-first writes; vault is the source of truth; orphans are
recoverable). The alternative of reusing the existing `id` and
overwriting in storage would tie the storage handle's lifetime to
vault entry identity in a way that nothing else in this design does.
Refusing to replace at all would break parity with `addSecret`'s
`replace` semantics for symmetric entries.

For replacement of a symmetric entry with an asymmetric one (or vice
versa), same rule applies: the old entry's resources are released
(storage delete for the asymmetric side; key bytes zeroed for the
symmetric side) and a fresh entry is written.

### 9. No-provider degradation: graceful

A `KeyStore` constructed without `IPrivateKeyStorage` MUST still:
- Open vaults containing asymmetric entries.
- Allow `unlock`, `listSecrets`, `listSecretsByType`, `hasSecret`,
  `getSecret` (returns the metadata-only entry).
- Allow `getPublicKeyJwk` (vault-only data).

It MUST fail clearly on:
- `addKeyPair` → `Failure: 'No private key storage configured'`
- `getKeyPair` → `Failure: 'No private key storage configured'`
- `removeSecret` for an asymmetric entry → vault removal succeeds; the
  storage delete is skipped silently (no provider to delete from).

This matters for the cross-platform story: a vault created on the
browser must open on a Node host that has no IDB equivalent — for
inspection, listing, public-key extraction.

---

## Backend contract

```typescript
export interface IPrivateKeyStorage {
  /**
   * Whether keys generated for this backend may be marked
   * `extractable: false`. True on backends that store CryptoKey objects
   * directly (e.g. IndexedDB). False on backends that must round-trip
   * via JWK (e.g. encrypted-file backends).
   */
  readonly supportsNonExtractable: boolean;

  /** Stores `key` under `id`. Returns the stored `id` on success. */
  store(id: string, key: CryptoKey): Promise<Result<string>>;

  load(id: string): Promise<Result<CryptoKey>>;

  /** Deletes the entry under `id`. Returns the deleted `id` on success. */
  delete(id: string): Promise<Result<string>>;

  /**
   * Lists all stored ids. Used by consumers to garbage-collect orphans
   * left by crashes or aborted sessions. Required (not optional) — the
   * orphan-tolerant transactional model depends on consumer-side GC,
   * which in turn depends on enumeration. Backends that genuinely
   * cannot enumerate (a hypothetical OS-keychain entry without a
   * prefix/owner filter) are out of scope and would warrant a separate
   * non-enumerable interface.
   */
  list(): Promise<Result<readonly string[]>>;
}
```

Per coding standards `Result<void>` is forbidden; `store` and `delete`
return the `id` so they compose into Result chains.

`KeyStore.addKeyPair` consults `supportsNonExtractable` to decide
whether `crypto.subtle.generateKey` is called with `extractable: false`
(browser/IDB) or `extractable: true` (Node/file).

### Threat models per platform

- **Browser:** threat is malicious JS exfiltrating keys.
  `extractable: false` keys in IDB mitigate.
- **Node CLI / service:** threat is unauthorized disk access.
  Encryption-at-rest under the master password mitigates. Extractability
  inside the process doesn't matter — the process is the trust boundary.

Both backends share the property: **the private key never leaves the
user's local environment without an explicit user action.**

---

## API Surface

### New public types (in `model.ts`)

```typescript
export type KeyPairAlgorithm = 'ecdsa-p256' | 'rsa-oaep-2048';

export interface IPrivateKeyStorage { /* see above */ }

export interface IKeyStoreSymmetricEntry { /* see Decision 5 */ }
export interface IKeyStoreAsymmetricEntry { /* see Decision 5 */ }
export type IKeyStoreEntry = IKeyStoreSymmetricEntry | IKeyStoreAsymmetricEntry;

// JSON shapes mirror the runtime shapes.
export interface IKeyStoreSymmetricEntryJson { /* existing shape */ }
export interface IKeyStoreAsymmetricEntryJson { /* { id, algorithm, publicKeyJwk, ... } */ }
export type IKeyStoreEntryJson = IKeyStoreSymmetricEntryJson | IKeyStoreAsymmetricEntryJson;

// Backwards-compatible alias: keep the existing exported name.
export type IKeyStoreSecretEntry = IKeyStoreSymmetricEntry;

export type KeyStoreSecretType =
  | 'encryption-key'
  | 'api-key'
  | 'asymmetric-keypair';
```

`allKeyStoreSecretTypes` updated to include `'asymmetric-keypair'`.

### New `KeyStore` constructor option

```typescript
export interface IKeyStoreCreateParams {
  readonly cryptoProvider: ICryptoProvider;
  readonly iterations?: number;
  readonly privateKeyStorage?: IPrivateKeyStorage;  // new
}

export interface IKeyStoreOpenParams {
  readonly cryptoProvider: ICryptoProvider;
  readonly keystoreFile: IKeyStoreFile;
  readonly privateKeyStorage?: IPrivateKeyStorage;  // new
}
```

### New `KeyStore` methods

```typescript
async addKeyPair(
  name: string,
  options: { algorithm: KeyPairAlgorithm; description?: string; replace?: boolean }
): Promise<Result<IAddKeyPairResult>>;

async getKeyPair(
  name: string
): Promise<Result<{ publicKey: CryptoKey; privateKey: CryptoKey }>>;

getPublicKeyJwk(name: string): Result<JsonWebKey>;
```

`IAddKeyPairResult` mirrors `IAddSecretResult`:

```typescript
export interface IAddKeyPairResult {
  readonly entry: IKeyStoreAsymmetricEntry;
  readonly replaced: boolean;
}
```

### Modified `KeyStore` methods

- `removeSecret(name)` → **breaking: now async**. For asymmetric entries,
  best-effort calls `privateKeyStorage.delete(id)` after vault removal;
  storage failure is logged in the returned message but vault removal
  still succeeds.
- `getSecret(name)` → return type is `IKeyStoreEntry` (the union),
  which is a structural superset of the old `IKeyStoreSecretEntry`
  return type. Existing call sites that read `entry.key` will fail to
  type-check on asymmetric entries; runtime behavior is preserved for
  pre-existing symmetric callers but the discriminator narrowing is now
  required to access `key`.
- `renameSecret(oldName, newName)` → unchanged signature, works
  uniformly for both kinds (asymmetric `id` is preserved).
- `listSecretsByType('asymmetric-keypair')` → works automatically once
  the type is added.

### New converter

`keystoreAsymmetricEntryJson` — `Converters.object` over the asymmetric
JSON shape. The `publicKeyJwk` field uses **shallow structural
validation only**: `{ kty: string, ... }` plus pass-through of remaining
fields. Per-algorithm JWK validation (correct curve params, key sizes,
etc.) is gnarly and not worth re-implementing — the JWK only needs to
round-trip through `crypto.subtle.importKey`, which is the real
validator. If the JWK is malformed, `importPublicKeyJwk` will fail with
a clear error at first use.

`keystoreSecretEntryJson` becomes a discriminated union converter,
discriminated on the `type` field, falling back to symmetric for
missing `type` (backwards compatibility, as today).

---

## Breaking Changes

`@fgv/ts-extras` is treated as production per `ACTIVE_DEVELOPMENT.md`,
so breaking changes need to be deliberate.

1. **`removeSecret` becomes async.** Callers must `await` it. Mitigation:
   the keystore is recently added and downstream usage in this monorepo
   is limited; a search-and-fix is straightforward. There's no
   reasonable sync alternative once `IPrivateKeyStorage.delete` is in
   the picture.

2. **`getSecret` return type widens to `IKeyStoreEntry`.** Existing call
   sites that directly access `entry.key` without checking `entry.type`
   will fail to type-check. Mitigation: this is a TypeScript-only
   change (runtime behavior unchanged for symmetric entries); the fix
   is a one-line type narrowing per call site. We could instead keep
   `getSecret` returning the symmetric-only type and introduce a new
   `getEntry` that returns the union — but that fragments the API and
   the narrowing requirement is the right ergonomics in the long run.

These changes warrant a minor version bump on `@fgv/ts-extras` with a
CHANGELOG entry. (Strict semver would call this a major because
`removeSecret`'s signature changes; minor is the conservative-enough
call given the package's internal use and pre-1.0-style cadence —
revisit if external consumers appear before release.)

---

## Implementation Plan

Order matters for incremental review and test coverage.

1. **Model + converters**
   - Add `KeyPairAlgorithm`, `IPrivateKeyStorage`,
     `IKeyStoreAsymmetricEntry`/`Json`, union types.
   - Update `KeyStoreSecretType` and `allKeyStoreSecretTypes`.
   - Add `keystoreAsymmetricEntryJson` converter; refactor
     `keystoreSecretEntryJson` to discriminated-union form.
   - Tests: round-trip vault contents containing both kinds.

2. **`ICryptoProvider` extension**
   - Add `generateKeyPair`, `exportPublicKeyJwk`,
     `importPublicKeyJwk` to the interface.
   - Implement in the existing Node provider (thin wrapper over
     `crypto.subtle`).
   - Internal `_algorithmToParams` table mapping `KeyPairAlgorithm` →
     WebCrypto params + usages.
   - Tests: each algorithm generates, exports, re-imports cleanly.

3. **`KeyStore` integration**
   - Constructor accepts optional `privateKeyStorage`.
   - `addKeyPair`, `getKeyPair`, `getPublicKeyJwk` implemented per
     [Decisions](#design-decisions).
   - `removeSecret` made async; routes asymmetric removals to
     `privateKeyStorage.delete` (best-effort).
   - `getSecret` returns the union; `_decryptVault` builds typed
     entries based on the discriminator.
   - Tests:
     - Happy paths (add → save → reopen → getKeyPair).
     - No-provider degradation (open + list + getPublicKeyJwk work;
       addKeyPair/getKeyPair fail clearly).
     - Storage-write failure propagates from `addKeyPair`.
     - Storage-delete failure on `removeSecret` does not block vault
       removal.
     - `addKeyPair({ replace: true })` on an existing asymmetric entry
       mints a fresh `id`, points the vault at it, and best-effort
       deletes the old storage blob; storage-delete failure is
       reported but does not roll back.
     - `addKeyPair({ replace: true })` replacing a symmetric entry
       (and the symmetric `addSecret({ replace: true })` replacing an
       asymmetric entry) cleans up the displaced entry's resources
       correctly.
     - Rename of an asymmetric entry preserves `id`.
     - Backwards compatibility: existing vaults open unchanged.

4. **Test helper: in-memory `IPrivateKeyStorage`**
   - A `Map<string, CryptoKey>`-backed implementation lives in the
     test tree (not exported), used by all keystore tests that exercise
     asymmetric flows. A reference implementation that downstream
     packages can copy if useful, but not part of the public API of
     `@fgv/ts-extras`.

---

## Crash-window contract

With storage-first writes, the following sequences leave orphaned blobs
in `IPrivateKeyStorage`:

- `addKeyPair` succeeds → process exits before `save()` is called.
- `addKeyPair` succeeds → `lock(force: true)` is called.
- `addKeyPair` succeeds → `removeSecret` deletes the vault entry but
  the storage delete fails.

These are **acceptable, documented properties** of the design.
Reconciliation is the consumer's responsibility, performed via
`IPrivateKeyStorage.list()` cross-referenced against
`KeyStore.listSecretsByType('asymmetric-keypair')` (which yields
names; `getSecret` then yields each entry's `id`).

This is not a bug. It is the price of avoiding a stop-the-world
"transaction" abstraction across two unrelated stores.

---

## Open Questions

- **Should `KeyStore` expose a `gcOrphans()` convenience method that
  uses `list()` + the vault to delete orphans?** Probably yes, but it's
  cheap to add later and not blocking for the first pass. Defer.
