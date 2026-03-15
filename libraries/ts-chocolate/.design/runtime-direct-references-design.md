# Runtime Layer Direct Object References - Technical Design

## Summary

Refactor the runtime confection layer to return direct object references (like ingredients and recipes already do) instead of IDs requiring manual lookups. This creates consistent patterns across the runtime layer and improves developer experience.

> **Note**: Breaking changes are not a problem for this refactoring. We should not introduce any complexity for backward compatibility - no dual accessors, no deprecated patterns, no gradual migration paths. Just make the clean change.

## Architecture

### Pattern: Resolution at Construction

The existing ingredients/recipes pattern demonstrates the architecture:

1. **Construction-time resolution**: References are resolved when the runtime object is created
2. **Lazy resolution**: Resolved references are cached on first access
3. **Context provides resolution**: The context interface provides methods to resolve IDs to objects
4. **Resolved objects in interfaces**: Public interfaces expose resolved objects, not IDs

### Current State Analysis

#### ✅ Already Using Direct References

1. **RuntimeIngredient** → **RuntimeRecipe**
   - `IRuntimeIngredient.usedByFillings()`: Returns `IRuntimeFillingRecipe[]`
   - Pattern: Context provides `getFillingsUsingIngredient(id)` returning resolved recipes

2. **RuntimeRecipe** → **RuntimeIngredient**
   - `IRuntimeFillingRecipeVersion.getIngredients()`: Returns iterator of `IResolvedFillingIngredient<IRuntimeIngredient>`
   - Pattern: Version resolves ingredient IDs via `context.ingredients.get(id)` at construction
   - Includes primary ingredient + resolved alternates array

3. **RuntimeVersion** → **RuntimeProcedure**
   - `IRuntimeFillingRecipeVersion.procedures`: Returns `IResolvedProcedures` with `IProcedure` objects
   - Pattern: Lazy resolution via `_resolveProcedures()`, using `context.getProcedure(id)`

#### ❌ Currently Using IDs (Needs Refactoring)

1. **RuntimeConfection Filling Slots**
   - Current: `IFillingSlot.filling` → `IOptionsWithPreferred<AnyFillingOption, FillingOptionId>`
   - `AnyFillingOption` contains `FillingId` or `IngredientId`
   - Needs: Resolved to `IRuntimeFillingRecipe` or `IRuntimeIngredient` objects

2. **RuntimeConfection Chocolates**
   - Current: `IChocolateSpec` → `IIdsWithPreferred<IngredientId>`
   - Used in shell/enrobing/coating/additional chocolates
   - Needs: Resolved to `IRuntimeIngredient` objects (specifically chocolate ingredients)

3. **RuntimeConfection Molds**
   - Current: `IConfectionMoldRef` → `IRefWithNotes<MoldId>`
   - Needs: Resolved to `IRuntimeMold` objects

4. **RuntimeConfection Procedures**
   - Current: `IProcedureRef` in `IOptionsWithPreferred<IProcedureRef, ProcedureId>`
   - Needs: Similar to RuntimeVersion - resolved `IRuntimeProcedure` objects

## Design

### Component Architecture

```
RuntimeContext
  ├── ingredients (ValidatingLibrary<IngredientId, RuntimeIngredient>)
  ├── fillings (ValidatingLibrary<FillingId, RuntimeRecipe>)
  ├── getRuntimeMold(id) → Result<RuntimeMold>
  ├── getRuntimeProcedure(id) → Result<RuntimeProcedure>
  └── [new] confections (ValidatingLibrary<ConfectionId, RuntimeConfection>)

RuntimeConfection
  ├── Context: IConfectionContext
  │     ├── getRuntimeIngredient(id) → Result<RuntimeIngredient>
  │     ├── getRuntimeFilling(id) → Result<RuntimeRecipe>
  │     ├── getRuntimeMold(id) → Result<RuntimeMold>
  │     └── getRuntimeProcedure(id) → Result<RuntimeProcedure>
  └── Lazy Resolution: Caches resolved references on first access
```

