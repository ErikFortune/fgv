# @fgv/ts-chocolate Architecture Design v2

## Executive Summary

This document defines the core architecture and interfaces for `@fgv/ts-chocolate`, a TypeScript library for chocolate recipe management and calculations. The library focuses on ganache recipes in Phase 1, with extensibility for other filling types.

**Key Design Decisions**:
1. **Discriminated ingredient types** - Chocolate, sugar, and generic ingredients with category-specific properties
2. **Recipe versioning** - Recipes have immutable metadata and multiple version details with usage tracking
3. **Multi-source collections** - Sources have IDs, composite keys ensure uniqueness across sources
4. **Mutable/Immutable sources** - Read-only vs writable sources with proper typing
5. **ValidatingCollector pattern** - Uses ICollectible for items with key + index
6. **Computed percentages** - Store base weights, calculate percentages on-the-fly

## Core Design Principles

### 1. Consistency with FGV Monorepo Patterns
- **Result Pattern**: All fallible operations return `Result<T>`
- **Converters**: Use `Converters.object<T>()` for JSON deserialization
- **Validators**: Use `Validators.object<T>()` for complex object validation
- **Collections**: Use `ValidatingCollector` for items with key+index
- **Branded Types**: Use branded string types for IDs

### 2. Weight-Based Calculations
- **Native Storage**: All weights stored internally as grams
- **Computed Percentages**: Calculate on access, never store
- **Precision**: Standard JavaScript number precision

### 3. Multi-Source Architecture
- **Source IDs**: Each source has a unique ID (no dots allowed)
- **Composite IDs**: `${sourceId}.${baseId}` ensures uniqueness (dot separator)
- **Mutable vs Immutable**: Explicit read-only/writable distinction
- **Priority Resolution**: First source in list wins

### 4. Extensibility
- Phase 1: Ganache-focused with discriminated ingredients
- Phase 2+: Additional filling types, procedures, equipment

## Type System

### Branded Types

```typescript
/**
 * Unique identifier for a source
 * Character restrictions: alphanumeric, dashes, underscores only (no dots)
 * Pattern: /^[a-zA-Z0-9_-]+$/
 * @public
 */
export type SourceId = string & { readonly __sourceId: unique symbol };

/**
 * Ingredient identifier within a single source
 * Character restrictions: alphanumeric, dashes, underscores only (no dots)
 * Pattern: /^[a-zA-Z0-9_-]+$/
 * @public
 */
export type BaseIngredientId = string & { readonly __baseIngredientId: unique symbol };

/**
 * Recipe identifier within a single source
 * Character restrictions: alphanumeric, dashes, underscores only (no dots)
 * Pattern: /^[a-zA-Z0-9_-]+$/
 * @public
 */
export type BaseRecipeId = string & { readonly __baseRecipeId: unique symbol };

/**
 * Globally unique ingredient identifier (composite)
 * Format: "${sourceId}.${baseIngredientId}"
 * Must contain exactly one dot separator
 * Pattern: /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/
 * @public
 */
export type IngredientId = string & { readonly __ingredientId: unique symbol };

/**
 * Globally unique recipe identifier (composite)
 * Format: "${sourceId}.${baseRecipeId}"
 * Must contain exactly one dot separator
 * Pattern: /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/
 * @public
 */
export type RecipeId = string & { readonly __recipeId: unique symbol };

/**
 * Non-unique recipe name used for grouping versions
 * @public
 */
export type RecipeName = string & { readonly __recipeName: unique symbol };

/**
 * Weight in grams (native internal unit)
 * @public
 */
export type Grams = number & { readonly __grams: unique symbol };

/**
 * Percentage (0-100)
 * @public
 */
export type Percentage = number & { readonly __percentage: unique symbol };

/**
 * Temperature in Celsius
 * @public
 */
export type Celsius = number & { readonly __celsius: unique symbol };
```

### Enumerations

