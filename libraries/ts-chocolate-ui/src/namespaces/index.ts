/**
 * Organized tool namespaces for ts-chocolate-ui.
 *
 * Tools include both view components and utility functions organized into logical
 * namespaces to improve discoverability and reduce the flat export list in the main API.
 *
 * @example
 * ```tsx
 * import { BrowseTools, FilterTools } from '@fgv/ts-chocolate-ui';
 *
 * // Use browse/detail state management
 * const { state, actions } = BrowseTools.useBrowseDetailState<ItemId>();
 * const { currentId, setId } = BrowseTools.useHashNavigation<ItemId>({
 *   prefix: 'items'
 * });
 *
 * // Use filter state management
 * const { state: filters, actions: filterActions } = FilterTools.useFilterState(
 *   FilterTools.createInitialFilterState()
 * );
 *
 * // Use filter UI components
 * <FilterTools.FilterSidebar
 *   filters={filters}
 *   actions={filterActions}
 *   tags={allTags}
 *   collectionsPanel={<MyCollectionPanel />}
 * />
 * ```
 *
 * @public
 */

import * as BrowseTools from './BrowseTools';
import * as FilterTools from './FilterTools';

export { BrowseTools, FilterTools };
