# Runtime Layer ID Return Inventory

This document inventories all locations in the ts-chocolate runtime layer where methods/properties return **IDs** instead of **direct runtime object references**.

**Goal**: Identify where the API returns IDs that require manual lookup, rather than providing direct object references for easy navigation.

**Date**: 2026-01-12

---

## Summary

The runtime layer is **partially completed** - some areas have been refactored to return direct object references, while others still return IDs.

### ✅ Already Returning Direct Object References

These areas are **correctly implemented**:

1. **RuntimeVersion.fillingRecipe** - Returns `IRuntimeFillingRecipe` (not just FillingId)
2. **RuntimeScaledVersion.scaledFrom.sourceVersion** - Returns `IRuntimeFillingRecipeVersion` (not just VersionId)
3. **IResolvedFillingIngredient.ingredient** - Returns `IRuntimeIngredient` (not just IngredientId)
4. **IResolvedFillingIngredient.alternates** - Returns `IRuntimeIngredient[]` (not just IngredientId[])
5. **IResolvedScaledIngredient.ingredient** - Returns `IRuntimeIngredient` (not just IngredientId)
6. **IResolvedScaledIngredient.alternates** - Returns `IRuntimeIngredient[]` (not just IngredientId[])
7. **IResolvedFillingRecipeProcedure.procedure** - Returns `IProcedure` (not just ProcedureId)
8. **IRuntimeIngredient navigation methods** - Return `IRuntimeFillingRecipe[]` (not FillingId[])
   - `usedByFillings()`
   - `primaryInFillings()`
   - `alternateInFillings()`

---

## ❌ Areas Returning IDs Instead of Objects

### 1. Entity Layer - Confection Filling Slots

**Location**: `src/packlets/entities/confections/model.ts`

These are **entity-layer** IDs but directly impact runtime usage:

#### IFillingSlot (lines 130-137)
```typescript
export interface IFillingSlot {
  readonly slotId: SlotId;
  readonly name?: string;
  readonly filling: IOptionsWithPreferred<AnyFillingOption, FillingOptionId>;
  //                                      ^^^^^^^^^^^^^^^^^
  // Returns FillingOptionId (FillingId | IngredientId)
  // Should return resolved filling/ingredient objects
}
```

**Issue**: The `filling.options` array contains `IRecipeFillingOption` and `IIngredientFillingOption` which have:
- `IRecipeFillingOption.id: FillingId` - should be `filling: IRuntimeFillingRecipe`
- `IIngredientFillingOption.id: IngredientId` - should be `ingredient: IRuntimeIngredient`

**Impact**: Runtime confections inherit these IDs in their filling slots.

#### IChocolateSpec (line 149)
```typescript
export type IChocolateSpec = IIdsWithPreferred<IngredientId>;
```

**Issue**: Returns `IngredientId[]` with preferred selection
**Should Return**: `IRuntimeIngredient[]` with preferred selection

**Impact**: Used in:
- `IMoldedBonBonVersion.shellChocolate`
- `IMoldedBonBonVersion.additionalChocolates[].chocolate`
- `IBarTruffleVersion.enrobingChocolate`
- `IRolledTruffleVersion.enrobingChocolate`

#### ICoatings (line 212)
```typescript
export type ICoatings = IIdsWithPreferred<IngredientId>;
```

**Issue**: Returns `IngredientId[]` with preferred selection
**Should Return**: `IRuntimeIngredient[]` with preferred selection

**Impact**: Used in `IRolledTruffleVersion.coatings`

#### IConfectionMoldRef (line 172)
```typescript
export type IConfectionMoldRef = IRefWithNotes<MoldId>;
```

**Issue**: Returns `MoldId`
**Should Return**: `IRuntimeMold`

**Impact**: Used in `IMoldedBonBonVersion.molds`

#### IProcedureRef (entities/fillings/model.ts, used in confections)
```typescript
export type IProcedureRef = IRefWithNotes<ProcedureId>;
```

**Issue**: Returns `ProcedureId`
**Should Return**: `IRuntimeProcedure`

