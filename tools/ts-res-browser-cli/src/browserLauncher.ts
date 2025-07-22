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

import { exec, spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as http from 'http';
import { Result, succeed, fail } from '@fgv/ts-utils';
import { IBrowseOptions } from './options';
import { zipArchiver } from './zipArchiver';
import * as fs from 'fs';

/**
 * Manages launching the browser application with specified options
 */
export class BrowserLauncher {
  private _devServer?: ChildProcess;
  /**
   * Launches the browser with the specified options
   */
  public async launch(options: IBrowseOptions): Promise<Result<void>> {
    try {
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

      // Start development server if requested
      if (finalOptions.dev && !finalOptions.url) {
        if (!finalOptions.quiet) {
          console.log('Starting TS-RES Browser development server...');
        }

        const serverResult = await this._startDevServer(finalOptions);
        if (serverResult.isFailure()) {
          return serverResult;
        }

        // Wait for server to be ready
        const port = options.port || 3000;
        const readyResult = await this._waitForServerReady(port, options.verbose || false);
        if (readyResult.isFailure()) {
          this._stopDevServer();
          return readyResult;
        }

        if (!options.quiet) {
          console.log(`Development server started on port ${port}`);
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
    // Use provided URL or default to localhost
    const baseUrl = options.url || `http://localhost:${options.port || 3000}`;
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
   * Starts the development server for ts-res-browser
   */
  private async _startDevServer(options: IBrowseOptions): Promise<Result<void>> {
    try {
      const port = options.port || 3000;
      const env = { ...process.env, PORT: port.toString() };

      // Detect if we're in a monorepo or using published packages
      const isMonorepo = this._isMonorepoEnvironment();

      if (isMonorepo) {
        // Monorepo development: use rushx from sibling project
        const browserProjectPath = path.resolve(__dirname, '../../ts-res-browser');

        if (options.verbose) {
          console.log(`Looking for ts-res-browser at: ${browserProjectPath}`);
        }

        this._devServer = spawn('rushx', ['dev'], {
          cwd: browserProjectPath,
          env,
          stdio: options.verbose ? 'inherit' : ['ignore', 'pipe', 'pipe']
        });
      } else {
        // Published packages: use serve command since dev requires webpack-cli
        // Use port 8080 for serve command (default serve port)
        const servePort = 8080;

        if (options.verbose) {
          console.log('Using published ts-res-browser package with serve command');
          console.log(`Serving on port ${servePort} (published packages use serve instead of dev)`);
        }

        // For published packages, use serve command
        this._devServer = spawn('npx', ['ts-res-browser', 'serve', servePort.toString()], {
          env,
          stdio: options.verbose ? 'inherit' : ['ignore', 'pipe', 'pipe']
        });

        // Update the port for URL building
        options.port = servePort;
      }

      this._devServer.on('error', (error) => {
        return fail(`Failed to start development server: ${error}`);
      });

      // Give the server a moment to start
      await this._sleep(3000);

      if (this._devServer && !this._devServer.killed) {
        if (options.verbose) {
          console.log('Development server process started successfully');
        }
        return succeed(undefined);
      } else {
        return fail('Development server process failed to start');
      }
    } catch (error) {
      return fail(`Failed to start development server: ${error}`);
    }
  }

  /**
   * Waits for the development server to be ready by checking HTTP availability
   */
  private async _waitForServerReady(
    port: number,
    verbose: boolean,
    maxAttempts: number = 60
  ): Promise<Result<void>> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const isReady = await this._checkServerHealth(port);
        if (isReady) {
          if (verbose) {
            console.log(`Server is ready at http://localhost:${port}`);
          }
          return succeed(undefined);
        }
      } catch (error) {
        // Server not ready yet, continue waiting
      }

      if (verbose && attempt % 10 === 0) {
        console.log(`Waiting for server to be ready... (attempt ${attempt}/${maxAttempts})`);
      }

      await this._sleep(1000);
    }

    return fail(`Server did not become ready after ${maxAttempts} attempts`);
  }

  /**
   * Checks if the server is responding
   */
  private async _checkServerHealth(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const request = http.get(`http://localhost:${port}`, (res) => {
        resolve(res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 400);
      });

      request.on('error', () => {
        resolve(false);
      });

      request.setTimeout(3000, () => {
        request.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Stops the development server
   */
  private _stopDevServer(): void {
    if (this._devServer && !this._devServer.killed) {
      this._devServer.kill('SIGTERM');
      setTimeout(() => {
        if (this._devServer && !this._devServer.killed) {
          this._devServer.kill('SIGKILL');
        }
      }, 5000);
    }
  }

  /**
   * Sleep for the specified number of milliseconds
   */
  private _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Detects if we're running in a monorepo environment
   */
  private _isMonorepoEnvironment(): boolean {
    try {
      // Check if we have a rush.json file in parent directories (indicating monorepo)
      let currentDir = __dirname;
      for (let i = 0; i < 5; i++) {
        // Look up to 5 levels up
        const rushJsonPath = path.join(currentDir, 'rush.json');
        if (fs.existsSync(rushJsonPath)) {
          return true;
        }
        currentDir = path.dirname(currentDir);
      }

      // Also check if ts-res-browser sibling directory exists
      const browserProjectPath = path.resolve(__dirname, '../../ts-res-browser');
      return (
        fs.existsSync(browserProjectPath) && fs.existsSync(path.join(browserProjectPath, 'package.json'))
      );
    } catch {
      return false;
    }
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

  /**
   * Graceful shutdown - stops development server if running
   */
  public shutdown(): void {
    this._stopDevServer();
  }
}
