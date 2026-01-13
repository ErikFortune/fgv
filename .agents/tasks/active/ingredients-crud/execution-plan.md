# Execution Plan: Ingredients CRUD with Extensible Editing Framework

**Date:** 2026-01-12
**Status:** Phase 1 Starting - Core Editing Framework
**Approved:** ✅ Design and Plan Approved

---

## Overview

This execution plan breaks down the implementation of the ingredients CRUD feature into manageable phases, following the approved technical design. The implementation creates a generic, extensible editing framework that will support all entity types in the chocolate library ecosystem.

---

## Phase 1: Core Editing Framework (ts-chocolate library)

**Estimated Duration:** 3-4 days
**Priority:** HIGH - Foundation for all other phases

### 1.1 Create Editing Packlet Structure

```
libraries/ts-chocolate/src/packlets/editing/
├── model.ts                    # Core interfaces and types
├── mutableCollection.ts        # Mutable collection wrapper
├── editorContext.ts            # Editor session management
├── validation.ts               # Generic validation framework
├── exportImport.ts             # YAML/JSON export/import
├── converters.ts               # Generic converters
├── index.ts                    # Public API
└── __tests__/                  # Test files
    ├── model.test.ts
    ├── mutableCollection.test.ts
    ├── editorContext.test.ts
    ├── validation.test.ts
    ├── exportImport.test.ts
    └── converters.test.ts
```

### 1.2 Implementation Order

**Step 1: Core Interfaces (model.ts)**
- Define IEditorContext<T, TId>
- Define IValidationReport
- Define IMutableCollection<T, TId>
- Define IFieldValidator<T>
- Define IExportOptions, IImportOptions
- Tests: Type compatibility, interface contracts

**Step 2: Validation Framework (validation.ts)**
- Implement ValidationReport class
- Implement FieldValidator base class
- Implement validation aggregation utilities
- Tests: 100% coverage of validation logic

**Step 3: Mutable Collection (mutableCollection.ts)**
- Implement MutableCollection<T> class
- Wrap existing SubLibraryBase collections
- Track in-memory changes
- Implement set/remove operations
- Tests: All CRUD operations, change tracking

**Step 4: Export/Import Utilities (exportImport.ts)**
- Implement YAML serialization (using js-yaml)
- Implement JSON serialization
- Implement ICollectionSourceFile structure conversion
- Implement format validation
- Tests: Round-trip conversions, format validation

**Step 5: Converters (converters.ts)**
- Generic converter utilities for common types
- Field-level conversion helpers
- Tests: All converter functions

**Step 6: Editor Context (editorContext.ts)**
- Implement EditorContext<T, TId> base class
- Integrate validation framework
- Track unsaved changes
- Coordinate CRUD operations
- Tests: Complete CRUD workflows, validation integration

### 1.3 Dependencies

**Install js-yaml:**
```bash
cd libraries/ts-chocolate
rush add -p js-yaml
rush add --dev -p @types/js-yaml
```

### 1.4 Exit Criteria for Phase 1

- ✅ All core interfaces defined and documented
- ✅ MutableCollection fully implemented
- ✅ Validation framework operational
- ✅ Export/import utilities working (YAML + JSON)
- ✅ EditorContext base class complete
- ✅ 100% test coverage for all components
- ✅ No `any` types, Result pattern throughout
- ✅ API Extractor documentation generated

---

## Phase 2: Ingredient Specialization

**Estimated Duration:** 2-3 days
**Priority:** HIGH - Specializes framework for ingredients
**Dependencies:** Phase 1 complete

### 2.1 Create Ingredient Editing Structure

```
libraries/ts-chocolate/src/packlets/editing/ingredients/
├── ingredientEditor.ts         # Ingredient editor context
├── validators.ts               # Ingredient-specific validators
├── model.ts                    # Ingredient editing types
├── index.ts                    # Public API
└── __tests__/                  # Test files
    ├── ingredientEditor.test.ts
    ├── validators.test.ts
    └── model.test.ts
```

### 2.2 Implementation Tasks

**Step 1: Ingredient Validators (validators.ts)**
- Name validator (required, max 200 chars)
- BaseId validator (kebab-case, unique within collection)
- Category validator (enum validation)
- GanacheCharacteristics validators (percentages, sum ≤ 100)
- Category-specific validators (chocolate, dairy, alcohol, etc.)
- Tests: All validation rules, edge cases

