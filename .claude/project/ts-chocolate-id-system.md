# @fgv/ts-chocolate ID System Design

## Overview

The library uses a composite ID system with dot-separated components to ensure global uniqueness while maintaining source attribution.

## ID Types

### Base IDs (Within a Single Source)

**SourceId**
- **Purpose**: Identifies a collection source
- **Restrictions**: Alphanumeric, dashes, underscores only (NO dots)
- **Pattern**: `/^[a-zA-Z0-9_-]+$/`
- **Examples**: `"built-in"`, `"my-recipes"`, `"work_ingredients"`

**BaseIngredientId**
- **Purpose**: Identifies an ingredient within its source
- **Restrictions**: Alphanumeric, dashes, underscores only (NO dots)
- **Pattern**: `/^[a-zA-Z0-9_-]+$/`
- **Examples**: `"dark-70"`, `"heavy_cream"`, `"vanilla-extract"`

**BaseRecipeId**
- **Purpose**: Identifies a recipe within its source
- **Restrictions**: Alphanumeric, dashes, underscores only (NO dots)
- **Pattern**: `/^[a-zA-Z0-9_-]+$/`
- **Examples**: `"basic-ganache"`, `"truffle_filling"`, `"raspberry-ganache"`

### Composite IDs (Globally Unique)

**IngredientId**
- **Purpose**: Globally unique ingredient identifier (most commonly used)
- **Format**: `"${sourceId}.${baseIngredientId}"`
- **Restrictions**: Must contain exactly ONE dot separator
- **Pattern**: `/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/`
- **Examples**:
  - `"built-in.dark-70"`
  - `"my-ingredients.custom-chocolate"`
  - `"supplier_a.premium-cocoa"`

**RecipeId**
- **Purpose**: Globally unique recipe identifier (most commonly used)
- **Format**: `"${sourceId}.${baseRecipeId}"`
- **Restrictions**: Must contain exactly ONE dot separator
- **Pattern**: `/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/`
- **Examples**:
  - `"built-in.basic-ganache"`
  - `"my-recipes.raspberry-truffle"`
  - `"work.holiday-special"`

## Naming Convention Rationale

### Composite IDs Get Unadorned Names

Because composite IDs are used most frequently in the API, they get the simpler, unadorned names:
- `IngredientId` - composite (used everywhere)
- `RecipeId` - composite (used everywhere)

### Base IDs Are Prefixed

Base IDs are only used within individual collections and during composite ID construction, so they get the `Base` prefix:
- `BaseIngredientId` - within a single source
- `BaseRecipeId` - within a single source

This mirrors the usage pattern: **most code works with composite IDs, only collection internals care about base IDs**.

## Validation

### Validators

```typescript
export namespace Validate {
  // Base IDs - ensure no dots
  export const sourceId: Validator<SourceId>;
  export const baseIngredientId: Validator<BaseIngredientId>;
  export const baseRecipeId: Validator<BaseRecipeId>;

  // Composite IDs - ensure exactly one dot
  export const ingredientId: Validator<IngredientId>;
  export const recipeId: Validator<RecipeId>;
}
```

### Validation Rules

**Base IDs (SourceId, BaseIngredientId, BaseRecipeId)**:
- ✅ Must match `/^[a-zA-Z0-9_-]+$/`
- ❌ Cannot contain dots
- ❌ Cannot be empty
- ❌ Cannot contain spaces or special characters

**Composite IDs (IngredientId, RecipeId)**:
- ✅ Must match `/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/`
- ✅ Must contain exactly one dot separator
- ❌ Cannot contain dots in the source or base ID portions
- ❌ Cannot be empty
- ❌ Cannot have empty source or base portions

## Helper Functions

### CompositeId Namespace

```typescript
export namespace CompositeId {
  // Creation
  function createIngredientId(sourceId: SourceId, baseId: BaseIngredientId): IngredientId;
  function createRecipeId(sourceId: SourceId, baseId: BaseRecipeId): RecipeId;

  // Parsing
  function parseIngredientId(id: IngredientId): Result<[SourceId, BaseIngredientId]>;
  function parseRecipeId(id: RecipeId): Result<[SourceId, BaseRecipeId]>;

  // Extraction (convenience methods that don't fail)
  function getIngredientSourceId(id: IngredientId): SourceId;
  function getIngredientBaseId(id: IngredientId): BaseIngredientId;
  function getRecipeSourceId(id: RecipeId): SourceId;
  function getRecipeBaseId(id: RecipeId): BaseRecipeId;
}
```

### Usage Examples

```typescript
// Creating composite IDs
const sourceId = Convert.sourceId.convert('my-source').orThrow();
const baseId = Convert.baseIngredientId.convert('dark-chocolate').orThrow();
const compositeId = CompositeId.createIngredientId(sourceId, baseId);
// compositeId === "my-source.dark-chocolate" as IngredientId

// Parsing composite IDs
const [source, base] = CompositeId.parseIngredientId(compositeId).orThrow();
// source === "my-source" as SourceId
// base === "dark-chocolate" as BaseIngredientId

// Quick extraction (no Result wrapping)
const extractedSource = CompositeId.getIngredientSourceId(compositeId);
const extractedBase = CompositeId.getIngredientBaseId(compositeId);
```

