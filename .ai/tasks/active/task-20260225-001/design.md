# Technical Design: E2E Encrypted Collection Support

## Design Summary

Complete the end-to-end encrypted collection support in chocolate-lab-web by adding browser-specific keystore persistence, encrypted collection save functionality, and full keystore management UI.

### Architecture Pattern

**Repository Pattern with Browser Persistence Layer**
- Browser-specific persistence functions as thin adapters over KeyStore
- React hooks manage state and orchestrate async operations
- UI components use controlled inputs with local state
- All operations return `Result<T>` for explicit error handling

### Key Design Decisions

1. **No New KeyStore Methods**: Existing KeyStore API is complete - new code only adds browser-specific persistence and UI orchestration
2. **Separate Persistence Layer**: `keystoreStorage.ts` isolates localStorage concerns from KeyStore
3. **Simple Save Helper**: `saveEditableCollection.ts` tries encrypted save, returns Result for caller to handle failures
4. **Three-State UI**: SecuritySection reflects KeyStore's actual states (no-keystore/locked/unlocked)
5. **Explicit Save Triggers**: Only save keystore to localStorage after successful password operations
6. **Password-Derived Secrets by Default**: Named secrets are derived from user-supplied passwords via PBKDF2 (using `cryptoProvider.deriveKey()` → `keyStore.importSecret()`). Alt: supply raw key or generate random key and display to user.
7. **Dual Decryption Paths**: Encrypted files store `keyDerivation` params (salt/iterations). Collections can be decrypted via keystore (master password) OR via the secret's original password directly.

---

## Components

### 1. keystoreStorage.ts (NEW)

**Location**: `libraries/chocolate-lab-ui/src/packlets/workspace/keystoreStorage.ts`

**Purpose**: Browser-specific KeyStore persistence to localStorage

**Type**: Pure functions (no state)

**Responsibilities**:
- Save KeyStore to localStorage after modifications
- Load KeyStore file from localStorage during platform init
- Handle base64 encoding/decoding for storage
- Return Result<T> for all operations

**Functions**:

```typescript
/**
 * Saves a KeyStore to localStorage after a modification operation.
 * Call this after: initialize(), addSecret(), changePassword()
 * @param keyStore - The KeyStore instance to save
 * @param storage - Storage instance (window.localStorage)
 * @param key - Storage key (e.g., 'chocolate-lab:keystore:v1')
 * @returns Success with true, or Failure
 */
export async function saveKeystoreToStorage(
  keyStore: CryptoUtils.KeyStore.KeyStore,
  storage: Storage,
  key: string
): Promise<Result<true>>;

/**
 * Loads a KeyStore file from localStorage.
 * Already implemented in browserPlatformInit.ts (_loadKeyStoreFromStorage).
 * Extract to this module for reuse.
 * @param storage - Storage instance
 * @param key - Storage key
 * @returns Success with IKeyStoreFile or undefined if not found, Failure on parse errors
 */
export function loadKeystoreFromStorage(
  storage: Storage,
  key: string
): Result<CryptoUtils.KeyStore.IKeyStoreFile | undefined>;
```

**Implementation Details**:

```typescript
export async function saveKeystoreToStorage(
  keyStore: CryptoUtils.KeyStore.KeyStore,
  storage: Storage,
  key: string
): Promise<Result<true>> {
  // 1. Call keyStore.save() to get IKeyStoreFile
  const saveResult = await keyStore.save();
  if (saveResult.isFailure()) {
    return fail(`Failed to save keystore: ${saveResult.message}`);
  }

  // 2. Serialize to JSON
  const jsonResult = captureResult(() => JSON.stringify(saveResult.value, null, 2));
  if (jsonResult.isFailure()) {
    return fail(`Failed to serialize keystore: ${jsonResult.message}`);
  }

  // 3. Save to localStorage
  const storageResult = captureResult(() => storage.setItem(key, jsonResult.value));
  if (storageResult.isFailure()) {
    return fail(`Failed to write to localStorage: ${storageResult.message}`);
  }

  return succeed(true);
}

export function loadKeystoreFromStorage(
  storage: Storage,
  key: string
): Result<CryptoUtils.KeyStore.IKeyStoreFile | undefined> {
  // 1. Try to get from storage
  const rawResult = captureResult(() => storage.getItem(key));
  if (rawResult.isFailure()) {
    return fail(`Failed to read from localStorage: ${rawResult.message}`);
  }

  // 2. If null, return undefined (not an error)
  if (rawResult.value === null) {
    return succeed(undefined);
  }

  // 3. Parse JSON
  const parseResult = captureResult(() => JSON.parse(rawResult.value) as unknown);
  if (parseResult.isFailure()) {
    return fail(`Failed to parse keystore JSON: ${parseResult.message}`);
  }

  // 4. Validate structure
  return CryptoUtils.KeyStore.Converters.keystoreFile
    .convert(parseResult.value)
    .withErrorFormat((msg) => `Invalid keystore format: ${msg}`);
}
```

**Error Handling**:
- KeyStore.save() failure: Return error (KeyStore is in inconsistent state)
- JSON serialization failure: Return error (should never happen with valid IKeyStoreFile)
- localStorage write failure: Return error (quota exceeded or permissions)
- All errors propagate to caller via Result pattern

**Testing Strategy**:
- Unit tests with mock Storage implementation
- Test successful save/load round-trip
- Test error cases: quota exceeded, parse errors, invalid format
- Test undefined return when key doesn't exist (not an error)

