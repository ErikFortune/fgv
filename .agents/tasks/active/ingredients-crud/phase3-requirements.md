# Phase 3: Collection Management - Requirements

**Date:** 2026-01-13
**Status:** Requirements Analysis
**Phase:** 3 of 10

---

## Overview

Phase 3 extends the editing framework to support CRUD operations on collections themselves, not just the entities within collections. This enables users to create new mutable collections, delete collections, and rename collection metadata.

## Context from Previous Phases

### Phase 1 (Complete): Core Editing Framework
- `IEditableCollection<T>` interface provides collection metadata and export capabilities
- `IEditorContext<T>` provides entity-level CRUD operations within a collection
- Validation, export/import utilities are operational

### Phase 2 (Complete): Ingredient Specialization
- `IngredientEditor` extends `EditorContext` for ingredient-specific editing
- Ingredient validation and auto-generation working
- All ingredient entity operations functional

### Existing Infrastructure
- `SubLibraryBase` class manages collections in a library
- Collections have `SourceId`, metadata (`ICollectionSourceMetadata`), and mutable flag
- `SubLibraryBase.addCollectionEntry()` adds collections programmatically
- No existing public API for collection CRUD operations

---

## Functional Requirements

### FR-1: Create New Mutable Collection

**Description:** Users must be able to create new empty mutable collections within a sub-library.

**Behavior:**
- Create a new collection with a unique `SourceId`
- Initialize with provided metadata (name, description)
- Collection starts empty (no entities)
- Collection is marked as mutable (`isMutable: true`)
- Collection is immediately available for entity editing

**Inputs:**
- `collectionId: SourceId` - Unique identifier for the collection
- `metadata: ICollectionSourceMetadata` - Name, description, and other metadata
- Optional: Template collection to copy metadata from

**Outputs:**
- Success: Collection created and added to library
- Failure: Collection ID collision, invalid metadata

**Validation Rules:**
- Collection ID must be unique within the library
- Collection ID must be valid `SourceId` format (alphanumeric, hyphens, underscores)
- Name must not be empty
- Name must be ≤ 200 characters

---

### FR-2: Delete Mutable Collection

**Description:** Users must be able to delete mutable collections they have created.

**Behavior:**
- Remove collection from the library
- All entities within the collection are deleted
- Operation cannot be undone (should warn user)
- Only mutable collections can be deleted
- Immutable (built-in) collections are protected

**Inputs:**
- `collectionId: SourceId` - Collection to delete

**Outputs:**
- Success: Collection removed from library
- Failure: Collection not found, collection is immutable, collection in use

**Validation Rules:**
- Collection must exist
- Collection must be mutable (`isMutable: true`)
- Collection should not be in use by recipes (warning, not blocker)

---

### FR-3: Rename Collection (Metadata Update)

**Description:** Users must be able to update collection metadata (name, description).

**Behavior:**
- Update collection's `ICollectionSourceMetadata`
- Collection ID (`SourceId`) remains unchanged
- Only mutable collections can be renamed
- Changes are immediate and in-memory

**Inputs:**
- `collectionId: SourceId` - Collection to update
- `metadata: Partial<ICollectionSourceMetadata>` - Fields to update

**Outputs:**
- Success: Metadata updated
- Failure: Collection not found, collection is immutable, invalid metadata

**Validation Rules:**
- Collection must exist
- Collection must be mutable
- New name must not be empty (if provided)
- New name must be ≤ 200 characters (if provided)

---

### FR-4: Collection Lifecycle Management

**Description:** Collections have a lifecycle from creation through deletion, with state management.

**Behavior:**
- Collections exist in memory within the runtime library
- Collections can be exported to files (YAML/JSON) for persistence
- Collections can be imported from files to create/replace collections
- Unsaved changes are tracked at collection level (entities modified)
- Deleting a collection with unsaved changes should warn user

**State Tracking:**
- Created: New empty collection
- Modified: Collection metadata or entities changed
- Exported: Collection saved to file
- Deleted: Collection removed from library

---

### FR-5: Integration with Runtime Context

**Description:** Collection operations must integrate with existing `SubLibraryBase` infrastructure.

**Behavior:**
- Operations are methods on `SubLibraryBase` or a new `CollectionManager` class
- Operations modify the in-memory collection structure
- Operations respect the existing collection map (`ValidatingResultMap`)
- Operations work with any sub-library type (ingredients, recipes, etc.)