**Impact**: Used in:
- `IFillingRecipeVersion.procedures`
- `IConfectionVersionBase.procedures`

---

### 2. Runtime Layer - Confection Properties

**Location**: `src/packlets/runtime/confections/runtimeConfectionBase.ts`

These properties pass through entity-layer types that contain IDs:

#### Runtime Confection Procedures (line 197)
```typescript
public get procedures(): IOptionsWithPreferred<IProcedureRef, ProcedureId> | undefined {
  return this._goldenVersion.procedures;
}
```

**Issue**: Returns `IProcedureRef` array with `ProcedureId` references
**Should Return**: `IResolvedProcedures` with `IRuntimeProcedure` objects (like versions do)

**File**: `runtimeConfectionBase.ts:197`

#### Runtime Confection Fillings (line 190)
```typescript
public get fillings(): ReadonlyArray<IFillingSlot> | undefined {
  return this._goldenVersion.fillings;
}
```

**Issue**: Returns `IFillingSlot[]` which contain `FillingId` and `IngredientId` references
**Should Return**: Array of slots with resolved `IRuntimeFillingRecipe` or `IRuntimeIngredient` objects

**File**: `runtimeConfectionBase.ts:190`

#### Runtime Molded BonBon - Molds (from interface, line ~1369 in model.ts)
```typescript
// IRuntimeMoldedBonBon interface
readonly molds: IOptionsWithPreferred<IConfectionMoldRef, MoldId>;
```

**Issue**: Returns `IConfectionMoldRef` array with `MoldId` references
**Should Return**: Options with resolved `IRuntimeMold` objects

#### Runtime Molded BonBon - Shell Chocolate (from interface)
```typescript
// IRuntimeMoldedBonBon interface
readonly shellChocolate: IChocolateSpec;
```

**Issue**: Returns `IIdsWithPreferred<IngredientId>`
**Should Return**: Options with resolved `IRuntimeIngredient` objects

#### Runtime Molded BonBon - Additional Chocolates (from interface)
```typescript
// IRuntimeMoldedBonBon interface
readonly additionalChocolates?: ReadonlyArray<IAdditionalChocolate>;
```

**Issue**: `IAdditionalChocolate.chocolate` is `IIdsWithPreferred<IngredientId>`
**Should Return**: Options with resolved `IRuntimeIngredient` objects

#### Runtime Bar/Rolled Truffle - Enrobing Chocolate (from interfaces)
```typescript
// IRuntimeBarTruffle/IRuntimeRolledTruffle interfaces
readonly enrobingChocolate?: IChocolateSpec;
```

**Issue**: Returns `IIdsWithPreferred<IngredientId>`
**Should Return**: Options with resolved `IRuntimeIngredient` objects

#### Runtime Rolled Truffle - Coatings (from interface)
```typescript
// IRuntimeRolledTruffle interface
readonly coatings?: ICoatings;
```

**Issue**: Returns `IIdsWithPreferred<IngredientId>`
**Should Return**: Options with resolved `IRuntimeIngredient` objects

---

### 3. Session Layer - Editing Sessions

**Location**: `src/packlets/runtime/session/model.ts`

Session state interfaces track IDs for selections:

#### ISessionFillingSlot (lines 243-274)
```typescript
export interface ISessionFillingSlot {
  readonly slotId: SlotId;
  readonly fillingId?: FillingId;  // ❌ Returns ID
  readonly ingredientId?: IngredientId;  // ❌ Returns ID
  readonly originalFillingId?: FillingId;  // ❌ Returns ID
  readonly originalIngredientId?: IngredientId;  // ❌ Returns ID
  readonly status: ConfectionSelectionStatus;
}
```

**Issue**: Returns IDs only
**Should Consider**: Adding resolved object accessors OR accepting IDs here since sessions are transient

#### ISessionMold (lines 277-295)
```typescript
export interface ISessionMold {
  readonly moldId: MoldId;  // ❌ Returns ID
  readonly originalMoldId: MoldId;  // ❌ Returns ID
  readonly status: ConfectionSelectionStatus;
}
```

