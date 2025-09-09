/*
 * Minimal reproduction tests for validation behavior
 */

import '@fgv/ts-utils-jest';
import { Validate, Runtime } from '@fgv/ts-res';
import { renderHook, act } from '@testing-library/react';
import { useResolutionState } from '../../../hooks/useResolutionState';
import { createTsResSystemFromConfig } from '../../../utils/tsResIntegration';
import type { IProcessedResources } from '../../../types';

function buildProcessedResources(): IProcessedResources {
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
    resourceCount: resourceIds.length,
    summary: { totalResources: resourceIds.length, resourceIds, errorCount: 0, warnings: [] }
  } as unknown as IProcessedResources;
}

describe('Validation Behavior Investigation', () => {
  describe('Resource ID Validation', () => {
    test('Validate.isValidResourceId behavior with edge cases', () => {
      // Test the actual ts-res validation function directly
      expect(Validate.isValidResourceId('')).toBe(false); // Empty should fail
      expect(Validate.isValidResourceId('invalid format with spaces')).toBe(false); // Spaces should fail
      expect(Validate.isValidResourceId('invalid-format')).toBe(true); // Hyphens should pass
      expect(Validate.isValidResourceId('platform.test.resource')).toBe(true); // Dots should pass
      expect(Validate.isValidResourceId('123invalid')).toBe(false); // Can't start with number
      expect(Validate.isValidResourceId('_validStart')).toBe(true); // Can start with underscore
      expect(Validate.isValidResourceId('valid_with-hyphens.and.dots')).toBe(true); // Complex valid format
    });
  });

  describe('Context Conditions Investigation', () => {
    test('Debug context application in resource creation workflow', async () => {
      const processed = buildProcessedResources();
      const mockOnMessage = jest.fn();
      const mockOnSystemUpdate = jest.fn();

      // Log available qualifiers
      console.log('Available qualifiers:', Array.from(processed.system.qualifiers.keys()));

      const { result } = renderHook(() => useResolutionState(processed, mockOnMessage, mockOnSystemUpdate));

      // Test 1: Set context step by step and log the state
      console.log('=== SETTING CONTEXT ===');
      act(() => {
        result.current.actions.updateContextValue('language', 'en-US');
      });
      console.log('After updateContextValue:', {
        contextValues: result.current.state.contextValues,
        pendingContextValues: result.current.state.pendingContextValues
      });

      act(() => {
        result.current.actions.applyContext();
      });
      console.log('After applyContext:', {
        contextValues: result.current.state.contextValues,
        pendingContextValues: result.current.state.pendingContextValues
      });

      // Test 2: Create resource and inspect the result
      console.log('=== CREATING RESOURCE ===');
      await act(async () => {
        const createResult = await result.current.actions.createPendingResource({
          id: 'platform.test.contextTest',
          resourceTypeName: 'json',
          json: { message: 'Context test' }
        });

        console.log('Create result:', createResult);
        if (createResult.isFailure()) {
          console.error('Creation failed:', createResult.message);
        }
      });

      // Test 3: Inspect the created resource
      const pendingResource = result.current.state.pendingResources.get('platform.test.contextTest');
      console.log('Created pending resource:', {
        id: 'platform.test.contextTest',
        resource: pendingResource,
        candidates: pendingResource?.candidates,
        firstCandidateConditions: pendingResource?.candidates?.[0]?.conditions
      });

      // Verify the resource was created
      expect(pendingResource).toBeDefined();
      expect(pendingResource!.candidates?.length).toBe(1);

      // Log any messages from the process
      console.log('Hook messages:', mockOnMessage.mock.calls);
    });
  });
});