```typescript
/**
 * Base categories of ingredients (discriminated union tag)
 * @public
 */
export enum IngredientCategory {
  Chocolate = 'chocolate',
  Sugar = 'sugar',
  Dairy = 'dairy',
  Fat = 'fat',
  Liquid = 'liquid',
  Flavor = 'flavor',
  Other = 'other'
}

/**
 * Types of chocolate
 * @public
 */
export enum ChocolateType {
  Dark = 'dark',
  Milk = 'milk',
  White = 'white',
  Caramelized = 'caramelized',
  Ruby = 'ruby',
  Flavored = 'flavored'
}

/**
 * Viscosity in Callebaut star ratings
 * @public
 */
export enum ViscosityStars {
  OneStar = 1,
  TwoStar = 2,
  ThreeStar = 3,
  FourStar = 4,
  FiveStar = 5
}

/**
 * Supported weight units for output
 * @public
 */
export enum WeightUnit {
  Grams = 'g',
  Ounces = 'oz',
  Pounds = 'lb',
  Kilograms = 'kg'
}

/**
 * Well-known built-in source identifiers
 * @public
 */
export enum BuiltInSource {
  /** Default built-in ingredients */
  DefaultIngredients = 'built-in:ingredients',
  /** Default built-in recipes */
  DefaultRecipes = 'built-in:recipes'
}
```

## Packlet Organization

```
src/packlets/
├── common/              # Shared types, branded types, enums, composite keys
│   ├── brandedTypes.ts
│   ├── enums.ts
│   ├── compositeKey.ts
│   └── index.ts
├── ingredients/         # Ingredient definitions and management
│   ├── ingredient.ts           # IIngredient and discriminated types
│   ├── ingredientCollection.ts # IngredientCollection (ICollectible)
│   ├── converters.ts           # JSON converters
│   └── index.ts
├── recipes/             # Recipe definitions and management
│   ├── recipe.ts               # IRecipe, IRecipeDetails, IRecipeMetadata
│   ├── recipeCollection.ts     # RecipeCollection (ICollectible)
│   ├── recipeScaler.ts         # Recipe scaling logic
│   ├── converters.ts           # JSON converters
│   └── index.ts
├── calculations/        # Ganache-specific calculations
│   ├── ganacheCalculator.ts   # Ganache ratio calculations
│   └── index.ts
└── runtime/             # High-level API and collections
    ├── chocolateLibrary.ts     # Main library orchestrator
    ├── multiSourceCollection.ts # Multi-source collection management
    └── index.ts
```

## Core Interfaces

### Common Packlet

