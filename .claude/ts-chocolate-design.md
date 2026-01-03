# @fgv/ts-chocolate Architecture Design

## Executive Summary

This document defines the core architecture and interfaces for `@fgv/ts-chocolate`, a TypeScript library for chocolate recipe management and calculations. The library focuses on ganache recipes in Phase 1, with extensibility for other filling types.

The design follows established monorepo patterns from `@fgv/ts-utils`, `@fgv/ts-res`, and `@fgv/ts-json`, emphasizing:
- Result pattern for error handling
- Type-safe converters and validators for JSON I/O
- Packlet organization for cohesive modules
- Multi-source collection management with proper attribution

## Core Design Principles

### 1. Consistency with FGV Monorepo Patterns
- **Result Pattern**: All fallible operations return `Result<T>`
- **Converters**: Use `Converters.object<T>()` for JSON deserialization
- **Validators**: Use `Validators.object<T>()` for complex object validation
- **Collections**: Use `ResultMap` and `ValidatingResultMap` for type-safe collections
- **Branded Types**: Use branded string types for IDs (e.g., `IngredientId`, `RecipeId`)

### 2. Weight-Based Calculations
- **Native Storage**: All weights stored internally as grams (number)
- **Output Conversion**: Convert to user's preferred unit on output
- **Precision**: Use standard JavaScript number precision (sufficient for culinary purposes)

### 3. Multi-Source Recipe Management
- **Built-in Recipes**: Shipped with library, read-only
- **App-Local Recipes**: User-defined, stored locally
- **Future: Cloud**: Remote recipe sources
- **Proprietary Protection**: User recipes kept separate from built-in

### 4. Extensibility
- Phase 1: Ganache-focused with extensible ingredient interface
- Phase 2+: Additional filling types, procedures, equipment

## Type System

### Branded Types

```typescript
/**
 * Unique identifier for an ingredient
 * @public
 */
export type IngredientId = string & { readonly __ingredientId: unique symbol };

/**
 * Unique identifier for a recipe (version-specific)
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
```

## Packlet Organization

```
src/packlets/
├── common/              # Shared types, branded types, enums
│   ├── brandedTypes.ts
│   ├── enums.ts
│   └── index.ts
├── ingredients/         # Ingredient definitions and management
│   ├── ingredient.ts           # IIngredient, IIngredientCharacteristics
│   ├── ingredientCollection.ts # IngredientCollection class
│   ├── converters.ts           # JSON converters
│   └── index.ts
├── recipes/             # Recipe definitions and management
│   ├── recipe.ts               # IRecipe, IRecipeIngredient
│   ├── recipeCollection.ts     # RecipeCollection class
│   ├── recipeScaler.ts         # Recipe scaling logic
│   ├── converters.ts           # JSON converters
│   └── index.ts
├── calculations/        # Ganache-specific calculations
│   │── ganacheCalculator.ts   # Ganache ratio calculations
│   └── index.ts
└── runtime/             # High-level API and collections
    ├── chocolateLibrary.ts     # Main library orchestrator
    ├── multiSourceCollection.ts # Multi-source collection management
    └── index.ts
```

## Core Interfaces

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
  /** Melting temperature */
  readonly melt: Celsius;

  /** Cooling temperature */
  readonly cool: Celsius;

  /** Working temperature */
  readonly working: Celsius;
}

/**
 * Source attribution for an ingredient or recipe
 * @public
 */
export interface ISource {
  /** Source name or attribution */
  readonly name: string;

  /** Optional source URL */
  readonly url?: string;

  /** Optional notes about the source */
  readonly notes?: string;
}

/**
 * Base ingredient interface with common properties
 * @public
 */
export interface IIngredient {
  /** Unique identifier */
  readonly id: IngredientId;

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
}

/**
 * Chocolate-specific ingredient
 * @public
 */
export interface IChocolateIngredient extends IIngredient {
  readonly category: IngredientCategory.Chocolate;

  /** Type of chocolate */
  readonly chocolateType: ChocolateType;

  /** Cacao percentage (0-100) */
  readonly cacaoPercentage: Percentage;

  /** Viscosity in degrees MacMichael */
  readonly viscosityDegrees: number;