**Issue**: Returns IDs only
**Should Consider**: Adding resolved object accessors OR accepting IDs here since sessions are transient

#### ISessionChocolate (lines 297+)
```typescript
export interface ISessionChocolate {
  readonly ingredientId: IngredientId;  // ❌ Returns ID
  readonly originalIngredientId: IngredientId;  // ❌ Returns ID
  readonly role: ChocolateRole;
  readonly status: ConfectionSelectionStatus;
}
```

**Issue**: Returns IDs only
**Should Consider**: Adding resolved object accessors OR accepting IDs here since sessions are transient

#### ISessionCoating (model.ts, likely exists)
```typescript
export interface ISessionCoating {
  readonly ingredientId: IngredientId;  // ❌ Returns ID
  readonly originalIngredientId: IngredientId;  // ❌ Returns ID
  readonly status: ConfectionSelectionStatus;
}
```

**Issue**: Returns IDs only
**Should Consider**: Adding resolved object accessors OR accepting IDs here since sessions are transient

#### ISessionProcedure (model.ts, likely exists)
```typescript
export interface ISessionProcedure {
  readonly procedureId: ProcedureId;  // ❌ Returns ID
  readonly originalProcedureId: ProcedureId;  // ❌ Returns ID
  readonly status: ConfectionSelectionStatus;
}
```

**Issue**: Returns IDs only
**Should Consider**: Adding resolved object accessors OR accepting IDs here since sessions are transient

#### ISessionIngredient (lines 61-91)
```typescript
export interface ISessionIngredient {
  readonly ingredientId: IngredientId;  // ❌ Returns ID
  readonly substitutedFor?: IngredientId;  // ❌ Returns ID
  // ...other properties
}
```

**Issue**: Returns IDs only
**Should Consider**: Adding resolved object accessors OR accepting IDs here since sessions are transient

---

### 4. Journal Layer - Record References

**Location**: `src/packlets/entities/journal/library.ts`

Journal records contain IDs by design (for persistence), but querying methods return IDs:

#### Journal Library Query Methods (lines 170-197)
```typescript
public getJournalsForFilling(fillingId: FillingId): ReadonlyArray<IFillingRecipeJournalRecord>
public getJournalsForFillingVersion(versionId: FillingVersionId): ReadonlyArray<IFillingRecipeJournalRecord>
```

**Issue**: These methods require passing IDs
**Note**: This is likely **correct** - journals are entity-layer persistence, IDs are appropriate here

**Location**: `src/packlets/runtime/model.ts` - IRuntimeContext interface

#### Runtime Context Journal Methods (lines 1158-1166)
```typescript
getJournalsForFilling(fillingId: FillingId): ReadonlyArray<IFillingRecipeJournalRecord>;
getJournalsForFillingVersion(versionId: FillingVersionId): ReadonlyArray<IFillingRecipeJournalRecord>;
```

**Issue**: Runtime context exposes ID-based journal queries
**Should Consider**: Adding convenience methods that accept `IRuntimeFillingRecipe` or `IRuntimeFillingRecipeVersion` objects

---

### 5. Common Pattern - IIdsWithPreferred and IOptionsWithPreferred

**Location**: `src/packlets/common/` (used throughout)

These generic patterns are used extensively but operate on IDs:

#### IIdsWithPreferred<TId>
```typescript
export interface IIdsWithPreferred<TId> {
  readonly ids: ReadonlyArray<TId>;  // ❌ Array of IDs
  readonly preferredId?: TId;  // ❌ Optional ID
}
```

**Used For**:
- Ingredient options in recipes (`IFillingIngredient.ingredient`)
- Chocolate specs in confections
- Coating specs in confections

**Issue**: Generic pattern that stores IDs
**Should Have Runtime Equivalent**: `IResolvedOptionsWithPreferred<TObject>` with resolved objects

