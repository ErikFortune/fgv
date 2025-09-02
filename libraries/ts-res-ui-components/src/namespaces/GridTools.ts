/**
 * GridTools namespace for grid-based resource management components and utilities.
 *
 * Provides components and utilities for displaying and editing multiple resources
 * simultaneously in grid/table format with configurable columns, validation,
 * and batch operations.
 *
 * @example
 * ```tsx
 * import { GridTools, ResourceTools } from '@fgv/ts-res-ui-components';
 *
 * // Single grid usage
 * function UserDataGrid() {
 *   const { state, actions } = ResourceTools.useResourceData();
 *
 *   const gridConfig: GridTools.GridViewInitParams = {
 *     id: 'users',
 *     title: 'User Data',
 *     resourceSelection: { type: 'prefix', prefix: 'user.' },
 *     columnMapping: [{
 *       resourceType: 'user-data',
 *       columns: [
 *         {
 *           id: 'name',
 *           title: 'Name',
 *           dataPath: 'name',
 *           editable: true,
 *           cellType: 'string',
 *           validation: { required: true, maxLength: 100 }
 *         },
 *         {
 *           id: 'email',
 *           title: 'Email',
 *           dataPath: 'email',
 *           editable: true,
 *           cellType: 'string',
 *           validation: {
 *             required: true,
 *             pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
 *           }
 *         },
 *         {
 *           id: 'active',
 *           title: 'Active',
 *           dataPath: 'active',
 *           editable: true,
 *           cellType: 'boolean'
 *         }
 *       ]
 *     }]
 *   };
 *
 *   return (
 *     <GridTools.GridView
 *       gridConfig={gridConfig}
 *       resources={state.resources}
 *       resolutionState={state.resolutionState}
 *       resolutionActions={actions}
 *       availableQualifiers={['language', 'territory']}
 *     />
 *   );
 * }
 *
 * // Multi-grid usage for admin workflows
 * function AdminPanel() {
 *   const { state, actions } = ResourceTools.useResourceData();
 *
 *   const gridConfigs: GridTools.GridViewInitParams[] = [
 *     {
 *       id: 'languages',
 *       title: 'Languages',
 *       resourceSelection: { type: 'resourceTypes', types: ['language-config'] },
 *       columnMapping: [{
 *         resourceType: 'language-config',
 *         columns: [
 *           { id: 'code', title: 'Code', dataPath: 'code' },
 *           {
 *             id: 'name',
 *             title: 'Display Name',
 *             dataPath: 'displayName',
 *             editable: true,
 *             cellType: 'string'
 *           }
 *         ]
 *       }]
 *     },
 *     {
 *       id: 'payment-methods',
 *       title: 'Payment Methods',
 *       resourceSelection: { type: 'prefix', prefix: 'payment.' },
 *       columnMapping: [{
 *         resourceType: 'payment-config',
 *         columns: [
 *           {
 *             id: 'status',
 *             title: 'Status',
 *             dataPath: 'status',
 *             editable: true,
 *             cellType: 'dropdown',
 *             dropdownOptions: [
 *               { value: 'active', label: 'Active' },
 *               { value: 'inactive', label: 'Inactive' }
 *             ]
 *           }
 *         ]
 *       }]
 *     }
 *   ];
 *
 *   return (
 *     <GridTools.MultiGridView
 *       gridConfigurations={gridConfigs}
 *       resources={state.resources}
 *       resolutionState={state.resolutionState}
 *       resolutionActions={actions}
 *       availableQualifiers={['country', 'language', 'environment']}
 *       tabsPresentation="tabs"
 *     />
 *   );
 * }
 * ```
 *
 * @public
 */

// Export grid view components
export { GridView } from '../components/views/GridView';
export { MultiGridView } from '../components/views/GridView/MultiGridView';
export { ResourceGrid } from '../components/views/GridView/ResourceGrid';
export { EditableGridCell } from '../components/views/GridView/EditableGridCell';
export { SharedContextControls } from '../components/views/GridView/SharedContextControls';
export { GridSelector } from '../components/views/GridView/GridSelector';

// Export specialized cell components
export { StringCell, BooleanCell, TriStateCell, DropdownCell } from '../components/views/GridView/cells';

// Export grid utilities
export { ResourceSelector, defaultResourceSelector, selectResources } from '../utils/resourceSelector';
export {
  validateCellValue,
  ValidationPatterns,
  ValidationFunctions,
  GridValidationState
} from '../utils/cellValidation';
export {
  hasGridValidationErrors,
  getAllGridValidationErrors,
  clearAllGridValidationErrors
} from '../components/views/GridView/EditableGridCell';

// Export grid-related types
export type {
  GridViewProps,
  MultiGridViewProps,
  GridViewInitParams,
  GridColumnDefinition,
  GridDropdownOption,
  GridCellValidation,
  GridResourceSelector,
  CustomResourceSelector,
  GridPresentationOptions,
  ResourceTypeColumnMapping,
  GridCellProps,
  GridCellEditorProps
} from '../types';