  /** Viscosity in Callebaut stars */
  readonly viscosityStars: ViscosityStars;

  /** Temperature curve for tempering */
  readonly temperatureCurve: ITemperatureCurve;
}

/**
 * Sugar-specific ingredient
 * @public
 */
export interface ISugarIngredient extends IIngredient {
  readonly category: IngredientCategory.Sugar;

  /** Hydration number (water binding ability) */
  readonly hydrationNumber: number;

  /** Relative sweetness potency (sucrose = 1.0) */
  readonly sweetnessPotency: number;
}

/**
 * Discriminated union of all ingredient types
 * @public
 */
export type Ingredient =
  | IChocolateIngredient
  | ISugarIngredient
  | IIngredient; // Generic for other categories

/**
 * JSON declaration format for ganache characteristics
 * @public
 */
export interface IGanacheCharacteristicsDecl {
  readonly cacaoFat: number;
  readonly sugar: number;
  readonly milkFat: number;
  readonly water: number;
  readonly solids: number;
  readonly otherFats: number;
}

/**
 * JSON declaration format for temperature curve
 * @public
 */
export interface ITemperatureCurveDecl {
  readonly melt: number;
  readonly cool: number;
  readonly working: number;
}

/**
 * JSON declaration format for source
 * @public
 */
export interface ISourceDecl {
  readonly name: string;
  readonly url?: string;
  readonly notes?: string;
}

/**
 * Base JSON declaration for ingredients
 * @public
 */
export interface IIngredientDecl {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly ganacheCharacteristics: IGanacheCharacteristicsDecl;
  readonly source: ISourceDecl;
  readonly description?: string;
  readonly tags?: string[];
}

/**
 * JSON declaration for chocolate ingredients
 * @public
 */
export interface IChocolateIngredientDecl extends IIngredientDecl {
  readonly category: 'chocolate';
  readonly chocolateType: string;
  readonly cacaoPercentage: number;
  readonly viscosityDegrees: number;
  readonly viscosityStars: number;
  readonly temperatureCurve: ITemperatureCurveDecl;
}

/**
 * JSON declaration for sugar ingredients
 * @public
 */
export interface ISugarIngredientDecl extends IIngredientDecl {
  readonly category: 'sugar';
  readonly hydrationNumber: number;
  readonly sweetnessPotency: number;
}

/**
 * Discriminated union of ingredient declarations
 * @public
 */
export type IngredientDecl = IChocolateIngredientDecl | ISugarIngredientDecl | IIngredientDecl;
```

### Recipes Packlet

```typescript
/**
 * An ingredient used in a recipe with amount
 * @public
 */
export interface IRecipeIngredient {
  /** Reference to the ingredient */
  readonly ingredientId: IngredientId;

  /** Amount in grams at base scale */
  readonly amount: Grams;

  /** Optional notes specific to this ingredient in this recipe */
  readonly notes?: string;
}

/**
 * A single usage record for a recipe
 * @public
 */
export interface IRecipeUsage {
  /** Date of usage (ISO 8601) */
  readonly date: string;

  /** Scaled weight used */
  readonly scaledWeight: Grams;

  /** Optional notes from this usage */
  readonly notes?: string;
}

/**
 * Immutable recipe metadata (consistent across versions)
 * @public
 */
export interface IRecipeMetadata {
  /** Non-unique name for grouping versions */
  readonly name: RecipeName;

  /** Source attribution */
  readonly source: ISource;

  /** Optional description */
  readonly description?: string;

  /** Optional tags for searching/filtering */
  readonly tags?: ReadonlyArray<string>;
}

/**
 * Variable recipe details (version-specific)
 * @public
 */
export interface IRecipeDetails {
  /** List of ingredients with amounts */
  readonly ingredients: ReadonlyArray<IRecipeIngredient>;

  /** Base weight of the recipe in grams (the "natural" scale) */
  readonly baseWeight: Grams;

  /** Optional yield information (e.g., "makes 24 pieces") */
  readonly yield?: string;

  /** Optional version notes */
  readonly versionNotes?: string;
}

/**
 * Complete recipe definition
 * @public
 */
