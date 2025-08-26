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

// Export the main ResolutionView component
export { ResolutionView } from '../components/views/ResolutionView';

// Export resolution-related sub-components
export { EditableJsonView } from '../components/views/ResolutionView/EditableJsonView';
export { UnifiedChangeControls } from '../components/views/ResolutionView/UnifiedChangeControls';
export { QualifierContextControl } from '../components/common/QualifierContextControl';
export { ResolutionContextOptionsControl } from '../components/common/ResolutionContextOptionsControl';

// Export domain-specific hook
export { useResolutionState } from '../hooks/useResolutionState';

// Export utility functions
export {
  createResolverWithContext,
  evaluateConditionsForCandidate,
  resolveResourceDetailed,
  getAvailableQualifiers,
  hasPendingContextChanges,
  type ResolutionOptions
} from '../utils/resolutionUtils';

// Export resource selector utility functions for pending resource management
export {
  getPendingAdditionsByType,
  isPendingAddition,
  deriveLeafId,
  deriveFullId,
  getPendingResourceTypes,
  getPendingResourceStats,
  validatePendingResourceKeys
} from '../utils/resourceSelectors';

// Export types related to resource resolution
export type {
  ResolutionState,
  ResolutionActions,
  ResolutionViewProps,
  ResolutionResult,
  CandidateInfo,
  ConditionEvaluationResult,
  EditedResourceInfo,
  ResolutionContextOptions,
  QualifierControlOptions
} from '../types';

// Export types for resolution components
export type { EditableJsonViewProps } from '../components/views/ResolutionView/EditableJsonView';
export type { ResolutionContextOptionsControlProps } from '../components/common/ResolutionContextOptionsControl';
