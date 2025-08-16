import { Result } from '@fgv/ts-utils';
import { Config } from '@fgv/ts-res';
import { ImportedDirectory, ImportedFile, ProcessedResources } from '../../types';

/**
 * ZIP manifest metadata structure
 */
/** @internal */
export interface ZipManifest {
  timestamp: string;
  input?: {
    type: 'file' | 'directory';
    originalPath: string;
    archivePath: string;
  };
  config?: {
    type: 'file';
    originalPath: string;
    archivePath: string;
  };
}

/**
 * Options for creating ZIP archives
 */
/** @internal */
export interface ZipArchiveOptions {
  /** Output directory for the ZIP file */
  outputDir?: string;
  /** Custom filename (without extension) */
  filename?: string;
  /** Compression level (0-9) */
  compressionLevel?: number;
  /** Include configuration file */
  includeConfig?: boolean;
  /** Custom configuration to include */
  config?: Config.Model.ISystemConfiguration;
}

/**
 * Result of ZIP archive creation
 */
/** @internal */
export interface ZipArchiveResult {
  /** Path to the created ZIP file */
  filePath: string;
  /** Size of the ZIP file in bytes */
  fileSize: number;
  /** Generated manifest */
  manifest: ZipManifest;
  /** Timestamp when created */
  timestamp: string;
}

/**
 * Options for loading ZIP archives
 */
/** @internal */
export interface ZipLoadOptions {
  /** Whether to auto-apply configuration found in ZIP */
  autoApplyConfig?: boolean;
  /** Whether to auto-process resources after loading */
  autoProcessResources?: boolean;
  /** Custom configuration to use instead of ZIP config */
  overrideConfig?: Config.Model.ISystemConfiguration;
}

/**
 * Result of ZIP loading operation
 */
/** @internal */
export interface ZipLoadResult {
  /** Manifest from the ZIP */
  manifest: ZipManifest | null;
  /** Configuration found in ZIP */
  config: Config.Model.ISystemConfiguration | null;
  /** Loaded files */
  files: ImportedFile[];
  /** Loaded directory structure */
  directory: ImportedDirectory | null;
  /** File tree for direct processing */
  fileTree?: any; // FileTree.FileTree from ts-utils
  /** Processed resources if auto-processing was enabled */
  processedResources: ProcessedResources | null;
}

/**
 * ZIP loading progress stages
 */
/** @internal */
export type ZipLoadingStage =
  | 'reading-file'
  | 'parsing-zip'
  | 'loading-manifest'
  | 'loading-config'
  | 'extracting-files'
  | 'processing-resources'
  | 'complete';

/**
 * Progress callback for ZIP operations
 */
/** @internal */
export interface ZipProgressCallback {
  (stage: ZipLoadingStage, progress: number, message?: string): void;
}

/**
 * ZIP builder interface (Node.js environment)
 */
/** @internal */
export interface IZipBuilder {
  /**
   * Create ZIP from files
   */
  createFromFiles(files: ImportedFile[], options?: ZipArchiveOptions): Promise<Result<ZipArchiveResult>>;

  /**
   * Create ZIP from directory
   */
  createFromDirectory(
    directory: ImportedDirectory,
    options?: ZipArchiveOptions
  ): Promise<Result<ZipArchiveResult>>;

  /**
   * Create ZIP from file system path
   */
  createFromPath(path: string, options?: ZipArchiveOptions): Promise<Result<ZipArchiveResult>>;
}

/**
 * ZIP loader interface (Browser environment)
 */
/** @internal */
export interface IZipLoader {
  /**
   * Load ZIP from File object
   */
  loadFromFile(
    file: File,
    options?: ZipLoadOptions,
    onProgress?: ZipProgressCallback
  ): Promise<Result<ZipLoadResult>>;

  /**
   * Load ZIP from ArrayBuffer
   */
  loadFromBuffer(
    buffer: ArrayBuffer,
    options?: ZipLoadOptions,
    onProgress?: ZipProgressCallback
  ): Promise<Result<ZipLoadResult>>;

  /**
   * Load ZIP from URL
   */
  loadFromUrl(
    url: string,
    options?: ZipLoadOptions,
    onProgress?: ZipProgressCallback
  ): Promise<Result<ZipLoadResult>>;
}

/**
 * File item within a ZIP archive
 */
/** @internal */
export interface ZipFileItem {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  lastModified?: Date;
  content?: string | ArrayBuffer;
}

/**
 * ZIP file tree representation
 */
/** @internal */
export interface ZipFileTree {
  files: Map<string, ZipFileItem>;
  directories: Set<string>;
  root: string;
}
