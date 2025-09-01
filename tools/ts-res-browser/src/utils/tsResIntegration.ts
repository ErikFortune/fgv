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
import { ImportedDirectory, ImportedFile } from './fileImport';
import { BrowserFileTreeAccessors } from './browserFileTreeAccessors';
import { isTsResSystem, extractSystemConfiguration } from './typeGuards';

/**
 * Configuration for setting up ts-res system
 */
export interface TsResConfig {
  qualifierDecls?: Qualifiers.IQualifierDecl[];
  additionalQualifierTypes?: QualifierTypes.QualifierType[];
  additionalResourceTypes?: ResourceTypes.ResourceType[];
}

/**
 * Complete ts-res system setup
 */
export interface TsResSystem {
  qualifierTypes: QualifierTypes.ReadOnlyQualifierTypeCollector;
  qualifiers: Qualifiers.IReadOnlyQualifierCollector;
  resourceTypes: ResourceTypes.ReadOnlyResourceTypeCollector;
  resourceManager: Resources.ResourceManagerBuilder;
  importManager: Import.ImportManager;
  contextQualifierProvider: Runtime.ValidatingSimpleContextQualifierProvider;
}

/**
 * Result of processing resources
 */
export interface ProcessedResources {
  system: TsResSystem;
  compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection;
  resolver: Runtime.ResourceResolver;
  resourceCount: number;
  summary: {
    totalResources: number;
    resourceIds: string[];
    errorCount: number;
    warnings: string[];
  };
}

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
 * Default system configuration for ts-res browser tool
 * Now uses the predefined default from ts-res library
 */
export const DEFAULT_SYSTEM_CONFIGURATION: Config.Model.ISystemConfiguration =
  getDefaultSystemConfiguration();

/**
 * Get all available predefined configuration options
 */
export function getAvailablePredefinedConfigurations(): {
  name: Config.PredefinedSystemConfiguration;
  label: string;
  description: string;
}[] {
  return [
    {
      name: 'default',
      label: 'Default',
      description: 'Default system configuration'
    },
    {
      name: 'language-priority',
      label: 'Language Priority',
      description: 'Language priority system configuration'
    },
    {
      name: 'territory-priority',
      label: 'Territory Priority',
      description: 'Territory priority system configuration'
    },
    {
      name: 'extended-example',
      label: 'Extended Example',
      description: 'Extended example configuration with market, role, environment, and currency qualifiers'
    }
  ];
}

/**
 * Get a predefined configuration by name
 */
export function getPredefinedConfiguration(
  name: Config.PredefinedSystemConfiguration
): Result<Config.Model.ISystemConfiguration> {
  return Config.getPredefinedDeclaration(name);
}

/**
 * Legacy default qualifier declarations for backward compatibility
 */
export const DEFAULT_QUALIFIER_DECLARATIONS: Qualifiers.IQualifierDecl[] = [
  {
    name: 'homeTerritory',
    typeName: 'territory',
    defaultPriority: 800,
    token: 'home'
  },
  {
    name: 'currentTerritory',
    typeName: 'territory',
    defaultPriority: 700
  },
  {
    name: 'language',
    typeName: 'language',
    defaultPriority: 600,
    token: 'lang'
  },
  {
    name: 'role',
    typeName: 'literal',
    defaultPriority: 550
  },
  {
    name: 'env',
    typeName: 'literal',
    defaultPriority: 500
  },
  {
    name: 'platform',
    typeName: 'literal',
    defaultPriority: 450
  },
  {
    name: 'density',
    typeName: 'literal',
    defaultPriority: 400
  }
];

/**
 * Creates a complete ts-res system setup using SystemConfiguration
 */
