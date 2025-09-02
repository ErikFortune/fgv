import { renderHook, act } from '@testing-library/react';
import { useResolutionState } from '../../../hooks/useResolutionState';
import { Runtime } from '@fgv/ts-res';
import { createTsResSystemFromConfig } from '../../../utils/tsResIntegration';

function buildProcessedResources() {
  const system = createTsResSystemFromConfig().orThrow();
  const compiledCollection = system.resourceManager
    .getCompiledResourceCollection({ includeMetadata: true })
    .orThrow();
  const resolver = Runtime.ResourceResolver.create({
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
  } as any;
}

describe('useResolutionState basic', () => {
  it('applies context and stamps conditions for new resources', async () => {
    const onSystemUpdate = jest.fn();
    const onMessage = jest.fn();

    const processed = buildProcessedResources();
    const { result } = renderHook(() => useResolutionState(processed, onMessage, onSystemUpdate));

    // set context pending value and apply so effectiveContext includes it
    act(() => {
      result.current.actions.updateContextValue('language', 'en');
    });

    // start new resource
    act(() => {
      result.current.actions.startNewResource({ defaultTypeName: 'json' });
    });

    const draft = result.current.state.newResourceDraft!;
    expect(draft).toBeTruthy();

    // Apply context so effectiveContext has language=en
    act(() => {
      result.current.actions.applyContext();
    });

    // Set a proper resource ID (no longer allow temporary IDs to be saved)
    act(() => {
      result.current.actions.updateNewResourceId('platform.test.testResource');
    });

    // Save to pending
    act(() => {
      result.current.actions.saveNewResourceAsPending();
    });

    // Ensure a candidate exists and gets stamped by editing the pending resource
    act(() => {
      result.current.actions.saveEdit('platform.test.testResource', {} as any);
    });

    // Verify pending resource has conditions stamped
    const pending = Array.from(result.current.state.pendingResources.values())[0] as any;
    expect(pending?.candidates?.[0]?.conditions?.[0]?.qualifierName).toBe('language');
    expect(pending?.candidates?.[0]?.conditions?.[0]?.value).toBe('en');
  });
});