```typescript
/**
 * ID validation patterns
 */
const BASE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const COMPOSITE_ID_PATTERN = /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/;
const ID_SEPARATOR = '.';

/**
 * Validators for ID types
 * @public
 */
export namespace Validate {
  /**
   * Validates and converts to SourceId
   * Ensures no dots in the ID
   */
  export const sourceId: Validator<SourceId>;

  /**
   * Validates and converts to BaseIngredientId
   * Ensures no dots in the ID
   */
  export const baseIngredientId: Validator<BaseIngredientId>;

  /**
   * Validates and converts to BaseRecipeId
   * Ensures no dots in the ID
   */
  export const baseRecipeId: Validator<BaseRecipeId>;

  /**
   * Validates and converts to IngredientId
   * Ensures exactly one dot separator
   */
  export const ingredientId: Validator<IngredientId>;

  /**
   * Validates and converts to RecipeId
   * Ensures exactly one dot separator
   */
  export const recipeId: Validator<RecipeId>;

  /**
   * Validates and converts to RecipeName
   */
  export const recipeName: Validator<RecipeName>;
}

/**
 * Converters for ID types (wraps validators)
 * @public
 */
export namespace Convert {
  /** Converts string to SourceId */
  export const sourceId: Converter<SourceId>;

  /** Converts string to BaseIngredientId */
  export const baseIngredientId: Converter<BaseIngredientId>;

  /** Converts string to BaseRecipeId */
  export const baseRecipeId: Converter<BaseRecipeId>;

  /** Converts string to IngredientId */
  export const ingredientId: Converter<IngredientId>;

  /** Converts string to RecipeId */
  export const recipeId: Converter<RecipeId>;

  /** Converts string to RecipeName */
  export const recipeName: Converter<RecipeName>;

  /** Converts number to Grams */
  export const grams: Converter<Grams>;

  /** Converts number to Percentage with validation (0-100) */
  export const percentage: Converter<Percentage>;

  /** Converts number to Celsius */
  export const celsius: Converter<Celsius>;
}

/**
 * Helper functions for composite IDs
 * @public
 */
export namespace CompositeId {
  /**
   * Creates a composite IngredientId from source ID and base ID
   * @param sourceId - The source identifier
   * @param baseId - The base ingredient identifier
   * @returns Composite ingredient ID in format "${sourceId}.${baseId}"
   */
  export function createIngredientId(sourceId: SourceId, baseId: BaseIngredientId): IngredientId;

  /**
   * Parses a composite IngredientId into source ID and base ID
   * @param id - The composite ingredient ID to parse
   * @returns Result with tuple [sourceId, baseId] or error
   */
  export function parseIngredientId(id: IngredientId): Result<[SourceId, BaseIngredientId]>;

  /**
   * Creates a composite RecipeId from source ID and base ID
   * @param sourceId - The source identifier
   * @param baseId - The base recipe identifier
   * @returns Composite recipe ID in format "${sourceId}.${baseId}"
   */
  export function createRecipeId(sourceId: SourceId, baseId: BaseRecipeId): RecipeId;

  /**
   * Parses a composite RecipeId into source ID and base ID
   * @param id - The composite recipe ID to parse
   * @returns Result with tuple [sourceId, baseId] or error
   */
  export function parseRecipeId(id: RecipeId): Result<[SourceId, BaseRecipeId]>;

  /**
   * Gets the source ID from a composite IngredientId
   * @param id - The composite ingredient ID
   * @returns The source ID portion
   */
  export function getIngredientSourceId(id: IngredientId): SourceId;

  /**
   * Gets the base ID from a composite IngredientId
   * @param id - The composite ingredient ID
   * @returns The base ingredient ID portion
   */
  export function getIngredientBaseId(id: IngredientId): BaseIngredientId;

  /**
   * Gets the source ID from a composite RecipeId
   * @param id - The composite recipe ID
   * @returns The source ID portion
   */
  export function getRecipeSourceId(id: RecipeId): SourceId;

  /**
   * Gets the base ID from a composite RecipeId
   * @param id - The composite recipe ID
   * @returns The base recipe ID portion
   */
  export function getRecipeBaseId(id: RecipeId): BaseRecipeId;
}
```

### Ingredients Packlet

