'use strict';
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
 *   onMessage={onMessage}
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
Object.defineProperty(exports, '__esModule', { value: true });
exports.getFilterSummary =
  exports.hasFilterValues =
  exports.analyzeFilteredResources =
  exports.createFilteredResourceManagerSimple =
  exports.useFilterState =
  exports.FilterView =
    void 0;
// Export the main FilterView component
var FilterView_1 = require('../components/views/FilterView');
Object.defineProperty(exports, 'FilterView', {
  enumerable: true,
  get: function () {
    return FilterView_1.FilterView;
  }
});
// Export domain-specific hook
var useFilterState_1 = require('../hooks/useFilterState');
Object.defineProperty(exports, 'useFilterState', {
  enumerable: true,
  get: function () {
    return useFilterState_1.useFilterState;
  }
});
// Export utility functions
var filterResources_1 = require('../utils/filterResources');
Object.defineProperty(exports, 'createFilteredResourceManagerSimple', {
  enumerable: true,
  get: function () {
    return filterResources_1.createFilteredResourceManagerSimple;
  }
});
Object.defineProperty(exports, 'analyzeFilteredResources', {
  enumerable: true,
  get: function () {
    return filterResources_1.analyzeFilteredResources;
  }
});
Object.defineProperty(exports, 'hasFilterValues', {
  enumerable: true,
  get: function () {
    return filterResources_1.hasFilterValues;
  }
});
Object.defineProperty(exports, 'getFilterSummary', {
  enumerable: true,
  get: function () {
    return filterResources_1.getFilterSummary;
  }
});
//# sourceMappingURL=FilterTools.js.map