export interface IRecipe {
  /** Unique identifier for this version */
  readonly id: RecipeId;

  /** Immutable metadata */
  readonly metadata: IRecipeMetadata;

  /** Version-specific details */
  readonly details: IRecipeDetails;

  /** Usage history */
  readonly usage: ReadonlyArray<IRecipeUsage>;
}

/**
 * JSON declaration for recipe ingredient
 * @public
 */
export interface IRecipeIngredientDecl {
  readonly ingredientId: string;
  readonly amount: number;
  readonly notes?: string;
}

/**
 * JSON declaration for recipe usage
 * @public
 */
export interface IRecipeUsageDecl {
  readonly date: string;
  readonly scaledWeight: number;
  readonly notes?: string;
}

/**
 * JSON declaration for recipe metadata
 * @public
 */
export interface IRecipeMetadataDecl {
  readonly name: string;
  readonly source: ISourceDecl;
  readonly description?: string;
  readonly tags?: string[];
}

/**
 * JSON declaration for recipe details
 * @public
 */
export interface IRecipeDetailsDecl {
  readonly ingredients: IRecipeIngredientDecl[];
  readonly baseWeight: number;
  readonly yield?: string;
  readonly versionNotes?: string;
}

/**
 * JSON declaration format for recipes
 * @public
 */
export interface IRecipeDecl {
  readonly id: string;
  readonly metadata: IRecipeMetadataDecl;
  readonly details: IRecipeDetailsDecl;
  readonly usage?: IRecipeUsageDecl[];
}

/**
 * A recipe ingredient scaled to target weight
 * @public
 */
export interface IScaledRecipeIngredient {
  /** Reference to the ingredient */
  readonly ingredient: Ingredient;

  /** Scaled amount in grams */
  readonly amount: Grams;

  /** Percentage of total weight */
  readonly percentage: Percentage;

  /** Optional notes */
  readonly notes?: string;
}

/**
 * A recipe scaled to a specific target weight
 * @public
 */
export interface IScaledRecipe {
  /** Original recipe */
  readonly recipe: IRecipe;

  /** Target total weight */
  readonly targetWeight: Grams;

  /** Scaling factor applied */
  readonly scaleFactor: number;

  /** Scaled ingredients */
  readonly scaledIngredients: ReadonlyArray<IScaledRecipeIngredient>;

  /** Calculated ganache characteristics of the final product */
  readonly calculatedCharacteristics: IGanacheCharacteristics;
}
```

### Collections

```typescript
/**
 * Parameters for constructing an ingredient collection
 * @public
 */
export interface IIngredientCollectionParams {
  /** Initial ingredients */
  readonly ingredients?: Iterable<Ingredient>;

  /** Source name for this collection */
  readonly sourceName: string;

  /** If true, collection is read-only */
  readonly readOnly?: boolean;
}

/**
 * Collection of ingredients with validation
 * Implements IReadOnlyValidatingResultMap for type-safe access
 * @public
 */
export class IngredientCollection implements Collections.IReadOnlyValidatingResultMap<IngredientId, Ingredient> {
  private readonly _ingredients: Collections.ValidatingResultMap<IngredientId, Ingredient>;
  private readonly _sourceName: string;
  private readonly _readOnly: boolean;

  /**
   * Creates a new ingredient collection
   * @param params - Construction parameters
   * @returns Result with the new collection or error
   */
  public static create(params: IIngredientCollectionParams): Result<IngredientCollection>;

  /**
   * Adds an ingredient to the collection (validates against read-only)
   * @param ingredient - The ingredient to add
   * @returns Result indicating success or failure
   */
  public add(ingredient: Ingredient): Result<Ingredient>;

  /**
   * Gets an ingredient by ID (typed)
   * @param id - The ingredient ID
   * @returns Result with the ingredient or error
   */
  public get(id: IngredientId): Result<Ingredient>;

  /**
   * Checks if an ingredient exists
   * @param id - The ingredient ID
   * @returns true if ingredient exists
   */
  public has(id: IngredientId): boolean;

  /**
   * Number of ingredients in the collection
   */
  public get size(): number;

