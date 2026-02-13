/**
 * Workspace packlet - browser platform initialization for Chocolate Lab.
 *
 * Provides the browser-specific platform initializer that uses
 * localStorage-backed FileTree for persistence.
 *
 * @packageDocumentation
 */

export {
  BrowserPlatformInitializer,
  createBrowserPlatformInitializer,
  initializeBrowserPlatform,
  type IBrowserPlatformInitOptions
} from './browserPlatformInit';
