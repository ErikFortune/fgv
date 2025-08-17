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

export * as FilterTools from './FilterTools';
export * as ResolutionTools from './ResolutionTools';
export * as ConfigurationTools from './ConfigurationTools';
export * as ResourceTools from './ResourceTools';
export * as ImportTools from './ImportTools';
export * as TsResTools from './TsResTools';
export * as ViewStateTools from './ViewStateTools';
export * as ZipTools from './ZipTools';
export * as PickerTools from './PickerTools';
