import { Result, succeed, fail } from '@fgv/ts-utils';
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

// Dynamic import for JSZip to support both Node.js and browser environments
let JSZip: any = null;

/**
 * Get JSZip instance (assumes JSZip is available)
 */
function getJSZip(): any {
  if (JSZip) return JSZip;

  // Check if JSZip is globally available
  if (typeof window !== 'undefined' && (window as any).JSZip) {
    JSZip = (window as any).JSZip;
    return JSZip;
  }

  // Try to get JSZip from require/import (will work in bundled environments)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    JSZip = require('jszip');
    return JSZip;
  } catch (error) {
    throw new Error('JSZip is not available. Please install jszip as a dependency: npm install jszip');
  }
}

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

    const JSZipClass = getJSZip();
    const zip = new JSZipClass();
    const loadedZip = await zip.loadAsync(buffer).catch((error: any) => {
      throw new Error(`Failed to parse ZIP: ${error instanceof Error ? error.message : String(error)}`);
    });

    onProgress?.('parsing-zip', 100, 'ZIP archive parsed');

    // Build file tree
    const fileTree = await this.buildFileTree(loadedZip, onProgress);

    // Load manifest
    onProgress?.('loading-manifest', 0, 'Loading manifest');
    const manifest = await this.loadManifest(loadedZip);
    onProgress?.('loading-manifest', 100, 'Manifest loaded');

    // Load configuration
    onProgress?.('loading-config', 0, 'Loading configuration');
    const config = await this.loadConfiguration(loadedZip, options);
    onProgress?.('loading-config', 100, 'Configuration loaded');

    // Extract files and directory structure
    onProgress?.('extracting-files', 0, 'Extracting files');
    const files = zipTreeToFiles(fileTree);
    const directory = zipTreeToDirectory(fileTree);
    onProgress?.('extracting-files', 100, `Extracted ${files.length} files`);

    // Process resources if requested
    let processedResources: ProcessedResources | null = null;
    if (options.autoProcessResources) {
      onProgress?.('processing-resources', 0, 'Processing resources');

      const configToUse = options.overrideConfig || config;

      if (directory) {
        const processResult = await processImportedDirectory(directory, configToUse || undefined);
        processedResources = processResult.orDefault() ?? null;
      } else if (files.length > 0) {
        const processResult = await processImportedFiles(files, configToUse || undefined);
        processedResources = processResult.orDefault() ?? null;
      }

      onProgress?.('processing-resources', 100, 'Resources processed');
    }

    onProgress?.('complete', 100, 'ZIP loading complete');

    return succeed({
      manifest,
      config: options.overrideConfig || config,
      files,
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
   * Build file tree from JSZip instance
   */
  private async buildFileTree(zip: any, onProgress?: ZipProgressCallback): Promise<ZipFileTree> {
    const files = new Map<string, ZipFileItem>();
    const directories = new Set<string>();

    const zipFiles = Object.keys(zip.files);
    let processed = 0;

    // Pre-load all file contents for performance
    for (const filename of zipFiles) {
      const zipEntry = zip.files[filename];

      if (zipEntry.dir) {
        directories.add(filename);
        files.set(filename, {
          name:
            filename
              .split('/')
              .filter((p) => p)
              .pop() || filename,
          path: filename,
          size: 0,
          isDirectory: true,
          lastModified: zipEntry.date
        });
      } else {
        // Load file content
        const content = await zipEntry.async('string');

        files.set(filename, {
          name: filename.split('/').pop() || filename,
          path: filename,
          size: content.length,
          isDirectory: false,
          lastModified: zipEntry.date,
          content
        });
      }

      processed++;
      const progress = Math.round((processed / zipFiles.length) * 100);
      onProgress?.('extracting-files', progress, `Processing ${filename}`);
    }

    return {
      files,
      directories,
      root: this.findCommonRoot(Array.from(files.keys()))
    };
  }

  /**
   * Load manifest from ZIP
   */
  private async loadManifest(zip: any): Promise<any> {
    const manifestFile = zip.files['manifest.json'];
    if (!manifestFile) {
      return null;
    }

    const manifestData = await manifestFile.async('string').catch((error: any) => {
      console.warn('Failed to read manifest file:', error);
      return null;
    });

    if (!manifestData) return null;

    const parseResult = parseManifest(manifestData);
    return parseResult.orDefault() ?? null;
  }

  /**
   * Load configuration from ZIP
   */
  private async loadConfiguration(zip: any, options: ZipLoadOptions): Promise<any> {
    if (options.overrideConfig) {
      return options.overrideConfig;
    }

    const configFile = zip.files['config.json'];
    if (!configFile) {
      return null;
    }

    const configData = await configFile.async('string').catch((error: any) => {
      console.warn('Failed to read config file:', error);
      return null;
    });

    if (!configData) return null;

    const parseResult = parseConfiguration(configData);
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
