// Export essential utilities only (most functionality moved to ts-res zip-archive packlet)
export { generateZipFilename, formatFileSize, isZipFile, normalizePath, getBaseName } from './zipUtils';

// ZIP processing helpers for integrating with ts-res-ui-components
export { processZipResources, processZipLoadResult } from './zipProcessingHelpers';

// Legacy compatibility exports (deprecated)
export { createBrowserZipLoader } from './browserZipLoader';
export { createNodeZipBuilder } from './nodeZipBuilder';
