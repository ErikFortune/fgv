# Phase 3: Collection Management - Technical Design

**Date:** 2026-01-13
**Phase:** 3 of 10
**Status:** Technical Design

---

## Executive Summary

This design document details the technical implementation for Phase 3, which extends the editing framework to support CRUD operations on collections themselves. The design adds:

1. **ICollectionManager** interface for collection-level operations
2. **SubLibraryBase** protected methods for collection manipulation
3. **CollectionManager** implementation class
4. Full immutability protection and validation

### Key Design Decisions

- **Protected methods pattern** - Add protected methods to SubLibraryBase for collection manipulation
- **Manager wrapper** - CollectionManager wraps SubLibraryBase to provide public API
- **Immutability enforcement** - Multiple layers of protection against modifying built-in collections
- **Result pattern throughout** - All operations return Result<T>
- **Generic design** - Works with any SubLibraryBase-derived library

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│ CollectionManager<TCompositeId, TBaseId, TItem>              │
│                                                              │
│  Public Methods:                                             │
│  - create(collectionId, metadata)                            │
│  - delete(collectionId)                                      │
│  - updateMetadata(collectionId, metadata)                    │
│  - get(collectionId)                                         │
│  - getAll()                                                  │
│  - exists(collectionId)                                      │
│  - isMutable(collectionId)                                   │
└──────────────────────────────────────────────────────────────┘
                            ↓ delegates to
┌──────────────────────────────────────────────────────────────┐
│ SubLibraryBase<TCompositeId, TBaseId, TItem>                │
│                                                              │
│  NEW Protected Methods:                                      │
│  - removeCollection(collectionId): Result<void>              │
│  - updateCollectionMetadata(collectionId, metadata)          │
│                                                              │
│  Existing Protected Method:                                  │
│  - addCollectionEntry(entry): void                           │
│                                                              │
│  Existing Public Property:                                   │
│  - collections: ReadonlyMap<SourceId, CollectionEntry>       │
└──────────────────────────────────────────────────────────────┘
```

---

## 1. SubLibraryBase Extensions

### 1.1 New Protected Methods

Add two new protected methods to `SubLibraryBase` for collection manipulation:

```typescript
/**
 * Remove a collection from the library.
 * Protected method for use by CollectionManager.
 *
 * @param collectionId - Collection to remove
 * @returns Result indicating success or failure
 * @throws Never throws - returns Failure instead
 */
protected removeCollection(collectionId: SourceId): Result<void> {
  // Validation
  const collection = this.collections.get(collectionId);
  if (collection === undefined) {
    return fail(`Collection "${collectionId}" not found`);
  }

  if (!collection.isMutable) {
    return fail(`Cannot delete immutable collection "${collectionId}"`);
  }

  // The underlying collections property is a ValidatingResultMap
  // which extends Map<K, V>. We need to access the internal map.
  // Challenge: ValidatingResultMap doesn't expose a delete() method
  //
  // Solution: Use the inherited Map delete() method if accessible,
  // or reconstruct the collections map without this entry

  // Since ValidatingResultMap is read-only by design, we need to
  // manipulate the internal state. This requires accessing the
  // private _collections field which is inherited from
  // AggregatedResultMapBase.

  // Implementation approach: Cast to access delete method
  const mutableMap = this.collections as unknown as Map<SourceId, SubLibraryCollectionEntry<TBaseId, TItem>>;
  mutableMap.delete(collectionId);

  return succeed(undefined);
}

/**
 * Update collection metadata.
 * Protected method for use by CollectionManager.
 *
 * @param collectionId - Collection to update
 * @param metadata - Partial metadata to update
 * @returns Result indicating success or failure
 * @throws Never throws - returns Failure instead
 */
