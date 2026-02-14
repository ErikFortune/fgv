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

export { ReactiveWorkspace, type WorkspaceListener, type IPersistentTreeEntry } from './reactiveWorkspace';

export {
  WorkspaceProvider,
  useWorkspace,
  useReactiveWorkspace,
  type IWorkspaceProviderProps
} from './useWorkspace';
