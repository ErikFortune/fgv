'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getDefaultSystemConfiguration = getDefaultSystemConfiguration;
exports.createSimpleContext = createSimpleContext;
exports.convertImportedDirectoryToFileTree = convertImportedDirectoryToFileTree;
exports.createTsResSystemFromConfig = createTsResSystemFromConfig;
exports.processImportedFiles = processImportedFiles;
exports.processImportedDirectory = processImportedDirectory;
var tslib_1 = require('tslib');
var ts_utils_1 = require('@fgv/ts-utils');
var ts_res_1 = require('@fgv/ts-res');
/**
 * Get the default system configuration from ts-res library
 */
function getDefaultSystemConfiguration() {
  var defaultResult = ts_res_1.Config.getPredefinedDeclaration('default');
  if (defaultResult.isSuccess()) {
    return defaultResult.value;
  }
  // Fallback configuration if predefined default is not available
  return {
    name: 'Browser Default Configuration',
    description: 'Fallback default configuration for ts-res browser tool',
    qualifierTypes: [
      {
        name: 'language',
        systemType: 'language',
        configuration: {
          allowContextList: true
        }
      },
      {
        name: 'territory',
        systemType: 'territory',
        configuration: {
          allowContextList: false
        }
      }
    ],
    qualifiers: [
      {
        name: 'currentTerritory',
        token: 'geo',
        typeName: 'territory',
        defaultPriority: 850
      },
      {
        name: 'language',
        token: 'lang',
        typeName: 'language',
        defaultPriority: 800
      }
    ],
    resourceTypes: [
      {
        name: 'json',
        typeName: 'json'
      }
    ]
  };
}
/**
 * Create a simple context provider from qualifier values
 */
function createSimpleContext(qualifiers, values) {
  try {
    return ts_res_1.Runtime.ValidatingSimpleContextQualifierProvider.create({
      qualifiers: qualifiers
    });
  } catch (error) {
    return (0, ts_utils_1.fail)(
      'Failed to create context: '.concat(error instanceof Error ? error.message : String(error))
    );
  }
}
/**
 * Convert ImportedDirectory to FileTree format
 */
function convertImportedDirectoryToFileTree(directory) {
  // Convert files to IInMemoryFile format and flatten the directory structure
  var flattenFiles = function (dir, parentPath) {
    if (parentPath === void 0) {
      parentPath = '';
    }
    var files = [];
    // Add files from current directory
    if (dir.files) {
      dir.files.forEach(function (file) {
        var filePath = parentPath ? ''.concat(parentPath, '/').concat(file.name) : file.name;
        files.push({
          path: filePath,
          contents: file.content
        });
      });
    }
    // Recursively process subdirectories
    if (dir.subdirectories) {
      dir.subdirectories.forEach(function (subdir) {
        var subdirPath = parentPath ? ''.concat(parentPath, '/').concat(subdir.name) : subdir.name;
        files.push.apply(files, flattenFiles(subdir, subdirPath));
      });
    }
    return files;
  };
  var inMemoryFiles = flattenFiles(directory);
  // Use ts-res's inMemory FileTree utility
  var fileTreeResult = ts_utils_1.FileTree.inMemory(inMemoryFiles);
  if (fileTreeResult.isFailure()) {
    throw new Error('Failed to create file tree: '.concat(fileTreeResult.message));
  }
  return fileTreeResult.value;
}
/**
 * Create ts-res system from configuration
 */
function createTsResSystemFromConfig(systemConfig) {
  var configToUse =
    systemConfig !== null && systemConfig !== void 0 ? systemConfig : getDefaultSystemConfiguration();
  return ts_res_1.Config.SystemConfiguration.create(configToUse).onSuccess(function (systemConfiguration) {
    try {
      // Set up resource manager
      var resourceManager = ts_res_1.Resources.ResourceManagerBuilder.create({
        qualifiers: systemConfiguration.qualifiers,
        resourceTypes: systemConfiguration.resourceTypes
      }).orThrow();
      // Set up import manager
      var importManager = ts_res_1.Import.ImportManager.create({
        resources: resourceManager
      }).orThrow();
      // Set up context qualifier provider
      var contextQualifierProvider = ts_res_1.Runtime.ValidatingSimpleContextQualifierProvider.create({
        qualifiers: systemConfiguration.qualifiers
      }).orThrow();
      return (0, ts_utils_1.succeed)({
        qualifierTypes: systemConfiguration.qualifierTypes,
        qualifiers: systemConfiguration.qualifiers,
        resourceTypes: systemConfiguration.resourceTypes,
        resourceManager: resourceManager,
        importManager: importManager,
        contextQualifierProvider: contextQualifierProvider
      });
    } catch (error) {
      return (0,
      ts_utils_1.fail)('Failed to create ts-res system: '.concat(error instanceof Error ? error.message : String(error)));
    }
  });
}
/**
 * Process imported files using the ts-res system
 */
