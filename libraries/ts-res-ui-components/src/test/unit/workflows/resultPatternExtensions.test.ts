/*
 * Tests for Result Pattern Extensions
 * Demonstrates enhanced diagnostic capabilities of Result-based methods
 */

import '@fgv/ts-utils-jest';
import { renderHook, act } from '@testing-library/react';
import { useResolutionState } from '../../../hooks/useResolutionState';
import { createTsResSystemFromConfig } from '../../../utils/tsResIntegration';
import { Runtime } from '@fgv/ts-res';

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
    resourceCount: resourceIds.length,
    summary: { totalResources: resourceIds.length, resourceIds, errorCount: 0, warnings: [] }
  };
}

describe('Result Pattern Extensions', () => {
  let mockOnMessage: jest.Mock;
  let mockOnSystemUpdate: jest.Mock;

  beforeEach(() => {
    mockOnMessage = jest.fn();
    mockOnSystemUpdate = jest.fn();
  });

  describe('Enhanced Cache Management', () => {
    test('resetCache provides detailed diagnostics', () => {
      const processed = buildProcessedResources();
      const { result } = renderHook(() => useResolutionState(processed, mockOnMessage, mockOnSystemUpdate));

      // Apply context creates resolver automatically, so resetCache should succeed
      act(() => {
        const applyResult = result.current.actions.applyContext();
        expect(applyResult).toSucceed();
      });

      // Cache reset should succeed since resolver was created
      act(() => {
        const resetResult = result.current.actions.resetCache();
        expect(resetResult).toSucceed();
      });

      // Multiple resets should continue to succeed
      act(() => {
        const resetResult2 = result.current.actions.resetCache();
        expect(resetResult2).toSucceed();
      });
    });
  });

  describe('Enhanced Edit Management', () => {
    test('clearEdits now works correctly with pending resources', async () => {
      const processed = buildProcessedResources();
      const { result } = renderHook(() => useResolutionState(processed, mockOnMessage, mockOnSystemUpdate));

      // Apply context first
      act(() => {
        const applyResult = result.current.actions.applyContext();
        expect(applyResult).toSucceed();
      });

      // Initially no edits to clear
      act(() => {
        const clearResult = result.current.actions.clearEdits();
        expect(clearResult).toSucceedAndSatisfy((data) => {
          expect(data.clearedCount).toBe(0);
        });
      });

      // BUG: pending resource edits cannot be cleared
      await act(async () => {
        const createResult = await result.current.actions.createPendingResource({
          id: 'platform.test.bug',
          resourceTypeName: 'json',
          json: { original: true }
        });
        expect(createResult).toSucceed();
      });

      act(() => {
        const editResult = result.current.actions.saveEdit('platform.test.bug', { edited: true });
        expect(editResult).toSucceed();
      });

      // FIXED: This now clears the pending resource edit correctly
      act(() => {
        const clearResult = result.current.actions.clearEdits();
        expect(clearResult).toSucceedAndSatisfy((data) => {
          // Bug is fixed - count is now 1 as expected
          expect(data.clearedCount).toBe(1);
        });
      });

      // Verify the pending resource edit is now cleared (falls back to original value)
      expect(result.current.actions.getEditedValue('platform.test.bug')).toEqual({ original: true });
    });

    test('discardEdits now works correctly with pending resources', async () => {
      const processed = buildProcessedResources();
      const { result } = renderHook(() => useResolutionState(processed, mockOnMessage, mockOnSystemUpdate));

      // Apply context first
      act(() => {
        const applyResult = result.current.actions.applyContext();
        expect(applyResult).toSucceed();
      });

      // No edits to discard initially
      act(() => {
        const discardResult = result.current.actions.discardEdits();
        expect(discardResult).toSucceedAndSatisfy((data) => {
          expect(data.discardedCount).toBe(0);
        });
      });

      // Test the bug with discardEdits
      await act(async () => {
        const createResult = await result.current.actions.createPendingResource({
          id: 'platform.test.discard.bug',
          resourceTypeName: 'json',
          json: { original: true }
        });
        expect(createResult).toSucceed();
      });

      act(() => {
        const editResult = result.current.actions.saveEdit('platform.test.discard.bug', { edited: true });
        expect(editResult).toSucceed();
      });

      // FIXED: This now discards the pending resource edit correctly
      act(() => {
        const discardResult = result.current.actions.discardEdits();
        expect(discardResult).toSucceedAndSatisfy((data) => {
          // Bug is fixed - count is now 1 as expected
          expect(data.discardedCount).toBe(1);
        });
      });
    });
  });

  describe('Enhanced Pending Resource Management', () => {
    test('removePendingResource validates resource existence', async () => {
      const processed = buildProcessedResources();
      const { result } = renderHook(() => useResolutionState(processed, mockOnMessage, mockOnSystemUpdate));

      // Try to remove non-existent pending resource
      act(() => {
        const removeResult = result.current.actions.removePendingResource('nonexistent.resource');
        expect(removeResult).toFailWith(/not found/i);
      });

      // Try with empty resource ID
      act(() => {
        const removeResult = result.current.actions.removePendingResource('');
        expect(removeResult).toFailWith(/not a valid resource ID/i);
      });

      // Create a pending resource
      await act(async () => {
        const createResult = await result.current.actions.createPendingResource({
          id: 'platform.test.remove',
          resourceTypeName: 'json',
          json: { message: 'Will be removed' }
        });
        expect(createResult).toSucceed();
      });

      // Verify it exists
      expect(result.current.state.pendingResources.has('platform.test.remove')).toBe(true);

      // Now removal should succeed
      act(() => {
        const removeResult = result.current.actions.removePendingResource('platform.test.remove');
        expect(removeResult).toSucceed();
      });

      // Verify it's gone
      expect(result.current.state.pendingResources.has('platform.test.remove')).toBe(false);

      // Try to remove it again - should fail
      act(() => {
        const removeResult = result.current.actions.removePendingResource('platform.test.remove');
        expect(removeResult).toFailWith(/not found/i);
      });
    });

    test('removePendingResource clears selection if resource was selected', async () => {
      const processed = buildProcessedResources();
      const { result } = renderHook(() => useResolutionState(processed, mockOnMessage, mockOnSystemUpdate));

      // Create and select a pending resource
      await act(async () => {
        const createResult = await result.current.actions.createPendingResource({
          id: 'platform.test.selected',
          resourceTypeName: 'json',
          json: { message: 'Selected resource' }
        });
        expect(createResult).toSucceed();
      });

      act(() => {
        const selectResult = result.current.actions.selectResource('platform.test.selected');
        expect(selectResult).toSucceed();
      });

      // Verify selection
      expect(result.current.state.selectedResourceId).toBe('platform.test.selected');

      // Remove the selected resource
      act(() => {
        const removeResult = result.current.actions.removePendingResource('platform.test.selected');
        expect(removeResult).toSucceed();
      });

      // Selection should be cleared
      expect(result.current.state.selectedResourceId).toBeNull();
      expect(result.current.state.resolutionResult).toBeNull();
    });
  });

  describe('Enhanced Pending Resource Application', () => {
    test('applyPendingResources provides detailed diagnostics', async () => {
      const processed = buildProcessedResources();
      const { result } = renderHook(() => useResolutionState(processed, mockOnMessage, mockOnSystemUpdate));

      // Apply context first
      act(() => {
        const applyResult = result.current.actions.applyContext();
        expect(applyResult).toSucceed();
      });

      // Initially no changes to apply - should fail
      await act(async () => {
        const applyResult = await result.current.actions.applyPendingResources();
        expect(applyResult).toFailWith(/no pending changes/i);
      });

      // Create some pending resources and edits
      await act(async () => {
        const createResult1 = await result.current.actions.createPendingResource({
          id: 'platform.test.apply1',
          resourceTypeName: 'json',
          json: { message: 'First resource' }
        });
        expect(createResult1).toSucceed();

        const createResult2 = await result.current.actions.createPendingResource({
          id: 'platform.test.apply2',
          resourceTypeName: 'json',
          json: { message: 'Second resource' }
        });
        expect(createResult2).toSucceed();
      });

      // Add an edit to one of the pending resources
      act(() => {
        const editResult = result.current.actions.saveEdit('platform.test.apply1', {
          message: 'Edited first resource'
        });
        expect(editResult).toSucceed();
      });

      // Add an edit to an existing resource (if any exist)
      const existingResourceIds = Array.from(processed.system.resourceManager.resources.keys());
      if (existingResourceIds.length > 0) {
        act(() => {
          const editResult = result.current.actions.saveEdit(existingResourceIds[0], { edited: true });
          expect(editResult).toSucceed();
        });
      }

      // Now apply all changes - should provide detailed diagnostics
      await act(async () => {
        const applyResult = await result.current.actions.applyPendingResources();
        expect(applyResult).toSucceedAndSatisfy((data) => {
          expect(data.appliedCount).toBeGreaterThan(0);
          expect(data.newResourceCount).toBe(2); // Two new resources created
          expect(data.pendingResourceEditCount).toBe(1); // One pending resource edit
          expect(data.deletionCount).toBe(0); // No deletions
          // May have existing resource edits if existing resources were found
          expect(data.existingResourceEditCount).toBeGreaterThanOrEqual(0);

          // Verify total count matches sum
          expect(data.appliedCount).toBe(
            data.existingResourceEditCount +
              data.pendingResourceEditCount +
              data.newResourceCount +
              data.deletionCount
          );
        });
      });

      // After successful application, another attempt should fail with no changes
      await act(async () => {
        const applyResult = await result.current.actions.applyPendingResources();
        expect(applyResult).toFailWith(/no pending changes/i);
      });
    });

    test('applyPendingResources fails gracefully with system errors', async () => {
      const processed = buildProcessedResources();
      // Pass undefined for system update handler to trigger error
      const { result } = renderHook(() => useResolutionState(processed, mockOnMessage, undefined));

      // Create a pending resource
      await act(async () => {
        const createResult = await result.current.actions.createPendingResource({
          id: 'platform.test.error',
          resourceTypeName: 'json',
          json: { message: 'Will cause error' }
        });
        expect(createResult).toSucceed();
      });

      // Apply should fail with proper error message for missing handler
      await act(async () => {
        const applyResult = await result.current.actions.applyPendingResources();
        expect(applyResult).toFailWith(/no system update handler/i);
      });
    });
  });

  describe('Error Handling Edge Cases', () => {
    test('methods handle various error conditions gracefully', () => {
      const processed = buildProcessedResources();
      const { result } = renderHook(() => useResolutionState(processed, mockOnMessage, mockOnSystemUpdate));

      // Test edge cases with detailed error messages
      act(() => {
        // Empty resource ID
        const removeResult = result.current.actions.removePendingResource('');
        expect(removeResult).toFailWith(/not a valid resource ID/i);

        // Whitespace-only resource ID
        const removeResult2 = result.current.actions.removePendingResource('   ');
        expect(removeResult2).toFailWith(/not a valid resource ID/i);

        // Apply context first to create resolver
        const applyResult = result.current.actions.applyContext();
        expect(applyResult).toSucceed();

        // Cache operations should succeed after context is applied
        const resetResult1 = result.current.actions.resetCache();
        const resetResult2 = result.current.actions.resetCache();
        expect(resetResult1).toSucceed();
        expect(resetResult2).toSucceed();
      });
    });
  });
});
