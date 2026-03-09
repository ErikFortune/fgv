# Persistence & Cache Invalidation Patterns

Survey of mutation, persistence, and cache invalidation patterns across the codebase.
Created 2026-03-08. Updated after implementing targeted per-entry invalidation.

## Architecture Overview

Two parallel library systems, each with an entity layer and a materialization layer:

| System | Entity Library | Materialized Library | Accessed via |
|--------|---------------|---------------------|--------------|
| **Shared** (recipes, ingredients, molds) | `ChocolateEntityLibrary` | `ChocolateLibrary` | `workspace.data` |
| **User** (sessions, journals, inventory, locations) | `UserEntityLibrary` | `UserLibrary` | `workspace.userData` |

Both use `PersistedEditableCollection` (PEC) for entity-level persistence and `MaterializedLibrary` for runtime caching.

**Critical distinction**: `workspace.data.clearCache()` clears **ChocolateLibrary** (shared data). `workspace.userData.clearCache()` clears **UserLibrary** (user data). These are completely different caches.

---

## Current State: User Library `onMutation` (Implemented)

PEC now supports targeted, per-entry cache invalidation for the user library:

```
PEC.addItem("inv-cocoa-butter", entity)
  → SubLibrary mutation succeeds
  → onMutation("ingredient-inventory.inv-cocoa-butter")          // PEC fires with compositeId
  → UserEntityLibrary wraps:  onMutation("ingredientInventory",  // adds SubLibraryId context
                                         "ingredient-inventory.inv-cocoa-butter")
  → App.tsx routes to:  workspace.userData.invalidateCacheEntry(subLibraryId, compositeId)
  → UserLibrary:  this._ingredientInventory?.clearCacheEntry(compositeId)  // single Map.delete()
  → PEC.save() → FileTree → disk
```

**Only the single mutated entry is evicted.** All other cached materialized objects — including in-progress editing sessions in other sub-libraries — remain intact.

### Key interfaces

- `PEC.onMutation?: (compositeId: string) => void` — PEC-level, entity-scoped
- `IUserEntityPersistenceConfig.onMutation?: (subLibraryId: SubLibraryId, compositeId: string) => void` — config-level, sub-library-scoped
- `UserLibrary.invalidateCacheEntry(subLibraryId, compositeId)` — targeted eviction
- `UserLibrary.clearCache()` — full eviction (still available for bulk operations)
- `MaterializedLibrary.clearCacheEntry(id)` / `clearCache()` — cache primitives

### Hooks cleaned up

Wrong-cache `workspace.data.clearCache()` calls removed from PEC-based mutations in:
- `useMoldInventoryActions` (add/update/delete)
- `useIngredientInventoryActions` (add/update/delete)
- `useLocationActions` (add/update/delete)

`reactiveWorkspace.notifyChange()` retained in all — needed for React re-renders.

---

## Pattern 1: `useEntityMutation` (Shared Library Entities)

**Used by**: Ingredients, fillings, molds, procedures, tasks, decorations
**File**: `chocolate-lab-ui/.../editing/useEntityMutation.ts`

```
User action → setInMutableCollection() → SubLibrary mutation (via CollectionManager)
           → persistIfRequested()      → PEC.save() → FileTree → disk
           → refreshWorkspace()        → workspace.data.clearCache() + notifyChange()
```

- Mutations go through `CollectionManager`, NOT through PEC's `addItem`/`upsertItem`/`removeItem`
- Persistence is triggered manually via `PEC.save()` (not PEC mutation methods)
- Cache invalidation: manual `workspace.data.clearCache()` — **correct** (shared data)
- `onMutation` callback: **not wired** on `ChocolateEntityLibrary.configurePersistence`

### Why it works differently

The shared library's edit model is "explicit save": the user edits in a form, hits Save, and the hook orchestrates mutate + persist + invalidate as one operation. PEC's `addItem`/`upsertItem`/`removeItem` (which auto-call `save()`) aren't used — the hook manages the pipeline itself.

---

## Pattern 2: Inventory & Location Actions (User Library Entities via PEC)

**Used by**: Mold inventory, ingredient inventory, locations
**Files**: `chocolate-lab-ui/.../inventory/use{Mold,Ingredient}InventoryActions.ts`, `useLocationActions.ts`

```
User action → PEC.addItem()/upsertItem()/removeItem()
              ├── SubLibrary mutation
              ├── onMutation(compositeId)  → targeted cache eviction  [IMPLEMENTED]
              ├── PEC.save()               → FileTree → disk
              └── return
           → reactiveWorkspace.notifyChange()
```

- Mutations go through PEC's domain-aware methods (auto-save after each mutation)
- Cache invalidation: `onMutation` → `invalidateCacheEntry()` — **correct and targeted**

---

## Pattern 3: Session Lifecycle (User Library, Mixed)

**Used by**: Session create, save, status update, delete
**Files**: `UserLibrary` (ts-chocolate), `useSessionActions.ts` (chocolate-lab-ui)

### UserLibrary internal methods

```
UserLibrary.updateSessionStatus()
  → SubLibrary.upsertSession()    (direct, NOT via PEC)
  → this._sessions = undefined    (full sessions cache invalidation)
```

Session mutations go **directly to SubLibrary**, bypassing PEC. UserLibrary manually sets `this._sessions = undefined` after each mutation. This drops the entire sessions MaterializedLibrary.

### UserLibrary "AndPersist" methods