### Interface Changes

#### Phase 1: New Resolved Reference Interfaces

```typescript
// ============================================================================
// Resolved Filling Slot
// ============================================================================

/**
 * A resolved filling option with the full recipe or ingredient object.
 * Discriminated union for type-safe access.
 */
export type IResolvedFillingOption =
  | IResolvedRecipeFillingOption
  | IResolvedIngredientFillingOption;

/**
 * Resolved recipe filling option.
 */
export interface IResolvedRecipeFillingOption {
  readonly type: 'recipe';
  readonly filling: IRuntimeFillingRecipe;
  readonly notes?: string;
  readonly raw: IRecipeFillingOption;
}

/**
 * Resolved ingredient filling option.
 */
export interface IResolvedIngredientFillingOption {
  readonly type: 'ingredient';
  readonly ingredient: IRuntimeIngredient;
  readonly notes?: string;
  readonly raw: IIngredientFillingOption;
}

/**
 * A resolved filling slot with resolved recipe/ingredient references.
 */
export interface IResolvedFillingSlot {
  readonly slotId: SlotId;
  readonly name?: string;
  readonly filling: IOptionsWithPreferred<IResolvedFillingOption, FillingOptionId>;
}

// ============================================================================
// Resolved Chocolate Specification
// ============================================================================

/**
 * A resolved chocolate specification with ingredient objects.
 * Uses same pattern as IResolvedFillingIngredient - primary + alternates.
 */
export interface IResolvedChocolateSpec {
  /** The preferred/primary chocolate ingredient (always chocolate category) */
  readonly chocolate: IRuntimeChocolateIngredient;

  /** Alternate chocolate options (all chocolate category) */
  readonly alternates: ReadonlyArray<IRuntimeChocolateIngredient>;

  /** The original raw chocolate spec */
  readonly raw: IChocolateSpec;
}

/**
 * Resolved additional chocolate with purpose.
 */
export interface IResolvedAdditionalChocolate {
  readonly chocolate: IResolvedChocolateSpec;
  readonly purpose: AdditionalChocolatePurpose;
  readonly raw: IAdditionalChocolate;
}

// ============================================================================
// Resolved Mold Reference
// ============================================================================

/**
 * A resolved mold reference with the full mold object.
 */
export interface IResolvedConfectionMoldRef {
  readonly mold: IRuntimeMold;
  readonly notes?: string;
  readonly raw: IConfectionMoldRef;
}

// ============================================================================
// Resolved Procedure Reference (for confections)
// ============================================================================

/**
 * A resolved procedure reference for confections.
 * (Similar to IResolvedFillingRecipeProcedure but for confections)
 */
export interface IResolvedConfectionProcedure {
  readonly procedure: IRuntimeProcedure;
  readonly notes?: string;
  readonly raw: IProcedureRef;
}
```

#### Phase 2: Updated IRuntimeConfection Interfaces

