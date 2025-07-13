import { Result, succeed, fail, FileTree } from '@fgv/ts-utils';
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
  contextQualifierProvider: Runtime.ValidatingSimpleContextQualifierProvider;
}

/**
 * Result of processing resources
 */
export interface ProcessedResources {
  system: TsResSystem;
  compiledCollection: any; // TODO: Fix type later
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

/**
 * Processes individual imported files through ts-res ImportManager using fsTree
 */
/**
 * Recursively collects all files from an ImportedDirectory structure
 */
function collectFilesFromDirectory(directory: ImportedDirectory): ImportedFile[] {
  const files: ImportedFile[] = [];

  // Add files from current directory
  files.push(...directory.files);

  // Recursively add files from subdirectories
  for (const subDirectory of directory.directories) {
    files.push(...collectFilesFromDirectory(subDirectory));
  }

  return files;
}

export function processImportedDirectory(
  directory: ImportedDirectory,
  system?: TsResSystem
): Result<ProcessedResources> {
  // Convert ImportedDirectory to ImportedFile[] format
  const files = collectFilesFromDirectory(directory);

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
      .withErrorFormat((message) => `processImportedDirectory failed: ${message}`);
  });
}

/**
 * Find common directory from a list of file paths
 */
function findCommonDirectory(paths: string[]): string {
  if (paths.length === 0) return '.';
  if (paths.length === 1) {
    // For a single file, use its directory
    const lastSlash = paths[0].lastIndexOf('/');
    return lastSlash > 0 ? paths[0].substring(0, lastSlash) : '.';
  }

  // Find common prefix
  let commonPath = paths[0];
  for (let i = 1; i < paths.length; i++) {
    const path = paths[i];
    let j = 0;
    while (j < commonPath.length && j < path.length && commonPath[j] === path[j]) {
      j++;
    }
    commonPath = commonPath.substring(0, j);
  }

  // Ensure we end at a directory boundary
  const lastSlash = commonPath.lastIndexOf('/');
  return lastSlash > 0 ? commonPath.substring(0, lastSlash) : '.';
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
  return system.resourceManager
    .getCompiledResourceCollection()
    .onSuccess((compiledCollection) => {
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

        return succeed({
          system,
          compiledCollection,
          resolver,
          resourceCount: resourceIds.length,
          summary
        });
      });
    })
    .withErrorFormat((message) => `Failed to finalize processing: ${message}`);
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
