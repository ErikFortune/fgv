/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

export * from './bindingMerger';
// Named, not wildcard: `computeCacheStabilityAnalysis` / `deriveCacheBreakpointOffsets` /
// `ICacheStabilityAnalysisResult` are `@internal` — plumbing shared between `promptLibrary.ts` and
// `toCacheRequest.ts` within this packlet, imported by them directly rather than through this
// barrel. Re-exporting them here would surface them on the package's public entry point despite
// the `@internal` tag (API Extractor's `ae-internal-missing-underscore` catches exactly this).
export {
  type IPromptCacheStabilityAnalysisParams,
  analyzePromptCacheStability
} from './cacheStabilityAnalysis';
export * from './candidateSelector';
export * from './chainWalker';
export * from './mustacheCache';
export * from './promptLibrary';
export * from './toCacheRequest';
// resourceBindingResolver intentionally not re-exported: its helpers
// (buildCycleKey, formatCycleError, IInnerResolveRequest, InnerResolveFn,
// IResourceBindingStackFrame, IResourceBindingResolveResult,
// resolvePendingResourceBindings) are PromptLibrary-internal plumbing —
// no consumer outside the resolve packlet should hold the cycle-detection
// stack shape or the inner-resolve callback contract.