```typescript
/**
 * A resolved runtime view of a confection with navigation capabilities.
 */
export interface IRuntimeConfection {
  // ... existing identity/metadata properties ...

  // ---- Convenience accessors for golden version properties (RESOLVED) ----

  /** Resolved filling slots from the golden version */
  readonly fillings?: ReadonlyArray<IResolvedFillingSlot>;

  /** Resolved procedures from the golden version */
  readonly procedures?: IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId>;

  // ... existing methods ...
}

/**
 * Runtime confection narrowed to molded bonbon type.
 */
export interface IRuntimeMoldedBonBon extends IRuntimeConfection {
  // ... existing properties ...

  /** Resolved molds with preferred selection (from golden version) */
  readonly molds: IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId>;

  /** Resolved shell chocolate specification (from golden version) */
  readonly shellChocolate: IResolvedChocolateSpec;

  /** Resolved additional chocolates (from golden version) */
  readonly additionalChocolates?: ReadonlyArray<IResolvedAdditionalChocolate>;

  // ... existing methods ...
}

/**
 * Runtime confection narrowed to bar truffle type.
 */
export interface IRuntimeBarTruffle extends IRuntimeConfection {
  // ... existing properties ...

  /** Resolved enrobing chocolate (from golden version, optional) */
  readonly enrobingChocolate?: IResolvedChocolateSpec;

  // ... existing methods ...
}

/**
 * Runtime confection narrowed to rolled truffle type.
 */
export interface IRuntimeRolledTruffle extends IRuntimeConfection {
  // ... existing properties ...

  /** Resolved enrobing chocolate (from golden version, optional) */
  readonly enrobingChocolate?: IResolvedChocolateSpec;

  /** Resolved coatings (from golden version, optional) */
  readonly coatings?: IResolvedCoatings;

  // ... existing methods ...
}

/**
 * Resolved coatings specification.
 */
export interface IResolvedCoatings {
  readonly options: ReadonlyArray<IResolvedCoatingOption>;
  readonly preferredId?: CoatingId;
}

/**
 * Resolved coating option (could be ingredient or procedure-based).
 */
export interface IResolvedCoatingOption {
  readonly id: CoatingId;
  readonly ingredient?: IRuntimeIngredient;
  readonly procedure?: IRuntimeProcedure;
  readonly notes?: string;
}
```

#### Phase 3: Updated IConfectionContext

```typescript
/**
 * Minimal context interface for RuntimeConfection.
 * Provides what a confection needs for resolution.
 * @internal
 */
export interface IConfectionContext {
  /**
   * Gets a runtime ingredient by ID.
   * Used for resolving chocolate specifications and ingredient filling options.
   */
  getRuntimeIngredient(id: IngredientId): Result<IRuntimeIngredient>;

  /**
   * Gets a runtime filling recipe by ID.
   * Used for resolving recipe filling options.
   */
  getRuntimeFilling(id: FillingId): Result<IRuntimeFillingRecipe>;

  /**
   * Gets a runtime mold by ID.
   * Used for resolving mold references.
   */
  getRuntimeMold(id: MoldId): Result<IRuntimeMold>;

  /**
   * Gets a runtime procedure by ID.
   * Used for resolving procedure references.
   */
  getRuntimeProcedure(id: ProcedureId): Result<IRuntimeProcedure>;
}
```

### Construction Order & Resolution Strategy

#### Pattern: Lazy Resolution with Caching

Following the established pattern from RuntimeVersion and RuntimeRecipe:

