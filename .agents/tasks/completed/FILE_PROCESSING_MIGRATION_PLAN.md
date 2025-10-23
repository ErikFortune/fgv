# FileProcessing Migration Plan - Direct FileTree Integration

## Context & Decision

**Date**: 2025-01-18
**Decision**: Migrate ts-res-ui-components fileProcessing utilities to use FileTree directly (no adapters)
**Rationale**: Breaking changes more acceptable now, adapters accumulate technical debt, direct integration enables better interoperability

## Migration Analysis

### Current vs Target Interfaces

**Current (`IImportedFile`)**:
```typescript
interface IImportedFile {
  name: string;          // File name only
  path?: string;         // Full path (optional)
  content: string;       // Text content
  type?: string;         // MIME type (optional)
}

interface IImportedDirectory {
  name: string;
  path?: string;
  files: IImportedFile[];
  subdirectories?: IImportedDirectory[];
}
```

**Target (FileTree `IFileTreeFileItem`)**:
```typescript
interface IFileTreeFileItem {
  type: 'file';
  absolutePath: string;              // Full path (required)
  name: string;                     // File name only
  baseName: string;                 // Name without extension
  extension: string;                // File extension
  getContents(): Result<JsonValue>; // Parsed JSON
  getRawContents(): Result<string>; // Raw text content ✅
}

interface IFileTreeDirectoryItem {
  type: 'directory';
  absolutePath: string;
  name: string;
  // Navigation methods instead of nested arrays
}
```

### Key Changes Required

1. **Content Access Pattern**
   - From: `file.content` (direct string)
   - To: `file.getRawContents().orThrow()` (Result pattern)
   - **Impact**: Better error handling, need to handle Results

2. **Path Property**
   - From: `file.path` (optional)
   - To: `file.absolutePath` (required)
   - **Impact**: Simple property rename

3. **Directory Structure**
   - From: Nested `files[]` and `subdirectories[]`
   - To: Navigation API (`listDirectory()`, iteration)
   - **Impact**: Different traversal patterns

4. **MIME Type Handling**
   - From: Preserved from File API
   - To: **LOST** - need preservation strategy
   - **Impact**: Need to capture and store MIME info separately

## Files Requiring Changes

### Core Implementation (10+ files)
1. `src/utils/fileProcessing.ts` - Complete rewrite
2. `src/components/views/ImportView/index.tsx` - Directory processing
3. `src/utils/tsResIntegration.ts` - File content access
4. `src/utils/zipLoader/zipProcessingHelpers.ts` - Directory building
5. `src/components/orchestrator/ResourceOrchestrator.tsx` - Import handling
6. `src/hooks/useResourceData.ts` - File processing pipeline
7. `src/types/index.ts` - Interface updates

### Tests (3+ files)
8. `src/test/unit/utils/fileProcessing.test.ts` - Core utilities
9. `src/test/unit/utils/tsResIntegration.test.ts` - Integration tests
10. Additional component tests using file imports

### Exports/Namespaces
11. `src/namespaces/ImportTools.ts` - Type exports and utilities

## Migration Strategy

### Phase 1: Move Export Utilities to ts-web-extras
1. Create file export module in ts-web-extras (file-api-types or new module)
2. Move `exportAsJson()` and `exportUsingFileSystemAPI()`
3. Add enhanced fallback patterns (FileSystemAPI → blob download)

### Phase 2: Core Interface Migration
1. **Update `IImportedFile` interface** - replace with FileTree navigation
2. **Replace fileProcessing utilities** with FileTree helpers
3. **Handle MIME type preservation** - capture from File API, store in metadata/map

### Phase 3: Update All Consumers
1. **ImportView**: Rewrite directory processing logic
2. **Integration utilities**: Update file content access patterns
3. **Error handling**: Implement Result pattern throughout
4. **Zip processing**: Update directory tree building

### Phase 4: Testing & Validation
1. **Update test suites** for new interfaces
2. **Verify all file import flows** work correctly
3. **Test error handling** with Result patterns
4. **Validate MIME type preservation** where needed

## MIME Type Preservation Strategy

Since FileTree doesn't preserve MIME types, we need to:

1. **Capture during FileList processing**:
   ```typescript
   const mimeTypeMap = new Map<string, string>();
   for (const file of fileList) {
     mimeTypeMap.set(file.name, file.type);
   }
   ```

2. **Store as metadata** alongside FileTree
3. **Provide lookup utility** for consumers that need MIME info

## Risk Mitigation

### Rollback Plan
- Git branch for migration work
- Can revert to adapter approach if complexity becomes unmanageable
- Keep original implementation in git history

### Testing Strategy
- Comprehensive test updates before changing implementation
- Validate each consumer independently
- End-to-end testing of file import workflows

### Gradual Migration
- Start with utility functions
- Move to single consumer (e.g., ImportView)
- Expand to remaining consumers once patterns established

## Success Criteria

1. **All existing file import flows work** without functional regression
2. **Error handling improved** through Result pattern adoption
3. **Code consolidation achieved** - eliminate duplicate tree building
4. **MIME type information preserved** where originally available
5. **No breaking changes to public APIs** that external consumers rely on

## Timeline Estimate

- **Phase 1** (Export utilities): 2-4 hours ✅ COMPLETED
- **Phase 2** (Core migration): 4-6 hours ✅ COMPLETED
- **Phase 3** (Consumer updates): 6-8 hours 🔄 IN PROGRESS
- **Phase 4** (Testing): 2-4 hours
- **Total**: 14-22 hours over multiple sessions

## Testing Strategy Benefits

**Key Insight**: Moving to FileTree abstraction dramatically improves testability:

- **Before**: Complex File API mocking, FileList creation, browser environment dependencies
- **After**: Use `FileTree.inMemory()` for most test scenarios - no mocking needed!

### Testing Approach
1. **FileTree-based tests**: Use InMemoryTree with known file structures
2. **Integration tests**: Test FileTreeHelpers with real File objects where needed
3. **Consumer tests**: Test business logic using InMemoryTree, avoiding File API mocking
4. **E2E verification**: Manual browser testing for File API integration

This approach eliminates most mocking complexity and makes tests more reliable and maintainable.

## Progress Update

### ✅ Completed
- Export utilities moved to ts-web-extras with enhanced error handling
- Core fileProcessing.ts migrated to use FileTree directly
- MIME type preservation implemented and working
- Directory structure conversion using FileTree navigation API
- Build system integration successful

### 🔄 Current Phase: Consumer Updates
- Update ImportView to handle Result pattern for file content access
- Update other components that process file imports
- Convert .orThrow() usage to proper Result handling where appropriate

### 📋 Remaining
- Fix jest environment File API issues (low priority - InMemoryTree eliminates most)
- Manual browser testing for File API integration
- Documentation updates

## Notes

- FileTree's `getRawContents()` method makes this migration much more feasible than initially assessed
- Breaking changes are acceptable now vs. future when APIs stabilize
- Direct integration provides better interoperability with other ts-web-extras consumers
- Result pattern adoption is a net positive for error handling consistency
- **Testing becomes much simpler** with FileTree abstraction - most tests can use InMemoryTree