'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.useConfigurationState = useConfigurationState;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const ts_utils_1 = require('@fgv/ts-utils');
const configurationUtils_1 = require('../utils/configurationUtils');
/**
 * Hook for managing system configuration state including qualifiers, qualifier types, and resource types.
 *
 * Provides comprehensive configuration management with validation, change tracking, and import/export capabilities.
 * Supports both visual editing and JSON editing modes with real-time validation.
 *
 * @example
 * Basic usage:
 * ```typescript
 * const { state, actions } = useConfigurationState();
 *
 * // Check for unsaved changes
 * if (state.hasUnsavedChanges) {
 *   console.log('Configuration has been modified');
 * }
 *
 * // Add a new qualifier
 * actions.addQualifier({
 *   name: 'language',
 *   typeName: 'language',
 *   defaultPriority: 100
 * });
 * ```
 *
 * @example
 * With change notifications:
 * ```typescript
 * const { state, actions } = useConfigurationState(
 *   undefined,
 *   (config) => console.log('Configuration changed:', config),
 *   (hasChanges) => console.log('Has unsaved changes:', hasChanges)
 * );
 * ```
 *
 * @example
 * JSON import/export:
 * ```typescript
 * const { actions } = useConfigurationState();
 *
 * // Export to JSON
 * const exportResult = actions.exportToJson({ pretty: true });
 * if (exportResult.isSuccess()) {
 *   console.log(exportResult.value); // JSON string
 * }
 *
 * // Import from JSON
 * const importResult = actions.importFromJson(jsonString);
 * if (importResult.isFailure()) {
 *   console.error('Import failed:', importResult.message);
 * }
 * ```
 *
 * @param initialConfiguration - Optional initial configuration. Defaults to system default configuration
 * @param onConfigurationChange - Optional callback invoked when configuration changes (not on first mount)
 * @param onUnsavedChanges - Optional callback invoked when unsaved changes state changes
 *
 * @returns Object containing:
 * - `state` - Current configuration state with change tracking and validation
 * - `actions` - Methods for modifying and managing the configuration
 * - `templates` - Available configuration templates for quick loading
 *
 * @public
 */