```typescript
export class RuntimeMoldedBonBon extends RuntimeConfectionBase {
  private readonly _moldedBonBon: IMoldedBonBon;

  // Lazy-resolved caches
  private _resolvedFillings: ReadonlyArray<IResolvedFillingSlot> | undefined;
  private _resolvedMolds: IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId> | undefined;
  private _resolvedShellChocolate: IResolvedChocolateSpec | undefined;
  private _resolvedAdditionalChocolates: ReadonlyArray<IResolvedAdditionalChocolate> | undefined;
  private _resolvedProcedures: IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId> | undefined | null;

  protected constructor(context: IConfectionContext, id: ConfectionId, confection: IMoldedBonBon) {
    super(context, id, confection);
    this._moldedBonBon = confection;
    // Resolution happens lazily on first property access
  }

  // Getters trigger lazy resolution
  public get shellChocolate(): IResolvedChocolateSpec {
    if (this._resolvedShellChocolate === undefined) {
      this._resolvedShellChocolate = this._resolveChocolateSpec(this.goldenVersion.shellChocolate);
    }
    return this._resolvedShellChocolate;
  }

  // Private resolution methods
  private _resolveChocolateSpec(spec: IChocolateSpec): IResolvedChocolateSpec {
    const primaryId = spec.preferredId ?? spec.ids[0];
    const chocolate = this._context.getRuntimeIngredient(primaryId).orThrow();

    // Resolve alternates (excluding primary)
    const alternates: IRuntimeChocolateIngredient[] = [];
    for (const id of spec.ids) {
      if (id !== primaryId) {
        const alt = this._context.getRuntimeIngredient(id);
        if (alt.isSuccess() && alt.value.isChocolate()) {
          alternates.push(alt.value);
        }
      }
    }

    return {
      chocolate: chocolate as IRuntimeChocolateIngredient,
      alternates,
      raw: spec
    };
  }

  private _resolveFillingSlots(slots: ReadonlyArray<IFillingSlot>): ReadonlyArray<IResolvedFillingSlot> {
    return slots.map(slot => ({
      slotId: slot.slotId,
      name: slot.name,
      filling: this._resolveFillingOptions(slot.filling)
    }));
  }

  private _resolveFillingOptions(
    options: IOptionsWithPreferred<AnyFillingOption, FillingOptionId>
  ): IOptionsWithPreferred<IResolvedFillingOption, FillingOptionId> {
    const resolvedOptions = options.options
      .map(opt => this._resolveFillingOption(opt))
      .filter((r): r is IResolvedFillingOption => r !== undefined);

    return {
      options: resolvedOptions,
      preferredId: options.preferredId
    };
  }

  private _resolveFillingOption(option: AnyFillingOption): IResolvedFillingOption | undefined {
    if (option.type === 'recipe') {
      const filling = this._context.getRuntimeFilling(option.id);
      if (filling.isFailure()) return undefined; // Skip missing
      return {
        type: 'recipe',
        filling: filling.value,
        notes: option.notes,
        raw: option
      };
    } else {
      const ingredient = this._context.getRuntimeIngredient(option.id);
      if (ingredient.isFailure()) return undefined; // Skip missing
      return {
        type: 'ingredient',
        ingredient: ingredient.value,
        notes: option.notes,
        raw: option
      };
    }
  }

  private _resolveMoldRefs(
    molds: IOptionsWithPreferred<IConfectionMoldRef, MoldId>
  ): IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId> {
    const resolvedOptions = molds.options
      .map(ref => {
        const mold = this._context.getRuntimeMold(ref.id);
        if (mold.isFailure()) return undefined;
        return {
          mold: mold.value,
          notes: ref.notes,
          raw: ref
        };
      })
      .filter((r): r is IResolvedConfectionMoldRef => r !== undefined);

    return {
      options: resolvedOptions,
      preferredId: molds.preferredId
    };
  }

  private _resolveProcedures(
    procedures: IOptionsWithPreferred<IProcedureRef, ProcedureId>
  ): IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId> {
    const resolvedOptions = procedures.options
      .map(ref => {
        const procedure = this._context.getRuntimeProcedure(ref.id);
        if (procedure.isFailure()) return undefined;
        return {
          procedure: procedure.value,
          notes: ref.notes,
          raw: ref
        };
      })
      .filter((r): r is IResolvedConfectionProcedure => r !== undefined);

    return {
      options: resolvedOptions,
      preferredId: procedures.preferredId
    };
  }
}
```

#### Error Handling Strategy

Following RuntimeVersion pattern:
- **Missing references**: Skip silently (filter out undefined)
- **Critical failures**: Log warning but continue (graceful degradation)
- **Empty results**: Return empty arrays/undefined, not failures
- **Type validation**: Use type guards (e.g., `ingredient.isChocolate()`)

### Context Integration

#### RuntimeContext Updates

