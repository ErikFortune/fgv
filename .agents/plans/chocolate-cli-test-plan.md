# Functional Test Plan for chocolate-cli

## Executive Summary

The chocolate-cli is a command-line tool (~13,700 LOC) for managing chocolate recipe data. It provides both standalone commands for working with published data libraries and an interactive workspace mode for creating/editing recipes. Currently only ~10% has test coverage (renderers only).

This plan prioritizes tests by **functional importance** to users, not coverage metrics. Tests are organized into three priority levels based on user impact.

---

## Architecture Overview

### Command Structure

```
choco
├── workspace               # Interactive workspace management
│   ├── init               # Initialize new workspace
│   ├── browse             # Interactive browsing
│   ├── edit               # Interactive editing
│   └── keystore           # Encryption key management
│
├── Entity Commands        # Read-only operations on published data
│   ├── ingredient list/show
│   ├── filling list/show
│   ├── mold list/show
│   ├── confection list/show
│   ├── procedure list/show
│   └── task list/show
│
├── Analysis Commands
│   └── ganache analyze    # Ganache composition analysis
│
├── Data Management
│   ├── publish-data       # Publish workspace data
│   ├── fetch-data         # Fetch published data
│   ├── encrypt           # Encrypt files
│   ├── decrypt           # Decrypt files
│   └── keygen            # Generate encryption keys
```

### Core Abstractions

1. **Data Source Loading** (`shared/dataSourceLoader.ts`)
   - Loads library data from file trees
   - Handles encryption/decryption
   - Manages secrets and keys

2. **Output Formatting** (`shared/outputFormatter.ts`)
   - Formats data for display (human, table, json, yaml)
   - Generic list formatting with column configuration
   - Entity data serialization

3. **Workspace Context** (`workspace/shared/workspaceContext.ts`)
   - Loads workspaces with builtin/user data
   - Handles workspace locking/unlocking
   - Manages device-specific state

4. **Edit Orchestrator** (`workspace/edit/editOrchestrator.ts`)
   - Coordinates add/edit/remove/export flows
   - Prompts for entity data interactively
   - Manages collection selection

5. **Renderers** (`workspace/renderers/*.ts`)
   - Currently tested (8 renderer files)
   - Formats entities for display with contextual actions

6. **Menu System** (`workspace/shared/menuSystem.ts`)
   - Interactive menus with breadcrumb navigation
   - Selection, confirmation, input prompts

---

## Testing Approach

### Existing Tests (Baseline)

```
src/test/unit/commands/
├── shared/
│   └── outputFormatter.test.ts          # 100% covered
└── workspace/
    └── renderers/
        ├── confectionRenderer.test.ts   # Complete
        ├── fillingRenderer.test.ts      # Complete
        ├── ingredientRenderer.test.ts   # Complete
        ├── inventoryRenderer.test.ts    # Complete
        ├── journalRenderer.test.ts      # Complete
        ├── moldRenderer.test.ts         # Complete
        ├── procedureRenderer.test.ts    # Complete
        └── sessionRenderer.test.ts      # Complete
```

### Test Data Requirements

All tests will need:
- **Test library fixture** (already exists in `renderers/helpers/testLibrary.ts`)
- **Sample entity files** (JSON/YAML for file loading tests)
- **Encrypted file fixtures** (for encryption/decryption tests)
- **Workspace directory fixtures** (for workspace init/load tests)

---

## Priority 1 - Core Functionality

These tests validate the primary use cases that users depend on. Failures here severely impact users.

### 1.1 Data Source Loading (High Business Impact)

**File**: `commands/shared/dataSourceLoader.test.ts`

**Why it matters**: All commands depend on successfully loading library data. If this fails, nothing works.

**Key scenarios**:

✅ **Success cases**:
- Load library from directory tree with default options
- Load library with specific collections
- Load library with encryption config
- Load library from mixed JSON and YAML files
- Load with multiple named secrets
- Load with single key from environment variable
- Load with single key from command option
- Handle missing optional secrets gracefully (skip encrypted collections)

