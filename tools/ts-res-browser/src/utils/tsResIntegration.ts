import { Result, succeed, fail, FileTree } from '@fgv/ts-utils';
import {
  QualifierTypes,
  Qualifiers,
  ResourceTypes,
  Resources,
  Import,
  Runtime,
  ResourceJson
} from '@fgv/ts-res';
import { ImportedDirectory, ImportedFile } from './fileImport';
import { BrowserFileTreeAccessors } from './browserFileTreeAccessors';

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
  qualifierTypes: QualifierTypes.QualifierTypeCollector;
  qualifiers: Qualifiers.QualifierCollector;
  resourceTypes: ResourceTypes.ResourceTypeCollector;
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
 * Default qualifier declarations for ts-res browser tool
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
    tokenIsOptional: true
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
 * Creates a complete ts-res system setup
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
 * Processes imported directory through ts-res ImportManager using fsTree
 */
export function processImportedFiles(
  files: ImportedFile[],
  system?: TsResSystem
): Result<ProcessedResources> {
  if (files.length === 0) {
    return fail('No files provided for processing');
  }

  return (system ? succeed(system) : createTsResSystem()).onSuccess((tsResSystem) => {
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
        return finalizeProcessing(updatedSystem);
      })
      .withErrorFormat((message) => `processImportedFiles failed: ${message}`);
  });
}

export function processImportedDirectory(
  directory: ImportedDirectory,
  system?: TsResSystem
): Result<ProcessedResources> {
  return (system ? succeed(system) : createTsResSystem()).onSuccess((tsResSystem) => {
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
        return finalizeProcessing(updatedSystem);
      })
      .withErrorFormat((message) => `processImportedDirectory failed: ${message}`);
  });
}

/**
 * Finalizes processing and creates compiled resources
 */
function finalizeProcessing(system: TsResSystem): Result<ProcessedResources> {
  console.log('=== FINALIZING PROCESSING ===');
  console.log('Resource manager resources:', system.resourceManager.resources.size);
  console.log('Resource manager resource keys:', Array.from(system.resourceManager.resources.keys()));

  return system.resourceManager
    .getCompiledResourceCollection()
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

/**
 * Creates a simple context for resource resolution
 */
export function createSimpleContext(
  contextValues: Record<string, string>,
  system: TsResSystem
): Result<Runtime.ValidatingSimpleContextQualifierProvider> {
  return Runtime.ValidatingSimpleContextQualifierProvider.create({
    qualifiers: system.qualifiers
  })
    .onSuccess((provider): Result<Runtime.ValidatingSimpleContextQualifierProvider> => {
      // Set context values
      for (const [qualifierName, value] of Object.entries(contextValues)) {
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