protected updateCollectionMetadata(
  collectionId: SourceId,
  metadata: Partial<ICollectionSourceMetadata>
): Result<void> {
  // Validation
  const collection = this.collections.get(collectionId);
  if (collection === undefined) {
    return fail(`Collection "${collectionId}" not found`);
  }

  if (!collection.isMutable) {
    return fail(`Cannot rename immutable collection "${collectionId}"`);
  }

  // Validate metadata
  return this._validateMetadataUpdate(metadata)
    .onSuccess(() => {
      // Update the metadata on the collection entry
      // The collection entry has a metadata property of type ICollectionSourceMetadata
      // We need to create a new metadata object with the updated fields

      const currentMetadata = collection.metadata;
      const updatedMetadata: ICollectionSourceMetadata = {
        ...currentMetadata,
        ...metadata
      };

      // Since collection entries are immutable, we need to replace the entry
      // This requires removing and re-adding with updated metadata

      // Get all items from the collection
      const items = recordFromEntries(collection.items.entries());

      // Remove old entry
      const mutableMap = this.collections as unknown as Map<SourceId, SubLibraryCollectionEntry<TBaseId, TItem>>;
      mutableMap.delete(collectionId);

      // Add new entry with updated metadata
      this.addCollectionEntry({
        id: collectionId,
        isMutable: collection.isMutable,
        metadata: updatedMetadata,
        items
      });

      return succeed(undefined);
    });
}

/**
 * Validate metadata update fields.
 * @param metadata - Partial metadata to validate
 * @returns Result indicating validation success or specific error
 */
private _validateMetadataUpdate(metadata: Partial<ICollectionSourceMetadata>): Result<void> {
  const aggregator = new MessageAggregator();

  // Validate name if provided
  if (metadata.name !== undefined) {
    if (metadata.name.trim() === '') {
      aggregator.addMessage('Collection name cannot be empty');
    } else if (metadata.name.length > 200) {
      aggregator.addMessage('Collection name exceeds 200 characters');
    } else if (metadata.name !== metadata.name.trim()) {
      aggregator.addMessage('Collection name cannot have leading or trailing whitespace');
    }
  }

  // Validate description if provided
  if (metadata.description !== undefined && metadata.description.length > 2000) {
    aggregator.addMessage('Collection description exceeds 2000 characters');
  }

  // Validate format if provided
  if (metadata.format !== undefined && metadata.format !== 'yaml' && metadata.format !== 'json') {
    aggregator.addMessage('Collection format must be "yaml" or "json"');
  }

  // Validate version if provided
  if (metadata.version !== undefined) {
    const semverPattern = /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*)?$/;
    if (!semverPattern.test(metadata.version)) {
      aggregator.addMessage('Collection version must be a valid semver string');
    }
  }

  if (aggregator.hasMessages) {
    return fail(`Invalid metadata: ${aggregator.toString('; ')}`);
  }

  return succeed(undefined);
}
```

### 1.2 Implementation Challenges

**Challenge 1: ValidatingResultMap is Read-Only**

- `SubLibraryBase.collections` is a `ValidatingResultMap` which extends `ReadOnlyResultMap`
- No public delete or modify methods exist
- Need to manipulate internal state

**Solution:** Cast to `Map` to access delete method, with proper validation beforehand.

**Challenge 2: Collection Entries are Immutable**

- Collection entries (metadata, items) are read-only
- Updating metadata requires replacing the entire entry

**Solution:** Remove old entry and add new entry with updated metadata using existing `addCollectionEntry()`.

### 1.3 File Location

**File:** `libraries/ts-chocolate/src/packlets/library-data/subLibrary.ts`

**Placement:** Add methods to the `SubLibraryBase` class around line 880-920 (after instance methods section).

---

## 2. ICollectionManager Interface

### 2.1 Interface Definition

**File:** `libraries/ts-chocolate/src/packlets/editing/model.ts`

```typescript
/**
 * Manager for collection-level CRUD operations.
 * Provides operations to create, delete, and rename collections within a sub-library.
 *
 * @typeParam TCompositeId - Composite ID type (e.g., IngredientId)
 * @typeParam TBaseId - Base ID type (e.g., BaseIngredientId)
 * @typeParam TItem - Item type (e.g., Ingredient)
 * @public
 */