  /**
   * All ingredient IDs
   */
  public get ids(): ReadonlyArray<IngredientId>;

  /**
   * All ingredients
   */
  public get ingredients(): ReadonlyArray<Ingredient>;

  /**
   * Source name of this collection
   */
  public get sourceName(): string;

  /**
   * Whether this collection is read-only
   */
  public get isReadOnly(): boolean;

  /**
   * Access to validating interface (accepts string IDs)
   */
  public get validating(): Collections.IReadOnlyResultMapValidator<IngredientId, Ingredient>;
}

/**
 * Parameters for constructing a recipe collection
 * @public
 */
export interface IRecipeCollectionParams {
  /** Initial recipes */
  readonly recipes?: Iterable<IRecipe>;

  /** Source name for this collection */
  readonly sourceName: string;

  /** If true, collection is read-only */
  readonly readOnly?: boolean;
}

/**
 * Collection of recipes with validation
 * Implements IReadOnlyValidatingResultMap for type-safe access
 * @public
 */
export class RecipeCollection implements Collections.IReadOnlyValidatingResultMap<RecipeId, IRecipe> {
  private readonly _recipes: Collections.ValidatingResultMap<RecipeId, IRecipe>;
  private readonly _sourceName: string;
  private readonly _readOnly: boolean;

  /**
   * Creates a new recipe collection
   * @param params - Construction parameters
   * @returns Result with the new collection or error
   */
  public static create(params: IRecipeCollectionParams): Result<RecipeCollection>;

  /**
   * Adds a recipe to the collection (validates against read-only)
   * @param recipe - The recipe to add
   * @returns Result indicating success or failure
   */
  public add(recipe: IRecipe): Result<IRecipe>;

  /**
   * Adds a usage record to a recipe
   * @param id - The recipe ID
   * @param usage - The usage record to add
   * @returns Result with updated recipe or error
   */
  public addUsage(id: RecipeId, usage: IRecipeUsage): Result<IRecipe>;

  /**
   * Gets a recipe by ID (typed)
   * @param id - The recipe ID
   * @returns Result with the recipe or error
   */
  public get(id: RecipeId): Result<IRecipe>;

  /**
   * Gets all versions of a recipe by name
   * @param name - The recipe name
   * @returns Array of all recipes with that name
   */
  public getVersionsByName(name: RecipeName): ReadonlyArray<IRecipe>;

  /**
   * Checks if a recipe exists
   * @param id - The recipe ID
   * @returns true if recipe exists
   */
  public has(id: RecipeId): boolean;

  /**
   * Number of recipes in the collection
   */
  public get size(): number;

  /**
   * All recipe IDs
   */
  public get ids(): ReadonlyArray<RecipeId>;

  /**
   * All recipes
   */
  public get recipes(): ReadonlyArray<IRecipe>;

  /**
   * Source name of this collection
   */
  public get sourceName(): string;

  /**
   * Whether this collection is read-only
   */
  public get isReadOnly(): boolean;

  /**
   * Access to validating interface (accepts string IDs)
   */
  public get validating(): Collections.IReadOnlyResultMapValidator<RecipeId, IRecipe>;
}
```

### Runtime / Multi-Source Collections

```typescript
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

/**
 * Source specification - either a collection or a built-in identifier
 * @public
 */
export type SourceSpec<TK extends string, TV> =
  | Collections.IReadOnlyValidatingResultMap<TK, TV>
  | BuiltInSource;

/**
 * Result of a multi-source lookup with attribution
 * @public
 */
export interface ISourcedItem<T> {
  /** The item */
  readonly item: T;

  /** Source name it came from */
  readonly sourceName: string;
}

/**
 * Parameters for multi-source collection
 * @public
 */
export interface IMultiSourceCollectionParams<TK extends string, TV> {
  /** List of sources in priority order (first = highest priority) */
  readonly sources: ReadonlyArray<SourceSpec<TK, TV>>;
}

/**
 * Multi-source collection with priority and attribution
 * @public
 */
export class MultiSourceCollection<TK extends string, TV> {
  private readonly _sources: ReadonlyArray<Collections.IReadOnlyValidatingResultMap<TK, TV>>;