## Interface Usage

### IIngredient

```typescript
export interface IIngredient extends Collections.ICollectible<IngredientId, number> {
  /** Base identifier within source */
  readonly baseId: BaseIngredientId;

  /** Composite key (ICollectible.key) - globally unique */
  readonly key: IngredientId;  // Format: "sourceId.baseId"

  /** Source ID */
  readonly sourceId: SourceId;

  // ... other properties
}
```

### IRecipe

```typescript
export interface IRecipe extends Collections.ICollectible<RecipeId, number> {
  /** Base identifier within source */
  readonly baseId: BaseRecipeId;

  /** Composite key (ICollectible.key) - globally unique */
  readonly key: RecipeId;  // Format: "sourceId.baseId"

  /** Source ID */
  readonly sourceId: SourceId;

  // ... other properties
}
```

## Collection APIs

### Ingredient Collection

```typescript
class IngredientCollection {
  // Get by composite ID (most common)
  get(id: IngredientId): Result<Ingredient>;

  // Get by base ID (within this collection)
  getByBaseId(baseId: BaseIngredientId): Result<Ingredient>;
}
```

### Recipe Collection

```typescript
class RecipeCollection {
  // Get by composite ID (most common)
  get(id: RecipeId): Result<IRecipe>;

  // Get by base ID (within this collection)
  getByBaseId(baseId: BaseRecipeId): Result<IRecipe>;
}
```

## Library-Level APIs

```typescript
class ChocolateLibrary {
  // Primary API - uses composite IDs
  getIngredient(id: string): Result<Ingredient>;
  getIngredientTyped(id: IngredientId): Result<Ingredient>;

  getRecipe(id: string): Result<IRecipe>;
  getRecipeTyped(id: RecipeId): Result<IRecipe>;

  // Alternative API - uses base ID + source
  getIngredientByBase(baseId: string, sourceId: string): Result<Ingredient>;
  getIngredientByBaseTyped(baseId: BaseIngredientId, sourceId: SourceId): Result<Ingredient>;

  getRecipeByBase(baseId: string, sourceId: string): Result<IRecipe>;
  getRecipeByBaseTyped(baseId: BaseRecipeId, sourceId: SourceId): Result<IRecipe>;
}
```

## JSON Format

### Ingredient JSON (uses base IDs)

```json
{
  "id": "dark-70",           // Base ID (no source prefix in JSON)
  "name": "Dark Chocolate 70%",
  "category": "chocolate",
  // ... other properties
}
```

When loaded into a collection with `sourceId = "built-in"`, this becomes:
- `baseId`: `"dark-70"` as BaseIngredientId
- `key` (composite): `"built-in.dark-70"` as IngredientId

### Recipe JSON (uses composite IDs for ingredients)

```json
{
  "id": "basic-ganache",     // Base ID (no source prefix in JSON)
  "metadata": {
    "name": "basic-dark-ganache",
    // ...
  },
  "versions": [
    {
      "ingredients": [
        {
          "ingredientId": "built-in.dark-70",  // Composite ID!
          "amount": 600
        }
      ]
    }
  ]
}
```

Note: **Recipes reference ingredients using composite IDs** to support cross-source ingredient references.

## Design Benefits

### 1. Type Safety
- Impossible to confuse base IDs with composite IDs (different branded types)
- Impossible to use ingredient IDs where recipe IDs are expected
- Compile-time guarantees

### 2. Validation at Boundaries
- JSON → Base ID conversion validates no dots
- Base ID → Composite ID ensures proper format
- Composite ID parsing validates exactly one dot

### 3. Natural API
- Most code uses simple composite IDs (`IngredientId`, `RecipeId`)
- Base IDs only matter inside collections
- Dot separator feels TypeScript-natural

### 4. Traceability
- Every composite ID contains its source
- Easy to extract source: `CompositeId.getIngredientSourceId(id)`
- No ambiguity about item origin

### 5. Cross-Source References
- Recipes can reference ingredients from any source
- Just use the composite IngredientId
- No confusion about which source an ingredient comes from

## Migration/Extension Considerations

### Adding New Sources
1. Create new SourceId (validate no dots)
2. Create collection with that sourceId
3. Add to library's source list
4. Composite IDs automatically incorporate the new source

### Handling Conflicts
- If same baseId exists in multiple sources, composite IDs differ
- Example:
  - Source "A": `"dark-70"` → `"A.dark-70"`
  - Source "B": `"dark-70"` → `"B.dark-70"`
- No collision possible

### Future: Namespaced Sources
Could extend to support hierarchical sources if needed:
- Current: `"source.item"`
- Future: `"org.source.item"` (would require updating pattern)
- For now, use dashes: `"org-source.item"`