export interface ICollectionManager<
  TCompositeId extends string,
  TBaseId extends string,
  TItem
> {
  /**
   * Get all collections in the library.
   * @returns Array of [collectionId, collection] tuples
   */
  readonly getAll: () => ReadonlyArray<[SourceId, IEditableCollection<TItem, TBaseId, TCompositeId>]>;

  /**
   * Get a specific collection by ID.
   * @param collectionId - Collection identifier
   * @returns Result containing the collection or failure
   */
  readonly get: (collectionId: SourceId) => Result<IEditableCollection<TItem, TBaseId, TCompositeId>>;

  /**
   * Create a new mutable collection.
   * @param collectionId - Unique identifier for the new collection
   * @param metadata - Collection metadata (name, description)
   * @returns Result indicating success or failure
   */
  readonly create: (collectionId: SourceId, metadata: ICollectionSourceMetadata) => Result<void>;

  /**
   * Delete a mutable collection.
   * @param collectionId - Collection to delete
   * @returns Result indicating success or failure
   */
  readonly delete: (collectionId: SourceId) => Result<void>;

  /**
   * Update collection metadata.
   * @param collectionId - Collection to update
   * @param metadata - Partial metadata to update
   * @returns Result indicating success or failure
   */
  readonly updateMetadata: (
    collectionId: SourceId,
    metadata: Partial<ICollectionSourceMetadata>
  ) => Result<void>;

  /**
   * Check if a collection exists.
   * @param collectionId - Collection identifier
   * @returns True if collection exists
   */
  readonly exists: (collectionId: SourceId) => boolean;

  /**
   * Check if a collection is mutable.
   * @param collectionId - Collection identifier
   * @returns Result containing true if mutable, failure if not found
   */
  readonly isMutable: (collectionId: SourceId) => Result<boolean>;
}
```

### 2.2 Type Parameters

The interface uses three type parameters matching `SubLibraryBase`:

- **TCompositeId** - Full qualified ID (e.g., `IngredientId = "ingredients.{collection}.{baseId}"`)
- **TBaseId** - Base item ID within collection (e.g., `BaseIngredientId = "butter"`)
- **TItem** - Entity type (e.g., `Ingredient`)

---

## 3. CollectionManager Implementation

### 3.1 Class Structure

**File:** `libraries/ts-chocolate/src/packlets/editing/collectionManager.ts` (NEW)

```typescript
import { fail, Result, succeed } from '@fgv/ts-utils';
import { SourceId } from '../common';
import { SubLibraryBase } from '../library-data';
import { EditableCollection } from './editableCollection';
import { ICollectionManager, IEditableCollection } from './model';

/**
 * Implementation of collection management operations.
 * Wraps a SubLibraryBase instance to provide collection-level CRUD.
 *
 * @typeParam TCompositeId - Composite ID type (e.g., IngredientId)
 * @typeParam TBaseId - Base ID type (e.g., BaseIngredientId)
 * @typeParam TItem - Item type (e.g., Ingredient)
 * @public
 */
export class CollectionManager<
  TCompositeId extends string,
  TBaseId extends string,
  TItem
