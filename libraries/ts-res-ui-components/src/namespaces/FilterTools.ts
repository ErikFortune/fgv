/**
 * Tools and components for resource filtering operations.
 *
 * This namespace contains the FilterView component, utility functions for creating
 * filtered resource managers, analyzing filter results, and managing filter state.
 *
 * @example
 * ```tsx
 * import { FilterTools } from '@fgv/ts-res-ui-components';
 *
 * // Use the FilterView component
 * <FilterTools.FilterView
 *   resources={processedResources}
 *   filterState={filterState}
 *   filterActions={filterActions}
 * />
 *
 * // Or use utility functions
 * if (FilterTools.hasFilterValues(filterState.values)) {
 *   const filtered = FilterTools.createFilteredResourceManagerSimple(
 *     resources,
 *     filterState.appliedValues
 *   );
 * }
 * ```
 *
 * @public
 */

// Export the main FilterView component
export { FilterView } from '../components/views/FilterView';

// Export domain-specific hook
export { useFilterState } from '../hooks/useFilterState';

// Export utility functions
export {
  createFilteredResourceManagerSimple,
  analyzeFilteredResources,
  hasFilterValues,
  getFilterSummary,
  type IFilterOptions
} from '../utils/filterResources';

// Export types related to filtering
export type {
  IFilterState,
  IFilterActions,
  IFilterViewProps,
  IFilterResult,
  IFilteredResource
} from '../types';
