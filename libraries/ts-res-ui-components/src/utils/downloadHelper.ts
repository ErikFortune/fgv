import { Result, succeed, fail, captureResult } from '@fgv/ts-utils';

/**
 * Options for customizing file downloads
 * @public
 */
export interface IDownloadOptions {
  /** Base filename (without extension). If not provided, uses 'ts-res-export' */
  baseFilename?: string;
  /** File extension (without dot). Defaults to 'json' */
  extension?: string;
  /** Include timestamp in filename. Defaults to true */
  includeTimestamp?: boolean;
  /** Custom timestamp format. If not provided, uses ISO format with colons replaced */
  timestampFormat?: string;
  /** MIME type for the blob. Defaults to 'application/json' for json, 'text/plain' for others */
  mimeType?: string;
  /** Custom filename transformer function */
  filenameTransformer?: (baseFilename: string) => string;
}

/**
 * Creates a timestamp string suitable for filenames
 * @public
 */
export function createTimestamp(customFormat?: string): string {
  if (customFormat) {
    return customFormat;
  }
  return new Date().toISOString().replace(/[:]/g, '-').split('.')[0];
}

/**
 * Generates a filename based on options
 * @public
 */
export function generateFilename(
  baseFilename: string,
  type?: string,
  options: IDownloadOptions = {}
): Result<string> {
  if (!baseFilename || !baseFilename.trim()) {
    return fail('Base filename cannot be empty');
  }

  const { extension = 'json', includeTimestamp = true, timestampFormat, filenameTransformer } = options;

  let filename = baseFilename.trim();

  // Add type if provided
  if (type) {
    filename = `${filename}-${type}`;
  }

  // Add timestamp if requested
  if (includeTimestamp) {
    const timestamp = createTimestamp(timestampFormat);
    filename = `${filename}-${timestamp}`;
  }

  // Apply custom transformer if provided
  if (filenameTransformer) {
    filename = filenameTransformer(filename);
  }

  // Add extension
  filename = `${filename}.${extension}`;

  return succeed(filename);
}

/**
 * Downloads data as a file using the browser's download mechanism
 * @public
 */
export function downloadFile(data: unknown, type: string, options: IDownloadOptions = {}): Result<void> {
  const { baseFilename = 'ts-res-export', extension = 'json', mimeType } = options;

  // Generate filename
  const filenameResult = generateFilename(baseFilename, type, options);
  if (filenameResult.isFailure()) {
    return fail(`Failed to generate filename: ${filenameResult.message}`);
  }

  return captureResult(() => {
    // Convert data to string
    let content: string;
    if (typeof data === 'string') {
      content = data;
    } else if (extension === 'json') {
      content = JSON.stringify(data, null, 2);
    } else {
      content = String(data);
    }

    // Determine MIME type
    const finalMimeType = mimeType ?? (extension === 'json' ? 'application/json' : 'text/plain');

    // Create blob and download
    const blob = new Blob([content], { type: finalMimeType });
    const url = URL.createObjectURL(blob);

    // Create temporary download link
    const link = document.createElement('a');
    link.href = url;
    link.download = filenameResult.value;
    link.style.display = 'none';

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }).withErrorFormat((error) => `Failed to download file: ${error}`);
}

/**
 * Downloads JSON data with ts-res specific defaults
 * @public
 */
export function downloadTsResJson(data: unknown, type: string): Result<void> {
  return downloadFile(data, type, {
    baseFilename: 'ts-res',
    extension: 'json',
    includeTimestamp: true,
    mimeType: 'application/json'
  });
}

/**
 * Downloads a bundle with enhanced naming
 * @public
 */
export function downloadBundle(data: unknown, resourceCount?: number, configName?: string): Result<void> {
  const options: IDownloadOptions = {
    baseFilename: 'ts-res-bundle',
    extension: 'json',
    includeTimestamp: true,
    mimeType: 'application/json',
    filenameTransformer: (base) => {
      let enhanced = base;

      // Add resource count if available
      if (resourceCount !== undefined && resourceCount > 0) {
        enhanced = `${enhanced}-${resourceCount}res`;
      }

      // Add config name if available
      if (configName) {
        const cleanConfigName = configName.replace(/[^a-zA-Z0-9-_]/g, '-');
        enhanced = `${enhanced}-${cleanConfigName}`;
      }

      return enhanced;
    }
  };

  return downloadFile(data, '', options);
}

/**
 * Downloads resource data with enhanced naming
 * @public
 */
export function downloadResources(
  data: unknown,
  resourceCount?: number,
  collectionName?: string
): Result<void> {
  const options: IDownloadOptions = {
    baseFilename: 'ts-res-resources',
    extension: 'json',
    includeTimestamp: true,
    mimeType: 'application/json',
    filenameTransformer: (base) => {
      let enhanced = base;

      // Add resource count if available
      if (resourceCount !== undefined && resourceCount > 0) {
        enhanced = `${enhanced}-${resourceCount}items`;
      }

      // Add collection name if available
      if (collectionName) {
        const cleanName = collectionName.replace(/[^a-zA-Z0-9-_]/g, '-');
        enhanced = `${enhanced}-${cleanName}`;
      }

      return enhanced;
    }
  };

  return downloadFile(data, '', options);
}

/**
 * Downloads compiled resources with specific naming
 * @public
 */
export function downloadCompiledResources(data: unknown, resourceCount?: number): Result<void> {
  return downloadFile(data, 'compiled', {
    baseFilename: 'ts-res',
    extension: 'json',
    includeTimestamp: true,
    mimeType: 'application/json',
    filenameTransformer: (base) => {
      if (resourceCount !== undefined && resourceCount > 0) {
        return `${base}-${resourceCount}res`;
      }
      return base;
    }
  });
}

/**
 * Downloads source resources with specific naming
 * @public
 */
export function downloadSourceResources(data: unknown, resourceCount?: number): Result<void> {
  return downloadFile(data, 'source', {
    baseFilename: 'ts-res',
    extension: 'json',
    includeTimestamp: true,
    mimeType: 'application/json',
    filenameTransformer: (base) => {
      if (resourceCount !== undefined && resourceCount > 0) {
        return `${base}-${resourceCount}res`;
      }
      return base;
    }
  });
}
