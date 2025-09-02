'use strict';
/*
 * Minimal reproduction tests for validation behavior
 */
Object.defineProperty(exports, '__esModule', { value: true });
require('@fgv/ts-utils-jest');
const ts_res_1 = require('@fgv/ts-res');
const react_1 = require('@testing-library/react');
const useResolutionState_1 = require('../../../hooks/useResolutionState');
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
    resourceCount: resourceIds.length,
    summary: { totalResources: resourceIds.length, resourceIds, errorCount: 0, warnings: [] }
  };
}
describe('Validation Behavior Investigation', () => {
  describe('Resource ID Validation', () => {
    test('Validate.isValidResourceId behavior with edge cases', () => {
      // Test the actual ts-res validation function directly
      expect(ts_res_1.Validate.isValidResourceId('')).toBe(false); // Empty should fail
      expect(ts_res_1.Validate.isValidResourceId('invalid format with spaces')).toBe(false); // Spaces should fail
      expect(ts_res_1.Validate.isValidResourceId('invalid-format')).toBe(true); // Hyphens should pass
      expect(ts_res_1.Validate.isValidResourceId('platform.test.resource')).toBe(true); // Dots should pass
      expect(ts_res_1.Validate.isValidResourceId('123invalid')).toBe(false); // Can't start with number
      expect(ts_res_1.Validate.isValidResourceId('_validStart')).toBe(true); // Can start with underscore
      expect(ts_res_1.Validate.isValidResourceId('valid_with-hyphens.and.dots')).toBe(true); // Complex valid format
    });
  });
  describe('Context Conditions Investigation', () => {
    test('Debug context application in resource creation workflow', async () => {
      const processed = buildProcessedResources();
      const mockOnMessage = jest.fn();
      const mockOnSystemUpdate = jest.fn();
      // Log available qualifiers
      console.log('Available qualifiers:', Array.from(processed.system.qualifiers.keys()));
      const { result } = (0, react_1.renderHook)(() =>
        (0, useResolutionState_1.useResolutionState)(processed, mockOnMessage, mockOnSystemUpdate)
      );
      // Test 1: Set context step by step and log the state
      console.log('=== SETTING CONTEXT ===');
      (0, react_1.act)(() => {
        result.current.actions.updateContextValue('language', 'en-US');
      });
      console.log('After updateContextValue:', {
        contextValues: result.current.state.contextValues,
        pendingContextValues: result.current.state.pendingContextValues
      });
      (0, react_1.act)(() => {
        result.current.actions.applyContext();
      });
      console.log('After applyContext:', {
        contextValues: result.current.state.contextValues,
        pendingContextValues: result.current.state.pendingContextValues
      });
      // Test 2: Create resource and inspect the result
      console.log('=== CREATING RESOURCE ===');
      await (0, react_1.act)(async () => {
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
      expect(pendingResource.candidates?.length).toBe(1);
      // Log any messages from the process
      console.log('Hook messages:', mockOnMessage.mock.calls);
    });
  });
});
//# sourceMappingURL=validation.test.js.map
