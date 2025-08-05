'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.generateZipFilename = generateZipFilename;
exports.createManifest = createManifest;
exports.parseManifest = parseManifest;
exports.parseConfiguration = parseConfiguration;
exports.zipTreeToFiles = zipTreeToFiles;
exports.zipTreeToDirectory = zipTreeToDirectory;
exports.normalizePath = normalizePath;
exports.getDirectoryName = getDirectoryName;
exports.sanitizeFilename = sanitizeFilename;
exports.formatFileSize = formatFileSize;
exports.isZipFile = isZipFile;
exports.getBaseName = getBaseName;
var ts_utils_1 = require('@fgv/ts-utils');
/**
 * Generate a timestamp-based filename for ZIP archives
 */
function generateZipFilename(customName) {
  var timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, -5);
  return customName
    ? ''.concat(customName, '-').concat(timestamp, '.zip')
    : 'ts-res-bundle-'.concat(timestamp, '.zip');
}
/**
 * Create a ZIP manifest object
 */
function createManifest(inputType, originalPath, archivePath, configPath) {
  var manifest = {
    timestamp: new Date().toISOString(),
    input: {
      type: inputType,
      originalPath: originalPath,
      archivePath: archivePath
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
function parseManifest(manifestData) {
  try {
    var parsed = JSON.parse(manifestData);
    // Basic validation
    if (!parsed.timestamp || typeof parsed.timestamp !== 'string') {
      return (0, ts_utils_1.fail)('Invalid manifest: missing or invalid timestamp');
    }
    // Validate input section if present
    if (parsed.input) {
      if (!parsed.input.type || !['file', 'directory'].includes(parsed.input.type)) {
        return (0, ts_utils_1.fail)('Invalid manifest: invalid input type');
      }
      if (!parsed.input.originalPath || !parsed.input.archivePath) {
        return (0, ts_utils_1.fail)('Invalid manifest: missing input paths');
      }
    }
    // Validate config section if present
    if (parsed.config) {
      if (parsed.config.type !== 'file') {
        return (0, ts_utils_1.fail)('Invalid manifest: invalid config type');
      }
      if (!parsed.config.originalPath || !parsed.config.archivePath) {
        return (0, ts_utils_1.fail)('Invalid manifest: missing config paths');
      }
    }
    return (0, ts_utils_1.succeed)(parsed);
  } catch (error) {
    return (0, ts_utils_1.fail)(
      'Failed to parse manifest: '.concat(error instanceof Error ? error.message : String(error))
    );
  }
}
/**
 * Parse and validate configuration JSON
 */
function parseConfiguration(configData) {
  try {
    var parsed = JSON.parse(configData);
    // Basic validation - check for expected properties
    if (typeof parsed !== 'object' || parsed === null) {
      return (0, ts_utils_1.fail)('Invalid configuration: not an object');
    }
    // More detailed validation could be added here using ts-res validators
    return (0, ts_utils_1.succeed)(parsed);
  } catch (error) {
    return (0, ts_utils_1.fail)(
      'Failed to parse configuration: '.concat(error instanceof Error ? error.message : String(error))
    );
  }
}
/**
 * Convert ZIP file tree to ImportedFiles array
 */
function zipTreeToFiles(tree) {
  var files = [];
  for (var _i = 0, _a = Array.from(tree.files.entries()); _i < _a.length; _i++) {
    var _b = _a[_i],
      path = _b[0],
      item = _b[1];
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
function zipTreeToDirectory(tree) {
  if (tree.files.size === 0) {
    return null;
  }
  // Build directory structure
  var directories = new Map();
  var rootDir = {
    name: tree.root || 'root',
    files: [],
    subdirectories: []
  };
  directories.set('', rootDir);
  // Process all paths to build directory structure
  for (var _i = 0, _a = Array.from(tree.files.entries()); _i < _a.length; _i++) {
    var _b = _a[_i],
      path = _b[0],
      item = _b[1];
    var pathParts = path.split('/').filter(function (part) {
      return part.length > 0;
    });
    if (pathParts.length === 0) continue;
    // Ensure all parent directories exist
    var currentPath = '';
    for (var i = 0; i < pathParts.length - 1; i++) {
      var parentPath = currentPath;
      currentPath = currentPath ? ''.concat(currentPath, '/').concat(pathParts[i]) : pathParts[i];
      if (!directories.has(currentPath)) {
        var newDir = {
          name: pathParts[i],
          files: [],
          subdirectories: []
        };
        directories.set(currentPath, newDir);
        // Add to parent directory
        var parentDir = directories.get(parentPath);
        if (parentDir) {
          parentDir.subdirectories = parentDir.subdirectories || [];
          parentDir.subdirectories.push(newDir);
        }
      }
    }
    // Add file to its parent directory
    if (!item.isDirectory && item.content && typeof item.content === 'string') {
      var fileName = pathParts[pathParts.length - 1];
      var parentPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
      var parentDir = directories.get(parentPath);
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
function getFileType(filename) {
  var ext = filename.toLowerCase().split('.').pop();
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
function normalizePath(path) {
  return path.replace(/\\/g, '/').replace(/\/+/g, '/');
}
/**
 * Extract directory name from a file path
 */
function getDirectoryName(path) {
  var normalized = normalizePath(path);
  var parts = normalized.split('/');
  return parts[parts.length - 1] || 'archive';
}
/**
 * Create a safe filename by removing invalid characters
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim();
}
/**
 * Format file size in human readable format
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  var sizes = ['B', 'KB', 'MB', 'GB'];
  var i = Math.floor(Math.log(bytes) / Math.log(1024));
  var size = bytes / Math.pow(1024, i);
  return ''.concat(size.toFixed(i === 0 ? 0 : 1), ' ').concat(sizes[i]);
}
/**
 * Validate ZIP file extension
 */
function isZipFile(filename) {
  return filename.toLowerCase().endsWith('.zip');
}
/**
 * Extract base name from filename (without extension)
 */
function getBaseName(filename) {
  var name = filename.split('/').pop() || filename;
  var dotIndex = name.lastIndexOf('.');
  return dotIndex > 0 ? name.substring(0, dotIndex) : name;
}
//# sourceMappingURL=zipUtils.js.map
