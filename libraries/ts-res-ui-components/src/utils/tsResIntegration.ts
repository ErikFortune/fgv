import { Result, succeed, fail, FileTree } from '@fgv/ts-utils';
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
import { ImportedDirectory, ImportedFile } from '../types';

/**
 * Get the default system configuration from ts-res library
 */
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
export function convertImportedDirectoryToFileTree(directory: ImportedDirectory): FileTree.FileTree {
  // Convert files to IInMemoryFile format and flatten the directory structure
  const flattenFiles = (
    dir: ImportedDirectory,
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

  // Use ts-res's inMemory FileTree utility
  return FileTree.inMemory(inMemoryFiles).orThrow((msg) => `Failed to create file tree: ${msg}`);
}

/**
 * Create ts-res system from configuration
 */
export function createTsResSystemFromConfig(systemConfig?: Config.Model.ISystemConfiguration): Result<{
  qualifierTypes: QualifierTypes.ReadOnlyQualifierTypeCollector;
  qualifiers: Qualifiers.IReadOnlyQualifierCollector;
  resourceTypes: ResourceTypes.ReadOnlyResourceTypeCollector;
  resourceManager: Resources.ResourceManagerBuilder;
  importManager: Import.ImportManager;
  contextQualifierProvider: Runtime.ValidatingSimpleContextQualifierProvider;
}> {
  const configToUse = systemConfig ?? getDefaultSystemConfiguration();

  return Config.SystemConfiguration.create(configToUse)
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
export function processImportedFiles(
  files: ImportedFile[],
  systemConfig?: Config.Model.ISystemConfiguration
): Result<{
  system: {
    qualifierTypes: QualifierTypes.ReadOnlyQualifierTypeCollector;
    qualifiers: Qualifiers.IReadOnlyQualifierCollector;
    resourceTypes: ResourceTypes.ReadOnlyResourceTypeCollector;
    resourceManager: Resources.ResourceManagerBuilder;
    importManager: Import.ImportManager;
    contextQualifierProvider: Runtime.ValidatingSimpleContextQualifierProvider;
  };
  compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection;
  compiledResourceCollectionManager: Runtime.CompiledResourceCollection | null;
  resolver: Runtime.ResourceResolver;
  resourceCount: number;
  summary: {
    totalResources: number;
    resourceIds: string[];
    errorCount: number;
    warnings: string[];
  };
}> {
  if (files.length === 0) {
    return fail('No files provided for processing');
  }

  return createTsResSystemFromConfig(systemConfig)
    .onSuccess<{
      system: {
        qualifierTypes: QualifierTypes.ReadOnlyQualifierTypeCollector;
        qualifiers: Qualifiers.IReadOnlyQualifierCollector;
        resourceTypes: ResourceTypes.ReadOnlyResourceTypeCollector;
        resourceManager: Resources.ResourceManagerBuilder;
        importManager: Import.ImportManager;
        contextQualifierProvider: Runtime.ValidatingSimpleContextQualifierProvider;
      };
      compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection;
      compiledResourceCollectionManager: Runtime.CompiledResourceCollection | null;
      resolver: Runtime.ResourceResolver;
      resourceCount: number;
      summary: {
        totalResources: number;
        resourceIds: string[];
        errorCount: number;
        warnings: string[];
      };
    }>((tsResSystem) => {
      // Convert ImportedFile[] to IInMemoryFile[] format
      const inMemoryFiles = files.map((file) => ({
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
          for (const file of files) {
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
          return finalizeProcessing(updatedSystem);
        });
    })
    .withErrorFormat((message) => `processImportedFiles failed: ${message}`);
}

/**
 * Process imported directory using the ts-res system
 */
export function processImportedDirectory(
  directory: ImportedDirectory,
  systemConfig?: Config.Model.ISystemConfiguration
): Result<{
  system: {
    qualifierTypes: QualifierTypes.ReadOnlyQualifierTypeCollector;
    qualifiers: Qualifiers.IReadOnlyQualifierCollector;
    resourceTypes: ResourceTypes.ReadOnlyResourceTypeCollector;
    resourceManager: Resources.ResourceManagerBuilder;
    importManager: Import.ImportManager;
    contextQualifierProvider: Runtime.ValidatingSimpleContextQualifierProvider;
  };
  compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection;
  compiledResourceCollectionManager: Runtime.CompiledResourceCollection | null;
  resolver: Runtime.ResourceResolver;
  resourceCount: number;
  summary: {
    totalResources: number;
    resourceIds: string[];
    errorCount: number;
    warnings: string[];
  };
}> {
  return createTsResSystemFromConfig(systemConfig)
    .onSuccess<{
      system: {
        qualifierTypes: QualifierTypes.ReadOnlyQualifierTypeCollector;
        qualifiers: Qualifiers.IReadOnlyQualifierCollector;
        resourceTypes: ResourceTypes.ReadOnlyResourceTypeCollector;
        resourceManager: Resources.ResourceManagerBuilder;
        importManager: Import.ImportManager;
        contextQualifierProvider: Runtime.ValidatingSimpleContextQualifierProvider;
      };
      compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection;
      compiledResourceCollectionManager: Runtime.CompiledResourceCollection | null;
      resolver: Runtime.ResourceResolver;
      resourceCount: number;
      summary: {
        totalResources: number;
        resourceIds: string[];
        errorCount: number;
        warnings: string[];
      };
    }>((tsResSystem) => {
      // Convert directory to file tree
      const fileTree = convertImportedDirectoryToFileTree(directory);

      return Import.ImportManager.create({
        fileTree,
        resources: tsResSystem.resourceManager
      }).onSuccess((importManager) => {
        // Import from root path
        const importResult = importManager.importFromFileSystem('/');
        if (importResult.isFailure()) {
          return fail(`Failed to import directory ${directory.name}: ${importResult.message}`);
        }

        // Finalize processing
        const updatedSystem = {
          ...tsResSystem,
          importManager
        };
        return finalizeProcessing(updatedSystem);
      });
    })
    .withErrorFormat((message) => `processImportedDirectory failed: ${message}`);
}

/**
 * Finalizes processing and creates compiled resources
 */
function finalizeProcessing(system: {
  qualifierTypes: QualifierTypes.ReadOnlyQualifierTypeCollector;
  qualifiers: Qualifiers.IReadOnlyQualifierCollector;
  resourceTypes: ResourceTypes.ReadOnlyResourceTypeCollector;
  resourceManager: Resources.ResourceManagerBuilder;
  importManager: Import.ImportManager;
  contextQualifierProvider: Runtime.ValidatingSimpleContextQualifierProvider;
}): Result<{
  system: typeof system;
  compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection;
  compiledResourceCollectionManager: Runtime.CompiledResourceCollection | null;
  resolver: Runtime.ResourceResolver;
  resourceCount: number;
  summary: {
    totalResources: number;
    resourceIds: string[];
    errorCount: number;
    warnings: string[];
  };
}> {
  return system.resourceManager
    .getCompiledResourceCollection({ includeMetadata: true })
    .onSuccess((compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection) => {
      // Create CompiledResourceCollection manager
      return createCompiledResourceCollectionManager(
        compiledCollection,
        system.qualifierTypes,
        system.resourceTypes
      ).onSuccess((compiledManager) => {
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
            compiledResourceCollectionManager: compiledManager,
            resolver,
            resourceCount: resourceIds.length,
            summary
          });
        });
      });
    })
    .withErrorFormat((message) => `Failed to finalize processing: ${message}`);
}

