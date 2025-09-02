'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const react_1 = require('@testing-library/react');
const useResolutionState_1 = require('../../../hooks/useResolutionState');
const ts_res_1 = require('@fgv/ts-res');
const tsResIntegration_1 = require('../../../utils/tsResIntegration');
function buildProcessedResources() {
  const system = (0, tsResIntegration_1.createTsResSystemFromConfig)().orThrow();
  const compiledCollection = system.resourceManager
    .getCompiledResourceCollection({ includeMetadata: true })
    .orThrow();
  const resolver = ts_res_1.Runtime.ResourceResolver.create({
    resourceManager: system.resourceManager,
    qualifierTypes: system.qualifierTypes,
    contextQualifierProvider: system.contextQualifierProvider
  }).orThrow();
  const resourceIds = Array.from(system.resourceManager.resources.keys());
  return {
    system,
    compiledCollection,
    resolver,
    summary: { totalResources: resourceIds.length, resourceIds, errorCount: 0, warnings: [] }
  };
}
describe('useResolutionState basic', () => {
  it('applies context and stamps conditions for new resources', async () => {
    const onSystemUpdate = jest.fn();
    const onMessage = jest.fn();
    const processed = buildProcessedResources();
    const { result } = (0, react_1.renderHook)(() =>
      (0, useResolutionState_1.useResolutionState)(processed, onMessage, onSystemUpdate)
    );
    // set context pending value and apply so effectiveContext includes it
    (0, react_1.act)(() => {
      result.current.actions.updateContextValue('language', 'en');
    });
    // start new resource
    (0, react_1.act)(() => {
      result.current.actions.startNewResource({ defaultTypeName: 'json' });
    });
    const draft = result.current.state.newResourceDraft;
    expect(draft).toBeTruthy();
    // Apply context so effectiveContext has language=en
    (0, react_1.act)(() => {
      result.current.actions.applyContext();
    });
    // Set a proper resource ID (no longer allow temporary IDs to be saved)
    (0, react_1.act)(() => {
      result.current.actions.updateNewResourceId('platform.test.testResource');
    });
    // Save to pending
    (0, react_1.act)(() => {
      result.current.actions.saveNewResourceAsPending();
    });
    // Ensure a candidate exists and gets stamped by editing the pending resource
    (0, react_1.act)(() => {
      result.current.actions.saveEdit('platform.test.testResource', {});
    });
    // Verify pending resource has conditions stamped
    const pending = Array.from(result.current.state.pendingResources.values())[0];
    expect(pending?.candidates?.[0]?.conditions?.[0]?.qualifierName).toBe('language');
    expect(pending?.candidates?.[0]?.conditions?.[0]?.value).toBe('en');
  });
});
//# sourceMappingURL=useResolutionState.context.test.js.map