---

### 2. saveEditableCollection.ts (NEW)

**Location**: `libraries/chocolate-lab-ui/src/packlets/workspace/saveEditableCollection.ts`

**Purpose**: Save encrypted collections with proper keystore integration

**Type**: Pure async function

**Responsibilities**:
- Try save-in-place with encryption if collection.metadata.secretName exists
- Return Result for caller to handle failures
- Provide export helper for producing encrypted blobs

**Functions**:

```typescript
/**
 * Options for saving an editable collection.
 */
export interface ISaveEditableCollectionOptions {
  /** The editable collection to save */
  readonly collection: EditableCollection<unknown>;
  /** The workspace (for keyStore and cryptoProvider access) */
  readonly workspace: IWorkspace;
}

/**
 * Attempts to save a collection with encryption if secretName is present.
 * On success, saves to the collection's sourceItem (if present and mutable).
 * On failure, returns error for caller to handle (e.g., show recovery dialog).
 *
 * @param options - Save options
 * @returns Success with saved collection, or Failure
 */
export async function saveEditableCollection(
  options: ISaveEditableCollectionOptions
): Promise<Result<EditableCollection<unknown>>>;

/**
 * Exports a collection to encrypted JSON blob.
 * Requires collection.metadata.secretName and available key.
 *
 * @param options - Export options
 * @returns Success with JSON string, or Failure if encryption fails
 */
export async function exportEncryptedCollection(
  options: ISaveEditableCollectionOptions
): Promise<Result<string>>;
```

**Implementation Details**:

```typescript
export async function saveEditableCollection(
  options: ISaveEditableCollectionOptions
): Promise<Result<EditableCollection<unknown>>> {
  const { collection, workspace } = options;

  // 1. Check if collection has secretName
  const secretName = collection.metadata.secretName;
  if (!secretName) {
    // Plain save - use existing collection.save()
    return collection.save().onSuccess(() => succeed(collection));
  }

  // 2. Check if workspace has keyStore
  if (!workspace.keyStore) {
    return fail('Collection requires encryption but no keystore is configured');
  }

  // 3. Get the secret from keyStore
  const secretResult = workspace.keyStore.getSecret(secretName);
  if (secretResult.isFailure()) {
    return fail(`Cannot encrypt collection: secret '${secretName}' not available: ${secretResult.message}`);
  }

  // 4. Get encryption config
  const encConfigResult = workspace.keyStore.getEncryptionConfig();
  if (encConfigResult.isFailure()) {
    return fail(`Cannot get encryption config: ${encConfigResult.message}`);
  }

  // 5. Export collection to plain object
  const exportResult = collection.export();
  if (exportResult.isFailure()) {
    return fail(`Failed to export collection: ${exportResult.message}`);
  }

  // 6. Convert items to JsonValue
  const contentResult = JsonConverters.jsonValue.convert(exportResult.value.items);
  if (contentResult.isFailure()) {
    return fail(`Failed to convert items to JSON: ${contentResult.message}`);
  }

  // 7. Create encrypted file
  const encryptedResult = await CryptoUtils.createEncryptedFile({
    content: contentResult.value,
    secretName,
    key: secretResult.value.key,
    metadata: {
      collectionId: collection.collectionId,
      itemCount: collection.size
    },
    cryptoProvider: encConfigResult.value.cryptoProvider
  });
  if (encryptedResult.isFailure()) {
    return fail(`Encryption failed: ${encryptedResult.message}`);
  }

  // 8. Save to sourceItem if available
  if (!collection.sourceItem || !('setRawContents' in collection.sourceItem)) {
    return fail('Collection has no mutable source file for save-in-place');
  }

  const jsonContent = JSON.stringify(encryptedResult.value, null, 2);
  return (collection.sourceItem as FileTree.IFileTreeFileItem)
    .setRawContents(jsonContent)
    .onSuccess(() => succeed(collection));
}

export async function exportEncryptedCollection(
  options: ISaveEditableCollectionOptions
): Promise<Result<string>> {
  const { collection, workspace } = options;

  const secretName = collection.metadata.secretName;
  if (!secretName) {
    return fail('Collection has no secretName - cannot export as encrypted');
  }

  if (!workspace.keyStore) {
    return fail('No keystore configured');
  }

  // Same encryption logic as saveEditableCollection, but return JSON string
  // ... (implementation similar to steps 3-7 above)

  const jsonContent = JSON.stringify(encryptedResult.value, null, 2);
  return succeed(jsonContent);
}
```