❌ **Failure cases**:
- Invalid directory path
- Malformed JSON files
- Malformed YAML files
- Invalid encryption key format (not 32 bytes)
- Missing required secrets (when collection requires it)
- Corrupted encrypted files
- Invalid base64 encoding in secrets file

**Dependencies**: Sample file tree fixtures with entities

**Complexity**: **Moderate** - Requires file system fixtures but straightforward logic

---

### 1.2 Entity File Loading (Medium-High Business Impact)

**File**: `commands/workspace/edit/entityFileLoader.test.ts`

**Why it matters**: Users import entities from files when editing. Failures prevent data entry.

**Key scenarios**:

✅ **Success cases**:
- Load task entity from JSON file
- Load ingredient entity from JSON file
- Load mold entity from JSON file
- Load procedure entity from JSON file
- Load filling entity from YAML file
- Load confection entity from YAML file
- Load any entity type from .yml extension
- Auto-detect format from file extension

❌ **Failure cases**:
- Unsupported file extension (.txt, .xml)
- File not found
- File read permission denied
- Malformed JSON syntax
- Malformed YAML syntax
- Valid JSON but fails entity validation (missing required fields)
- Valid YAML but wrong entity schema
- File is a directory not a file

**Dependencies**: Sample entity files (valid and invalid)

**Complexity**: **Simple** - File I/O and validation, no complex dependencies

---

### 1.3 Workspace Loading and Initialization (High Business Impact)

**File**: `commands/workspace/shared/workspaceContext.test.ts`

**Why it matters**: Workspace is the foundation for interactive editing. Must load reliably.

**Key scenarios**:

✅ **Success cases**:
- Load workspace from valid single-root layout
- Load workspace with builtin data enabled
- Load workspace with builtin data disabled
- Load workspace with pre-warming enabled
- Load workspace with pre-warming disabled
- Load workspace with device name specified
- Load workspace in fail-on-error mode (default)
- Load workspace in warn-on-error mode
- Unlock workspace with correct password
- Skip unlocking (proceed with public collections only)
- Detect workspace with no keystore (state: 'no-keystore')
- Detect already unlocked workspace (state: 'unlocked')

❌ **Failure cases**:
- Workspace directory does not exist
- Workspace directory has no data subdirectory
- Workspace has invalid directory structure
- Workspace unlock with wrong password
- Workspace load with corrupted data files

**Dependencies**: Workspace directory fixtures

**Complexity**: **Moderate** - Requires directory structure fixtures and keystore handling

---

### 1.4 Collection Selector (Medium Business Impact)

**File**: `commands/workspace/edit/collectionSelector.test.ts`

**Why it matters**: Users must select target collections when editing. Wrong collection = data in wrong place.

**Key scenarios**:

✅ **Success cases**:
- Resolve collection when only one exists (auto-select)
- Resolve collection from explicit option string
- Interactive selection when multiple collections exist
- Resolve collection for each entity type (task, ingredient, mold, procedure, filling, confection)
- Handle writable vs read-only collections
- Filter out encrypted collections when not unlocked

❌ **Failure cases**:
- No writable collections available
- Specified collection does not exist
- Specified collection is read-only
- Specified collection is encrypted and not unlocked
- Invalid collection ID format
- User cancels interactive selection

**Dependencies**: Mock workspace with multiple collections

**Complexity**: **Moderate** - Interactive prompt testing (may need mocking @inquirer/prompts)

---

### 1.5 Edit Orchestrator - Add Flow (High Business Impact)

**File**: `commands/workspace/edit/editOrchestrator.add.test.ts`

**Why it matters**: Primary workflow for creating new entities in workspace.

**Key scenarios**:

✅ **Success cases**:
- Add task from interactive prompts
- Add ingredient from interactive prompts
- Add mold from interactive prompts
- Add procedure from interactive prompts
- Add filling from interactive prompts
- Add confection from interactive prompts
- Add entity from file (JSON)
- Add entity from file (YAML)
- Add entity with auto-selected collection
- Add entity with explicitly specified collection
- Extract baseId from imported entity

