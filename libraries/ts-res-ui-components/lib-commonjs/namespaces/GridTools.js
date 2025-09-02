'use strict';
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
Object.defineProperty(exports, '__esModule', { value: true });
exports.clearAllGridValidationErrors =
  exports.getAllGridValidationErrors =
  exports.hasGridValidationErrors =
  exports.GridValidationState =
  exports.ValidationFunctions =
  exports.ValidationPatterns =
  exports.validateCellValue =
  exports.selectResources =
  exports.defaultResourceSelector =
  exports.ResourceSelector =
  exports.DropdownCell =
  exports.TriStateCell =
  exports.BooleanCell =
  exports.StringCell =
  exports.GridSelector =
  exports.SharedContextControls =
  exports.EditableGridCell =
  exports.ResourceGrid =
  exports.MultiGridView =
  exports.GridView =
    void 0;
// Export grid view components
var GridView_1 = require('../components/views/GridView');
Object.defineProperty(exports, 'GridView', {
  enumerable: true,
  get: function () {
    return GridView_1.GridView;
  }
});
var MultiGridView_1 = require('../components/views/GridView/MultiGridView');
Object.defineProperty(exports, 'MultiGridView', {
  enumerable: true,
  get: function () {
    return MultiGridView_1.MultiGridView;
  }
});
var ResourceGrid_1 = require('../components/views/GridView/ResourceGrid');
Object.defineProperty(exports, 'ResourceGrid', {
  enumerable: true,
  get: function () {
    return ResourceGrid_1.ResourceGrid;
  }
});
var EditableGridCell_1 = require('../components/views/GridView/EditableGridCell');
Object.defineProperty(exports, 'EditableGridCell', {
  enumerable: true,
  get: function () {
    return EditableGridCell_1.EditableGridCell;
  }
});
var SharedContextControls_1 = require('../components/views/GridView/SharedContextControls');
Object.defineProperty(exports, 'SharedContextControls', {
  enumerable: true,
  get: function () {
    return SharedContextControls_1.SharedContextControls;
  }
});
var GridSelector_1 = require('../components/views/GridView/GridSelector');
Object.defineProperty(exports, 'GridSelector', {
  enumerable: true,
  get: function () {
    return GridSelector_1.GridSelector;
  }
});
// Export specialized cell components
var cells_1 = require('../components/views/GridView/cells');
Object.defineProperty(exports, 'StringCell', {
  enumerable: true,
  get: function () {
    return cells_1.StringCell;
  }
});
Object.defineProperty(exports, 'BooleanCell', {
  enumerable: true,
  get: function () {
    return cells_1.BooleanCell;
  }
});
Object.defineProperty(exports, 'TriStateCell', {
  enumerable: true,
  get: function () {
    return cells_1.TriStateCell;
  }
});
Object.defineProperty(exports, 'DropdownCell', {
  enumerable: true,
  get: function () {
    return cells_1.DropdownCell;
  }
});
// Export grid utilities
var resourceSelector_1 = require('../utils/resourceSelector');
Object.defineProperty(exports, 'ResourceSelector', {
  enumerable: true,
  get: function () {
    return resourceSelector_1.ResourceSelector;
  }
});
Object.defineProperty(exports, 'defaultResourceSelector', {
  enumerable: true,
  get: function () {
    return resourceSelector_1.defaultResourceSelector;
  }
});
Object.defineProperty(exports, 'selectResources', {
  enumerable: true,
  get: function () {
    return resourceSelector_1.selectResources;
  }
});
var cellValidation_1 = require('../utils/cellValidation');
Object.defineProperty(exports, 'validateCellValue', {
  enumerable: true,
  get: function () {
    return cellValidation_1.validateCellValue;
  }
});
Object.defineProperty(exports, 'ValidationPatterns', {
  enumerable: true,
  get: function () {
    return cellValidation_1.ValidationPatterns;
  }
});
Object.defineProperty(exports, 'ValidationFunctions', {
  enumerable: true,
  get: function () {
    return cellValidation_1.ValidationFunctions;
  }
});
Object.defineProperty(exports, 'GridValidationState', {
  enumerable: true,
  get: function () {
    return cellValidation_1.GridValidationState;
  }
});
var EditableGridCell_2 = require('../components/views/GridView/EditableGridCell');
Object.defineProperty(exports, 'hasGridValidationErrors', {
  enumerable: true,
  get: function () {
    return EditableGridCell_2.hasGridValidationErrors;
  }
});
Object.defineProperty(exports, 'getAllGridValidationErrors', {
  enumerable: true,
  get: function () {
    return EditableGridCell_2.getAllGridValidationErrors;
  }
});
Object.defineProperty(exports, 'clearAllGridValidationErrors', {
  enumerable: true,
  get: function () {
    return EditableGridCell_2.clearAllGridValidationErrors;
  }
});
//# sourceMappingURL=GridTools.js.map