  /**
   * Creates a new multi-source collection
   * @param params - Construction parameters
   * @returns Result with the new collection or error
   */
  public static create<TK extends string, TV>(
    params: IMultiSourceCollectionParams<TK, TV>
  ): Result<MultiSourceCollection<TK, TV>>;

  /**
   * Gets an item by ID with source attribution
   * @param id - The item ID (string for convenience, validated internally)
   * @returns Result with sourced item or error
   */
  public get(id: string): Result<ISourcedItem<TV>>;

  /**
   * Gets an item by typed ID with source attribution
   * @param id - The typed item ID
   * @returns Result with sourced item or error
   */
  public getTyped(id: TK): Result<ISourcedItem<TV>>;

  /**
   * Gets an item by ID without source attribution
   * @param id - The item ID (string for convenience)
   * @returns Result with item or error
   */
  public getItem(id: string): Result<TV>;

  /**
   * Gets an item by typed ID without source attribution
   * @param id - The typed item ID
   * @returns Result with item or error
   */
  public getItemTyped(id: TK): Result<TV>;

  /**
   * Checks if an item exists in any source
   * @param id - The item ID (string for convenience)
   * @returns true if item exists
   */
  public has(id: string): boolean;

  /**
   * Checks if an item exists in any source (typed)
   * @param id - The typed item ID
   * @returns true if item exists
   */
  public hasTyped(id: TK): boolean;

  /**
   * Gets source by name
   * @param sourceName - Name of the source
   * @returns Result with the source or error
   */
  public getSource(sourceName: string): Result<Collections.IReadOnlyValidatingResultMap<TK, TV>>;

  /**
   * Gets all IDs from all sources
   * @returns Array of all IDs
   */
  public getAllIds(): ReadonlyArray<TK>;

  /**
   * Gets all items from all sources
   * @returns Array of all sourced items
   */
  public getAll(): ReadonlyArray<ISourcedItem<TV>>;

  /**
   * All source names in priority order
   */
  public get sourceNames(): ReadonlyArray<string>;

  /**
   * Number of sources
   */
  public get numSources(): number;
}
```

### Main Library Orchestrator

```typescript
/**
 * Parameters for creating the chocolate library
 * @public
 */
export interface IChocolateLibraryParams {
  /**
   * Ingredient sources in priority order
   * Can be actual collections or built-in identifiers
   * Default: [BuiltInSource.DefaultIngredients]
   */
  readonly ingredientSources?: ReadonlyArray<SourceSpec<IngredientId, Ingredient>>;

  /**
   * Recipe sources in priority order
   * Can be actual collections or built-in identifiers
   * Default: [BuiltInSource.DefaultRecipes]
   */
  readonly recipeSources?: ReadonlyArray<SourceSpec<RecipeId, IRecipe>>;
}

/**
 * Main entry point for the chocolate library
 * @public
 */
export class ChocolateLibrary {
  private readonly _ingredients: MultiSourceCollection<IngredientId, Ingredient>;
  private readonly _recipes: MultiSourceCollection<RecipeId, IRecipe>;

  /**
   * Creates a new chocolate library
   * @param params - Construction parameters
   * @returns Result with the new library or error
   */
  public static create(params?: IChocolateLibraryParams): Result<ChocolateLibrary>;

  /**
   * Gets an ingredient by ID (string convenience)
   * @param id - The ingredient ID as string
   * @returns Result with the ingredient or error
   */
  public getIngredient(id: string): Result<Ingredient>;

  /**
   * Gets an ingredient by typed ID
   * @param id - The ingredient ID
   * @returns Result with the ingredient or error
   */
  public getIngredientTyped(id: IngredientId): Result<Ingredient>;

  /**
   * Gets a recipe by ID (string convenience)
   * @param id - The recipe ID as string
   * @returns Result with the recipe or error
   */
  public getRecipe(id: string): Result<IRecipe>;

  /**
   * Gets a recipe by typed ID
   * @param id - The recipe ID
   * @returns Result with the recipe or error
   */
  public getRecipeTyped(id: RecipeId): Result<IRecipe>;

