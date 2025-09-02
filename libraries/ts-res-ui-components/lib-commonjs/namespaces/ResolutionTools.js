'use strict';
/**
 * Tools and components for resource resolution operations.
 *
 * This namespace contains the ResolutionView component and utility functions for
 * creating resolvers, evaluating conditions, and managing resolution context for
 * resource resolution testing and analysis.
 *
 * @example
 * ```tsx
 * import { ResolutionTools } from '@fgv/ts-res-ui-components';
 *
 * // Use the ResolutionView component
 * <ResolutionTools.ResolutionView
 *   resources={processedResources}
 *   resolutionState={resolutionState}
 *   resolutionActions={resolutionActions}
 *   editorFactory={customEditorFactory}
 *   onMessage={onMessage}
 * />
 *
 * // Or use utility functions
 * const resolver = ResolutionTools.createResolverWithContext(
 *   processedResources,
 *   { language: 'en-US', platform: 'web' }
 * );
 * ```
 *
 * @public
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.validatePendingResourceKeys =
  exports.getPendingResourceStats =
  exports.getPendingResourceTypes =
  exports.deriveFullId =
  exports.deriveLeafId =
  exports.isPendingAddition =
  exports.getPendingAdditionsByType =
  exports.hasPendingContextChanges =
  exports.getAvailableQualifiers =
  exports.resolveResourceDetailed =
  exports.evaluateConditionsForCandidate =
  exports.createResolverWithContext =
  exports.useResolutionState =
  exports.ResolutionContextOptionsControl =
  exports.QualifierContextControl =
  exports.UnifiedChangeControls =
  exports.EditableJsonView =
  exports.ResolutionView =
    void 0;
// Export the main ResolutionView component
var ResolutionView_1 = require('../components/views/ResolutionView');
Object.defineProperty(exports, 'ResolutionView', {
  enumerable: true,
  get: function () {
    return ResolutionView_1.ResolutionView;
  }
});
// Export resolution-related sub-components
var EditableJsonView_1 = require('../components/views/ResolutionView/EditableJsonView');
Object.defineProperty(exports, 'EditableJsonView', {
  enumerable: true,
  get: function () {
    return EditableJsonView_1.EditableJsonView;
  }
});
var UnifiedChangeControls_1 = require('../components/views/ResolutionView/UnifiedChangeControls');
Object.defineProperty(exports, 'UnifiedChangeControls', {
  enumerable: true,
  get: function () {
    return UnifiedChangeControls_1.UnifiedChangeControls;
  }
});
var QualifierContextControl_1 = require('../components/common/QualifierContextControl');
Object.defineProperty(exports, 'QualifierContextControl', {
  enumerable: true,
  get: function () {
    return QualifierContextControl_1.QualifierContextControl;
  }
});
var ResolutionContextOptionsControl_1 = require('../components/common/ResolutionContextOptionsControl');
Object.defineProperty(exports, 'ResolutionContextOptionsControl', {
  enumerable: true,
  get: function () {
    return ResolutionContextOptionsControl_1.ResolutionContextOptionsControl;
  }
});
// Export domain-specific hook
var useResolutionState_1 = require('../hooks/useResolutionState');
Object.defineProperty(exports, 'useResolutionState', {
  enumerable: true,
  get: function () {
    return useResolutionState_1.useResolutionState;
  }
});
// Export utility functions
var resolutionUtils_1 = require('../utils/resolutionUtils');
Object.defineProperty(exports, 'createResolverWithContext', {
  enumerable: true,
  get: function () {
    return resolutionUtils_1.createResolverWithContext;
  }
});
Object.defineProperty(exports, 'evaluateConditionsForCandidate', {
  enumerable: true,
  get: function () {
    return resolutionUtils_1.evaluateConditionsForCandidate;
  }
});
Object.defineProperty(exports, 'resolveResourceDetailed', {
  enumerable: true,
  get: function () {
    return resolutionUtils_1.resolveResourceDetailed;
  }
});
Object.defineProperty(exports, 'getAvailableQualifiers', {
  enumerable: true,
  get: function () {
    return resolutionUtils_1.getAvailableQualifiers;
  }
});
Object.defineProperty(exports, 'hasPendingContextChanges', {
  enumerable: true,
  get: function () {
    return resolutionUtils_1.hasPendingContextChanges;
  }
});
// Export resource selector utility functions for pending resource management
var resourceSelectors_1 = require('../utils/resourceSelectors');
Object.defineProperty(exports, 'getPendingAdditionsByType', {
  enumerable: true,
  get: function () {
    return resourceSelectors_1.getPendingAdditionsByType;
  }
});
Object.defineProperty(exports, 'isPendingAddition', {
  enumerable: true,
  get: function () {
    return resourceSelectors_1.isPendingAddition;
  }
});
Object.defineProperty(exports, 'deriveLeafId', {
  enumerable: true,
  get: function () {
    return resourceSelectors_1.deriveLeafId;
  }
});
Object.defineProperty(exports, 'deriveFullId', {
  enumerable: true,
  get: function () {
    return resourceSelectors_1.deriveFullId;
  }
});
Object.defineProperty(exports, 'getPendingResourceTypes', {
  enumerable: true,
  get: function () {
    return resourceSelectors_1.getPendingResourceTypes;
  }
});
Object.defineProperty(exports, 'getPendingResourceStats', {
  enumerable: true,
  get: function () {
    return resourceSelectors_1.getPendingResourceStats;
  }
});
Object.defineProperty(exports, 'validatePendingResourceKeys', {
  enumerable: true,
  get: function () {
    return resourceSelectors_1.validatePendingResourceKeys;
  }
});
//# sourceMappingURL=ResolutionTools.js.map
