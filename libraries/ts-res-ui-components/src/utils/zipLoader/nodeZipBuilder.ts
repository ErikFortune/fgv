import { Result, succeed, fail } from '@fgv/ts-utils';
import { IZipBuilder, ZipArchiveOptions, ZipArchiveResult, ZipManifest } from './types';
import { ImportedDirectory, ImportedFile } from '../../types';
import { generateZipFilename, createManifest, sanitizeFilename, normalizePath } from './zipUtils';

/**
 * Node.js-based ZIP builder implementation
 *
 * Note: This is a placeholder implementation for interface compatibility.
 * The actual Node.js ZIP building functionality should be implemented
 * in a separate Node.js-specific package or tool.
 */
export class NodeZipBuilder implements IZipBuilder {
  /**
   * Create ZIP from files
   */
  async createFromFiles(
    files: ImportedFile[],
    options: ZipArchiveOptions = {}
  ): Promise<Result<ZipArchiveResult>> {
    return fail(
      'Node.js ZIP building not implemented in browser library. Use @fgv/ts-res-browser-cli for ZIP creation.'
    );
  }

  /**
   * Create ZIP from directory
   */
  async createFromDirectory(
    directory: ImportedDirectory,
    options: ZipArchiveOptions = {}
  ): Promise<Result<ZipArchiveResult>> {
    return fail(
      'Node.js ZIP building not implemented in browser library. Use @fgv/ts-res-browser-cli for ZIP creation.'
    );
  }

  /**
   * Create ZIP from file system path
   */
  async createFromPath(path: string, options: ZipArchiveOptions = {}): Promise<Result<ZipArchiveResult>> {
    return fail(
      'Node.js ZIP building not implemented in browser library. Use @fgv/ts-res-browser-cli for ZIP creation.'
    );
  }
}

/**
 * Create a new Node.js ZIP builder instance
 *
 * Note: This returns a placeholder implementation.
 * For actual ZIP building, use the ts-res-browser-cli tool.
 */
export function createNodeZipBuilder(): IZipBuilder {
  return new NodeZipBuilder();
}

/**
 * Browser-compatible ZIP creation interface
 *
 * This provides a way to prepare ZIP data in the browser,
 * though actual ZIP file creation requires server-side processing
 * or a separate Node.js tool.
 */
export interface BrowserZipData {
  files: Array<{
    path: string;
    content: string;
  }>;
  manifest: ZipManifest;
  config?: any;
}

/**
 * Prepare ZIP data structure for browser download or server processing
 */
export function prepareZipData(
  files: ImportedFile[],
  options: ZipArchiveOptions = {}
): Result<BrowserZipData> {
  const timestamp = new Date().toISOString();
  const filename = options.filename || 'ts-res-bundle';

  // Create manifest
  const manifest = createManifest(
    'file',
    'browser-files',
    'files/',
    options.includeConfig ? 'config.json' : undefined
  );

  // Prepare file data
  const zipFiles = files.map((file) => ({
    path: normalizePath(file.path || file.name),
    content: file.content
  }));

  // Add manifest
  zipFiles.push({
    path: 'manifest.json',
    content: JSON.stringify(manifest, null, 2)
  });

  // Add configuration if provided
  if (options.includeConfig && options.config) {
    zipFiles.push({
      path: 'config.json',
      content: JSON.stringify(options.config, null, 2)
    });
  }

  return succeed({
    files: zipFiles,
    manifest,
    config: options.config
  });
}

/**
 * Prepare ZIP data from directory structure
 */
export function prepareZipDataFromDirectory(
  directory: ImportedDirectory,
  options: ZipArchiveOptions = {}
): Result<BrowserZipData> {
  // Flatten directory to files
  const files: ImportedFile[] = [];

  const collectFiles = (dir: ImportedDirectory, basePath: string = '') => {
    // Add files from current directory
    dir.files.forEach((file) => {
      files.push({
        ...file,
        path: basePath ? `${basePath}/${file.name}` : file.name
      });
    });

    // Recursively collect from subdirectories
    if (dir.subdirectories) {
      dir.subdirectories.forEach((subdir) => {
        const subdirPath = basePath ? `${basePath}/${subdir.name}` : subdir.name;
        collectFiles(subdir, subdirPath);
      });
    }
  };

  collectFiles(directory);

  return prepareZipData(files, {
    ...options,
    filename: options.filename || sanitizeFilename(directory.name)
  });
}
