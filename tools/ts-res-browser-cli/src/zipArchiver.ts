import * as archiver from 'archiver';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Result, succeed, fail } from '@fgv/ts-utils';

export interface ZipArchiveOptions {
  input?: string;
  config?: string;
  outputDir?: string;
}

export interface ZipArchiveResult {
  zipPath: string;
  manifest: ZipManifest;
}

export interface ZipManifest {
  timestamp: string;
  input?: {
    type: 'file' | 'directory';
    originalPath: string;
    archivePath: string;
  };
  config?: {
    type: 'file';
    originalPath: string;
    archivePath: string;
  };
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

      const output = fs.createWriteStream(zipPath);
      const archive = archiver.create('zip', {
        zlib: { level: 6 } // Good compression level
      });

      // Create manifest
      const manifest: ZipManifest = {
        timestamp: new Date().toISOString()
      };

      // Promise to handle async archiving
      const archivePromise = new Promise<void>((resolve, reject) => {
        output.on('close', () => {
          resolve();
        });

        output.on('error', (err: Error) => {
          reject(err);
        });

        archive.on('error', (err: Error) => {
          reject(err);
        });
      });

      // Pipe archive data to the file
      archive.pipe(output);

      // Add input files/directory
      if (options.input) {
        const inputPath = path.resolve(options.input);

        if (!fs.existsSync(inputPath)) {
          return fail(`Input path does not exist: ${inputPath}`);
        }

        const stats = fs.statSync(inputPath);
        if (stats.isDirectory()) {
          // Add entire directory recursively, preserving structure
          const dirName = path.basename(inputPath);
          archive.directory(inputPath, `input/${dirName}`);
          manifest.input = {
            type: 'directory',
            originalPath: inputPath,
            archivePath: `input/${dirName}`
          };
        } else if (stats.isFile()) {
          // Add single file
          const fileName = path.basename(inputPath);
          archive.file(inputPath, { name: `input/${fileName}` });
          manifest.input = {
            type: 'file',
            originalPath: inputPath,
            archivePath: `input/${fileName}`
          };
        }
      }

      // Add config file
      if (options.config) {
        const configPath = path.resolve(options.config);

        if (!fs.existsSync(configPath)) {
          return fail(`Config file does not exist: ${configPath}`);
        }

        const stats = fs.statSync(configPath);
        if (!stats.isFile()) {
          return fail(`Config path must be a file: ${configPath}`);
        }

        const fileName = path.basename(configPath);
        archive.file(configPath, { name: `config/${fileName}` });
        manifest.config = {
          type: 'file',
          originalPath: configPath,
          archivePath: `config/${fileName}`
        };
      }

      // Add manifest
      archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

      // Finalize the archive
      await archive.finalize();
      await archivePromise;

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
