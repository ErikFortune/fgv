import { Result, succeed, fail } from '@fgv/ts-utils';
import * as TsRes from '@fgv/ts-res';
import { IZipLoader, ZipLoadOptions, ZipLoadResult, ZipProgressCallback, ZipLoadingStage } from './types';

/**
 * Adapter that bridges ts-res-ui-components ZipLoader interface to the new ts-res zip-archive packlet
 */
export class ZipArchiveAdapter implements IZipLoader {
  private _loader: TsRes.ZipArchive.ZipArchiveLoader;

  constructor() {
    this._loader = new TsRes.ZipArchive.ZipArchiveLoader();
  }

  /**
   * Load ZIP from File object
   */
  async loadFromFile(
    file: File,
    options: ZipLoadOptions = {},
    onProgress?: ZipProgressCallback
  ): Promise<Result<ZipLoadResult>> {
    const adaptedProgress = this._adaptProgressCallback(onProgress);

    const loadResult = await this._loader.loadFromFile(
      file,
      {
        strictManifestValidation: true
      },
      adaptedProgress
    );

    if (loadResult.isFailure()) {
      return fail(loadResult.message);
    }

    const zipData = loadResult.value;

    onProgress?.('complete', 100, 'ZIP loading complete');

    // Adapt the result to match the expected interface
    const adaptedResult: ZipLoadResult = {
      manifest: zipData.manifest ? this._adaptManifest(zipData.manifest) : undefined,
      config: zipData.config,
      files: zipData.files,
      directory: zipData.directory
    };

    return succeed(adaptedResult);
  }

  /**
   * Load ZIP from ArrayBuffer
   */
  async loadFromBuffer(
    buffer: ArrayBuffer,
    options: ZipLoadOptions = {},
    onProgress?: ZipProgressCallback
  ): Promise<Result<ZipLoadResult>> {
    const adaptedProgress = this._adaptProgressCallback(onProgress);

    const loadResult = await this._loader.loadFromBuffer(
      buffer,
      {
        strictManifestValidation: true
      },
      adaptedProgress
    );

    if (loadResult.isFailure()) {
      return fail(loadResult.message);
    }

    const zipData = loadResult.value;

    onProgress?.('complete', 100, 'ZIP loading complete');

    // Adapt the result to match the expected interface
    const adaptedResult: ZipLoadResult = {
      manifest: zipData.manifest ? this._adaptManifest(zipData.manifest) : undefined,
      config: zipData.config,
      files: zipData.files,
      directory: zipData.directory
    };

    return succeed(adaptedResult);
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

    try {
      const response = await fetch(url);
      if (!response.ok) {
        return fail(`Failed to fetch ZIP from URL: ${response.status} ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      onProgress?.('reading-file', 100, 'URL fetch complete');

      return this.loadFromBuffer(buffer, options, onProgress);
    } catch (error) {
      return fail(`Failed to fetch ZIP from URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Adapt zip-archive progress callback to ts-res-ui-components format
   */
  private _adaptProgressCallback(
    callback?: ZipProgressCallback
  ): TsRes.ZipArchive.ZipArchiveProgressCallback | undefined {
    if (!callback) return undefined;

    return (stage, progress, details) => {
      // Map zip-archive stages to ZipLoadingStage
      const mappedStage = this._mapStage(stage);
      callback(mappedStage, progress, details);
    };
  }

  /**
   * Map zip-archive stage names to ZipLoadingStage
   */
  private _mapStage(stage: string): ZipLoadingStage {
    switch (stage) {
      case 'reading-file':
        return 'reading-file';
      case 'parsing-zip':
        return 'parsing-zip';
      case 'loading-manifest':
        return 'loading-manifest';
      case 'loading-config':
        return 'loading-config';
      case 'extracting-files':
        return 'extracting-files';
      case 'processing-resources':
        return 'processing-resources';
      case 'complete':
        return 'complete';
      default:
        return 'parsing-zip';
    }
  }

  /**
   * Adapt zip-archive manifest to legacy ZipManifest format
   */
  private _adaptManifest(manifest: TsRes.ZipArchive.IZipArchiveManifest): any {
    return {
      timestamp: manifest.timestamp,
      input: manifest.input,
      config: manifest.config
    };
  }
}

/**
 * Create a new ZIP loader adapter instance
 */
export function createBrowserZipLoader(): IZipLoader {
  return new ZipArchiveAdapter();
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
