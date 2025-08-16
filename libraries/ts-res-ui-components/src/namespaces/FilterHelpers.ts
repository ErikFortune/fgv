/**
 * Helper functions and utilities for resource filtering operations.
 *
 * This namespace contains functions for creating filtered resource managers,
 * analyzing filter results, and managing filter state.
 *
 * @example
 * ```tsx
 * import { FilterHelpers } from '@fgv/ts-res-ui-components';
 *
 * // Check if filter has values
 * if (FilterHelpers.hasFilterValues(filterState.values)) {
 *   // Create filtered manager
 *   const filtered = FilterHelpers.createFilteredResourceManagerSimple(
 *     resources,
 *     filterState.appliedValues
 *   );
 * }
 * ```
 *
 * @public
 */

export {
  createFilteredResourceManagerSimple,
  analyzeFilteredResources,
  hasFilterValues,
  getFilterSummary,
  type FilterOptions
} from '../utils/filterResources';
