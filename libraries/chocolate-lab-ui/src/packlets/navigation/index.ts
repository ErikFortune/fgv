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
  type ICreateSessionInfo,
  type ICollectionVisibility,
  type IFilterState,
  DEFAULT_COLLECTION_VISIBILITY,
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
  selectCurrentCollectionVisibility,
  selectModeTabs,
  selectHasActiveFilters,
  isCollectionVisible
} from './store';

export { type ITabNavigation, useTabNavigation } from './useTabNavigation';

export { useSquashAt, useCascadeDrillDown } from './useCascadeTransitions';

export { type IEntityListOptions, type IEntityListResult, useEntityList } from './useEntityList';

export {
  type ICollectionMap as IMutableCollectionMap,
  useMutableCollection,
  useCanDeleteFromCollections
} from './useMutableCollection';
