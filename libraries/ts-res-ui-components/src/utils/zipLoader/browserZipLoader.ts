import { Result, succeed, fail } from '@fgv/ts-utils';
import { ZipFileTree as ExtrasZipFileTree } from '@fgv/ts-extras';
import {
  IZipLoader,
  ZipLoadOptions,
  ZipLoadResult,
  ZipProgressCallback,
  ZipFileTree,
  ZipFileItem,
  ZipLoadingStage
} from './types';
import { parseManifest, parseConfiguration, zipTreeToFiles, zipTreeToDirectory, isZipFile } from './zipUtils';
import { processImportedFiles, processImportedDirectory } from '../tsResIntegration';
import { ProcessedResources } from '../../types';

/**
 * Browser-based ZIP loader implementation
 */
export class BrowserZipLoader implements IZipLoader {
  /**
   * Load ZIP from File object
   */
  async loadFromFile(
    file: File,
    options: ZipLoadOptions = {},
    onProgress?: ZipProgressCallback
  ): Promise<Result<ZipLoadResult>> {
    onProgress?.('reading-file', 0, `Reading file: ${file.name}`);

    if (!isZipFile(file.name)) {
      return fail(`File ${file.name} is not a ZIP file`);
    }

    const buffer = await file.arrayBuffer().catch((error) => {
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
    });
    onProgress?.('reading-file', 100, 'File read complete');

    return this.loadFromBuffer(buffer, options, onProgress);
  }

  /**
   * Load ZIP from ArrayBuffer
   */
  async loadFromBuffer(
    buffer: ArrayBuffer,
    options: ZipLoadOptions = {},
    onProgress?: ZipProgressCallback
  ): Promise<Result<ZipLoadResult>> {
    onProgress?.('parsing-zip', 0, 'Parsing ZIP archive');

    const zipAccessorsResult = ExtrasZipFileTree.ZipFileTreeAccessors.fromBuffer(buffer);
    if (zipAccessorsResult.isFailure()) {
      return fail(`Failed to parse ZIP: ${zipAccessorsResult.message}`);
    }

    const zipAccessors = zipAccessorsResult.value;
    onProgress?.('parsing-zip', 100, 'ZIP archive parsed');

    // Build file tree using the new adapter
    const fileTree = await this.buildFileTreeFromAccessors(zipAccessors, onProgress);

    // Load manifest
    onProgress?.('loading-manifest', 0, 'Loading manifest');
    const manifest = await this.loadManifestFromAccessors(zipAccessors);
    onProgress?.('loading-manifest', 100, 'Manifest loaded');

    // Load configuration
    onProgress?.('loading-config', 0, 'Loading configuration');
    const config = await this.loadConfigurationFromAccessors(zipAccessors, options);
    onProgress?.('loading-config', 100, 'Configuration loaded');

    // Extract files and directory structure
    onProgress?.('extracting-files', 0, 'Extracting files');
    const filesList = zipTreeToFiles(fileTree);
    const directory = zipTreeToDirectory(fileTree);
    onProgress?.('extracting-files', 100, `Extracted ${filesList.length} files`);

    // Process resources if requested
    let processedResources: ProcessedResources | null = null;
    if (options.autoProcessResources) {
      onProgress?.('processing-resources', 0, 'Processing resources');

      const configToUse = options.overrideConfig || config;

      if (directory) {
        const processResult = await processImportedDirectory(directory, configToUse || undefined);
        if (processResult.isSuccess()) {
          processedResources = processResult.value;
        } else {
          throw new Error(`Failed to process resources from directory: ${processResult.message}`);
        }
      } else if (filesList.length > 0) {
        const processResult = await processImportedFiles(filesList, configToUse || undefined);
        if (processResult.isSuccess()) {
          processedResources = processResult.value;
        } else {
          throw new Error(`Failed to process resources from files: ${processResult.message}`);
        }
      }

      onProgress?.('processing-resources', 100, 'Resources processed');
    }

    onProgress?.('complete', 100, 'ZIP loading complete');

    return succeed({
      manifest,
      config: options.overrideConfig || config,
      files: filesList,
      directory,
      processedResources
    });
  }