**Integration Points:**
- `SubLibraryBase.collections` - Read-only map of collections
- `SubLibraryBase.addCollectionEntry()` - Add new collections
- Collection removal requires new protected method
- Metadata update requires new protected method or collection interface extension

---

## API Design

### CollectionManager Interface

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

### SubLibraryBase Extension

```typescript
/**
 * Extended methods for SubLibraryBase to support collection management.
 */
export abstract class SubLibraryBase<
  TCompositeId extends string,
  TBaseId extends string,
  TItem
> {
  // ... existing methods ...

  /**
   * Remove a collection from the library.
   * Protected method for use by CollectionManager.
   *
   * @param collectionId - Collection to remove
   * @returns Result indicating success or failure
   */
  protected removeCollection(collectionId: SourceId): Result<void>;

  /**
   * Update collection metadata.
   * Protected method for use by CollectionManager.
   *
   * @param collectionId - Collection to update
   * @param metadata - Partial metadata to update
   * @returns Result indicating success or failure
   */
  protected updateCollectionMetadata(
    collectionId: SourceId,
    metadata: Partial<ICollectionSourceMetadata>
  ): Result<void>;
}
```

---

## Validation Rules

### Collection ID Validation
- **Format**: Must match `SourceId` format (see `Converters.sourceId`)
- **Uniqueness**: Must not collide with existing collections
- **Reserved**: Cannot use reserved names (if any)

### Collection Metadata Validation
- **name**:
  - Required (cannot be empty string)
  - Maximum 200 characters
  - No leading/trailing whitespace
- **description**:
  - Optional
  - Maximum 2000 characters if provided
- **format**:
  - Must be 'yaml' or 'json'
- **version**:
  - Optional semver string
  - Validated with regex if provided

### Mutability Validation
- **Create**: Always creates mutable collections
- **Delete**: Can only delete mutable collections
- **Rename**: Can only rename mutable collections
- **Immutable Protection**: Operations on immutable collections return `fail()` with clear message

---

## Error Scenarios and Handling

### Collection Create Errors

| Error Scenario | Error Message | HTTP Analogy |
|---------------|---------------|--------------|
| Collection ID already exists | `Collection "${id}" already exists` | 409 Conflict |
| Invalid collection ID format | `Invalid collection ID: ${details}` | 400 Bad Request |
| Invalid metadata (name empty) | `Collection name cannot be empty` | 400 Bad Request |
| Invalid metadata (name too long) | `Collection name exceeds 200 characters` | 400 Bad Request |

### Collection Delete Errors

| Error Scenario | Error Message | HTTP Analogy |
|---------------|---------------|--------------|
| Collection not found | `Collection "${id}" not found` | 404 Not Found |
| Collection is immutable | `Cannot delete immutable collection "${id}"` | 403 Forbidden |
| Collection in use (warning) | `Warning: Collection "${id}" is used by ${count} recipes` | N/A (warning) |

### Collection Rename Errors

| Error Scenario | Error Message | HTTP Analogy |
|---------------|---------------|--------------|
| Collection not found | `Collection "${id}" not found` | 404 Not Found |
| Collection is immutable | `Cannot rename immutable collection "${id}"` | 403 Forbidden |
| Invalid metadata | `Invalid metadata: ${details}` | 400 Bad Request |

---

## Integration Points

### With SubLibraryBase
- **Collection Access**: Via `collections` property (ReadonlyMap)
- **Collection Addition**: Via `addCollectionEntry()` method
- **Collection Removal**: NEW protected method `removeCollection()`
- **Metadata Update**: NEW protected method `updateCollectionMetadata()`

### With EditorContext
- **Entity Operations**: Existing `IEditorContext` methods work with collection entities
- **Unsaved Changes**: Tracked at entity level, bubbles up to collection level
- **Export/Import**: Existing utilities export/import collections

### With ChocolateLibrary (Future - Phase 4)
- **Access Point**: `ChocolateContext.editing.collectionManager`
- **Sub-Library Integration**: Works with any sub-library (ingredients, recipes)
- **React Hooks**: `useCollectionManager` hook for UI integration

---

## Testing Strategy

### Unit Tests