> implements ICollectionManager<TCompositeId, TBaseId, TItem> {
  /**
   * The underlying sub-library being managed.
   */
  private readonly _library: SubLibraryBase<TCompositeId, TBaseId, TItem>;

  /**
   * Creates a new CollectionManager.
   * @param library - The sub-library to manage
   */
  public constructor(library: SubLibraryBase<TCompositeId, TBaseId, TItem>) {
    this._library = library;
  }

  /**
   * Get all collections in the library.
   */
  public getAll(): ReadonlyArray<[SourceId, IEditableCollection<TItem, TBaseId, TCompositeId>]> {
    const result: [SourceId, IEditableCollection<TItem, TBaseId, TCompositeId>][] = [];
    for (const [collectionId, collection] of this._library.collections.entries()) {
      result.push([collectionId, new EditableCollection(collection, this._library)]);
    }
    return result;
  }

  /**
   * Get a specific collection by ID.
   */
  public get(collectionId: SourceId): Result<IEditableCollection<TItem, TBaseId, TCompositeId>> {
    const collection = this._library.collections.get(collectionId);
    if (collection === undefined) {
      return fail(`Collection "${collectionId}" not found`);
    }
    return succeed(new EditableCollection(collection, this._library));
  }

  /**
   * Create a new mutable collection.
   */
  public create(collectionId: SourceId, metadata: ICollectionSourceMetadata): Result<void> {
    // Check if collection already exists
    if (this._library.collections.has(collectionId)) {
      return fail(`Collection "${collectionId}" already exists`);
    }

    // Validate metadata
    return this._validateMetadata(metadata)
      .onSuccess(() => {
        // Create empty collection entry
        this._library.addCollectionEntry({
          id: collectionId,
          isMutable: true,
          metadata,
          items: {}
        });
        return succeed(undefined);
      });
  }

  /**
   * Delete a mutable collection.
   */
  public delete(collectionId: SourceId): Result<void> {
    // Delegate to protected method
    return this._library.removeCollection(collectionId);
  }

  /**
   * Update collection metadata.
   */
  public updateMetadata(
    collectionId: SourceId,
    metadata: Partial<ICollectionSourceMetadata>
  ): Result<void> {
    // Delegate to protected method
    return this._library.updateCollectionMetadata(collectionId, metadata);
  }

  /**
   * Check if a collection exists.
   */
  public exists(collectionId: SourceId): boolean {
    return this._library.collections.has(collectionId);
  }

  /**
   * Check if a collection is mutable.
   */
  public isMutable(collectionId: SourceId): Result<boolean> {
    const collection = this._library.collections.get(collectionId);
    if (collection === undefined) {
      return fail(`Collection "${collectionId}" not found`);
    }
    return succeed(collection.isMutable);
  }

  /**
   * Validate collection metadata for creation.
   */
  private _validateMetadata(metadata: ICollectionSourceMetadata): Result<void> {
    const aggregator = new MessageAggregator();

    // Validate name
    if (!metadata.name || metadata.name.trim() === '') {
      aggregator.addMessage('Collection name cannot be empty');
    } else if (metadata.name.length > 200) {
      aggregator.addMessage('Collection name exceeds 200 characters');
    } else if (metadata.name !== metadata.name.trim()) {
      aggregator.addMessage('Collection name cannot have leading or trailing whitespace');
    }

    // Validate description if provided
    if (metadata.description && metadata.description.length > 2000) {
      aggregator.addMessage('Collection description exceeds 2000 characters');
    }

    // Validate format
    if (metadata.format !== 'yaml' && metadata.format !== 'json') {
      aggregator.addMessage('Collection format must be "yaml" or "json"');
    }

    // Validate version if provided
    if (metadata.version) {
      const semverPattern = /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*)?$/;
      if (!semverPattern.test(metadata.version)) {
        aggregator.addMessage('Collection version must be a valid semver string');
      }
    }

    if (aggregator.hasMessages) {
      return fail(`Invalid metadata: ${aggregator.toString('; ')}`);
    }

    return succeed(undefined);
  }
}
```

### 3.2 Protected Method Access

**Key Design Point:** `CollectionManager` needs to call protected methods on `SubLibraryBase`.

**Options:**

1. **Make SubLibraryBase methods public** - Not ideal, exposes internals
2. **Friend class pattern** - TypeScript doesn't support this directly
3. **Make CollectionManager a protected inner class** - Complex, not idiomatic
4. **Cast to access protected methods** - Type-unsafe hack
5. **Add public methods that delegate** - Extra layer, but clean

**Selected Approach:** **Protected methods that CollectionManager can call**

Since `CollectionManager` instantiation will happen within the library context (through `EditorContext` or similar), we can structure it so that the CollectionManager receives the library instance and TypeScript allows access to protected members within the same module.

**However**, TypeScript protected members are only accessible from subclasses, not external classes.

**Revised Solution:** Make the methods `public` but document them as "for internal use by CollectionManager" OR make them part of a separate internal interface.

**Best Solution:** Create an internal interface that SubLibraryBase implements:

```typescript
/**
 * Internal interface for collection manipulation.
 * @internal
 */
