# Requirements Analysis: Fix ts-res-browser Import Error

## Business Context

**Issue**: ts-res-browser fails with "actions.importDirectory is not a function" error when attempting to import resources.

**Root Cause**: The FileTree refactor in ts-res-ui-components broke backward compatibility by removing the old import methods (`importDirectory` and `importFiles`) and replacing them with new FileTree-based methods.

**Impact**:
- ts-res-browser is completely non-functional for importing resources
- Users cannot load resource directories or files into the application
- Blocks core functionality of the ts-res-browser tool

## Requirements Confirmation

### Missing Action Methods Analysis
The following action methods are called in ts-res-browser but no longer exist in IOrchestratorActions:

1. **`actions.importFiles(data)`** - Called at lines 186, 211, 355
2. **`actions.importDirectory(data)`** - Called at lines 188, 215, 357

### New Action Methods Available
The FileTree refactor provides these replacement methods:

1. **`importFileTree: (fileTree: FileTree.FileTree) => Promise<void>`**
2. **`importFileTreeWithConfig: (fileTree: FileTree.FileTree, config: Config.Model.ISystemConfiguration) => Promise<void>`**

### Required Migration

**For Directory Import:**
- Replace `actions.importDirectory(data)` calls with `actions.importFileTree(fileTreeData)`
- Convert IImportedDirectory data to FileTree.FileTree format
- Handle async nature of new import method

**For File Array Import:**
- Replace `actions.importFiles(data)` calls with `actions.importFileTree(fileTreeData)`
- Convert IImportedFile[] array to FileTree.FileTree format
- Handle async nature of new import method

## Acceptance Criteria

1. **Functional Requirements:**
   - ts-res-browser can successfully import directory structures
   - ts-res-browser can successfully import file arrays
   - ZIP import functionality continues to work
   - Configuration loading with imports continues to work

2. **Technical Requirements:**
   - Remove all calls to deprecated `importDirectory` and `importFiles` methods
   - Implement proper data conversion from legacy formats to FileTree format
   - Add proper error handling for async import operations
   - Maintain existing user experience and workflow

3. **Compatibility Requirements:**
   - Maintain backward compatibility with existing test data formats
   - Preserve ZIP import workflow functionality
   - Ensure configuration loading during import still works

## Risk Assessment

**Risk Level:** Medium
- Core functionality broken but fix is well-defined
- Clear migration path available with new FileTree API
- Risk of data conversion errors during format migration

**Mitigation:**
- Careful testing with existing test data
- Thorough validation of FileTree conversion logic
- Regression testing of all import workflows

## Scope

**In Scope:**
- Update all `importDirectory` calls to use `importFileTree`
- Update all `importFiles` calls to use `importFileTree`
- Implement data conversion utilities for legacy formats
- Add proper async/await handling
- Test with existing sample data

**Out of Scope:**
- Changes to ts-res-ui-components (already updated)
- Changes to underlying FileTree implementation
- UI/UX modifications beyond what's needed for functionality

## Dependencies

- ts-res-ui-components already has FileTree-based import methods
- FileTree package provides data conversion utilities
- No external dependencies need updating

## Success Criteria

- ts-res-browser starts without import-related errors
- Sample project data loads successfully
- ZIP imports work correctly
- Configuration imports work correctly
- All existing test scenarios pass