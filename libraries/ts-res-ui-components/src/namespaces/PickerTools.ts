/**
 * Tools and components for resource selection and picking operations.
 *
 * This namespace contains the ResourcePicker component and related utilities for
 * browsing, searching, and selecting resources with support for annotations,
 * pending resources, and comprehensive selection data.
 *
 * @example
 * ```tsx
 * import { PickerTools } from '@fgv/ts-res-ui-components';
 *
 * // Use the ResourcePicker component
 * <PickerTools.ResourcePicker
 *   resources={processedResources}
 *   selectedResourceId={currentId}
 *   onResourceSelect={(selection) => {
 *     setCurrentId(selection.resourceId);
 *     if (selection.resourceData) {
 *       handleResourceData(selection.resourceData);
 *     }
 *   }}
 *   defaultView="tree"
 *   enableSearch={true}
 *   resourceAnnotations={{
 *     'res1': { badge: { text: '3', variant: 'info' } }
 *   }}
 * />
 * ```
 *
 * @example
 * ```typescript
 * // Working with resource selection data
 * import { PickerTools } from '@fgv/ts-res-ui-components';
 *
 * const handleResourceSelect = (selection: PickerTools.ResourceSelection<MyResourceType>) => {
 *   if (selection.resourceId) {
 *     console.log('Selected:', selection.resourceId);
 *     if (selection.resourceData) {
 *       console.log('Data:', selection.resourceData);
 *     }
 *     if (selection.isPending) {
 *       console.log('Pending operation:', selection.pendingType);
 *     }
 *   }
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Using annotations and pending resources
 * import { PickerTools } from '@fgv/ts-res-ui-components';
 *
 * const annotations: PickerTools.ResourceAnnotations = {
 *   'user.welcome': {
 *     badge: { text: 'Modified', variant: 'warning' },
 *     icon: 'pencil'
 *   },
 *   'user.goodbye': {
 *     badge: { text: 'New', variant: 'success' }
 *   }
 * };
 *
 * const pendingResources: PickerTools.PendingResource[] = [
 *   {
 *     id: 'temp-1',
 *     name: 'New Resource',
 *     type: 'new',
 *     data: { value: 'Temporary data' }
 *   }
 * ];
 * ```
 *
 * @public
 */

// Export the main ResourcePicker component
export { ResourcePicker } from '../components/pickers/ResourcePicker';

// Export types related to resource picking and selection
export type {
  ResourcePickerProps,
  ResourceSelection,
  ResourceAnnotations,
  ResourceAnnotation,
  PendingResource
} from '../components/pickers/ResourcePicker/types';
