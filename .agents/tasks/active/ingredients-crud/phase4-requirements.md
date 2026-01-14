# Phase 4: Advanced Editing Features - Requirements

**Date:** 2026-01-13
**Status:** In Progress
**Dependencies:** Phases 1-3 Complete

---

## Overview

Phase 4 builds on the collection management foundation from Phase 3 to add advanced editing capabilities including state management, batch operations, undo/redo functionality, and collection cloning. These features are library-level enhancements in `ts-chocolate` that will later be exposed through React UI.

---

## Goals

1. **Editable Collection Wrapper** - Add editing state and advanced operations to collections
2. **Batch Operations** - Enable multi-entity operations with rollback
3. **Undo/Redo** - Provide reversible operations using command pattern
4. **Collection Cloning** - Deep copy collections with new IDs
5. **Export/Import Integration** - Collection-level data persistence

---

## Requirements

### 1. EditableCollection Wrapper

**Purpose:** Wrap CollectionManager to add editing state and advanced operations.

**Functional Requirements:**
- FR-4.1.1: Wrap an existing collection for editing
- FR-4.1.2: Track dirty state (has unsaved changes)
- FR-4.1.3: Expose all CollectionManager operations
- FR-4.1.4: Add batch operation support
- FR-4.1.5: Add undo/redo support
- FR-4.1.6: Provide change summary for user display

**Non-Functional Requirements:**
- NFR-4.1.1: Maintain immutability of underlying collections
- NFR-4.1.2: Type-safe with no `any` types
- NFR-4.1.3: Result pattern for all fallible operations
- NFR-4.1.4: 100% test coverage

### 2. Batch Operations

**Purpose:** Enable atomic multi-entity operations with rollback on failure.

**Functional Requirements:**
- FR-4.2.1: Execute multiple operations as single batch
- FR-4.2.2: Rollback all operations if any fail
- FR-4.2.3: Provide batch operation results summary
- FR-4.2.4: Support batching of: set, remove operations
- FR-4.2.5: Batch operations are undoable as single unit

**Non-Functional Requirements:**
- NFR-4.2.1: Atomic operation semantics (all or nothing)
- NFR-4.2.2: No partial state if batch fails
- NFR-4.2.3: Performance: O(n) for n operations
- NFR-4.2.4: Memory efficient (no unnecessary copies)

**Example Use Cases:**
- Import multiple ingredients at once
- Delete multiple ingredients with single undo
- Update multiple ingredients in one operation

### 3. Undo/Redo Functionality

**Purpose:** Allow users to reverse and reapply editing operations.

**Functional Requirements:**
- FR-4.3.1: Undo last operation(s)
- FR-4.3.2: Redo undone operation(s)
- FR-4.3.3: Support undo/redo for: set, remove, batch operations
- FR-4.3.4: Maintain undo history with configurable limit
- FR-4.3.5: Clear undo history when appropriate
- FR-4.3.6: Query: can undo? can redo?
- FR-4.3.7: Provide operation descriptions for UI display

**Non-Functional Requirements:**
- NFR-4.3.1: Command pattern for operation encapsulation
- NFR-4.3.2: Memory efficient (limit history size)
- NFR-4.3.3: Operations must be reversible
- NFR-4.3.4: Default history limit: 50 operations
- NFR-4.3.5: Clear history does not affect current state

**Design Constraints:**
- Use command pattern for all undoable operations
- Commands must store both forward and reverse operations
- Undo history is per-collection (not global)
- Redo history cleared when new operation performed

### 4. Collection Cloning

**Purpose:** Create deep copies of collections with new IDs for customization.

**Functional Requirements:**
- FR-4.4.1: Clone entire collection with new SourceId
- FR-4.4.2: Generate new IDs for all items in cloned collection
- FR-4.4.3: Preserve all item data (except IDs)
- FR-4.4.4: Update collection metadata for clone
- FR-4.4.5: Maintain relationships within cloned collection
- FR-4.4.6: Mark cloned collection as mutable

**Non-Functional Requirements:**
- NFR-4.4.1: Deep copy (no shared references)
- NFR-4.4.2: ID generation ensures uniqueness
- NFR-4.4.3: Preserve data fidelity
- NFR-4.4.4: Result pattern for error handling

**ID Generation Strategy:**
- New SourceId: Append suffix like "-copy", "-copy-2", etc.
- New item IDs: Regenerate from names with uniqueness check
- Update any internal references to maintain consistency

### 5. Export/Import Integration

**Purpose:** Extend existing export/import to work at collection level.

**Functional Requirements:**
- FR-4.5.1: Export entire collection to YAML/JSON
- FR-4.5.2: Import collection from YAML/JSON
- FR-4.5.3: Support replace vs. create new on import
- FR-4.5.4: Validate imported data structure
- FR-4.5.5: Report validation errors clearly

**Non-Functional Requirements:**
- NFR-4.5.1: Use existing exportImport utilities from Phase 1
- NFR-4.5.2: Preserve ICollectionSourceFile structure
- NFR-4.5.3: Handle format errors gracefully
- NFR-4.5.4: Validation before any mutation

**Import Options:**
- Replace existing collection (if mutable)
- Create new collection from import
- Validate-only mode (no changes)

---

## API Design

### EditableCollection Interface

