import { Result, fail } from '@fgv/ts-utils';
import { Config } from '@fgv/ts-res';
import { IImportedDirectory, IImportedFile, IProcessedResources } from '../../types';
import { processImportedFiles, processImportedDirectory } from '../tsResIntegration';
import * as ObservabilityTools from '../observability';

/**
 * Helper function to process resources from ZIP data using ts-res-ui-components integration
 * @public
 */
export async function processZipResources(
  files: IImportedFile[],
  directory: IImportedDirectory | undefined,
  config?: Config.Model.ISystemConfiguration,
  o11y: ObservabilityTools.IObservabilityContext = ObservabilityTools.DefaultObservabilityContext
): Promise<Result<IProcessedResources>> {
  try {
    if (directory) {
      return processImportedDirectory(directory, config, undefined, undefined, o11y).withErrorFormat(
        (message: string) => `Failed to process resources from directory: ${message}`
      );
    } else if (files.length > 0) {
      return processImportedFiles(files, config, undefined, undefined, o11y).withErrorFormat(
        (message: string) => `Failed to process resources from files: ${message}`
      );
    } else {
      return fail('No files or directory structure found to process');
    }
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
    files: IImportedFile[];
    directory?: IImportedDirectory;
    config?: Config.Model.ISystemConfiguration;
  },
  overrideConfig?: Config.Model.ISystemConfiguration,
  o11y: ObservabilityTools.IObservabilityContext = ObservabilityTools.DefaultObservabilityContext
): Promise<Result<IProcessedResources>> {
  const configToUse = overrideConfig || zipResult.config;
  return processZipResources(zipResult.files, zipResult.directory, configToUse, o11y);
}
