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

/**
 * JSON representation of ZIP archive input information
 * @public
 */
export interface IZipArchiveInputInfo {
  /** Type of input (file or directory) */
  type: 'file' | 'directory';
  /** Original file/directory path */
  originalPath: string;
  /** Path within the archive (e.g., "input/mydir") */
  archivePath: string;
}

/**
 * JSON representation of ZIP archive config information
 * @public
 */
export interface IZipArchiveConfigInfo {
  /** Type of config (always 'file') */
  type: 'file';
  /** Original config file path */
  originalPath: string;
  /** Path within the archive (e.g., "config.json") */
  archivePath: string;
}

/**
 * JSON representation of a ZIP archive manifest
 * Compatible with existing tools from ts-res-browser-cli
 * @public
 */
export interface IZipArchiveManifest {
  /** Archive creation timestamp */
  timestamp: string;

  /** Optional input source information */
  input?: IZipArchiveInputInfo;

  /** Optional configuration file information */
  config?: IZipArchiveConfigInfo;
}

/**
 * JSON representation of an imported file
 * @public
 */
export interface IImportedFile {
  /** File name */
  name: string;
  /** Full path within archive */
  path: string;
  /** File content as string */
  content: string;
  /** MIME type */
  type: string;
}

/**
 * JSON representation of an imported directory structure
 * @public
 */
export interface IImportedDirectory {
  /** Directory name */
  name: string;
  /** Files in this directory */
  files: IImportedFile[];
  /** Subdirectories */
  subdirectories: IImportedDirectory[];
}