```
UserLibrary.saveSessionAndPersist()
  → saveSession()                           (direct SubLibrary mutation)
  → _persistSessionsCollectionIfSupported() (PEC.save() for FileTree write)
```

These use PEC only for persistence (`.save()`), not for mutation. PEC's `onMutation` does NOT fire because `addItem`/`upsertItem`/`removeItem` aren't called.

### useSessionActions hook

```
useSessionActions.createFillingSession()
  → workspace.userData.createPersistedFillingSessionAndSave()
  → workspace.data.clearCache()     ← Wrong cache! (harmless since UserLibrary clears internally)
  → reactiveWorkspace.notifyChange()
```

The hook clears `workspace.data` (ChocolateLibrary) but sessions are user data. Works because UserLibrary methods already do `this._sessions = undefined` internally.

---

## Pattern 4: Collection & Entity Operations (Shared Library, Direct)

**Used by**: Create/delete/import collections, delete/copy/move entities
**Files**: `useCollectionActions.ts`, `useEntityActions.ts`

```
User action → SubLibrary.addCollectionWithItems() / removeCollection()  (direct)
           → workspace.data.clearCache() + notifyChange()
           → persistCollections()  → workspace.data.entities.saveCollection()
```

- **No PEC involvement** for mutation — uses direct SubLibrary or CollectionManager
- Persistence via `saveCollection()` which internally uses PEC.save()
- Cache invalidation: manual `workspace.data.clearCache()` — **correct** (shared data)

---

## Pattern 5: `ensureCollectionId` (Both Libraries)

Present in inventory and location action hooks. Creates a collection if it doesn't exist.

```
ensureCollectionId()
  → SubLibrary.addCollectionWithItems()  (direct, NOT via PEC)
  → SubLibrary.createCollectionFile()
  → workspace.data.clearCache()          ← Wrong cache for user data, but harmless
  → reactiveWorkspace.notifyChange()
```

This is a collection-level operation (creating a container), not an entity mutation. It doesn't go through PEC and `onMutation` won't fire. The manual `clearCache` calls here target ChocolateLibrary rather than UserLibrary.

---

## Remaining Issues

### 1. Wrong-cache calls still present (harmless but wasteful)

These calls clear `workspace.data` (ChocolateLibrary) when the mutation is on user data:
- `useSessionActions`: 5 calls (harmless — UserLibrary already invalidates internally)
- `useMoldInventoryActions.ensureCollectionId`: 1 call
- `useIngredientInventoryActions.ensureCollectionId`: 1 call
- `useLocationActions.ensureCollectionId`: 1 call

### 2. Session mutations bypass PEC

UserLibrary session methods (`updateSessionStatus`, `removeSession`, `saveSession`) mutate SubLibrary directly, then use PEC only for `.save()`. This means:
- `onMutation` doesn't fire for session mutations
- Cache invalidation is manual (`this._sessions = undefined`) — drops the full sessions cache
- The "AndPersist" methods duplicate the PEC save pipeline manually

### 3. `onMutation` not wired for ChocolateEntityLibrary

`IPersistenceConfig` (shared library) doesn't have `onMutation`. The `useEntityMutation` hook handles invalidation manually via `refreshWorkspace()`.

### 4. Collection operations not via PEC

Creating/deleting collections uses direct SubLibrary APIs. This is arguably correct (PEC is for entity-level CRUD within a collection), but it means collection operations need their own invalidation pattern.

---

## Convergence Opportunities

### Near-term (low risk, clear value)

1. **Clean up `useSessionActions`** — remove the `workspace.data.clearCache()` calls since UserLibrary already invalidates internally. These are clearing the wrong cache and doing nothing useful.

2. **Fix `ensureCollectionId` cache target** — these should clear `workspace.userData.clearCache()` (or at minimum also clear it) since they're creating user-library collections. Currently only ChocolateLibrary is cleared.

### Medium-term (worth exploring)

3. **Wire `onMutation` for `ChocolateEntityLibrary`** — add `onMutation` to `IPersistenceConfig`, wire targeted invalidation in App.tsx. Then `useEntityMutation.refreshWorkspace()` could delegate to the callback instead of manually calling `clearCache()`. Would need to think about whether per-entry invalidation is sufficient for shared data (cross-entity references like ingredients→fillings mean editing an ingredient could invalidate cached fillings that reference it).

4. **Move session mutations through PEC** — refactor UserLibrary session methods to use PEC's `upsertItem`/`removeItem` instead of direct SubLibrary mutation. This would make `onMutation` fire for sessions too, enabling targeted per-entry eviction instead of dropping the entire sessions cache. The main challenge is that session entities have complex lifecycle semantics (status transitions, execution state) that currently live in UserLibrary.

### Worth investigating

5. **Cross-entity cache dependencies** — when a shared-library entity changes (e.g., an ingredient is renamed), materialized objects in other libraries that reference it may hold stale data. Today `workspace.data.clearCache()` drops everything, which is safe but heavy. A dependency-aware invalidation system could be more targeted, but the complexity may not be justified unless performance becomes an issue.

6. **Unify persistence config interfaces** — `IPersistenceConfig` and `IUserEntityPersistenceConfig` are nearly identical. Could share a base interface, especially once both support `onMutation`.

7. **`ensureCollectionId` as a library method** — collection creation is currently scattered across hooks with manual FileTree and cache management. Could be a method on UserEntityLibrary with proper invalidation built in.