❌ **Failure cases**:
- Entity missing required baseId field
- Duplicate baseId in target collection
- File import fails validation
- Collection resolution fails
- User cancels during interactive prompt
- Invalid entity data from prompts
- Collection add operation returns failure

**Dependencies**: Mock workspace, mock prompts, sample entity files

**Complexity**: **Complex** - Multiple flows (file vs interactive), collection selection, validation

---

### 1.6 Edit Orchestrator - Edit Flow (High Business Impact)

**File**: `commands/workspace/edit/editOrchestrator.edit.test.ts`

**Why it matters**: Primary workflow for modifying existing entities.

**Key scenarios**:

✅ **Success cases**:
- Edit task by baseId (interactive prompts with pre-filled values)
- Edit ingredient by baseId
- Edit mold by baseId
- Edit procedure by baseId
- Edit filling by baseId
- Edit confection by baseId
- Edit entity in specified collection
- Edit entity with interactive collection selection
- Update entity preserves unchanged fields
- Validate edited entity before saving

❌ **Failure cases**:
- Entity baseId not found in any collection
- Entity baseId not found in specified collection
- Collection is read-only
- User cancels during edit prompt
- Edited data fails validation
- Collection update operation returns failure

**Dependencies**: Mock workspace with existing entities

**Complexity**: **Complex** - Pre-filling prompts, validation, collection updates

---

### 1.7 Edit Orchestrator - Remove Flow (Medium Business Impact)

**File**: `commands/workspace/edit/editOrchestrator.remove.test.ts`

**Why it matters**: Users need to delete incorrect or obsolete entities.

**Key scenarios**:

✅ **Success cases**:
- Remove task by baseId with confirmation
- Remove ingredient by baseId
- Remove entity from specified collection
- Remove entity with interactive collection selection
- Skip removal when user declines confirmation

❌ **Failure cases**:
- Entity baseId not found
- Collection is read-only
- Collection remove operation fails
- User cancels removal

**Dependencies**: Mock workspace, mock confirmation prompts

**Complexity**: **Moderate** - Collection lookup, confirmation, deletion

---

### 1.8 Output Formatting - Entity Data (Medium-High Business Impact)

**File**: `commands/shared/outputFormatter.entityData.test.ts`

**Why it matters**: All show/list commands depend on formatting. Wrong output = user confusion.

**Key scenarios** (not already covered):

✅ **Success cases**:
- Format entity as JSON
- Format entity as YAML
- Format list as human-readable text
- Format list as table
- Format list with custom column configuration
- Format empty list gracefully
- Format entity with missing optional fields
- Apply column width constraints
- Apply column alignment (left, right, center)
- Handle very long values with truncation
- Format nested entity data

❌ **Edge cases**:
- Entity with circular references (should not occur with valid entities)
- Entity with undefined/null values
- Very large datasets (performance)

**Dependencies**: Sample entities from test library

**Complexity**: **Simple** - Pure formatting functions, already partially tested

---

## Priority 2 - Supporting Functionality

These tests validate helpers, formatters, and secondary features. Failures impact user experience but are less severe.

### 2.1 Entity Commands - Ingredient List/Show

**File**: `commands/ingredient/ingredientCommands.test.ts`

**Why it matters**: Common read-only operations users perform to browse data.

**Key scenarios**:

✅ **Success cases**:
- List all ingredients (human format)
- List all ingredients (table format)
- List all ingredients (JSON format)
- List all ingredients (YAML format)
- Filter ingredients by collection
- Filter ingredients by name substring
- Filter ingredients by category
- Filter ingredients by manufacturer
- Filter chocolate ingredients by type
- Show ingredient detail (human format)
- Show ingredient detail (JSON format)
- Show ingredient with all optional fields populated
- Show ingredient with minimal fields

❌ **Failure cases**:
- Data source loading fails
- Invalid ingredient ID for show command
- No ingredients match filter criteria
- Invalid output format specified