export interface ICollectionManipulator<TBaseId extends string, TItem> {
  removeCollection(collectionId: SourceId): Result<void>;
  updateCollectionMetadata(collectionId: SourceId, metadata: Partial<ICollectionSourceMetadata>): Result<void>;
}
```

Then SubLibraryBase implements this interface, and CollectionManager accepts it:

```typescript
export class CollectionManager<TCompositeId extends string, TBaseId extends string, TItem> {
  private readonly _library: SubLibraryBase<TCompositeId, TBaseId, TItem> & ICollectionManipulator<TBaseId, TItem>;

  constructor(library: SubLibraryBase<TCompositeId, TBaseId, TItem> & ICollectionManipulator<TBaseId, TItem>) {
    this._library = library;
  }
}
```

**Final Decision:** Keep methods protected and make CollectionManager a public class that can be instantiated with a SubLibraryBase. TypeScript will allow calling protected methods if CollectionManager is in the same packlet or if we use type assertions.

**Simplest Solution:** Make the methods **public but marked as `@internal`** in JSDoc. This is the approach used by many TypeScript libraries including ts-utils.

---

## 4. Validation Strategy

### 4.1 Validation Layers

**Layer 1: SourceId Validation**

- Use existing `Converters.sourceId` from common packlet
- Validates format (alphanumeric, hyphens, underscores)
- Handled by CollectionManager.create()

**Layer 2: Metadata Validation**

- Validate name (required, ≤ 200 chars, no leading/trailing whitespace)
- Validate description (optional, ≤ 2000 chars)
- Validate format (must be 'yaml' or 'json')
- Validate version (optional, semver pattern)
- Handled by private `_validateMetadata()` method

**Layer 3: Mutability Validation**

- Check collection exists
- Check collection is mutable before delete/update
- Handled by SubLibraryBase protected methods

**Layer 4: Uniqueness Validation**

- Check collection ID doesn't already exist (create)
- Handled by CollectionManager.create()

### 4.2 Error Messages

All error messages follow the pattern from requirements:

```typescript
// Collection not found
fail(`Collection "${collectionId}" not found`)

// Collection already exists
fail(`Collection "${collectionId}" already exists`)

// Immutable collection
fail(`Cannot delete immutable collection "${collectionId}"`)
fail(`Cannot rename immutable collection "${collectionId}"`)

// Invalid metadata
fail(`Invalid metadata: ${details}`)
```

---

## 5. Type Safety Considerations

### 5.1 Generic Type Flow

```
CollectionManager<IngredientId, BaseIngredientId, Ingredient>
    ↓
SubLibraryBase<IngredientId, BaseIngredientId, Ingredient>
    ↓
IEditableCollection<Ingredient, BaseIngredientId, IngredientId>
```

All type parameters flow through consistently, maintaining type safety.

### 5.2 SourceId Usage

- Collection IDs are always `SourceId` branded type
- Validated using `Converters.sourceId`
- Type-safe at compile time

### 5.3 No `any` Types

- All operations properly typed
- Use `unknown` with assertions where necessary
- Type guards for runtime checks

---

## 6. Integration Points

### 6.1 With SubLibraryBase

**Existing Public API:**
- `collections: ReadonlyMap<SourceId, CollectionEntry>` - Read access to collections
- `addCollectionEntry(entry)` - Add new collection

**New Public API (marked @internal):**
- `removeCollection(collectionId)` - Remove collection
- `updateCollectionMetadata(collectionId, metadata)` - Update metadata

### 6.2 With EditableCollection

`EditableCollection` already provides entity-level operations. `CollectionManager` provides collection-level operations. They work together but are independent.

### 6.3 With EditorContext

`EditorContext` will be extended to provide access to `CollectionManager`:

```typescript
export interface IEditorContext<T, TBaseId extends string, TCompositeId extends string> {
  // ... existing methods ...