```typescript
/**
 * Characteristics relevant to ganache calculations
 * @public
 */
export interface IGanacheCharacteristics {
  /** Percentage of cacao fat (0-100) */
  readonly cacaoFat: Percentage;
  /** Percentage of sugar (0-100) */
  readonly sugar: Percentage;
  /** Percentage of milk fat (0-100) */
  readonly milkFat: Percentage;
  /** Percentage of water (0-100) */
  readonly water: Percentage;
  /** Percentage of solids (0-100) */
  readonly solids: Percentage;
  /** Percentage of other fats (0-100) */
  readonly otherFats: Percentage;
}

/**
 * Temperature curve for chocolate tempering
 * @public
 */
export interface ITemperatureCurve {
  readonly melt: Celsius;
  readonly cool: Celsius;
  readonly working: Celsius;
}

/**
 * Source attribution
 * @public
 */
export interface ISource {
  readonly name: string;
  readonly url?: string;
  readonly notes?: string;
}

/**
 * Base ingredient interface implementing ICollectible
 * @public
 */
export interface IIngredient extends Collections.ICollectible<IngredientId, number> {
  /** Base identifier within source */
  readonly baseId: BaseIngredientId;

  /** Composite key "${sourceId}.${baseId}" for global uniqueness (ICollectible.key) */
  readonly key: IngredientId;

  /** Index within collection (managed by collector) */
  readonly index: number | undefined;

  /** Source ID */
  readonly sourceId: SourceId;

  /** Display name */
  readonly name: string;

  /** Ingredient category (discriminator) */
  readonly category: IngredientCategory;

  /** Ganache characteristics */
  readonly ganacheCharacteristics: IGanacheCharacteristics;

  /** Source attribution */
  readonly source: ISource;

  /** Optional description */
  readonly description?: string;

  /** Optional tags for searching/filtering */
  readonly tags?: ReadonlyArray<string>;

  /** Set index (for ICollectible) */
  setIndex(index: number): Result<number>;
}

/**
 * Chocolate-specific ingredient
 * @public
 */
export interface IChocolateIngredient extends IIngredient {
  readonly category: IngredientCategory.Chocolate;
  readonly chocolateType: ChocolateType;
  readonly cacaoPercentage: Percentage;
  readonly viscosityDegrees: number;
  readonly viscosityStars: ViscosityStars;
  readonly temperatureCurve: ITemperatureCurve;
}

/**
 * Sugar-specific ingredient
 * @public
 */
export interface ISugarIngredient extends IIngredient {
  readonly category: IngredientCategory.Sugar;
  readonly hydrationNumber: number;
  readonly sweetnessPotency: number;
}

/**
 * Discriminated union of all ingredient types
 * @public
 */
export type Ingredient = IChocolateIngredient | ISugarIngredient | IIngredient;

/**
 * Collection of ingredients using ValidatingCollector
 * @public
 */
export interface IIngredientCollectionParams {
  /** Source ID for this collection */
  readonly sourceId: SourceId;

  /** Source name for display */
  readonly sourceName: string;

  /** If true, collection is read-only */
  readonly readOnly: boolean;

  /** Initial ingredients */
  readonly ingredients?: Iterable<Ingredient>;
}

/**
 * Ingredient collection (immutable)
 * @public
 */
export class IngredientCollection
  extends Collections.ValidatingCollector<Ingredient>
  implements Collections.IReadOnlyValidatingCollector<Ingredient> {

  public static create(params: IIngredientCollectionParams): Result<IngredientCollection>;

  /** Source ID */
  public get sourceId(): SourceId;

  /** Source name */
  public get sourceName(): string;

  /** Always true (immutable) */
  public get isReadOnly(): true;

  /** Get ingredient by composite IngredientId */
  public get(id: IngredientId): Result<Ingredient>;

  /** Get ingredient by base ID (adds source ID prefix) */
  public getByBaseId(baseId: BaseIngredientId): Result<Ingredient>;

  /** Access to validating interface */
  public get validating(): Collections.IReadOnlyCollectorValidator<Ingredient>;
}

/**
 * Mutable ingredient collection
 * @public
 */
export class MutableIngredientCollection extends IngredientCollection {
  public static create(params: IIngredientCollectionParams): Result<MutableIngredientCollection>;

  /** Always false (mutable) */
  public get isReadOnly(): false;

  /** Add or update an ingredient */
  public add(ingredient: Ingredient): Result<Ingredient>;

  /** Remove an ingredient by base ID */
  public remove(baseId: BaseIngredientId): Result<Ingredient>;

  /** Remove an ingredient by composite ID */
  public removeById(id: IngredientId): Result<Ingredient>;
}
```

### Recipes Packlet