**Dependencies**: Test library with diverse ingredients

**Complexity**: **Simple** - Command integration tests, straightforward flows

---

### 2.2 Entity Commands - Filling List/Show

**File**: `commands/filling/fillingCommands.test.ts`

**Why it matters**: Users browse fillings to understand recipe options.

**Key scenarios**:

✅ **Success cases**:
- List all fillings (human, table, JSON, YAML)
- Filter fillings by collection
- Filter fillings by name
- Show filling detail with all variations
- Show filling with ingredient references resolved
- Show filling ganache characteristics
- Show filling procedure references

❌ **Failure cases**:
- Data source loading fails
- Invalid filling ID
- Filling references missing ingredients (should show gracefully)
- No fillings match criteria

**Dependencies**: Test library with fillings

**Complexity**: **Simple** - Similar to ingredient commands

---

### 2.3 Entity Commands - Mold List/Show

**File**: `commands/mold/moldCommands.test.ts`

**Why it matters**: Users need mold specifications for production planning.

**Key scenarios**:

✅ **Success cases**:
- List all molds (all output formats)
- Filter molds by collection
- Filter molds by format (series-1000, series-2000, other)
- Show mold detail with cavity information
- Show mold with measurements

❌ **Failure cases**:
- Data source loading fails
- Invalid mold ID
- No molds match criteria

**Dependencies**: Test library with molds

**Complexity**: **Simple**

---

### 2.4 Entity Commands - Confection List/Show

**File**: `commands/confection/confectionCommands.test.ts`

**Why it matters**: Users browse confection recipes.

**Key scenarios**:

✅ **Success cases**:
- List all confections (all formats)
- Filter by collection
- Filter by name
- Show molded bon bon detail
- Show bar truffle detail
- Show confection with filling references
- Show confection with mold references
- Show confection with procedure references

❌ **Failure cases**:
- Data source loading fails
- Invalid confection ID
- No confections match criteria

**Dependencies**: Test library with confections

**Complexity**: **Simple**

---

### 2.5 Entity Commands - Procedure and Task List/Show

**Files**:
- `commands/procedure/procedureCommands.test.ts`
- `commands/task/taskCommands.test.ts`

**Why it matters**: Users reference procedures and tasks for production workflow.

**Key scenarios**: Similar to other entity commands (list, filter, show, various formats)

**Complexity**: **Simple**

---

### 2.6 Ganache Analysis Command

**File**: `commands/ganache/analyzeCommand.test.ts`

**Why it matters**: Critical for recipe development - validates ganache composition.

**Key scenarios**:

✅ **Success cases**:
- Analyze ganache with default variation
- Analyze ganache with specified variation
- Display composition percentages (cacao fat, milk fat, other fats, sugar, water, solids)
- Display derived values (total fat, fat:water ratio, sugar:water ratio)
- Display validation results (pass/fail)
- Display validation errors
- Display validation warnings
- Format output as human-readable text
- Format output as JSON
- Format output as YAML
- Analyze ganache with all ingredients resolved

❌ **Failure cases**:
- Data source loading fails
- Invalid filling ID
- Filling is not a ganache type
- Variation does not exist
- Ingredient resolution fails
- Analysis calculation fails

**Dependencies**: Test library with ganache fillings

**Complexity**: **Moderate** - Depends on library runtime calculation logic

---

### 2.7 Interactive Browse - Ingredients

**File**: `commands/workspace/browse/browseIngredients.test.ts`

**Why it matters**: Primary way users explore workspace data interactively.

**Key scenarios**:

✅ **Success cases**:
- Build selectable ingredient items from library
- Display ingredient summary in selection list
- Show ingredient detail view
- Navigate to related entities (if actions present)
- Handle back navigation
- Handle exit navigation
- Sort ingredients by ID
- Display ingredient category information

❌ **Failure cases**:
- Empty ingredient library
- User cancels selection
- Navigation to missing related entity