  /**
   * Gets all versions of a recipe by name
   * @param name - The recipe name (string convenience)
   * @returns Array of all recipes with that name
   */
  public getRecipeVersions(name: string): ReadonlyArray<IRecipe>;

  /**
   * Scales a recipe to a target weight
   * @param recipeId - The recipe ID (string convenience)
   * @param targetWeight - Target weight in grams
   * @returns Result with scaled recipe or error
   */
  public scaleRecipe(recipeId: string, targetWeight: Grams): Result<IScaledRecipe>;

  /**
   * Scales a recipe to a target weight (typed)
   * @param recipeId - The recipe ID
   * @param targetWeight - Target weight in grams
   * @returns Result with scaled recipe or error
   */
  public scaleRecipeTyped(recipeId: RecipeId, targetWeight: Grams): Result<IScaledRecipe>;

  /**
   * Adds a usage record to a recipe in the first writable source
   * @param recipeId - The recipe ID (string convenience)
   * @param usage - The usage record to add
   * @returns Result with updated recipe or error
   */
  public addRecipeUsage(recipeId: string, usage: IRecipeUsage): Result<IRecipe>;

  /**
   * Gets an ingredient source by name
   * @param sourceName - Name of the source
   * @returns Result with the source or error
   */
  public getIngredientSource(sourceName: string): Result<IngredientCollection>;

  /**
   * Gets a recipe source by name
   * @param sourceName - Name of the source
   * @returns Result with the source or error
   */
  public getRecipeSource(sourceName: string): Result<RecipeCollection>;

  /**
   * Access to ingredient multi-source collection
   */
  public get ingredients(): MultiSourceCollection<IngredientId, Ingredient>;

  /**
   * Access to recipe multi-source collection
   */
  public get recipes(): MultiSourceCollection<RecipeId, IRecipe>;
}
```

## Converters and Validators

### Ingredient Converters

```typescript
/**
 * Namespace for ingredient-related converters
 * @public
 */
export namespace Convert {
  /** Converts string to IngredientId */
  export const ingredientId: Converter<IngredientId>;

  /** Converts string to RecipeId */
  export const recipeId: Converter<RecipeId>;

  /** Converts number to Grams */
  export const grams: Converter<Grams>;

  /** Converts number to Percentage with validation (0-100) */
  export const percentage: Converter<Percentage>;

  /** Converts string to IngredientCategory enum */
  export const ingredientCategory: Converter<IngredientCategory>;

  /** Converts string to SourceType enum */
  export const sourceType: Converter<SourceType>;

  /** Converts string to WeightUnit enum */
  export const weightUnit: Converter<WeightUnit>;

  /** Converts unknown to IIngredientCharacteristics */
  export const ingredientCharacteristics: Converter<IIngredientCharacteristics>;

  /** Converts unknown to IIngredientSource */
  export const ingredientSource: Converter<IIngredientSource>;

  /** Converts unknown to IIngredient from JSON */
  export const ingredient: Converter<IIngredient>;

  /** Converts unknown to IRecipeIngredient */
  export const recipeIngredient: Converter<IRecipeIngredient>;

  /** Converts unknown to IRecipe from JSON */
  export const recipe: Converter<IRecipe>;
}
```

### Example Converter Implementation

```typescript
// In src/packlets/ingredients/converters.ts
import { Converters, Converter } from '@fgv/ts-utils';

export const ingredientId: Converter<IngredientId> = Converters.string.map(
  (s) => succeed(s as IngredientId)
);

export const percentage: Converter<Percentage> = Converters.number
  .onSuccess((n) => {
    if (n < 0 || n > 100) {
      return fail(`Percentage must be between 0 and 100, got ${n}`);
    }
    return succeed(n as Percentage);
  });

export const ingredientCharacteristics = Converters.object<IIngredientCharacteristics>({
  cacaoFat: percentage,
  sugar: percentage,
  milkFat: percentage,
  water: percentage,
  solids: percentage,
  otherFats: percentage
});

export const ingredientSource = Converters.object<IIngredientSource>({
  type: sourceType,
  name: Converters.optionalField(Converters.string),
  url: Converters.optionalField(Converters.string),
  notes: Converters.optionalField(Converters.string)
});

