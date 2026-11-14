# Stream result: `private-key-storage`

**Status:** ✅ implemented — gates green
**Integration branch:** `private-key-storage` (off `release`) → squash to `release` at close
**Work branch:** `claude/epic-hawking-4FMka` (harness-assigned) → PR targets `private-key-storage`

---

## What shipped

Closed the `IPrivateKeyStorage` implementation gap by shipping both backends the JSDoc promised but didn't deliver, plus the JSDoc fix.

### `EncryptedFilePrivateKeyStorage` (`CryptoUtils.KeyStore` from `@fgv/ts-extras`)

`libraries/ts-extras/src/packlets/crypto-utils/keystore/encryptedFilePrivateKeyStorage.ts`

- `create({ directory, encryptionKey, cryptoProvider, tree? }): Result<EncryptedFilePrivateKeyStorage>`.
- `supportsNonExtractable: false` — private keys round-trip via `crypto.subtle.exportKey('jwk', ...)` / `importKey('jwk', ...)`, which requires `extractable: true` keys (the keystore generates them accordingly).
- One file per key (`<id>.json`); content is an AES-256-GCM-encrypted envelope `{ algorithm, jwk }` produced via the existing `createEncryptedFile` / `tryDecryptFile` primitives. The key's `KeyPairAlgorithm` is derived from `key.algorithm.name` at store time and stored so the right import params are used on load.
- I/O through `FileTree` (default `FsTree` via `forFilesystem`, overridable with `tree` for in-memory tests or other Node-compatible backends). **Node-only** — round-trips keys through `node:crypto`, so it is excluded from the browser barrel; browser consumers use `IdbPrivateKeyStorage`.
- Private-key import usages are derived by filtering the algorithm's keypair usages down to the private-applicable set (drops `verify`/`encrypt`/`wrapKey`).

### `IdbPrivateKeyStorage` (`CryptoUtils` from `@fgv/ts-web-extras`)

`libraries/ts-web-extras/src/packlets/crypto-utils/idbPrivateKeyStorage.ts`

- `create({ databaseName?, storeName?, indexedDB? }): Result<IdbPrivateKeyStorage>` (defaults `'fgv-keystore-private-keys'` / `'privateKeys'`).
- `supportsNonExtractable: true` — stores `CryptoKey` objects directly via IndexedDB structured-clone; no JWK round-trip.
- Lazy DB open (cached connection); the object store is created in the `onupgradeneeded` hook (the additive-migration seam). A custom `storeName` against a pre-existing database triggers a version-bump re-open to add the store. Per-call transactions; readwrite ops await `oncomplete` for durability.

### JSDoc fix

`privateKeyStorage.ts:23-30` now points at the two real impls and drops the `@fgv/ts-chocolate` reference (closes the L18 doc-vs-shipped gap).

---

## Signature deltas from the brief (surfaced)

1. **File impl `encryptionKey: Uint8Array`, not `CryptoKey`.** `ICryptoProvider.encrypt`/`decrypt` (the established surface) operate on a raw 32-byte `Uint8Array`; there is no CryptoKey-based AES-GCM path. Taking a `Uint8Array` matches the provider, `INamedSecret.key`, and `createEncryptedFile`'s `key` param, and avoids requiring an extractable AES key. Validated to be 32 bytes at `create`.
2. **File impl `tree?: FileTree.IFileTreeDirectoryItem`** (the brief said `IFileTreeRootItem`, which is not a real exported type). The root directory item is the correct shape; when supplied it is used directly and `directory` is ignored.
3. **IDB impl added optional `indexedDB?: IDBFactory`** to the create params (additive). Defaults to `globalThis.indexedDB`; enables clean dependency injection for tests (`fake-indexeddb`) and non-default factories without mutating globals.

The `IPrivateKeyStorage` interface itself is unchanged.

---

## id-sanitization (file impl)

Resolved by **rejection**, not mapping. Ids must match `^[A-Za-z0-9._-]+$` and not be `.`/`..`; anything else fails with `invalid storage id`. The keystore mints UUIDv4 handles, which always pass, so the real driver is never affected — and the acceptance test "rejects unsafe ids" is satisfied directly. (`store`/`load`/`delete` all reject before touching the tree.)

## delete-missing semantics

Both impls **fail** on a missing id (`key not found: '<id>'`), kept consistent across backends. The IDB impl does an existence check in a separate read transaction before deleting (avoids the IDB auto-commit pitfall of awaiting between requests in one transaction).

## IDB schema-version handling

Nothing unexpected. The IndexedDB database version *is* the schema version; v1 creates the object store in `onupgradeneeded`. The defensive "store already exists" guard was dropped (unreachable at v1) in favor of a clean, fully-covered create + a comment marking the future-migration seam.

---

## Gates

