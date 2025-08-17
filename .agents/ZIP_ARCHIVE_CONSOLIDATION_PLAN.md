# ZIP Source archive Consolidation Plan

## Overview

Consolidate ZIP archive functionality from tools/ts-res-cli, libraries/ts-extras, and libraries/ts-res-ui-components into a new zip-archive packlet in ts-res. Use fflate for browser compatibility and consistent implementation across all environments.  Maintain full compatibility with the ZipArchiver from tools/ts-res-cli - the resulting archive should contain an optional configuration plus the original resource sources, with directory structure preserved and optional validation but no other processing or transformation.

## Current State Analysis

**tools/ts-res-cli:**
- Creates a zip archive to pass to ts-res-browser, allowing command line invocation of the browser with local files

**libraries/ts-extras:**
- Contains `zip-file-tree` packlet with `ZipFileTreeAccessors` class
- Uses **fflate ~0.8.2** for browser-safe ZIP reading
- Implements `FileTree.IFileTreeAccessors` interface for ZIP archives
- Read-only ZIP access with efficient file content loading

**libraries/ts-res-ui-components:**
- Contains comprehensive ZIP bundle management in `utils/zipLoader/`
- Uses ts-extras `ZipFileTreeAccessors` (fflate-based) for ZIP reading
- Implements `BrowserZipLoader` with full ZIP lifecycle management
- Defines ZIP bundle format with manifest.json, config.json, and structured resources
- Has placeholder `NodeZipBuilder` that delegates to external tools

## Proposed zip-archive Packlet Structure

```
libraries/ts-res/src/packlets/zip-archive/
├── index.ts                    // Public exports
├── zipArchiveCreator.ts        // ZIP creation (server/browser using fflate)
├── zipArchiveLoader.ts         // ZIP loading (universal, uses ts-extras foundation)
├── zipArchiveFormat.ts         // Bundle format definitions and validation
├── types.ts                   // TypeScript interfaces
└── utils.ts                   // Shared utilities
```

## Key Design Decisions

1. **Standardize on fflate**: Use fflate for both reading and writing across all environments
2. **Extend ts-extras foundation**: Build on existing `ZipFileTreeAccessors` rather than replace
3. **Unified ZIP archive format**: Common implementation shared across all tools
4. **Preserve existing APIs**: Maintain compatibility with current implementations
5. **Separate concerns**: JSON bundles remain completely unaffected - they are a separate feature

## Core Functionality to Implement

### ZIP Archive Creation (New - Simplified Initial Implementation)
```typescript
// ZIP archive creation using fflate for universal compatibility
export class ZipArchiveCreator {
  /**
   * Create a ZIP archive from file system paths (compatible with existing ZipArchiver)
   * @param options - Input paths and configuration (matches existing ZipArchiveOptions)
   * @returns Result containing ZIP buffer and manifest
   */
  async create(options: {
    input?: string;           // File or directory path
    config?: string;          // Optional config file path
    outputDir?: string;       // Optional output directory (for Node.js file saving)
  }): Promise<Result<ZipArchiveResult>>;

  // Future extensions (not implemented in this phase):
  // - createFromFiles() for browser file imports
  // - saveToFile() for explicit file saving 
  // - downloadInBrowser() for browser downloads
}
```

### ZIP Archive Loading (Consolidated from ts-res-ui-components)
```typescript
// ZIP archive loading extending ts-extras foundation
export class ZipArchiveLoader {
  /**
   * Load ZIP archive from File object (Browser)
   * @param file - File object from file input
   * @param options - Loading options
   * @param onProgress - Optional progress callback
   * @returns Result containing loaded archive data
   */
  async loadFromFile(
    file: File,
    options?: ZipArchiveLoadOptions,
    onProgress?: ZipArchiveProgressCallback
  ): Promise<Result<ZipArchiveLoadResult>>;

  /**
   * Load ZIP archive from ArrayBuffer (Universal)
   * @param buffer - ZIP data buffer
   * @param options - Loading options  
   * @param onProgress - Optional progress callback
   * @returns Result containing loaded archive data
   */
  async loadFromBuffer(
    buffer: ArrayBuffer,
    options?: ZipArchiveLoadOptions,
    onProgress?: ZipArchiveProgressCallback
  ): Promise<Result<ZipArchiveLoadResult>>;

  /**
   * Load ZIP archive from file path (Node.js)
   * @param filePath - Path to ZIP file
   * @param options - Loading options
   * @param onProgress - Optional progress callback
   * @returns Result containing loaded archive data
   */
  async loadFromPath(
    filePath: string,
    options?: ZipArchiveLoadOptions,
    onProgress?: ZipArchiveProgressCallback
  ): Promise<Result<ZipArchiveLoadResult>>;
}
```

