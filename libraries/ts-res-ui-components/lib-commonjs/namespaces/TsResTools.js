'use strict';
/**
 * Tools and components for ts-res system integration and browsing.
 *
 * This namespace contains SourceView and CompiledView components for browsing ts-res
 * resource structures, plus utility functions for creating ts-res systems from
 * configurations, processing imported files, and converting between different resource formats.
 *
 * @example
 * ```tsx
 * import { TsResTools } from '@fgv/ts-res-ui-components';
 *
 * // Use the SourceView component for browsing source resources
 * <TsResTools.SourceView
 *   resources={processedResources}
 *   onExport={handleExport}
 *   onMessage={onMessage}
 * />
 *
 * // Use the CompiledView component for browsing compiled resources
 * <TsResTools.CompiledView
 *   resources={processedResources}
 *   filterState={filterState}
 *   filterResult={filterResult}
 *   onMessage={onMessage}
 * />
 *
 * // Or use utility functions
 * const system = await TsResTools.createTsResSystemFromConfig(config);
 * ```
 *
 * @public
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.processImportedDirectory =
  exports.processImportedFiles =
  exports.createTsResSystemFromConfig =
  exports.convertImportedDirectoryToFileTree =
  exports.createSimpleContext =
  exports.getDefaultSystemConfiguration =
  exports.CompiledView =
  exports.SourceView =
    void 0;
// Export view components for browsing ts-res structures
var SourceView_1 = require('../components/views/SourceView');
Object.defineProperty(exports, 'SourceView', {
  enumerable: true,
  get: function () {
    return SourceView_1.SourceView;
  }
});
var CompiledView_1 = require('../components/views/CompiledView');
Object.defineProperty(exports, 'CompiledView', {
  enumerable: true,
  get: function () {
    return CompiledView_1.CompiledView;
  }
});
// Export utility functions
var tsResIntegration_1 = require('../utils/tsResIntegration');
Object.defineProperty(exports, 'getDefaultSystemConfiguration', {
  enumerable: true,
  get: function () {
    return tsResIntegration_1.getDefaultSystemConfiguration;
  }
});
Object.defineProperty(exports, 'createSimpleContext', {
  enumerable: true,
  get: function () {
    return tsResIntegration_1.createSimpleContext;
  }
});
Object.defineProperty(exports, 'convertImportedDirectoryToFileTree', {
  enumerable: true,
  get: function () {
    return tsResIntegration_1.convertImportedDirectoryToFileTree;
  }
});
Object.defineProperty(exports, 'createTsResSystemFromConfig', {
  enumerable: true,
  get: function () {
    return tsResIntegration_1.createTsResSystemFromConfig;
  }
});
Object.defineProperty(exports, 'processImportedFiles', {
  enumerable: true,
  get: function () {
    return tsResIntegration_1.processImportedFiles;
  }
});
Object.defineProperty(exports, 'processImportedDirectory', {
  enumerable: true,
  get: function () {
    return tsResIntegration_1.processImportedDirectory;
  }
});
//# sourceMappingURL=TsResTools.js.map