```typescript
export class RuntimeContext implements IConfectionContext {
  // ... existing properties ...

  // Add confections library (similar to ingredients/recipes)
  private _confections:
    | ValidatingLibrary<ConfectionId, AnyRuntimeConfection, IConfectionQuerySpec>
    | undefined;

  // Cached runtime confections
  private readonly _runtimeConfections: Map<ConfectionId, AnyRuntimeConfection> = new Map();

  /**
   * A searchable library of all confections, keyed by composite ID.
   * Confections are resolved eagerly on first access and cached.
   */
  public get confections(): IReadOnlyValidatingLibrary<ConfectionId, AnyRuntimeConfection, IConfectionQuerySpec> {
    return this._resolveConfections();
  }

  /**
   * Resolves and caches all confections from the library.
   * @internal
   */
  private _resolveConfections(): ValidatingLibrary<ConfectionId, AnyRuntimeConfection, IConfectionQuerySpec> {
    if (this._confections === undefined) {
      this._confections = new ValidatingLibrary({
        converters: new Collections.KeyValueConverters<ConfectionId, AnyRuntimeConfection>({
          key: Validation.toConfectionId,
          value: (from: unknown) =>
            from instanceof RuntimeConfectionBase
              ? succeed(from as AnyRuntimeConfection)
              : fail('not a runtime confection')
        }),
        orchestrator: this._confectionOrchestrator // New orchestrator for queries
      });

      // Populate from library
      for (const [id, confection] of this._library.confections.entries()) {
        RuntimeConfection.create(this, id, confection)
          .onSuccess((rc) => this._confections!.set(id, rc))
          .report(this.logger);
      }
    }
    return this._confections;
  }

  /**
   * Gets a resolved runtime confection by ID.
   * @internal - for use by orchestrators and internal navigation
   */
  public _getConfection(id: ConfectionId): Result<AnyRuntimeConfection> {
    return this._resolveConfections().get(id).asResult;
  }

  // IConfectionContext implementation
  public getRuntimeIngredient(id: IngredientId): Result<IRuntimeIngredient> {
    return this._getIngredient(id);
  }

  public getRuntimeFilling(id: FillingId): Result<IRuntimeFillingRecipe> {
    return this._getRecipe(id);
  }

  // Already implemented: getRuntimeMold, getRuntimeProcedure

  /**
   * Clears all cached runtime objects.
   */
  public clearCache(): void {
    this._ingredients = undefined;
    this._recipes = undefined;
    this._confections = undefined; // NEW
    this._runtimeTasks.clear();
    this._runtimeProcedures.clear();
    this._runtimeMolds.clear();
    this._runtimeConfections.clear(); // NEW
    // ... existing index invalidation ...
  }
}
```

### Circular Dependency Management

#### Current Dependencies
- RuntimeContext → RuntimeIngredient (creates)
- RuntimeContext → RuntimeRecipe (creates)
- RuntimeIngredient → RuntimeContext (uses for navigation)
- RuntimeRecipe → RuntimeContext (uses for resolution)

#### New Dependencies
- RuntimeContext → RuntimeConfection (creates)
- RuntimeConfection → RuntimeContext (uses for resolution)
- No new circular dependencies introduced

#### Resolution Strategy
- Context provides resolution methods via interface
- Runtime objects hold context reference
- No direct imports between runtime entity classes
- Type-only imports for interfaces

### Migration Strategy

#### Phase 1: Create New Interfaces (Non-Breaking)
1. Add new resolved reference interfaces to `model.ts`
2. Add `IConfectionContext` interface
3. Update type exports
4. No changes to existing code

#### Phase 2: Implement Resolution Logic (Internal)
1. Add resolution methods to RuntimeConfectionBase
2. Add lazy-loaded private caches
3. Implement resolution for each confection type
4. Add unit tests for resolution logic

#### Phase 3: Update Public Interfaces (Breaking)
1. Change interface property types from ID-based to resolved
2. Update interface documentation
3. Update all tests to use new patterns

#### Phase 4: Integrate with RuntimeContext
1. Add confections library to RuntimeContext
2. Implement IConfectionContext methods
3. Update cache management
4. Update integration tests

#### Phase 5: Update Consumers
1. Update editing sessions to use resolved references
2. Update queries/filters if needed
3. Update any external consumers