```typescript
/**
 * An ingredient used in a recipe with amount
 * Note: ingredientId is composite (includes source)
 * @public
 */
export interface IRecipeIngredient {
  readonly ingredientId: IngredientId;
  readonly amount: Grams;
  readonly notes?: string;
}

/**
 * A single usage record for a recipe version
 * @public
 */
export interface IRecipeUsage {
  readonly date: string; // ISO 8601
  readonly scaledWeight: Grams;
  readonly notes?: string;
}

/**
 * Immutable recipe metadata (consistent across versions)
 * @public
 */
export interface IRecipeMetadata {
  readonly name: RecipeName;
  readonly source: ISource;
  readonly description?: string;
  readonly tags?: ReadonlyArray<string>;
}

/**
 * Variable recipe details (version-specific)
 * @public
 */
export interface IRecipeDetails {
  readonly ingredients: ReadonlyArray<IRecipeIngredient>;
  readonly baseWeight: Grams;
  readonly yield?: string;
  readonly versionNotes?: string;
  readonly usage: ReadonlyArray<IRecipeUsage>;
}

/**
 * Complete recipe definition implementing ICollectible
 * @public
 */
export interface IRecipe extends Collections.ICollectible<RecipeId, number> {
  /** Base identifier within source */
  readonly baseId: BaseRecipeId;

  /** Composite key "${sourceId}.${baseId}" for global uniqueness (ICollectible.key) */
  readonly key: RecipeId;

  /** Index within collection (managed by collector) */
  readonly index: number | undefined;

  /** Source ID */
  readonly sourceId: SourceId;

  /** Immutable metadata */
  readonly metadata: IRecipeMetadata;

  /** All versions (at least one) */
  readonly versions: ReadonlyArray<IRecipeDetails>;

  /** Most recent version (convenience) */
  readonly currentVersion: IRecipeDetails;

  /** Set index (for ICollectible) */
  setIndex(index: number): Result<number>;
}

/**
 * Collection of recipes using ValidatingCollector
 * @public
 */
export interface IRecipeCollectionParams {
  /** Source ID for this collection */
  readonly sourceId: SourceId;

  /** Source name for display */
  readonly sourceName: string;

  /** If true, collection is read-only */
  readonly readOnly: boolean;

  /** Initial recipes */
  readonly recipes?: Iterable<IRecipe>;
}

/**
 * Recipe collection (immutable)
 * @public
 */
export class RecipeCollection
  extends Collections.ValidatingCollector<IRecipe>
  implements Collections.IReadOnlyValidatingCollector<IRecipe> {

  public static create(params: IRecipeCollectionParams): Result<RecipeCollection>;

  /** Source ID */
  public get sourceId(): SourceId;

  /** Source name */
  public get sourceName(): string;

  /** Always true (immutable) */
  public get isReadOnly(): true;

  /** Get recipe by composite RecipeId */
  public get(id: RecipeId): Result<IRecipe>;

  /** Get recipe by base ID (adds source ID prefix) */
  public getByBaseId(baseId: BaseRecipeId): Result<IRecipe>;

  /** Get all versions of a recipe by name */
  public getVersionsByName(name: RecipeName): ReadonlyArray<IRecipe>;

  /** Access to validating interface */
  public get validating(): Collections.IReadOnlyCollectorValidator<IRecipe>;
}

/**
 * Mutable recipe collection
 * @public
 */
export class MutableRecipeCollection extends RecipeCollection {
  public static create(params: IRecipeCollectionParams): Result<MutableRecipeCollection>;

  /** Always false (mutable) */
  public get isReadOnly(): false;

  /** Add or update a recipe */
  public add(recipe: IRecipe): Result<IRecipe>;

  /** Add a new version to an existing recipe (by base ID) */
  public addVersion(baseId: BaseRecipeId, version: IRecipeDetails): Result<IRecipe>;

  /** Add usage to the current version (by base ID) */
  public addUsage(baseId: BaseRecipeId, usage: IRecipeUsage): Result<IRecipe>;

  /** Remove a recipe by base ID */
  public remove(baseId: BaseRecipeId): Result<IRecipe>;

  /** Remove a recipe by composite ID */
  public removeById(id: RecipeId): Result<IRecipe>;
}
```

### Scaled Recipes

```typescript
/**
 * A recipe ingredient with computed percentage
 * @public
 */
export interface IScaledRecipeIngredient {
  readonly ingredient: Ingredient;
  readonly amount: Grams;
  readonly percentage: Percentage; // Computed from amount/total
  readonly notes?: string;
}

/**
 * A recipe scaled to target weight
 * @public
 */
export interface IScaledRecipe {
  readonly recipe: IRecipe;
  readonly versionIndex: number; // Which version was scaled
  readonly targetWeight: Grams;
  readonly scaleFactor: number;
  readonly scaledIngredients: ReadonlyArray<IScaledRecipeIngredient>;
  readonly calculatedCharacteristics: IGanacheCharacteristics;
}
```

### Runtime / Multi-Source

