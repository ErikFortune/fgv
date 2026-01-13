# Technical Design: Extensible Entity Editing Framework

**Date:** 2026-01-12
**Project:** chocolate-lab-web + ts-chocolate library
**Feature:** Generic editing infrastructure (starting with Ingredients CRUD)
**Status:** Design Phase

---

## Executive Summary

This design creates a **general-purpose, extensible editing framework** for all entity types in the chocolate library ecosystem. While the initial implementation focuses on ingredients CRUD, the architecture is designed to support recipes, fillings, molds, confections, procedures, tasks, and journals with minimal duplication.

### Key Design Principles

1. **Generic, Reusable Framework** - Core editing logic lives in ts-chocolate library
2. **Entity-Specific Specialization** - Each entity type specializes generic interfaces
3. **UI Component Reusability** - Shared UI components with entity-specific adapters
4. **Result Pattern Throughout** - All operations return Result<T>
5. **No Premature Optimization** - Simple, readable implementation first
6. **100% Test Coverage** - All code must be fully tested

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ ts-chocolate Library                                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Generic Editing Framework (NEW)                      │  │
│  │  - EditorContext<T>                                  │  │
│  │  - MutableCollection<T>                              │  │
│  │  - ValidationFramework                               │  │
│  │  - Export/Import (YAML/JSON)                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Entity-Specific Implementations (NEW)                │  │
│  │  - IngredientEditor                                  │  │
│  │  - FillingEditor (future)                            │  │
│  │  - RecipeEditor (future)                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ chocolate-lab-web Application                               │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Generic UI Components (NEW)                          │  │
│  │  - EntityEditor<T>                                   │  │
│  │  - CollectionManager                                 │  │
│  │  - FormField Components                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Entity-Specific UI (NEW)                             │  │
│  │  - IngredientForm                                    │  │
│  │  - IngredientFields                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 1: Library Layer Design (ts-chocolate)

### 1.1 Core Editing Framework

#### New Packlet: `packlets/editing/`

Create a new packlet in ts-chocolate that provides generic editing infrastructure.

```
libraries/ts-chocolate/src/packlets/editing/
├── model.ts                    # Core interfaces and types
├── mutableCollection.ts        # Mutable collection wrapper
├── editorContext.ts            # Editor session management
├── validation.ts               # Generic validation framework
├── exportImport.ts             # YAML/JSON export/import
├── converters.ts               # Generic converters
├── index.ts                    # Public API
└── __tests__/                  # 100% coverage tests
```

#### Core Interfaces (model.ts)

```typescript
/**
 * Generic editor context for entity collections
 * @typeParam T - Entity type (Ingredient, IFillingRecipe, etc.)
 * @typeParam TId - Entity ID type
 * @public
 */
export interface IEditorContext<T, TId extends string = string> {
  /** Get entity by ID */
  readonly get: (id: TId) => Result<T>;

  /** Get all entities in the collection */
  readonly getAll: () => ReadonlyArray<[TId, T]>;

  /** Create new entity */
  readonly create: (baseId: string, entity: T) => Result<TId>;

  /** Update existing entity */
  readonly update: (id: TId, entity: T) => Result<void>;

  /** Delete entity */
  readonly delete: (id: TId) => Result<void>;

  /** Copy entity to another collection */
  readonly copyTo: (id: TId, targetCollectionId: string) => Result<TId>;

  /** Check if entity exists */
  readonly exists: (id: TId) => boolean;

  /** Validate entity */
  readonly validate: (entity: Partial<T>) => Result<IValidationReport>;

  /** Check for unsaved changes */
  readonly hasUnsavedChanges: () => boolean;

  /** Clear unsaved changes flag */
  readonly clearUnsavedChanges: () => void;
}

/**
 * Validation report with detailed field-level errors
 * @public
 */
export interface IValidationReport {
  /** Overall validation result */
  readonly isValid: boolean;

  /** Field-level validation errors */
  readonly fieldErrors: ReadonlyMap<string, string>;

  /** General validation errors */
  readonly generalErrors: ReadonlyArray<string>;
}

/**
 * Mutable collection wrapper
 * Wraps an existing SubLibraryBase collection with mutation operations
 * @public
 */
export interface IMutableCollection<T, TId extends string = string> {
  /** Collection ID */
  readonly collectionId: string;

  /** Collection metadata */
  readonly metadata: ICollectionSourceMetadata;

  /** Whether collection is mutable */
  readonly isMutable: boolean;

  /** All items in the collection */
  readonly items: ReadonlyMap<string, T>;

  /** Add or update item */
  readonly set: (baseId: string, item: T) => Result<void>;

  /** Remove item */
  readonly remove: (baseId: string) => Result<void>;

  /** Update collection metadata */
  readonly updateMetadata: (metadata: Partial<ICollectionSourceMetadata>) => Result<void>;

  /** Export collection to YAML/JSON */
  readonly export: (format: 'yaml' | 'json') => Result<ICollectionSourceFile<T>>;
}

/**
 * Generic validator for entity fields
 * @public
 */
export interface IFieldValidator<T> {
  /** Field name */
  readonly fieldName: keyof T;

  /** Validate field value */
  readonly validate: (value: unknown, context?: Partial<T>) => Result<true>;

  /** Error message template */
  readonly errorMessage: string;
}

/**
 * Export/Import options
 * @public
 */
export interface IExportOptions {
  /** Output format */
  readonly format: 'yaml' | 'json';

  /** Pretty print (indentation) */
  readonly prettyPrint?: boolean;
}

export interface IImportOptions {
  /** How to handle existing collection with same ID */
  readonly onCollisionMode: 'replace' | 'create-new' | 'fail';

  /** New collection ID (if create-new mode) */
  readonly newCollectionId?: string;
}
```

