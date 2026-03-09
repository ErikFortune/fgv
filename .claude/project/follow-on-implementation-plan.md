# Follow-On TODO Backlog: Full Implementation Plan

## Context

After the pre-merge hygiene pass, 10 TODOs remain in `.claude/project/follow-on-todos.md` plus one new item (confectionWrapper ingredient slot coverage). This plan addresses all of them in dependency order across 5 phases.

**Source files are under `libraries/ts-chocolate/src/packlets/`** — paths below are relative to that.

---

## Phase 1: Quick Wins (no design decisions)

### 1A. Type guard cleanup — `userLibrary.ts:464`

The `_materializeTypedConfessionSession()` method uses `confection as unknown as MoldedBonBonRecipe` etc. after type guard checks. The type guards on `IConfectionBase` narrow to *interfaces* (`this is IMoldedBonBonRecipe`), but `fromPersistedState()` takes the *concrete class* (`MoldedBonBonRecipe`).

**Fix:** Change `fromPersistedState()` on all three confection session classes to accept the interface type instead of the concrete class:
- `MoldedBonBonEditingSession.fromPersistedState(baseConfection: IMoldedBonBonRecipe, ...)`
- `BarTruffleEditingSession.fromPersistedState(baseConfection: IBarTruffleRecipe, ...)`
- `RolledTruffleEditingSession.fromPersistedState(baseConfection: IRolledTruffleRecipe, ...)`

Also change `.create()` on each class to accept the interface. Then remove the `as unknown as` casts from `userLibrary.ts`. Remove the TODO.

**Files:** `session/barTruffleEditingSession.ts`, `session/moldedBonBonEditingSession.ts`, `session/rolledTruffleEditingSession.ts`, `user-library/userLibrary.ts`

### 1B. Confection wrapper ingredient slot coverage — `confectionWrapper.ts:687,974,1174`

Add test data with an ingredient-type filling option as the *preferred* option in a confection recipe, then test `fromSource()` on that recipe to cover the ingredient branch of `_convertFillingSlot()`.

**Steps:**
1. In `confectionWrapper.test.ts`, create a test confection entity where at least one filling slot has `preferredId` pointing to an ingredient-type option
2. Test `ProducedMoldedBonBon.fromSource()` (or similar) with that entity
3. Verify the produced filling slot has `slotType: 'ingredient'`
4. Remove the `c8 ignore` directives and the TODO comments from all 3 copies

**Files:** `library-runtime/produced/confectionWrapper.ts`, `test/unit/library-runtime/produced/confectionWrapper.test.ts`

### 1C. Mutability guard cleanup — `editingSession.ts:266,294`

These guards are correct code that's currently unreachable because `isMutable` is hardcoded to `true`. After Phase 2A (below) wires up the real mutability check, these become reachable. For now:
- Remove the `/* c8 ignore */` directives
- Replace the `// TODO: use result pattern` comment on line 266 with nothing (the code already uses `return fail(...)` correctly)

The guards will become covered by tests written in Phase 2A.

**Files:** `user-library/session/editingSession.ts`

---

## Phase 2: Medium Complexity (established patterns)

### 2A. Collection mutability check — `editingSession.ts:234`

Replace hardcoded `const isMutable = true` with a real check.

**Design:** The `EditingSession` already has `this._baseRecipe` (an `IFillingRecipeVariation`). The variation has access to its parent recipe and collection via the runtime context. The `EditableCollection` class already has `readonly isMutable: boolean`.

**Implementation path:**
1. `EditingSession` constructor already receives `baseRecipe: IFillingRecipeVariation`
2. The base recipe comes from a `MaterializedLibrary` (specifically, `this._context.fillings`)
3. Need to trace: `IFillingRecipeVariation` → parent `FillingRecipe` → source collection → `isMutable`
4. Add a `readonly isMutable: boolean` accessor on `IFillingRecipeVariation` / `FillingRecipeVariation` that delegates to the collection
5. Wire `analyzeSaveOptions()` to use `this._baseRecipe.isMutable` instead of `true`

**Testing:**
- Create an `EditingSession` with a recipe from an immutable collection
- Verify `analyzeSaveOptions()` returns `canCreateVariation: false`, `mustCreateNew: true`
- Verify `saveAsNewVariation()` fails with appropriate error
- Remove c8 ignore on the guard at lines 266-269 and 294-297

**Files:** `library-runtime/fillings/fillingRecipeVariation.ts`, `library-runtime/model.ts`, `user-library/session/editingSession.ts`, `test/unit/user-library/session/editingSession.test.ts`

### 2B. Confection session persistence — `userLibrary.ts:299`

**Current:** `saveSession()` rejects confection sessions with `"does not support persistence"`. The pattern for filling sessions is established via `EditingSession.toPersistedState()`.