### Test Impact Assessment

#### New Tests Needed

1. **Resolution Tests** (Unit)
   - Test chocolate spec resolution (primary + alternates)
   - Test filling slot resolution (recipe and ingredient options)
   - Test mold reference resolution
   - Test procedure resolution
   - Test missing reference handling (graceful degradation)
   - Test type narrowing (chocolate ingredients)

2. **Integration Tests**
   - Test full confection resolution via RuntimeContext
   - Test lazy loading behavior
   - Test cache invalidation
   - Test navigation from confection to recipes/ingredients

3. **Round-Trip Tests**
   - Ensure resolved objects can be accessed
   - Verify raw data preservation
   - Test that resolved alternates match raw data

#### Existing Tests to Update

1. **RuntimeConfection Tests**
   - Update property access tests to use resolved types
   - Update type guards (still work, but types change)
   - Update golden version access

2. **RuntimeContext Tests**
   - Add confections library tests
   - Update cache management tests
   - Add IConfectionContext method tests

3. **Integration Tests**
   - Update any tests that access confection properties
   - Update tests that navigate from confections to other entities

### Breaking Changes

#### Public API Changes

1. **IRuntimeConfection**
   - `fillings` type changes from `IFillingSlot[]?` to `IResolvedFillingSlot[]?`
   - `procedures` type changes from `IOptionsWithPreferred<IProcedureRef, ...>?` to `IOptionsWithPreferred<IResolvedConfectionProcedure, ...>?`

2. **IRuntimeMoldedBonBon**
   - `molds` type changes from `IOptionsWithPreferred<IConfectionMoldRef, ...>` to `IOptionsWithPreferred<IResolvedConfectionMoldRef, ...>`
   - `shellChocolate` type changes from `IChocolateSpec` to `IResolvedChocolateSpec`
   - `additionalChocolates` type changes from `IAdditionalChocolate[]?` to `IResolvedAdditionalChocolate[]?`

3. **IRuntimeBarTruffle**
   - `enrobingChocolate` type changes from `IChocolateSpec?` to `IResolvedChocolateSpec?`

4. **IRuntimeRolledTruffle**
   - `enrobingChocolate` type changes from `IChocolateSpec?` to `IResolvedChocolateSpec?`
   - `coatings` type changes from `ICoatings?` to `IResolvedCoatings?`

#### Migration Path for Consumers

**Before:**
```typescript
const confection = context.confections.get('common.dark-dome').orThrow();
if (confection.isMoldedBonBon()) {
  const shellIds = confection.shellChocolate.ids;
  const preferredId = confection.shellChocolate.preferredId ?? shellIds[0];
  const chocolate = context.ingredients.get(preferredId).orThrow();
  console.log(chocolate.name);

  // Access alternates
  for (const id of shellIds) {
    if (id !== preferredId) {
      const alt = context.ingredients.get(id).orThrow();
      console.log(`  Alt: ${alt.name}`);
    }
  }
}
```

**After:**
```typescript
const confection = context.confections.get('common.dark-dome').orThrow();
if (confection.isMoldedBonBon()) {
  const resolved = confection.shellChocolate;
  const chocolate = resolved.chocolate; // Direct access!
  console.log(chocolate.name);

  // Access alternates (pre-resolved)
  for (const alt of resolved.alternates) {
    console.log(`  Alt: ${alt.name}`);
  }

  // Raw data still available if needed
  console.log(`Raw IDs: ${resolved.raw.ids.join(', ')}`);
}
```

### Benefits

1. **Consistency**: Matches the pattern established by ingredients/recipes
2. **Developer Experience**: Direct object access, no manual lookups
3. **Type Safety**: Narrowed types (e.g., `IRuntimeChocolateIngredient` for chocolates)
4. **Performance**: Lazy resolution with caching, same as current approach
5. **Error Handling**: Graceful degradation for missing references
6. **Raw Data**: Always accessible via `.raw` property