**Step 2: Auto-generation Utilities (validators.ts)**
- BaseId from name (kebab-case conversion)
- Unique ID generation (append counter if collision)
- Default value generation for optional fields
- Tests: ID generation, uniqueness, edge cases

**Step 3: Ingredient Editor (ingredientEditor.ts)**
- Extend EditorContext<Ingredient, IngredientId>
- Integrate ingredient validators
- Implement ingredient-specific CRUD logic
- Tests: Complete ingredient workflows

### 2.3 Exit Criteria for Phase 2

- ✅ All ingredient validators implemented
- ✅ Auto-generation utilities working
- ✅ IngredientEditor fully functional
- ✅ 100% test coverage
- ✅ Integration tests with Phase 1 framework

---

## Phase 3: Collection Management (ts-chocolate library)

**Estimated Duration:** 2 days
**Priority:** HIGH - Enables collection CRUD
**Dependencies:** Phase 1 complete

### 3.1 Implementation Tasks

**Step 1: Collection Operations**
- Create new mutable collection
- Delete mutable collection
- Rename collection (metadata only)
- Tests: All operations, immutability checks

**Step 2: Collection Manager Integration**
- Integrate with runtime context
- Collection lifecycle management
- Tests: Multi-collection scenarios

### 3.2 Exit Criteria for Phase 3

- ✅ Collection create/delete/rename working
- ✅ Immutable collections protected
- ✅ Integration with runtime context
- ✅ 100% test coverage

---

## Phase 4: React Context Integration (chocolate-lab-web)

**Estimated Duration:** 2-3 days
**Priority:** HIGH - Connects library to UI
**Dependencies:** Phases 1-3 complete

### 4.1 Extend ChocolateContext

```typescript
// Add editing operations to ChocolateContext
export interface IChocolateContext {
  readonly editing: {
    createIngredientEditor: (collectionId: string) => Result<IngredientEditor>;
    createCollection: (params: ICreateCollectionParams) => Result<void>;
    deleteCollection: (params: IDeleteCollectionParams) => Result<void>;
    renameCollection: (params: IRenameCollectionParams) => Result<void>;
    exportCollection: (params: IExportParams) => Result<Blob>;
    importCollection: (params: IImportParams) => Promise<Result<void>>;
  };
}
```

### 4.2 Implementation Tasks

**Step 1: Context Extension**
- Add editing property to ChocolateContext
- Implement editor creation
- Implement collection management operations
- Tests: Context integration

**Step 2: Custom Hooks**
- useIngredientEditor hook
- useUnsavedChanges hook
- useCollectionManager hook
- Tests: Hook behavior

**Step 3: State Management**
- Track active editor sessions
- Manage unsaved changes state
- Navigation guard integration
- Tests: State transitions

### 4.3 Exit Criteria for Phase 4

- ✅ ChocolateContext extended with editing operations
- ✅ Custom hooks implemented
- ✅ State management working
- ✅ Integration tests passing

---

## Phase 5: Generic UI Components (ts-chocolate-ui)

**Estimated Duration:** 3 days
**Priority:** HIGH - Reusable UI components
**Dependencies:** Phase 4 complete

### 5.1 Component Structure

```
libraries/ts-chocolate-ui/src/components/editing/
├── FormField.tsx               # Generic form field wrapper
├── ValidationMessage.tsx       # Error message display
├── ExportDialog.tsx            # Export format selection
├── ImportDialog.tsx            # Import file selection
├── types.ts                    # Shared types
└── index.ts                    # Public API
```

### 5.2 Implementation Tasks

**Step 1: FormField Component**
- Generic form field wrapper
- Validation message integration
- Blur validation support
- Tests: All field types, validation states

**Step 2: ValidationMessage Component**
- Error message display
- Field-level and general errors
- Styling and accessibility
- Tests: Message display, edge cases

**Step 3: ExportDialog Component**
- Format selection (YAML/JSON)
- Filename input
- Download trigger
- Tests: User interactions, file generation

**Step 4: ImportDialog Component**
- File selection input
- Format detection
- Options (replace/create new)
- Tests: File handling, validation

### 5.3 Exit Criteria for Phase 5

