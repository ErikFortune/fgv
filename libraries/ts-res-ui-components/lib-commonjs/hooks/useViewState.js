'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.useViewState = useViewState;
var tslib_1 = require('tslib');
var react_1 = require('react');
function useViewState() {
  var _a = (0, react_1.useState)([]),
    messages = _a[0],
    setMessages = _a[1];
  var _b = (0, react_1.useState)(null),
    selectedResourceId = _b[0],
    setSelectedResourceId = _b[1];
  var addMessage = (0, react_1.useCallback)(function (type, message) {
    var newMessage = {
      id: 'msg-'.concat(Date.now(), '-').concat(Math.random()),
      type: type,
      message: message,
      timestamp: new Date()
    };
    setMessages(function (prev) {
      return tslib_1.__spreadArray(tslib_1.__spreadArray([], prev, true), [newMessage], false);
    });
    // Auto-clear info messages after 5 seconds
    if (type === 'info') {
      setTimeout(function () {
        setMessages(function (prev) {
          return prev.filter(function (m) {
            return m.id !== newMessage.id;
          });
        });
      }, 5000);
    }
  }, []);
  var clearMessages = (0, react_1.useCallback)(function () {
    setMessages([]);
  }, []);
  var selectResource = (0, react_1.useCallback)(function (resourceId) {
    setSelectedResourceId(resourceId);
  }, []);
  return {
    messages: messages,
    selectedResourceId: selectedResourceId,
    addMessage: addMessage,
    clearMessages: clearMessages,
    selectResource: selectResource
  };
}
//# sourceMappingURL=useViewState.js.map
