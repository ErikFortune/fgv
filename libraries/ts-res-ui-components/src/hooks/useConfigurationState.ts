import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Config, QualifierTypes, Qualifiers, ResourceTypes } from '@fgv/ts-res';
import { Result, succeed, fail } from '@fgv/ts-utils';
import {
  getDefaultConfiguration,
  validateConfiguration,
  cloneConfiguration,
  compareConfigurations,
  trackConfigurationChanges,
  exportConfiguration,
  importConfiguration,
  getConfigurationTemplates,
  ConfigurationChanges,
  ConfigurationValidationResult,
  ConfigurationExportOptions,
  ConfigurationTemplate
} from '../utils/configurationUtils';

export interface ConfigurationState {
  currentConfiguration: Config.Model.ISystemConfiguration;
  originalConfiguration: Config.Model.ISystemConfiguration;
  hasUnsavedChanges: boolean;
  changes: ConfigurationChanges;
  validation: ConfigurationValidationResult;
  activeTab: 'qualifierTypes' | 'qualifiers' | 'resourceTypes' | 'json';
  isJsonView: boolean;
  jsonString: string;
  jsonError: string | null;
}

export interface ConfigurationActions {
  // Configuration management
  loadConfiguration: (config: Config.Model.ISystemConfiguration) => void;
  resetConfiguration: () => void;
  applyConfiguration: () => void;

  // Editing operations
  updateQualifierTypes: (qualifierTypes: QualifierTypes.Config.ISystemQualifierTypeConfig[]) => void;
  updateQualifiers: (qualifiers: Qualifiers.IQualifierDecl[]) => void;
  updateResourceTypes: (resourceTypes: ResourceTypes.Config.IResourceTypeConfig[]) => void;

  // Individual item operations
  addQualifierType: (qualifierType: QualifierTypes.Config.ISystemQualifierTypeConfig) => void;
  updateQualifierType: (
    index: number,
    qualifierType: QualifierTypes.Config.ISystemQualifierTypeConfig
  ) => void;
  removeQualifierType: (index: number) => void;

  addQualifier: (qualifier: Qualifiers.IQualifierDecl) => void;
  updateQualifier: (index: number, qualifier: Qualifiers.IQualifierDecl) => void;
  removeQualifier: (index: number) => void;

  addResourceType: (resourceType: ResourceTypes.Config.IResourceTypeConfig) => void;
  updateResourceType: (index: number, resourceType: ResourceTypes.Config.IResourceTypeConfig) => void;
  removeResourceType: (index: number) => void;

  // View management
  setActiveTab: (tab: ConfigurationState['activeTab']) => void;
  toggleJsonView: () => void;
  updateJsonString: (json: string) => void;
  applyJsonChanges: () => Result<void>;

  // Import/Export
  exportToJson: (options?: ConfigurationExportOptions) => Result<string>;
  importFromJson: (jsonData: string) => Result<void>;
  loadTemplate: (templateId: string) => Result<void>;

  // Validation
  validateCurrent: () => ConfigurationValidationResult;
}