- ✅ All reusable components implemented
- ✅ Component documentation complete
- ✅ Storybook stories created
- ✅ Accessibility verified
- ✅ Unit tests for all components

---

## Phase 6: App-Specific Components (chocolate-lab-web)

**Estimated Duration:** 3 days
**Priority:** HIGH - App-level UI
**Dependencies:** Phase 5 complete

### 6.1 Component Structure

```
apps/chocolate-lab-web/src/components/editing/
├── EntityEditor.tsx            # Generic editor layout
├── CollectionManager.tsx       # Collection CRUD UI
├── UnsavedChangesPrompt.tsx    # Navigation guard
├── types.ts                    # Shared types
└── index.ts                    # Public API
```

### 6.2 Implementation Tasks

**Step 1: EntityEditor Component**
- Generic editor layout
- Form/view mode switching
- Save/cancel actions
- Tests: Layout, mode transitions

**Step 2: CollectionManager Component**
- Collection list/grid
- Create/delete/rename operations
- Collection selection
- Tests: All CRUD operations
- **CONSIDERATION:** Evaluate reusability for promotion to ts-chocolate-ui

**Step 3: UnsavedChangesPrompt Component**
- Navigation guard with React Router
- Discard/save prompts
- beforeunload handler
- Tests: Navigation scenarios

### 6.3 Exit Criteria for Phase 6

- ✅ All app-specific components implemented
- ✅ Integration with React Router
- ✅ Navigation guards working
- ✅ Unit tests complete

---

## Phase 7: Ingredient-Specific UI (chocolate-lab-web)

**Estimated Duration:** 4-5 days
**Priority:** HIGH - Ingredient editing UI
**Dependencies:** Phase 6 complete

### 7.1 Component Structure

```
apps/chocolate-lab-web/src/tools/ingredients/editing/
├── IngredientEditView.tsx      # Main edit view
├── IngredientForm.tsx          # Ingredient form layout
├── IngredientFields.tsx        # Field components
├── GanacheCharacteristicsEditor.tsx  # Complex field editor
├── CategorySpecificFields.tsx  # Category-dependent fields
├── types.ts                    # Ingredient editing types
└── index.ts                    # Public API
```

### 7.2 Implementation Tasks

**Step 1: IngredientEditView**
- Main edit view layout
- Integration with IngredientEditor
- Mode switching (view/edit)
- Tests: View integration

**Step 2: IngredientForm**
- Form layout and sections
- Field organization
- Submit/cancel handlers
- Tests: Form behavior

**Step 3: Field Components**
- Basic fields (name, baseId, description)
- Enum fields (category, phase)
- Multi-select fields (allergens, certifications)
- Array fields (tags, URLs)
- Tests: All field types

**Step 4: GanacheCharacteristics Editor**
- Percentage fields with validation
- Sum validation display
- Visual indicators
- Tests: Complex validation

**Step 5: Category-Specific Fields**
- Chocolate-specific fields
- Dairy-specific fields
- Alcohol-specific fields
- Dynamic field display
- Tests: Conditional rendering

### 7.3 Exit Criteria for Phase 7

- ✅ All ingredient fields editable
- ✅ Category-specific fields working
- ✅ Validation integrated throughout
- ✅ UI/UX polished
- ✅ Unit tests complete

---

## Phase 8: Export/Import Integration

**Estimated Duration:** 2-3 days
**Priority:** HIGH - Data persistence
**Dependencies:** Phases 5, 7 complete

### 8.1 Implementation Tasks

**Step 1: Export Functionality**
- Wire ExportDialog to ChocolateContext
- Generate YAML/JSON blobs
- Trigger browser downloads
- Tests: Export workflows

**Step 2: Import Functionality (CRITICAL: Use FileTree)**
- **Use FileTree from ts-web-extras for file reading**
- Wire ImportDialog to ChocolateContext
- File validation and parsing
- Replace/create new options
- Tests: Import workflows, validation

**Implementation Note:**
```typescript
// ✅ CORRECT: Use FileTree abstraction
import { FileTree } from '@fgv/ts-web-extras';

async function handleImport(file: File): Promise<Result<void>> {
  const fileTree = FileTree.fromBrowserFile(file);
  return fileTree.readText()
    .onSuccess(content => parseAndValidate(content))
    .onSuccess(data => importToCollection(data));
}
```

