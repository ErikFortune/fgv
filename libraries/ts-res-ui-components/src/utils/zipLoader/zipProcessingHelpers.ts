import { Result, succeed, fail } from '@fgv/ts-utils';
import { Config } from '@fgv/ts-res';
import { ImportedDirectory, ImportedFile, ProcessedResources } from '../../types';
import { processImportedFiles, processImportedDirectory } from '../tsResIntegration';

/**
 * Helper function to process resources from ZIP data using ts-res-ui-components integration
 * @public
 */
export async function processZipResources(
  files: ImportedFile[],
  directory: ImportedDirectory | undefined,
  config?: Config.Model.ISystemConfiguration
): Promise<Result<ProcessedResources>> {
  try {
    if (directory) {
      const processResult = await processImportedDirectory(directory, config);
      if (processResult.isSuccess()) {
        return succeed(processResult.value);
      } else {
        return fail(`Failed to process resources from directory: ${processResult.message}`);
      }
    } else if (files.length > 0) {
      const processResult = await processImportedFiles(files, config);
      if (processResult.isSuccess()) {
        return succeed(processResult.value);
      } else {
        return fail(`Failed to process resources from files: ${processResult.message}`);
      }
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
    files: ImportedFile[];
    directory?: ImportedDirectory;
    config?: Config.Model.ISystemConfiguration;
  },
  overrideConfig?: Config.Model.ISystemConfiguration
): Promise<Result<ProcessedResources>> {
  const configToUse = overrideConfig || zipResult.config;
  return processZipResources(zipResult.files, zipResult.directory, configToUse);
}
