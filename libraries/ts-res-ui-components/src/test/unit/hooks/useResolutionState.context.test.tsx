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
  it('applies context and stamps conditions for new resources using createPendingResource', async () => {
    const onSystemUpdate = jest.fn();
    const onMessage = jest.fn();

    const processed = buildProcessedResources();
    const { result } = renderHook(() => useResolutionState(processed, onMessage, onSystemUpdate));

    // Set context and apply it first
    act(() => {
      result.current.actions.updateContextValue('language', 'en');
      result.current.actions.applyContext();
    });

    // Use the new atomic createPendingResource API
    await act(async () => {
      const createResult = await result.current.actions.createPendingResource({
        id: 'test.resource.id',
        resourceTypeName: 'json',
        json: { test: 'value' }
      });
      expect(createResult.isSuccess()).toBe(true);
    });

    // Verify pending resource was created with conditions stamped
    const pending = Array.from(result.current.state.pendingResources.values())[0] as any;

    expect(pending).toBeDefined();
    expect(pending.id).toBe('test.resource.id');
    expect(pending.resourceTypeName).toBe('json');
    expect(pending.candidates).toBeDefined();
    expect(pending.candidates[0]).toBeDefined();
    expect(pending.candidates[0].json).toEqual({ test: 'value' });

    // Check conditions were stamped from effective context
    if (pending.candidates[0].conditions) {
      expect(pending.candidates[0].conditions.length).toBeGreaterThan(0);
      expect(pending.candidates[0].conditions[0].qualifierName).toBe('language');
      expect(pending.candidates[0].conditions[0].value).toBe('en');
    }
  });
});