**Design:** Each confection editing session class needs a `toPersistedState()` method that serializes:
- The produced confection's editing history (already available via `this._produced.history`)
- Child filling session IDs (already tracked in `this._fillingSessions`)
- Type-specific state (yield spec, mold ID for bonbons)

**Implementation:**
1. Add `toPersistedState(params: IPersistedConfectionSessionParams): Result<IConfectionSessionEntity>` to `ConfectionEditingSessionBase`
2. The method serializes: confection type, history, child session IDs, yield
3. Override in `MoldedBonBonEditingSession` to add mold-specific state
4. Update `UserLibrary.saveSession()` to handle confection sessions by dispatching to `toPersistedState()`
5. Remove the `instanceof` check and TODO at line 299

**Files:** `user-library/session/confectionEditingSessionBase.ts`, `user-library/session/moldedBonBonEditingSession.ts`, `user-library/userLibrary.ts`, `entities/session/model.ts` (if `IConfectionSessionEntity` needs extension), tests

### 2C. `ignore-errors` startup mode — `nodeFactory.ts:220`

**Current:** Returns `fail('ignore-errors mode not yet implemented')` when platform init fails.

**Design:** Create a minimal workspace with default settings when platform initialization fails. This provides a degraded-but-functional state.

**Implementation:**
1. When `startupMode === 'ignore-errors'` and `platformResult.isFailure()`:
   - Log a warning with the failure message
   - Create default common and device settings
   - Create a `Workspace` with empty libraries and no key store
   - Return the minimal workspace (it will have no data but be functional)
2. Use `Workspace.create()` with no `fileSources` and no `keyStore`

**Files:** `workspace/nodeFactory.ts`, `test/unit/workspace/nodeFactory.test.ts`

---

## Phase 3: ProducedToSource Conversion — `editingSession.ts:274,322`

### 3A. Implement `producedToSource()` on `ProducedFilling`

**Data model mapping (reverse of `fromSource`):**

| Produced (`IProducedFillingIngredientEntity`) | Source (`IFillingIngredientEntity`) |
|---|---|
| `ingredientId: IngredientId` | `ingredient: { ids: [ingredientId], preferredId: ingredientId }` |
| `amount: Measurement` | `amount: Measurement` (divide by `scaleFactor` to get unscaled) |
| `unit?: MeasurementUnit` | `unit?: MeasurementUnit` |
| `modifiers?: IIngredientModifiers` | `modifiers?: IIngredientModifiers` |
| `notes?: ICategorizedNote[]` | `notes?: ICategorizedNote[]` |

| Produced (`IProducedFillingEntity`) | Source (`IFillingRecipeVariationEntity`) |
|---|---|
| `variationId` | `variationSpec` (extracted from ID) |
| `targetWeight / scaleFactor` | `baseWeight` |
| `ingredients[]` | `ingredients[]` (converted per above) |
| `procedureId?` | `procedures: { options: [{ id: procedureId }], preferredId: procedureId }` |
| `notes?` | `notes?` |
| (not present) | `createdDate` (use current ISO date) |
| (not present) | `ratings` (empty/omitted) |
| (not present) | `yield` (omitted) |

**Implementation:**
1. Add static method `ProducedFilling.toSourceVariation(snapshot: IProducedFillingEntity, newVariationSpec: string, createdDate?: string): Result<IFillingRecipeVariationEntity>`
2. Add private helper `_convertIngredientToSource(ing: IProducedFillingIngredientEntity, scaleFactor: number): IFillingIngredientEntity`
3. Unscale amounts: `amount = produced.amount / scaleFactor` to recover base recipe weight
4. Wrap single ingredient IDs in `IIdsWithPreferred`: `{ ids: [ingredientId], preferredId: ingredientId }`
5. Wrap procedure ID in `IOptionsWithPreferred`: `{ options: [{ id: procedureId }], preferredId: procedureId }`

### 3B. Wire into `saveAsNewVariation()` and `saveAsNewRecipe()`

**`saveAsNewVariation()` (line 274):**
```typescript
// Convert produced state to source variation entity
return ProducedFilling.toSourceVariation(this._produced.snapshot, options.variationSpec)
  .onSuccess((variationEntity) =>
    this._createJournalEntry(options.variationSpec, sessionNotes, variationEntity)
      .onSuccess((journalEntry) => succeed({
        journalId: journalEntry.baseId,
        journalEntry,
        newVariationSpec: options.variationSpec
      }))
  );
```

**`saveAsNewRecipe()` (line 322):** Same pattern.

**`_createJournalEntry` update:** Add optional `updatedVariation` parameter so the journal entry records the new variation entity in its `updated` field.

**Files:** `library-runtime/produced/fillingWrapper.ts`, `user-library/session/editingSession.ts`, tests

---

## Phase 4: Alternatives Merge — `editingSession.ts:301`

### 4A. Design: What "alternatives" means

When a user edits a filling session and saves as alternatives, the intent is: "Keep the original ingredient choices, but add my edits as additional options."