```typescript
/**
 * Source specification - either a collection or a built-in identifier
 * @public
 */
export type SourceSpec<T extends Collections.ICollectible> =
  | Collections.IReadOnlyValidatingCollector<T>
  | BuiltInSource;

/**
 * Result with source attribution
 * @public
 */
export interface ISourcedItem<T> {
  readonly item: T;
  readonly sourceId: SourceId;
  readonly sourceName: string;
}

/**
 * Parameters for multi-source collection
 * @public
 */
export interface IMultiSourceCollectionParams<T extends Collections.ICollectible> {
  /** Sources in priority order (first = highest priority) */
  readonly sources: ReadonlyArray<SourceSpec<T>>;
}

/**
 * Multi-source collection
 * @public
 */
export class MultiSourceCollection<T extends Collections.ICollectible> {
  public static create<T extends Collections.ICollectible>(
    params: IMultiSourceCollectionParams<T>
  ): Result<MultiSourceCollection<T>>;

  /** Get item by composite key with source attribution */
  public get(key: string): Result<ISourcedItem<T>>;

  /** Get item by composite key (typed) */
  public getTyped(key: CollectibleKey<T>): Result<ISourcedItem<T>>;

  /** Get item without source attribution */
  public getItem(key: string): Result<T>;

  /** Get item without source attribution (typed) */
  public getItemTyped(key: CollectibleKey<T>): Result<T>;

  /** Check if item exists */
  public has(key: string): boolean;

  /** Check if item exists (typed) */
  public hasTyped(key: CollectibleKey<T>): boolean;

  /** Get source by ID */
  public getSource(sourceId: SourceId): Result<Collections.IReadOnlyValidatingCollector<T>>;

  /** All composite keys from all sources */
  public getAllKeys(): ReadonlyArray<CollectibleKey<T>>;

  /** All items with source attribution */
  public getAll(): ReadonlyArray<ISourcedItem<T>>;

  /** All source IDs in priority order */
  public get sourceIds(): ReadonlyArray<SourceId>;

  /** All source names in priority order */
  public get sourceNames(): ReadonlyArray<string>;

  /** Number of sources */
  public get numSources(): number;
}
```

### Main Library

```typescript
/**
 * Parameters for creating the chocolate library
 * @public
 */
export interface IChocolateLibraryParams {
  readonly ingredientSources?: ReadonlyArray<SourceSpec<Ingredient>>;
  readonly recipeSources?: ReadonlyArray<SourceSpec<IRecipe>>;
}

/**
 * Main entry point for the chocolate library
 * @public
 */
export class ChocolateLibrary {
  public static create(params?: IChocolateLibraryParams): Result<ChocolateLibrary>;

  // Ingredient access (composite IDs)
  public getIngredient(id: string): Result<Ingredient>;
  public getIngredientTyped(id: IngredientId): Result<Ingredient>;

  // Ingredient access (by base ID + source)
  public getIngredientByBase(baseId: string, sourceId: string): Result<Ingredient>;
  public getIngredientByBaseTyped(baseId: BaseIngredientId, sourceId: SourceId): Result<Ingredient>;

  // Recipe access (composite IDs)
  public getRecipe(id: string): Result<IRecipe>;
  public getRecipeTyped(id: RecipeId): Result<IRecipe>;

  // Recipe access (by base ID + source)
  public getRecipeByBase(baseId: string, sourceId: string): Result<IRecipe>;
  public getRecipeByBaseTyped(baseId: BaseRecipeId, sourceId: SourceId): Result<IRecipe>;

  // Recipe versioning
  public getRecipeVersions(name: string): ReadonlyArray<IRecipe>;

  // Scaling (uses composite IDs)
  public scaleRecipe(id: string, targetWeight: Grams, versionIndex?: number): Result<IScaledRecipe>;
  public scaleRecipeTyped(id: RecipeId, targetWeight: Grams, versionIndex?: number): Result<IScaledRecipe>;

  // Mutation (on first writable source, uses composite IDs)
  public addRecipeVersion(id: string, version: IRecipeDetails): Result<IRecipe>;
  public addRecipeUsage(id: string, usage: IRecipeUsage, versionIndex?: number): Result<IRecipe>;

  // Source access
  public getIngredientSource(sourceId: SourceId): Result<IngredientCollection>;
  public getRecipeSource(sourceId: SourceId): Result<RecipeCollection>;

  // Multi-source collections
  public get ingredients(): MultiSourceCollection<Ingredient>;
  public get recipes(): MultiSourceCollection<IRecipe>;
}
```