  /**
   * Collection manager for collection-level operations.
   */
  readonly collectionManager: ICollectionManager<TCompositeId, TBaseId, T>;
}
```

---

## 7. Testing Strategy

### 7.1 Unit Tests for SubLibraryBase Methods

**File:** `libraries/ts-chocolate/src/packlets/library-data/__tests__/subLibrary.test.ts` (extend existing)

Test cases:
- `removeCollection` - success, not found, immutable collection
- `updateCollectionMetadata` - success, not found, immutable collection, invalid metadata
- `_validateMetadataUpdate` - all validation rules

### 7.2 Unit Tests for CollectionManager

**File:** `libraries/ts-chocolate/src/packlets/editing/__tests__/collectionManager.test.ts` (NEW)

Test cases:
- `create` - success, duplicate ID, invalid metadata
- `delete` - success, not found, immutable collection
- `updateMetadata` - success, not found, immutable collection, invalid metadata
- `get` - success, not found
- `getAll` - returns all collections
- `exists` - true/false cases
- `isMutable` - true/false cases, not found

### 7.3 Integration Tests

**File:** `libraries/ts-chocolate/src/packlets/editing/__tests__/collectionManager.integration.test.ts` (NEW)

Test scenarios:
- Create collection → Add entities → Export → Delete
- Create collection → Update metadata → Export
- Multiple collections lifecycle
- Immutability protection across operations

### 7.4 Coverage Goals

- 100% statement coverage
- 100% branch coverage
- All error paths tested
- All validation rules tested

---

## 8. Implementation Sequence

### Step 1: SubLibraryBase Extensions
1. Add `removeCollection()` protected method
2. Add `updateCollectionMetadata()` protected method
3. Add `_validateMetadataUpdate()` private helper
4. Unit tests for new methods

### Step 2: ICollectionManager Interface
1. Add interface to `model.ts`
2. Export from editing packlet

### Step 3: CollectionManager Implementation
1. Create `collectionManager.ts`
2. Implement all ICollectionManager methods
3. Add validation helpers
4. Unit tests for CollectionManager

### Step 4: Integration
1. Extend EditorContext to include collectionManager
2. Integration tests
3. Documentation updates

### Step 5: API Documentation
1. Generate API documentation with API Extractor
2. Update TSDoc comments
3. Create usage examples

---

## 9. File Structure

```
libraries/ts-chocolate/src/packlets/
├── library-data/
│   ├── subLibrary.ts                          # MODIFIED - add protected methods
│   └── __tests__/
│       └── subLibrary.test.ts                  # MODIFIED - add tests
│
├── editing/
│   ├── model.ts                                # MODIFIED - add ICollectionManager
│   ├── collectionManager.ts                    # NEW - implementation
│   ├── index.ts                                # MODIFIED - export new types
│   └── __tests__/
│       ├── collectionManager.test.ts           # NEW - unit tests
│       └── collectionManager.integration.test.ts # NEW - integration tests
```

---

## 10. Dependencies

### From Phase 1
- `IEditableCollection` interface
- `EditableCollection` implementation
- `ICollectionSourceMetadata` type
- `SourceId` branded type

### From ts-utils
- `Result`, `succeed`, `fail`
- `MessageAggregator`
- `recordFromEntries`

### From common packlet
- `Converters.sourceId`
- `SourceId` type

---

## 11. Risk Mitigation

### Risk 1: Breaking SubLibraryBase Abstraction

**Mitigation:**
- Use protected/internal methods
- Maintain existing public API unchanged
- Comprehensive tests ensure no regressions

### Risk 2: Collection Map Consistency

**Mitigation:**
- Validate before modifying
- Use atomic operations where possible
- Test concurrent operation scenarios

### Risk 3: Type Complexity

**Mitigation:**
- Clear documentation with type examples
- Integration tests demonstrate usage
- Generic constraints match existing patterns

---

## 12. Performance Considerations

### Operations Complexity
- `create`: O(1) - Direct map insertion
- `delete`: O(1) - Direct map deletion
- `updateMetadata`: O(n) where n = items in collection (requires copy)
- `get`: O(1) - Direct map lookup
- `getAll`: O(n) where n = number of collections
- `exists`: O(1) - Map has() check
- `isMutable`: O(1) - Map get() and property access

### Memory Usage
- CollectionManager: Minimal overhead (single reference to library)
- Metadata updates: Temporary allocation during copy operation
- No collection data duplication

---

## 13. Success Criteria

Phase 3 implementation is complete when:

1. ✅ SubLibraryBase has `removeCollection` and `updateCollectionMetadata` methods
2. ✅ ICollectionManager interface defined and exported
3. ✅ CollectionManager class implemented with all methods
4. ✅ All validation rules working correctly
5. ✅ Immutability protection functioning
6. ✅ 100% test coverage achieved
7. ✅ All tests passing
8. ✅ API documentation generated
9. ✅ Integration with EditorContext verified
10. ✅ No regressions in existing functionality

---

## 14. Next Steps

After technical design approval:

1. **Implementation** - Code-monkey implements SubLibraryBase extensions and CollectionManager
2. **Testing** - SDET-functional creates comprehensive test suite
3. **Review** - Code-reviewer validates implementation
4. **Documentation** - Generate API docs with API Extractor
5. **Integration** - Extend EditorContext to expose CollectionManager

**Estimated Effort:** 2 days for implementation + testing

---

## Appendix A: Type Definitions Reference

### SubLibraryCollectionEntry

```typescript
export type SubLibraryCollectionEntry<TBaseId extends string, TItem> =
  Collections.AggregatedResultMapEntry<SourceId, TBaseId, TItem>;