- `rush build` — clean across the full repo (api-extractor regenerated both `etc/*.api.md`).
- `rushx lint` — clean in both packages (`rushx fixlint` run before final commit).
- `rushx test` — **100% statements/branches/functions/lines** in `encryptedFilePrivateKeyStorage.ts` and `idbPrivateKeyStorage.ts`; full suites pass (ts-extras 1372, ts-web-extras 476).
- Integration tests per impl: each wired through `KeyStore.addKeyPair` → `getKeyPair` → sign/verify end-to-end.
- No `any`, no unsafe casts, no `Result<void>`.
- `minor` rush change files added for both packages; LIBRARY_CAPABILITIES updated (packlet entries, decision-shortcut, cross-runtime table).

### Defensive-code coverage directives

A small number of `c8 ignore` directives mark genuinely-unreachable defensive branches: provider-encrypt failure, read-only-adapter mutability guards (the `FileTree` type-guard always passes for mutable in-memory/fs items but is required for type-narrowing), unparseable-file read error, and IndexedDB environment-level open/request errors. All are error-propagation paths that require a corrupted runtime to hit.

### Test-environment note (IDB)

The jsdom test environment lacks `structuredClone` (which `fake-indexeddb` uses). The IDB test installs a minimal identity-clone polyfill — sufficient because `CryptoKey` is immutable and real browsers provide the genuine deep `structuredClone` the impl relies on. `fake-indexeddb` was added as a `ts-web-extras` dev dependency (it was **not** already present, contrary to the brief's assumption).

---

## Cross-repo handoff-back (hardback)

The gap hardback surfaced (`KeyStore.addKeyPair` → `'No private key storage configured'`) is closed: ship `EncryptedFilePrivateKeyStorage` (Node) or `IdbPrivateKeyStorage` (browser) as the `privateKeyStorage` backend in the next alpha. Both land additively on the established ts-extras crypto surface — no interface or `addKeyPair` semantic changes.

---

## Follow-ups (for orchestrator triage)

### TECH_DEBT candidate: `captureAsyncResult` should return `AsyncResult<T>`, not `Promise<Result<T>>`

`captureAsyncResult` (in `@fgv/ts-utils`, `base/result.ts`) currently returns a bare
`Promise<Result<T>>`. Its sibling `AsyncResult<T>` is already `@public`, in the api
surface, implements `PromiseLike<Result<T>>`, and is the canonical chainable async-Result
type. Because the factory hands back a plain Promise, callers cannot fluently chain
(`.onSuccess`/`.thenOnSuccess`/`.withErrorFormat`) off a `captureAsyncResult(...)` result —
they must `await` and re-wrap, or seed an awkward `succeed(x).thenOnSuccess(() =>
captureAsyncResult(...))`. This stream hit it in
`encryptedFilePrivateKeyStorage._encryptAndWrite` (the `succeed(key).thenOnSuccess(...)`
seed) and a few other spots.

- **Proposed change:** `captureAsyncResult<T>(func): AsyncResult<T>` (wrap the existing
  internal promise in `new AsyncResult(...)`).
- **Compatibility:** type-compatible with all existing `await captureAsyncResult(...)`
  call sites (`AsyncResult` is `PromiseLike<Result<T>>`, so `await` still yields
  `Result<T>`). Additive/cleanup for the chained call sites.
- **Blast radius / why deferred:** `@fgv/ts-utils` is the foundational, **established**
  (non-active-dev) surface; ~66 call sites monorepo-wide; lockstep versioning ripples to
  every package. Per `ACTIVE_DEVELOPMENT.md` this is "handle with care / ask first" — it
  deserves its own focused PR with a full-repo rebuild+test sweep, not a rider on a crypto
  feature PR. Surfaced here rather than acted on.

### Process improvement: make "code-reviewer run + resolution" a required PR-description gate

This stream ran `rush build`/`lint`/`test` green and pushed before the first review, then
absorbed **six rounds** of Copilot review comments (browser-barrel `node:crypto` leak; the
`./crypto/keystore` types/JS mismatch; unchecked JWK cast; IDB durability /
version-bump-on-missing-store / stale-cached-handle chain; synchronous-IDB-throw capture;
several doc-accuracy drifts). After all that, a single **`code-reviewer` agent** pass on the
final diff surfaced a coherent, well-prioritized set of findings — the imperative-block
density (chaining refactor), the `key.type`-before-`_algorithmOf` ordering, the
`importPublicKey`-for-private-key doc-accuracy gap, and the resolvable api-extractor link
warnings — most of which are exactly the repo-pattern/edge-case classes the agent is built
for, and several of which would have pre-empted Copilot rounds had it run **before** the
first push.

**Recommendation:** add **"evidence of code-reviewer run and resolution"** as a required
item in the PR-description gate for future features (alongside the existing build/lint/test
acceptance criteria in `CODING_STANDARDS.md`). Running the `code-reviewer` agent on the diff
*before* opening the PR (and again before requesting external/Copilot re-review) converts
multi-round external ping-pong into a single internal pass — cheaper for everyone and keeps
the PR converging instead of oscillating. Concretely: a checklist line such as
`- [ ] code-reviewer agent run on final diff; findings resolved or dispositioned (link/summary in PR description)`.
