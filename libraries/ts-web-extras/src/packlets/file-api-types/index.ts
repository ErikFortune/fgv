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
 * File System Access API type definitions and utilities for browser compatibility.
 * @packageDocumentation
 */

// Local type definitions for File System Access API
// Based on https://wicg.github.io/file-system-access/

/**
 * File System Access API methods available on Window
 * @public
 */
export interface IFsAccessApis {
  showDirectoryPicker(options?: ShowDirectoryPickerOptions): Promise<FileSystemDirectoryHandle>;
  showOpenFilePicker(options?: ShowOpenFilePickerOptions): Promise<FileSystemFileHandle[]>;
  showSaveFilePicker(options?: ShowSaveFilePickerOptions): Promise<FileSystemFileHandle>;
}

/**
 * Window interface extended with File System Access API
 * @public
 */
export type WindowWithFsAccess = Window & IFsAccessApis;

/**
 * Base interface for file system handles
 * @public
 */
export interface FileSystemHandle {
  readonly kind: 'file' | 'directory';
  readonly name: string;
  isSameEntry(other: FileSystemHandle): Promise<boolean>;
  queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
}

/**
 * File handle interface
 * @public
 */
export interface FileSystemFileHandle extends FileSystemHandle {
  readonly kind: 'file';
  getFile(): Promise<File>;
  createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>;
}

/**
 * Directory handle interface
 * @public
 */
export interface FileSystemDirectoryHandle extends FileSystemHandle {
  readonly kind: 'directory';
  getDirectoryHandle(
    name: string,
    options?: FileSystemGetDirectoryOptions
  ): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string, options?: FileSystemGetFileOptions): Promise<FileSystemFileHandle>;
  removeEntry(name: string, options?: FileSystemRemoveOptions): Promise<void>;
  resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null>;
  keys(): AsyncIterableIterator<string>;
  values(): AsyncIterableIterator<FileSystemHandle>;
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  [Symbol.asyncIterator](): AsyncIterableIterator<[string, FileSystemHandle]>;
}

/**
 * Permission descriptor for file system handles
 * @public
 */
export interface FileSystemHandlePermissionDescriptor {
  mode?: 'read' | 'readwrite';
}

/**
 * Options for creating writable file streams
 * @public
 */
export interface FileSystemCreateWritableOptions {
  keepExistingData?: boolean;
}

/**
 * Options for getting directory handles
 * @public
 */
export interface FileSystemGetDirectoryOptions {
  create?: boolean;
}

/**
 * Options for getting file handles
 * @public
 */
export interface FileSystemGetFileOptions {
  create?: boolean;
}

/**
 * Options for removing entries
 * @public
 */
export interface FileSystemRemoveOptions {
  recursive?: boolean;
}

/**
 * Writable file stream interface
 * @public
 */
export interface FileSystemWritableFileStream extends WritableStream {
  write(data: BufferSource | Blob | string): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
}

/**
 * Directory picker options
 * @public
 */
export interface ShowDirectoryPickerOptions {
  id?: string;
  mode?: 'read' | 'readwrite';
  startIn?: FileSystemHandle | WellKnownDirectory;
}

/**
 * File picker options
 * @public
 */
export interface ShowOpenFilePickerOptions {
  multiple?: boolean;
  excludeAcceptAllOption?: boolean;
  id?: string;
  startIn?: FileSystemHandle | WellKnownDirectory;
  types?: FilePickerAcceptType[];
}

/**
 * Save file picker options
 * @public
 */
export interface ShowSaveFilePickerOptions {
  excludeAcceptAllOption?: boolean;
  id?: string;
  startIn?: FileSystemHandle | WellKnownDirectory;
  suggestedName?: string;
  types?: FilePickerAcceptType[];
}

/**
 * File picker accept type
 * @public
 */
export interface FilePickerAcceptType {
  description?: string;
  accept: Record<string, string | string[]>;
}

/**
 * Well-known directory type
 * @public
 */
export type WellKnownDirectory = 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';

/**
 * Type guard to check if the browser supports the File System Access API
 * @param window - The window object to check
 * @returns True if the window supports File System Access API
 * @public
 */
export function supportsFileSystemAccess(window: Window): window is WindowWithFsAccess {
  return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window && 'showDirectoryPicker' in window;
}

/**
 * Type guard to check if a FileSystemHandle is a file handle
 * @param handle - The handle to check
 * @returns True if the handle is a FileSystemFileHandle
 * @public
 */
export function isFileHandle(handle: FileSystemHandle): handle is FileSystemFileHandle {
  return handle.kind === 'file';
}

/**
 * Type guard to check if a FileSystemHandle is a directory handle
 * @param handle - The handle to check
 * @returns True if the handle is a FileSystemDirectoryHandle
 * @public
 */
export function isDirectoryHandle(handle: FileSystemHandle): handle is FileSystemDirectoryHandle {
  return handle.kind === 'directory';
}

/**
 * Safely access showOpenFilePicker with proper type checking
 * @param window - The window object
 * @param options - Options for the file picker
 * @returns Promise with file handles or null if not supported
 * @public
 */
export async function safeShowOpenFilePicker(
  window: Window,
  options?: ShowOpenFilePickerOptions
): Promise<FileSystemFileHandle[] | null> {
  if (supportsFileSystemAccess(window)) {
    return window.showOpenFilePicker(options);
  }
  return null;
}

/**
 * Safely access showSaveFilePicker with proper type checking
 * @param window - The window object
 * @param options - Options for the file picker
 * @returns Promise with file handle or null if not supported
 * @public
 */
export async function safeShowSaveFilePicker(
  window: Window,
  options?: ShowSaveFilePickerOptions
): Promise<FileSystemFileHandle | null> {
  if (supportsFileSystemAccess(window)) {
    return window.showSaveFilePicker(options);
  }
  return null;
}

/**
 * Safely access showDirectoryPicker with proper type checking
 * @param window - The window object
 * @param options - Options for the directory picker
 * @returns Promise with directory handle or null if not supported
 * @public
 */
export async function safeShowDirectoryPicker(
  window: Window,
  options?: ShowDirectoryPickerOptions
): Promise<FileSystemDirectoryHandle | null> {
  if (supportsFileSystemAccess(window)) {
    return window.showDirectoryPicker(options);
  }
  return null;
}