// Which expands to:
interface AggregatedResultMapEntry<TCollectionId, TBaseId, TItem> {
  readonly id: TCollectionId;
  readonly isMutable: boolean;
  readonly metadata?: ICollectionSourceMetadata;
  readonly items: ValidatingResultMap<TBaseId, TItem>;
}
```

### ICollectionSourceMetadata

```typescript
export interface ICollectionSourceMetadata {
  readonly name: string;
  readonly description?: string;
  readonly format: 'yaml' | 'json';
  readonly version?: string;
  // ... other metadata fields
}
```

### SourceId

```typescript
export type SourceId = string & { readonly _brand: 'SourceId' };
```

---

## Appendix B: Alternative Designs Considered

### Alternative 1: Direct Collection Mutation

**Approach:** Modify collection entries in-place without remove/re-add.

**Rejected Because:**
- ValidatingResultMap is designed to be immutable
- Would require significant changes to core library infrastructure
- Higher risk of breaking existing functionality

### Alternative 2: Collection Wrapper with Mutation Methods

**Approach:** Create a MutableCollection wrapper with delete/update methods.

**Rejected Because:**
- Adds another layer of abstraction
- Complicates the API
- Doesn't align with existing SubLibraryBase patterns

### Alternative 3: CollectionManager as Subclass

**Approach:** Make CollectionManager extend SubLibraryBase.

**Rejected Because:**
- Inheritance for code reuse is an anti-pattern
- CollectionManager is a manager, not a library
- Composition is cleaner and more flexible

---

## Conclusion

This design provides a clean, type-safe implementation of collection-level CRUD operations that integrates seamlessly with the existing editing framework. The use of protected methods on SubLibraryBase maintains encapsulation while allowing CollectionManager to provide a public API for collection management.

The design is generic enough to work with any SubLibraryBase-derived library (ingredients, recipes, etc.) and follows all established patterns from the ts-chocolate codebase including the Result pattern, proper validation, and 100% test coverage.