### ZIP Archive Format (Standardized)
```typescript
// Standardized manifest format compatible with existing tools
export interface ZipArchiveManifest {
  /** Archive creation timestamp */
  timestamp: string;
  
  /** Optional input source information */
  input?: {
    type: 'file' | 'directory';
    originalPath: string;     // Original file/directory path
    archivePath: string;      // Path within archive (e.g., "input/mydir")
  };
  
  /** Optional configuration file information */
  config?: {
    type: 'file';
    originalPath: string;     // Original config file path  
    archivePath: string;      // Path within archive (e.g., "config.json")
  };
}

// Result types
export interface ZipArchiveResult {
  zipBuffer: Uint8Array;           // Raw ZIP data
  manifest: ZipArchiveManifest;    // Archive manifest
  size: number;                    // Total ZIP size in bytes
}

export interface ZipArchiveLoadResult {
  manifest: ZipArchiveManifest | null;       // Parsed manifest
  config: SystemConfiguration | null;        // Loaded configuration  
  files: ImportedFile[];                      // All files in archive
  directory: ImportedDirectory | null;       // Directory structure
  processedResources?: ProcessedResources;    // Auto-processed resources (optional)
}

// Options and callbacks
export interface ZipArchiveLoadOptions {
  /** Automatically process resources using ts-res */
  autoProcessResources?: boolean;
  
  /** Override configuration for processing */
  overrideConfig?: SystemConfiguration;
  
  /** Validate manifest strictly */
  strictManifestValidation?: boolean;
}

export type ZipArchiveProgressCallback = (
  stage: 'reading-file' | 'parsing-zip' | 'loading-manifest' | 'loading-config' | 'extracting-files' | 'processing-resources',
  progress: number,  // 0-100
  details: string
) => void;

// Constants
export const ZipArchiveConstants = {
  MANIFEST_FILE: 'manifest.json',
  CONFIG_FILE: 'config.json',
  INPUT_DIR: 'input',
  CONFIG_DIR: 'config'
} as const;
```


## Migration Strategy

### Phase 1: Create zip-archive packlet ✅ COMPLETED
1. ✅ Create new packlet structure in ts-res
2. ✅ Implement ZIP creation using fflate (server and browser) with FileTree support
3. ✅ Implement unified ZIP loading that extends ts-extras
4. ✅ Define standardized ZIP bundle format with proper manifest support
5. ✅ Comprehensive unit tests achieving excellent coverage (100% for creator, loader, types, json)
6. ✅ Idempotency test using data/test/ts-res/custom-config validates round-trip integrity
7. ✅ FileItem interface support for both file paths and FileTree items
8. ✅ Progress callback support for all operations
9. ✅ Proper error handling with Result pattern throughout

### Phase 2: Update ts-res-browser-cli ✅ COMPLETED
1. ✅ Replaced archiver dependency with new zip-archive packlet
2. ✅ Updated ZipArchiver class to use ZipArchiveCreator internally
3. ✅ Maintained complete API compatibility - no breaking changes
4. ✅ Removed archiver and @types/archiver dependencies
5. ✅ All CLI workflows work identically (input+config, input-only, config-only, single files, directories)
6. ✅ Manifest format is fully compatible with existing consumers
7. ✅ ZIP structure matches previous implementation exactly

### Phase 3: Add ZIP archive format to ts-res-cli ✅ COMPLETED
1. ✅ Added new `archive` command to ts-res-cli (better design than adding to compile command)
2. ✅ Implemented `ts-res-compile archive` with options for input, config, and output paths
3. ✅ Uses new zip-archive packlet for ZIP file creation with full progress callback support
4. ✅ Maintains complete separation from compilation - archive is about packaging, not transformation
5. ✅ Supports all input combinations: input+config, input-only, config-only, single files, directories
6. ✅ Provides verbose mode with progress reporting and detailed manifest output
7. ✅ Proper error handling and validation for all edge cases
8. ✅ **Comprehensive idempotency integration test** validates complete round-trip fidelity
   - Creates bundle from source files → Creates ZIP from source files → Recreates bundle from ZIP
   - Verifies identical bundles (excluding timestamps) proving complete data preservation
   - Uses real-world test data from `data/test/ts-res/custom-config`
   - Validates directory structure, file content, and configuration preservation

### Phase 4: Migrate ts-res-ui-components
1. Update ts-res-ui-components to use new zip-archive packlet
2. Remove duplicated ZIP logic from utils/zipLoader
3. Remove redundant functionality from ZipTools, deprecating ZipTools if all functionality can be retired.
4. Maintain existing component APIs apart from ZipTools

### Phase 5: Cleanup
1. Remove dependencies on jszip and archiver across tools
2. Standardize all projects on fflate via ts-res zip-archive
3. Update ts-extras if needed to support enhanced functionality
4. Remove duplicated implementations

## Benefits of This Approach

1. **Single Source of Truth**: All ZIP functionality centralized in ts-res
2. **Consistent Library**: fflate used everywhere for browser compatibility and performance
3. **Preserved Functionality**: All existing features maintained and enhanced
4. **Better Integration**: Direct integration with ts-res archive system and types
5. **Future-Proof**: Extensible architecture for additional ZIP functionality
6. **Clear Separation**: JSON bundles and ZIP archives remain distinct features

## Dependencies to Add/Remove

### Add
- Add `fflate` as dependency to ts-res (already used in ts-extras)

### Remove (in Phase 4)
- Remove `jszip` from browser tools
- Remove `archiver` from CLI tools (once ZIP creation is implemented)

## Backward Compatibility

- JSON bundle format remains completely unchanged and supported
- ZIP archive format designed to be compatible with current manifest structure from ts-res-browser-cli
- All existing tools continue to work without modification during migration

## Implementation Notes

- JSON bundles and ZIP archives are separate, independent features
- Migration will be incremental to ensure no breaking changes
- All existing functionality will be preserved throughout the migration process