'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.readFilesFromInput = readFilesFromInput;
exports.filesToDirectory = filesToDirectory;
exports.exportAsJson = exportAsJson;
exports.exportUsingFileSystemAPI = exportUsingFileSystemAPI;
/**
 * Read files from file input element
 */
/** @internal */
async function readFilesFromInput(files) {
  const importedFiles = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const content = await readFileContent(file);
    importedFiles.push({
      name: file.name,
      path: file.webkitRelativePath || file.name,
      content,
      type: file.type
    });
  }
  return importedFiles;
}
/**
 * Read file content as text
 */
function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result);
    };
    reader.onerror = (e) => {
      reject(new Error(`Failed to read file ${file.name}: ${e}`));
    };
    reader.readAsText(file);
  });
}
/**
 * Convert flat file list to directory structure
 */
/** @internal */
function filesToDirectory(files) {
  // Group files by directory path
  const filesByPath = new Map();
  const dirPaths = new Set();
  files.forEach((file) => {
    if (file.path) {
      const parts = file.path.split('/');
      if (parts.length > 1) {
        // File is in a subdirectory
        const dirPath = parts.slice(0, -1).join('/');
        dirPaths.add(dirPath);
        if (!filesByPath.has(dirPath)) {
          filesByPath.set(dirPath, []);
        }
        filesByPath.get(dirPath).push({
          ...file,
          name: parts[parts.length - 1]
        });
      } else {
        // File is in root
        if (!filesByPath.has('')) {
          filesByPath.set('', []);
        }
        filesByPath.get('').push(file);
      }
    } else {
      // No path, add to root
      if (!filesByPath.has('')) {
        filesByPath.set('', []);
      }
      filesByPath.get('').push(file);
    }
  });
  // Build directory tree
  const buildDirectory = (path, name) => {
    const dir = {
      name,
      path,
      files: filesByPath.get(path) || [],
      subdirectories: []
    };
    // Find subdirectories
    const prefix = path ? `${path}/` : '';
    dirPaths.forEach((dirPath) => {
      if (dirPath.startsWith(prefix)) {
        const remaining = dirPath.slice(prefix.length);
        if (remaining && !remaining.includes('/')) {
          // This is a direct subdirectory
          dir.subdirectories.push(buildDirectory(dirPath, remaining));
        }
      }
    });
    return dir;
  };
  return buildDirectory('', 'root');
}
/**
 * Export data as JSON file
 */
/** @internal */
function exportAsJson(data, filename) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
/**
 * Export data using File System Access API if available
 */
/** @internal */
async function exportUsingFileSystemAPI(data, suggestedName, description = 'JSON files') {
  if (!('showSaveFilePicker' in window)) {
    return false;
  }
  try {
    const fileHandle = await window.showSaveFilePicker({
      suggestedName,
      types: [
        {
          description,
          accept: {
            'application/json': ['.json']
          }
        }
      ]
    });
    const json = JSON.stringify(data, null, 2);
    const writable = await fileHandle.createWritable();
    await writable.write(json);
    await writable.close();
    return true;
  } catch (error) {
    // User cancelled or other error
    if (error.name === 'AbortError') {
      return false;
    }
    throw error;
  }
}
//# sourceMappingURL=fileProcessing.js.map
