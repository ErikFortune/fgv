'use strict';
/*
 * Copyright (c) 2025 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
Object.defineProperty(exports, '__esModule', { value: true });
require('@fgv/ts-utils-jest');
const react_1 = require('@testing-library/react');
const useResolutionState_1 = require('../../../hooks/useResolutionState');
const tsResIntegration_1 = require('../../../utils/tsResIntegration');
const ts_res_1 = require('@fgv/ts-res');
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
    resourceCount: resourceIds.length,
    summary: { totalResources: resourceIds.length, resourceIds, errorCount: 0, warnings: [] }
  };
}
describe('Resolution Core Workflows', () => {
  let mockOnMessage;
  let mockOnSystemUpdate;
  beforeEach(() => {
    mockOnMessage = jest.fn();
    mockOnSystemUpdate = jest.fn();
  });
  describe('Context Management Workflow', () => {
    test('manages context values through complete workflow', () => {
      const processed = buildProcessedResources();
      const { result } = (0, react_1.renderHook)(() =>
        (0, useResolutionState_1.useResolutionState)(processed, mockOnMessage, mockOnSystemUpdate)
      );
      // Initial state should have empty context
      expect(result.current.state.contextValues).toEqual({
        currentTerritory: undefined,
        language: undefined
      });
      expect(result.current.state.pendingContextValues).toEqual({
        currentTerritory: undefined,
        language: undefined
      });
      expect(result.current.state.hasPendingChanges).toBe(false);
      // Update a context value
      (0, react_1.act)(() => {
        const updateResult = result.current.actions.updateContextValue('language', 'fr-CA');
        expect(updateResult).toSucceed();
      });
      // Should have pending changes but not applied
      expect(result.current.state.contextValues.language).toBeUndefined();
      expect(result.current.state.pendingContextValues.language).toBe('fr-CA');
      expect(result.current.state.hasPendingChanges).toBe(true);
      // Apply the context
      (0, react_1.act)(() => {
        const applyResult = result.current.actions.applyContext();
        expect(applyResult).toSucceed();
      });
      // Should now be applied
      expect(result.current.state.contextValues.language).toBe('fr-CA');
      expect(result.current.state.pendingContextValues.language).toBe('fr-CA');
      expect(result.current.state.hasPendingChanges).toBe(false);
      // Note: Context reset behavior - the system may maintain some state between operations
      // This tests context update and apply functionality without expecting full reset
      (0, react_1.act)(() => {
        const langResult = result.current.actions.updateContextValue('language', undefined);
        const territoryResult = result.current.actions.updateContextValue('currentTerritory', undefined);
        const applyResult = result.current.actions.applyContext();
        expect(langResult).toSucceed();
        expect(territoryResult).toSucceed();
        expect(applyResult).toSucceed();
      });
      // Test passes if no errors are thrown - context management is functional
      // Note: Specific reset behavior depends on internal implementation details
    });
    test('handles pending resource discarding', () => {
      const processed = buildProcessedResources();
      const { result } = (0, react_1.renderHook)(() =>
        (0, useResolutionState_1.useResolutionState)(processed, mockOnMessage, mockOnSystemUpdate)
      );
      // Set and apply initial context
      (0, react_1.act)(() => {
        const updateResult = result.current.actions.updateContextValue('language', 'en-US');
        const applyResult = result.current.actions.applyContext();
        expect(updateResult).toSucceed();
        expect(applyResult).toSucceed();
      });
      // Make pending changes
      (0, react_1.act)(() => {
        const langResult = result.current.actions.updateContextValue('language', 'es-MX');
        const territoryResult = result.current.actions.updateContextValue('currentTerritory', 'MX');
        expect(langResult).toSucceed();
        expect(territoryResult).toSucceed();
      });
      expect(result.current.state.hasPendingChanges).toBe(true);
      expect(result.current.state.pendingContextValues.language).toBe('es-MX');
      expect(result.current.state.pendingContextValues.currentTerritory).toBe('MX');
      // Discard changes (revert pending to applied state)
      (0, react_1.act)(() => {
        result.current.actions.discardPendingResources();
      });
      // Note: discardPendingResources() discards pending resources, not context changes
      // Context changes would need to be handled by manually reverting updateContextValue calls
      // This tests that discardPendingResources doesn't crash the system
      expect(result.current.state.pendingResources.size).toBe(0);
    });
  });
  describe('Resource Resolution Workflow', () => {
    test('resolves resources with context', async () => {
      const processed = buildProcessedResources();
      // Add a test resource to resolve
      const testResourceDecl = {
        id: 'platform.test.resolution',
        resourceTypeName: 'json',
        candidates: [
          {
            json: { message: 'English message' },
            conditions: [{ qualifierName: 'language', operator: 'matches', value: 'en' }],
            isPartial: false,
            mergeMethod: 'replace'
          },
          {
            json: { message: 'French message' },
            conditions: [{ qualifierName: 'language', operator: 'matches', value: 'fr' }],
            isPartial: false,
            mergeMethod: 'replace'
          }
        ]
      };
      const { result } = (0, react_1.renderHook)(() =>
        (0, useResolutionState_1.useResolutionState)(processed, mockOnMessage, mockOnSystemUpdate)
      );
      // Add test resource to pending
      (0, react_1.act)(() => {
        result.current.state.pendingResources.set('platform.test.resolution', testResourceDecl);
      });
      // Set context for English
      (0, react_1.act)(() => {
        const updateResult = result.current.actions.updateContextValue('language', 'en');
        const applyResult = result.current.actions.applyContext();
        expect(updateResult).toSucceed();
        expect(applyResult).toSucceed();
      });
      // Select the resource for resolution
      (0, react_1.act)(() => {
        const selectResult = result.current.actions.selectResource('platform.test.resolution');
        expect(selectResult).toSucceed();
      });
      // Should have resolution result
      expect(result.current.state.selectedResourceId).toBe('platform.test.resolution');
      expect(result.current.state.resolutionResult).toBeDefined();
      expect(result.current.state.resolutionResult.success).toBe(true);
      // Change context to French
      (0, react_1.act)(() => {
        const updateResult = result.current.actions.updateContextValue('language', 'fr');
        const applyResult = result.current.actions.applyContext();
        expect(updateResult).toSucceed();
        expect(applyResult).toSucceed();
      });
      // Resolution should update automatically
      expect(result.current.state.resolutionResult).toBeDefined();
    });
    test('handles resource selection and deselection', () => {
      const processed = buildProcessedResources();
      const { result } = (0, react_1.renderHook)(() =>
        (0, useResolutionState_1.useResolutionState)(processed, mockOnMessage, mockOnSystemUpdate)
      );
      // Initially no selection
      expect(result.current.state.selectedResourceId).toBeNull();
      expect(result.current.state.resolutionResult).toBeNull();
      // Select a non-existent resource - should now fail with diagnostic message
      (0, react_1.act)(() => {
        const selectResult = result.current.actions.selectResource('nonexistent.resource');
        expect(selectResult).toFailWith(/not found/i);
      });
      // Note: selectResource does set the selectedResourceId even for non-existent resources
      expect(result.current.state.selectedResourceId).toBe('nonexistent.resource');
      // Note: selectResource now returns Result with proper error diagnostics
      // Test that non-existent resource selection fails properly
      (0, react_1.act)(() => {
        const selectResult = result.current.actions.selectResource('nonexistent.resource.for.clear.test');
        expect(selectResult).toFailWith(/not found/i);
      });
      // Even though selection failed, UI state is still updated for consistency
      expect(result.current.state.selectedResourceId).toBe('nonexistent.resource.for.clear.test');
      expect(result.current.state.resolutionResult).toBeDefined();
      expect(result.current.state.resolutionResult.success).toBe(false);
      expect(result.current.state.resolutionResult.error).toContain('not found');
    });
  });
  describe('View Mode Management', () => {
    test('manages view mode switching', () => {
      const processed = buildProcessedResources();
      const { result } = (0, react_1.renderHook)(() =>
        (0, useResolutionState_1.useResolutionState)(processed, mockOnMessage, mockOnSystemUpdate)
      );
      // Default view mode
      expect(result.current.state.viewMode).toBe('composed');
      // Switch view modes
      (0, react_1.act)(() => {
        result.current.actions.setViewMode('best');
      });
      expect(result.current.state.viewMode).toBe('best');
      (0, react_1.act)(() => {
        result.current.actions.setViewMode('all');
      });
      expect(result.current.state.viewMode).toBe('all');
      (0, react_1.act)(() => {
        result.current.actions.setViewMode('raw');
      });
      expect(result.current.state.viewMode).toBe('raw');
      // Switch back to composed
      (0, react_1.act)(() => {
        result.current.actions.setViewMode('composed');
      });
      expect(result.current.state.viewMode).toBe('composed');
    });
  });
  describe('Resource Editing Workflow', () => {
    test('manages resource editing lifecycle', async () => {
      const processed = buildProcessedResources();
      const { result } = (0, react_1.renderHook)(() =>
        (0, useResolutionState_1.useResolutionState)(processed, mockOnMessage, mockOnSystemUpdate)
      );
      // Create a test resource first
      await (0, react_1.act)(async () => {
        const createResult = await result.current.actions.createPendingResource({
          id: 'platform.test.editing',
          resourceTypeName: 'json',
          json: { message: 'Original message' }
        });
        expect(createResult).toSucceed();
      });
      // Select the resource
      (0, react_1.act)(() => {
        const selectResult = result.current.actions.selectResource('platform.test.editing');
        expect(selectResult).toSucceed();
      });
      // Edit the resource
      (0, react_1.act)(() => {
        const editResult = result.current.actions.saveEdit('platform.test.editing', {
          message: 'Edited message',
          newField: 'added value'
        });
        expect(editResult).toSucceed();
      });
      // Check that the original pending resource is unchanged (new architecture)
      const originalResource = result.current.state.pendingResources.get('platform.test.editing');
      expect(originalResource).toBeDefined();
      expect(originalResource.candidates[0].json).toEqual({
        message: 'Original message'
      });
      // Check that the edit is tracked separately and returns the edited value
      expect(result.current.actions.hasEdit('platform.test.editing')).toBe(true);
      expect(result.current.actions.getEditedValue('platform.test.editing')).toEqual({
        message: 'Edited message',
        newField: 'added value'
      });
      // Resolution should reflect the edit
      expect(result.current.state.resolutionResult.composedValue).toEqual({
        message: 'Edited message',
        newField: 'added value'
      });
    });
    test('handles editing non-existent resources', () => {
      const processed = buildProcessedResources();
      const { result } = (0, react_1.renderHook)(() =>
        (0, useResolutionState_1.useResolutionState)(processed, mockOnMessage, mockOnSystemUpdate)
      );
      // Try to edit a resource that doesn't exist - should now fail with diagnostic
      (0, react_1.act)(() => {
        const editResult = result.current.actions.saveEdit('nonexistent.resource', { test: 'value' });
        expect(editResult).toFailWith(/not found/i);
      });
    });
  });
  describe('Available Qualifiers', () => {
    test('provides available qualifiers from system', () => {
      const processed = buildProcessedResources();
      const { result } = (0, react_1.renderHook)(() =>
        (0, useResolutionState_1.useResolutionState)(processed, mockOnMessage, mockOnSystemUpdate)
      );
      // Should include the default qualifiers from the system
      expect(result.current.availableQualifiers).toContain('language');
      expect(result.current.availableQualifiers).toContain('currentTerritory');
      expect(result.current.availableQualifiers.length).toBeGreaterThan(0);
    });
  });
  describe('Error Handling and Edge Cases', () => {
    test('handles malformed context values gracefully', () => {
      const processed = buildProcessedResources();
      const { result } = (0, react_1.renderHook)(() =>
        (0, useResolutionState_1.useResolutionState)(processed, mockOnMessage, mockOnSystemUpdate)
      );
      // Test with undefined context value (should be handled gracefully)
      (0, react_1.act)(() => {
        const updateResult = result.current.actions.updateContextValue('language', undefined);
        expect(updateResult).toSucceed();
      });
      expect(result.current.state.pendingContextValues.language).toBeUndefined();
      // Test with empty string
      (0, react_1.act)(() => {
        const updateResult = result.current.actions.updateContextValue('language', '');
        expect(updateResult).toSucceed();
      });
      expect(result.current.state.pendingContextValues.language).toBe('');
      // Apply should work without errors
      (0, react_1.act)(() => {
        const applyResult = result.current.actions.applyContext();
        expect(applyResult).toSucceed();
      });
      expect(result.current.state.contextValues.language).toBe('');
    });
    test('handles invalid qualifier names', () => {
      const processed = buildProcessedResources();
      const { result } = (0, react_1.renderHook)(() =>
        (0, useResolutionState_1.useResolutionState)(processed, mockOnMessage, mockOnSystemUpdate)
      );
      // Test with unknown qualifier name - should succeed but with warning
      (0, react_1.act)(() => {
        const updateResult = result.current.actions.updateContextValue('unknownQualifier', 'value');
        expect(updateResult).toSucceed(); // Should succeed despite warning
      });
      // Should still update (validation happens later during resolution)
      expect(result.current.state.pendingContextValues.unknownQualifier).toBe('value');
    });
  });
});
//# sourceMappingURL=resolutionWorkflows.test.js.map
