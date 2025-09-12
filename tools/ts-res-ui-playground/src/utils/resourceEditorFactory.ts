import React from 'react';
import { ResourceTools } from '@fgv/ts-res-ui-components';
import MarketInfoEditor from '../components/editors/MarketInfoEditor';

interface MarketInfo {
  marketName: string;
  availablePaymentMethods: string[];
  supportedLanguages: string[];
  regulatoryCompliance: string;
  marketingBudget: string;
  customerSupportHours: string;
  selectedBy: string;
}

/**
 * Resource editor factory for the ts-res-ui-playground.
 *
 * This factory provides custom editors for specific resource types,
 * allowing the ResolutionView to show specialized editing interfaces
 * instead of the default JSON editor.
 *
 * @example
 * ```typescript
 * // Usage in ResourceOrchestrator
 * <ResourceOrchestrator
 *   resourceEditorFactory={playgroundResourceEditorFactory}
 *   // ... other props
 * >
 *   {({ state, actions }) => (
 *     <ResolutionView
 *       resourceEditorFactory={state.resourceEditorFactory}
 *       // ... other props
 *     />
 *   )}
 * </ResourceOrchestrator>
 * ```
 */
export const playgroundResourceEditorFactory: ResourceTools.IResourceEditorFactory = {
  createEditor(resourceId: string, resourceType: string, value: unknown): ResourceTools.ResourceEditorResult {
    // Handle market-info resources with the custom MarketInfoEditor
    if (resourceType === 'marketInfo') {
      return {
        success: true,
        editor: MarketInfoEditor as React.ComponentType<ResourceTools.IResourceEditorProps<MarketInfo>>
      };
    }

    // For all other resource types, return failure to fall back to default JSON editor
    return {
      success: false,
      message: `No custom editor available for resource type: ${resourceType}`
    };
  }
};

export default playgroundResourceEditorFactory;
