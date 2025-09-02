'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getDefaultSystemConfiguration = getDefaultSystemConfiguration;
exports.createSimpleContext = createSimpleContext;
exports.convertImportedDirectoryToFileTree = convertImportedDirectoryToFileTree;
exports.createTsResSystemFromConfig = createTsResSystemFromConfig;
exports.processImportedFiles = processImportedFiles;
exports.processImportedDirectory = processImportedDirectory;
const tslib_1 = require('tslib');
const ts_utils_1 = require('@fgv/ts-utils');
const ts_res_1 = require('@fgv/ts-res');
const ObservabilityTools = tslib_1.__importStar(require('../utils/observability'));
/**
 * Get the default system configuration from ts-res library
 */
/** @internal */
function getDefaultSystemConfiguration() {
  return ts_res_1.Config.getPredefinedDeclaration('default').orDefault({
    // Fallback configuration if predefined default is not available
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
  });
}
/**
 * Create a simple context provider from qualifier values
 */
/** @internal */
function createSimpleContext(qualifiers, values) {
  return ts_res_1.Runtime.ValidatingSimpleContextQualifierProvider.create({
    qualifiers
  }).withErrorFormat((e) => `Failed to create context: ${e}`);
}
/**
 * Convert ImportedDirectory to FileTree format
 */
/** @internal */
function convertImportedDirectoryToFileTree(
  directory,
  o11y = ObservabilityTools.DefaultObservabilityContext
) {
  // Convert files to IInMemoryFile format and flatten the directory structure
  const flattenFiles = (dir, parentPath = '') => {
    const files = [];
    // Add files from current directory
    if (dir.files) {
      dir.files.forEach((file) => {
        const filePath = parentPath ? `${parentPath}/${file.name}` : file.name;
        files.push({
          path: filePath,
          contents: file.content
        });
      });
    }
    // Recursively process subdirectories
    if (dir.subdirectories) {
      dir.subdirectories.forEach((subdir) => {
        const subdirPath = parentPath ? `${parentPath}/${subdir.name}` : subdir.name;
        files.push(...flattenFiles(subdir, subdirPath));
      });
    }
    return files;
  };
  const inMemoryFiles = flattenFiles(directory);
  o11y.diag.info('[convertImportedDirectoryToFileTree] Converting directory to FileTree:', {
    directoryName: directory.name,
    directoryPath: directory.path,
    numFiles: directory.files?.length || 0,
    numSubdirs: directory.subdirectories?.length || 0,
    totalFlattenedFiles: inMemoryFiles.length,
    sampleFiles: inMemoryFiles.slice(0, 3).map((f) => f.path)
  });
  // Use ts-res's inMemory FileTree utility
  return ts_utils_1.FileTree.inMemory(inMemoryFiles).orThrow((msg) => `Failed to create file tree: ${msg}`);
}
/**
 * Create ts-res system from configuration
 */
/** @internal */
function createTsResSystemFromConfig(systemConfig, qualifierTypeFactory, resourceTypeFactory) {
  const configToUse = systemConfig ?? getDefaultSystemConfiguration();
  return ts_res_1.Config.SystemConfiguration.create(configToUse, {
    qualifierTypeFactory,
    resourceTypeFactory
  })
    .onSuccess((systemConfiguration) => {
      return ts_res_1.Resources.ResourceManagerBuilder.create({
        qualifiers: systemConfiguration.qualifiers,
        resourceTypes: systemConfiguration.resourceTypes
      })
        .withErrorFormat((e) => `Failed to create resource manager: ${e}`)
        .onSuccess((resourceManager) => {
          return ts_res_1.Import.ImportManager.create({
            resources: resourceManager
          })
            .withErrorFormat((e) => `Failed to create import manager: ${e}`)
            .onSuccess((importManager) => {
              return ts_res_1.Runtime.ValidatingSimpleContextQualifierProvider.create({
                qualifiers: systemConfiguration.qualifiers
              })
                .withErrorFormat((e) => `Failed to create context qualifier provider: ${e}`)
                .onSuccess((contextQualifierProvider) => {
                  return (0, ts_utils_1.succeed)({
                    qualifierTypes: systemConfiguration.qualifierTypes,
                    qualifiers: systemConfiguration.qualifiers,
                    resourceTypes: systemConfiguration.resourceTypes,
                    resourceManager,
                    importManager,
                    contextQualifierProvider
                  });
                });
            });
        });
    })
    .withErrorFormat((e) => `Failed to create ts-res system: ${e}`);
}
/**
 * Process imported files using the ts-res system
 */
/** @internal */
function processImportedFiles(
  files,
  systemConfig,
  qualifierTypeFactory,
  resourceTypeFactory,
  o11y = ObservabilityTools.DefaultObservabilityContext
) {
  if (files.length === 0) {
    return (0, ts_utils_1.fail)('No files provided for processing');
  }
  return createTsResSystemFromConfig(systemConfig, qualifierTypeFactory, resourceTypeFactory)
    .onSuccess((tsResSystem) => {
      // Convert ImportedFile[] to IInMemoryFile[] format
      const inMemoryFiles = files.map((file) => ({
        path: file.path || file.name,
        contents: file.content
      }));
      return ts_utils_1.FileTree.inMemory(inMemoryFiles)
        .onSuccess((fileTree) => {
          return ts_res_1.Import.ImportManager.create({
            fileTree,
            resources: tsResSystem.resourceManager
          });
        })
        .onSuccess((importManager) => {
          // Import each file using its filesystem path
          for (const file of files) {
            const importResult = importManager.importFromFileSystem(file.path || file.name);
            if (importResult.isFailure()) {
              return (0, ts_utils_1.fail)(
                `Failed to import file ${file.path || file.name}: ${importResult.message}`
              );
            }
          }
          // Finalize processing
          const updatedSystem = {
            ...tsResSystem,
            importManager
          };
          const configToUse = systemConfig ?? getDefaultSystemConfiguration();
          return finalizeProcessing(updatedSystem, configToUse);
        });
    })
    .withErrorFormat((message) => `processImportedFiles failed: ${message}`);
}
/**
 * Process imported directory using the ts-res system
 */
