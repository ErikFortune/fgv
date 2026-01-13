# Requirements Analysis: Ingredients CRUD Operations

**Date:** 2026-01-12
**Project:** chocolate-lab-web
**Feature:** Complete CRUD operations for ingredients
**TPM Agent:** Requirements Analysis Phase
**Status:** Approved and Detailed

---

## Executive Summary

Transform the current read-only ingredients view in chocolate-lab-web into a full-featured ingredient management tool with complete CRUD capabilities. The solution will enable users to create, read, update, and delete ingredients within mutable collections, while preserving immutable collections as read-only. Data persistence is achieved through YAML/JSON export/import, with no backend or localStorage integration.

### Key Deliverables
- Full ingredient editing capabilities for all properties in mutable collections
- Add new ingredients to mutable collections
- Delete ingredients from mutable collections
- Collection management (create, delete, rename)
- Copy ingredients from immutable to mutable collections
- Export collections to YAML (default) or JSON
- Import collections with replace/create options
- Validation on blur and save
- Unsaved changes detection and warnings

---

## Functional Requirements

### FR001: View Mode (Existing - Preserve)
**Priority:** HIGH
**Description:** The system SHALL maintain existing browse and detail view functionality for ingredients.

**Acceptance Criteria:**
- Given a user is on the ingredients tool, when they view the browse page, then they see a filterable grid of ingredient cards
- Given a user selects an ingredient, when the detail view loads, then they see all ingredient properties formatted correctly
- Given a user applies filters, when ingredients are displayed, then only matching ingredients appear

**Rationale:** Preserve existing working functionality while adding edit capabilities.

---

### FR002: Edit Ingredient (All Properties)
**Priority:** HIGH
**Description:** The system SHALL allow users to edit all properties of ingredients in mutable collections.

**Acceptance Criteria:**
- Given an ingredient is in a mutable collection, when the user enters edit mode, then all editable fields are enabled
- Given an ingredient is in an immutable collection, when the user views the ingredient, then edit controls are disabled or hidden
- Given a user edits a field, when they blur the field, then validation runs and errors display if invalid
- Given a user has made changes, when they save, then all validations pass before persisting changes
- Given validation fails, when the user attempts to save, then clear error messages indicate which fields are invalid

**Editable Properties:**
- baseId (with uniqueness validation within collection)
- name (required, non-empty)
- category (required, from enum)
- ganacheCharacteristics (all percentage fields, 0-100, must sum reasonably)
- description (optional text)
- manufacturer (optional text)
- allergens (multi-select from enum)
- traceAllergens (multi-select from enum)
- certifications (multi-select from enum)
- vegan (boolean)
- tags (multi-input, string array)
- density (optional number, positive)
- phase (optional, from enum)
- measurementUnits (structured object with preferred and options)
- urls (array of categorized URLs)
- Category-specific properties (chocolateType, cacaoPercentage, temperatureCurve, etc.)

**Rationale:** Users need comprehensive editing capabilities to maintain their ingredient collections.

---

### FR003: Add New Ingredient
**Priority:** HIGH
**Description:** The system SHALL allow users to create new ingredients in mutable collections.

**Acceptance Criteria:**
- Given a user is viewing a mutable collection, when they click "Add Ingredient", then a blank ingredient form appears
- Given a user fills in required fields (name, category, ganacheCharacteristics), when they save, then the new ingredient is added to the collection
- Given a user specifies a baseId, when they save, then the system validates uniqueness within the collection
- Given a user does not specify a baseId, when they save, then the system auto-generates a baseId from the name (kebab-case)
- Given a user saves a new ingredient, when successful, then the system switches to the new ingredient's detail view

**Rationale:** Users need to expand their collections with custom ingredients.

---

### FR004: Delete Ingredient
**Priority:** HIGH
**Description:** The system SHALL allow users to delete ingredients from mutable collections.

**Acceptance Criteria:**
- Given an ingredient is in a mutable collection, when the user clicks delete, then a confirmation prompt appears
- Given a user confirms deletion, when the operation completes, then the ingredient is removed from the collection
- Given a user cancels deletion, when they cancel, then no changes occur
- Given a deleted ingredient is used in recipes, when deletion is attempted, then a warning lists affected recipes before confirmation