**Error Handling**:
- No secretName: Fall back to plain save via collection.save()
- No keyStore: Return failure (collection requires encryption but workspace doesn't support it)
- Secret not available: Return failure (keystore locked or secret deleted)
- Encryption failure: Return failure (crypto provider error)
- Save failure: Return failure (filesystem or FileTree error)

**Testing Strategy**:
- Unit tests with mock workspace and collection
- Test successful encrypted save
- Test fallback to plain save when no secretName
- Test error cases: locked keystore, missing secret, encryption failure
- Test export helper produces valid encrypted JSON

---

### 3. SecuritySection.tsx (MODIFY)

**Location**: `libraries/chocolate-lab-ui/src/packlets/settings/sections/SecuritySection.tsx`

**Purpose**: Full keystore management UI with 3 states

**Type**: React functional component

**Responsibilities**:
- Display current keystore state (no-keystore, locked, unlocked)
- Provide actions for each state
- Show dialogs for password operations
- Handle success/error feedback

**State Management**:

```typescript
// Local component state
const [keystoreState, setKeystoreState] = useState<'no-keystore' | 'locked' | 'unlocked'>('no-keystore');
const [secretCount, setSecretCount] = useState(0);
const [showSetPasswordDialog, setShowSetPasswordDialog] = useState(false);
const [showUnlockDialog, setShowUnlockDialog] = useState(false);
const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
const [statusMessage, setStatusMessage] = useState<string | undefined>(undefined);
const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

// Derive from workspace on mount and after operations
useEffect(() => {
  const keyStore = workspace.keyStore;
  if (!keyStore) {
    setKeystoreState('no-keystore');
    setSecretCount(0);
  } else if (keyStore.isUnlocked) {
    setKeystoreState('unlocked');
    const secretsResult = keyStore.listSecrets();
    setSecretCount(secretsResult.isSuccess() ? secretsResult.value.length : 0);
  } else {
    setKeystoreState('locked');
    setSecretCount(0);
  }
}, [workspace.keyStore?.state]);
```

**UI States**:

```typescript
// State 1: No keystore
if (keystoreState === 'no-keystore') {
  return (
    <div className="...">
      <p className="text-xs text-gray-500">No keystore configured</p>
      <button onClick={() => setShowSetPasswordDialog(true)}>
        Set Password
      </button>
    </div>
  );
}

// State 2: Locked
if (keystoreState === 'locked') {
  return (
    <div className="...">
      <p className="text-xs text-gray-500">Locked</p>
      <button onClick={() => setShowUnlockDialog(true)}>
        Unlock
      </button>
      <button disabled>
        Change Password
      </button>
    </div>
  );
}

// State 3: Unlocked
return (
  <div className="...">
    <p className="text-xs text-gray-500">Unlocked ({secretCount} secrets)</p>
    <button onClick={() => setShowChangePasswordDialog(true)}>
      Change Password
    </button>
    <button onClick={handleLock}>
      Lock
    </button>
  </div>
);
```

**Action Handlers**:

```typescript
// Set Password (initialize new keystore)
const handleSetPassword = async (password: string): Promise<string | undefined> => {
  const keyStore = workspace.keyStore;
  if (!keyStore) {
    return 'No keystore available';
  }

  const initResult = await keyStore.initialize(password);
  if (initResult.isFailure()) {
    return initResult.message;
  }

  // Save to localStorage
  const saveResult = await saveKeystoreToStorage(
    keyStore,
    window.localStorage,
    `${storagePrefix}:keystore:v1`
  );
  if (saveResult.isFailure()) {
    return `Keystore initialized but save failed: ${saveResult.message}`;
  }

  setShowSetPasswordDialog(false);
  setStatusMessage('Keystore initialized successfully');
  reactiveWorkspace.notifyChange(); // Trigger UI update
  return undefined; // Success
};

// Unlock keystore
const handleUnlock = async (password: string): Promise<string | undefined> => {
  const keyStore = workspace.keyStore;
  if (!keyStore) {
    return 'No keystore available';
  }

  const unlockResult = await keyStore.unlock(password);
  if (unlockResult.isFailure()) {
    return unlockResult.message;
  }

  setShowUnlockDialog(false);
  setStatusMessage('Keystore unlocked');
  reactiveWorkspace.notifyChange();
  return undefined;
};

// Change password
const handleChangePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<string | undefined> => {
  const keyStore = workspace.keyStore;
  if (!keyStore) {
    return 'No keystore available';
  }

  // If locked, unlock first
  if (!keyStore.isUnlocked) {
    const unlockResult = await keyStore.unlock(currentPassword);
    if (unlockResult.isFailure()) {
      return `Current password incorrect: ${unlockResult.message}`;
    }
  }

  const changeResult = await keyStore.changePassword(newPassword);
  if (changeResult.isFailure()) {
    return changeResult.message;
  }

  const saveResult = await saveKeystoreToStorage(
    keyStore,
    window.localStorage,
    `${storagePrefix}:keystore:v1`
  );
  if (saveResult.isFailure()) {
    return `Password changed but save failed: ${saveResult.message}`;
  }

  setShowChangePasswordDialog(false);
  setStatusMessage('Password changed successfully');
  reactiveWorkspace.notifyChange();
  return undefined;
};

// Lock keystore
const handleLock = (): void => {
  const keyStore = workspace.keyStore;
  if (!keyStore) {
    return;
  }

  const lockResult = keyStore.lock();
  if (lockResult.isFailure()) {
    setErrorMessage(lockResult.message);
    return;
  }

  setStatusMessage('Keystore locked');
  reactiveWorkspace.notifyChange();
};
```

**Dialog Components**:

Three separate dialogs (following existing patterns from SetSecretPasswordDialog):

```typescript
// SetPasswordDialog.tsx (NEW - similar to SetSecretPasswordDialog)
export interface ISetPasswordDialogProps {
  readonly isOpen: boolean;
  readonly onSetPassword: (password: string) => Promise<string | undefined>;
  readonly onCancel: () => void;
}

// ChangePasswordDialog.tsx (NEW)
export interface IChangePasswordDialogProps {
  readonly isOpen: boolean;
  readonly onChangePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<string | undefined>;
  readonly onCancel: () => void;
}

// UnlockDialog already exists - reuse as-is
```

**Error Handling**:
- Initialize failure: Show error in dialog, keep dialog open for retry
- Unlock failure: Show error in dialog, keep dialog open for retry
- Change password failure: Show error in dialog, allow retry
- Save to localStorage failure: Show error message in UI (operation succeeded but persistence failed)
- Lock failure: Show error message in UI

**Testing Strategy**:
- Unit tests with mock workspace and keyStore
- Test all three states render correctly
- Test action handlers call correct KeyStore methods
- Test error handling for all operations
- Test success messages appear after operations
- Test ReactiveWorkspace.notifyChange() is called after state changes

---

### 4. Integration Changes

#### 4.1 useCollectionActions.ts

**Changes**:
- After `keyStore.initialize()` or `keyStore.addSecret()`, call `saveKeystoreToStorage()`
- When exporting encrypted collection with locked keystore, prompt to unlock first

**Modified Functions**:

```typescript
// In createCollection callback
const createCollection = useCallback(async (data: ICreateCollectionData) => {
  // ... existing collection creation logic ...

  // After keyStore.initialize() or keyStore.addSecret()
  if (keyStore && (initResult.isSuccess() || addResult.isSuccess())) {
    const storagePrefix = workspace.configName ?? 'chocolate-lab';
    const saveResult = await saveKeystoreToStorage(
      keyStore,
      window.localStorage,
      `${storagePrefix}:keystore:v1`
    );
    if (saveResult.isFailure()) {
      workspace.data.logger.warn(`Keystore modified but save failed: ${saveResult.message}`);
    }
  }

  // ... rest of existing logic ...
}, [workspace, reactiveWorkspace, activeTab]);

// In exportCollection callback
const exportCollection = useCallback(async (collectionId: string) => {
  // ... existing code to get collection ...

  const secretName = collection.metadata?.secretName;
  if (secretName && workspace.keyStore) {
    // Check if keystore is locked
    if (!workspace.keyStore.isUnlocked) {
      // Prompt to unlock first (not silent fallback)
      workspace.data.logger.warn('Keystore is locked - please unlock to export encrypted collection');
      // TODO: Show unlock dialog or use existing unlock flow
      return;
    }

    // ... existing encryption logic ...
  }

  // ... existing plain export logic ...
}, [workspace, activeTab]);
```

#### 4.2 browserPlatformInit.ts

**Changes**:
- Extract `_loadKeyStoreFromStorage` to `keystoreStorage.loadKeystoreFromStorage()`
- Import and use the extracted function

```typescript
// Before (line 166-176)
const keyStoreFile = this._loadKeyStoreFromStorage(
  browserOptions.storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined),
  `${prefix}:keystore:v1`
);

// After
import { loadKeystoreFromStorage } from './keystoreStorage';

const keyStoreFile = loadKeystoreFromStorage(
  browserOptions.storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined),
  `${prefix}:keystore:v1`
);
```

**Remove**:
- `_loadKeyStoreFromStorage` method (lines 308-332) - replaced by `keystoreStorage.loadKeystoreFromStorage()`

#### 4.3 workspace/index.ts

**Changes**:
- Export new modules

```typescript
export { saveKeystoreToStorage, loadKeystoreFromStorage } from './keystoreStorage';
export {
  saveEditableCollection,
  exportEncryptedCollection,
  type ISaveEditableCollectionOptions
} from './saveEditableCollection';
```

---

## Data Flow

### 1. Platform Initialization Flow

```
BrowserPlatformInitializer.initialize()
  → loadKeystoreFromStorage(localStorage, key)
  → Returns Result<IKeyStoreFile | undefined>
  → Passes to Workspace.createWithSettings()
  → Creates KeyStore instance in 'locked' state
  → Workspace available with keyStore property
```

### 2. Set Password Flow (New Keystore)

```
SecuritySection
  → User clicks "Set Password"
  → SetPasswordDialog opens
  → User enters password + confirm
  → handleSetPassword(password)
    → keyStore.initialize(password)
    → saveKeystoreToStorage(keyStore, localStorage, key)
    → reactiveWorkspace.notifyChange()
  → Dialog closes
  → UI updates to "Unlocked" state
```

### 3. Unlock Flow

```
SecuritySection
  → User clicks "Unlock"
  → UnlockDialog opens
  → User enters password
  → handleUnlock(password)
    → keyStore.unlock(password)
    → reactiveWorkspace.notifyChange()
  → Dialog closes
  → UI updates to "Unlocked" state
```

### 4. Change Password Flow

```
SecuritySection
  → User clicks "Change Password"
  → ChangePasswordDialog opens
  → User enters current + new + confirm
  → handleChangePassword(currentPassword, newPassword)
    → If locked: keyStore.unlock(currentPassword)
    → keyStore.changePassword(newPassword)
    → saveKeystoreToStorage(keyStore, localStorage, key)
    → reactiveWorkspace.notifyChange()
  → Dialog closes
  → Success message shown
```

### 5. Lock Flow

```
SecuritySection
  → User clicks "Lock"
  → handleLock()
    → keyStore.lock()
    → reactiveWorkspace.notifyChange()
  → UI updates to "Locked" state
```

### 6. Save Encrypted Collection Flow

```
useCollectionActions.saveCollection(collectionId)
  → Get EditableCollection from library
  → saveEditableCollection({ collection, workspace })
    → Check collection.metadata.secretName exists
    → Get workspace.keyStore.getSecret(secretName)
    → collection.export()
    → CryptoUtils.createEncryptedFile(...)
    → collection.sourceItem.setRawContents(encryptedJson)
  → On success: silent
  → On failure: Show RecoveryDialog with 3 options
```

### 7. Export Encrypted Collection Flow

```
useCollectionActions.exportCollection(collectionId)
  → Check workspace.keyStore.isUnlocked
    → If locked: Show unlock prompt/dialog
    → If unlocked: Continue
  → Get collection.metadata.secretName
  → exportEncryptedCollection({ collection, workspace })
  → Create blob and download
```

---

## Integration Points

### 1. Existing KeyStore Class (ts-extras)

**Used Methods**:
- `KeyStore.create({ cryptoProvider })` - Create new empty keystore
- `KeyStore.open({ keystoreFile, cryptoProvider })` - Open existing keystore
- `keyStore.initialize(password)` - Initialize new keystore with password
- `keyStore.unlock(password)` - Unlock existing keystore
- `keyStore.lock()` - Lock keystore, clear secrets from memory
- `keyStore.changePassword(newPassword)` - Change master password
- `keyStore.save()` - Serialize to IKeyStoreFile
- `keyStore.listSecrets()` - Get list of secret names
- `keyStore.getSecret(name)` - Get specific secret
- `keyStore.addSecret(name, options?)` - Add new secret
- `keyStore.getEncryptionConfig()` - Get crypto provider + secret provider

**No modifications needed** - KeyStore API is complete as-is.

### 2. BrowserPlatformInitializer

**Existing Integration**:
- Already loads keystore via `_loadKeyStoreFromStorage()` during `initialize()`
- Already passes `keyStoreFile` to `Workspace.createWithSettings()`

**New Integration**:
- Use extracted `loadKeystoreFromStorage()` instead of private method
- No other changes needed

### 3. Workspace Class (ts-chocolate)

**Existing Integration**:
- Already creates KeyStore from `params.keyStore.file` in `createWithSettings()`
- Already exposes `workspace.keyStore` property
- Already exposes `workspace.state` (no-keystore/locked/unlocked)

**No modifications needed** - Workspace already handles KeyStore correctly.

### 4. useWorkspace Hook

**Existing Integration**:
- Already provides `workspace` and `reactiveWorkspace` to components
- `reactiveWorkspace.notifyChange()` triggers re-renders

**Usage in SecuritySection**:
```typescript
const workspace = useWorkspace();
const reactiveWorkspace = useReactiveWorkspace();

// After keystore operations
reactiveWorkspace.notifyChange();
```

### 5. EditableCollection Class

**Existing Methods Used**:
- `collection.metadata.secretName` - Check if encryption required
- `collection.export()` - Get plain object for encryption
- `collection.save()` - Save to sourceItem (fallback for plain collections)
- `collection.sourceItem` - Check if save-in-place is possible

**No modifications needed** - EditableCollection already supports encrypted workflow.

### 6. CryptoUtils (ts-extras)

**Used Functions**:
- `CryptoUtils.createEncryptedFile({ content, secretName, key, metadata, cryptoProvider })` - Encrypt collection
- `CryptoUtils.KeyStore.Converters.keystoreFile.convert()` - Validate keystore file format

**No modifications needed** - CryptoUtils is complete.

---

## Error Handling Strategy

### 1. keystoreStorage.ts

**Error Categories**:
- **localStorage errors**: Quota exceeded, permissions, not available
- **Parse errors**: Invalid JSON, corrupted data
- **Validation errors**: Invalid keystore file format

**Strategy**:
- All errors return `Result.fail()` with context
- Callers decide how to handle (e.g., show error, retry, fallback)

**Example Error Messages**:
```typescript
fail('Failed to write to localStorage: QuotaExceededError')
fail('Failed to parse keystore JSON: Unexpected token')
fail('Invalid keystore format: missing field "encryptedData"')
```

### 2. saveEditableCollection.ts

**Error Categories**:
- **Configuration errors**: No keystore, no secret, locked keystore
- **Encryption errors**: Crypto provider failure
- **Save errors**: FileTree write failure

**Strategy**:
- Return `Result.fail()` with specific error message
- Caller (UI) shows error and offers alternatives

**Example Error Messages**:
```typescript
fail('Collection requires encryption but no keystore is configured')
fail('Cannot encrypt collection: secret "my-secret" not available: keystore is locked')
fail('Encryption failed: Invalid key length')
fail('Collection has no mutable source file for save-in-place')
```

### 3. SecuritySection.tsx

**Error Categories**:
- **Operation errors**: Incorrect password, validation failure
- **Persistence errors**: localStorage save failure
- **State errors**: Keystore not available

**Strategy**:
- Show inline error in dialog for operation errors (keep dialog open for retry)
- Show toast/banner for persistence errors (operation succeeded but save failed)
- Clear error when user retries or closes dialog

**Example UI Errors**:
```typescript
"Incorrect password or corrupted key store"
"Password changed but save failed: QuotaExceededError - your changes are in memory only"
"No keystore available - please refresh the page"
```

### 4. useCollectionActions.ts

**Error Categories**:
- **Locked keystore**: User tries to export encrypted collection but keystore is locked
- **Save failures**: Save-in-place fails (handled by saveEditableCollection)

**Strategy**:
- Locked keystore: Prompt user to unlock first (not silent fallback)
- Save failures: Log error, optionally show RecoveryDialog

**Example Handling**:
```typescript
if (secretName && workspace.keyStore && !workspace.keyStore.isUnlocked) {
  workspace.data.logger.warn('Keystore is locked - please unlock to export encrypted collection');
  // Show UnlockDialog or navigate to Settings > Security
  return;
}
```

---

## Testing Strategy

### Unit Tests

#### keystoreStorage.test.ts
```typescript
describe('keystoreStorage', () => {
  describe('saveKeystoreToStorage', () => {
    it('should save keystore to localStorage');
    it('should return failure if keyStore.save() fails');
    it('should return failure if localStorage quota exceeded');
  });

  describe('loadKeystoreFromStorage', () => {
    it('should load keystore from localStorage');
    it('should return undefined if key not found (not error)');
    it('should return failure if JSON parse fails');
    it('should return failure if format validation fails');
  });
});
```

#### saveEditableCollection.test.ts
```typescript
describe('saveEditableCollection', () => {
  it('should save plain collection if no secretName');
  it('should save encrypted collection if secretName present');
  it('should return failure if keystore not configured');
  it('should return failure if secret not available');
  it('should return failure if encryption fails');
  it('should return failure if no sourceItem');
});

describe('exportEncryptedCollection', () => {
  it('should export encrypted JSON if secretName present');
  it('should return failure if no secretName');
  it('should return failure if keystore locked');
});
```

#### SecuritySection.test.tsx
```typescript
describe('SecuritySection', () => {
  describe('no-keystore state', () => {
    it('should show "No keystore configured"');
    it('should enable "Set Password" button');
    it('should open SetPasswordDialog on click');
  });

  describe('locked state', () => {
    it('should show "Locked"');
    it('should enable "Unlock" button');
    it('should disable "Change Password" button');
  });

  describe('unlocked state', () => {
    it('should show "Unlocked (N secrets)"');
    it('should enable "Change Password" button');
    it('should enable "Lock" button');
  });

  describe('password operations', () => {
    it('should call keyStore.initialize on set password');
    it('should call saveKeystoreToStorage after initialize');
    it('should call keyStore.unlock on unlock');
    it('should call keyStore.changePassword on change password');
    it('should call keyStore.lock on lock');
  });
});
```

### Integration Tests

```typescript
describe('Encrypted Collection E2E', () => {
  it('should create encrypted collection with new keystore');
  it('should load encrypted collection after page reload');
  it('should export encrypted collection');
  it('should fail gracefully if keystore locked during save');
  it('should prompt to unlock if exporting while locked');
});
```

### Edge Cases

```typescript
describe('Edge Cases', () => {
  it('should handle quota exceeded during keystore save');
  it('should handle corrupted keystore file in localStorage');
  it('should handle missing localStorage (SSR or private browsing)');
  it('should handle concurrent keystore modifications');
  it('should handle password change while collections are open');
});
```

---

## File-by-File Change Plan

### NEW: libraries/chocolate-lab-ui/src/packlets/workspace/keystoreStorage.ts

**Lines**: ~80 lines

**Contents**:
```typescript
// Copyright header
// Imports
export async function saveKeystoreToStorage(...)
export function loadKeystoreFromStorage(...)
```

**Dependencies**:
- `@fgv/ts-utils` - Result, succeed, fail, captureResult
- `@fgv/ts-extras` - CryptoUtils.KeyStore types

**Test File**: `src/test/unit/packlets/workspace/keystoreStorage.test.ts`

---

### NEW: libraries/chocolate-lab-ui/src/packlets/workspace/saveEditableCollection.ts

**Lines**: ~150 lines

**Contents**:
```typescript
// Copyright header
// Imports
export interface ISaveEditableCollectionOptions { ... }
export async function saveEditableCollection(...)
export async function exportEncryptedCollection(...)
```

**Dependencies**:
- `@fgv/ts-utils` - Result pattern
- `@fgv/ts-extras` - CryptoUtils
- `@fgv/ts-json-base` - JsonConverters
- `@fgv/ts-chocolate` - IWorkspace, EditableCollection

**Test File**: `src/test/unit/packlets/workspace/saveEditableCollection.test.ts`

---

### NEW: libraries/chocolate-lab-ui/src/packlets/settings/dialogs/SetPasswordDialog.tsx

**Lines**: ~120 lines

**Contents**:
```typescript
// Similar structure to SetSecretPasswordDialog
export interface ISetPasswordDialogProps { ... }
export function SetPasswordDialog(props) { ... }
```

**Pattern**: Copy SetSecretPasswordDialog, modify for:
- No secretName (just "Set Master Password")
- Single password field with confirm
- Success closes dialog

**Test File**: `src/test/unit/packlets/settings/dialogs/SetPasswordDialog.test.tsx`

---

### NEW: libraries/chocolate-lab-ui/src/packlets/settings/dialogs/ChangePasswordDialog.tsx

**Lines**: ~150 lines

**Contents**:
```typescript
export interface IChangePasswordDialogProps { ... }
export function ChangePasswordDialog(props) { ... }
```

**Pattern**: Similar to SetPasswordDialog but with:
- Current password field
- New password field
- Confirm password field
- Validation for all three

**Test File**: `src/test/unit/packlets/settings/dialogs/ChangePasswordDialog.test.tsx`

---

### MODIFY: libraries/chocolate-lab-ui/src/packlets/settings/sections/SecuritySection.tsx

**Current Lines**: 40
**New Lines**: ~250

**Changes**:
1. Import new dependencies
2. Add state management hooks
3. Add 3-state UI logic
4. Add action handlers
5. Add dialog components

**Exact Changes**:
```typescript
// Line 1-2: Keep imports
import React from 'react';

// NEW: Add imports
import { useCallback, useEffect, useState } from 'react';
import { useWorkspace, useReactiveWorkspace } from '../workspace';
import { saveKeystoreToStorage } from '../workspace/keystoreStorage';
import { SetPasswordDialog } from './dialogs/SetPasswordDialog';
import { UnlockDialog } from '../sidebar/UnlockDialog'; // Existing
import { ChangePasswordDialog } from './dialogs/ChangePasswordDialog';

// NEW: Add props interface
export interface ISecuritySectionProps {
  readonly storagePrefix: string; // e.g., 'chocolate-lab'
}

// Line 3: Replace function signature
export function SecuritySection(props: ISecuritySectionProps): React.ReactElement {
  const { storagePrefix } = props;

  // NEW: Add hooks and state
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();
  const [keystoreState, setKeystoreState] = useState<'no-keystore' | 'locked' | 'unlocked'>('no-keystore');
  const [secretCount, setSecretCount] = useState(0);
  // ... more state ...

  // NEW: Add useEffect for state sync
  // NEW: Add action handlers
  // NEW: Add UI based on keystoreState

  // Lines 4-39: Delete existing hardcoded UI
  // Replace with new 3-state UI
}
```

**Test File**: `src/test/unit/packlets/settings/sections/SecuritySection.test.tsx` (NEW)

---

### MODIFY: libraries/chocolate-lab-ui/src/packlets/sidebar/useCollectionActions.ts

**Current Lines**: 891
**New Lines**: ~920 (+29)

**Changes**:
1. Import `saveKeystoreToStorage`
2. Add save call after `keyStore.initialize()` (around line 346)
3. Add save call after `keyStore.addSecret()` (around line 355)
4. Add unlock check in `exportCollection` (around line 524)

**Exact Changes**:

```typescript
// Line 31: Add import
import { saveKeystoreToStorage } from '../workspace';

// After line 353 (after keyStore.addSecret()):
const addResult = await keyStore.addSecret(data.secretName!);
if (addResult.isFailure()) {
  resolve(addResult.message);
  return addResult.message;
}

// NEW: Save keystore after adding secret
const storagePrefix = workspace.configName ?? 'chocolate-lab';
const saveResult = await saveKeystoreToStorage(
  keyStore,
  window.localStorage,
  `${storagePrefix}:keystore:v1`
);
if (saveResult.isFailure()) {
  workspace.data.logger.warn(`Secret added but keystore save failed: ${saveResult.message}`);
}

resolve(undefined);
return undefined;

// After line 521 (in exportCollection, after getting secretName):
if (secretName && workspace.keyStore) {
  // NEW: Check if keystore is locked
  if (!workspace.keyStore.isUnlocked) {
    workspace.data.logger.warn('Keystore is locked - please unlock to export encrypted collection');
    // TODO: Could show UnlockDialog here or navigate to Settings
    return;
  }

  // Existing encryption logic continues...
  const secretResult = workspace.keyStore.getSecret(secretName);
  // ...
}
```

**Test File**: Update existing `src/test/unit/packlets/sidebar/useCollectionActions.test.ts`

---

### MODIFY: libraries/chocolate-lab-ui/src/packlets/workspace/browserPlatformInit.ts

**Current Lines**: 359
**New Lines**: ~340 (-19)

**Changes**:
1. Import `loadKeystoreFromStorage`
2. Replace `_loadKeyStoreFromStorage` call with imported function (line 166)
3. Remove `_loadKeyStoreFromStorage` method (lines 308-332)

**Exact Changes**:

```typescript
// Line 46: Add import
import { loadKeystoreFromStorage } from './keystoreStorage';

// Lines 166-170: Replace
const keyStoreFile = loadKeystoreFromStorage(
  browserOptions.storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined),
  `${prefix}:keystore:v1`
);

// Update return to use Result (line 172-176)
return succeed({
  cryptoProvider,
  userLibraryTree,
  externalLibraries: [] as IResolvedExternalLibrary[],
  keyStoreFile: keyStoreFile.isSuccess() ? keyStoreFile.value : undefined,
  bootstrapSettings: bootstrap,
  resolvedSettings,
  deviceId
});

// Lines 308-332: DELETE entire _loadKeyStoreFromStorage method
```

**Test File**: Update existing `src/test/unit/packlets/workspace/browserPlatformInit.test.ts`

---

### MODIFY: libraries/chocolate-lab-ui/src/packlets/workspace/index.ts

**Current Lines**: 48
**New Lines**: 58 (+10)

**Changes**: Add exports for new modules

**Exact Changes**:

```typescript
// After line 17 (after browserPlatformInit exports):
export { saveKeystoreToStorage, loadKeystoreFromStorage } from './keystoreStorage';
export {
  saveEditableCollection,
  exportEncryptedCollection,
  type ISaveEditableCollectionOptions
} from './saveEditableCollection';

// After existing exports (new exports for dialogs if needed)
export { SetPasswordDialog, type ISetPasswordDialogProps } from '../settings/dialogs/SetPasswordDialog';
export { ChangePasswordDialog, type IChangePasswordDialogProps } from '../settings/dialogs/ChangePasswordDialog';
```

---

## Migration & Rollback

### Migration Strategy

**No migration needed** - this is new functionality:
- Existing plain collections continue to work as-is
- Encrypted collections can be created after setting keystore password
- No data format changes
- No breaking API changes

### Rollback Strategy

If issues arise:

1. **SecuritySection UI**: Disable button, show "Coming soon" message (revert to current state)
2. **keystoreStorage**: Remove calls to `saveKeystoreToStorage()` (keystore won't persist but will work in-memory for session)
3. **saveEditableCollection**: Remove usage, fall back to plain `collection.save()`

**No data loss** - encrypted collections remain encrypted, just can't be modified until functionality is fixed.

---

## Risks & Mitigations

### Risk 1: localStorage Quota Exceeded

**Likelihood**: Low (keystore files are small, ~1-5KB)
**Impact**: Medium (can't persist keystore, user loses secrets on refresh)

**Mitigation**:
- Show clear error message: "Storage quota exceeded - keystore not saved"
- Suggest clearing browser data or using smaller collections
- Consider compression for large keystores (future)

### Risk 2: Browser Tab Closed During Password Change

**Likelihood**: Low
**Impact**: High if save fails (keystore corrupted)

**Mitigation**:
- KeyStore.changePassword() is atomic - either succeeds or fails cleanly
- If save fails after successful change, show error: "Password changed but not saved - do not close this tab"
- Add browser beforeunload warning if keystore has unsaved changes

### Risk 3: Concurrent Modifications to KeyStore

**Likelihood**: Low (single user, single tab)
**Impact**: Medium (could overwrite changes from other operations)

**Mitigation**:
- All keystore operations are sequential (async/await)
- ReactiveWorkspace ensures UI consistency
- Consider adding versioning to IKeyStoreFile (future)

### Risk 4: User Forgets Master Password

**Likelihood**: Medium
**Impact**: High (all encrypted collections inaccessible)

**Mitigation**:
- Show warning during initial setup: "Save your password securely - it cannot be recovered"
- Consider adding password recovery hint (stored unencrypted) - future feature
- Document export-to-plain-text workflow for backup

### Risk 5: Platform Compatibility

**Likelihood**: Low (localStorage widely supported)
**Impact**: Medium (keystore not available in some browsers)

**Mitigation**:
- Check for localStorage availability in BrowserPlatformInitializer
- Gracefully degrade to no-keystore mode if unavailable
- Show warning: "Encrypted collections not supported in this browser"

---

## Alternatives Considered

### Alternative 1: Store KeyStore in IndexedDB

**Pros**: Larger storage quota, better for large keystores
**Cons**: More complex API, async overhead, requires IDB abstraction

**Rejected**: localStorage is simpler and sufficient for keystore size (~1-5KB)

### Alternative 2: Auto-save KeyStore on Every Operation

**Pros**: No risk of forgetting to call saveKeystoreToStorage()
**Cons**: More localStorage writes, potential performance impact

**Rejected**: Explicit save calls give better control and clearer error handling

### Alternative 3: Single Dialog for All Password Operations

**Pros**: Less code duplication
**Cons**: Complex state management, unclear UX for different operations

**Rejected**: Separate dialogs are clearer and follow existing patterns (SetSecretPasswordDialog)

### Alternative 4: Modify EditableCollection.save() to Handle Encryption

**Pros**: Single save method, no new saveEditableCollection helper
**Cons**: EditableCollection would need workspace/keystore dependencies, breaks separation of concerns

**Rejected**: Keep EditableCollection pure, put encryption logic in UI layer

---

## Future Enhancements

### 1. Password Recovery Hints

Allow user to set an optional hint when creating/changing password:
```typescript
keyStore.initialize(password, { hint: 'Name of first pet' });
```

Store hint in `IKeyStoreFile.metadata.hint` (unencrypted).

### 2. Biometric Unlock

Use Web Authentication API for fingerprint/face unlock:
```typescript
keyStore.unlockWithBiometric();
```

Requires secure password storage in browser credentials.

### 3. Secret Sharing

Allow exporting individual secrets for team sharing:
```typescript
keyStore.exportSecret('my-secret', recipientPublicKey);
```

Requires public-key cryptography support.

### 4. Automatic Lock Timer

Lock keystore after N minutes of inactivity:
```typescript
workspace.setAutoLockTimeout(15 * 60 * 1000); // 15 minutes
```

### 5. Keystore Sync Across Devices

Sync encrypted keystore via cloud storage:
```typescript
keyStore.syncTo(cloudProvider);
```

Requires cloud integration and conflict resolution.

---

## Conclusion

This design completes E2E encrypted collection support by:

1. **Adding browser persistence** for KeyStore via localStorage
2. **Providing save helpers** for encrypted collections
3. **Building full UI** for keystore management
4. **Integrating with existing flows** for collection creation and export

All components follow established patterns:
- Result pattern for error handling
- React hooks for state management
- Functional components with controlled inputs
- Separation of concerns (persistence / business logic / UI)

No changes to KeyStore, Workspace, or EditableCollection core APIs - new code is purely additive integration layer.

**Next Steps for Implementation**:
1. Create `keystoreStorage.ts` and tests
2. Create `saveEditableCollection.ts` and tests
3. Create dialog components (SetPasswordDialog, ChangePasswordDialog)
4. Modify SecuritySection.tsx
5. Update useCollectionActions.ts and browserPlatformInit.ts
6. Update index.ts exports
7. Run full test suite and manual testing