**Merge semantics:**
- For each ingredient position `i` in the variation:
  - Original variation has: `ingredient: { ids: [A, B], preferredId: A }`
  - User chose ingredient C during editing (in produced entity: `ingredientId: C`)
  - **If C is already in ids:** Update `preferredId` to C (no structural change)
  - **If C is new:** Append to ids, update preferredId: `{ ids: [A, B, C], preferredId: C }`
- Amounts, modifiers, notes: Use the *original* values (alternatives only change which ingredient, not how much)
- Procedure: If changed, add to procedure options similarly
- The variation entity is *updated in place* (no new variation spec)

### 4B. Implementation

1. Add `ProducedFilling.mergeAsAlternatives(produced: IProducedFillingEntity, original: IFillingRecipeVariationEntity): Result<IFillingRecipeVariationEntity>`
2. For each ingredient pair (by position index):
   - Get produced `ingredientId`
   - Get original `ingredient.ids` array
   - If produced ID not in original IDs: append it
   - Set `preferredId` to produced ID
   - Keep original `amount`, `unit`, `modifiers`
3. Handle ingredient count mismatches:
   - If produced has *fewer* ingredients: keep original extras unchanged
   - If produced has *more* ingredients: append new ones as single-option entries
4. Return the updated `IFillingRecipeVariationEntity`

**Wire into `saveAsAlternatives()`:**
```typescript
return ProducedFilling.mergeAsAlternatives(this._produced.snapshot, this._baseRecipe.entity)
  .onSuccess((mergedVariation) =>
    this._createJournalEntry(options.variationSpec, sessionNotes, mergedVariation)
      .onSuccess((journalEntry) => succeed({
        journalId: journalEntry.baseId,
        journalEntry,
        newVariationSpec: options.variationSpec
      }))
  );
```

**Files:** `library-runtime/produced/fillingWrapper.ts`, `user-library/session/editingSession.ts`, tests

---

## Phase 5: Workspace Architecture

### 5A. Dual-root and multi-root modes — `nodeFactory.ts:206`

**Design:**
- **Dual-root** (`installationPath` + `libraryPath`): Settings and keystore come from `installationPath`; library data comes from `libraryPath` (optionally read-only)
- **Multi-root** (`installationPath` + `libraryPaths[]`): Same as dual-root but with multiple library directories

**Implementation:**
1. Extract common platform init logic from the single-root path
2. For dual-root:
   - Initialize platform with `installationPath` as `userLibraryPath` (for settings)
   - Add `libraryPath` as an additional file source with `mutable: !libraryReadOnly`
3. For multi-root:
   - Initialize platform with `installationPath` as `userLibraryPath`
   - Add each `libraryPaths[i]` as an additional file source with appropriate mutability
4. Both modes pass `additionalFileSources` to `createWorkspaceFromPlatform()`

**Files:** `workspace/nodeFactory.ts`, `test/unit/workspace/nodeFactory.test.ts`

### 5B. Architectural delegation — `workspaceInit.ts:162`

**Design:** The `initializeWorkspace()` function currently creates directories and writes settings directly. Instead, it should delegate to:
1. Library module: create default library directory structure
2. User library module: create default user library directory structure
3. Settings module: create and write default settings

**Implementation:**
1. Add `createDefaultLibraryDirectories(rootPath: string): Result<void>` to library-data module
2. Add `createDefaultUserLibraryDirectories(rootPath: string): Result<void>` to user-entities module
3. Settings module already has `writeCommonSettings()` and `writeDeviceSettings()`
4. Refactor `initializeWorkspace()` to call these three modules

**Files:** `library-data/index.ts` (or new file), `user-entities/index.ts` (or new file), `workspace/workspaceInit.ts`, tests

---

## Implementation Order

| Order | Phase | Items | Est. Complexity |
|-------|-------|-------|-----------------|
| 1 | 1A | Type guard cleanup | LOW |
| 2 | 1B | Ingredient slot coverage | LOW |
| 3 | 1C | Mutability guard c8 cleanup | LOW |
| 4 | 2A | Collection mutability check | MEDIUM |
| 5 | 2B | Confection session persistence | MEDIUM-HIGH |
| 6 | 2C | ignore-errors startup mode | MEDIUM |
| 7 | 3A-B | ProducedToSource conversion | MEDIUM |
| 8 | 4A-B | Alternatives merge logic | MEDIUM-HIGH |
| 9 | 5A | Dual/multi-root modes | MEDIUM |
| 10 | 5B | Architectural delegation | MEDIUM |

Build + test (`cd libraries/ts-chocolate && npx heft test`) after each phase.

## Verification

After all phases:
- All existing tests pass
- New tests cover previously-ignored branches
- No `as unknown as` casts remain in `userLibrary.ts`
- All TODOs from `follow-on-todos.md` are resolved
- Coverage improves (fewer c8 ignores)
