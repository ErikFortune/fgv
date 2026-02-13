/**
 * Navigation packlet - Zustand store and types for Chocolate Lab navigation.
 * @packageDocumentation
 */

export {
  type AppMode,
  type AppTab,
  type ProductionTab,
  type LibraryTab,
  type CascadeEntityType,
  type CascadeColumnMode,
  type ICascadeEntry,
  type IFilterState,
  DEFAULT_FILTER_STATE,
  DEFAULT_TABS,
  MODE_TABS,
  TAB_LABELS,
  MODE_LABELS,
  createDefaultFilterState,
  countActiveSelections,
  hasActiveFilters
} from './model';

export {
  type INavigationState,
  type INavigationActions,
  type NavigationStore,
  useNavigationStore,
  selectActiveTab,
  selectCurrentFilter,
  selectModeTabs,
  selectHasActiveFilters
} from './store';
