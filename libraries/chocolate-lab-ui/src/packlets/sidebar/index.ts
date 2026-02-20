/**
 * Sidebar packlet - Chocolate-specific sidebar content and filter configurations.
 * @packageDocumentation
 */

export { type IFilterDefinition, TAB_FILTER_DEFINITIONS } from './filterConfigs';

export { TabSidebar, type ITabSidebarProps, type IFilterOptionProvider } from './TabSidebar';

export { WorkspaceFilterOptionProvider } from './WorkspaceFilterOptionProvider';

export { useFilteredEntities, type IEntityFilterSpec } from './useFilteredEntities';

export { useCollectionInfo, type ICollectionInfo } from './collectionInfo';

export {
  useCollectionActions,
  type ICollectionActions,
  type IPendingSecretSetup
} from './useCollectionActions';

export { useEntityActions, type IEntityActions } from './useEntityActions';

export {
  CreateCollectionDialog,
  type ICreateCollectionDialogProps,
  type ICreateCollectionData
} from './CreateCollectionDialog';

export {
  ImportCollisionDialog,
  type IImportCollisionDialogProps,
  type ImportCollisionResolution
} from './ImportCollisionDialog';

export { UnlockDialog, type IUnlockDialogProps } from './UnlockDialog';

export { SetSecretPasswordDialog, type ISetSecretPasswordDialogProps } from './SetSecretPasswordDialog';