/**
 * Creates a CompiledResourceCollection instance from compiled collection data
 * This provides runtime access to compiled resources with proper object reconstruction
 */
export function createCompiledResourceCollectionManager(
  compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection,
  qualifierTypes: QualifierTypes.ReadOnlyQualifierTypeCollector,
  resourceTypes: ResourceTypes.ReadOnlyResourceTypeCollector
): Result<Runtime.CompiledResourceCollection> {
  // Convert collectors to the maps expected by CompiledResourceCollection
  const qualifierTypeMap = new Map<string, QualifierTypes.QualifierType>();
  for (const qualifierType of qualifierTypes.values()) {
    qualifierTypeMap.set(qualifierType.name, qualifierType);
  }

  const resourceTypeMap = new Map<string, ResourceTypes.ResourceType>();
  for (const resourceType of resourceTypes.values()) {
    resourceTypeMap.set(resourceType.key, resourceType);
  }

  return Runtime.CompiledResourceCollection.create({
    compiledCollection,
    qualifierTypes: {
      get: (name: string) => {
        const qualifierType = qualifierTypeMap.get(name);
        return qualifierType ? succeed(qualifierType) : fail(`Qualifier type '${name}' not found`);
      }
    } as unknown as QualifierTypes.ReadOnlyQualifierTypeCollector,
    resourceTypes: {
      get: (name: string) => {
        const resourceType = resourceTypeMap.get(name);
        return resourceType ? succeed(resourceType) : fail(`Resource type '${name}' not found`);
      }
    } as unknown as ResourceTypes.ReadOnlyResourceTypeCollector
  });
}
