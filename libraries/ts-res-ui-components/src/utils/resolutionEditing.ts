import { Result, succeed, fail } from '@fgv/ts-utils';
import { ResourceJson, Resources, Runtime } from '@fgv/ts-res';
import { Diff } from '@fgv/ts-json';
import { JsonObject, isJsonObject } from '@fgv/ts-json-base';
import { IProcessedResources, JsonValue } from '../types';

export interface IEditedResourceInfo {
  resourceId: string;
  originalValue: JsonValue;
  editedValue: JsonValue;
  timestamp: Date;
}

export interface IEditValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates an edited resource JSON value
 */
export function validateEditedResource(editedValue: JsonValue): IEditValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic JSON validation
  if (editedValue === null || editedValue === undefined) {
    errors.push('Resource value cannot be null or undefined');
  }

  // Check if it's valid JSON-serializable
  try {
    JSON.stringify(editedValue);
  } catch (error) {
    errors.push(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Intentionally minimal validation – structural only. No circular checks.

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Computes a 3-way diff between base, resolved, and edited values to create minimal delta
 * @param baseValue - The base/original value before resolution (if available)
 * @param resolvedValue - The fully resolved/composed value shown to user
 * @param editedValue - The value after user edits
 * @returns A minimal delta object with only the changes, or null if no changes
 */
export function computeResourceDelta(
  baseValue: JsonValue | undefined,
  resolvedValue: JsonValue,
  editedValue: JsonValue
): Result<JsonValue> {
  // Use ts-json's three-way diff for proper delta computation
  const diffResult = Diff.jsonThreeWayDiff(resolvedValue, editedValue);

  if (diffResult.isFailure()) {
    // Fall back to full replacement on diff failure
    console.error('Failed to compute three-way diff:', diffResult.message);
    return succeed(editedValue);
  }

  const diff = diffResult.value;

  // If identical, no changes needed
  if (diff.identical) {
    return succeed(null);
  }

  // Build a proper delta that includes deletions as null values
  const delta: Record<string, JsonValue> = {};

  // Add all changes/additions from onlyInB
  if (diff.onlyInB !== null) {
    Object.assign(delta, diff.onlyInB);
  }

  // Add deletions as null values from onlyInA
  // onlyInA contains properties that existed in resolved but not in edited
  if (diff.onlyInA !== null) {
    // Add null entries for all deleted properties
    addDeletionsAsNull(diff.onlyInA, delta);
  }

  // If delta is empty, no changes
  if (Object.keys(delta).length === 0) {
    return succeed(null);
  }

  return succeed(delta);
}

/**
 * Recursively adds null values to delta for all properties in the deleted object
 */
function addDeletionsAsNull(deleted: JsonValue, delta: Record<string, JsonValue>): void {
  if (isJsonObject(deleted)) {
    const deletedObj = deleted as Record<string, JsonValue>;
    for (const key in deletedObj) {
      if (deletedObj.hasOwnProperty(key)) {
        // If this key already exists in delta (from onlyInB), it means the property
        // was modified, not deleted, so don't override with null
        if (!(key in delta)) {
          delta[key] = null;
        }
      }
    }
  }
}

/**
 * Creates candidate declarations for edited resources with proper delta handling
 */
export function createCandidateDeclarations(
  editedResources: Map<string, { originalValue: JsonValue; editedValue: JsonValue; delta: JsonValue }>,
  currentContext: Record<string, string>
): ResourceJson.Json.ILooseResourceCandidateDecl[] {
  const declarations: ResourceJson.Json.ILooseResourceCandidateDecl[] = [];

  for (const [resourceId, resourceEdit] of editedResources.entries()) {
    // Create conditions from current context (using array format)
    const conditions: ResourceJson.Json.ILooseConditionDecl[] = [];

    for (const [qualifierName, qualifierValue] of Object.entries(currentContext)) {
      if (qualifierValue && qualifierValue.trim() !== '') {
        conditions.push({
          qualifierName,
          operator: 'matches',
          value: qualifierValue
        });
      }
    }

    // Always use the delta if we have one (which should be the minimal changes)
    // The delta will be null if there are no changes, or the delta itself if there are changes
    const hasChanges = resourceEdit.delta !== null && resourceEdit.delta !== undefined;

    if (!hasChanges) {
      // No changes, skip this resource
      continue;
    }

    // Always save as partial with just the delta when we have changes
    // This ensures minimal, clean resource files
    declarations.push({
      id: resourceId,
      conditions: conditions.length > 0 ? conditions : undefined,
      json: resourceEdit.delta as JsonObject, // Always use the delta (minimal changes only)
      isPartial: true, // Always partial when saving deltas
      mergeMethod: 'augment' // Always augment to merge the delta with base
    });
  }

  return declarations;
}

/**
 * Converts loose resource declarations (new resources) into loose candidate declarations
 * that can be applied via ResourceManagerBuilder.clone.
 */
export function convertLooseResourcesToCandidateDecls(
  newResources: ReadonlyArray<ResourceJson.Json.ILooseResourceDecl>
): ResourceJson.Json.ILooseResourceCandidateDecl[] {
  const candidates: ResourceJson.Json.ILooseResourceCandidateDecl[] = [];

  for (const resource of newResources) {
    const resourceTypeName = resource.resourceTypeName;
    // Skip if no candidates defined
    const childCandidates = resource.candidates ?? [];
    if (childCandidates.length === 0) {
      continue;
    }

    for (const c of childCandidates) {
      candidates.push({
        id: resource.id,
        json: (c.json ?? {}) as JsonObject,
        conditions: c.conditions,
        isPartial: c.isPartial ?? false,
        mergeMethod: c.mergeMethod ?? 'replace',
        resourceTypeName
      });
    }
  }

  return candidates;
}

/**
 * Rebuilds the resource system by applying both edit candidates and
 * new resource candidates in a single clone → compile → resolver pass.
 */
export async function rebuildSystemWithChanges(
  originalSystem: IProcessedResources['system'],
  options: {
    editedResources?: Map<string, { originalValue: JsonValue; editedValue: JsonValue; delta: JsonValue }>;
    newResources?: ReadonlyArray<ResourceJson.Json.ILooseResourceDecl>;
  },
  currentContext: Record<string, string>
): Promise<Result<IProcessedResources>> {
  try {
    const editCandidates = options.editedResources
      ? createCandidateDeclarations(options.editedResources, currentContext)
      : [];
    const newResourceCandidates = options.newResources
      ? convertLooseResourcesToCandidateDecls(options.newResources)
      : [];

    const allCandidates: ReadonlyArray<ResourceJson.Json.ILooseResourceCandidateDecl> = [
      ...editCandidates,
      ...newResourceCandidates
    ];

    return originalSystem.resourceManager
      .clone({ candidates: allCandidates })
      .withErrorFormat((message: string) => `Failed to clone manager: ${message}`)
      .onSuccess((clonedManager: Resources.ResourceManagerBuilder) => {
        return clonedManager
          .getCompiledResourceCollection({ includeMetadata: true })
          .withErrorFormat((message: string) => `Failed to get compiled collection: ${message}`)
          .onSuccess((compiledCollection: ResourceJson.Compiled.ICompiledResourceCollection) => {
            return Runtime.ResourceResolver.create({
              resourceManager: clonedManager,
              qualifierTypes: originalSystem.qualifierTypes,
              contextQualifierProvider: originalSystem.contextQualifierProvider
            })
              .withErrorFormat((message) => `Failed to create resolver: ${message}`)
              .onSuccess((resolver) => {
                const resourceIds = Array.from(clonedManager.resources.keys()) as string[];
                const summary = {
                  totalResources: resourceIds.length,
                  resourceIds,
                  errorCount: 0,
                  warnings: []
                };

                const updatedSystem: IProcessedResources = {
                  system: {
                    qualifierTypes: originalSystem.qualifierTypes,
                    qualifiers: originalSystem.qualifiers,
                    resourceTypes: originalSystem.resourceTypes,
                    resourceManager: clonedManager,
                    importManager: originalSystem.importManager,
                    contextQualifierProvider: originalSystem.contextQualifierProvider
                  },
                  compiledCollection,
                  resolver,
                  resourceCount: resourceIds.length,
                  summary
                };

                return succeed(updatedSystem);
              });
          });
      });
  } catch (error) {
    return fail(
      `Failed to rebuild system with changes: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Rebuilds the resource system with edited candidates using deltas
 */
export async function rebuildSystemWithEdits(
  originalSystem: IProcessedResources['system'],
  editedResources: Map<string, { originalValue: JsonValue; editedValue: JsonValue; delta: JsonValue }>,
  currentContext: Record<string, string>
): Promise<Result<IProcessedResources>> {
  // Delegate to the unified change application helper
  return rebuildSystemWithChanges(originalSystem, { editedResources }, currentContext);
}

/**
 * Extracts the current resolution context from resolver state
 */
export function extractResolutionContext(
  resolver: Runtime.ResourceResolver,
  contextValues: Record<string, string | undefined>
): Record<string, string> {
  // Filter out empty/undefined context values
  const cleanContext: Record<string, string> = {};

  for (const [key, value] of Object.entries(contextValues)) {
    if (value !== undefined) {
      cleanContext[key] = value.trim();
    }
  }

  return cleanContext;
}

/**
 * Creates a collision detection key for tracking edit conflicts
 */
export function createEditCollisionKey(resourceId: string, context: Record<string, string>): string {
  const contextEntries = Object.entries(context)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return `${resourceId}?${contextEntries}`;
}

/**
 * Checks for potential edit conflicts with existing candidates
 */
export function checkEditConflicts(
  resourceManager: Resources.ResourceManagerBuilder | Runtime.IResourceManager,
  editedResources: Map<string, JsonValue>,
  currentContext: Record<string, string>
): { conflicts: string[]; warnings: string[] } {
  const conflicts: string[] = [];
  const warnings: string[] = [];

  for (const [resourceId] of editedResources) {
    try {
      // Get the current resource to check for conflicts
      const resourceResult = resourceManager.getBuiltResource(resourceId);
      if (resourceResult.isSuccess()) {
        const resource = resourceResult.value;

        // Check if we're likely to create a conflict
        if (resource.candidates.length > 1) {
          warnings.push(
            `Resource ${resourceId} has ${resource.candidates.length} candidates - edits may create conflicts`
          );
        }

        // Could add more sophisticated conflict detection here
        // based on condition overlap analysis
      }
    } catch (error) {
      // Ignore errors in conflict checking
    }
  }

  return { conflicts, warnings };
}