#### IOptionsWithPreferred<TOption, TId>
```typescript
export interface IOptionsWithPreferred<TOption extends IHasId<TId>, TId> {
  readonly options: ReadonlyArray<TOption>;  // Options contain .id property
  readonly preferredId?: TId;  // ❌ Optional ID reference
}
```

**Used For**:
- Procedure options (`IFillingRecipeVersion.procedures`)
- Mold options (`IMoldedBonBonVersion.molds`)
- Filling slot options (`IFillingSlot.filling`)

**Issue**: Options contain `.id` properties, `preferredId` is an ID
**Should Have Runtime Equivalent**: Resolved options pattern with object references

---

## Priority Assessment

### High Priority (Core Navigation)

1. **Confection Filling Slots** - Users need to navigate from confection → filling recipe → ingredients
2. **Confection Chocolate Specs** - Users need to access chocolate ingredient details
3. **Confection Molds** - Users need mold details when working with molded bonbons
4. **Confection Procedures** - Already resolved in versions, should be resolved in confections too

### Medium Priority (User Experience)

5. **Runtime Context Journal Methods** - Convenience methods accepting objects would improve UX
6. **Confection Additional Chocolates** - Less frequently used but still important
7. **Confection Coatings** - Only applies to rolled truffles

### Low Priority (Transient/Internal)

8. **Session Layer IDs** - Sessions are mutable and transient, IDs might be acceptable
9. **Journal Library** - Entity-layer persistence, IDs are appropriate

---

## Recommended Approach

### Phase 1: Define Runtime Resolution Patterns

Create runtime equivalents of common ID-based patterns:

1. **IResolvedIdsWithPreferred** - Replace `IIdsWithPreferred<IngredientId>` with resolved ingredients
2. **IResolvedOptionsWithPreferred** - Replace generic options pattern with resolved objects
3. **IResolvedFillingOption** - Discriminated union with resolved filling/ingredient objects

### Phase 2: Confection Filling Resolution

Resolve filling slots to return runtime objects:
- Create `IResolvedFillingSlot` with `IRuntimeFillingRecipe` or `IRuntimeIngredient` references
- Update `IRuntimeConfection.fillings` to return resolved slots
- Add lazy resolution in `RuntimeConfectionBase`

### Phase 3: Confection Chocolate/Mold Resolution

Resolve ingredient and mold references:
- Create resolved chocolate spec type with `IRuntimeIngredient` references
- Create resolved mold ref type with `IRuntimeMold` references
- Update confection type-specific properties

### Phase 4: Convenience Methods

Add convenience methods to runtime context:
- `getJournalsForFilling(filling: IRuntimeFillingRecipe)`
- `getJournalsForVersion(version: IRuntimeFillingRecipeVersion)`

### Phase 5: Session Layer (Optional)

Evaluate whether sessions should:
- Keep IDs (simpler, transient data)
- Add resolved object accessors (better UX, more complexity)
- Hybrid approach (store IDs, provide accessors)

---

## Notes

- The **ingredients** and **recipes** domains are well-refactored with proper object references
- The **confections** domain is the main area needing refactoring
- The **session** layer needs design discussion on whether IDs are acceptable for transient state
- The entity layer provides IDs by design (data persistence layer), runtime should add resolution

---

## Files to Review

1. `src/packlets/entities/confections/model.ts` - Entity definitions with IDs
2. `src/packlets/runtime/confections/runtimeConfectionBase.ts` - Base confection runtime
3. `src/packlets/runtime/confections/runtimeMoldedBonBon.ts` - Molded bonbon specifics
4. `src/packlets/runtime/confections/runtimeBarTruffle.ts` - Bar truffle specifics
5. `src/packlets/runtime/confections/runtimeRolledTruffle.ts` - Rolled truffle specifics
6. `src/packlets/runtime/session/model.ts` - Session state interfaces
7. `src/packlets/runtime/model.ts` - Runtime layer interfaces (especially IRuntimeConfection)
8. `src/packlets/common/model.ts` - Common ID-based patterns (IIdsWithPreferred, IOptionsWithPreferred)
