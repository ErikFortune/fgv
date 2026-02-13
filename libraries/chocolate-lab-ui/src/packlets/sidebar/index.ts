/**
 * Sidebar packlet - Chocolate-specific sidebar content and filter configurations.
 * @packageDocumentation
 */

export { type IFilterDefinition, TAB_FILTER_DEFINITIONS } from './filterConfigs';

export { TabSidebar, type ITabSidebarProps, type IFilterOptionProvider } from './TabSidebar';

export { WorkspaceFilterOptionProvider } from './WorkspaceFilterOptionProvider';

export { useFilteredEntities, type IEntityFilterSpec } from './useFilteredEntities';
