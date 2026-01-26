/**
 * Tools for filtering and sidebar UI.
 *
 * This namespace contains hooks and components for managing filter state
 * and rendering filter UI in tool sidebars.
 *
 * @example
 * ```tsx
 * import { FilterTools } from '@fgv/ts-chocolate-ui';
 *
 * function MySidebar() {
 *   const { state, actions } = FilterTools.useFilterState(
 *     FilterTools.createInitialFilterState()
 *   );
 *
 *   return (
 *     <FilterTools.FilterSidebar
 *       filters={state}
 *       actions={actions}
 *       tags={allTags}
 *       collectionsPanel={<MyCollectionPanel />}
 *       searchPlaceholder="Search items..."
 *     />
 *   );
 * }
 * ```
 *
 * @public
 */

// Filter state hook
export {
  useFilterState,
  createInitialFilterState,
  type IBaseFilterState,
  type IFilterActions,
  type IUseFilterStateResult
} from '../packlets/hooks';

// Filter UI components
export {
  FilterSidebar,
  SearchInput,
  CollapsibleSection,
  type IFilterSidebarProps,
  type ISearchInputProps,
  type ICollapsibleSectionProps
} from '../packlets/filters';