### 1.2 Implementation Patterns

The implementation will follow these key patterns:

#### Mutable Collection Pattern
- Wraps existing collection data in mutable container
- Tracks changes in-memory until export
- Implements standard collection interface

#### Editor Context Pattern
- Manages CRUD operations for a collection
- Coordinates validation
- Tracks unsaved changes
- Type-safe ID management

#### Validation Pattern
- Field-level validators
- Cross-field validators
- Aggregated error reporting
- Reusable validator functions

#### Export/Import Pattern
- YAML/JSON serialization
- ICollectionSourceFile structure
- Format validation
- Error handling

---

## Part 2: Ingredient Specialization

### 2.1 Ingredient Editor

```
libraries/ts-chocolate/src/packlets/editing/ingredients/
├── ingredientEditor.ts         # Ingredient editor context
├── validators.ts               # Ingredient-specific validators
├── model.ts                    # Ingredient editing types
├── index.ts                    # Public API
└── __tests__/                  # 100% coverage tests
```

### 2.2 Ingredient Validators

Ingredient-specific validation rules:
- Name: Required, max 200 chars
- BaseId: Kebab-case, unique
- Category: Valid enum value
- GanacheCharacteristics: Percentages 0-100, sum ≤ 100
- Category-specific fields (chocolateType, cacaoPercentage, etc.)

### 2.3 Auto-generation Utilities

- BaseId from name (kebab-case)
- Unique ID generation (append counter if collision)
- Default values for optional fields

---

## Part 3: Application Layer Design

### 3.1 React Context Integration

Extend ChocolateContext with editing operations:

```typescript
export interface IChocolateContext {
  // ... existing properties ...

  /** Editing operations */
  readonly editing: {
    /** Create editor for ingredient collection */
    createIngredientEditor: (collectionId: string) => Result<IngredientEditor>;

    /** Create new mutable collection */
    createCollection: (params: ICreateCollectionParams) => Result<void>;

    /** Delete mutable collection */
    deleteCollection: (params: IDeleteCollectionParams) => Result<void>;

    /** Rename collection */
    renameCollection: (params: IRenameCollectionParams) => Result<void>;

    /** Export collection */
    exportCollection: (params: IExportParams) => Result<Blob>;

    /** Import collection */
    importCollection: (params: IImportParams) => Promise<Result<void>>;
  };
}
```

### 3.2 Generic UI Components

```
apps/chocolate-lab-web/src/components/editing/
├── EntityEditor.tsx            # Generic entity editor layout
├── CollectionManager.tsx       # Collection CRUD UI
├── FormField.tsx               # Generic form field component
├── ValidationMessage.tsx       # Validation error display
├── UnsavedChangesPrompt.tsx    # Navigation guard
├── ExportDialog.tsx            # Export format selection
├── ImportDialog.tsx            # Import file selection
├── types.ts                    # Shared types
└── index.ts                    # Public API
```

### 3.3 Ingredient-Specific UI

```
apps/chocolate-lab-web/src/tools/ingredients/editing/
├── IngredientEditView.tsx      # Main edit view
├── IngredientForm.tsx          # Ingredient form layout
├── IngredientFields.tsx        # Field components
├── GanacheCharacteristicsEditor.tsx  # Complex field editor
├── types.ts                    # Ingredient editing types
└── index.ts                    # Public API
```

---

## Part 4: Implementation Strategy