**Rationale:** Users need to remove obsolete or incorrect ingredients from their collections.

---

### FR005: Copy to Mutable Collection
**Priority:** MEDIUM
**Description:** The system SHALL allow users to copy ingredients from immutable collections to mutable collections.

**Acceptance Criteria:**
- Given an ingredient is in an immutable collection, when the user clicks "Copy to...", then a collection selector dialog appears
- Given a user selects a target mutable collection, when they confirm, then a copy of the ingredient is created in the target collection
- Given a copy is created, when the operation completes, then the system switches to edit mode for the copied ingredient
- Given a copied ingredient would have a duplicate baseId, when copying, then the system auto-generates a unique baseId (e.g., appending "-copy")

**Rationale:** Users want to create modified versions of built-in ingredients without altering the originals.

---

### FR006: Collection Management - Create
**Priority:** HIGH
**Description:** The system SHALL allow users to create new mutable collections.

**Acceptance Criteria:**
- Given a user clicks "New Collection", when the dialog appears, then they can specify collection ID, name, and description
- Given a user enters a collection ID, when they save, then the system validates the ID is unique and follows naming conventions (kebab-case)
- Given a new collection is created, when successful, then it appears in collection filters and selectors
- Given a new collection is created, when successful, then it starts empty and mutable

**Rationale:** Users need to organize ingredients into logical groupings.

---

### FR007: Collection Management - Delete
**Priority:** HIGH
**Description:** The system SHALL allow users to delete mutable collections.

**Acceptance Criteria:**
- Given a collection is mutable, when the user selects "Delete Collection", then a confirmation prompt warns about data loss
- Given a user confirms deletion, when the operation completes, then all ingredients in the collection are removed from the runtime
- Given a deleted collection contains ingredients used in recipes, when deletion is attempted, then a warning lists affected recipes before confirmation
- Given a collection is immutable or built-in, when viewed, then the delete option is not available

**Rationale:** Users need to remove entire collections that are no longer needed.

---

### FR008: Collection Management - Rename
**Priority:** MEDIUM
**Description:** The system SHALL allow users to rename mutable collections.

**Acceptance Criteria:**
- Given a collection is mutable, when the user selects "Rename Collection", then a dialog prompts for new name and description
- Given a user enters a new name, when they save, then the collection metadata updates but the collection ID remains unchanged
- Given a collection is immutable or built-in, when viewed, then the rename option is not available

**Rationale:** Users need to update collection metadata as their organization evolves.

---

### FR009: Export Collection to YAML (Default)
**Priority:** HIGH
**Description:** The system SHALL allow users to export collections to YAML format (default) or JSON format (option).

**Acceptance Criteria:**
- Given a user selects a collection, when they click "Export", then a file download dialog appears with YAML as default format
- Given a user selects JSON option, when they export, then the file is in JSON format
- Given a collection is exported, when the file is generated, then it matches the ICollectionSourceFile structure with metadata and items
- Given a collection has metadata (name, description), when exported, then metadata is included in the file
- Given a user exports a collection, when successful, then the filename is `{collectionId}.yaml` or `{collectionId}.json`

**File Format (YAML Default):**
```yaml
metadata:
  name: "Collection Name"
  description: "Collection Description"
  version: "1.0.0"
  tags: ["custom", "user-created"]
items:
  ingredient-id-1:
    name: "Ingredient Name"
    category: "chocolate"
    ganacheCharacteristics:
      cacaoFat: 35
      sugar: 45
      # ... other properties
  ingredient-id-2:
    # ... second ingredient
```

**Rationale:** Users need to persist their work and share collections with others. YAML is more readable and commonly used in the ecosystem.

---

### FR010: Import Collection (Replace/Create Options)
**Priority:** HIGH
**Description:** The system SHALL allow users to import collections from YAML or JSON files, with options to replace existing or create new.