export function createTsResSystemFromConfig(
  systemConfig?: Config.Model.ISystemConfiguration
): Result<TsResSystem> {
  const configToUse = systemConfig ?? DEFAULT_SYSTEM_CONFIGURATION;

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
 * Legacy function - creates a complete ts-res system setup using manual construction
 * @deprecated Use createTsResSystemFromConfig instead
 */
export function createTsResSystem(config: TsResConfig = {}): Result<TsResSystem> {
  try {
    // Set up qualifier types
    const defaultQualifierTypes = [
      QualifierTypes.LanguageQualifierType.create().orThrow(),
      QualifierTypes.TerritoryQualifierType.create().orThrow(),
      QualifierTypes.LiteralQualifierType.create().orThrow()
    ];

    const qualifierTypes = QualifierTypes.QualifierTypeCollector.create({
      qualifierTypes: [...defaultQualifierTypes, ...(config.additionalQualifierTypes ?? [])]
    }).orThrow();

    // Set up qualifiers
    const qualifierDecls = config.qualifierDecls ?? DEFAULT_QUALIFIER_DECLARATIONS;
    const qualifiers = Qualifiers.QualifierCollector.create({
      qualifierTypes,
      qualifiers: qualifierDecls
    }).orThrow();

    // Set up resource types
    const defaultResourceTypes = [ResourceTypes.JsonResourceType.create().orThrow()];

    const resourceTypes = ResourceTypes.ResourceTypeCollector.create({
      resourceTypes: [...defaultResourceTypes, ...(config.additionalResourceTypes ?? [])]
    }).orThrow();

    // Set up resource manager
    const resourceManager = Resources.ResourceManagerBuilder.create({
      qualifiers,
      resourceTypes
    }).orThrow();

    // Set up import manager
    const importManager = Import.ImportManager.create({
      resources: resourceManager
    }).orThrow();

    // Set up context qualifier provider
    const contextQualifierProvider = Runtime.ValidatingSimpleContextQualifierProvider.create({
      qualifiers
    }).orThrow();

    return succeed({
      qualifierTypes,
      qualifiers,
      resourceTypes,
      resourceManager,
      importManager,
      contextQualifierProvider
    });
  } catch (error) {
    return fail(`Failed to create ts-res system: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Processes imported files through ts-res ImportManager
 */
export function processImportedFiles(
  files: ImportedFile[],
  systemConfigOrSystem?: Config.Model.ISystemConfiguration | TsResSystem
): Result<ProcessedResources> {
  if (files.length === 0) {
    return fail('No files provided for processing');
  }

  // Determine if we have a system or a config using proper type checking
  const systemResult =
    systemConfigOrSystem && isTsResSystem(systemConfigOrSystem)
      ? succeed(systemConfigOrSystem)
      : createTsResSystemFromConfig(systemConfigOrSystem);

  // Keep track of the original config for passing to finalizeProcessing
  const originalConfig = extractSystemConfiguration(systemConfigOrSystem);

  return systemResult.onSuccess((tsResSystem) => {
    // If no config was provided, we need to get the DEFAULT_SYSTEM_CONFIGURATION
    // that was used to create the system
    const configToUse = originalConfig ?? DEFAULT_SYSTEM_CONFIGURATION;
    // Convert ImportedFile[] to IInMemoryFile[] format
    const inMemoryFiles = files.map((file) => ({
      path: file.path,
      contents: file.content
    }));

    return FileTree.inMemory(inMemoryFiles)
      .onSuccess((fileTree) => {
        return Import.ImportManager.create({
          fileTree,
          resources: tsResSystem.resourceManager
        });
      })
      .onSuccess<ProcessedResources>((importManager) => {
        // Import each file using its filesystem path
        for (const file of files) {
          const importResult = importManager.importFromFileSystem(file.path);
          if (importResult.isFailure()) {
            return fail(`Failed to import file ${file.path}: ${importResult.message}`);
          }
        }
        // Update the system with the new ImportManager
        const updatedSystem = {
          ...tsResSystem,
          importManager
        };
        return finalizeProcessing(updatedSystem, configToUse);
      })
      .withErrorFormat((message) => `processImportedFiles failed: ${message}`);
  });
}

export function processImportedDirectory(
  directory: ImportedDirectory,
  systemConfigOrSystem?: Config.Model.ISystemConfiguration | TsResSystem
): Result<ProcessedResources> {
  // Determine if we have a system or a config using proper type checking
  const systemResult =
    systemConfigOrSystem && isTsResSystem(systemConfigOrSystem)
      ? succeed(systemConfigOrSystem)
      : createTsResSystemFromConfig(systemConfigOrSystem);

  // Keep track of the original config for passing to finalizeProcessing
  const originalConfig = extractSystemConfiguration(systemConfigOrSystem);

  return systemResult.onSuccess((tsResSystem) => {
    // If no config was provided, we need to get the DEFAULT_SYSTEM_CONFIGURATION
    // that was used to create the system
    const configToUse = originalConfig ?? DEFAULT_SYSTEM_CONFIGURATION;
    // Create custom FileTree that preserves directory structure
    return BrowserFileTreeAccessors.create(directory)
      .onSuccess((accessors) => {
        return FileTree.FileTree.create(accessors);
      })
      .onSuccess((fileTree) => {
        return Import.ImportManager.create({
          fileTree,
          resources: tsResSystem.resourceManager
        });
      })
      .onSuccess<ProcessedResources>((importManager) => {
        // Import from root path since we set the imported directory as the FileTree root
        // The importer will traverse the tree structure and extract qualifiers from directory names
        const importResult = importManager.importFromFileSystem('/');
        if (importResult.isFailure()) {
          return fail(`Failed to import directory ${directory.name}: ${importResult.message}`);
        }

        // Update the system with the new ImportManager
        const updatedSystem = {
          ...tsResSystem,
          importManager
        };
        return finalizeProcessing(updatedSystem, configToUse);
      })
      .withErrorFormat((message) => `processImportedDirectory failed: ${message}`);
  });
}

/**
 * Processes FileTree directly without conversion to ImportedFile/ImportedDirectory
 */
export function processFileTreeDirectly(
  fileTree: FileTree.FileTree,
  rootPath: string = '/',
  systemConfigOrSystem?: Config.Model.ISystemConfiguration | TsResSystem
): Result<ProcessedResources> {
  // Determine if we have a system or a config
  const systemResult =
    systemConfigOrSystem &&
    'qualifierTypes' in systemConfigOrSystem &&
    'resourceManager' in systemConfigOrSystem
      ? succeed(systemConfigOrSystem as TsResSystem)
      : createTsResSystemFromConfig(systemConfigOrSystem as Config.Model.ISystemConfiguration);

  return systemResult.onSuccess((tsResSystem) => {
    return Import.ImportManager.create({
      fileTree,
      resources: tsResSystem.resourceManager
    })
      .onSuccess<ProcessedResources>((importManager) => {
        // Import from the specified root path
        const importResult = importManager.importFromFileSystem(rootPath);
        if (importResult.isFailure()) {
          return fail(`Failed to import from FileTree at ${rootPath}: ${importResult.message}`);
        }

        // Update the system with the new ImportManager
        const updatedSystem = {
          ...tsResSystem,
          importManager
        };
        return finalizeProcessing(updatedSystem, configToUse);
      })
      .withErrorFormat((message) => `processFileTreeDirectly failed: ${message}`);
  });
}

/**
 * Finalizes processing and creates compiled resources
 */
export function finalizeProcessing(
  system: TsResSystem,
  systemConfiguration?: Config.Model.ISystemConfiguration
): Result<ProcessedResources> {
  console.log('=== FINALIZING PROCESSING ===');
  console.log('Resource manager resources:', system.resourceManager.resources.size);
  console.log('Resource manager resource keys:', Array.from(system.resourceManager.resources.keys()));

  return system.resourceManager
    .getCompiledResourceCollection({ includeMetadata: true })
    .onSuccess((compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection) => {
      console.log('=== COMPILED COLLECTION CREATED ===');
      console.log('Compiled collection data:', compiledCollection);
      console.log('Decisions length:', compiledCollection.decisions?.length);
      console.log('ConditionSets length:', compiledCollection.conditionSets?.length);
      console.log('Conditions length:', compiledCollection.conditions?.length);
      console.log('Resources length:', compiledCollection.resources?.length);

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
          errorCount: 0, // TODO: Track errors during processing
          warnings: [] // TODO: Collect warnings during processing
        };

        console.log('=== FINALIZATION COMPLETE ===');
        console.log('Resource count:', resourceIds.length);
        console.log('Resource IDs:', resourceIds);

        const result = {
          system,
          compiledCollection,
          resolver,
          resourceCount: resourceIds.length,
          summary,
          ...(systemConfiguration && { activeConfiguration: systemConfiguration })
        };

        return succeed(result);
      });
    })
    .withErrorFormat((message: string) => `Failed to finalize processing: ${message}`);
}

/**
 * Creates ProcessedResources from a loaded IResourceManager (from bundle).
 * This is different from finalizeProcessing which works with a ResourceManagerBuilder.
 */
export function createProcessedResourcesFromManager(
  resourceManager: Runtime.IResourceManager,
  systemConfig: Config.Model.ISystemConfiguration,
  compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection
): Result<ProcessedResources> {
  console.log('=== CREATING PROCESSED RESOURCES FROM MANAGER ===');

  return Config.SystemConfiguration.create(systemConfig).onSuccess((systemConfiguration) => {
    try {
      // Set up context qualifier provider
      const contextQualifierProvider = Runtime.ValidatingSimpleContextQualifierProvider.create({
        qualifiers: systemConfiguration.qualifiers
      }).orThrow();

      console.log('Using compiled collection from bundle');

      // Create a new resolver
      return Runtime.ResourceResolver.create({
        resourceManager,
        qualifierTypes: systemConfiguration.qualifierTypes,
        contextQualifierProvider
      }).onSuccess((resolver) => {
        // Create summary from available data
        // Get resource IDs from the compiled collection since IResourceManager doesn't have getAllResources
        const resourceIds = compiledCollection.resources?.map((r) => r.id) || [];

        const summary = {
          totalResources: resourceIds.length,
          resourceIds,
          errorCount: 0,
          warnings: []
        };

        // Create a minimal TsResSystem for compatibility
        // Note: We don't have access to the original ResourceManagerBuilder,
        // so we create a new one for compatibility purposes
        const compatResourceManagerBuilder = Resources.ResourceManagerBuilder.create({
          qualifiers: systemConfiguration.qualifiers,
          resourceTypes: systemConfiguration.resourceTypes
        }).orThrow();

        const importManager = Import.ImportManager.create({
          resources: compatResourceManagerBuilder
        }).orThrow();

        // Create the system for compatibility
        const system: TsResSystem = {
          qualifierTypes: systemConfiguration.qualifierTypes,
          qualifiers: systemConfiguration.qualifiers,
          resourceTypes: systemConfiguration.resourceTypes,
          resourceManager: compatResourceManagerBuilder,
          importManager,
          contextQualifierProvider
        };

        console.log('=== PROCESSED RESOURCES FROM MANAGER COMPLETE ===');
        console.log('Resource count:', resourceIds.length);
        console.log('Resource IDs:', resourceIds);

        return succeed({
          system,
          compiledCollection,
          resolver,
          resourceCount: resourceIds.length,
          summary,
          activeConfiguration: systemConfiguration
        });
      });
    } catch (error) {
      return fail(
        `Failed to create processed resources from manager: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  });
}

/**
 * Creates a simple context for resource resolution
 */
export function createSimpleContext(
  contextValues: Record<string, string | undefined>,
  system: TsResSystem
): Result<Runtime.ValidatingSimpleContextQualifierProvider> {
  return Runtime.ValidatingSimpleContextQualifierProvider.create({
    qualifiers: system.qualifiers
  })
    .onSuccess((provider): Result<Runtime.ValidatingSimpleContextQualifierProvider> => {
      // Set context values (skip undefined values)
      for (const [qualifierName, value] of Object.entries(contextValues)) {
        if (value === undefined) {
          continue; // Skip undefined values
        }
        try {
          provider.set(qualifierName as any, value as any);
        } catch (error) {
          return fail(
            `Failed to set context value ${qualifierName}=${value}: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }

      return succeed(provider);
    })
    .withErrorFormat((message) => `Failed to create context: ${message}`);
}
