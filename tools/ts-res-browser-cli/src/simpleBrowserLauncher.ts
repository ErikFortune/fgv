/*
 * Copyright (c) 2025 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { exec } from 'child_process';
import * as path from 'path';
import * as http from 'http';
import { Result, succeed, fail } from '@fgv/ts-utils';
import { IBrowseOptions } from './options';
import { zipArchiver } from './zipArchiver';

/**
 * Simplified browser launcher using direct dependency on ts-res-browser
 */
export class SimpleBrowserLauncher {
  /**
   * Launches the browser with the specified options
   */
  public async launch(options: IBrowseOptions): Promise<Result<void>> {
    try {
      // Validate options before proceeding
      if (options.interactive && !options.dev && !options.serve && !options.url) {
        return fail(
          'Interactive mode requires either --dev/--serve to start a local server or --url to specify a remote server.\n\n' +
            'Examples:\n' +
            '  ts-res-browser-cli --interactive --dev\n' +
            '  ts-res-browser-cli --interactive --serve\n' +
            '  ts-res-browser-cli --interactive --url https://example.com/ts-res-browser'
        );
      }

      // Check if we need to create a ZIP archive for file-based inputs
      let zipCreated = false;
      let finalOptions = { ...options };

      if (this._shouldCreateZip(options)) {
        if (!options.quiet) {
          console.log('Creating ZIP archive for file-based resources...');
        }

        const zipResult = await this._createZipArchive(options);
        if (zipResult.isFailure()) {
          return fail(`Failed to create ZIP archive: ${zipResult.message}`);
        }

        if (!options.quiet) {
          console.log(`ZIP archive created: ${zipResult.value.zipPath}`);
        }

        // Modify options to use ZIP loading instead of file paths
        const zipFileName = path.basename(zipResult.value.zipPath);
        finalOptions = {
          ...options,
          input: undefined,
          config: undefined,
          // Add ZIP loading parameters
          loadZip: true,
          zipFile: zipFileName,
          zipPath: zipResult.value.zipPath
        };
        zipCreated = true;
      }

      // Start server if requested
      if ((finalOptions.dev || finalOptions.serve) && !finalOptions.url) {
        if (!finalOptions.quiet) {
          console.log('Starting TS-RES Browser server...');
        }

        const serverResult = await this._startServer(finalOptions);
        if (serverResult.isFailure()) {
          return serverResult;
        }
      }

      // Build URL with parameters
      const url = this._buildUrl(finalOptions);

      if (!finalOptions.quiet) {
        console.log('Opening TS-RES Browser...');
        if (zipCreated) {
          console.log('ZIP archive created - browser will load from Downloads folder');
        } else {
          if (finalOptions.input) {
            console.log(`Resource file: ${finalOptions.input}`);
          }
          if (finalOptions.config) {
            console.log(`Configuration: ${finalOptions.config}`);
          }
        }
        if (finalOptions.contextFilter) {
          console.log(`Context filter: ${finalOptions.contextFilter}`);
        }
        console.log(`URL: ${url}`);
      }

      // Open browser if requested (default to true)
      const shouldOpen = finalOptions.open !== false;
      if (shouldOpen) {
        const openResult = await this._openBrowser(url, finalOptions.verbose || false);
        if (openResult.isFailure()) {
          return fail(`Could not open browser: ${openResult.message}`);
        }

        if (!finalOptions.quiet) {
          console.log('Browser opened successfully');
        }
      } else {
        console.log(`Browser URL: ${url}`);
      }

      return succeed(undefined);
    } catch (error) {
      return fail(`Failed to launch browser: ${error}`);
    }
  }

  /**
   * Starts the server using ts-res-browser CLI directly
   */
  private async _startServer(options: IBrowseOptions): Promise<Result<void>> {
    try {
      // Use ts-res-browser directly from node_modules
      const browserPath = require.resolve('@fgv/ts-res-browser/cli.js');
      const command = `node "${browserPath}" ${options.dev ? 'dev' : 'serve'}`;

      if (options.verbose) {
        console.log(`Running: ${command}`);
      }

      return new Promise((resolve) => {
        const child = exec(command, (error) => {
          if (error) {
            resolve(fail(`Failed to start server: ${error.message}`));
          } else {
            resolve(succeed(undefined));
          }
        });

        // Give server time to start, then assume success
        setTimeout(() => {
          if (options.verbose) {
            console.log('Server startup initiated');
          }
          resolve(succeed(undefined));
        }, 2000);
      });
    } catch (error) {
      return fail(`Failed to start server: ${error}`);
    }
  }

  /**
   * Opens the browser to the specified URL
   */
  private async _openBrowser(url: string, verbose: boolean): Promise<Result<void>> {
    return new Promise((resolve) => {
      const command =
        process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start ""' : 'xdg-open';

      exec(`${command} "${url}"`, (error) => {
        if (error) {
          resolve(fail(`Failed to open browser: ${error.message}`));
        } else {
          if (verbose) {
            console.log(`Opened browser to: ${url}`);
          }
          resolve(succeed(undefined));
        }
      });
    });
  }

  /**
   * Builds the URL with query parameters based on options
   */
  private _buildUrl(options: IBrowseOptions): string {
    // Use provided URL or default based on server type
    const defaultPort = options.dev ? 3000 : 8080;
    const baseUrl = options.url || `http://localhost:${options.port || defaultPort}`;
    const params = new URLSearchParams();

    if (options.input) {
      params.set('input', options.input);
    }

    if (options.config) {
      params.set('config', options.config);
    }

    if (options.contextFilter) {
      params.set('contextFilter', options.contextFilter);
    }

    if (options.qualifierDefaults) {
      params.set('qualifierDefaults', options.qualifierDefaults);
    }

    if (options.resourceTypes) {
      params.set('resourceTypes', options.resourceTypes);
    }

    if (options.maxDistance !== undefined) {
      params.set('maxDistance', options.maxDistance.toString());
    }

    if (options.reduceQualifiers) {
      params.set('reduceQualifiers', 'true');
    }

    if (options.interactive) {
      params.set('interactive', 'true');
    }

    if (options.loadZip) {
      params.set('loadZip', 'true');
    }

    if (options.zipFile) {
      params.set('zipFile', options.zipFile);
    }

    if (options.zipPath) {
      params.set('zipPath', options.zipPath);
    }

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Determines if a ZIP archive should be created based on the options
   */
  private _shouldCreateZip(options: IBrowseOptions): boolean {
    // Create ZIP if input or config are file paths (not predefined names)
    const hasFilePath = (path: string | undefined): boolean => {
      if (!path) return false;
      // Check if it's a file path (contains directory separators or file extensions)
      return path.includes('/') || path.includes('\\') || (path.includes('.') && !path.startsWith('.'));
    };

    return hasFilePath(options.input) || hasFilePath(options.config);
  }

  /**
   * Creates a ZIP archive containing the input and config files
   */
  private async _createZipArchive(
    options: IBrowseOptions
  ): Promise<Result<{ zipPath: string; manifest: any }>> {
    try {
      return await zipArchiver.createArchive({
        input: options.input,
        config: options.config
      });
    } catch (error) {
      return fail(`Failed to create ZIP archive: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