### Phase 1: Library Foundation (Week 1)
- Core editing framework interfaces
- MutableCollection implementation
- EditorContext implementation
- Export/import utilities
- 100% test coverage

### Phase 2: Ingredient Specialization (Week 1-2)
- IngredientEditor implementation
- Ingredient validators
- BaseId generation utilities
- 100% test coverage

### Phase 3: Collection Management (Week 2)
- Collection CRUD operations
- Collection manager integration
- Export/import at library level
- 100% test coverage

### Phase 4: React Context Integration (Week 2-3)
- Extend ChocolateContext
- Create useIngredientEditor hook
- State management for unsaved changes
- Integration tests

### Phase 5: Generic UI Components (Week 3)
- EntityEditor component
- FormField component
- Validation components
- Export/import dialogs
- Unsaved changes guard

### Phase 6: Ingredient UI (Week 3-4)
- IngredientForm component
- Field editors
- Category-specific fields
- Integration with existing views

### Phase 7: Export/Import UI (Week 4)
- Export dialog
- Import dialog
- File handling
- Browser compatibility

### Phase 8: Polish and Safety (Week 4-5)
- Unsaved changes detection
- Navigation guards
- Recipe usage warnings
- Error handling
- Performance testing

---

## Part 5: Key Design Decisions

### 5.1 Generic Framework vs Entity-Specific
**Decision:** Generic framework with entity specialization
**Rationale:** Reduces duplication, enables reuse across all entity types
**Trade-off:** Initial complexity vs long-term maintainability

### 5.2 Library-Level vs App-Level
**Decision:** Core logic in ts-chocolate library
**Rationale:** Business logic separate from UI, reusable in CLI/other apps
**Trade-off:** Library size vs proper separation of concerns

### 5.3 Mutable Wrapper vs Direct Modification
**Decision:** MutableCollection wrapper
**Rationale:** Preserves existing immutability, clean abstraction
**Trade-off:** Wrapper lifecycle management vs architectural consistency

### 5.4 YAML Default vs JSON
**Decision:** YAML default, JSON option
**Rationale:** More readable, matches library conventions
**Trade-off:** Additional dependency vs better UX

### 5.5 Validation Timing
**Decision:** Both blur and submit validation
**Rationale:** Immediate feedback + comprehensive checking
**Trade-off:** Complexity vs user experience

---

## Part 6: Technical Risks and Mitigations

### Risk 1: Data Loss from Browser Close
**Severity:** HIGH
**Mitigation:** beforeunload handler, prominent export button, warnings

### Risk 2: Complex Nested Validation
**Severity:** MEDIUM
**Mitigation:** Incremental validation, MessageAggregator, comprehensive tests

### Risk 3: Generic Framework Complexity
**Severity:** MEDIUM
**Mitigation:** Strong types, documentation, incremental development

### Risk 4: Performance with Large Collections
**Severity:** MEDIUM
**Mitigation:** Use existing indexes, async operations, performance testing

### Risk 5: Format Changes
**Severity:** LOW
**Mitigation:** ICollectionSourceFile stability, version metadata, validation

---

## Part 7: Testing Strategy

### Unit Tests (100% Coverage)
- All CRUD operations
- All validation rules
- Export/import format conversion
- Error handling

### Integration Tests
- Complete CRUD workflows
- Collection management
- Cross-field validation
- Unsaved changes detection

### E2E Tests
- Full user workflows
- File operations
- Browser compatibility
- Performance benchmarks

---

## Part 8: Future Extensibility

### Adding New Entity Types
To add CRUD for fillings, recipes, etc.:

1. Create entity-specific editor extending EditorContext
2. Create entity-specific validators
3. Create entity-specific form components
4. Add to ChocolateContext editing operations

**Estimated effort:** 2-3 days per entity type

### Advanced Features (Out of Scope)
- Undo/redo (command pattern)
- Batch operations (multi-select)
- Backend sync (sync adapters)
- Version control (versioned collections)
- Collaborative editing (CRDT support)

---

## Part 9: File Structure

### ts-chocolate Library
```
libraries/ts-chocolate/src/packlets/
├── editing/                        # NEW
│   ├── model.ts
│   ├── mutableCollection.ts
│   ├── editorContext.ts
│   ├── validation.ts
│   ├── exportImport.ts
│   ├── converters.ts
│   ├── index.ts
│   ├── ingredients/                # NEW
│   │   ├── ingredientEditor.ts
│   │   ├── validators.ts
│   │   ├── model.ts
│   │   └── index.ts
│   └── __tests__/
```

