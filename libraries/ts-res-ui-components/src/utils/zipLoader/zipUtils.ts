import { Result, succeed, fail } from '@fgv/ts-utils';
import { Config } from '@fgv/ts-res';

/**
 * Generate a timestamp-based filename for ZIP archives
 */
/** @internal */
export function generateZipFilename(customName?: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -5);
  return customName ? `${customName}-${timestamp}.zip` : `ts-res-bundle-${timestamp}.zip`;
}

/**
 * @deprecated Use zip-archive packlet directly
 */
export function createManifest(): any {
  console.warn('createManifest is deprecated - use ts-res zip-archive packlet directly');
  return null;
}

/**
 * Parse JSON content safely
 */
export function parseManifest(manifestData: string): Result<any> {
  try {
    const parsed = JSON.parse(manifestData);
    return succeed(parsed);
  } catch (error) {
    return fail(`Failed to parse manifest: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parse and validate configuration JSON
 */
export function parseConfiguration(configData: string): Result<Config.Model.ISystemConfiguration> {
  try {
    const parsed = JSON.parse(configData);
    return Config.Convert.systemConfiguration.convert(parsed);
  } catch (error) {
    return fail(`Failed to parse configuration: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * @deprecated Files are returned directly from zip-archive packlet
 */
export function zipTreeToFiles(): any[] {
  console.warn('zipTreeToFiles is deprecated - files are returned directly from zip-archive packlet');
  return [];
}

/**
 * @deprecated Directory is returned directly from zip-archive packlet
 */
export function zipTreeToDirectory(): any {
  console.warn('zipTreeToDirectory is deprecated - directory is returned directly from zip-archive packlet');
  return null;
}

/**
 * Normalize path separators for cross-platform compatibility
 */
/** @internal */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/\/+/g, '/');
}

/**
 * Extract directory name from a file path
 */
/** @internal */
export function getDirectoryName(path: string): string {
  const normalized = normalizePath(path);
  const parts = normalized.split('/');
  return parts[parts.length - 1] || 'archive';
}

/**
 * Create a safe filename by removing invalid characters
 */
/** @internal */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim();
}

/**
 * Format file size in human readable format
 */
/** @internal */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);

  return `${size.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

/**
 * Validate ZIP file extension
 */
/** @internal */
export function isZipFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.zip');
}

/**
 * Extract base name from filename (without extension)
 */
/** @internal */
export function getBaseName(filename: string): string {
  const name = filename.split('/').pop() || filename;
  const dotIndex = name.lastIndexOf('.');
  return dotIndex > 0 ? name.substring(0, dotIndex) : name;
}
