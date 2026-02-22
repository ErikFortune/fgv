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

export {
  ReactiveWorkspace,
  type WorkspaceListener,
  type IPersistentTreeEntry,
  type IStorageRootSummary,
  type IStorageSummary,
  type StorageCategory
} from './reactiveWorkspace';

export { restoreSavedDirectories, type IRestoreSavedDirectoriesParams } from './restoreSavedDirectories';

export { useAddStorageRoot, type IAddStorageRootActions } from './useAddStorageRoot';

export {
  WorkspaceProvider,
  useWorkspace,
  useReactiveWorkspace,
  useWorkspaceState,
  type IWorkspaceProviderProps,
  type IWorkspaceStateActions
} from './useWorkspace';
