'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ConfigurationView = void 0;
var tslib_1 = require('tslib');
var react_1 = tslib_1.__importStar(require('react'));
var outline_1 = require('@heroicons/react/24/outline');
var useConfigurationState_1 = require('../../../hooks/useConfigurationState');
var QualifierTypeEditForm_1 = require('../../forms/QualifierTypeEditForm');
var QualifierEditForm_1 = require('../../forms/QualifierEditForm');
var ResourceTypeEditForm_1 = require('../../forms/ResourceTypeEditForm');
var ConfigurationView = function (_a) {
  var _b, _c, _d;
  var configuration = _a.configuration,
    onConfigurationChange = _a.onConfigurationChange,
    onSave = _a.onSave,
    hasUnsavedChanges = _a.hasUnsavedChanges,
    onMessage = _a.onMessage,
    _e = _a.className,
    className = _e === void 0 ? '' : _e;
  var fileInputRef = (0, react_1.useRef)(null);
  var _f = (0, react_1.useState)(null),
    editingQualifierType = _f[0],
    setEditingQualifierType = _f[1];
  var _g = (0, react_1.useState)(null),
    editingQualifier = _g[0],
    setEditingQualifier = _g[1];
  var _h = (0, react_1.useState)(null),
    editingResourceType = _h[0],
    setEditingResourceType = _h[1];
  var _j = (0, react_1.useState)(false),
    showAddQualifierType = _j[0],
    setShowAddQualifierType = _j[1];
  var _k = (0, react_1.useState)(false),
    showAddQualifier = _k[0],
    setShowAddQualifier = _k[1];
  var _l = (0, react_1.useState)(false),
    showAddResourceType = _l[0],
    setShowAddResourceType = _l[1];
  var _m = (0, useConfigurationState_1.useConfigurationState)(
      configuration || undefined,
      onConfigurationChange,
      hasUnsavedChanges
        ? undefined
        : function (changes) {
            // Only notify if we weren't already told there are unsaved changes
          }
    ),
    state = _m.state,
    actions = _m.actions,
    templates = _m.templates;
  // Handle file import
  var handleFileImport = (0, react_1.useCallback)(
    function (files) {
      if (!files || files.length === 0) return;
      var file = files[0];
      var reader = new FileReader();
      reader.onload = function (e) {
        var _a;
        var content = (_a = e.target) === null || _a === void 0 ? void 0 : _a.result;
        if (content) {
          var result = actions.importFromJson(content);
          if (result.isSuccess()) {
            onMessage === null || onMessage === void 0
              ? void 0
              : onMessage('success', 'Configuration imported from '.concat(file.name));
          } else {
            onMessage === null || onMessage === void 0
              ? void 0
              : onMessage('error', 'Import failed: '.concat(result.message));
          }
        }
      };
      reader.onerror = function () {
        onMessage === null || onMessage === void 0
          ? void 0
          : onMessage('error', 'Failed to read file: '.concat(file.name));
      };
      reader.readAsText(file);
    },
    [actions, onMessage]
  );
  // Handle export
  var handleExport = (0, react_1.useCallback)(
    function () {
      var result = actions.exportToJson({ format: 'json', pretty: true });
      if (result.isSuccess()) {
        var blob = new Blob([result.value], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'ts-res-configuration.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        onMessage === null || onMessage === void 0
          ? void 0
          : onMessage('success', 'Configuration exported successfully');
      } else {
        onMessage === null || onMessage === void 0
          ? void 0
          : onMessage('error', 'Export failed: '.concat(result.message));
      }
    },
    [actions, onMessage]
  );
  // Handle template loading
  var handleLoadTemplate = (0, react_1.useCallback)(
    function (templateId) {
      var result = actions.loadTemplate(templateId);
      if (result.isSuccess()) {
        var template = templates.find(function (t) {
          return t.id === templateId;
        });
        onMessage === null || onMessage === void 0
          ? void 0
          : onMessage(
              'success',
              'Loaded template: '.concat(template === null || template === void 0 ? void 0 : template.name)
            );
      } else {
        onMessage === null || onMessage === void 0
          ? void 0
          : onMessage('error', 'Failed to load template: '.concat(result.message));
      }
    },
    [actions, templates, onMessage]
  );
  // Handle save
  var handleSave = (0, react_1.useCallback)(
    function () {
      if (onSave) {
        onSave(state.currentConfiguration);
        actions.applyConfiguration();
        onMessage === null || onMessage === void 0
          ? void 0
          : onMessage('success', 'Configuration saved successfully');
      }
    },
    [onSave, state.currentConfiguration, actions, onMessage]
  );
  if (!configuration && !state.currentConfiguration) {
    return react_1.default.createElement(
      'div',
      { className: 'p-6 '.concat(className) },
      react_1.default.createElement(
        'div',
        { className: 'flex items-center space-x-3 mb-6' },
        react_1.default.createElement(outline_1.CogIcon, { className: 'h-8 w-8 text-blue-600' }),
        react_1.default.createElement(
          'h2',
          { className: 'text-2xl font-bold text-gray-900' },
          'Configuration'
        )
      ),
      react_1.default.createElement(
        'div',
        { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center' },
        react_1.default.createElement(
          'div',
          { className: 'max-w-2xl mx-auto' },
          react_1.default.createElement(
            'h3',
            { className: 'text-xl font-semibold text-gray-900 mb-4' },
            'No Configuration Available'
          ),
          react_1.default.createElement(
            'p',
            { className: 'text-gray-600 mb-6' },
            'Load a configuration to manage qualifiers, qualifier types, and resource types.'
          ),
          react_1.default.createElement(
            'div',
            { className: 'bg-blue-50 rounded-lg p-4' },
            react_1.default.createElement(
              'p',
              { className: 'text-sm text-blue-800' },
              react_1.default.createElement('strong', null, 'Configuration Manager:'),
              ' Define and manage system configurations for resource management, including qualifiers, qualifier types, and resource types.'
            )
          )
        )
      )
    );
  }
  return react_1.default.createElement(
    'div',
    { className: 'p-6 '.concat(className) },
    react_1.default.createElement(
      'div',
      { className: 'flex items-center justify-between mb-6' },
      react_1.default.createElement(
        'div',
        { className: 'flex items-center space-x-3' },
        react_1.default.createElement(outline_1.CogIcon, { className: 'h-8 w-8 text-blue-600' }),
        react_1.default.createElement(
          'h2',
          { className: 'text-2xl font-bold text-gray-900' },
          'Configuration'
        ),
        state.hasUnsavedChanges &&
          react_1.default.createElement(
            'span',
            {
              className:
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'
            },
            'Unsaved Changes'
          )
      ),
      react_1.default.createElement(
        'div',
        { className: 'flex items-center space-x-2' },
        react_1.default.createElement(
          'select',
          {
            onChange: function (e) {
              return e.target.value && handleLoadTemplate(e.target.value);
            },
            value: '',
            className:
              'px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
          },
          react_1.default.createElement('option', { value: '' }, 'Load Template...'),
          templates.map(function (template) {
            return react_1.default.createElement(
              'option',
              { key: template.id, value: template.id },
              template.name
            );
          })
        ),
        react_1.default.createElement(
          'button',
          {
            onClick: function () {
              var _a;
              return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click();
            },
            className:
              'inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
          },
          react_1.default.createElement(outline_1.ArrowUpTrayIcon, { className: 'w-4 h-4 mr-2' }),
          'Import'
        ),
        react_1.default.createElement(
          'button',
          {
            onClick: handleExport,
            className:
              'inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
          },
          react_1.default.createElement(outline_1.ArrowDownTrayIcon, { className: 'w-4 h-4 mr-2' }),
          'Export'
        ),
        react_1.default.createElement(
          'button',
          {
            onClick: actions.toggleJsonView,
            className:
              'inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 '.concat(
                state.isJsonView
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              )
          },
          state.isJsonView
            ? react_1.default.createElement(
                react_1.default.Fragment,
                null,
                react_1.default.createElement(outline_1.PencilIcon, { className: 'w-4 h-4 mr-2' }),
                'Form View'
              )
            : react_1.default.createElement(
                react_1.default.Fragment,
                null,
                react_1.default.createElement(outline_1.EyeIcon, { className: 'w-4 h-4 mr-2' }),
                'JSON View'
              )
        ),
        onSave &&
          react_1.default.createElement(
            'button',
            {
              onClick: handleSave,
              disabled: !state.hasUnsavedChanges,
              className:
                'inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium '.concat(
                  state.hasUnsavedChanges
                    ? 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    : 'text-gray-400 bg-gray-200 cursor-not-allowed'
                )
            },
            'Save'
          )
      )
    ),
    !state.validation.isValid &&
      react_1.default.createElement(
        'div',
        { className: 'mb-6 bg-red-50 border border-red-200 rounded-lg p-4' },
        react_1.default.createElement(
          'div',
          { className: 'flex items-center space-x-2 text-red-600 mb-2' },
          react_1.default.createElement(outline_1.ExclamationTriangleIcon, { className: 'w-5 h-5' }),
          react_1.default.createElement('span', { className: 'font-medium' }, 'Configuration Issues')
        ),
        react_1.default.createElement(
          'ul',
          { className: 'text-sm text-red-700 space-y-1' },
          state.validation.errors.map(function (error, index) {
            return react_1.default.createElement('li', { key: index }, '\u2022 ', error);
          })
        )
      ),
    state.validation.warnings.length > 0 &&
      react_1.default.createElement(
        'div',
        { className: 'mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4' },
        react_1.default.createElement(
          'div',
          { className: 'flex items-center space-x-2 text-yellow-600 mb-2' },
          react_1.default.createElement(outline_1.InformationCircleIcon, { className: 'w-5 h-5' }),
          react_1.default.createElement('span', { className: 'font-medium' }, 'Configuration Warnings')
        ),
        react_1.default.createElement(
          'ul',
          { className: 'text-sm text-yellow-700 space-y-1' },
          state.validation.warnings.map(function (warning, index) {
            return react_1.default.createElement('li', { key: index }, '\u2022 ', warning);
          })
        )
      ),
    react_1.default.createElement(
      'div',
      { className: 'bg-white rounded-lg shadow-sm border border-gray-200' },
      state.isJsonView
        ? // JSON Editor View
          react_1.default.createElement(
            'div',
            { className: 'p-6' },
            react_1.default.createElement(
              'div',
              { className: 'flex items-center justify-between mb-4' },
              react_1.default.createElement(
                'h3',
                { className: 'text-lg font-semibold text-gray-900' },
                'JSON Configuration'
              ),
              react_1.default.createElement(
                'button',
                {
                  onClick: function () {
                    var result = actions.applyJsonChanges();
                    if (result.isSuccess()) {
                      onMessage === null || onMessage === void 0
                        ? void 0
                        : onMessage('success', 'JSON changes applied');
                    } else {
                      onMessage === null || onMessage === void 0
                        ? void 0
                        : onMessage('error', 'JSON error: '.concat(result.message));
                    }
                  },
                  disabled: !!state.jsonError,
                  className: 'px-4 py-2 rounded-md text-sm font-medium '.concat(
                    state.jsonError
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  )
                },
                'Apply Changes'
              )
            ),
            state.jsonError &&
              react_1.default.createElement(
                'div',
                { className: 'mb-4 bg-red-50 border border-red-200 rounded-lg p-3' },
                react_1.default.createElement('p', { className: 'text-sm text-red-700' }, state.jsonError)
              ),
            react_1.default.createElement('textarea', {
              value: state.jsonString,
              onChange: function (e) {
                return actions.updateJsonString(e.target.value);
              },
              className:
                'w-full h-96 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
              placeholder: 'Enter JSON configuration...'
            })
          )
        : // Form View
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement(
              'div',
              { className: 'border-b border-gray-200' },
              react_1.default.createElement(
                'nav',
                { className: '-mb-px flex space-x-8 px-6' },
                [
                  {
                    key: 'qualifierTypes',
                    label: 'Qualifier Types',
                    count:
                      ((_b = state.currentConfiguration.qualifierTypes) === null || _b === void 0
                        ? void 0
                        : _b.length) || 0
                  },
                  {
                    key: 'qualifiers',
                    label: 'Qualifiers',
                    count:
                      ((_c = state.currentConfiguration.qualifiers) === null || _c === void 0
                        ? void 0
                        : _c.length) || 0
                  },
                  {
                    key: 'resourceTypes',
                    label: 'Resource Types',
                    count:
                      ((_d = state.currentConfiguration.resourceTypes) === null || _d === void 0
                        ? void 0
                        : _d.length) || 0
                  }
                ].map(function (tab) {
                  return react_1.default.createElement(
                    'button',
                    {
                      key: tab.key,
                      onClick: function () {
                        return actions.setActiveTab(tab.key);
                      },
                      className: 'py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap '.concat(
                        state.activeTab === tab.key
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      )
                    },
                    tab.label,
                    react_1.default.createElement(
                      'span',
                      {
                        className:
                          'ml-2 bg-gray-100 text-gray-900 rounded-full px-2.5 py-0.5 text-xs font-medium'
                      },
                      tab.count
                    )
                  );
                })
              )
            ),
            react_1.default.createElement(
              'div',
              { className: 'p-6' },
              state.activeTab === 'qualifierTypes' &&
                react_1.default.createElement(QualifierTypesPanel, {
                  qualifierTypes: state.currentConfiguration.qualifierTypes || [],
                  onUpdateItem: actions.updateQualifierType,
                  onRemove: actions.removeQualifierType,
                  onShowAdd: function () {
                    return setShowAddQualifierType(true);
                  },
                  onEdit: function (item, index) {
                    return setEditingQualifierType({ item: item, index: index });
                  }
                }),
              state.activeTab === 'qualifiers' &&
                react_1.default.createElement(QualifiersPanel, {
                  qualifiers: state.currentConfiguration.qualifiers || [],
                  qualifierTypes: state.currentConfiguration.qualifierTypes || [],
                  onUpdateItem: actions.updateQualifier,
                  onRemove: actions.removeQualifier,
                  onShowAdd: function () {
                    return setShowAddQualifier(true);
                  },
                  onEdit: function (item, index) {
                    return setEditingQualifier({ item: item, index: index });
                  }
                }),
              state.activeTab === 'resourceTypes' &&
                react_1.default.createElement(ResourceTypesPanel, {
                  resourceTypes: state.currentConfiguration.resourceTypes || [],
                  onUpdateItem: actions.updateResourceType,
                  onRemove: actions.removeResourceType,
                  onShowAdd: function () {
                    return setShowAddResourceType(true);
                  },
                  onEdit: function (item, index) {
                    return setEditingResourceType({ item: item, index: index });
                  }
                })
            )
          )
    ),
    react_1.default.createElement('input', {
      ref: fileInputRef,
      type: 'file',
      accept: '.json',
      onChange: function (e) {
        return handleFileImport(e.target.files);
      },
      className: 'hidden'
    }),
    showAddQualifierType &&
      react_1.default.createElement(QualifierTypeEditForm_1.QualifierTypeEditForm, {
        onSave: function (qualifierType) {
          actions.addQualifierType(qualifierType);
          setShowAddQualifierType(false);
          onMessage === null || onMessage === void 0
            ? void 0
            : onMessage('success', 'Added qualifier type: '.concat(qualifierType.name));
        },
        onCancel: function () {
          return setShowAddQualifierType(false);
        },
        existingNames: (state.currentConfiguration.qualifierTypes || []).map(function (qt) {
          return qt.name;
        })
      }),
    editingQualifierType &&
      react_1.default.createElement(QualifierTypeEditForm_1.QualifierTypeEditForm, {
        qualifierType: editingQualifierType.item,
        onSave: function (qualifierType) {
          actions.updateQualifierType(editingQualifierType.index, qualifierType);
          setEditingQualifierType(null);
          onMessage === null || onMessage === void 0
            ? void 0
            : onMessage('success', 'Updated qualifier type: '.concat(qualifierType.name));
        },
        onCancel: function () {
          return setEditingQualifierType(null);
        },
        existingNames: (state.currentConfiguration.qualifierTypes || [])
          .filter(function (_, i) {
            return i !== editingQualifierType.index;
          })
          .map(function (qt) {
            return qt.name;
          })
      }),
    showAddQualifier &&
      react_1.default.createElement(QualifierEditForm_1.QualifierEditForm, {
        qualifierTypes: state.currentConfiguration.qualifierTypes || [],
        onSave: function (qualifier) {
          actions.addQualifier(qualifier);
          setShowAddQualifier(false);
          onMessage === null || onMessage === void 0
            ? void 0
            : onMessage('success', 'Added qualifier: '.concat(qualifier.name));
        },
        onCancel: function () {
          return setShowAddQualifier(false);
        },
        existingNames: (state.currentConfiguration.qualifiers || []).map(function (q) {
          return q.name;
        })
      }),
    editingQualifier &&
      react_1.default.createElement(QualifierEditForm_1.QualifierEditForm, {
        qualifier: editingQualifier.item,
        qualifierTypes: state.currentConfiguration.qualifierTypes || [],
        onSave: function (qualifier) {
          actions.updateQualifier(editingQualifier.index, qualifier);
          setEditingQualifier(null);
          onMessage === null || onMessage === void 0
            ? void 0
            : onMessage('success', 'Updated qualifier: '.concat(qualifier.name));
        },
        onCancel: function () {
          return setEditingQualifier(null);
        },
        existingNames: (state.currentConfiguration.qualifiers || [])
          .filter(function (_, i) {
            return i !== editingQualifier.index;
          })
          .map(function (q) {
            return q.name;
          })
      }),
    showAddResourceType &&
      react_1.default.createElement(ResourceTypeEditForm_1.ResourceTypeEditForm, {
        onSave: function (resourceType) {
          actions.addResourceType(resourceType);
          setShowAddResourceType(false);
          onMessage === null || onMessage === void 0
            ? void 0
            : onMessage('success', 'Added resource type: '.concat(resourceType.name));
        },
        onCancel: function () {
          return setShowAddResourceType(false);
        },
        existingNames: (state.currentConfiguration.resourceTypes || []).map(function (rt) {
          return rt.name;
        })
      }),
    editingResourceType &&
      react_1.default.createElement(ResourceTypeEditForm_1.ResourceTypeEditForm, {
        resourceType: editingResourceType.item,
        onSave: function (resourceType) {
          actions.updateResourceType(editingResourceType.index, resourceType);
          setEditingResourceType(null);
          onMessage === null || onMessage === void 0
            ? void 0
            : onMessage('success', 'Updated resource type: '.concat(resourceType.name));
        },
        onCancel: function () {
          return setEditingResourceType(null);
        },
        existingNames: (state.currentConfiguration.resourceTypes || [])
          .filter(function (_, i) {
            return i !== editingResourceType.index;
          })
          .map(function (rt) {
            return rt.name;
          })
      })
  );
};
exports.ConfigurationView = ConfigurationView;
var QualifierTypesPanel = function (_a) {
  var qualifierTypes = _a.qualifierTypes,
    onRemove = _a.onRemove,
    onShowAdd = _a.onShowAdd,
    onEdit = _a.onEdit;
  var getConfigurationSummary = function (type) {
    var _a, _b;
    if (!type.configuration) return 'No configuration';
    var config = type.configuration;
    var details = [];
    if (config.allowContextList) details.push('Context List');
    if (type.systemType === 'literal') {
      if (config.caseSensitive === false) details.push('Case Insensitive');
      if ((_a = config.enumeratedValues) === null || _a === void 0 ? void 0 : _a.length)
        details.push(''.concat(config.enumeratedValues.length, ' values'));
    }
    if (type.systemType === 'territory') {
      if (config.acceptLowercase) details.push('Accept Lowercase');
      if ((_b = config.allowedTerritories) === null || _b === void 0 ? void 0 : _b.length)
        details.push(''.concat(config.allowedTerritories.length, ' territories'));
    }
    return details.length > 0 ? details.join(', ') : 'Default settings';
  };
  return react_1.default.createElement(
    'div',
    null,
    react_1.default.createElement(
      'div',
      { className: 'flex items-center justify-between mb-4' },
      react_1.default.createElement(
        'h3',
        { className: 'text-lg font-semibold text-gray-900' },
        'Qualifier Types'
      ),
      react_1.default.createElement(
        'button',
        {
          onClick: onShowAdd,
          className:
            'inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700'
        },
        react_1.default.createElement(outline_1.PlusIcon, { className: 'w-4 h-4 mr-2' }),
        'Add Type'
      )
    ),
    qualifierTypes.length === 0
      ? react_1.default.createElement(
          'div',
          { className: 'text-center py-8 text-gray-500' },
          react_1.default.createElement(outline_1.CogIcon, {
            className: 'w-12 h-12 mx-auto mb-4 text-gray-400'
          }),
          react_1.default.createElement('p', null, 'No qualifier types defined'),
          react_1.default.createElement('p', { className: 'text-sm' }, 'Add a qualifier type to get started')
        )
      : react_1.default.createElement(
          'div',
          { className: 'space-y-3' },
          qualifierTypes.map(function (type, index) {
            return react_1.default.createElement(
              'div',
              {
                key: index,
                className:
                  'bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors'
              },
              react_1.default.createElement(
                'div',
                { className: 'flex items-start justify-between' },
                react_1.default.createElement(
                  'div',
                  { className: 'flex-1' },
                  react_1.default.createElement(
                    'div',
                    { className: 'flex items-center space-x-2 mb-2' },
                    react_1.default.createElement(
                      'h4',
                      { className: 'font-medium text-gray-900' },
                      type.name
                    ),
                    react_1.default.createElement(
                      'span',
                      {
                        className: 'px-2 py-1 text-xs font-medium rounded-full '.concat(
                          type.systemType === 'language'
                            ? 'bg-blue-100 text-blue-800'
                            : type.systemType === 'territory'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        )
                      },
                      type.systemType
                    )
                  ),
                  react_1.default.createElement(
                    'p',
                    { className: 'text-sm text-gray-600 mb-2' },
                    getConfigurationSummary(type)
                  )
                ),
                react_1.default.createElement(
                  'div',
                  { className: 'flex items-center space-x-2 ml-4' },
                  react_1.default.createElement(
                    'button',
                    {
                      onClick: function () {
                        return onEdit(type, index);
                      },
                      className: 'p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded',
                      title: 'Edit qualifier type'
                    },
                    react_1.default.createElement(outline_1.PencilIcon, { className: 'w-4 h-4' })
                  ),
                  react_1.default.createElement(
                    'button',
                    {
                      onClick: function () {
                        return onRemove(index);
                      },
                      className: 'p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded',
                      title: 'Delete qualifier type'
                    },
                    react_1.default.createElement(outline_1.TrashIcon, { className: 'w-4 h-4' })
                  )
                )
              )
            );
          })
        )
  );
};
var QualifiersPanel = function (_a) {
  var qualifiers = _a.qualifiers,
    qualifierTypes = _a.qualifierTypes,
    onRemove = _a.onRemove,
    onShowAdd = _a.onShowAdd,
    onEdit = _a.onEdit;
  // Sort qualifiers by priority (highest first)
  var sortedQualifiers = tslib_1.__spreadArray([], qualifiers, true).sort(function (a, b) {
    return b.defaultPriority - a.defaultPriority;
  });
  var getQualifierSummary = function (qualifier) {
    var qualifierType = qualifierTypes.find(function (qt) {
      return qt.name === qualifier.typeName;
    });
    var details = [];
    if (qualifier.token) details.push('Token: '.concat(qualifier.token));
    if (qualifier.defaultValue) details.push('Default: '.concat(qualifier.defaultValue));
    if (qualifier.tokenIsOptional) details.push('Optional Token');
    if (qualifierType) details.push('System: '.concat(qualifierType.systemType));
    return details.join(' • ');
  };
  return react_1.default.createElement(
    'div',
    null,
    react_1.default.createElement(
      'div',
      { className: 'flex items-center justify-between mb-4' },
      react_1.default.createElement('h3', { className: 'text-lg font-semibold text-gray-900' }, 'Qualifiers'),
      react_1.default.createElement(
        'button',
        {
          onClick: onShowAdd,
          disabled: qualifierTypes.length === 0,
          className:
            'inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed',
          title: qualifierTypes.length === 0 ? 'Add qualifier types first' : 'Add qualifier'
        },
        react_1.default.createElement(outline_1.PlusIcon, { className: 'w-4 h-4 mr-2' }),
        'Add Qualifier'
      )
    ),
    qualifierTypes.length === 0
      ? react_1.default.createElement(
          'div',
          { className: 'text-center py-8 text-gray-500' },
          react_1.default.createElement(outline_1.ExclamationTriangleIcon, {
            className: 'w-12 h-12 mx-auto mb-4 text-amber-400'
          }),
          react_1.default.createElement('p', null, 'No qualifier types available'),
          react_1.default.createElement(
            'p',
            { className: 'text-sm' },
            'Create qualifier types first before adding qualifiers'
          )
        )
      : qualifiers.length === 0
      ? react_1.default.createElement(
          'div',
          { className: 'text-center py-8 text-gray-500' },
          react_1.default.createElement(outline_1.CogIcon, {
            className: 'w-12 h-12 mx-auto mb-4 text-gray-400'
          }),
          react_1.default.createElement('p', null, 'No qualifiers defined'),
          react_1.default.createElement('p', { className: 'text-sm' }, 'Add a qualifier to get started')
        )
      : react_1.default.createElement(
          'div',
          { className: 'space-y-3' },
          sortedQualifiers.map(function (qualifier, index) {
            var originalIndex = qualifiers.findIndex(function (q) {
              return q === qualifier;
            });
            var qualifierType = qualifierTypes.find(function (qt) {
              return qt.name === qualifier.typeName;
            });
            return react_1.default.createElement(
              'div',
              {
                key: originalIndex,
                className:
                  'bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors'
              },
              react_1.default.createElement(
                'div',
                { className: 'flex items-start justify-between' },
                react_1.default.createElement(
                  'div',
                  { className: 'flex-1' },
                  react_1.default.createElement(
                    'div',
                    { className: 'flex items-center space-x-2 mb-2' },
                    react_1.default.createElement(
                      'h4',
                      { className: 'font-medium text-gray-900' },
                      qualifier.name
                    ),
                    react_1.default.createElement(
                      'span',
                      { className: 'px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full' },
                      'Priority: ',
                      qualifier.defaultPriority
                    ),
                    !qualifierType &&
                      react_1.default.createElement(
                        'span',
                        { className: 'px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full' },
                        'Missing Type'
                      )
                  ),
                  react_1.default.createElement(
                    'p',
                    { className: 'text-sm text-gray-600 mb-1' },
                    'Type: ',
                    react_1.default.createElement('span', { className: 'font-medium' }, qualifier.typeName)
                  ),
                  react_1.default.createElement(
                    'p',
                    { className: 'text-sm text-gray-500' },
                    getQualifierSummary(qualifier)
                  )
                ),
                react_1.default.createElement(
                  'div',
                  { className: 'flex items-center space-x-2 ml-4' },
                  react_1.default.createElement(
                    'button',
                    {
                      onClick: function () {
                        return onEdit(qualifier, originalIndex);
                      },
                      className: 'p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded',
                      title: 'Edit qualifier'
                    },
                    react_1.default.createElement(outline_1.PencilIcon, { className: 'w-4 h-4' })
                  ),
                  react_1.default.createElement(
                    'button',
                    {
                      onClick: function () {
                        return onRemove(originalIndex);
                      },
                      className: 'p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded',
                      title: 'Delete qualifier'
                    },
                    react_1.default.createElement(outline_1.TrashIcon, { className: 'w-4 h-4' })
                  )
                )
              )
            );
          })
        )
  );
};
var ResourceTypesPanel = function (_a) {
  var resourceTypes = _a.resourceTypes,
    onRemove = _a.onRemove,
    onShowAdd = _a.onShowAdd,
    onEdit = _a.onEdit;
  var getTypeNameBadgeColor = function (typeName) {
    switch (typeName) {
      case 'string':
        return 'bg-blue-100 text-blue-800';
      case 'object':
        return 'bg-green-100 text-green-800';
      case 'array':
        return 'bg-purple-100 text-purple-800';
      case 'number':
        return 'bg-yellow-100 text-yellow-800';
      case 'boolean':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  return react_1.default.createElement(
    'div',
    null,
    react_1.default.createElement(
      'div',
      { className: 'flex items-center justify-between mb-4' },
      react_1.default.createElement(
        'h3',
        { className: 'text-lg font-semibold text-gray-900' },
        'Resource Types'
      ),
      react_1.default.createElement(
        'button',
        {
          onClick: onShowAdd,
          className:
            'inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700'
        },
        react_1.default.createElement(outline_1.PlusIcon, { className: 'w-4 h-4 mr-2' }),
        'Add Type'
      )
    ),
    resourceTypes.length === 0
      ? react_1.default.createElement(
          'div',
          { className: 'text-center py-8 text-gray-500' },
          react_1.default.createElement(outline_1.CogIcon, {
            className: 'w-12 h-12 mx-auto mb-4 text-gray-400'
          }),
          react_1.default.createElement('p', null, 'No resource types defined'),
          react_1.default.createElement('p', { className: 'text-sm' }, 'Add a resource type to get started')
        )
      : react_1.default.createElement(
          'div',
          { className: 'space-y-3' },
          resourceTypes.map(function (type, index) {
            return react_1.default.createElement(
              'div',
              {
                key: index,
                className:
                  'bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors'
              },
              react_1.default.createElement(
                'div',
                { className: 'flex items-start justify-between' },
                react_1.default.createElement(
                  'div',
                  { className: 'flex-1' },
                  react_1.default.createElement(
                    'div',
                    { className: 'flex items-center space-x-2 mb-2' },
                    react_1.default.createElement(
                      'h4',
                      { className: 'font-medium text-gray-900' },
                      type.name
                    ),
                    react_1.default.createElement(
                      'span',
                      {
                        className: 'px-2 py-1 text-xs font-medium rounded-full '.concat(
                          getTypeNameBadgeColor(type.typeName)
                        )
                      },
                      type.typeName
                    )
                  ),
                  react_1.default.createElement(
                    'p',
                    { className: 'text-sm text-gray-600' },
                    'Defines how resources of this type are processed and validated'
                  )
                ),
                react_1.default.createElement(
                  'div',
                  { className: 'flex items-center space-x-2 ml-4' },
                  react_1.default.createElement(
                    'button',
                    {
                      onClick: function () {
                        return onEdit(type, index);
                      },
                      className: 'p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded',
                      title: 'Edit resource type'
                    },
                    react_1.default.createElement(outline_1.PencilIcon, { className: 'w-4 h-4' })
                  ),
                  react_1.default.createElement(
                    'button',
                    {
                      onClick: function () {
                        return onRemove(index);
                      },
                      className: 'p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded',
                      title: 'Delete resource type'
                    },
                    react_1.default.createElement(outline_1.TrashIcon, { className: 'w-4 h-4' })
                  )
                )
              )
            );
          })
        )
  );
};
exports.default = exports.ConfigurationView;
//# sourceMappingURL=index.js.map