**Acceptance Criteria:**
- Given a user clicks "Import", when the file dialog opens, then they can select .yaml, .yml, or .json files
- Given a user selects a file, when parsing begins, then the system validates the file structure matches ICollectionSourceFile
- Given an import file has a collection ID that exists, when importing, then the system prompts: "Replace existing collection or import as new?"
- Given a user chooses "Replace", when import completes, then the existing collection is completely replaced with imported data
- Given a user chooses "Create New", when import completes, then the system prompts for a new collection ID and creates a new collection
- Given import fails validation, when errors occur, then clear messages indicate what is wrong with the file format or data

**Rationale:** Users need to restore saved collections and import collections from external sources.

---

### FR011: Validation on Blur and Save
**Priority:** HIGH
**Description:** The system SHALL validate ingredient fields on blur (individual field) and on save (all fields).

**Validation Rules:**
- **name:** Required, non-empty string, max 200 characters
- **baseId:** Required if specified, unique within collection, lowercase alphanumeric with hyphens, max 50 characters
- **category:** Required, must be valid IngredientCategory enum value
- **ganacheCharacteristics:** All percentages 0-100, total should not exceed 100
- **density:** If specified, must be positive number
- **alcoholByVolume:** If specified for alcohol ingredients, must be 0-100
- **cacaoPercentage:** If specified for chocolate, must be 0-100
- **temperature curve:** If specified, melt > cool > working, all in valid Celsius range
- **urls:** Must be valid URL format if provided
- **allergens/certifications/tags:** Must be from valid enums or string arrays

**Acceptance Criteria:**
- Given a user blurs a required field that is empty, when validation runs, then an error message appears below the field
- Given a user enters an invalid value, when they blur the field, then an error message explains what is invalid
- Given a user clicks save with validation errors, when save is attempted, then save is blocked and error summary appears
- Given all validations pass, when user saves, then changes are applied to the runtime context

**Rationale:** Immediate feedback prevents data entry errors and ensures data integrity.

---

### FR012: Unsaved Changes Detection
**Priority:** MEDIUM
**Description:** The system SHALL detect unsaved changes and warn users before navigation.

**Acceptance Criteria:**
- Given a user has unsaved changes, when they attempt to navigate away, then a warning dialog appears: "You have unsaved changes. Discard changes?"
- Given a user confirms discard, when they navigate away, then changes are lost and navigation proceeds
- Given a user cancels, when they stay on the page, then changes are preserved
- Given a user saves changes, when save succeeds, then the unsaved changes flag is cleared

**Rationale:** Prevents accidental data loss.

---

## Non-Functional Requirements

### NFR001: Performance - Export/Import
**Category:** Performance
**Description:** Export and import operations SHALL complete within acceptable time limits.

**Metric:** Operation duration
**Threshold:**
- Export collection with 100 ingredients: < 500ms
- Import collection with 100 ingredients: < 1000ms
- Validation of imported data: < 500ms per 100 ingredients

**Rationale:** Users expect responsive file operations even for large collections.

---

### NFR002: Usability - Edit Mode Clarity
**Category:** Usability
**Description:** The system SHALL clearly indicate when an ingredient is editable vs. read-only.

**Metric:** Visual distinction between editable and read-only states
**Threshold:**
- Edit button/controls visible only for mutable collections
- Visual distinction (e.g., border, badge) on editable fields
- Clear "Read Only" indicator on immutable collections

**Rationale:** Users must understand whether they can edit an ingredient to avoid frustration.

---

### NFR003: Reliability - Data Validation
**Category:** Reliability
**Description:** The system SHALL prevent invalid data from being saved to collections.

**Metric:** Invalid data persistence rate
**Threshold:** 0% - No invalid data should ever be saved

**Rationale:** Data integrity is critical for recipe calculations and user trust.

---

### NFR004: Security - No Sensitive Data Exposure
**Category:** Security
**Description:** The system SHALL NOT expose encryption keys or sensitive collection data in exports unless explicitly encrypted.

**Metric:** Sensitive data leakage in exported files
**Threshold:** 0% - No encryption keys or sensitive data in plain exports

**Rationale:** Protect user privacy and encrypted collection security.

---

## Technical Constraints

### TC001: Built-in Collections are Immutable
**Description:** Collections loaded from BuiltIn.BuiltInData are always read-only, regardless of runtime flags.

**Impact:** UI must disable edit controls for built-in collections. Users can only copy to mutable collections.