```typescript
export interface IEditableCollection<TCompositeId, TBaseId, TItem> {
  // State
  readonly isDirty: boolean;
  readonly canUndo: boolean;
  readonly canRedo: boolean;

  // Collection Manager operations (pass-through)
  getAll(): ReadonlyArray<SourceId>;
  get(collectionId: SourceId): Result<ICollectionSourceMetadata>;
  create(collectionId: SourceId, metadata: ICollectionSourceMetadata): Result<void>;
  delete(collectionId: SourceId): Result<void>;
  updateMetadata(collectionId: SourceId, metadata: Partial<ICollectionSourceMetadata>): Result<void>;
  exists(collectionId: SourceId): boolean;
  isMutable(collectionId: SourceId): Result<boolean>;

  // Entity operations
  setEntity(collectionId: SourceId, id: TCompositeId, entity: TItem): Result<void>;
  removeEntity(collectionId: SourceId, id: TCompositeId): Result<void>;
  getEntity(collectionId: SourceId, id: TCompositeId): Result<TItem>;

  // Batch operations
  executeBatch(operations: Array<IBatchOperation<TCompositeId, TItem>>): Result<void>;

  // Undo/Redo
  undo(): Result<string>; // Returns description of undone operation
  redo(): Result<string>; // Returns description of redone operation
  clearHistory(): void;

  // Cloning
  cloneCollection(sourceId: SourceId, newId: SourceId, metadata: Partial<ICollectionSourceMetadata>): Result<void>;

  // Export/Import
  exportCollection(collectionId: SourceId, format: 'yaml' | 'json'): Result<string>;
  importCollection(data: string, options: IImportOptions): Result<void>;

  // Change tracking
  getChangeSummary(): IChangeSummary;
  resetDirtyState(): void;
}
```

### Command Pattern Types

```typescript
export interface ICommand<TCompositeId, TItem> {
  execute(): Result<void>;
  undo(): Result<void>;
  getDescription(): string;
}

export interface IBatchOperation<TCompositeId, TItem> {
  type: 'set' | 'remove';
  collectionId: SourceId;
  id: TCompositeId;
  entity?: TItem; // Required for 'set', undefined for 'remove'
}

export interface IChangeSummary {
  operationCount: number;
  affectedCollections: ReadonlyArray<SourceId>;
  canUndo: boolean;
  canRedo: boolean;
}

export interface IImportOptions {
  mode: 'replace' | 'create-new';
  newCollectionId?: SourceId; // Required if mode is 'create-new'
  validate?: boolean; // Default: true
}
```

---

## Technical Constraints

1. **Immutability Preservation**
   - Must not mutate underlying collections directly
   - All changes through proper mutation APIs

2. **Type Safety**
   - No `any` types
   - Proper branded types for IDs
   - Result pattern for all fallible operations

3. **Memory Management**
   - Undo history limited to 50 operations
   - Batch operations don't duplicate entities unnecessarily
   - Clone operations create proper deep copies

4. **Error Handling**
   - All operations return Result<T>
   - Detailed error messages with context
   - MessageAggregator for validation errors

---

## Testing Requirements

### Unit Tests
- EditableCollection wrapper: 100% coverage
- Batch operations: All success/failure scenarios
- Undo/redo: Full history management
- Cloning: ID generation, deep copy verification
- Export/import: Format handling, validation

### Integration Tests
- Batch operations with undo/redo
- Clone and modify workflow
- Import with validation errors
- Multi-collection operations

### Edge Cases
- Empty collections
- Maximum undo history
- Failed batch operations (rollback)
- Invalid import data
- ID collision scenarios

---

## Exit Criteria

- ✅ EditableCollection implemented with all features
- ✅ Batch operations working with rollback
- ✅ Undo/redo functional with command pattern
- ⏸️ Collection cloning with proper ID generation (DEFERRED)
- ✅ Export/import integrated at collection level
- ✅ 100% test coverage
- ✅ No `any` types
- ✅ Result pattern throughout
- ✅ API documentation complete
- ⏳ Code review approved

---

## Non-Goals (Deferred to Later Phases)

- Collection cloning (deferred from Phase 4 - implement when needed for UI)
- UI components (Phase 5)
- React integration (Phase 4 of execution plan)
- Recipe integration warnings (Phase 9)
- Backend persistence (out of scope)
- Real-time collaboration features

---

## Success Metrics

1. **Code Quality:**
   - 100% test coverage
   - Zero type safety violations
   - Full Result pattern compliance
   - Comprehensive API documentation

2. **Functionality:**
   - All undo/redo scenarios working
   - Batch operations atomic
   - Cloning produces valid collections
   - Import/export roundtrip successful

3. **Performance:**
   - Batch operations O(n)
   - Undo/redo O(1)
   - Clone operations reasonable for 100+ items
   - Memory usage within limits

---

## Timeline Estimate

- EditableCollection wrapper: 1 day
- Batch operations: 1 day
- Undo/redo: 1-2 days
- Collection cloning: 0.5 days
- Export/import integration: 0.5 days
- Testing and documentation: 1 day

**Total: 5-6 days**

---

## Next Steps

1. Create technical design document
2. Implement command pattern infrastructure
3. Implement EditableCollection wrapper
4. Add batch operations
5. Add undo/redo functionality
6. Implement cloning
7. Integrate export/import
8. Comprehensive testing
