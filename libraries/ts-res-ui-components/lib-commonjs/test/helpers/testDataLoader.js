'use strict';
/*
 * Copyright (c) 2025 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.createUniqueTempPath = createUniqueTempPath;
exports.loadTestConfiguration = loadTestConfiguration;
exports.loadTestResources = loadTestResources;
exports.writeTempFile = writeTempFile;
exports.writeTempResourceFiles = writeTempResourceFiles;
exports.loadTestBundleFile = loadTestBundleFile;
exports.cleanupTempPath = cleanupTempPath;
const fs_1 = require('fs');
const path_1 = require('path');
const ts_utils_1 = require('@fgv/ts-utils');
/**
 * Base path for test fixtures - using existing test data in monorepo
 */
const PROJECT_ROOT = (0, path_1.dirname)((0, path_1.dirname)((0, path_1.dirname)(__dirname)));
const FIXTURES_PATH = (0, path_1.join)(PROJECT_ROOT, '../../data/test/ts-res');
const TEMP_PATH = (0, path_1.join)(PROJECT_ROOT, 'temp');
/**
 * Generate a unique temp folder name with timestamp and random suffix
 */
function createUniqueTempPath(prefix = 'test') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const uniqueName = `${prefix}-${timestamp}-${random}`;
  const tempPath = (0, path_1.join)(TEMP_PATH, uniqueName);
  // Create the temp directory
  (0, fs_1.mkdirSync)(tempPath, { recursive: true });
  return tempPath;
}
/**
 * Load a test configuration file from the existing test data
 */
function loadTestConfiguration(testSet, filename) {
  try {
    let configPath;
    if (testSet === 'default') {
      configPath = (0, path_1.join)(FIXTURES_PATH, 'default', filename || 'default-config.json');
    } else if (testSet === 'custom-config') {
      configPath = (0, path_1.join)(FIXTURES_PATH, 'custom-config', filename || 'resources-config.json');
    } else if (testSet === 'extended-example') {
      configPath = (0, path_1.join)(FIXTURES_PATH, 'extended-example', filename || 'configuration.json');
    } else {
      return (0, ts_utils_1.fail)(`Unknown test set: ${testSet}`);
    }
    const configData = (0, fs_1.readFileSync)(configPath, 'utf8');
    const config = JSON.parse(configData);
    return (0, ts_utils_1.succeed)(config);
  } catch (error) {
    return (0, ts_utils_1.fail)(`Failed to load test configuration from ${testSet}/${filename}: ${error}`);
  }
}
/**
 * Load test resource files from a test set
 */
function loadTestResources(testSet) {
  try {
    const resourcesPath = (0, path_1.join)(FIXTURES_PATH, testSet, 'resources');
    const fs = require('fs');
    if (!(0, fs_1.existsSync)(resourcesPath)) {
      return (0, ts_utils_1.fail)(`Test resource directory for ${testSet} does not exist`);
    }
    const files = [];
    function readDirectory(dir, basePath = '') {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = (0, path_1.join)(dir, entry.name);
        const relativePath = (0, path_1.join)(basePath, entry.name);
        if (entry.isDirectory()) {
          readDirectory(fullPath, relativePath);
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
          const content = (0, fs_1.readFileSync)(fullPath, 'utf8');
          files.push({ path: relativePath, content });
        }
      }
    }
    readDirectory(resourcesPath);
    return (0, ts_utils_1.succeed)(files);
  } catch (error) {
    return (0, ts_utils_1.fail)(`Failed to load test resources from ${testSet}: ${error}`);
  }
}
/**
 * Write test data to a temp file
 */
function writeTempFile(tempDir, filename, content) {
  try {
    const filePath = (0, path_1.join)(tempDir, filename);
    const fileDir = (0, path_1.dirname)(filePath);
    // Ensure directory exists
    if (!(0, fs_1.existsSync)(fileDir)) {
      (0, fs_1.mkdirSync)(fileDir, { recursive: true });
    }
    (0, fs_1.writeFileSync)(filePath, content, 'utf8');
    return (0, ts_utils_1.succeed)(filePath);
  } catch (error) {
    return (0, ts_utils_1.fail)(`Failed to write temp file ${filename}: ${error}`);
  }
}
/**
 * Write test data structure to temp directory
 */
function writeTempResourceFiles(tempDir, files) {
  try {
    const writtenPaths = [];
    for (const file of files) {
      const result = writeTempFile(tempDir, file.path, file.content);
      if (result.isFailure()) {
        return (0, ts_utils_1.fail)(`Failed to write resource file ${file.path}: ${result.message}`);
      }
      writtenPaths.push(result.value);
    }
    return (0, ts_utils_1.succeed)(writtenPaths);
  } catch (error) {
    return (0, ts_utils_1.fail)(`Failed to write temp resource files: ${error}`);
  }
}
/**
 * Load a test bundle file as buffer or text
 */
function loadTestBundleFile(filename = 'extended.resource-bundle.json', asBuffer = false) {
  try {
    const bundlePath = (0, path_1.join)(FIXTURES_PATH, filename);
    if (asBuffer) {
      const buffer = (0, fs_1.readFileSync)(bundlePath);
      return (0, ts_utils_1.succeed)(buffer);
    } else {
      const text = (0, fs_1.readFileSync)(bundlePath, 'utf8');
      return (0, ts_utils_1.succeed)(text);
    }
  } catch (error) {
    return (0, ts_utils_1.fail)(`Failed to load test bundle file ${filename}: ${error}`);
  }
}
/**
 * Clean up temp directory (optional - temp folder is git-ignored)
 */
function cleanupTempPath(tempPath) {
  try {
    const fs = require('fs');
    if ((0, fs_1.existsSync)(tempPath)) {
      fs.rmSync(tempPath, { recursive: true, force: true });
    }
  } catch (error) {
    console.warn(`Warning: Failed to cleanup temp path ${tempPath}:`, error);
  }
}
//# sourceMappingURL=testDataLoader.js.map