---

### TC002: Collection Mutability is Runtime Flag
**Description:** Collection mutability is determined by the `isMutable` property on ICollection at runtime.

**Impact:** UI queries `collection.isMutable` to determine if edit operations are allowed.

---

### TC003: ID Auto-generation from Name
**Description:** When creating new ingredients, if baseId is not provided, it is auto-generated from the name using kebab-case conversion.

**Impact:** System must implement name → kebab-case conversion and ensure uniqueness within collection.

---

### TC004: Export Format Matches ICollectionSourceFile
**Description:** Exported files must match the ICollectionSourceFile<Ingredient> structure from ts-chocolate library.

**Impact:** Export implementation must serialize metadata and items correctly.

---

### TC005: No Backend or LocalStorage
**Description:** All data persistence is through export/import only. No backend API or localStorage integration.

**Impact:** Users must explicitly export to save work. Data is lost if not exported before closing browser.

---

### TC006: Result Pattern for All Operations
**Description:** All CRUD operations must use the Result<T> pattern for error handling.

**Impact:** No throwing errors in CRUD operations; use succeed/fail and handle with toSucceed/toFail matchers in tests.

---

## Assumptions

### A001: User Understands Export/Import Model
**Assumption:** Users understand that changes are not persisted unless explicitly exported.
**Risk if false:** HIGH - Users may lose work if they expect auto-save.
**Validation method:** User documentation and warning messages.

---

### A002: Collections Have Unique IDs
**Assumption:** Collection IDs are unique across all loaded collections at runtime.
**Risk if false:** MEDIUM - Collision could cause data corruption.
**Validation method:** Runtime validation when creating/importing collections.

---

### A003: YAML is Preferred Format
**Assumption:** Users prefer YAML for readability, with JSON as fallback option.
**Risk if false:** LOW - If users prefer JSON, they can select it in export options.
**Validation method:** User feedback during testing.

---

### A004: Single User Environment
**Assumption:** No concurrent editing by multiple users; single-user web application.
**Risk if false:** LOW - Application is client-side only, no multi-user concerns.
**Validation method:** Architecture review confirms client-side only design.

---

## Out of Scope

The following are explicitly excluded from this feature:

- ❌ Backend API integration
- ❌ LocalStorage or IndexedDB persistence
- ❌ Undo/redo functionality
- ❌ Batch operations (bulk edit/delete)
- ❌ Version control for ingredient changes
- ❌ Conflict resolution for concurrent edits
- ❌ Image upload for ingredients
- ❌ Recipe impact analysis when modifying ingredients (warning only)
- ❌ Import/export of multiple collections in one file
- ❌ Collection encryption/decryption in the UI (use CLI tools)

---

## Edge Cases and Special Scenarios

### EC001: Duplicate BaseId During Import
**Scenario:** Imported file contains ingredients with baseIds that already exist in the collection.
**Handling:**
- If replacing collection: Overwrite all existing ingredients
- If creating new collection: Use imported data as-is (new collection has no conflicts)
- Validation error if baseIds are duplicated within the imported file itself

---

### EC002: Empty Collection Export
**Scenario:** User exports a collection with no ingredients.
**Handling:** Export succeeds with empty `items: {}` object. Metadata is still included.

---

### EC003: Invalid File Format on Import
**Scenario:** User selects a file that is not valid YAML/JSON or does not match ICollectionSourceFile structure.
**Handling:** Import fails with clear error message: "Invalid file format. Expected YAML or JSON with 'metadata' and 'items' structure."

---

### EC004: Editing Ingredient Used in Recipes
**Scenario:** User edits an ingredient that is used in existing recipes.
**Handling:**
- Allow edit (recipes are dynamic and will use updated values)
- Show informational message listing affected recipes
- No blocking warning unless deleting the ingredient

---

### EC005: Collection ID Conflict During Import (Create New)
**Scenario:** User imports a collection and chooses "Create New" but the auto-suggested ID already exists.
**Handling:** Prompt user to enter a different collection ID. Validate uniqueness before proceeding.

---

