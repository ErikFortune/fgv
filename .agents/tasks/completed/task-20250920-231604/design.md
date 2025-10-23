# Technical Design: Fix ts-res-browser Import Error

## Overview

This design addresses the breaking changes introduced by the FileTree refactor in ts-res-ui-components, specifically the removal of `importDirectory` and `importFiles` methods in favor of FileTree-based import methods.

## Problem Analysis

### Current State (Broken)
```typescript
// ts-res-browser/src/App.tsx - Lines 186, 211, 355
actions.importFiles(data);  // Method no longer exists

// ts-res-browser/src/App.tsx - Lines 188, 215, 357
actions.importDirectory(data);  // Method no longer exists
```

### New API (Available)
```typescript
// From IOrchestratorActions interface
importFileTree: (fileTree: FileTree.FileTree) => Promise<void>;
importFileTreeWithConfig: (
  fileTree: FileTree.FileTree,
  config: Config.Model.ISystemConfiguration
) => Promise<void>;
```

## Migration Strategy

### 1. Import Statement Updates

**Current imports:**
```typescript
import {
  ImportView,
  SourceView,
  FilterView,
  CompiledView,
  ResolutionView,
  ConfigurationView,
  ResourceOrchestrator,
  IOrchestratorState,
  IOrchestratorActions
} from '@fgv/ts-res-ui-components';
```

**Required imports:**
```typescript
import {
  ImportView,
  SourceView,
  FilterView,
  CompiledView,
  ResolutionView,
  ConfigurationView,
  ResourceOrchestrator,
  IOrchestratorState,
  IOrchestratorActions
} from '@fgv/ts-res-ui-components';
import { FileTree } from '@fgv/ts-json-base';
```

### 2. Data Type Analysis

Based on the current code comments and context, the application receives data in legacy formats:

1. **File Arrays:** `IImportedFile[]` - Array of individual files
2. **Directory Objects:** `IImportedDirectory` - Structured directory with files

Both need conversion to `FileTree.FileTree` format.

### 3. Code Migration Locations

#### Location 1: Import View Handler (Lines 184-190)
```typescript
// CURRENT (Broken)
onImport={(data) => {
  if (Array.isArray(data)) {
    actions.importFiles(data);
  } else {
    actions.importDirectory(data);
  }
}}

// NEW (Target)
onImport={async (data) => {
  if (Array.isArray(data)) {
    // Convert IImportedFile[] to FileTree.FileTree
    const fileTree = convertFilesToFileTree(data);
    await actions.importFileTree(fileTree);
  } else {
    // Convert IImportedDirectory to FileTree.FileTree
    const fileTree = convertDirectoryToFileTree(data);
    await actions.importFileTree(fileTree);
  }
}}
```

#### Location 2: ZIP Import Handler (Lines 209-217)
```typescript
// CURRENT (Broken)
if (Array.isArray(zipData)) {
  actions.importFiles(zipData);
  actions.addMessage('success', `${zipData.length} files imported from ZIP`);
} else {
  actions.importDirectory(zipData);
  actions.addMessage('success', 'ZIP directory structure imported successfully');
}

// NEW (Target)
if (Array.isArray(zipData)) {
  const fileTree = convertFilesToFileTree(zipData);
  await actions.importFileTree(fileTree);
  actions.addMessage('success', `${zipData.length} files imported from ZIP`);
} else {
  const fileTree = convertDirectoryToFileTree(zipData);
  await actions.importFileTree(fileTree);
  actions.addMessage('success', 'ZIP directory structure imported successfully');
}
```

#### Location 3: Configuration View Import (Lines 354-359)
```typescript
// CURRENT (Broken)
onImport={(data) => {
  if (Array.isArray(data)) {
    actions.importFiles(data);
  } else {
    actions.importDirectory(data);
  }
}}

// NEW (Target)
onImport={async (data) => {
  if (Array.isArray(data)) {
    const fileTree = convertFilesToFileTree(data);
    await actions.importFileTree(fileTree);
  } else {
    const fileTree = convertDirectoryToFileTree(data);
    await actions.importFileTree(fileTree);
  }
}}
```

### 4. Conversion Utility Functions

Since FileTree conversion utilities may not be directly available, implement conversion helpers:

```typescript
// Utility functions to add to App.tsx or separate utility file
function convertFilesToFileTree(files: IImportedFile[]): FileTree.FileTree {
  // Implementation depends on IImportedFile structure
  // Convert array of files to FileTree format
}

function convertDirectoryToFileTree(directory: IImportedDirectory): FileTree.FileTree {
  // Implementation depends on IImportedDirectory structure
  // Convert directory structure to FileTree format
}
```

### 5. Async/Await Handling

All import operations are now async and must be handled properly:

1. **onImport handlers** must be async functions
2. **await** all `actions.importFileTree()` calls
3. **Error handling** for async operations
4. **UI loading states** if needed

### 6. Type Safety Considerations

1. **Legacy Type Removal:** Since `IImportedFile` and `IImportedDirectory` are removed, may need to:
   - Define local interfaces temporarily
   - Use type assertions for legacy data
   - Implement runtime type checking

2. **FileTree Type Validation:** Ensure converted data conforms to `FileTree.FileTree` interface

## Implementation Plan

### Phase 1: Core Migration
1. Add FileTree import
2. Implement conversion utilities
3. Update all import handlers to use new async API
4. Add proper error handling

### Phase 2: Type Safety
1. Resolve any type errors from legacy interface removal
2. Add runtime validation for conversion functions
3. Implement proper error boundaries

### Phase 3: Testing & Validation
1. Test with existing sample data
2. Validate ZIP import workflows
3. Ensure configuration import still works
4. Performance testing for conversion functions

## Risk Mitigation

1. **Incremental Migration:** Update one handler at a time
2. **Fallback Strategy:** Keep error handling robust to detect conversion failures
3. **Type Safety:** Use proper TypeScript types and runtime validation
4. **Testing:** Comprehensive testing with existing test data

## Success Criteria

1. **No Runtime Errors:** Application loads without import-related errors
2. **Functional Import:** All import workflows work as before
3. **Type Safety:** No TypeScript compilation errors
4. **Performance:** No significant performance degradation in import operations

## Dependencies

- `@fgv/ts-json-base` for FileTree types (already available)
- Understanding of legacy `IImportedFile` and `IImportedDirectory` structures
- Access to FileTree conversion utilities or implementation guidance