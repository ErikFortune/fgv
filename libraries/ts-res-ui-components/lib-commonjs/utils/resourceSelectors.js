'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getPendingAdditionsByType = getPendingAdditionsByType;
exports.isPendingAddition = isPendingAddition;
exports.deriveLeafId = deriveLeafId;
exports.deriveFullId = deriveFullId;
exports.getPendingResourceTypes = getPendingResourceTypes;
exports.getPendingResourceStats = getPendingResourceStats;
exports.validatePendingResourceKeys = validatePendingResourceKeys;
const ts_utils_1 = require('@fgv/ts-utils');
/**
 * Helper functions for working with pending resources and resource IDs.
 * These utilities provide standardized ways to work with resource identification
 * and selection patterns commonly needed by host applications.
 *
 * @public
 */
/**
 * Gets pending resources filtered by resource type.
 *
 * @param pendingResources - Map of pending resources (keys are guaranteed to be full resource IDs)
 * @param resourceType - Resource type to filter by (e.g., 'json', 'string')
 * @returns Array of pending resources of the specified type
 *
 * @example
 * ```typescript
 * const jsonResources = getPendingAdditionsByType(pendingResources, 'json');
 * const languageConfigs = getPendingAdditionsByType(pendingResources, 'languageConfig');
 * ```
 *
 * @public
 */
function getPendingAdditionsByType(pendingResources, resourceType) {
  const results = [];
  pendingResources.forEach((resource, id) => {
    if (resource.resourceTypeName === resourceType) {
      results.push({ id, resource });
    }
  });
  return results;
}
/**
 * Checks if a resource ID corresponds to a pending addition.
 *
 * @param resourceId - Resource ID to check (should be full resource ID)
 * @param pendingResources - Map of pending resources
 * @returns True if the resource ID exists in pending resources
 *
 * @example
 * ```typescript
 * if (isPendingAddition('platform.languages.az-AZ', pendingResources)) {
 *   console.log('This is a pending resource');
 * }
 * ```
 *
 * @public
 */
function isPendingAddition(resourceId, pendingResources) {
  return pendingResources.has(resourceId);
}
/**
 * Derives a leaf ID from a full resource ID.
 * Extracts the last segment after the final dot.
 *
 * @param fullResourceId - Full resource ID (e.g., 'platform.languages.az-AZ')
 * @returns Result containing the leaf ID (e.g., 'az-AZ') or error if invalid format
 *
 * @example
 * ```typescript
 * const leafResult = deriveLeafId('platform.languages.az-AZ');
 * if (leafResult.isSuccess()) {
 *   console.log(leafResult.value); // 'az-AZ'
 * }
 *
 * const invalidResult = deriveLeafId('invalid');
 * if (invalidResult.isFailure()) {
 *   console.log(invalidResult.message); // 'Resource ID must contain at least one dot'
 * }
 * ```
 *
 * @public
 */
function deriveLeafId(fullResourceId) {
  if (!fullResourceId || fullResourceId.trim().length === 0) {
    return (0, ts_utils_1.fail)('Resource ID cannot be empty');
  }
  const parts = fullResourceId.split('.');
  if (parts.length < 2) {
    return (0, ts_utils_1.fail)(
      'Resource ID must contain at least one dot separator (e.g., "platform.languages.az-AZ")'
    );
  }
  const leafId = parts[parts.length - 1];
  if (!leafId || leafId.trim().length === 0) {
    return (0, ts_utils_1.fail)('Leaf ID cannot be empty (resource ID cannot end with a dot)');
  }
  return (0, ts_utils_1.succeed)(leafId);
}
/**
 * Constructs a full resource ID from a root path and leaf ID.
 *
 * @param rootPath - Root path (e.g., 'platform.languages')
 * @param leafId - Leaf identifier (e.g., 'az-AZ')
 * @returns Result containing the full resource ID or error if invalid inputs
 *
 * @example
 * ```typescript
 * const fullIdResult = deriveFullId('platform.languages', 'az-AZ');
 * if (fullIdResult.isSuccess()) {
 *   console.log(fullIdResult.value); // 'platform.languages.az-AZ'
 * }
 *
 * const invalidResult = deriveFullId('', 'az-AZ');
 * if (invalidResult.isFailure()) {
 *   console.log(invalidResult.message); // 'Root path cannot be empty'
 * }
 * ```
 *
 * @public
 */