/** @internal */
function processImportedDirectory(
  directory,
  systemConfig,
  qualifierTypeFactory,
  resourceTypeFactory,
  o11y = ObservabilityTools.DefaultObservabilityContext
) {
  return createTsResSystemFromConfig(systemConfig, qualifierTypeFactory, resourceTypeFactory)
    .onSuccess((tsResSystem) => {
      // Convert directory to file tree
      const fileTree = convertImportedDirectoryToFileTree(directory, o11y);
      return ts_res_1.Import.ImportManager.create({
        fileTree,
        resources: tsResSystem.resourceManager
      }).onSuccess((importManager) => {
        // Simply try to import from the filesystem root
        // The ImportManager will handle finding and importing all resources
        o11y.diag.info('[tsResIntegration] Starting resource import from FileTree');
        const importResult = importManager.importFromFileSystem('/');
        if (importResult.isFailure()) {
          o11y.diag.warn(`[tsResIntegration] Failed to import from root, trying individual files`);
          // If root import fails, try to import files individually
          // We'll recursively traverse the tree using the FileTree API
          let importedCount = 0;
          const failedImports = [];
          const importDirectory = (dirPath) => {
            const dirResult = fileTree.getDirectory(dirPath);
            if (dirResult.isSuccess()) {
              const dir = dirResult.value;
              const childrenResult = dir.getChildren();
              if (childrenResult.isSuccess()) {
                for (const child of childrenResult.value) {
                  if (child.type === 'file' && child.name.endsWith('.json')) {
                    o11y.diag.info(`[tsResIntegration] Importing file: ${child.absolutePath}`);
                    const fileImportResult = importManager.importFromFileSystem(child.absolutePath);
                    if (fileImportResult.isSuccess()) {
                      importedCount++;
                      o11y.diag.info(`[tsResIntegration] Successfully imported ${child.absolutePath}`);
                    } else {
                      o11y.diag.warn(
                        `[tsResIntegration] Failed to import ${child.absolutePath}: ${fileImportResult.message}`
                      );
                      failedImports.push({ file: child.absolutePath, error: fileImportResult.message });
                    }
                  } else if (child.type === 'directory') {
                    importDirectory(child.absolutePath);
                  }
                }
              }
            }
          };
          // Start from root
          importDirectory('/');
          // Also try without leading slash
          if (importedCount === 0) {
            importDirectory('');
          }
          o11y.diag.info(`[tsResIntegration] Import complete. Imported ${importedCount} files`);
          if (importedCount === 0 && failedImports.length > 0) {
            // Create a summary of unique errors
            const errorSummary = new Map();
            failedImports.forEach(({ file, error }) => {
              // Extract the main error (e.g., "invalid item: role: not found")
              const mainError = error.split('\n')[0];
              if (!errorSummary.has(mainError)) {
                errorSummary.set(mainError, []);
              }
              errorSummary.get(mainError).push(file);
            });
            let errorMessage = `Failed to import resources. Missing qualifiers in configuration:\n`;
            errorSummary.forEach((files, error) => {
              errorMessage += `- ${error} (${files.length} file${files.length > 1 ? 's' : ''})\n`;
            });
            return (0, ts_utils_1.fail)(errorMessage);
          } else if (importedCount === 0) {
            return (0, ts_utils_1.fail)(`No resource files found in ${directory.name}`);
          }
        } else {
          o11y.diag.info('[tsResIntegration] Successfully imported resources from root');
        }
        // Finalize processing
        const updatedSystem = {
          ...tsResSystem,
          importManager
        };
        const configToUse = systemConfig ?? getDefaultSystemConfiguration();
        return finalizeProcessing(updatedSystem, configToUse);
      });
    })
    .withErrorFormat((message) => `processImportedDirectory failed: ${message}`);
}
/**
 * Finalizes processing and creates compiled resources
 */
function finalizeProcessing(system, systemConfig) {
  return system.resourceManager
    .getCompiledResourceCollection({ includeMetadata: true })
    .onSuccess((compiledCollection) => {
      // Create resolver directly without CompiledResourceCollection manager
      return ts_res_1.Runtime.ResourceResolver.create({
        resourceManager: system.resourceManager,
        qualifierTypes: system.qualifierTypes,
        contextQualifierProvider: system.contextQualifierProvider
      }).onSuccess((resolver) => {
        // Create summary
        const resourceIds = Array.from(system.resourceManager.resources.keys());
        const summary = {
          totalResources: resourceIds.length,
          resourceIds,
          errorCount: 0,
          warnings: []
        };
        return (0, ts_utils_1.succeed)({
          system,
          compiledCollection,
          resolver,
          resourceCount: resourceIds.length,
          summary,
          ...(systemConfig && { activeConfiguration: systemConfig })
        });
      });
    })
    .withErrorFormat((message) => `Failed to finalize processing: ${message}`);
}
// Note: createCompiledResourceCollectionManager was removed as part of the refactoring
// We now always use ResourceManagerBuilder as the primary data structure
//# sourceMappingURL=tsResIntegration.js.map
