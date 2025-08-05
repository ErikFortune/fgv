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
  const defaultResult = Config.getPredefinedDeclaration('default');
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
export function createSimpleContext(
  qualifiers: Qualifiers.IReadOnlyQualifierCollector,
  values: Record<string, string | undefined>
): Result<Runtime.ValidatingSimpleContextQualifierProvider> {
  try {
    return Runtime.ValidatingSimpleContextQualifierProvider.create({
      qualifiers
    });
  } catch (error) {
    return fail(`Failed to create context: ${error instanceof Error ? error.message : String(error)}`);
  }
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
  const fileTreeResult = FileTree.inMemory(inMemoryFiles);
  if (fileTreeResult.isFailure()) {
    throw new Error(`Failed to create file tree: ${fileTreeResult.message}`);
  }

  return fileTreeResult.value;
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

  return Config.SystemConfiguration.create(configToUse).onSuccess((systemConfiguration) => {
    try {
      // Set up resource manager
      const resourceManager = Resources.ResourceManagerBuilder.create({
        qualifiers: systemConfiguration.qualifiers,
        resourceTypes: systemConfiguration.resourceTypes
      }).orThrow();

      // Set up import manager
      const importManager = Import.ImportManager.create({
        resources: resourceManager
      }).orThrow();

      // Set up context qualifier provider
      const contextQualifierProvider = Runtime.ValidatingSimpleContextQualifierProvider.create({
        qualifiers: systemConfiguration.qualifiers
      }).orThrow();

      return succeed({
        qualifierTypes: systemConfiguration.qualifierTypes,
        qualifiers: systemConfiguration.qualifiers,
        resourceTypes: systemConfiguration.resourceTypes,
        resourceManager,
        importManager,
        contextQualifierProvider
      });
    } catch (error) {
      return fail(
        `Failed to create ts-res system: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
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

  const systemResult = createTsResSystemFromConfig(systemConfig);
  if (systemResult.isFailure()) {
    return systemResult as any; // Type assertion needed for return type compatibility
  }

  const tsResSystem = systemResult.value;

  // Convert ImportedFile[] to IInMemoryFile[] format
  const inMemoryFiles = files.map((file) => ({
    path: file.path || file.name,
    contents: file.content
  }));

  return (FileTree.inMemory(inMemoryFiles) as any)
    .onSuccess((fileTree: any) => {
      return Import.ImportManager.create({
        fileTree,
        resources: tsResSystem.resourceManager
      }) as any;
    })
    .onSuccess((importManager: any) => {
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
    })
    .withErrorFormat((message: string) => `processImportedFiles failed: ${message}`);
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
  resolver: Runtime.ResourceResolver;
  resourceCount: number;
  summary: {
    totalResources: number;
    resourceIds: string[];
    errorCount: number;
    warnings: string[];
  };
}> {
  const systemResult = createTsResSystemFromConfig(systemConfig);
  if (systemResult.isFailure()) {
    return systemResult as any; // Type assertion needed for return type compatibility
  }

  const tsResSystem = systemResult.value;

  // Convert directory to file tree
  const fileTree = convertImportedDirectoryToFileTree(directory);

  return (
    Import.ImportManager.create({
      fileTree,
      resources: tsResSystem.resourceManager
    }) as any
  )
    .onSuccess((importManager: any) => {
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
    })
    .withErrorFormat((message: string) => `processImportedDirectory failed: ${message}`);
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
          warnings: []
        };

        return succeed({
          system,
          compiledCollection,
          resolver,
          resourceCount: resourceIds.length,
          summary
        });
      });
    })
    .withErrorFormat((message: string) => `Failed to finalize processing: ${message}`);
}