function deriveFullId(rootPath, leafId) {
  if (!rootPath || rootPath.trim().length === 0) {
    return (0, ts_utils_1.fail)('Root path cannot be empty');
  }
  if (!leafId || leafId.trim().length === 0) {
    return (0, ts_utils_1.fail)('Leaf ID cannot be empty');
  }
  // Remove leading/trailing dots from root path
  const cleanRootPath = rootPath.replace(/^\.+|\.+$/g, '');
  if (cleanRootPath.length === 0) {
    return (0, ts_utils_1.fail)('Root path cannot consist only of dots');
  }
  // Remove leading/trailing dots from leaf ID
  const cleanLeafId = leafId.replace(/^\.+|\.+$/g, '');
  if (cleanLeafId.length === 0) {
    return (0, ts_utils_1.fail)('Leaf ID cannot consist only of dots');
  }
  const fullId = `${cleanRootPath}.${cleanLeafId}`;
  return (0, ts_utils_1.succeed)(fullId);
}
/**
 * Gets all unique resource types from pending resources.
 *
 * @param pendingResources - Map of pending resources
 * @returns Array of unique resource type names
 *
 * @example
 * ```typescript
 * const types = getPendingResourceTypes(pendingResources);
 * console.log(types); // ['json', 'string', 'languageConfig']
 * ```
 *
 * @public
 */
function getPendingResourceTypes(pendingResources) {
  const types = new Set();
  pendingResources.forEach((resource) => {
    if (resource.resourceTypeName) {
      types.add(resource.resourceTypeName);
    }
  });
  return Array.from(types).sort();
}
/**
 * Gets statistics about pending resources.
 * Provides summary information useful for UI displays.
 *
 * @param pendingResources - Map of pending resources
 * @returns Statistics object with counts and breakdowns
 *
 * @example
 * ```typescript
 * const stats = getPendingResourceStats(pendingResources);
 * console.log(`${stats.totalCount} pending resources`);
 * console.log(`Types: ${Object.keys(stats.byType).join(', ')}`);
 * ```
 *
 * @public
 */
function getPendingResourceStats(pendingResources) {
  const stats = {
    totalCount: pendingResources.size,
    byType: {},
    resourceIds: Array.from(pendingResources.keys()).sort()
  };
  pendingResources.forEach((resource) => {
    if (resource.resourceTypeName) {
      stats.byType[resource.resourceTypeName] = (stats.byType[resource.resourceTypeName] || 0) + 1;
    }
  });
  return stats;
}
/**
 * Validates that all keys in a pending resources map are properly formatted as full resource IDs.
 * This is a diagnostic function to ensure the pending resource key invariant is maintained.
 *
 * @param pendingResources - Map of pending resources to validate
 * @returns Result indicating whether all keys are valid full resource IDs, or details about any issues found
 *
 * @example
 * ```typescript
 * const validation = validatePendingResourceKeys(pendingResources);
 * if (validation.isFailure()) {
 *   console.error('Pending resource key validation failed:', validation.message);
 * }
 * ```
 *
 * @public
 */
function validatePendingResourceKeys(pendingResources) {
  const issues = [];
  pendingResources.forEach((resource, key) => {
    // Check for empty keys
    if (!key || key.trim().length === 0) {
      issues.push('Found empty resource ID key');
      return;
    }
    // Check for temporary IDs (should not be in pending resources)
    if (key.startsWith('new-resource-')) {
      issues.push(`Found temporary ID key: ${key}`);
    }
    // Check for minimum structure (at least one dot)
    if (!key.includes('.')) {
      issues.push(`Resource ID '${key}' appears to be a leaf ID rather than a full resource ID`);
    }
    // Check for trailing dots
    if (key.endsWith('.')) {
      issues.push(`Resource ID '${key}' ends with a dot`);
    }
    // Check for leading dots
    if (key.startsWith('.')) {
      issues.push(`Resource ID '${key}' starts with a dot`);
    }
    // Check for double dots
    if (key.includes('..')) {
      issues.push(`Resource ID '${key}' contains consecutive dots`);
    }
  });
  if (issues.length > 0) {
    return (0, ts_utils_1.fail)(`Pending resource key validation failed: ${issues.join('; ')}`);
  }
  return (0, ts_utils_1.succeed)(undefined);
}
//# sourceMappingURL=resourceSelectors.js.map
