'use strict';
/**
 * Tools and components for ts-res system configuration management.
 *
 * This namespace contains the ConfigurationView component and utility functions
 * for creating, validating, and managing ts-res system configurations, including
 * templates and export/import operations.
 *
 * @example
 * ```tsx
 * import { ConfigurationTools } from '@fgv/ts-res-ui-components';
 *
 * // Use the ConfigurationView component
 * <ConfigurationTools.ConfigurationView
 *   configuration={systemConfiguration}
 *   onConfigurationChange={handleConfigChange}
 *   onSave={handleSave}
 *   hasUnsavedChanges={hasChanges}
 *   onMessage={onMessage}
 * />
 *
 * // Use form components for editing individual configuration elements
 * <ConfigurationTools.QualifierTypeEditForm
 *   qualifierType={editingQualifierType}
 *   onSave={handleSaveQualifierType}
 *   onCancel={handleCancel}
 *   existingNames={existingTypeNames}
 * />
 *
 * // Use utility functions
 * const config = ConfigurationTools.getDefaultConfiguration();
 * const validation = ConfigurationTools.validateConfiguration(config);
 * ```
 *
 * @public
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.importConfiguration =
  exports.exportConfiguration =
  exports.cloneConfiguration =
  exports.validateConfiguration =
  exports.getDefaultConfiguration =
  exports.useConfigurationState =
  exports.HierarchyEditor =
  exports.ResourceTypeEditForm =
  exports.QualifierEditForm =
  exports.QualifierTypeEditForm =
  exports.ConfigurationView =
    void 0;
// Export the main ConfigurationView component
var ConfigurationView_1 = require('../components/views/ConfigurationView');
Object.defineProperty(exports, 'ConfigurationView', {
  enumerable: true,
  get: function () {
    return ConfigurationView_1.ConfigurationView;
  }
});
// Export configuration editing form components
var QualifierTypeEditForm_1 = require('../components/forms/QualifierTypeEditForm');
Object.defineProperty(exports, 'QualifierTypeEditForm', {
  enumerable: true,
  get: function () {
    return QualifierTypeEditForm_1.QualifierTypeEditForm;
  }
});
var QualifierEditForm_1 = require('../components/forms/QualifierEditForm');
Object.defineProperty(exports, 'QualifierEditForm', {
  enumerable: true,
  get: function () {
    return QualifierEditForm_1.QualifierEditForm;
  }
});
var ResourceTypeEditForm_1 = require('../components/forms/ResourceTypeEditForm');
Object.defineProperty(exports, 'ResourceTypeEditForm', {
  enumerable: true,
  get: function () {
    return ResourceTypeEditForm_1.ResourceTypeEditForm;
  }
});
var HierarchyEditor_1 = require('../components/forms/HierarchyEditor');
Object.defineProperty(exports, 'HierarchyEditor', {
  enumerable: true,
  get: function () {
    return HierarchyEditor_1.HierarchyEditor;
  }
});
// Export domain-specific hook
var useConfigurationState_1 = require('../hooks/useConfigurationState');
Object.defineProperty(exports, 'useConfigurationState', {
  enumerable: true,
  get: function () {
    return useConfigurationState_1.useConfigurationState;
  }
});
// Export utility functions
var configurationUtils_1 = require('../utils/configurationUtils');
Object.defineProperty(exports, 'getDefaultConfiguration', {
  enumerable: true,
  get: function () {
    return configurationUtils_1.getDefaultConfiguration;
  }
});
Object.defineProperty(exports, 'validateConfiguration', {
  enumerable: true,
  get: function () {
    return configurationUtils_1.validateConfiguration;
  }
});
Object.defineProperty(exports, 'cloneConfiguration', {
  enumerable: true,
  get: function () {
    return configurationUtils_1.cloneConfiguration;
  }
});
Object.defineProperty(exports, 'exportConfiguration', {
  enumerable: true,
  get: function () {
    return configurationUtils_1.exportConfiguration;
  }
});
Object.defineProperty(exports, 'importConfiguration', {
  enumerable: true,
  get: function () {
    return configurationUtils_1.importConfiguration;
  }
});
//# sourceMappingURL=ConfigurationTools.js.map
