import { Result, succeed, fail } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import {
  QualifierTypes,
  Qualifiers,
  ResourceTypes,
  Resources,
  Import,
  Runtime,
  ResourceJson,
  Config
} from '@fgv/ts-res';
import { IImportedDirectory, IImportedFile, IExtendedProcessedResources } from '../types';
import * as ObservabilityTools from '../utils/observability';

/**
 * Get the default system configuration from ts-res library
 */
/** @internal */
export function getDefaultSystemConfiguration(): Config.Model.ISystemConfiguration {
  return Config.getPredefinedDeclaration('default').orDefault({
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
export function createSimpleContext(
  qualifiers: Qualifiers.IReadOnlyQualifierCollector,
  values: Record<string, string | undefined>
): Result<Runtime.ValidatingSimpleContextQualifierProvider> {
  return Runtime.ValidatingSimpleContextQualifierProvider.create({
    qualifiers
  }).withErrorFormat((e) => `Failed to create context: ${e}`);
}

/**
 * Convert ImportedDirectory to FileTree format
 */
/** @internal */
export function convertImportedDirectoryToFileTree(
  directory: IImportedDirectory,
  o11y: ObservabilityTools.IObservabilityContext = ObservabilityTools.DefaultObservabilityContext
): FileTree.FileTree {
  // Convert files to IInMemoryFile format and flatten the directory structure
  const flattenFiles = (
    dir: IImportedDirectory,
    parentPath: string = ''
  ): Array<{ path: string; contents: string }> => {
    const files: Array<{ path: string; contents: string }> = [];

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
  return FileTree.inMemory(inMemoryFiles).orThrow((msg) => `Failed to create file tree: ${msg}`);
}

/**
 * Create ts-res system from configuration
 */
/** @internal */
export function createTsResSystemFromConfig(
  systemConfig?: Config.Model.ISystemConfiguration,
  qualifierTypeFactory?: Config.IConfigInitFactory<
    QualifierTypes.Config.IAnyQualifierTypeConfig,
    QualifierTypes.QualifierType
  >,
  resourceTypeFactory?: Config.IConfigInitFactory<
    ResourceTypes.Config.IResourceTypeConfig,
    ResourceTypes.ResourceType
  >
): Result<{
  qualifierTypes: QualifierTypes.ReadOnlyQualifierTypeCollector;
  qualifiers: Qualifiers.IReadOnlyQualifierCollector;
  resourceTypes: ResourceTypes.ReadOnlyResourceTypeCollector;
  resourceManager: Resources.ResourceManagerBuilder;
  importManager: Import.ImportManager;
  contextQualifierProvider: Runtime.ValidatingSimpleContextQualifierProvider;
}> {
  const configToUse = systemConfig ?? getDefaultSystemConfiguration();

  return Config.SystemConfiguration.create(configToUse, {
    qualifierTypeFactory,
    resourceTypeFactory
  })
    .onSuccess((systemConfiguration) => {
      return Resources.ResourceManagerBuilder.create({
        qualifiers: systemConfiguration.qualifiers,
        resourceTypes: systemConfiguration.resourceTypes
      })
        .withErrorFormat((e) => `Failed to create resource manager: ${e}`)
        .onSuccess((resourceManager) => {
          return Import.ImportManager.create({
            resources: resourceManager
          })
            .withErrorFormat((e) => `Failed to create import manager: ${e}`)
            .onSuccess((importManager) => {
              return Runtime.ValidatingSimpleContextQualifierProvider.create({
                qualifiers: systemConfiguration.qualifiers
              })
                .withErrorFormat((e) => `Failed to create context qualifier provider: ${e}`)
                .onSuccess((contextQualifierProvider) => {
                  return succeed({
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
export interface ICreateProcessImportedFilesParams {
  files: IImportedFile[];
  systemConfig?: Config.Model.ISystemConfiguration;
  qualifierTypeFactory?: Config.IConfigInitFactory<
    QualifierTypes.Config.IAnyQualifierTypeConfig,
    QualifierTypes.QualifierType
  >;
  resourceTypeFactory?: Config.IConfigInitFactory<
    ResourceTypes.Config.IResourceTypeConfig,
    ResourceTypes.ResourceType
  >;
  o11y?: ObservabilityTools.IObservabilityContext;
}

/** @internal */
export function processImportedFiles(
  params: ICreateProcessImportedFilesParams
): Result<IExtendedProcessedResources> {
  if (params.files.length === 0) {
    return fail('No files provided for processing');
  }

  return createTsResSystemFromConfig(
    params.systemConfig,
    params.qualifierTypeFactory,
    params.resourceTypeFactory
  )
    .onSuccess<IExtendedProcessedResources>((tsResSystem) => {
      // Convert ImportedFile[] to IInMemoryFile[] format
      const inMemoryFiles = params.files.map((file) => ({
        path: file.path || file.name,
        contents: file.content
      }));

      return FileTree.inMemory(inMemoryFiles)
        .onSuccess((fileTree) => {
          return Import.ImportManager.create({
            fileTree,
            resources: tsResSystem.resourceManager
          });
        })
        .onSuccess((importManager) => {
          // Import each file using its filesystem path
          for (const file of params.files) {
            const importResult = importManager.importFromFileSystem(file.path || file.name);
            if (importResult.isFailure()) {
              return fail(`Failed to import file ${file.path || file.name}: ${importResult.message}`);
            }
          }

          // Finalize processing
          const updatedSystem = {
            ...tsResSystem,
            importManager
          };
          const configToUse = params.systemConfig ?? getDefaultSystemConfiguration();
          return finalizeProcessing(updatedSystem, configToUse);
        });
    })
    .withErrorFormat((message) => `processImportedFiles failed: ${message}`);
}

/**
 * Parameters for processImportedDirectory
 */
/** @internal */
export interface ICreateProcessImportedDirectoryParams {
  directory: IImportedDirectory;
  systemConfig?: Config.Model.ISystemConfiguration;
  qualifierTypeFactory?: Config.IConfigInitFactory<
    QualifierTypes.Config.IAnyQualifierTypeConfig,
    QualifierTypes.QualifierType
  >;
  resourceTypeFactory?: Config.IConfigInitFactory<
    ResourceTypes.Config.IResourceTypeConfig,
    ResourceTypes.ResourceType
  >;
  o11y?: ObservabilityTools.IObservabilityContext;
}

/**
 * Process imported directory using the ts-res system
 */
/** @internal */
export function processImportedDirectory(
  params: ICreateProcessImportedDirectoryParams
): Result<IExtendedProcessedResources> {
  const o11y = params.o11y ?? ObservabilityTools.DefaultObservabilityContext;

  return createTsResSystemFromConfig(
    params.systemConfig,
    params.qualifierTypeFactory,
    params.resourceTypeFactory
  )
    .onSuccess<IExtendedProcessedResources>((tsResSystem) => {
      // Convert directory to file tree
      const fileTree = convertImportedDirectoryToFileTree(params.directory, o11y);

      return Import.ImportManager.create({
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
          const failedImports: Array<{ file: string; error: string }> = [];

          const importDirectory = (dirPath: string): void => {
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
            const errorSummary = new Map<string, string[]>();
            failedImports.forEach(({ file, error }) => {
              // Extract the main error (e.g., "invalid item: role: not found")
              const mainError = error.split('\n')[0];
              if (!errorSummary.has(mainError)) {
                errorSummary.set(mainError, []);
              }
              errorSummary.get(mainError)!.push(file);
            });

            let errorMessage = `Failed to import resources. Missing qualifiers in configuration:\n`;
            errorSummary.forEach((files, error) => {
              errorMessage += `- ${error} (${files.length} file${files.length > 1 ? 's' : ''})\n`;
            });

            return fail(errorMessage);
          } else if (importedCount === 0) {
            return fail(`No resource files found in ${params.directory.name}`);
          }
        } else {
          o11y.diag.info('[tsResIntegration] Successfully imported resources from root');
        }

        // Finalize processing
        const updatedSystem = {
          ...tsResSystem,
          importManager
        };
        const configToUse = params.systemConfig ?? getDefaultSystemConfiguration();
        return finalizeProcessing(updatedSystem, configToUse);
      });
    })
    .withErrorFormat((message) => `processImportedDirectory failed: ${message}`);
}

/**
 * Finalizes processing and creates compiled resources
 */
function finalizeProcessing(
  system: {
    qualifierTypes: QualifierTypes.ReadOnlyQualifierTypeCollector;
    qualifiers: Qualifiers.IReadOnlyQualifierCollector;
    resourceTypes: ResourceTypes.ReadOnlyResourceTypeCollector;
    resourceManager: Resources.ResourceManagerBuilder;
    importManager: Import.ImportManager;
    contextQualifierProvider: Runtime.ValidatingSimpleContextQualifierProvider;
  },
  systemConfig?: Config.Model.ISystemConfiguration
): Result<IExtendedProcessedResources> {
  return system.resourceManager
    .getCompiledResourceCollection({ includeMetadata: true })
    .onSuccess((compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection) => {
      // Create resolver directly without CompiledResourceCollection manager
      return Runtime.ResourceResolver.create({
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
          warnings: [] as string[]
        };

        return succeed({
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