function useConfigurationState(initialConfiguration, onConfigurationChange, onUnsavedChanges) {
  const defaultConfig = (0, react_1.useMemo)(
    () => initialConfiguration || (0, configurationUtils_1.getDefaultConfiguration)(),
    [initialConfiguration]
  );
  const originalConfigRef = (0, react_1.useRef)(defaultConfig);
  // State
  const [currentConfiguration, setCurrentConfiguration] = (0, react_1.useState)(
    (0, configurationUtils_1.cloneConfiguration)(defaultConfig)
  );
  const [activeTab, setActiveTab] = (0, react_1.useState)('qualifiers');
  const [isJsonView, setIsJsonView] = (0, react_1.useState)(false);
  const [jsonString, setJsonString] = (0, react_1.useState)('');
  const [jsonError, setJsonError] = (0, react_1.useState)(null);
  // Computed state
  const hasUnsavedChanges = (0, react_1.useMemo)(() => {
    return !(0, configurationUtils_1.compareConfigurations)(originalConfigRef.current, currentConfiguration);
  }, [currentConfiguration]);
  const changes = (0, react_1.useMemo)(() => {
    return (0, configurationUtils_1.trackConfigurationChanges)(
      originalConfigRef.current,
      currentConfiguration
    );
  }, [currentConfiguration]);
  const validation = (0, react_1.useMemo)(() => {
    return (0, configurationUtils_1.validateConfiguration)(currentConfiguration);
  }, [currentConfiguration]);
  // Update JSON string when configuration changes and in JSON view
  react_1.default.useEffect(() => {
    if (isJsonView) {
      const result = (0, configurationUtils_1.exportConfiguration)(currentConfiguration, {
        format: 'json',
        pretty: true
      });
      if (result.isSuccess()) {
        setJsonString(result.value);
        setJsonError(null);
      } else {
        setJsonError(result.message);
      }
    }
  }, [currentConfiguration, isJsonView]);
  // Notify parent of configuration changes
  const isFirstMount = (0, react_1.useRef)(true);
  const lastNotifiedConfig = (0, react_1.useRef)(currentConfiguration);
  react_1.default.useEffect(() => {
    // Skip notification on first mount to avoid loops
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    // Only notify if configuration actually changed
    if (!(0, configurationUtils_1.compareConfigurations)(lastNotifiedConfig.current, currentConfiguration)) {
      lastNotifiedConfig.current = currentConfiguration;
      onConfigurationChange?.(currentConfiguration);
    }
  }, [currentConfiguration, onConfigurationChange]);
  // Notify parent of unsaved changes
  react_1.default.useEffect(() => {
    onUnsavedChanges?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onUnsavedChanges]);
  // Actions
  const loadConfiguration = (0, react_1.useCallback)((config) => {
    const cloned = (0, configurationUtils_1.cloneConfiguration)(config);
    setCurrentConfiguration(cloned);
    originalConfigRef.current = (0, configurationUtils_1.cloneConfiguration)(config);
  }, []);
  const resetConfiguration = (0, react_1.useCallback)(() => {
    setCurrentConfiguration((0, configurationUtils_1.cloneConfiguration)(originalConfigRef.current));
  }, []);
  const applyConfiguration = (0, react_1.useCallback)(() => {
    originalConfigRef.current = (0, configurationUtils_1.cloneConfiguration)(currentConfiguration);
  }, [currentConfiguration]);
  // Qualifier Types operations
  const updateQualifierTypes = (0, react_1.useCallback)((qualifierTypes) => {
    setCurrentConfiguration((prev) => ({
      ...prev,
      qualifierTypes
    }));
  }, []);
  const addQualifierType = (0, react_1.useCallback)((qualifierType) => {
    setCurrentConfiguration((prev) => ({
      ...prev,
      qualifierTypes: [...(prev.qualifierTypes || []), qualifierType]
    }));
  }, []);
  const updateQualifierType = (0, react_1.useCallback)((index, qualifierType) => {
    setCurrentConfiguration((prev) => ({
      ...prev,
      qualifierTypes: prev.qualifierTypes?.map((qt, i) => (i === index ? qualifierType : qt)) || []
    }));
  }, []);
  const removeQualifierType = (0, react_1.useCallback)((index) => {
    setCurrentConfiguration((prev) => ({
      ...prev,
      qualifierTypes: prev.qualifierTypes?.filter((_, i) => i !== index) || []
    }));
  }, []);
  // Qualifiers operations
  const updateQualifiers = (0, react_1.useCallback)((qualifiers) => {
    setCurrentConfiguration((prev) => ({
      ...prev,
      qualifiers
    }));
  }, []);
  const addQualifier = (0, react_1.useCallback)((qualifier) => {
    setCurrentConfiguration((prev) => ({
      ...prev,
      qualifiers: [...(prev.qualifiers || []), qualifier]
    }));
  }, []);
  const updateQualifier = (0, react_1.useCallback)((index, qualifier) => {
    setCurrentConfiguration((prev) => ({
      ...prev,
      qualifiers: prev.qualifiers?.map((q, i) => (i === index ? qualifier : q)) || []
    }));
  }, []);
  const removeQualifier = (0, react_1.useCallback)((index) => {
    setCurrentConfiguration((prev) => ({
      ...prev,
      qualifiers: prev.qualifiers?.filter((_, i) => i !== index) || []
    }));
  }, []);
  // Resource Types operations
  const updateResourceTypes = (0, react_1.useCallback)((resourceTypes) => {
    setCurrentConfiguration((prev) => ({
      ...prev,
      resourceTypes
    }));
  }, []);
  const addResourceType = (0, react_1.useCallback)((resourceType) => {
    setCurrentConfiguration((prev) => ({
      ...prev,
      resourceTypes: [...(prev.resourceTypes || []), resourceType]
    }));
  }, []);
  const updateResourceType = (0, react_1.useCallback)((index, resourceType) => {
    setCurrentConfiguration((prev) => ({
      ...prev,
      resourceTypes: prev.resourceTypes?.map((rt, i) => (i === index ? resourceType : rt)) || []
    }));
  }, []);
  const removeResourceType = (0, react_1.useCallback)((index) => {
    setCurrentConfiguration((prev) => ({
      ...prev,
      resourceTypes: prev.resourceTypes?.filter((_, i) => i !== index) || []
    }));
  }, []);
  // View management
  const toggleJsonView = (0, react_1.useCallback)(() => {
    if (!isJsonView) {
      // Switching to JSON view - export current config
      const result = (0, configurationUtils_1.exportConfiguration)(currentConfiguration, {
        format: 'json',
        pretty: true
      });
      if (result.isSuccess()) {
        setJsonString(result.value);
        setJsonError(null);
      } else {
        setJsonError(result.message);
      }
    }
    setIsJsonView(!isJsonView);
  }, [isJsonView, currentConfiguration]);
  const updateJsonString = (0, react_1.useCallback)((json) => {
    setJsonString(json);
    setJsonError(null);
  }, []);
  const applyJsonChanges = (0, react_1.useCallback)(() => {
    const result = (0, configurationUtils_1.importConfiguration)(jsonString);
    if (result.isSuccess()) {
      setCurrentConfiguration(result.value);
      setJsonError(null);
      return (0, ts_utils_1.succeed)(undefined);
    } else {
      setJsonError(result.message);
      return (0, ts_utils_1.fail)(result.message);
    }
  }, [jsonString]);
  // Import/Export
  const exportToJson = (0, react_1.useCallback)(
    (options) => {
      return (0, configurationUtils_1.exportConfiguration)(currentConfiguration, options);
    },
    [currentConfiguration]
  );
  const importFromJson = (0, react_1.useCallback)(
    (jsonData) => {
      const result = (0, configurationUtils_1.importConfiguration)(jsonData);
      if (result.isSuccess()) {
        loadConfiguration(result.value);
        return (0, ts_utils_1.succeed)(undefined);
      }
      return (0, ts_utils_1.fail)(result.message);
    },
    [loadConfiguration]
  );
  const loadTemplate = (0, react_1.useCallback)(
    (templateId) => {
      const templates = (0, configurationUtils_1.getConfigurationTemplates)();
      const template = templates.find((t) => t.id === templateId);
      if (!template) {
        return (0, ts_utils_1.fail)(`Template '${templateId}' not found`);
      }
      loadConfiguration(template.configuration);
      return (0, ts_utils_1.succeed)(undefined);
    },
    [loadConfiguration]
  );
  const validateCurrent = (0, react_1.useCallback)(() => {
    return (0, configurationUtils_1.validateConfiguration)(currentConfiguration);
  }, [currentConfiguration]);
  const state = {
    currentConfiguration,
    originalConfiguration: originalConfigRef.current,
    hasUnsavedChanges,
    changes,
    validation,
    activeTab,
    isJsonView,
    jsonString,
    jsonError
  };
  const actions = {
    loadConfiguration,
    resetConfiguration,
    applyConfiguration,
    updateQualifierTypes,
    updateQualifiers,
    updateResourceTypes,
    addQualifierType,
    updateQualifierType,
    removeQualifierType,
    addQualifier,
    updateQualifier,
    removeQualifier,
    addResourceType,
    updateResourceType,
    removeResourceType,
    setActiveTab,
    toggleJsonView,
    updateJsonString,
    applyJsonChanges,
    exportToJson,
    importFromJson,
    loadTemplate,
    validateCurrent
  };
  return {
    state,
    actions,
    templates: (0, configurationUtils_1.getConfigurationTemplates)()
  };
}
//# sourceMappingURL=useConfigurationState.js.map