**Dependencies**: Test library, mock menu system

**Complexity**: **Moderate** - Interactive menu testing

---

### 2.8 Interactive Browse - Other Entities

**Files**:
- `commands/workspace/browse/browseFillings.test.ts`
- `commands/workspace/browse/browseMolds.test.ts`
- `commands/workspace/browse/browseProcedures.test.ts`
- `commands/workspace/browse/browseConfections.test.ts`
- `commands/workspace/browse/browseSessions.test.ts`
- `commands/workspace/browse/browseJournals.test.ts`
- `commands/workspace/browse/browseInventory.test.ts`

**Key scenarios**: Similar to browse ingredients (selection, detail view, navigation)

**Complexity**: **Moderate**

---

### 2.9 Menu System

**File**: `commands/workspace/shared/menuSystem.test.ts`

**Why it matters**: Foundation for all interactive commands.

**Key scenarios**:

✅ **Success cases**:
- Show menu with choices
- Show menu with custom page size
- Show menu with back option enabled
- Show menu with exit option enabled
- Show menu without back option
- Show menu without exit option
- Return selected value
- Return 'back' action
- Return 'exit' action
- Show confirmation prompt (default true)
- Show confirmation prompt (default false)
- Show input prompt
- Show info message
- Show success message
- Show error message
- Show warning message
- Breadcrumb navigation (push, pop, display)

❌ **Failure cases**:
- Empty choices array (should handle gracefully)
- User cancels prompt (Ctrl+C)

**Dependencies**: Mock @inquirer/prompts

**Complexity**: **Moderate** - May need to mock console output and @inquirer

---

### 2.10 Workspace Init Command

**File**: `commands/workspace/initCommand.test.ts`

**Why it matters**: First step for users creating new workspaces.

**Key scenarios**:

✅ **Success cases**:
- Initialize workspace in new directory
- Initialize workspace with device name specified
- Initialize workspace with auto-generated device ID from hostname
- Initialize workspace with --yes flag (skip confirmation)
- Initialize workspace in existing empty directory
- Initialize workspace in existing non-empty directory with user confirmation
- Create necessary directory structure
- Create default settings file
- Display success message

❌ **Failure cases**:
- Directory creation fails (permissions)
- User declines confirmation for non-empty directory
- Invalid device name format
- Settings file write fails

**Dependencies**: Temporary directory for testing

**Complexity**: **Moderate** - File system operations, user prompts

---

## Priority 3 - Edge Cases & Error Handling

These tests validate error paths, validation, and unusual inputs. Important for robustness but less critical than core flows.

### 3.1 Entity Validation in Prompts

**Files**:
- `commands/workspace/edit/prompts/taskPrompts.test.ts`
- `commands/workspace/edit/prompts/ingredientPrompts.test.ts`
- `commands/workspace/edit/prompts/moldPrompts.test.ts`
- `commands/workspace/edit/prompts/procedurePrompts.test.ts`
- `commands/workspace/edit/prompts/fillingPrompts.test.ts`
- `commands/workspace/edit/prompts/confectionPrompts.test.ts`

**Why it matters**: Ensures users cannot create invalid entities via interactive prompts.

**Key scenarios**:

✅ **Success cases**:
- Prompt for new task with all required fields
- Prompt for new ingredient with auto-generated baseId
- Prompt for new mold with valid format selection
- Prompt for new procedure with steps
- Prompt for new filling with ingredient selection
- Prompt for new confection with mold selection
- Prompt for edit with pre-filled current values
- Validate entity data before returning

❌ **Failure cases**:
- User provides empty name (required field)
- User provides invalid baseId format
- User selects invalid category
- User enters out-of-range percentage value
- User enters invalid temperature format
- User cancels mid-prompt

**Dependencies**: Mock prompts, converters

**Complexity**: **Complex** - Many entity-specific validation rules

---

### 3.2 Encryption/Decryption Commands

**Files**:
- `commands/encrypt.test.ts`
- `commands/decrypt.test.ts`
- `commands/keygen.test.ts`