function processImportedFiles(files, systemConfig) {
  if (files.length === 0) {
    return (0, ts_utils_1.fail)('No files provided for processing');
  }
  var systemResult = createTsResSystemFromConfig(systemConfig);
  if (systemResult.isFailure()) {
    return systemResult; // Type assertion needed for return type compatibility
  }
  var tsResSystem = systemResult.value;
  // Convert ImportedFile[] to IInMemoryFile[] format
  var inMemoryFiles = files.map(function (file) {
    return {
      path: file.path || file.name,
      contents: file.content
    };
  });
  return ts_utils_1.FileTree.inMemory(inMemoryFiles)
    .onSuccess(function (fileTree) {
      return ts_res_1.Import.ImportManager.create({
        fileTree: fileTree,
        resources: tsResSystem.resourceManager
      });
    })
    .onSuccess(function (importManager) {
      // Import each file using its filesystem path
      for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
        var file = files_1[_i];
        var importResult = importManager.importFromFileSystem(file.path || file.name);
        if (importResult.isFailure()) {
          return (0, ts_utils_1.fail)(
            'Failed to import file '.concat(file.path || file.name, ': ').concat(importResult.message)
          );
        }
      }
      // Finalize processing
      var updatedSystem = tslib_1.__assign(tslib_1.__assign({}, tsResSystem), {
        importManager: importManager
      });
      return finalizeProcessing(updatedSystem);
    })
    .withErrorFormat(function (message) {
      return 'processImportedFiles failed: '.concat(message);
    });
}
/**
 * Process imported directory using the ts-res system
 */
function processImportedDirectory(directory, systemConfig) {
  var systemResult = createTsResSystemFromConfig(systemConfig);
  if (systemResult.isFailure()) {
    return systemResult; // Type assertion needed for return type compatibility
  }
  var tsResSystem = systemResult.value;
  // Convert directory to file tree
  var fileTree = convertImportedDirectoryToFileTree(directory);
  return ts_res_1.Import.ImportManager.create({
    fileTree: fileTree,
    resources: tsResSystem.resourceManager
  })
    .onSuccess(function (importManager) {
      // Import from root path
      var importResult = importManager.importFromFileSystem('/');
      if (importResult.isFailure()) {
        return (0, ts_utils_1.fail)(
          'Failed to import directory '.concat(directory.name, ': ').concat(importResult.message)
        );
      }
      // Finalize processing
      var updatedSystem = tslib_1.__assign(tslib_1.__assign({}, tsResSystem), {
        importManager: importManager
      });
      return finalizeProcessing(updatedSystem);
    })
    .withErrorFormat(function (message) {
      return 'processImportedDirectory failed: '.concat(message);
    });
}
/**
 * Finalizes processing and creates compiled resources
 */
function finalizeProcessing(system) {
  return system.resourceManager
    .getCompiledResourceCollection({ includeMetadata: true })
    .onSuccess(function (compiledCollection) {
      return ts_res_1.Runtime.ResourceResolver.create({
        resourceManager: system.resourceManager,
        qualifierTypes: system.qualifierTypes,
        contextQualifierProvider: system.contextQualifierProvider
      }).onSuccess(function (resolver) {
        // Create summary
        var resourceIds = Array.from(system.resourceManager.resources.keys());
        var summary = {
          totalResources: resourceIds.length,
          resourceIds: resourceIds,
          errorCount: 0,
          warnings: []
        };
        return (0, ts_utils_1.succeed)({
          system: system,
          compiledCollection: compiledCollection,
          resolver: resolver,
          resourceCount: resourceIds.length,
          summary: summary
        });
      });
    })
    .withErrorFormat(function (message) {
      return 'Failed to finalize processing: '.concat(message);
    });
}
//# sourceMappingURL=tsResIntegration.js.map
