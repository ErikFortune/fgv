import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Result, succeed, fail } from '@fgv/ts-utils';
import { ZipArchive } from '@fgv/ts-res';

export interface ZipArchiveOptions {
  input?: string;
  config?: string;
  outputDir?: string;
}

export interface ZipArchiveResult {
  zipPath: string;
  manifest: ZipArchive.IZipArchiveManifest;
}

export class ZipArchiver {
  /**
   * Create a ZIP archive containing the specified input and config files/directories
   */
  async createArchive(options: ZipArchiveOptions): Promise<Result<ZipArchiveResult>> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputDir = options.outputDir || path.join(os.homedir(), 'Downloads');
      const zipFileName = `ts-res-bundle-${timestamp}.zip`;
      const zipPath = path.join(outputDir, zipFileName);

      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Create ZIP archive using the new zip-archive packlet
      const creator = new ZipArchive.ZipArchiveCreator();
      const createResult = await creator.createFromBuffer({
        inputPath: options.input,
        configPath: options.config
      });

      if (createResult.isFailure()) {
        return fail(createResult.message);
      }

      const { zipBuffer, manifest } = createResult.value;

      // Write the ZIP buffer to disk
      fs.writeFileSync(zipPath, zipBuffer);

      return succeed({
        zipPath,
        manifest
      });
    } catch (error) {
      return fail(`Failed to create ZIP archive: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get the default downloads directory path
   */
  getDefaultDownloadsDir(): string {
    return path.join(os.homedir(), 'Downloads');
  }
}

// Export singleton instance
export const zipArchiver = new ZipArchiver();
