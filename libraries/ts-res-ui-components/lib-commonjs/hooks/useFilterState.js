'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.useFilterState = useFilterState;
var tslib_1 = require('tslib');
var react_1 = require('react');
var initialFilterState = {
  enabled: false,
  values: {},
  appliedValues: {},
  hasPendingChanges: false,
  reduceQualifiers: false
};
function useFilterState(initialState) {
  var _a = (0, react_1.useState)(tslib_1.__assign(tslib_1.__assign({}, initialFilterState), initialState)),
    state = _a[0],
    setState = _a[1];
  var updateFilterEnabled = (0, react_1.useCallback)(function (enabled) {
    setState(function (prev) {
      return tslib_1.__assign(tslib_1.__assign({}, prev), {
        enabled: enabled,
        hasPendingChanges: enabled !== prev.enabled
      });
    });
  }, []);
  var updateFilterValues = (0, react_1.useCallback)(function (values) {
    setState(function (prev) {
      var hasChanges = JSON.stringify(values) !== JSON.stringify(prev.appliedValues);
      return tslib_1.__assign(tslib_1.__assign({}, prev), { values: values, hasPendingChanges: hasChanges });
    });
  }, []);
  var applyFilterValues = (0, react_1.useCallback)(function () {
    setState(function (prev) {
      return tslib_1.__assign(tslib_1.__assign({}, prev), {
        appliedValues: tslib_1.__assign({}, prev.values),
        hasPendingChanges: false
      });
    });
  }, []);
  var resetFilterValues = (0, react_1.useCallback)(function () {
    setState(function (prev) {
      return tslib_1.__assign(tslib_1.__assign({}, prev), {
        values: {},
        appliedValues: {},
        hasPendingChanges: false,
        enabled: false
      });
    });
  }, []);
  var updateReduceQualifiers = (0, react_1.useCallback)(function (reduceQualifiers) {
    setState(function (prev) {
      return tslib_1.__assign(tslib_1.__assign({}, prev), { reduceQualifiers: reduceQualifiers });
    });
  }, []);
  var actions = {
    updateFilterEnabled: updateFilterEnabled,
    updateFilterValues: updateFilterValues,
    applyFilterValues: applyFilterValues,
    resetFilterValues: resetFilterValues,
    updateReduceQualifiers: updateReduceQualifiers
  };
  return { state: state, actions: actions };
}
//# sourceMappingURL=useFilterState.js.map
