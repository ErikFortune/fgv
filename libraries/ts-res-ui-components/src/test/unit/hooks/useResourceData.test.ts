import { renderHook, act } from '@testing-library/react';
import '@fgv/ts-utils-jest';

import { useResourceData } from '../../../hooks/useResourceData';
import { IProcessedResources, IExtendedProcessedResources } from '../../../types';
import { getDefaultSystemConfiguration } from '../../../utils/tsResIntegration';
import {
  Config,
  QualifierTypes,
  Qualifiers,
  Resources,
  ResourceJson,
  ResourceTypes,
  Import,
  Runtime,
  Bundle
} from '@fgv/ts-res';

// Create minimal mock data for testing
const createMockProcessedResources = (): IProcessedResources => ({
  system: {
    resourceManager: {} as unknown as Resources.ResourceManagerBuilder,
    qualifierTypes: {} as unknown as QualifierTypes.ReadOnlyQualifierTypeCollector,
    qualifiers: {} as unknown as Qualifiers.IReadOnlyQualifierCollector,
    resourceTypes: {} as unknown as ResourceTypes.ReadOnlyResourceTypeCollector,
    importManager: {} as unknown as Import.ImportManager,
    contextQualifierProvider: {} as unknown as Runtime.ValidatingSimpleContextQualifierProvider
  },
  compiledCollection: {} as unknown as ResourceJson.Compiled.ICompiledResourceCollection,
  resolver: {} as unknown as Runtime.ResourceResolver,
  resourceCount: 5,
  summary: {
    totalResources: 5,
    resourceIds: ['test1', 'test2'],
    errorCount: 0,
    warnings: []
  }
});

const createMockConfiguration = (): Config.Model.ISystemConfiguration => getDefaultSystemConfiguration();

const createMockProcessedResourcesWithUpdatedSystem = (
  originalResources: IProcessedResources
): IProcessedResources => ({
  ...originalResources,
  system: {
    ...originalResources.system,
    // Simulate updated resource manager with new candidates
    resourceManager: {
      ...originalResources.system.resourceManager,
      updated: true
    } as unknown as Resources.ResourceManagerBuilder
  },
  resourceCount: originalResources.resourceCount + 1,
  summary: {
    ...originalResources.summary,
    totalResources: originalResources.summary.totalResources + 1,
    resourceIds: [...originalResources.summary.resourceIds, 'new-candidate']
  }
});

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
      const initialResources: IExtendedProcessedResources = {
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
      const updatedResources: IProcessedResources = {
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
      } as unknown as Bundle.IBundleMetadata;

      // Set initial state with bundle metadata
      const initialResources: IExtendedProcessedResources = {
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
      const updatedResources: IProcessedResources = {
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

      const mockResources: IProcessedResources = createMockProcessedResources();

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
      const mockResources: IProcessedResources = createMockProcessedResources();

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
        const initialResources: IExtendedProcessedResources = {
          ...createMockProcessedResources(),
          activeConfiguration: mockConfig,
          isLoadedFromBundle: false,
          bundleMetadata: null
        };
        result.current.actions.updateProcessedResources(initialResources);
      });

      act(() => {
        // 3. Simulate resource editing (resolution system updates with plain ProcessedResources)
        const editedResources: IProcessedResources = {
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

  describe('resource editing workflow regression test', () => {
    test('should preserve updated resource system when applying edits with extended metadata', () => {
      const { result } = renderHook(() => useResourceData({}));

      // 1. Set up initial configuration and resources (like loading from files)
      const mockConfig = createMockConfiguration();
      const mockBundleMetadata = {
        version: '1.0.0',
        description: 'Test bundle',
        dateBuilt: new Date('2024-01-01').toISOString(),
        checksum: 'mock-checksum-123'
      };

      act(() => {
        result.current.actions.applyConfiguration(mockConfig);
      });

      // 2. Load initial resources with extended properties
      const initialResources: IExtendedProcessedResources = {
        ...createMockProcessedResources(),
        activeConfiguration: mockConfig,
        isLoadedFromBundle: true,
        bundleMetadata: mockBundleMetadata
      };

      act(() => {
        result.current.actions.updateProcessedResources(initialResources);
      });

      // Verify initial state
      expect(result.current.state.processedResources?.resourceCount).toBe(5);
      expect(result.current.state.processedResources?.summary.resourceIds).toHaveLength(2);
      expect(result.current.state.processedResources?.activeConfiguration).toBe(mockConfig);

      // 3. Simulate resource editing workflow (what was broken)
      // The resolution system applies edits and returns updated ProcessedResources
      const originalResources = result.current.state.processedResources!;
      const updatedResources = createMockProcessedResourcesWithUpdatedSystem(originalResources);

      act(() => {
        result.current.actions.updateProcessedResources(updatedResources);
      });

      // 4. Verify the fix: updated system should be preserved, extended properties maintained
      const finalState = result.current.state.processedResources!;

      // The core resource system should be updated (this was the bug)
      expect(finalState.resourceCount).toBe(6); // Updated count
      expect(finalState.summary.totalResources).toBe(6);
      expect(finalState.summary.resourceIds).toContain('new-candidate'); // New candidate added

      // Extended metadata should still be preserved
      expect(finalState.activeConfiguration).toBe(mockConfig);
      expect(finalState.isLoadedFromBundle).toBe(true);
      expect(finalState.bundleMetadata).toBe(mockBundleMetadata);
    });
  });
});