### EC006: Browser Closes with Unsaved Changes
**Scenario:** User has unsaved changes and closes the browser tab/window.
**Handling:** Browser's native `beforeunload` event prompts: "You have unsaved changes. Leave page?"

---

### EC007: Malformed Ingredient Data in Import
**Scenario:** Imported ingredient has missing required fields or invalid values.
**Handling:** Import validation fails with detailed error messages indicating which ingredient and which field is invalid.

---

## Success Criteria

### User Acceptance Criteria
- ✅ User can edit any ingredient property in a mutable collection and save changes
- ✅ User can create new ingredients with all required properties
- ✅ User can delete ingredients from mutable collections with confirmation
- ✅ User can create new mutable collections
- ✅ User can delete and rename mutable collections
- ✅ User can copy ingredients from immutable to mutable collections
- ✅ User can export collections to YAML or JSON files
- ✅ User can import collections with replace/create options
- ✅ User receives immediate feedback on validation errors
- ✅ User is warned before losing unsaved changes

### Technical Success Criteria
- ✅ All CRUD operations use Result pattern
- ✅ 100% test coverage for all CRUD operations
- ✅ Export/import matches ICollectionSourceFile structure
- ✅ Collection mutability correctly determined from runtime flags
- ✅ BaseId auto-generation follows kebab-case convention
- ✅ No data persists beyond export/import (no localStorage/backend)

---

## Dependencies

### Internal Dependencies
- **ChocolateContext:** Provides runtime access to collections and ingredients
- **ts-chocolate library:** Defines data models (Ingredient, ICollectionSourceFile, etc.)
- **ts-utils:** Result pattern, validation, converters
- **ts-chocolate-ui:** Reusable UI components (badges, displays)

### External Dependencies
- **React 19.2:** UI framework
- **TypeScript 5.9:** Type safety
- **Tailwind CSS 3.4:** Styling
- **js-yaml (new):** YAML parsing/serialization for import/export

---

## Risks and Mitigations

### Risk 001: Data Loss on Browser Close
**Severity:** HIGH
**Description:** Users may close browser without exporting, losing all work.
**Mitigation:**
- Implement `beforeunload` warning for unsaved changes
- Prominent "Export" button always visible
- User documentation emphasizing export-only persistence

### Risk 002: Invalid Data Import
**Severity:** MEDIUM
**Description:** Users may import malformed or malicious data files.
**Mitigation:**
- Comprehensive validation on import
- Reject invalid files with clear error messages
- No code execution from imported data (data-only)

### Risk 003: Recipe Breakage from Ingredient Changes
**Severity:** MEDIUM
**Description:** Editing/deleting ingredients may affect existing recipes unexpectedly.
**Mitigation:**
- Show list of affected recipes before delete
- Informational warning when editing used ingredients
- Full recipe impact analysis is out of scope but acknowledged

---

## Implementation Phases

### Phase 1: Core Edit Operations (MVP)
- Edit ingredient properties in mutable collections
- Add new ingredients to mutable collections
- Delete ingredients from mutable collections
- Validation on blur and save

### Phase 2: Collection Management
- Create new mutable collections
- Delete mutable collections
- Rename mutable collections

### Phase 3: Copy Operations
- Copy ingredient from immutable to mutable collection
- Collection selector UI

### Phase 4: Export/Import
- Export collection to YAML (default)
- Export collection to JSON (option)
- Import collection with replace/create options
- File format validation

### Phase 5: Polish and Safety
- Unsaved changes detection and warnings
- Recipe usage warnings
- Comprehensive error messages
- User documentation

---

## Related Documentation

- **ICollectionSourceFile Structure:** `/libraries/ts-chocolate/src/packlets/library-data/model.ts`
- **Ingredient Model:** `/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts`
- **Runtime Context:** `/libraries/ts-chocolate/src/packlets/runtime/`
- **ChocolateContext:** `/apps/chocolate-lab-web/src/contexts/ChocolateContext.tsx`
- **Existing Browse/Detail Views:** `/apps/chocolate-lab-web/src/tools/ingredients/views/`

---

## Approval and Sign-off

**Status:** ✅ Requirements Approved
**Date:** 2026-01-12
**Next Phase:** Exit Criteria Definition → Design → Implementation