**Why it matters**: Users protect sensitive recipe data with encryption.

**Key scenarios**:

✅ **Success cases (encrypt)**:
- Encrypt JSON file with base64 key
- Encrypt file with named secret
- Encrypt file with custom salt
- Encrypt file with custom iterations
- Write encrypted tombstone to output file
- Include metadata in tombstone
- Exclude metadata from tombstone

✅ **Success cases (decrypt)**:
- Decrypt encrypted tombstone with correct key
- Decrypt with named secret
- Write decrypted content to output file
- Decrypt to stdout when no output specified

✅ **Success cases (keygen)**:
- Generate new random 32-byte key
- Output key as base64
- Generate multiple keys

❌ **Failure cases**:
- Invalid key length (not 32 bytes)
- Invalid base64 encoding
- Wrong decryption key (authentication failure)
- Corrupted encrypted data
- Missing required metadata
- Input file not found
- Output file write permission denied

**Dependencies**: Sample JSON files, encrypted file fixtures

**Complexity**: **Moderate** - Crypto operations, file I/O

---

### 3.3 Data Publish/Fetch Commands

**Files**:
- `commands/publishData.test.ts`
- `commands/fetchData.test.ts`

**Why it matters**: Users share and sync recipe libraries.

**Key scenarios**:

✅ **Success cases (publish)**:
- Publish workspace data to destination directory
- Copy all entity files
- Preserve directory structure
- Handle encrypted collections
- Handle public collections

✅ **Success cases (fetch)**:
- Fetch published data to workspace
- Download from remote source (if implemented)
- Update local workspace data
- Preserve local user data

❌ **Failure cases**:
- Source directory not found
- Destination directory not writable
- Partial copy failure (some files fail)
- Network failure (if remote fetch)
- Version mismatch (if versioning implemented)

**Dependencies**: Sample workspace and published data directories

**Complexity**: **Moderate** - Directory operations, potential network I/O

---

### 3.4 Keystore Command

**File**: `commands/workspace/keystoreCommand.test.ts`

**Why it matters**: Users manage encryption keys for protected collections.

**Key scenarios**:

✅ **Success cases**:
- Initialize new keystore with password
- Add secret to keystore
- List secrets in keystore
- Remove secret from keystore
- Change keystore password
- Lock keystore
- Unlock keystore with correct password

❌ **Failure cases**:
- Initialize keystore that already exists
- Wrong password on unlock
- Add duplicate secret name
- Remove non-existent secret
- Change password with wrong old password
- Weak password (if validation exists)

**Dependencies**: Temporary workspace for keystore

**Complexity**: **Moderate** - Keystore operations, password handling

---

### 3.5 Edit Orchestrator - Export Flow

**File**: `commands/workspace/edit/editOrchestrator.export.test.ts`

**Why it matters**: Users export entities to files for sharing or backup.

**Key scenarios**:

✅ **Success cases**:
- Export task to JSON file
- Export ingredient to YAML file
- Export from specified collection
- Export with interactive collection selection
- Overwrite existing file with confirmation
- Create output directory if missing

❌ **Failure cases**:
- Entity baseId not found
- Output file write permission denied
- User declines overwrite confirmation
- Invalid output format specified
- Collection resolution fails

**Dependencies**: Mock workspace, temporary output directory

**Complexity**: **Moderate** - File I/O, prompts

---

### 3.6 Interactive Select (Shared Utility)

**File**: `commands/shared/interactiveSelect.test.ts`

**Why it matters**: Reusable selection utility used across commands.

**Key scenarios**:

✅ **Success cases**:
- Select from list of items with fuzzy search
- Filter items by name
- Filter items by description
- Display items with pagination
- Return selected item
- Handle single-item list (auto-select or still prompt)

❌ **Failure cases**:
- Empty items list
- User cancels selection
- No items match search filter

**Dependencies**: Mock @inquirer/prompts

**Complexity**: **Simple** - Wrapper around inquirer

---

### 3.7 Command Builder (Shared Utility)

