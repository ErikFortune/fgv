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

import * as DownloadTools from './DownloadTools';
import * as FilterTools from './FilterTools';
import * as ResolutionTools from './ResolutionTools';
import * as ConfigurationTools from './ConfigurationTools';
import * as ResourceTools from './ResourceTools';
import * as ImportTools from './ImportTools';
import * as TsResTools from './TsResTools';
import * as ViewStateTools from './ViewStateTools';
import * as ZipTools from './ZipTools';
import * as PickerTools from './PickerTools';
import * as GridTools from './GridTools';
import * as ObservabilityTools from './ObservabilityTools';

export {
  DownloadTools,
  FilterTools,
  ResolutionTools,
  ConfigurationTools,
  ResourceTools,
  ImportTools,
  TsResTools,
  ViewStateTools,
  ZipTools,
  PickerTools,
  GridTools,
  ObservabilityTools
};
