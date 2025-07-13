import { Result, succeed, fail } from '@fgv/ts-utils';
import { FsTree } from '@fgv/ts-utils';
import { QualifierTypes, Qualifiers, ResourceTypes, Resources, Import, Runtime } from '@fgv/ts-res';
import { ImportedDirectory, ImportedFile } from './fileImport';

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
}

/**
 * Result of processing resources
 */
export interface ProcessedResources {
  system: TsResSystem;
  compiledCollection: Runtime.CompiledResourceCollection;
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
    token: 'home',
    tokenIsOptional: true
  },
  {
    name: 'currentTerritory',
    typeName: 'territory',
    defaultPriority: 700
  },
  {
    name: 'language',
    typeName: 'language',
    defaultPriority: 600
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

    return succeed({
      qualifierTypes,
      qualifiers,
      resourceTypes,
      resourceManager,
      importManager
    });
  } catch (error) {
    return fail(`Failed to create ts-res system: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Processes imported directory through ts-res ImportManager using fsTree
 */
export function processImportedDirectory(
  directory: ImportedDirectory,
  system?: TsResSystem
): Result<ProcessedResources> {
  try {
    const tsResSystem = system ?? createTsResSystem().orThrow();

    // Create fsTree from imported directory structure
    const fsTree = createFsTreeFromDirectory(directory).orThrow();

    // Import using the ts-res ImportManager with fsTree
    const importResult = tsResSystem.importManager.importFromFsTree(fsTree);
    if (importResult.isFailure()) {
      return fail(`Failed to import from fsTree: ${importResult.error}`);
    }

    return finalizeProcessing(tsResSystem);
  } catch (error) {
    return fail(`Failed to process directory: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Processes individual imported files through ts-res ImportManager using fsTree
 */
export function processImportedFiles(
  files: ImportedFile[],
  system?: TsResSystem
): Result<ProcessedResources> {
  try {
    const tsResSystem = system ?? createTsResSystem().orThrow();

    // Create fsTree from imported files
    const fsTree = createFsTreeFromFiles(files).orThrow();

    // Import using the ts-res ImportManager with fsTree
    const importResult = tsResSystem.importManager.importFromFsTree(fsTree);
    if (importResult.isFailure()) {
      return fail(`Failed to import from fsTree: ${importResult.error}`);
    }

    return finalizeProcessing(tsResSystem);
  } catch (error) {
    return fail(`Failed to process files: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Creates an fsTree from an ImportedDirectory structure
 */
function createFsTreeFromDirectory(directory: ImportedDirectory): Result<FsTree.FsTree> {
  try {
    // Create root fsTree
    const fsTree = FsTree.FsTree.createEmpty().orThrow();

    // Add directory structure to fsTree
    addDirectoryToFsTree(fsTree, directory, directory.path).orThrow();

    return succeed(fsTree);
  } catch (error) {
    return fail(
      `Failed to create fsTree from directory: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Creates an fsTree from an array of ImportedFile
 */
function createFsTreeFromFiles(files: ImportedFile[]): Result<FsTree.FsTree> {
  try {
    // Create root fsTree
    const fsTree = FsTree.FsTree.createEmpty().orThrow();

    // Add each file to fsTree
    for (const file of files) {
      const addResult = fsTree.addFile(file.path, file.content);
      if (addResult.isFailure()) {
        return fail(`Failed to add file ${file.path}: ${addResult.error}`);
      }
    }

    return succeed(fsTree);
  } catch (error) {
    return fail(
      `Failed to create fsTree from files: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Recursively adds directory structure to fsTree
 */
function addDirectoryToFsTree(
  fsTree: FsTree.FsTree,
  directory: ImportedDirectory,
  basePath: string
): Result<void> {
  try {
    // Add all files in this directory
    for (const file of directory.files) {
      const filePath = `${basePath}/${file.name}`;
      const addResult = fsTree.addFile(filePath, file.content);
      if (addResult.isFailure()) {
        return fail(`Failed to add file ${filePath}: ${addResult.error}`);
      }
    }

    // Recursively add subdirectories
    for (const subDirectory of directory.directories) {
      const subPath = `${basePath}/${subDirectory.name}`;
      const addResult = addDirectoryToFsTree(fsTree, subDirectory, subPath);
      if (addResult.isFailure()) {
        return addResult;
      }
    }

    return succeed(undefined);
  } catch (error) {
    return fail(
      `Failed to add directory to fsTree: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Finalizes processing and creates compiled resources
 */
function finalizeProcessing(system: TsResSystem): Result<ProcessedResources> {
  try {
    // Build and compile resources
    const compiledCollection = system.resourceManager.getCompiledResourceCollection().orThrow();

    // Create resource resolver
    const resolver = Runtime.ResourceResolver.create({ resources: compiledCollection }).orThrow();

    // Create summary
    const resourceIds = Array.from(system.resourceManager.resources.keys());
    const summary = {
      totalResources: resourceIds.length,
      resourceIds,
      errorCount: 0, // TODO: Track errors during processing
      warnings: [] // TODO: Collect warnings during processing
    };

    return succeed({
      system,
      compiledCollection,
      resolver,
      resourceCount: resourceIds.length,
      summary
    });
  } catch (error) {
    return fail(`Failed to finalize processing: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Creates a simple context for resource resolution
 */
export function createSimpleContext(
  contextValues: Record<string, string>,
  system: TsResSystem
): Result<Runtime.ValidatingSimpleContextQualifierProvider> {
  try {
    const provider = Runtime.ValidatingSimpleContextQualifierProvider.create({
      qualifiers: system.qualifiers
    }).orThrow();

    // Set context values
    for (const [qualifierName, value] of Object.entries(contextValues)) {
      const setResult = provider.setValue(qualifierName as any, value as any);
      if (setResult.isFailure()) {
        return fail(`Failed to set context value ${qualifierName}=${value}: ${setResult.error}`);
      }
    }

    return succeed(provider);
  } catch (error) {
    return fail(`Failed to create context: ${error instanceof Error ? error.message : String(error)}`);
  }
}
