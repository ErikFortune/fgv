# Issue 6: Two-Phase Initialization / Settings File Split

Split the current monolithic `common.json` into `bootstrap.json` (preload options) and `preferences.json` (runtime config), with three-option error recovery and optional config namespacing for side-by-side instances.

## Current State

Today everything lives in `common.json`:

| Field | Preload? | Runtime? |
|---|---|---|
| `externalLibraries` | ✅ preload | |
| `defaultTargets` | | ✅ runtime |
| `defaultStorageTargets` | | ✅ runtime |
| `tools` | | ✅ runtime |

The initialization flow is:
1. **Stage 1 (platform)**: load `common.json` → resolve `externalLibraries` → load keystore → return `IPlatformInitResult`
2. **Stage 2 (common)**: create `SettingsManager`, build file sources, create `Workspace`

**Device settings are vestigial.** Investigation confirms that none of the `IDeviceSettings` fields (`lastActiveSessionId`, `defaultTargetsOverride`, `toolsOverride`, `localDirectories`, `fileTreeOverrides`, `deviceName`) are read by any UI code. Directory restoration comes from IndexedDB (`DirectoryHandleStore`), not device settings. The merge in `resolveSettings()` exists but nothing consumes the merged overrides.

## Proposed File Layout

```
data/settings/
  bootstrap.json          ← preload: what to load and where to find things
  preferences.json        ← runtime: user preferences and library defaults
```

Device settings files are **retired** — the only surviving device-scoped state is `deviceId` (persisted in localStorage) and directory handles (in IndexedDB). Both are already handled outside the settings file.

### `bootstrap.json` — `IBootstrapSettings`

Editable from the settings UI. Changes require a page reload ("restart required" banner).

```typescript
interface IBootstrapSettings {
  schemaVersion: SettingsSchemaVersion;

  /** Whether to include built-in (embedded) library data. @default true */
  includeBuiltIn?: boolean;

  /** What to include from local storage. @default { library: true, userData: true } */
  localStorage?: {
    /** Load library entity collections from local storage */
    library?: boolean;
    /** Load user data (journals, sessions, inventory) from local storage */
    userData?: boolean;
  };

  /** External roots to load — same shape as today's externalLibraries */
  externalLibraries?: ReadonlyArray<IExternalLibraryRefConfig>;

  /**
   * Where to find the preferences file.
   * @default { type: 'local' } — data/settings/preferences.json in local storage
   */
  preferencesLocation?: ISettingsFileLocation;

  /**
   * Where to find the keystore file.
   * @default { type: 'local' } — keystore.json in user library root
   */
  keystoreLocation?: ISettingsFileLocation;

  /**
   * Platform-specific file tree overrides (moved from device settings).
   * Affects where the user library tree root is resolved.
   */
  fileTreeOverrides?: IDeviceFileTreeOverrides;
}

/** Specifies where a settings/keystore file lives */
type ISettingsFileLocation =
  | { type: 'local' }                              // in local storage (default)
  | { type: 'external'; rootName: string };         // in a named external root
```

### `preferences.json` — `IPreferencesSettings`

```typescript
interface IPreferencesSettings {
  schemaVersion: SettingsSchemaVersion;

  /** Default target collections for new entities, per sublibrary */
  defaultTargets?: IDefaultCollectionTargets;

  /** Default storage root for new collections (global + per-sublibrary) */
  defaultStorageTargets?: IDefaultStorageTargets;

  /** Tool configuration (scaling, workflow) */
  tools?: IToolSettings;
}
```

## Revised Initialization Flow

```
┌─────────────────────────────────────────────────────┐
│  Phase 1: Bootstrap                                 │
│  1. Load bootstrap.json from fixed local location   │
│  2. Create crypto provider                          │
│  3. Resolve external library refs → FileTrees       │
│  4. Load keystore from specified location            │
│  5. Return IBootstrapResult (roots + keystore)      │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  Phase 2: Preferences + Workspace                   │
│  1. Load preferences.json from specified location   │
│  2. Merge → IResolvedSettings                       │
│  3. Create SettingsManager (manages both files)     │
│  4. Build file sources + create Workspace           │
│  5. Post-construction validation                    │
└─────────────────────────────────────────────────────┘
```

## Error Handling: Three-Option Recovery

When an external root or referenced resource is unavailable at startup, present the user with three choices:

1. **Quit and fix** — close the app so the user can reconnect the drive / fix paths.
2. **Reset configuration** — clear references to the missing resource and proceed (e.g. remove the unavailable root from bootstrap, clear defaults that pointed to it).
3. **Proceed mitigated** — start with defaults for anything that was unreachable, but **block writes that would target missing storage locations** so data isn't silently lost. When the missing storage comes back (e.g. drive reconnected), the user can resolve the mitigation.

Specific validation checks:
- **Missing external root**: root in bootstrap can't be resolved (path gone, permission revoked)
- **Missing preferences file location**: preferences location references an unavailable root
- **Missing default target collection**: `defaultTargets.ingredients` references a nonexistent collection
- **Missing default storage root**: `defaultStorageTargets.globalDefault` references an unloaded root

