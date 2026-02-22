/**
 * Workspace packlet - browser platform initialization and reactive wrapper for Chocolate Lab.
 *
 * Provides:
 * - Browser-specific platform initializer (localStorage-backed FileTree)
 * - ReactiveWorkspace wrapper for useSyncExternalStore integration
 * - WorkspaceProvider + useWorkspace hook for React components
 *
 * @packageDocumentation
 */

export {
  BrowserPlatformInitializer,
  createBrowserPlatformInitializer,
  initializeBrowserPlatform,
  type IBrowserPlatformInitOptions
} from './browserPlatformInit';

export { RecoveryDialog, type IRecoveryDialogProps, type RecoveryAction } from './RecoveryDialog';

export {
  ReactiveWorkspace,
  type WorkspaceListener,
  type IPersistentTreeEntry,
  type IStorageRootSummary,
  type IStorageSummary,
  type StorageCategory
} from './reactiveWorkspace';

export { restoreSavedDirectories, type IRestoreSavedDirectoriesParams } from './restoreSavedDirectories';
export {
  applyStorageTargets,
  applyStorageTargetsFromWorkspace,
  type StorageRootTreeMap
} from './applyStorageTargets';

export { useAddStorageRoot, type IAddStorageRootActions } from './useAddStorageRoot';
export { useRemoveStorageRoot, type IRemoveStorageRootActions } from './useRemoveStorageRoot';

export {
  WorkspaceProvider,
  useWorkspace,
  useReactiveWorkspace,
  useWorkspaceState,
  type IWorkspaceProviderProps,
  type IWorkspaceStateActions
} from './useWorkspace';