## JSON Format

### Chocolate Ingredient
```json
{
  "id": "dark-70",
  "name": "Dark Chocolate 70%",
  "category": "chocolate",
  "chocolateType": "dark",
  "cacaoPercentage": 70,
  "viscosityDegrees": 38,
  "viscosityStars": 3,
  "temperatureCurve": {
    "melt": 45,
    "cool": 27,
    "working": 31
  },
  "ganacheCharacteristics": {
    "cacaoFat": 35.0,
    "sugar": 28.0,
    "milkFat": 0.0,
    "water": 1.0,
    "solids": 36.0,
    "otherFats": 0.0
  },
  "source": {
    "name": "Standard Formulation"
  }
}
```

### Recipe
```json
{
  "id": "basic-dark-ganache",
  "metadata": {
    "name": "basic-dark-ganache",
    "source": { "name": "Classic Techniques" },
    "description": "Traditional dark chocolate ganache",
    "tags": ["ganache", "dark", "basic"]
  },
  "versions": [
    {
      "ingredients": [
        { "ingredientId": "dark-70", "amount": 600, "notes": "Finely chopped" },
        { "ingredientId": "heavy-cream", "amount": 400 }
      ],
      "baseWeight": 1000,
      "yield": "Makes approximately 40 pieces",
      "versionNotes": "Original 3:2 ratio",
      "usage": [
        {
          "date": "2024-12-15T10:30:00Z",
          "scaledWeight": 500,
          "notes": "Perfect texture"
        }
      ]
    }
  ]
}
```

## Key Design Benefits

### 1. Composite ID System
- **Dot Separator**: Natural TypeScript feel with `${sourceId}.${baseId}` format
- **Uniqueness**: Composite IDs (IngredientId, RecipeId) guarantee no collisions across sources
- **Validation**:
  - Source IDs and base IDs must NOT contain dots
  - Composite IDs must contain exactly ONE dot
  - Character restrictions: alphanumeric, dashes, underscores only
- **Traceability**: Always know where an item came from via `CompositeId.parseIngredientId()`
- **Ergonomics**: Most APIs use composite IDs (unadorned names), base IDs used only within collections

### 2. Mutable/Immutable Sources
- **Type Safety**: `IngredientCollection` vs `MutableIngredientCollection`
- **Explicit**: Can't accidentally mutate read-only sources
- **Flexible**: Callers can mutate directly and notify library

### 3. Computed Percentages
- **Accuracy**: Always correct, can't get out of sync
- **Simplicity**: Store only base weights
- **Performance**: Negligible calculation cost

### 4. Recipe Versioning
- **Usage in versions**: Track when each version was used
- **Evolution**: Clear history of recipe development
- **Flexibility**: Multiple concurrent versions possible

### 5. ValidatingCollector
- **Indexed access**: Get by index or by key
- **Validation**: Automatic validation on add
- **Consistency**: Standard pattern across monorepo

## Implementation Estimate

**Complexity**: Moderate to Complex

**New Files**: ~30
- Common: 4 (branded types, enums, composite key, index)
- Ingredients: 5 (interfaces, collections, converters, index, built-in data)
- Recipes: 6 (interfaces, collections, scaler, converters, index, built-in data)
- Calculations: 2 (ganache calculator, index)
- Runtime: 3 (multi-source, library, index)
- Tests: ~20-25

**Modified Files**: 1
- `src/index.ts`

## Next Steps

1. Common types and composite key utilities
2. Ingredient interfaces and collections
3. Recipe interfaces and collections
4. Multi-source runtime
5. Scaling and calculations
6. Built-in data
7. Integration tests
