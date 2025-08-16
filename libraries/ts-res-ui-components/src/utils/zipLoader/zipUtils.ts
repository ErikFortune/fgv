import { Result, succeed, fail } from '@fgv/ts-utils';
import { Config } from '@fgv/ts-res';
import { ZipManifest, ZipFileItem, ZipFileTree } from './types';
import { ImportedDirectory, ImportedFile } from '../../types';

/**
 * Generate a timestamp-based filename for ZIP archives
 */
/** @internal */
export function generateZipFilename(customName?: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -5);
  return customName ? `${customName}-${timestamp}.zip` : `ts-res-bundle-${timestamp}.zip`;
}

/**
 * Create a ZIP manifest object
 */
/** @internal */
export function createManifest(
  inputType: 'file' | 'directory',
  originalPath: string,
  archivePath: string,
  configPath?: string
): ZipManifest {
  const manifest: ZipManifest = {
    timestamp: new Date().toISOString(),
    input: {
      type: inputType,
      originalPath,
      archivePath
    }
  };

  if (configPath) {
    manifest.config = {
      type: 'file',
      originalPath: configPath,
      archivePath: 'config.json'
    };
  }

  return manifest;
}

/**
 * Parse and validate a ZIP manifest
 */
/** @internal */
export function parseManifest(manifestData: string): Result<ZipManifest> {
  try {
    const parsed = JSON.parse(manifestData);

    // Basic validation
    if (!parsed.timestamp || typeof parsed.timestamp !== 'string') {
      return fail('Invalid manifest: missing or invalid timestamp');
    }

    // Validate input section if present
    if (parsed.input) {
      if (!parsed.input.type || !['file', 'directory'].includes(parsed.input.type)) {
        return fail('Invalid manifest: invalid input type');
      }
      if (!parsed.input.originalPath || !parsed.input.archivePath) {
        return fail('Invalid manifest: missing input paths');
      }
    }

    // Validate config section if present
    if (parsed.config) {
      if (parsed.config.type !== 'file') {
        return fail('Invalid manifest: invalid config type');
      }
      if (!parsed.config.originalPath || !parsed.config.archivePath) {
        return fail('Invalid manifest: missing config paths');
      }
    }

    return succeed(parsed as ZipManifest);
  } catch (error) {
    return fail(`Failed to parse manifest: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parse and validate configuration JSON
 */
/** @internal */
export function parseConfiguration(configData: string): Result<Config.Model.ISystemConfiguration> {
  try {
    const parsed = JSON.parse(configData);

    // Basic validation - check for expected properties
    if (typeof parsed !== 'object' || parsed === null) {
      return fail('Invalid configuration: not an object');
    }

    // More detailed validation could be added here using ts-res validators
    return succeed(parsed as Config.Model.ISystemConfiguration);
  } catch (error) {
    return fail(`Failed to parse configuration: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Convert ZIP file tree to ImportedFiles array
 */
/** @internal */
export function zipTreeToFiles(tree: ZipFileTree): ImportedFile[] {
  const files: ImportedFile[] = [];

  for (const [path, item] of Array.from(tree.files.entries())) {
    if (!item.isDirectory && item.content && typeof item.content === 'string') {
      files.push({
        name: item.name,
        path: path,
        content: item.content,
        type: getFileType(item.name)
      });
    }
  }

  return files;
}

/**
 * Convert ZIP file tree to ImportedDirectory structure
 */
/** @internal */
export function zipTreeToDirectory(tree: ZipFileTree): ImportedDirectory | null {
  if (tree.files.size === 0) {
    return null;
  }

  // Build directory structure
  const directories = new Map<string, ImportedDirectory>();
  const rootDir: ImportedDirectory = {
    name: tree.root || 'root',
    files: [],
    subdirectories: []
  };
  directories.set('', rootDir);

  // Process all paths to build directory structure
  for (const [path, item] of Array.from(tree.files.entries())) {
    const pathParts = path.split('/').filter((part: string) => part.length > 0);

    if (pathParts.length === 0) continue;

    // Ensure all parent directories exist
    let currentPath = '';
    for (let i = 0; i < pathParts.length - 1; i++) {
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${pathParts[i]}` : pathParts[i];

      if (!directories.has(currentPath)) {
        const newDir: ImportedDirectory = {
          name: pathParts[i],
          files: [],
          subdirectories: []
        };
        directories.set(currentPath, newDir);

        // Add to parent directory
        const parentDir = directories.get(parentPath);
        if (parentDir) {
          parentDir.subdirectories = parentDir.subdirectories || [];
          parentDir.subdirectories.push(newDir);
        }
      }
    }

    // Add file to its parent directory
    if (!item.isDirectory && item.content && typeof item.content === 'string') {
      const fileName = pathParts[pathParts.length - 1];
      const parentPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
      const parentDir = directories.get(parentPath);

      if (parentDir) {
        parentDir.files.push({
          name: fileName,
          path: path,
          content: item.content,
          type: getFileType(fileName)
        });
      }
    }
  }

  return rootDir;
}

/**
 * Get file type based on extension
 */
function getFileType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  switch (ext) {
    case 'json':
      return 'application/json';
    case 'yaml':
    case 'yml':
      return 'application/yaml';
    case 'xml':
      return 'application/xml';
    case 'txt':
      return 'text/plain';
    case 'md':
      return 'text/markdown';
    case 'js':
      return 'application/javascript';
    case 'ts':
      return 'application/typescript';
    default:
      return 'application/octet-stream';
  }
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
