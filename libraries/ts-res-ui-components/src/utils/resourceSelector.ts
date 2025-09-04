import { Result, succeed, fail } from '@fgv/ts-utils';
import { ProcessedResources, GridResourceSelector, CustomResourceSelector } from '../types';

/**
 * Handler function type for resource selector implementations.
 */
type SelectorHandler = (selector: any, resources: ProcessedResources) => Result<string[]>;

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
export class ResourceSelector {
  private registry = new Map<string, SelectorHandler>();

  constructor() {
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
  registerSelector(type: string, handler: SelectorHandler): void {
    this.registry.set(type, handler);
  }

  /**
   * Get all registered selector types (useful for debugging/tooling).
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Select resources based on the provided selector configuration.
   *
   * @param selector - Resource selector configuration
   * @param resources - Processed resources to select from
   * @returns Result containing array of selected resource IDs
   */
  select(selector: GridResourceSelector, resources: ProcessedResources): Result<string[]> {
    const handler = this.registry.get(selector.type);
    if (!handler) {
      return fail(`Unknown selector type: ${selector.type}`);
    }

    try {
      return handler(selector, resources);
    } catch (error) {
      return fail(`Selector error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Select resources by explicit resource IDs.
   */
  private selectByIds = (
    selector: { resourceIds: string[] },
    resources: ProcessedResources
  ): Result<string[]> => {
    const availableIds = new Set(resources.summary.resourceIds);
    const selectedIds = selector.resourceIds.filter((id) => availableIds.has(id));

    if (selectedIds.length === 0 && selector.resourceIds.length > 0) {
      return fail(`None of the specified resource IDs were found in the resource collection`);
    }

    return succeed(selectedIds);
  };

  /**
   * Select resources with IDs starting with the specified prefix.
   */
  private selectByPrefix = (
    selector: { prefix: string },
    resources: ProcessedResources
  ): Result<string[]> => {
    if (!selector.prefix) {
      return fail('Prefix cannot be empty');
    }

    const matchingIds = resources.summary.resourceIds.filter((id) => id.startsWith(selector.prefix));
    return succeed(matchingIds);
  };

  /**
   * Select resources with IDs ending with the specified suffix.
   */
  private selectBySuffix = (
    selector: { suffix: string },
    resources: ProcessedResources
  ): Result<string[]> => {
    if (!selector.suffix) {
      return fail('Suffix cannot be empty');
    }

    const matchingIds = resources.summary.resourceIds.filter((id) => id.endsWith(selector.suffix));
    return succeed(matchingIds);
  };

  /**
   * Select resources by resource type names.
   */
  private selectByResourceTypes = (
    selector: { types: string[] },
    resources: ProcessedResources
  ): Result<string[]> => {
    if (!selector.types || selector.types.length === 0) {
      return fail('Resource types array cannot be empty');
    }

    const typeSet = new Set(selector.types);
    const matchingIds: string[] = [];

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

    return succeed(matchingIds);
  };

  /**
   * Select resources by simple glob pattern matching.
   * Supports * as wildcard character.
   */
  private selectByPattern = (
    selector: { pattern: string },
    resources: ProcessedResources
  ): Result<string[]> => {
    if (!selector.pattern) {
      return fail('Pattern cannot be empty');
    }

    try {
      // Convert glob pattern to regex
      const regexPattern = selector.pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
        .replace(/\*/g, '.*'); // Convert * to .*

      const regex = new RegExp(`^${regexPattern}$`);
      const matchingIds = resources.summary.resourceIds.filter((id) => regex.test(id));

      return succeed(matchingIds);
    } catch (error) {
      return fail(`Invalid pattern: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /**
   * Select all available resources.
   */
  private selectAll = (_selector: {}, resources: ProcessedResources): Result<string[]> => {
    return succeed([...resources.summary.resourceIds]);
  };

  /**
   * Select resources using custom selector logic.
   */
  private selectCustom = (
    selector: { selector: CustomResourceSelector },
    resources: ProcessedResources
  ): Result<string[]> => {
    if (!selector.selector) {
      return fail('Custom selector configuration is required');
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

      return succeed(validIds);
    } catch (error) {
      return fail(`Custom selector failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
}

/**
 * Default resource selector instance for use throughout the application.
 * @public
 */
export const defaultResourceSelector = new ResourceSelector();

/**
 * Utility function to select resources using the default selector.
 *
 * @param selector - Resource selector configuration
 * @param resources - Processed resources to select from
 * @returns Result containing array of selected resource IDs
 * @public
 */
export function selectResources(
  selector: GridResourceSelector,
  resources: ProcessedResources
): Result<string[]> {
  return defaultResourceSelector.select(selector, resources);
}
