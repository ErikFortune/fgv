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
  type CascadeEntryOrigin,
  type ICascadeEntry,
  type ICreateSessionInfo,
  type ICollectionVisibility,
  type IFilterState,
  // Typed cascade entry variants
  type IIngredientCascadeEntry,
  type IFillingCascadeEntry,
  type IConfectionCascadeEntry,
  type IMoldCascadeEntry,
  type IDecorationCascadeEntry,
  type IProcedureCascadeEntry,
  type ITaskCascadeEntry,
  type ISessionCascadeEntry,
  type IJournalEntryCascadeEntry,
  type IMoldInventoryEntryCascadeEntry,
  type ILocationCascadeEntry,
  type IStepParamsCascadeEntry,
  type AnyCascadeEntry,
  // Cascade entry type guards
  CASCADE_NEW_ENTITY_ID,
  isIngredientCascadeEntry,
  isFillingCascadeEntry,
  isConfectionCascadeEntry,
  isMoldCascadeEntry,
  isDecorationCascadeEntry,
  isProcedureCascadeEntry,
  isTaskCascadeEntry,
  isSessionCascadeEntry,
  isJournalEntryCascadeEntry,
  isMoldInventoryEntryCascadeEntry,
  isLocationCascadeEntry,
  isStepParamsCascadeEntry,
  // Existing exports
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

export {
  type ICascadeConflict,
  type CascadeEntrySpec,
  type ICascadeOps,
  useCascadeOps
} from './useCascadeOps';

export { type IEntityListOptions, type IEntityListResult, useEntityList } from './useEntityList';

export {
  type ICollectionMap as IMutableCollectionMap,
  type IWritableCollectionOption,
  useMutableCollection,
  useWritableCollections,
  useCanDeleteFromCollections
} from './useMutableCollection';
