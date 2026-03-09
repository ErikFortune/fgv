# KeyStore & Protected Collection Design

## Intended Behavior

1. **No keystore OR wrong password**: Workspace loads and allows read/write of any mutable, unprotected collections in any sublibrary
2. **Per-collection unlock**: Only when user accesses a protected collection do we prompt for a password for *that collection*
3. **Save key to keystore**: Offer to save the derived key in the keystore so user doesn't need to retype
4. **No keystore exists**: Prompt user for master password, create keystore
5. **Keystore exists + unlocked**: Require master password to *store* a key; still unlock the collection at runtime without storing
6. Some of this is application behavior; the library API shape must make it possible

## Current API Capabilities

| Requirement | Status |
|---|---|
| Workspace loads without keystore | Supported (`state='no-keystore'`, `isReady=true`) |
| Unprotected collections work without keystore | Supported — loaded during construction |
| Protected collections captured for later unlock | Supported — `SubLibrary.protectedCollections` + `loadProtectedCollectionAsync(encryption, filter)` |
| Per-collection password decryption | Supported — `IProtectedCollectionInfo.keyDerivation` + `ICryptoProvider.deriveKey()` |
| Save key to keystore | Supported — `KeyStore.importSecret()` + `save(password)` |
| Create keystore on-demand | Supported — `KeyStore.create()` + `initialize(password)` |

## Known Gaps (Future Work)

| Gap | Impact | Notes |
|---|---|---|
| CryptoProvider not stored when no keystore | Can't derive keys for per-collection unlock without keystore | Store `cryptoProvider` on workspace independently |
| No `setKeyStore()` on workspace | Can't create keystore after construction | Needs new method or factory re-create |
| No workspace-level per-collection unlock | App must manually orchestrate sub-library calls | Future: `workspace.loadProtectedCollection()` method |
| `Workspace.unlock()` is all-or-nothing | Can't selectively unlock one collection | Future: add filter param or new method |

## Key Files

| File | Role |
|---|---|
| `ts-extras/.../keystore/keyStore.ts` | KeyStore class (create, open, unlock, lock, save, importSecret, getSecretProvider) |
| `ts-extras/.../keystore/model.ts` | KeyStore types (`KeyStoreLockState`, `IKeyStoreFile`) |
| `ts-chocolate/.../workspace/workspace.ts` | Workspace (state, isReady, unlock, _loadProtectedCollections) |
| `ts-chocolate/.../workspace/platformInit.ts` | `createWorkspaceFromPlatform()` — keystore config assembly |
| `ts-chocolate/.../library-data/subLibrary.ts` | SubLibrary (protectedCollections, loadProtectedCollectionAsync) |
| `ts-chocolate/.../library-data/model.ts` | IProtectedCollectionInfo, IEncryptionConfig, IEncryptedFile |