## Implementation Phases

### Phase A: Model & SettingsManager (core split)

**A1. Model types**
- Add `IBootstrapSettings`, `ISettingsFileLocation`, `IPreferencesSettings` to `settings/model.ts`
- Add converters in `settings/converters.ts`
- Deprecate `ICommonSettings`, `IDeviceSettings` — keep temporarily for migration
- Update `IResolvedSettings` to source from preferences (no more device merge)
- Update `resolveSettings()` to accept `IPreferencesSettings`

**A2. SettingsManager split**
- Extend `SettingsManager` to manage 2 files: `bootstrap.json`, `preferences.json`
- Add `getBootstrapSettings()`, `updateBootstrapSettings()`, `getPreferencesSettings()`, `updatePreferencesSettings()`
- Deprecate `getCommonSettings()` / `updateCommonSettings()` / `getDeviceSettings()` / `updateDeviceSettings()`

**A3. Auto-split migration** (convenience — remove later)
- On load: if `common.json` exists but `bootstrap.json` / `preferences.json` don't, split and write new files
- Leave `common.json` in place for manual inspection

**A4. Tests for A1–A3**
- Unit tests for new converters, model types, SettingsManager with new files
- Unit tests for migration path

### Phase B: Platform initializer changes

**B1. IPlatformInitResult update**
- Add `bootstrapSettings` field; deprecate `commonSettings` / `deviceSettings`

**B2. NodePlatformInitializer**
- Load `bootstrap.json` first, use it to resolve external libs, keystore location, preferences location
- Drop device settings loading

**B3. BrowserPlatformInitializer**
- Same pattern as Node

**B4. createWorkspaceFromPlatform**
- Use bootstrap to decide what file sources to create
- Respect `includeBuiltIn` and `localStorage` flags

**B5. Tests for B1–B4**

### Phase C: Error handling & validation

**C1. Post-construction validation**
- `validateResolvedSettings(resolved, workspace)` → `ISettingsValidationWarning[]`
- Categories: `missing-root`, `missing-collection`, `missing-preferences-location`

**C2. Three-option recovery dialog**
- New `RecoveryDialog` component with quit / reset / mitigate options
- Wire into `WorkspaceBootstrap` in `App.tsx`

**C3. Write-blocking for mitigated state**
- Workspace tracks which roots are in mitigated state
- Save operations targeting mitigated roots return failure with descriptive message
- UI shows persistent banner indicating mitigated state

**C4. Tests for C1–C3**

### Phase D: UI integration

**D1. Bootstrap settings in StorageSection**
- Toggles for `includeBuiltIn`, `localStorage.library`, `localStorage.userData`
- External root list (add/remove) — persists to bootstrap
- "Restart required" banner when bootstrap has been modified

**D2. Notification banner**
- Show validation warnings on startup
- Persistent mitigated-state indicator

**D3. DefaultStorageTargets warning badges**
- Show warning icon next to invalid/unreachable selections

**D4. Tests for D1–D3**

### Phase E: Cleanup

**E1. Remove auto-split migration**
- After running once on the dev machine, remove the `common.json` → split logic
- Add a hard fail if `common.json` is detected (to catch accidental regressions)

**E2. Remove deprecated shims**
- Remove `ICommonSettings`, `IDeviceSettings`, and related converter/manager code
- Remove `resolveSettings` overload that accepted `ICommonSettings`

**E3. Final test pass**
- Remove migration tests, update all remaining tests to use new model exclusively

### Phase F (deferred): Logging settings

**F1. Add `ILoggingSettings` to `IPreferencesSettings`**
```typescript
interface ILoggingSettings {
  /** Minimum severity to record in the message log */
  recordLevel?: LogLevel;    // 'debug' | 'info' | 'warn' | 'error'
  /** Minimum severity to display in the message window */
  displayLevel?: LogLevel;
}
```

**F2. Wire through to LogReporter**
- Read from resolved settings on startup
- Expose in settings UI for runtime changes

### Phase G (deferred): Config namespacing

Allow multiple side-by-side instances via `?config=<name>` query parameter.

**G1. Read config name from URL**
- Parse `?config=xxx` in `App.tsx` before platform init
- Default to empty string (no suffix) for backward compatibility

**G2. Bootstrap filename selection**
- `bootstrap.json` (default) or `bootstrap-{config}.json`

**G3. Storage key namespacing**
- Inject config name into `storageKeyPrefix` for `IBrowserPlatformInitOptions` (e.g. `chocolate-lab-{config}`)
- Inject into `DirectoryHandleStore` DB name (e.g. `chocolate-lab-storage-{config}`)
- Inject into device-id localStorage key (e.g. `chocolate-lab-{config}:device-id`)

**Complexity assessment**: Moderate. The extension points mostly exist (`storageKeyPrefix`, `DirectoryHandleStore` constructor params). Main work is threading the config name through the init chain and ensuring all storage is isolated.

**G4. Tests for G1–G3**