### 8.2 Exit Criteria for Phase 8

- ✅ Export to YAML/JSON working
- ✅ Import from YAML/JSON working
- ✅ FileTree abstraction used correctly
- ✅ Replace/create options functional
- ✅ Format validation comprehensive
- ✅ Integration tests passing

---

## Phase 9: Polish and Safety Features

**Estimated Duration:** 2-3 days
**Priority:** MEDIUM - UX improvements
**Dependencies:** All previous phases complete

### 9.1 Implementation Tasks

**Step 1: Unsaved Changes Detection**
- Track dirty state
- Navigation warnings
- beforeunload handler
- Tests: Change detection

**Step 2: Recipe Usage Warnings**
- Detect ingredient usage in recipes
- Display affected recipes
- Confirmation prompts
- Tests: Warning scenarios

**Step 3: Error Handling Polish**
- Comprehensive error messages
- User-friendly validation feedback
- Graceful failure handling
- Tests: Error scenarios

**Step 4: Performance Testing**
- Large collection handling (100+ ingredients)
- Export/import performance benchmarks
- Validation performance
- Optimization if needed

### 9.2 Exit Criteria for Phase 9

- ✅ Unsaved changes detection working
- ✅ Recipe warnings implemented
- ✅ Error messages clear and helpful
- ✅ Performance benchmarks met
- ✅ E2E tests passing

---

## Phase 10: Integration and User Testing

**Estimated Duration:** 2 days
**Priority:** HIGH - Final validation
**Dependencies:** All implementation phases complete

### 10.1 Tasks

**Step 1: Integration Testing**
- Complete user workflows
- Cross-browser testing
- Accessibility validation
- Performance validation

**Step 2: User Acceptance Testing**
- User completes all CRUD operations
- Export/import tested
- Validation feedback validated
- UI/UX feedback collected

**Step 3: Documentation**
- User guide for CRUD operations
- Developer documentation
- API documentation review

### 10.2 Exit Criteria for Phase 10

- ✅ All exit criteria validated
- ✅ User acceptance criteria met
- ✅ Documentation complete
- ✅ Ready for production use

---

## Overall Timeline

**Total Estimated Duration:** 5-6 weeks

- Phase 1: Days 1-4 (Core editing framework)
- Phase 2: Days 5-7 (Ingredient specialization)
- Phase 3: Days 8-9 (Collection management)
- Phase 4: Days 10-12 (React integration)
- Phase 5: Days 13-15 (Generic UI components)
- Phase 6: Days 16-18 (App-specific components)
- Phase 7: Days 19-23 (Ingredient UI)
- Phase 8: Days 24-26 (Export/import)
- Phase 9: Days 27-29 (Polish)
- Phase 10: Days 30-31 (Testing and validation)

---

## Risk Management

### High Priority Risks

**Risk 1: Data Loss from Browser Close**
- Mitigation: beforeunload handler, prominent warnings, user documentation
- Monitor: User feedback on data loss incidents

**Risk 2: Complex Validation Logic**
- Mitigation: Incremental testing, comprehensive test coverage
- Monitor: Test coverage metrics, edge case discovery

**Risk 3: FileTree Integration Issues**
- Mitigation: Early integration testing, consult ts-web-extras documentation
- Monitor: Import functionality testing

### Medium Priority Risks

**Risk 4: Generic Framework Complexity**
- Mitigation: Strong types, incremental development, documentation
- Monitor: Code review feedback, developer experience

**Risk 5: Performance with Large Collections**
- Mitigation: Performance benchmarks, optimization pass in Phase 9
- Monitor: Performance metrics, user feedback

---

## Next Steps

**Immediate Actions:**
1. ✅ Design approved - documented in technical-design.md
2. 🚀 **BEGIN PHASE 1:** Create editing packlet structure
3. 🚀 Install js-yaml dependency
4. 🚀 Implement core interfaces (model.ts)

**Current Phase:** Phase 1 - Core Editing Framework
**Next Milestone:** Core interfaces and validation framework complete

---

## Success Metrics

- All 15 functional exit criteria met
- 100% test coverage maintained
- No `any` types throughout codebase
- Result pattern used consistently
- Export/import performance benchmarks met
- User acceptance criteria validated
- Zero critical bugs at launch