  /**
   * Load ZIP from URL
   */
  async loadFromUrl(
    url: string,
    options: ZipLoadOptions = {},
    onProgress?: ZipProgressCallback
  ): Promise<Result<ZipLoadResult>> {
    onProgress?.('reading-file', 0, `Fetching from URL: ${url}`);

    const response = await fetch(url).catch((error) => {
      throw new Error(
        `Failed to fetch ZIP from URL: ${error instanceof Error ? error.message : String(error)}`
      );
    });

    if (!response.ok) {
      return fail(`Failed to fetch ZIP from URL: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer().catch((error) => {
      throw new Error(
        `Failed to read response buffer: ${error instanceof Error ? error.message : String(error)}`
      );
    });
    onProgress?.('reading-file', 100, 'URL fetch complete');

    return this.loadFromBuffer(buffer, options, onProgress);
  }

  /**
   * Build file tree from ZipFileTreeAccessors (using ts-extras)
   */
  private async buildFileTreeFromAccessors(
    zipAccessors: ExtrasZipFileTree.ZipFileTreeAccessors,
    onProgress?: ZipProgressCallback
  ): Promise<ZipFileTree> {
    const files = new Map<string, ZipFileItem>();
    const directories = new Set<string>();

    // Get all children from root
    const rootChildrenResult = zipAccessors.getChildren('/');
    if (rootChildrenResult.isFailure()) {
      throw new Error(`Failed to read ZIP contents: ${rootChildrenResult.message}`);
    }

    // Process all items recursively
    await this.processFileTreeItems(
      zipAccessors,
      '/',
      rootChildrenResult.value,
      files,
      directories,
      onProgress
    );

    return {
      files,
      directories,
      root: this.findCommonRoot(Array.from(files.keys()))
    };
  }

  /**
   * Recursively process file tree items
   */
  private async processFileTreeItems(
    zipAccessors: ExtrasZipFileTree.ZipFileTreeAccessors,
    currentPath: string,
    items: readonly any[],
    files: Map<string, ZipFileItem>,
    directories: Set<string>,
    onProgress?: ZipProgressCallback,
    processed: { count: number } = { count: 0 }
  ): Promise<void> {
    for (const item of items) {
      const itemPath = item.absolutePath.startsWith('/') ? item.absolutePath.substring(1) : item.absolutePath;

      if (item.type === 'directory') {
        directories.add(itemPath);
        files.set(itemPath, {
          name: item.name,
          path: itemPath,
          size: 0,
          isDirectory: true,
          lastModified: undefined
        });

        // Recursively process children
        const childrenResult = zipAccessors.getChildren(item.absolutePath);
        if (childrenResult.isSuccess()) {
          await this.processFileTreeItems(
            zipAccessors,
            item.absolutePath,
            childrenResult.value,
            files,
            directories,
            onProgress,
            processed
          );
        }
      } else if (item.type === 'file') {
        // Get file content
        const contentResult = item.getRawContents();
        const content = contentResult.isSuccess() ? contentResult.value : '';

        files.set(itemPath, {
          name: item.name,
          path: itemPath,
          size: content.length,
          isDirectory: false,
          lastModified: undefined,
          content
        });
      }

      processed.count++;
      onProgress?.('extracting-files', processed.count, `Processing ${itemPath}`);
    }
  }

  /**
   * Load manifest from ZIP using ZipFileTreeAccessors
   */
  private async loadManifestFromAccessors(
    zipAccessors: ExtrasZipFileTree.ZipFileTreeAccessors
  ): Promise<any> {
    const manifestResult = zipAccessors.getFileContents('manifest.json');
    if (manifestResult.isFailure()) {
      return null;
    }

    const parseResult = parseManifest(manifestResult.value);
    return parseResult.orDefault() ?? null;
  }

  /**
   * Load configuration from ZIP using ZipFileTreeAccessors
   */
  private async loadConfigurationFromAccessors(
    zipAccessors: ExtrasZipFileTree.ZipFileTreeAccessors,
    options: ZipLoadOptions
  ): Promise<any> {
    if (options.overrideConfig) {
      return options.overrideConfig;
    }

    const configResult = zipAccessors.getFileContents('config.json');
    if (configResult.isFailure()) {
      return null;
    }

    const parseResult = parseConfiguration(configResult.value);
    return parseResult.orDefault() ?? null;
  }

  /**
   * Find common root directory from file paths
   */
  private findCommonRoot(paths: string[]): string {
    if (paths.length === 0) return '';
    if (paths.length === 1) return paths[0].split('/')[0] || '';

    const parts = paths[0].split('/');
    let commonLength = 0;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (paths.every((path) => path.split('/')[i] === part)) {
        commonLength = i + 1;
      } else {
        break;
      }
    }

    return parts.slice(0, commonLength).join('/');
  }
}

/**
 * Create a new browser ZIP loader instance
 */
export function createBrowserZipLoader(): IZipLoader {
  return new BrowserZipLoader();
}

/**
 * Convenience function to load ZIP from File with default options
 */
export async function loadZipFile(
  file: File,
  options?: ZipLoadOptions,
  onProgress?: ZipProgressCallback
): Promise<Result<ZipLoadResult>> {
  const loader = createBrowserZipLoader();
  return loader.loadFromFile(file, options, onProgress);
}

/**
 * Convenience function to load ZIP from URL with default options
 */
export async function loadZipFromUrl(
  url: string,
  options?: ZipLoadOptions,
  onProgress?: ZipProgressCallback
): Promise<Result<ZipLoadResult>> {
  const loader = createBrowserZipLoader();
  return loader.loadFromUrl(url, options, onProgress);
}
