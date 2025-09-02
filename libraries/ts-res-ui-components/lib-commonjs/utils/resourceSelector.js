'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.defaultResourceSelector = exports.ResourceSelector = void 0;
exports.selectResources = selectResources;
const ts_utils_1 = require('@fgv/ts-utils');
/**
 * Resource selector utility for filtering resources based on various criteria.
 * Supports built-in selector types and extensible custom selectors.
 *
 * @example
 * ```typescript
 * const selector = new ResourceSelector();
 *
 * // Use built-in selectors
 * const prefixResult = selector.select(
 *   { type: 'prefix', prefix: 'user.' },
 *   processedResources
 * );
 *
 * // Register and use custom selector
 * selector.registerSelector('byMetadata', (config, resources) => {
 *   return succeed(resources.summary.resourceIds.filter(id =>
 *     hasMetadata(id, config.key, config.value)
 *   ));
 * });
 * ```
 * @public
 */
class ResourceSelector {
  constructor() {
    this.registry = new Map();
    /**
     * Select resources by explicit resource IDs.
     */
    this.selectByIds = (selector, resources) => {
      const availableIds = new Set(resources.summary.resourceIds);
      const selectedIds = selector.resourceIds.filter((id) => availableIds.has(id));
      if (selectedIds.length === 0 && selector.resourceIds.length > 0) {
        return (0, ts_utils_1.fail)(
          `None of the specified resource IDs were found in the resource collection`
        );
      }
      return (0, ts_utils_1.succeed)(selectedIds);
    };
    /**
     * Select resources with IDs starting with the specified prefix.
     */
    this.selectByPrefix = (selector, resources) => {
      if (!selector.prefix) {
        return (0, ts_utils_1.fail)('Prefix cannot be empty');
      }
      const matchingIds = resources.summary.resourceIds.filter((id) => id.startsWith(selector.prefix));
      return (0, ts_utils_1.succeed)(matchingIds);
    };
    /**
     * Select resources with IDs ending with the specified suffix.
     */
    this.selectBySuffix = (selector, resources) => {
      if (!selector.suffix) {
        return (0, ts_utils_1.fail)('Suffix cannot be empty');
      }
      const matchingIds = resources.summary.resourceIds.filter((id) => id.endsWith(selector.suffix));
      return (0, ts_utils_1.succeed)(matchingIds);
    };
    /**
     * Select resources by resource type names.
     */
    this.selectByResourceTypes = (selector, resources) => {
      if (!selector.types || selector.types.length === 0) {
        return (0, ts_utils_1.fail)('Resource types array cannot be empty');
      }
      const typeSet = new Set(selector.types);
      const matchingIds = [];
      // Iterate through all resources and check their types
      resources.summary.resourceIds.forEach((resourceId) => {
        try {
          // Get the resource from the resolver to check its type
          const resourceResult = resources.resolver.resourceManager.getBuiltResource(resourceId);
          if (resourceResult.isSuccess()) {
            const resource = resourceResult.value;
            if (typeSet.has(resource.resourceType.key)) {
              matchingIds.push(resourceId);
            }
          }
        } catch {
          // Skip resources that can't be accessed
        }
      });
      return (0, ts_utils_1.succeed)(matchingIds);
    };
    /**
     * Select resources by simple glob pattern matching.
     * Supports * as wildcard character.
     */
    this.selectByPattern = (selector, resources) => {
      if (!selector.pattern) {
        return (0, ts_utils_1.fail)('Pattern cannot be empty');
      }
      try {
        // Convert glob pattern to regex
        const regexPattern = selector.pattern
          .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
          .replace(/\*/g, '.*'); // Convert * to .*
        const regex = new RegExp(`^${regexPattern}$`);
        const matchingIds = resources.summary.resourceIds.filter((id) => regex.test(id));
        return (0, ts_utils_1.succeed)(matchingIds);
      } catch (error) {
        return (0, ts_utils_1.fail)(
          `Invalid pattern: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    };
    /**
     * Select all available resources.
     */
    this.selectAll = (_selector, resources) => {
      return (0, ts_utils_1.succeed)([...resources.summary.resourceIds]);
    };
    /**
     * Select resources using custom selector logic.
     */
    this.selectCustom = (selector, resources) => {
      if (!selector.selector) {
        return (0, ts_utils_1.fail)('Custom selector configuration is required');
      }
      try {
        const selectedIds = selector.selector.select(resources);
        // Validate that all returned IDs exist in the resource collection
        const availableIds = new Set(resources.summary.resourceIds);
        const validIds = selectedIds.filter((id) => availableIds.has(id));
        if (validIds.length !== selectedIds.length) {
          const invalidIds = selectedIds.filter((id) => !availableIds.has(id));
          console.warn(`Custom selector returned invalid resource IDs: ${invalidIds.join(', ')}`);
        }
        return (0, ts_utils_1.succeed)(validIds);
      } catch (error) {
        return (0, ts_utils_1.fail)(
          `Custom selector failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    };
    // Register built-in selectors
    this.registry.set('ids', this.selectByIds);
    this.registry.set('prefix', this.selectByPrefix);
    this.registry.set('suffix', this.selectBySuffix);
    this.registry.set('resourceTypes', this.selectByResourceTypes);
    this.registry.set('pattern', this.selectByPattern);
    this.registry.set('all', this.selectAll);
    this.registry.set('custom', this.selectCustom);
  }
  /**
   * Register a new selector type that can be used in grid configurations.
   *
   * @param type - Unique identifier for the selector type
   * @param handler - Function that implements the selection logic
   */
  registerSelector(type, handler) {
    this.registry.set(type, handler);
  }
  /**
   * Get all registered selector types (useful for debugging/tooling).
   */
  getRegisteredTypes() {
    return Array.from(this.registry.keys());
  }
  /**
   * Select resources based on the provided selector configuration.
   *
   * @param selector - Resource selector configuration
   * @param resources - Processed resources to select from
   * @returns Result containing array of selected resource IDs
   */
  select(selector, resources) {
    const handler = this.registry.get(selector.type);
    if (!handler) {
      return (0, ts_utils_1.fail)(`Unknown selector type: ${selector.type}`);
    }
    try {
      return handler(selector, resources);
    } catch (error) {
      return (0, ts_utils_1.fail)(
        `Selector error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
exports.ResourceSelector = ResourceSelector;
/**
 * Default resource selector instance for use throughout the application.
 * @public
 */
exports.defaultResourceSelector = new ResourceSelector();
/**
 * Utility function to select resources using the default selector.
 *
 * @param selector - Resource selector configuration
 * @param resources - Processed resources to select from
 * @returns Result containing array of selected resource IDs
 * @public
 */
function selectResources(selector, resources) {
  return exports.defaultResourceSelector.select(selector, resources);
}
//# sourceMappingURL=resourceSelector.js.map
