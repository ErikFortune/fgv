'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.useConfigurationState = useConfigurationState;
var tslib_1 = require('tslib');
var react_1 = tslib_1.__importStar(require('react'));
var ts_utils_1 = require('@fgv/ts-utils');
var configurationUtils_1 = require('../utils/configurationUtils');
function useConfigurationState(initialConfiguration, onConfigurationChange, onUnsavedChanges) {
  var defaultConfig = (0, react_1.useMemo)(
    function () {
      return initialConfiguration || (0, configurationUtils_1.getDefaultConfiguration)();
    },
    [initialConfiguration]
  );
  var originalConfigRef = (0, react_1.useRef)(defaultConfig);
  // State
  var _a = (0, react_1.useState)((0, configurationUtils_1.cloneConfiguration)(defaultConfig)),
    currentConfiguration = _a[0],
    setCurrentConfiguration = _a[1];
  var _b = (0, react_1.useState)('qualifierTypes'),
    activeTab = _b[0],
    setActiveTab = _b[1];
  var _c = (0, react_1.useState)(false),
    isJsonView = _c[0],
    setIsJsonView = _c[1];
  var _d = (0, react_1.useState)(''),
    jsonString = _d[0],
    setJsonString = _d[1];
  var _e = (0, react_1.useState)(null),
    jsonError = _e[0],
    setJsonError = _e[1];
  // Computed state
  var hasUnsavedChanges = (0, react_1.useMemo)(
    function () {
      return !(0, configurationUtils_1.compareConfigurations)(
        originalConfigRef.current,
        currentConfiguration
      );
    },
    [currentConfiguration]
  );
  var changes = (0, react_1.useMemo)(
    function () {
      return (0, configurationUtils_1.trackConfigurationChanges)(
        originalConfigRef.current,
        currentConfiguration
      );
    },
    [currentConfiguration]
  );
  var validation = (0, react_1.useMemo)(
    function () {
      return (0, configurationUtils_1.validateConfiguration)(currentConfiguration);
    },
    [currentConfiguration]
  );
  // Update JSON string when configuration changes and in JSON view
  react_1.default.useEffect(
    function () {
      if (isJsonView) {
        var result = (0, configurationUtils_1.exportConfiguration)(currentConfiguration, {
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
    },
    [currentConfiguration, isJsonView]
  );
  // Notify parent of configuration changes
  react_1.default.useEffect(
    function () {
      onConfigurationChange === null || onConfigurationChange === void 0
        ? void 0
        : onConfigurationChange(currentConfiguration);
    },
    [currentConfiguration, onConfigurationChange]
  );
  // Notify parent of unsaved changes
  react_1.default.useEffect(
    function () {
      onUnsavedChanges === null || onUnsavedChanges === void 0 ? void 0 : onUnsavedChanges(hasUnsavedChanges);
    },
    [hasUnsavedChanges, onUnsavedChanges]
  );
  // Actions
  var loadConfiguration = (0, react_1.useCallback)(function (config) {
    var cloned = (0, configurationUtils_1.cloneConfiguration)(config);
    setCurrentConfiguration(cloned);
    originalConfigRef.current = (0, configurationUtils_1.cloneConfiguration)(config);
  }, []);
  var resetConfiguration = (0, react_1.useCallback)(function () {
    setCurrentConfiguration((0, configurationUtils_1.cloneConfiguration)(originalConfigRef.current));
  }, []);
  var applyConfiguration = (0, react_1.useCallback)(
    function () {
      originalConfigRef.current = (0, configurationUtils_1.cloneConfiguration)(currentConfiguration);
    },
    [currentConfiguration]
  );
  // Qualifier Types operations
  var updateQualifierTypes = (0, react_1.useCallback)(function (qualifierTypes) {
    setCurrentConfiguration(function (prev) {
      return tslib_1.__assign(tslib_1.__assign({}, prev), { qualifierTypes: qualifierTypes });
    });
  }, []);
  var addQualifierType = (0, react_1.useCallback)(function (qualifierType) {
    setCurrentConfiguration(function (prev) {
      return tslib_1.__assign(tslib_1.__assign({}, prev), {
        qualifierTypes: tslib_1.__spreadArray(
          tslib_1.__spreadArray([], prev.qualifierTypes || [], true),
          [qualifierType],
          false
        )
      });
    });
  }, []);
  var updateQualifierType = (0, react_1.useCallback)(function (index, qualifierType) {
    setCurrentConfiguration(function (prev) {
      var _a;
      return tslib_1.__assign(tslib_1.__assign({}, prev), {
        qualifierTypes:
          ((_a = prev.qualifierTypes) === null || _a === void 0
            ? void 0
            : _a.map(function (qt, i) {
                return i === index ? qualifierType : qt;
              })) || []
      });
    });
  }, []);
  var removeQualifierType = (0, react_1.useCallback)(function (index) {
    setCurrentConfiguration(function (prev) {
      var _a;
      return tslib_1.__assign(tslib_1.__assign({}, prev), {
        qualifierTypes:
          ((_a = prev.qualifierTypes) === null || _a === void 0
            ? void 0
            : _a.filter(function (_, i) {
                return i !== index;
              })) || []
      });
    });
  }, []);
  // Qualifiers operations
  var updateQualifiers = (0, react_1.useCallback)(function (qualifiers) {
    setCurrentConfiguration(function (prev) {
      return tslib_1.__assign(tslib_1.__assign({}, prev), { qualifiers: qualifiers });
    });
  }, []);
  var addQualifier = (0, react_1.useCallback)(function (qualifier) {
    setCurrentConfiguration(function (prev) {
      return tslib_1.__assign(tslib_1.__assign({}, prev), {
        qualifiers: tslib_1.__spreadArray(
          tslib_1.__spreadArray([], prev.qualifiers || [], true),
          [qualifier],
          false
        )
      });
    });
  }, []);
  var updateQualifier = (0, react_1.useCallback)(function (index, qualifier) {
    setCurrentConfiguration(function (prev) {
      var _a;
      return tslib_1.__assign(tslib_1.__assign({}, prev), {
        qualifiers:
          ((_a = prev.qualifiers) === null || _a === void 0
            ? void 0
            : _a.map(function (q, i) {
                return i === index ? qualifier : q;
              })) || []
      });
    });
  }, []);
  var removeQualifier = (0, react_1.useCallback)(function (index) {
    setCurrentConfiguration(function (prev) {
      var _a;
      return tslib_1.__assign(tslib_1.__assign({}, prev), {
        qualifiers:
          ((_a = prev.qualifiers) === null || _a === void 0
            ? void 0
            : _a.filter(function (_, i) {
                return i !== index;
              })) || []
      });
    });
  }, []);
  // Resource Types operations
  var updateResourceTypes = (0, react_1.useCallback)(function (resourceTypes) {
    setCurrentConfiguration(function (prev) {
      return tslib_1.__assign(tslib_1.__assign({}, prev), { resourceTypes: resourceTypes });
    });
  }, []);
  var addResourceType = (0, react_1.useCallback)(function (resourceType) {
    setCurrentConfiguration(function (prev) {
      return tslib_1.__assign(tslib_1.__assign({}, prev), {
        resourceTypes: tslib_1.__spreadArray(
          tslib_1.__spreadArray([], prev.resourceTypes || [], true),
          [resourceType],
          false
        )
      });
    });
  }, []);
  var updateResourceType = (0, react_1.useCallback)(function (index, resourceType) {
    setCurrentConfiguration(function (prev) {
      var _a;
      return tslib_1.__assign(tslib_1.__assign({}, prev), {
        resourceTypes:
          ((_a = prev.resourceTypes) === null || _a === void 0
            ? void 0
            : _a.map(function (rt, i) {
                return i === index ? resourceType : rt;
              })) || []
      });
    });
  }, []);
  var removeResourceType = (0, react_1.useCallback)(function (index) {
    setCurrentConfiguration(function (prev) {
      var _a;
      return tslib_1.__assign(tslib_1.__assign({}, prev), {
        resourceTypes:
          ((_a = prev.resourceTypes) === null || _a === void 0
            ? void 0
            : _a.filter(function (_, i) {
                return i !== index;
              })) || []
      });
    });
  }, []);
  // View management
  var toggleJsonView = (0, react_1.useCallback)(
    function () {
      if (!isJsonView) {
        // Switching to JSON view - export current config
        var result = (0, configurationUtils_1.exportConfiguration)(currentConfiguration, {
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
    },
    [isJsonView, currentConfiguration]
  );
  var updateJsonString = (0, react_1.useCallback)(function (json) {
    setJsonString(json);
    setJsonError(null);
  }, []);
  var applyJsonChanges = (0, react_1.useCallback)(
    function () {
      var result = (0, configurationUtils_1.importConfiguration)(jsonString);
      if (result.isSuccess()) {
        setCurrentConfiguration(result.value);
        setJsonError(null);
        return (0, ts_utils_1.succeed)(undefined);
      } else {
        setJsonError(result.message);
        return (0, ts_utils_1.fail)(result.message);
      }
    },
    [jsonString]
  );
  // Import/Export
  var exportToJson = (0, react_1.useCallback)(
    function (options) {
      return (0, configurationUtils_1.exportConfiguration)(currentConfiguration, options);
    },
    [currentConfiguration]
  );
  var importFromJson = (0, react_1.useCallback)(
    function (jsonData) {
      var result = (0, configurationUtils_1.importConfiguration)(jsonData);
      if (result.isSuccess()) {
        loadConfiguration(result.value);
        return (0, ts_utils_1.succeed)(undefined);
      }
      return (0, ts_utils_1.fail)(result.message);
    },
    [loadConfiguration]
  );
  var loadTemplate = (0, react_1.useCallback)(
    function (templateId) {
      var templates = (0, configurationUtils_1.getConfigurationTemplates)();
      var template = templates.find(function (t) {
        return t.id === templateId;
      });
      if (!template) {
        return (0, ts_utils_1.fail)("Template '".concat(templateId, "' not found"));
      }
      loadConfiguration(template.configuration);
      return (0, ts_utils_1.succeed)(undefined);
    },
    [loadConfiguration]
  );
  var validateCurrent = (0, react_1.useCallback)(
    function () {
      return (0, configurationUtils_1.validateConfiguration)(currentConfiguration);
    },
    [currentConfiguration]
  );
  var state = {
    currentConfiguration: currentConfiguration,
    originalConfiguration: originalConfigRef.current,
    hasUnsavedChanges: hasUnsavedChanges,
    changes: changes,
    validation: validation,
    activeTab: activeTab,
    isJsonView: isJsonView,
    jsonString: jsonString,
    jsonError: jsonError
  };
  var actions = {
    loadConfiguration: loadConfiguration,
    resetConfiguration: resetConfiguration,
    applyConfiguration: applyConfiguration,
    updateQualifierTypes: updateQualifierTypes,
    updateQualifiers: updateQualifiers,
    updateResourceTypes: updateResourceTypes,
    addQualifierType: addQualifierType,
    updateQualifierType: updateQualifierType,
    removeQualifierType: removeQualifierType,
    addQualifier: addQualifier,
    updateQualifier: updateQualifier,
    removeQualifier: removeQualifier,
    addResourceType: addResourceType,
    updateResourceType: updateResourceType,
    removeResourceType: removeResourceType,
    setActiveTab: setActiveTab,
    toggleJsonView: toggleJsonView,
    updateJsonString: updateJsonString,
    applyJsonChanges: applyJsonChanges,
    exportToJson: exportToJson,
    importFromJson: importFromJson,
    loadTemplate: loadTemplate,
    validateCurrent: validateCurrent
  };
  return {
    state: state,
    actions: actions,
    templates: (0, configurationUtils_1.getConfigurationTemplates)()
  };
}
//# sourceMappingURL=useConfigurationState.js.map