### Risks and Mitigations

#### Risk 1: Breaking Changes to Public API
- **Not a concern**: Breaking changes are acceptable for this refactoring
- **Mitigation**: Strong typing catches issues at compile time

#### Risk 2: Memory Overhead from Cached Resolutions
- **Mitigation**: Lazy loading - only resolve on access
- **Mitigation**: Same pattern as existing ingredients/recipes
- **Mitigation**: Cache invalidation via `clearCache()`

#### Risk 3: Missing References in Data
- **Mitigation**: Graceful degradation - skip missing entries
- **Mitigation**: Log warnings for troubleshooting
- **Mitigation**: Unit tests verify handling

#### Risk 4: Circular Resolution Dependencies
- **Mitigation**: Resolution happens at confection construction
- **Mitigation**: No runtime cycles - all dependencies exist before confection
- **Mitigation**: Context provides all resolution methods

## Implementation Checklist

### Phase 1: Interfaces (Non-Breaking)
- [ ] Add resolved reference interfaces to `runtime/model.ts`
- [ ] Add `IConfectionContext` interface
- [ ] Update type exports in `runtime/index.ts`
- [ ] Add JSDoc documentation

### Phase 2: Resolution Implementation
- [ ] Add resolution methods to `RuntimeConfectionBase`
- [ ] Implement lazy-loaded caches in subclasses
- [ ] Add chocolate spec resolution
- [ ] Add filling slot resolution
- [ ] Add mold reference resolution
- [ ] Add procedure resolution
- [ ] Add coatings resolution (rolled truffle)
- [ ] Unit test all resolution methods

### Phase 3: Public API Update (Breaking)
- [ ] Update `IRuntimeConfection` interface
- [ ] Update `IRuntimeMoldedBonBon` interface
- [ ] Update `IRuntimeBarTruffle` interface
- [ ] Update `IRuntimeRolledTruffle` interface
- [ ] Update property getters in implementations
- [ ] Update all tests

### Phase 4: Context Integration
- [ ] Add `confections` library to `RuntimeContext`
- [ ] Implement `IConfectionContext` methods
- [ ] Update cache management
- [ ] Add confection orchestrator (if needed for queries)
- [ ] Integration tests

### Phase 5: Consumer Updates
- [ ] Update editing sessions
- [ ] Update any query logic
- [ ] Update documentation

## Open Questions

1. **Coatings Resolution**: The `ICoatings` type isn't fully visible - needs investigation
2. **Query Support**: Do we need confection queries similar to ingredient/recipe queries?
3. **Reverse Indexing**: Should we add confection → recipe/ingredient reverse lookups?
4. **Version Support**: Confections don't have scaling - are versions handled correctly?

## Alternatives Considered

### Alternative 1: Dual Accessors (ID and Object)
```typescript
interface IRuntimeMoldedBonBon {
  readonly shellChocolateIds: IChocolateSpec; // IDs
  readonly shellChocolate: IResolvedChocolateSpec; // Objects
}
```
**Rejected**: Duplicates API surface, confusing which to use

### Alternative 2: Getter Methods Instead of Properties
```typescript
interface IRuntimeMoldedBonBon {
  getShellChocolate(): Result<IResolvedChocolateSpec>;
  getMolds(): Result<IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId>>;
}
```
**Rejected**: Inconsistent with ingredient/recipe pattern (direct property access)

### Alternative 3: Resolve Everything at Construction
```typescript
constructor() {
  // Resolve all references immediately
  this._resolvedShellChocolate = this._resolveChocolateSpec(...);
  this._resolvedMolds = this._resolveMoldRefs(...);
  // etc.
}
```
**Rejected**: Wastes resources if properties never accessed, inconsistent with lazy pattern

## Conclusion

This design extends the proven pattern from ingredients/recipes to confections, creating a consistent runtime layer architecture. The lazy resolution strategy balances performance with developer experience, and the phased migration minimizes risk.
