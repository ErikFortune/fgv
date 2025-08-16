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

// Export utility functions
export {
  createResolverWithContext,
  evaluateConditionsForCandidate,
  resolveResourceDetailed,
  getAvailableQualifiers,
  hasPendingContextChanges,
  type ResolutionOptions
} from '../utils/resolutionUtils';
