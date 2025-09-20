import { Result, fail } from '@fgv/ts-utils';
import { Config } from '@fgv/ts-res';
import { FileTree } from '@fgv/ts-json-base';
import { IProcessedResources } from '../../types';
import { processFileTree } from '../tsResIntegration';
import * as ObservabilityTools from '../observability';

/**
 * Helper function to process resources from ZIP data using ts-res-ui-components integration
 * @public
 */
export async function processZipResources(
  fileTree: FileTree.FileTree,
  config?: Config.Model.ISystemConfiguration,
  o11y: ObservabilityTools.IObservabilityContext = ObservabilityTools.DefaultObservabilityContext
): Promise<Result<IProcessedResources>> {
  try {
    return processFileTree({ fileTree, systemConfig: config, o11y }).withErrorFormat(
      (message: string) => `Failed to process resources from FileTree: ${message}`
    );
  } catch (error) {
    return fail(`Error processing ZIP resources: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Helper function to process resources from a ZIP load result
 * @public
 */
export async function processZipLoadResult(
  zipResult: {
    fileTree: FileTree.FileTree;
    config?: Config.Model.ISystemConfiguration;
  },
  overrideConfig?: Config.Model.ISystemConfiguration,
  o11y: ObservabilityTools.IObservabilityContext = ObservabilityTools.DefaultObservabilityContext
): Promise<Result<IProcessedResources>> {
  const configToUse = overrideConfig || zipResult.config;
  return processZipResources(zipResult.fileTree, configToUse, o11y);
}
