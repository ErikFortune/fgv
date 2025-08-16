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
 *   ZipTools
 * } from '@fgv/ts-res-ui-components';
 *
 * // Use view components
 * <FilterTools.FilterView {...filterProps} />
 * <ResolutionTools.ResolutionView {...resolutionProps} />
 * <ZipTools.ImportView {...importProps} />
 *
 * // Or use utility functions
 * const hasFilters = FilterTools.hasFilterValues(filterState.values);
 * const resolver = ResolutionTools.createResolverWithContext(resources, context);
 * const zipLoader = ZipTools.createBrowserZipLoader();
 * ```
 *
 * @public
 */

export * as FilterTools from './FilterTools';
export * as ResolutionTools from './ResolutionTools';
export * as ConfigurationTools from './ConfigurationTools';
export * as FileTools from './FileTools';
export * as TsResTools from './TsResTools';
export * as ZipTools from './ZipTools';
