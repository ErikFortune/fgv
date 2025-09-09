import { Result, succeed, fail } from '@fgv/ts-utils';
import { IProcessedResources, GridResourceSelector } from '../types';

/**
 * Handler function type for resource selector implementations.
 */
type SelectorHandler = (selector: GridResourceSelector, resources: IProcessedResources) => Result<string[]>;

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
  private _registry: Map<string, SelectorHandler> = new Map<string, SelectorHandler>();

  public constructor() {
    // Register built-in selectors
    this._registry.set('ids', this._selectByIds);
    this._registry.set('prefix', this._selectByPrefix);
    this._registry.set('suffix', this._selectBySuffix);
    this._registry.set('resourceTypes', this._selectByResourceTypes);
    this._registry.set('pattern', this._selectByPattern);
    this._registry.set('all', this._selectAll);
    this._registry.set('custom', this._selectCustom);
  }

  /**
   * Register a new selector type that can be used in grid configurations.
   *
   * @param type - Unique identifier for the selector type
   * @param handler - Function that implements the selection logic
   */
  public registerSelector(type: string, handler: SelectorHandler): void {
    this._registry.set(type, handler);
  }

  /**
   * Get all registered selector types (useful for debugging/tooling).
   */
  public getRegisteredTypes(): string[] {
    return Array.from(this._registry.keys());
  }

  /**
   * Select resources based on the provided selector configuration.
   *
   * @param selector - Resource selector configuration
   * @param resources - Processed resources to select from
   * @returns Result containing array of selected resource IDs
   */
  public select(selector: GridResourceSelector, resources: IProcessedResources): Result<string[]> {
    const handler = this._registry.get(selector.type);
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
  private _selectByIds(selector: GridResourceSelector, resources: IProcessedResources): Result<string[]> {
    if (selector.type !== 'ids') {
      return fail('Selector type is not "ids"');
    }

    const availableIds = new Set(resources.summary.resourceIds);
    const selectedIds = selector.resourceIds.filter((id) => availableIds.has(id));

    if (selectedIds.length === 0 && selector.resourceIds.length > 0) {
      return fail(`None of the specified resource IDs were found in the resource collection`);
    }

    return succeed(selectedIds);
  }

  /**
   * Select resources with IDs starting with the specified prefix.
   */
  private _selectByPrefix(selector: GridResourceSelector, resources: IProcessedResources): Result<string[]> {
    if (selector.type !== 'prefix') {
      return fail('Selector type is not "prefix"');
    }

    if (!selector.prefix) {
      return fail('Prefix cannot be empty');
    }

    const matchingIds = resources.summary.resourceIds.filter((id) => id.startsWith(selector.prefix));
    return succeed(matchingIds);
  }

  /**
   * Select resources with IDs ending with the specified suffix.
   */
  private _selectBySuffix(selector: GridResourceSelector, resources: IProcessedResources): Result<string[]> {
    if (selector.type !== 'suffix') {
      return fail('Selector type is not "suffix"');
    }

    if (!selector.suffix) {
      return fail('Suffix cannot be empty');
    }

    const matchingIds = resources.summary.resourceIds.filter((id) => id.endsWith(selector.suffix));
    return succeed(matchingIds);
  }

  /**
   * Select resources by resource type names.
   */
  private _selectByResourceTypes(
    selector: GridResourceSelector,
    resources: IProcessedResources
  ): Result<string[]> {
    if (selector.type !== 'resourceTypes') {
      return fail('Selector type is not "resourceTypes"');
    }

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
  }

  /**
   * Select resources by simple glob pattern matching.
   * Supports * as wildcard character.
   */
  private _selectByPattern(selector: GridResourceSelector, resources: IProcessedResources): Result<string[]> {
    if (selector.type !== 'pattern') {
      return fail('Selector type is not "pattern"');
    }

    if (!selector.pattern) {
      return fail('Pattern cannot be empty');
    }

    try {
      // Convert glob pattern to regex
      const regexPattern = selector.pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
        .replace(/\*/g, '.*'); // Convert * to .*

      // eslint-disable-next-line @rushstack/security/no-unsafe-regexp
      const regex = new RegExp(`^${regexPattern}$`);
      const matchingIds = resources.summary.resourceIds.filter((id) => regex.test(id));

      return succeed(matchingIds);
    } catch (error) {
      return fail(`Invalid pattern: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Select all available resources.
   */
  private _selectAll(__selector: GridResourceSelector, resources: IProcessedResources): Result<string[]> {
    return succeed([...resources.summary.resourceIds]);
  }

  /**
   * Select resources using custom selector logic.
   */
  private _selectCustom(selector: GridResourceSelector, resources: IProcessedResources): Result<string[]> {
    if (selector.type !== 'custom') {
      return fail('Selector type is not "custom"');
    }

    if (!selector.selector || !selector.selector.select) {
      return fail('Custom selector configuration is required');
    }

    try {
      const selectedIds = selector.selector.select(resources);

      // Validate that all returned IDs exist in the resource collection
      const availableIds = new Set(resources.summary.resourceIds);
      const validIds = selectedIds.filter((id: string) => availableIds.has(id));

      if (validIds.length !== selectedIds.length) {
        const invalidIds = selectedIds.filter((id: string) => !availableIds.has(id));
        console.warn(`Custom selector returned invalid resource IDs: ${invalidIds.join(', ')}`);
      }

      return succeed(validIds);
    } catch (error) {
      return fail(`Custom selector failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Default resource selector instance for use throughout the application.
 * @public
 */
export const defaultResourceSelector: ResourceSelector = new ResourceSelector();

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
  resources: IProcessedResources
): Result<string[]> {
  return defaultResourceSelector.select(selector, resources);
}
