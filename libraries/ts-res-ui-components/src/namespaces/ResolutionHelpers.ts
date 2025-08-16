/**
 * Helper functions and utilities for resource resolution operations.
 *
 * This namespace contains functions for creating resolvers, evaluating conditions,
 * and managing resolution context for resource resolution testing and analysis.
 *
 * @example
 * ```tsx
 * import { ResolutionHelpers } from '@fgv/ts-res-ui-components';
 *
 * // Create resolver with context
 * const resolver = ResolutionHelpers.createResolverWithContext(
 *   processedResources,
 *   { language: 'en-US', platform: 'web' }
 * );
 *
 * // Resolve resource with detailed results
 * const result = ResolutionHelpers.resolveResourceDetailed(
 *   resolver,
 *   'user.welcome',
 *   processedResources
 * );
 * ```
 *
 * @public
 */

export {
  createResolverWithContext,
  evaluateConditionsForCandidate,
  resolveResourceDetailed,
  getAvailableQualifiers,
  hasPendingContextChanges,
  type ResolutionOptions
} from '../utils/resolutionUtils';
