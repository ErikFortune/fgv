import { renderHook, act } from '@testing-library/react';
import '@fgv/ts-utils-jest';

import { useResourceData } from '../../../hooks/useResourceData';
import { ProcessedResources, ExtendedProcessedResources } from '../../../types';
import { getDefaultSystemConfiguration } from '../../../utils/tsResIntegration';
import { Config } from '@fgv/ts-res';

// Create minimal mock data for testing
const createMockProcessedResources = (): ProcessedResources => ({
  system: {
    resourceManager: {} as any,
    qualifierTypes: {} as any,
    qualifiers: {} as any,
    resourceTypes: {} as any,
    importManager: {} as any,
    contextQualifierProvider: {} as any
  },
  compiledCollection: {} as any,
  resolver: {} as any,
  resourceCount: 5,
  summary: {
    totalResources: 5,
    resourceIds: ['test1', 'test2'],
    errorCount: 0,
    warnings: []
  }
});

const createMockConfiguration = (): Config.Model.ISystemConfiguration => getDefaultSystemConfiguration();

describe('useResourceData', () => {
  describe('updateProcessedResources', () => {
    test('should preserve activeConfiguration when updating processed resources', () => {
      const { result } = renderHook(() => useResourceData({}));

      // First, set an active configuration
      const mockConfig = createMockConfiguration();
      act(() => {
        result.current.actions.applyConfiguration(mockConfig);
      });

      // Verify configuration is set
      expect(result.current.state.activeConfiguration).toBe(mockConfig);

      // Create initial extended processed resources with configuration
      const initialResources: ExtendedProcessedResources = {
        ...createMockProcessedResources(),
        activeConfiguration: mockConfig,
        isLoadedFromBundle: false,
        bundleMetadata: null
      };

      // Set the processed resources (simulating initial resource loading)
      act(() => {
        result.current.actions.updateProcessedResources(initialResources);
      });

      // Verify both the state and processed resources have the configuration
      expect(result.current.state.activeConfiguration).toBe(mockConfig);
      expect(result.current.state.processedResources?.activeConfiguration).toBe(mockConfig);

      // Now simulate what happens when resolution editing updates resources
      // This would be called with plain ProcessedResources (without activeConfiguration)
      const updatedResources: ProcessedResources = {
        ...createMockProcessedResources(),
        resourceCount: 10, // Changed value to verify update
        summary: {
          totalResources: 10,
          resourceIds: ['test1', 'test2', 'test3'],
          errorCount: 0,
          warnings: []
        }
      };

      // Update processed resources (this is what resolution editing does)
      act(() => {
        result.current.actions.updateProcessedResources(updatedResources);
      });

      // CRITICAL TEST: activeConfiguration should be preserved
      expect(result.current.state.activeConfiguration).toBe(mockConfig);
      expect(result.current.state.processedResources?.activeConfiguration).toBe(mockConfig);

      // Verify the update was applied
      expect(result.current.state.processedResources?.resourceCount).toBe(10);
      expect(result.current.state.processedResources?.summary.totalResources).toBe(10);
      expect(result.current.state.processedResources?.summary.resourceIds).toHaveLength(3);
    });

    test('should preserve bundle metadata when updating processed resources', () => {
      const { result } = renderHook(() => useResourceData({}));

      const mockConfig = createMockConfiguration();
      const mockBundleMetadata = {
        name: 'Test Bundle',
        version: '1.0.0',
        timestamp: '2023-01-01T00:00:00Z'
      } as any;

      // Set initial state with bundle metadata
      const initialResources: ExtendedProcessedResources = {
        ...createMockProcessedResources(),
        activeConfiguration: mockConfig,
        isLoadedFromBundle: true,
        bundleMetadata: mockBundleMetadata
      };

      act(() => {
        result.current.actions.applyConfiguration(mockConfig);
        result.current.actions.updateProcessedResources(initialResources);
      });

      // Update with plain ProcessedResources
      const updatedResources: ProcessedResources = {
        ...createMockProcessedResources(),
        resourceCount: 15
      };

      act(() => {
        result.current.actions.updateProcessedResources(updatedResources);
      });

      // Bundle metadata should be preserved
      expect(result.current.state.processedResources?.isLoadedFromBundle).toBe(true);
      expect(result.current.state.processedResources?.bundleMetadata).toBe(mockBundleMetadata);
      expect(result.current.state.processedResources?.activeConfiguration).toBe(mockConfig);

      // Update should still be applied
      expect(result.current.state.processedResources?.resourceCount).toBe(15);
    });

    test('should handle updating resources when no previous configuration exists', () => {
      const { result } = renderHook(() => useResourceData({}));

      const mockResources: ProcessedResources = createMockProcessedResources();

      act(() => {
        result.current.actions.updateProcessedResources(mockResources);
      });

      // Should work without errors even when no previous configuration
      expect(result.current.state.processedResources?.activeConfiguration).toBeUndefined();
      expect(result.current.state.processedResources?.resourceCount).toBe(5);
      expect(result.current.state.hasProcessedData).toBe(true);
    });

    test('should handle case where previous processedResources is null', () => {
      const { result } = renderHook(() => useResourceData({}));

      // Ensure initial state
      expect(result.current.state.processedResources).toBeNull();

      const mockConfig = createMockConfiguration();
      const mockResources: ProcessedResources = createMockProcessedResources();

      // Set configuration but no processed resources yet
      act(() => {
        result.current.actions.applyConfiguration(mockConfig);
      });

      // Now update processed resources for the first time
      act(() => {
        result.current.actions.updateProcessedResources(mockResources);
      });

      // Should have the resources but preserve the configuration
      expect(result.current.state.processedResources?.activeConfiguration).toBeUndefined(); // No previous processedResources
      expect(result.current.state.activeConfiguration).toBe(mockConfig); // State configuration preserved
      expect(result.current.state.processedResources?.resourceCount).toBe(5);
    });
  });

  describe('export functionality integration', () => {
    test('should maintain configuration needed for export after resource updates', () => {
      const { result } = renderHook(() => useResourceData({}));

      const mockConfig = createMockConfiguration();

      // Simulate the workflow: load config, import resources, edit resources
      act(() => {
        // 1. Load configuration
        result.current.actions.applyConfiguration(mockConfig);
      });

      act(() => {
        // 2. Import/process resources with configuration
        const initialResources: ExtendedProcessedResources = {
          ...createMockProcessedResources(),
          activeConfiguration: mockConfig,
          isLoadedFromBundle: false,
          bundleMetadata: null
        };
        result.current.actions.updateProcessedResources(initialResources);
      });

      act(() => {
        // 3. Simulate resource editing (resolution system updates with plain ProcessedResources)
        const editedResources: ProcessedResources = {
          ...createMockProcessedResources(),
          resourceCount: 8 // Simulate edited resources
        };
        result.current.actions.updateProcessedResources(editedResources);
      });

      // 4. Export should still be possible (configuration available)
      const finalState = result.current.state;
      expect(finalState.processedResources?.activeConfiguration).toBe(mockConfig);
      expect(finalState.activeConfiguration).toBe(mockConfig);

      // Both state locations should have the configuration for export
      expect(finalState.processedResources?.activeConfiguration).toBeTruthy();
      expect(finalState.activeConfiguration).toBeTruthy();

      // Resources should reflect the edits
      expect(finalState.processedResources?.resourceCount).toBe(8);
    });
  });
});
