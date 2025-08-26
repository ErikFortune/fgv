import { ResourceJson } from '@fgv/ts-res';
import { ResolutionState } from '../types';

/**
 * Helper utilities for working with the orchestrator and pending resources.
 *
 * @public
 */

/**
 * Get pending additions filtered by resource type.
 *
 * @param pendingResources - Map of pending resources
 * @param resourceTypeName - Type name to filter by (e.g., 'languageConfig', 'formatConfig')
 * @returns Array of pending resources matching the type
 * @public
 */
export function getPendingAdditionsByType(
  pendingResources: Map<string, ResourceJson.Json.ILooseResourceDecl>,
  resourceTypeName: string
): Array<[string, ResourceJson.Json.ILooseResourceDecl]> {
  const results: Array<[string, ResourceJson.Json.ILooseResourceDecl]> = [];

  pendingResources.forEach((resource, id) => {
    if (resource.resourceTypeName === resourceTypeName) {
      results.push([id, resource]);
    }
  });

  return results;
}

/**
 * Check if a resource ID represents a pending addition.
 *
 * @param resourceId - Resource ID to check
 * @param state - Current resolution state
 * @returns True if the resource is a pending addition
 * @public
 */
export function isPendingAddition(resourceId: string, state: ResolutionState): boolean {
  return state.pendingResources.has(resourceId);
}

/**
 * Check if a resource ID is marked for deletion.
 *
 * @param resourceId - Resource ID to check
 * @param state - Current resolution state
 * @returns True if the resource is marked for deletion
 * @public
 */
export function isPendingDeletion(resourceId: string, state: ResolutionState): boolean {
  return state.pendingResourceDeletions.has(resourceId);
}

/**
 * Derive the leaf ID from a full resource ID.
 * For example: 'platform.languages.en-US' → 'en-US'
 *
 * @param fullResourceId - Full resource ID
 * @returns Leaf ID (last segment)
 * @public
 */
export function deriveLeafId(fullResourceId: string): string {
  const segments = fullResourceId.split('.');
  return segments[segments.length - 1] || fullResourceId;
}

/**
 * Derive the full resource ID from root segments and leaf ID.
 * For example: ['platform', 'languages'], 'en-US' → 'platform.languages.en-US'
 *
 * @param rootSegments - Array of root path segments
 * @param leafId - Leaf ID to append
 * @returns Full resource ID
 * @public
 */
export function deriveFullId(rootSegments: string[], leafId: string): string {
  if (rootSegments.length === 0) {
    return leafId;
  }
  return [...rootSegments, leafId].join('.');
}

/**
 * Derive the full resource ID from root path and leaf ID.
 * For example: 'platform.languages', 'en-US' → 'platform.languages.en-US'
 *
 * @param rootPath - Root path (dot-separated)
 * @param leafId - Leaf ID to append
 * @returns Full resource ID
 * @public
 */
export function deriveFullIdFromPath(rootPath: string, leafId: string): string {
  if (!rootPath || rootPath.length === 0) {
    return leafId;
  }
  return `${rootPath}.${leafId}`;
}

/**
 * Extract the parent path from a full resource ID.
 * For example: 'platform.languages.en-US' → 'platform.languages'
 *
 * @param fullResourceId - Full resource ID
 * @returns Parent path or empty string if no parent
 * @public
 */
export function getParentPath(fullResourceId: string): string {
  const segments = fullResourceId.split('.');
  if (segments.length <= 1) {
    return '';
  }
  return segments.slice(0, -1).join('.');
}

/**
 * Count total pending changes (additions + deletions + edits).
 *
 * @param state - Current resolution state
 * @returns Object with counts by type
 * @public
 */
export function countPendingChanges(state: ResolutionState): {
  additions: number;
  deletions: number;
  edits: number;
  total: number;
} {
  const additions = state.pendingResources.size;
  const deletions = state.pendingResourceDeletions.size;
  const edits = state.editedResources.size;

  return {
    additions,
    deletions,
    edits,
    total: additions + deletions + edits
  };
}

/**
 * Get display name for a pending resource.
 * Uses the leaf ID as the display name.
 *
 * @param resourceId - Full resource ID
 * @returns Display name for UI
 * @public
 */
export function getPendingResourceDisplayName(resourceId: string): string {
  return deriveLeafId(resourceId);
}

/**
 * Check if a resource ID is valid (not temporary).
 *
 * @param resourceId - Resource ID to validate
 * @returns True if the ID is valid (not temporary)
 * @public
 */
export function isValidResourceId(resourceId: string): boolean {
  return !resourceId.startsWith('new-resource-');
}

/**
 * Get all pending resource IDs sorted alphabetically.
 *
 * @param state - Current resolution state
 * @returns Sorted array of pending resource IDs
 * @public
 */
export function getSortedPendingResourceIds(state: ResolutionState): string[] {
  return Array.from(state.pendingResources.keys()).sort();
}

/**
 * Merge pending resources into an existing resource list.
 * Useful for UI components that need to display both existing and pending resources.
 *
 * @param existingIds - Array of existing resource IDs
 * @param state - Current resolution state
 * @returns Combined array with pending additions and without pending deletions
 * @public
 */
export function mergeResourceListWithPending(existingIds: string[], state: ResolutionState): string[] {
  // Filter out deletions
  const filtered = existingIds.filter((id) => !state.pendingResourceDeletions.has(id));

  // Add pending additions
  const pendingIds = Array.from(state.pendingResources.keys());

  // Combine and remove duplicates
  const combined = new Set([...filtered, ...pendingIds]);

  return Array.from(combined).sort();
}