**File**: `commands/shared/commandBuilder.test.ts`

**Why it matters**: Ensures consistent command option parsing.

**Key scenarios**:

✅ **Success cases**:
- Add common filter options (collection, name)
- Add output format option (human, table, json, yaml)
- Add encryption options (key, secrets)
- Parse command options correctly
- Validate required options
- Apply default values

❌ **Failure cases**:
- Missing required option
- Invalid option value type
- Conflicting options

**Dependencies**: Mock commander

**Complexity**: **Simple** - Option parsing

---

## Testing Infrastructure Needs

### Test Fixtures

**Priority 1 (Needed immediately)**:

1. **testLibrary.ts** - ✅ Already exists
2. **sampleEntityFiles/** - Create sample JSON/YAML files for each entity type
3. **workspaceFixtures/** - Sample workspace directory structures
4. **encryptedFiles/** - Encrypted file tombstones for encryption tests

**Priority 2 (Needed for interactive tests)**:

5. **mockPrompts.ts** - Mock utilities for @inquirer/prompts
6. **mockFileSystem.ts** - In-memory file system for testing (or use tmp directories)

### Test Utilities

**Create helpers**:

1. `createMockWorkspace()` - Returns mock IWorkspace with configurable collections
2. `createTempDirectory()` - Creates temporary directory for file tests
3. `cleanupTempDirectory()` - Removes temporary files after tests
4. `mockInquirer()` - Mocks @inquirer/prompts for interactive tests
5. `captureConsoleOutput()` - Captures console.log/error for testing display commands

### Testing Challenges

**Interactive Commands** (browse, edit):
- Need to mock @inquirer/prompts
- May be difficult to test full interactive flows
- Consider testing individual prompt functions separately

**File System Operations**:
- Use temporary directories for workspace init, publish, fetch tests
- Clean up after each test to avoid pollution
- May need platform-specific path handling

**Encryption**:
- Need deterministic test keys (not random)
- Create encrypted fixtures in advance
- Test with known plaintext/ciphertext pairs

**Asynchronous Operations**:
- Most commands are async (file I/O, prompts)
- Ensure proper async/await in tests
- Handle Promise rejections correctly

---

## Test Development Roadmap

### Phase 1: Foundation (Priority 1, Core)
**Estimated effort**: 3-5 days

1. Data Source Loader tests
2. Entity File Loader tests
3. Workspace Context tests
4. Output Formatter entity data tests

**Deliverable**: Core data loading and formatting fully tested

---

### Phase 2: Edit Workflows (Priority 1, High Impact)
**Estimated effort**: 4-6 days

1. Collection Selector tests
2. Edit Orchestrator Add Flow tests
3. Edit Orchestrator Edit Flow tests
4. Edit Orchestrator Remove Flow tests

**Deliverable**: Interactive editing workflows fully tested

---

### Phase 3: Entity Commands (Priority 2)
**Estimated effort**: 3-4 days

1. Ingredient commands tests
2. Filling commands tests
3. Mold commands tests
4. Confection commands tests
5. Procedure and Task commands tests

**Deliverable**: All read-only entity commands tested

---

### Phase 4: Analysis and Interactive (Priority 2)
**Estimated effort**: 3-4 days

1. Ganache analysis tests
2. Menu system tests
3. Browse commands tests (all entity types)
4. Workspace init tests

**Deliverable**: Analysis and interactive features tested

---

### Phase 5: Edge Cases (Priority 3)
**Estimated effort**: 4-5 days

1. Entity prompt validation tests
2. Encryption/decryption tests
3. Publish/fetch data tests
4. Keystore tests
5. Export flow tests
6. Shared utility tests

**Deliverable**: Comprehensive edge case and error handling coverage

---

## Success Criteria

### Functional Coverage (Not Percentage)

- ✅ All entity loading scenarios work correctly
- ✅ All output formats produce valid output
- ✅ All edit workflows (add/edit/remove/export) function as expected
- ✅ All entity commands (list/show) handle filters correctly
- ✅ Ganache analysis produces accurate calculations
- ✅ Interactive browsing navigates correctly
- ✅ Encryption/decryption protects data correctly
- ✅ Workspace initialization creates valid workspaces

### Test Quality

- ✅ All tests use Result pattern matchers correctly
- ✅ No fragile mocks - use test classes or real objects
- ✅ Tests are behavior-focused, not implementation-coupled
- ✅ Error messages provide clear context
- ✅ Tests are maintainable and readable

### Documentation

- ✅ Each test file has clear describe blocks
- ✅ Test names describe expected behavior
- ✅ Complex test scenarios have explanatory comments
- ✅ Fixtures are documented and reusable

---

## Risk Assessment

### High Risk Areas

1. **Interactive prompt testing** - May be difficult to mock @inquirer/prompts reliably
   - Mitigation: Test prompt logic separately from UI interactions

2. **File system operations** - Platform differences, permissions, cleanup
   - Mitigation: Use temporary directories, proper cleanup in afterEach

3. **Encryption** - Crypto operations can be complex to test
   - Mitigation: Use known test vectors, fixed test keys

4. **Async operations** - Race conditions, unhandled rejections
   - Mitigation: Proper async/await, jest async timeout configuration

### Medium Risk Areas

1. **Workspace loading** - Complex directory structures
   - Mitigation: Create minimal but representative fixtures

2. **Collection management** - Many edge cases
   - Mitigation: Systematic testing of all entity types

3. **Output formatting** - Many format variations
   - Mitigation: Table-driven tests with multiple input/output pairs

---

## Appendix: File Listing

### Source Files by Category

**Core Data Loading** (Priority 1):
- `commands/shared/dataSourceLoader.ts` (100 lines)
- `commands/shared/outputFormatter.ts` (partially tested, ~300 lines)
- `commands/workspace/shared/workspaceContext.ts` (100 lines)
- `commands/workspace/edit/entityFileLoader.ts` (119 lines)

**Edit Orchestration** (Priority 1):
- `commands/workspace/edit/editOrchestrator.ts` (large file, multiple flows)
- `commands/workspace/edit/collectionSelector.ts`
- `commands/workspace/edit/prompts/*.ts` (6 files, entity-specific prompts)

**Entity Commands** (Priority 2):
- `commands/ingredient/*.ts` (4 files)
- `commands/filling/*.ts` (5 files)
- `commands/mold/*.ts` (4 files)
- `commands/confection/*.ts` (4 files)
- `commands/procedure/*.ts` (4 files)
- `commands/task/*.ts` (4 files)

**Analysis** (Priority 2):
- `commands/ganache/analyzeCommand.ts`

**Interactive** (Priority 2):
- `commands/workspace/browseCommand.ts`
- `commands/workspace/browse/*.ts` (9 files, entity-specific browsers)
- `commands/workspace/shared/menuSystem.ts`

**Utilities** (Priority 2-3):
- `commands/shared/interactiveSelect.ts`
- `commands/shared/commandBuilder.ts`

**Encryption** (Priority 3):
- `commands/encrypt.ts`
- `commands/decrypt.ts`
- `commands/keygen.ts`
- `commands/workspace/keystoreCommand.ts`

**Data Management** (Priority 3):
- `commands/publishData.ts`
- `commands/fetchData.ts`
- `commands/workspace/initCommand.ts`

**Already Tested**:
- `commands/workspace/renderers/*.ts` (8 files) ✅
- `commands/shared/outputFormatter.ts` (partially) ✅

---

## Summary

This plan provides **~30 test files** covering **~90 source files** with a focus on **functional correctness** rather than coverage metrics. Tests are prioritized by user impact and organized into logical development phases.

The plan is actionable: each test area includes specific scenarios, expected dependencies, and complexity estimates. A developer can pick up any section and immediately understand what needs to be tested and why it matters.

**Key principle**: Write tests that validate behavior users care about, not tests to hit arbitrary coverage numbers.