export const ingredient = Converters.object<IIngredient>({
  id: ingredientId,
  name: Converters.string,
  category: ingredientCategory,
  characteristics: ingredientCharacteristics,
  source: ingredientSource,
  description: Converters.optionalField(Converters.string),
  tags: Converters.optionalField(Converters.arrayOf(Converters.string))
});
```

## Calculation Logic

### Recipe Scaler

```typescript
/**
 * Scales a recipe to a target weight
 * @public
 */
export class RecipeScaler {
  /**
   * Scales a recipe to target weight
   * @param recipe - The recipe to scale
   * @param ingredients - Ingredient lookup function
   * @param targetWeight - Target weight in grams
   * @returns Result with scaled recipe or error
   */
  public static scale(
    recipe: IRecipe,
    ingredients: (id: IngredientId) => Result<IIngredient>,
    targetWeight: Grams
  ): Result<IScaledRecipe>;

  /**
   * Calculates combined characteristics from ingredient list
   * @param ingredients - List of scaled ingredients
   * @returns Calculated characteristics
   */
  public static calculateCharacteristics(
    ingredients: ReadonlyArray<IScaledRecipeIngredient>
  ): IIngredientCharacteristics;
}
```

### Ganache Calculator (Phase 1)

```typescript
/**
 * Ganache-specific calculations
 * @public
 */
export class GanacheCalculator {
  /**
   * Validates that a recipe meets ganache criteria
   * @param recipe - The recipe to validate
   * @param ingredients - Ingredient lookup
   * @returns Result indicating if recipe is valid ganache
   */
  public static validateGanache(
    recipe: IRecipe,
    ingredients: (id: IngredientId) => Result<IIngredient>
  ): Result<true>;