export interface UseConfigurationStateReturn {
  state: ConfigurationState;
  actions: ConfigurationActions;
  templates: ConfigurationTemplate[];
}

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
export function useConfigurationState(
  initialConfiguration?: Config.Model.ISystemConfiguration,
  onConfigurationChange?: (config: Config.Model.ISystemConfiguration) => void,
  onUnsavedChanges?: (hasChanges: boolean) => void
): UseConfigurationStateReturn {
  const defaultConfig = useMemo(
    () => initialConfiguration || getDefaultConfiguration(),
    [initialConfiguration]
  );
  const originalConfigRef = useRef(defaultConfig);

  // State
  const [currentConfiguration, setCurrentConfiguration] = useState<Config.Model.ISystemConfiguration>(
    cloneConfiguration(defaultConfig)
  );
  const [activeTab, setActiveTab] = useState<ConfigurationState['activeTab']>('qualifiers');
  const [isJsonView, setIsJsonView] = useState(false);
  const [jsonString, setJsonString] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Computed state
  const hasUnsavedChanges = useMemo(() => {
    return !compareConfigurations(originalConfigRef.current, currentConfiguration);
  }, [currentConfiguration]);

  const changes = useMemo(() => {
    return trackConfigurationChanges(originalConfigRef.current, currentConfiguration);
  }, [currentConfiguration]);

  const validation = useMemo(() => {
    return validateConfiguration(currentConfiguration);
  }, [currentConfiguration]);

  // Update JSON string when configuration changes and in JSON view
  React.useEffect(() => {
    if (isJsonView) {
      const result = exportConfiguration(currentConfiguration, { format: 'json', pretty: true });
      if (result.isSuccess()) {
        setJsonString(result.value);
        setJsonError(null);
      } else {
        setJsonError(result.message);
      }
    }
  }, [currentConfiguration, isJsonView]);

  // Notify parent of configuration changes
  const isFirstMount = useRef(true);
  const lastNotifiedConfig = useRef(currentConfiguration);

  React.useEffect(() => {
    // Skip notification on first mount to avoid loops
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    // Only notify if configuration actually changed
    if (!compareConfigurations(lastNotifiedConfig.current, currentConfiguration)) {
      lastNotifiedConfig.current = currentConfiguration;
      onConfigurationChange?.(currentConfiguration);
    }
  }, [currentConfiguration, onConfigurationChange]);

  // Notify parent of unsaved changes
  React.useEffect(() => {
    onUnsavedChanges?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onUnsavedChanges]);

  // Actions
  const loadConfiguration = useCallback((config: Config.Model.ISystemConfiguration) => {
    const cloned = cloneConfiguration(config);
    setCurrentConfiguration(cloned);
    originalConfigRef.current = cloneConfiguration(config);
  }, []);

  const resetConfiguration = useCallback(() => {
    setCurrentConfiguration(cloneConfiguration(originalConfigRef.current));
  }, []);

  const applyConfiguration = useCallback(() => {
    originalConfigRef.current = cloneConfiguration(currentConfiguration);
  }, [currentConfiguration]);

  // Qualifier Types operations
  const updateQualifierTypes = useCallback(
    (qualifierTypes: QualifierTypes.Config.ISystemQualifierTypeConfig[]) => {
      setCurrentConfiguration((prev) => ({
        ...prev,
        qualifierTypes
      }));
    },
    []
  );

  const addQualifierType = useCallback((qualifierType: QualifierTypes.Config.ISystemQualifierTypeConfig) => {
    setCurrentConfiguration((prev) => ({
      ...prev,
      qualifierTypes: [...(prev.qualifierTypes || []), qualifierType]
    }));
  }, []);

  const updateQualifierType = useCallback(
    (index: number, qualifierType: QualifierTypes.Config.ISystemQualifierTypeConfig) => {
      setCurrentConfiguration((prev) => ({
        ...prev,
        qualifierTypes: prev.qualifierTypes?.map((qt, i) => (i === index ? qualifierType : qt)) || []
      }));
    },
    []
  );

  const removeQualifierType = useCallback((index: number) => {
    setCurrentConfiguration((prev) => ({
      ...prev,
      qualifierTypes: prev.qualifierTypes?.filter((_, i) => i !== index) || []
    }));
  }, []);

  // Qualifiers operations
  const updateQualifiers = useCallback((qualifiers: Qualifiers.IQualifierDecl[]) => {
    setCurrentConfiguration((prev) => ({
      ...prev,
      qualifiers
    }));
  }, []);

  const addQualifier = useCallback((qualifier: Qualifiers.IQualifierDecl) => {
    setCurrentConfiguration((prev) => ({
      ...prev,
      qualifiers: [...(prev.qualifiers || []), qualifier]
    }));
  }, []);

  const updateQualifier = useCallback((index: number, qualifier: Qualifiers.IQualifierDecl) => {
    setCurrentConfiguration((prev) => ({
      ...prev,
      qualifiers: prev.qualifiers?.map((q, i) => (i === index ? qualifier : q)) || []
    }));
  }, []);

  const removeQualifier = useCallback((index: number) => {
    setCurrentConfiguration((prev) => ({
      ...prev,
      qualifiers: prev.qualifiers?.filter((_, i) => i !== index) || []
    }));
  }, []);

  // Resource Types operations
  const updateResourceTypes = useCallback((resourceTypes: ResourceTypes.Config.IResourceTypeConfig[]) => {
    setCurrentConfiguration((prev) => ({
      ...prev,
      resourceTypes
    }));
  }, []);

  const addResourceType = useCallback((resourceType: ResourceTypes.Config.IResourceTypeConfig) => {
    setCurrentConfiguration((prev) => ({
      ...prev,
      resourceTypes: [...(prev.resourceTypes || []), resourceType]
    }));
  }, []);

  const updateResourceType = useCallback(
    (index: number, resourceType: ResourceTypes.Config.IResourceTypeConfig) => {
      setCurrentConfiguration((prev) => ({
        ...prev,
        resourceTypes: prev.resourceTypes?.map((rt, i) => (i === index ? resourceType : rt)) || []
      }));
    },
    []
  );

  const removeResourceType = useCallback((index: number) => {
    setCurrentConfiguration((prev) => ({
      ...prev,
      resourceTypes: prev.resourceTypes?.filter((_, i) => i !== index) || []
    }));
  }, []);

  // View management
  const toggleJsonView = useCallback(() => {
    if (!isJsonView) {
      // Switching to JSON view - export current config
      const result = exportConfiguration(currentConfiguration, { format: 'json', pretty: true });
      if (result.isSuccess()) {
        setJsonString(result.value);
        setJsonError(null);
      } else {
        setJsonError(result.message);
      }
    }
    setIsJsonView(!isJsonView);
  }, [isJsonView, currentConfiguration]);

  const updateJsonString = useCallback((json: string) => {
    setJsonString(json);
    setJsonError(null);
  }, []);

  const applyJsonChanges = useCallback((): Result<void> => {
    const result = importConfiguration(jsonString);
    if (result.isSuccess()) {
      setCurrentConfiguration(result.value);
      setJsonError(null);
      return succeed(undefined);
    } else {
      setJsonError(result.message);
      return fail(result.message);
    }
  }, [jsonString]);

  // Import/Export
  const exportToJson = useCallback(
    (options?: ConfigurationExportOptions): Result<string> => {
      return exportConfiguration(currentConfiguration, options);
    },
    [currentConfiguration]
  );

  const importFromJson = useCallback(
    (jsonData: string): Result<void> => {
      const result = importConfiguration(jsonData);
      if (result.isSuccess()) {
        loadConfiguration(result.value);
        return succeed(undefined);
      }
      return fail(result.message);
    },
    [loadConfiguration]
  );

  const loadTemplate = useCallback(
    (templateId: string): Result<void> => {
      const templates = getConfigurationTemplates();
      const template = templates.find((t) => t.id === templateId);

      if (!template) {
        return fail(`Template '${templateId}' not found`);
      }

      loadConfiguration(template.configuration);
      return succeed(undefined);
    },
    [loadConfiguration]
  );

  const validateCurrent = useCallback((): ConfigurationValidationResult => {
    return validateConfiguration(currentConfiguration);
  }, [currentConfiguration]);

  const state: ConfigurationState = {
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

  const actions: ConfigurationActions = {
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
    templates: getConfigurationTemplates()
  };
}