**CollectionManager Tests:**
- Create new collection (success)
- Create with duplicate ID (failure)
- Create with invalid metadata (failure)
- Delete mutable collection (success)
- Delete immutable collection (failure)
- Delete non-existent collection (failure)
- Rename mutable collection (success)
- Rename immutable collection (failure)
- Get/exists/isMutable operations

**SubLibraryBase Extension Tests:**
- Protected methods work correctly
- Immutability enforcement
- Collection map consistency after operations
- Multiple operations in sequence

### Integration Tests

**Multi-Collection Scenarios:**
- Create multiple collections
- Delete some collections
- Rename remaining collections
- Export/import collections
- Collection operations with entity operations

**Lifecycle Tests:**
- Create → Add entities → Export → Delete
- Import → Rename → Add entities → Export
- Create → Delete immediately (empty collection)

### Edge Cases

**Boundary Conditions:**
- Collection name at exactly 200 characters
- Collection name with special characters
- Metadata with all optional fields empty
- Deleting last mutable collection
- Creating collection with same ID as deleted collection

**Error Conditions:**
- Operations on non-existent collections
- Operations on immutable collections
- Simultaneous operations (if concurrency possible)
- Invalid SourceId formats

---

## Implementation Considerations

### Protected Methods on SubLibraryBase

The `SubLibraryBase` class will need new protected methods:
- `removeCollection(collectionId)` - Removes entry from internal collections map
- `updateCollectionMetadata(collectionId, metadata)` - Updates metadata in existing collection

These methods should:
- Validate collection exists
- Validate collection is mutable
- Perform the operation on the internal `ValidatingResultMap`
- Return `Result<void>` for consistency

### CollectionManager Implementation

A new `CollectionManager` class will:
- Wrap a `SubLibraryBase` instance
- Implement `ICollectionManager` interface
- Delegate to protected methods on `SubLibraryBase`
- Provide validation and error handling

Location: `libraries/ts-chocolate/src/packlets/editing/collectionManager.ts`

### IEditableCollection Updates

The existing `IEditableCollection` interface already has:
- `updateMetadata(metadata: Partial<ICollectionSourceMetadata>)` method
- This can be used by `CollectionManager` for metadata updates

---

## Non-Functional Requirements

### Performance
- Collection operations should be O(1) or O(log n) where possible
- Creating/deleting collections should not require library rebuilding
- Metadata updates should be instant (in-memory)

### Error Messages
- Clear, actionable error messages
- Include collection ID in all error messages
- Distinguish between "not found" and "immutable" errors

### Type Safety
- No `any` types
- Result pattern throughout
- Branded types for `SourceId`

### Testing
- 100% test coverage for all collection operations
- Coverage for all error scenarios
- Integration tests for multi-operation workflows

---

## Success Criteria

Phase 3 is complete when:

1. ✅ `ICollectionManager` interface defined
2. ✅ `CollectionManager` class implemented
3. ✅ `SubLibraryBase` protected methods added
4. ✅ All collection CRUD operations working
5. ✅ Immutable collections protected from modifications
6. ✅ All validation rules enforced
7. ✅ 100% test coverage achieved
8. ✅ Integration with runtime context verified
9. ✅ Documentation complete (API docs, TSDoc)
10. ✅ All tests passing

---

## Dependencies

**From Phase 1:**
- `IEditableCollection` interface
- `ICollectionSourceMetadata` types
- `SourceId` branded type
- Result pattern and utilities

**For Phase 4:**
- CollectionManager API will be exposed through ChocolateContext
- React hooks will consume CollectionManager operations
- UI components will trigger collection operations

---

## Risks and Mitigation

### Risk 1: Breaking SubLibraryBase Abstraction
**Impact:** Medium
**Mitigation:** Use protected methods, maintain existing public API, thorough testing

### Risk 2: Collection Map Consistency
**Impact:** High (data corruption)
**Mitigation:** Careful implementation of removeCollection(), validate before/after operations

### Risk 3: Generic Type Complexity
**Impact:** Low (developer experience)
**Mitigation:** Strong types, clear documentation, good examples

---

## Next Steps

1. **Requirements Review**: Get user approval for these requirements
2. **Technical Design**: Senior developer creates detailed design for implementation
3. **Implementation**: Code-monkey implements CollectionManager and SubLibraryBase extensions
4. **Testing**: SDET creates comprehensive test suite
5. **Documentation**: Generate API documentation

**Estimated Effort:** 2 days (per execution plan)
