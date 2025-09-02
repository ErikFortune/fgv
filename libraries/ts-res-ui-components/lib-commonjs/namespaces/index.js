'use strict';
/**
 * Organized tool namespaces for ts-res-ui-components.
 *
 * Tools include both view components and utility functions organized into logical
 * namespaces to improve discoverability and reduce the flat export list in the main API.
 *
 * @example
 * ```tsx
 * import {
 *   FilterTools,
 *   ResolutionTools,
 *   ResourceTools,
 *   ViewStateTools,
 *   ImportTools,
 *   ZipTools,
 *   PickerTools
 * } from '@fgv/ts-res-ui-components';
 *
 * // Use view components
 * <FilterTools.FilterView {...filterProps} />
 * <ResolutionTools.ResolutionView {...resolutionProps} />
 * <ViewStateTools.MessagesWindow {...messageProps} />
 * <ImportTools.ImportView {...importProps} />
 * <PickerTools.ResourcePicker {...pickerProps} />
 *
 * // Use hooks for state management
 * const { state, actions } = ResourceTools.useResourceData();
 * const { messages, addMessage } = ViewStateTools.useViewState();
 * const { state: filterState } = FilterTools.useFilterState();
 *
 * // Or use utility functions
 * const hasFilters = FilterTools.hasFilterValues(filterState.values);
 * const resolver = ResolutionTools.createResolverWithContext(resources, context);
 * const files = await ImportTools.readFilesFromInput(fileInput);
 * const zipLoader = ZipTools.createBrowserZipLoader();
 * ```
 *
 * @public
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.ObservabilityTools =
  exports.GridTools =
  exports.PickerTools =
  exports.ZipTools =
  exports.ViewStateTools =
  exports.TsResTools =
  exports.ImportTools =
  exports.ResourceTools =
  exports.ConfigurationTools =
  exports.ResolutionTools =
  exports.FilterTools =
    void 0;
const tslib_1 = require('tslib');
exports.FilterTools = tslib_1.__importStar(require('./FilterTools'));
exports.ResolutionTools = tslib_1.__importStar(require('./ResolutionTools'));
exports.ConfigurationTools = tslib_1.__importStar(require('./ConfigurationTools'));
exports.ResourceTools = tslib_1.__importStar(require('./ResourceTools'));
exports.ImportTools = tslib_1.__importStar(require('./ImportTools'));
exports.TsResTools = tslib_1.__importStar(require('./TsResTools'));
exports.ViewStateTools = tslib_1.__importStar(require('./ViewStateTools'));
exports.ZipTools = tslib_1.__importStar(require('./ZipTools'));
exports.PickerTools = tslib_1.__importStar(require('./PickerTools'));
exports.GridTools = tslib_1.__importStar(require('./GridTools'));
exports.ObservabilityTools = tslib_1.__importStar(require('./ObservabilityTools'));
//# sourceMappingURL=index.js.map