### chocolate-lab-web Application
```
apps/chocolate-lab-web/src/
├── contexts/
│   └── ChocolateContext.tsx        # MODIFIED
├── components/
│   └── editing/                    # NEW
│       ├── EntityEditor.tsx
│       ├── CollectionManager.tsx
│       ├── FormField.tsx
│       ├── ValidationMessage.tsx
│       ├── UnsavedChangesPrompt.tsx
│       ├── ExportDialog.tsx
│       ├── ImportDialog.tsx
│       └── index.ts
└── tools/
    └── ingredients/
        ├── IngredientsTool.tsx     # MODIFIED
        ├── views/
        │   ├── BrowseView.tsx      # MODIFIED
        │   ├── DetailView.tsx      # MODIFIED
        │   └── EditView.tsx        # NEW
        └── editing/                # NEW
            ├── IngredientEditView.tsx
            ├── IngredientForm.tsx
            ├── IngredientFields.tsx
            └── index.ts
```

---

## Part 10: Dependencies

### New Dependencies
```bash
# Install js-yaml for YAML parsing
rush add -p js-yaml
rush add --dev -p @types/js-yaml
```

No other new dependencies required.

---

## Part 11: Component Location Decisions (APPROVED 2026-01-12)

### Design Review Outcomes

**Status:** ✅ Design Approved with Component Location Guidance

### 11.1 Component Location Assignments

Based on design review, components are assigned as follows:

#### Reusable Components → ts-chocolate-ui
These components are generic enough for reuse across tools:
- **FormField** - Generic form field wrapper with validation
- **ValidationMessage** - Error message display component
- **ExportDialog** - Format selection dialog (YAML/JSON)
- **ImportDialog** - File selection and options dialog

#### App-Specific Components → chocolate-lab-web
These components are specific to the web application:
- **EntityEditor** - Generic editor layout (may become reusable)
- **CollectionManager** - Collection CRUD UI (CONSIDERATION: may become reusable)
- **UnsavedChangesPrompt** - Navigation guard with React Router integration

**Note on CollectionManager:** Initial implementation in chocolate-lab-web, but we should evaluate reusability during implementation. If it can be made sufficiently generic, it may be promoted to ts-chocolate-ui.

### 11.2 Critical Technical Guidance: FileTree Abstraction

**IMPORTANT: Use FileTree for Import Functionality**

For reading imported files, we MUST use the existing FileTree abstraction:

- **Location:** `ts-web-extras` package contains browser-compatible FileTree
- **Usage:** FileTree provides unified interface for reading files in browser
- **DO NOT:** Reinvent file reading with custom FileReader logic
- **Rationale:** FileTree is proven, tested, and handles browser compatibility

**Implementation Note:**
```typescript
// ✅ CORRECT: Use FileTree from ts-web-extras
import { FileTree } from '@fgv/ts-web-extras';

async function importCollection(file: File): Promise<Result<void>> {
  const fileTree = FileTree.fromBrowserFile(file);
  return fileTree.readText()
    .onSuccess(content => parseAndValidate(content));
}

// ❌ INCORRECT: Don't use raw FileReader
const reader = new FileReader();
reader.readAsText(file); // Don't do this
```

### 11.3 Export Implementation Note

FileTree is NOT needed for export/save operations. Browser's native Blob and download mechanisms are sufficient:

```typescript
// Export uses standard browser APIs
function exportCollection(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'text/yaml' });
  const url = URL.createObjectURL(blob);
  // ... trigger download
}
```

---

## Part 12: Success Criteria

### Functional
- All 15 functional exit criteria met
- CRUD operations working
- Export/import functioning
- Validation comprehensive

### Technical
- 100% test coverage
- No `any` types
- Result pattern throughout
- TypeScript strict mode passing

### Performance
- Export 100 items: < 500ms
- Import 100 items: < 1000ms
- Validation: < 500ms per 100 items

### User Acceptance
- User completes CRUD workflows
- Export/import successful
- Warnings clear and helpful
- UI intuitive

---

## Part 12: Next Steps

1. **Design Review:** User approval of architecture
2. **Phase 1 Start:** Implement core editing framework
3. **Iterative Development:** Build incrementally with tests
4. **Integration:** Connect library to React app
5. **Polish:** UI refinement and safety features
6. **User Testing:** Validate workflows and UX

---

## Conclusion

This design provides a comprehensive, extensible foundation for editing all entity types in the chocolate library. The generic framework enables rapid addition of new entity types while maintaining type safety, testability, and code quality standards.

**Key Benefits:**
- Reusable across all entity types
- Clean separation of concerns
- Type-safe throughout
- Comprehensive testing
- Future-proof architecture

**Next Step:** User approval, then begin Phase 1 implementation.
