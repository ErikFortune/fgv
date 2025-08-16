import React from 'react';
import { ResourceEditorFactory, ResourceEditorResult, ResourceEditorProps } from '@fgv/ts-res-ui-components';
import { MarketInfoEditor } from './MarketInfoEditor';

/**
 * Playground-specific resource editor factory that provides custom editors
 * for specific resource types used in the test data.
 */
export class PlaygroundResourceEditorFactory implements ResourceEditorFactory {
  /**
   * Attempts to create a resource editor for the given resource.
   *
   * @param resourceId - The ID of the resource to edit
   * @param resourceType - The type/key of the resource
   * @param value - The current value of the resource
   * @returns ResourceEditorResult indicating success/failure and the editor component or error message
   */
  createEditor(resourceId: string, resourceType: string, value: any): ResourceEditorResult {
    // Handle market information resources
    if (resourceType === 'marketInfo') {
      return {
        success: true,
        editor: MarketInfoEditor
      };
    }

    // Could add more resource types here in the future, e.g.:
    // if (resourceType === 'userProfile') {
    //   return {
    //     success: true,
    //     editor: UserProfileEditor
    //   };
    // }

    // Return failure for unknown resource types
    return {
      success: false,
      message: `No custom editor available for resource type '${resourceType}'`
    };
  }
}

/**
 * Singleton instance of the playground resource editor factory.
 * Use this instance throughout the playground to provide consistent custom editing.
 */
export const playgroundResourceEditorFactory = new PlaygroundResourceEditorFactory();

export default PlaygroundResourceEditorFactory;
