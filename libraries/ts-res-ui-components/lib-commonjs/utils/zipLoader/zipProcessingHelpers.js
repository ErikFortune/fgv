'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.processZipResources = processZipResources;
exports.processZipLoadResult = processZipLoadResult;
const tslib_1 = require('tslib');
const ts_utils_1 = require('@fgv/ts-utils');
const tsResIntegration_1 = require('../tsResIntegration');
const ObservabilityTools = tslib_1.__importStar(require('../observability'));
/**
 * Helper function to process resources from ZIP data using ts-res-ui-components integration
 * @public
 */
async function processZipResources(
  files,
  directory,
  config,
  o11y = ObservabilityTools.DefaultObservabilityContext
) {
  try {
    if (directory) {
      return (0, tsResIntegration_1.processImportedDirectory)(
        directory,
        config,
        undefined,
        undefined,
        o11y
      ).withErrorFormat((message) => `Failed to process resources from directory: ${message}`);
    } else if (files.length > 0) {
      return (0, tsResIntegration_1.processImportedFiles)(
        files,
        config,
        undefined,
        undefined,
        o11y
      ).withErrorFormat((message) => `Failed to process resources from files: ${message}`);
    } else {
      return (0, ts_utils_1.fail)('No files or directory structure found to process');
    }
  } catch (error) {
    return (0, ts_utils_1.fail)(
      `Error processing ZIP resources: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
/**
 * Helper function to process resources from a ZIP load result
 * @public
 */
async function processZipLoadResult(
  zipResult,
  overrideConfig,
  o11y = ObservabilityTools.DefaultObservabilityContext
) {
  const configToUse = overrideConfig || zipResult.config;
  return processZipResources(zipResult.files, zipResult.directory, configToUse, o11y);
}
//# sourceMappingURL=zipProcessingHelpers.js.map