  /**
   * Calculates fat/water ratio for ganache
   * @param scaledRecipe - Scaled recipe with ingredients
   * @returns Fat to water ratio
   */
  public static calculateFatWaterRatio(scaledRecipe: IScaledRecipe): number;
}
```

## JSON Schema and File Format

### Ingredient File Format

```json
{
  "ingredients": [
    {
      "id": "dark-70",
      "name": "Dark Chocolate 70%",
      "category": "chocolate",
      "characteristics": {
        "cacaoFat": 35.0,
        "sugar": 28.0,
        "milkFat": 0.0,
        "water": 1.0,
        "solids": 36.0,
        "otherFats": 0.0
      },
      "source": {
        "type": "built-in",
        "name": "Standard Formulation"
      },
      "description": "Standard 70% cacao dark chocolate",
      "tags": ["dark", "70%"]
    }
  ]
}
```

### Recipe File Format

```json
{
  "recipes": [
    {
      "id": "basic-dark-ganache",
      "name": "Basic Dark Chocolate Ganache",
      "baseWeight": 1000,
      "ingredients": [
        {
          "ingredientId": "dark-70",
          "amount": 600,
          "notes": "Finely chopped"
        },
        {
          "ingredientId": "heavy-cream",
          "amount": 400
        }
      ],
      "source": {
        "type": "built-in",
        "name": "Classic Techniques"
      },
      "description": "Traditional 3:2 dark chocolate ganache",
      "yield": "Makes approximately 40 pieces",
      "tags": ["ganache", "dark", "basic"]
    }
  ]
}
```

## Migration and Extensibility

### Phase 1 Scope (Current)
- Ingredient interface with ganache-relevant characteristics
- Recipe interface with ingredients and amounts
- Basic scaling calculations
- Multi-source collections
- JSON import/export

### Phase 2+ Extensions
- Add `IProcedure` and `IRecipeProcedure` interfaces
- Add `IEquipment` interface
- Add `RecipeType` enum for different filling types
- Add temperature and timing information
- Add more sophisticated validation (e.g., texture predictions)

### Extensibility Points

The design supports future extension without breaking changes:

1. **Add Optional Fields**: New optional fields can be added to interfaces
2. **Add New Characteristics**: `IIngredientCharacteristics` can grow with new properties
3. **Add New Categories**: `IngredientCategory` enum can expand
4. **Add New Calculators**: Additional calculator classes for different filling types
5. **Add Procedures**: Recipes can add optional procedure arrays later

## Alternative Approaches Considered

### Alternative 1: Percentage-Based Storage
**Rejected** - While percentages are useful for display and some calculations, storing weights as grams is more practical for:
- Direct scaling calculations (multiply by scale factor)
- Avoiding rounding errors in conversions
- Matching how users typically input recipes
- Simpler mental model for recipe authors

### Alternative 2: Single Monolithic Collection
**Rejected** - Having a single collection combining built-in and app-local items would:
- Make it harder to preserve user's proprietary recipes
- Complicate read-only vs writable semantics
- Make source attribution less clear
- Reduce flexibility for future cloud sources

### Alternative 3: Class-Based Ingredient/Recipe
**Rejected** - Using classes instead of interfaces would:
- Add unnecessary complexity (no behavior needed on these types)
- Make JSON serialization more complex
- Reduce flexibility for different implementations
- Interfaces with separate converter/validator pattern is more idiomatic

## Risk Assessment

### Technical Risks

1. **Precision in Calculations**
   - **Risk**: JavaScript number precision for very small amounts
   - **Likelihood**: Low
   - **Impact**: Low
   - **Mitigation**: Culinary measurements rarely need sub-gram precision

2. **Validation Completeness**
   - **Risk**: Invalid ingredient characteristics (e.g., percentages > 100% total)
   - **Likelihood**: Medium
   - **Impact**: Medium
   - **Mitigation**: Add validation sum check in converter, clear error messages

3. **Multi-Source Conflicts**
   - **Risk**: Same ID in built-in and app-local with different data
   - **Likelihood**: Medium
   - **Impact**: Low
   - **Mitigation**: Clear priority rules, source attribution in results

### Design Risks

1. **Future Extension Compatibility**
   - **Risk**: Phase 2 features require breaking changes
   - **Likelihood**: Low
   - **Impact**: High
   - **Mitigation**: Designed with optional fields, interface extension points

2. **Converter Pattern Complexity**
   - **Risk**: Manual type checking instead of proper converters
   - **Likelihood**: Medium (if guidelines not followed)
   - **Impact**: High (defeats type safety)
   - **Mitigation**: Clear examples, code review enforcement

## Implementation Estimates

### Complexity: Moderate

**Component Count**: ~15 major components
- 5 packlets (common, ingredients, recipes, calculations, runtime)
- ~3-4 files per packlet average

**New Files**: ~20-25
- Interfaces and types: ~5
- Converters: ~3-4
- Collections: ~4-5
- Calculators: ~2-3
- Runtime/orchestration: ~2-3
- Tests: ~15-20

**Modified Files**: 1
- `src/index.ts` (exports)

**Test Files**: ~20
- One test file per implementation file
- Additional integration tests for ChocolateLibrary

## Success Criteria

A successful design implementation will:

1. ✓ Follow monorepo patterns (Result, Converters, Collections)
2. ✓ Use type-safe JSON validation (no manual type checking)
3. ✓ Support multi-source collections with attribution
4. ✓ Provide clear, documented public API
5. ✓ Enable recipe scaling with accurate calculations
6. ✓ Maintain 100% test coverage
7. ✓ Support future extensibility without breaking changes

## Next Steps

1. **Create Base Types** (src/packlets/common/)
   - Branded types
   - Enums
   - Export from common packlet

2. **Implement Ingredient System** (src/packlets/ingredients/)
   - Interfaces
   - Converters
   - IngredientCollection class
   - Tests

3. **Implement Recipe System** (src/packlets/recipes/)
   - Interfaces
   - Converters
   - RecipeCollection class
   - RecipeScaler class
   - Tests

4. **Implement Calculations** (src/packlets/calculations/)
   - GanacheCalculator
   - Tests

5. **Implement Runtime** (src/packlets/runtime/)
   - MultiSourceCollection class
   - ChocolateLibrary class
   - Tests

6. **Create Built-in Data**
   - Sample ingredients JSON
   - Sample recipes JSON
   - Load in library defaults

7. **Integration Tests**
   - End-to-end scenarios
   - Multi-source resolution
   - Recipe scaling workflow
