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
 * Test utilities for mocking browser APIs
 */

/**
 * Mock file data structure
 */
export interface MockFileData {
  name: string;
  content: string;
  type?: string;
  lastModified?: number;
  webkitRelativePath?: string;
}

/**
 * Create a mock File object with all necessary properties and methods
 */
export function createMockFile(data: MockFileData): File {
  const blob = new Blob([data.content], { type: data.type || 'text/plain' });
  const file = new File([blob], data.name, {
    type: data.type || 'text/plain',
    lastModified: data.lastModified || Date.now()
  });

  // Add webkitRelativePath if provided (for directory uploads)
  if (data.webkitRelativePath) {
    Object.defineProperty(file, 'webkitRelativePath', {
      value: data.webkitRelativePath,
      writable: false,
      configurable: true
    });
  }

  // Ensure text() method works properly
  if (!file.text || typeof file.text !== 'function') {
    Object.defineProperty(file, 'text', {
      value: () => Promise.resolve(data.content),
      writable: false,
      configurable: true
    });
  }

  return file;
}

/**
 * Create a mock FileList using DataTransfer API
 * This is the most reliable method for creating FileList objects in tests
 */
export function createMockFileList(files: MockFileData[]): FileList {
  // Use DataTransfer to create a proper FileList
  const dt = new DataTransfer();

  files.forEach((fileData) => {
    const file = createMockFile(fileData);
    dt.items.add(file);
  });

  return dt.files;
}

/**
 * Create a mock FileList for directory upload simulation
 * Includes webkitRelativePath for each file
 */
export function createMockDirectoryFileList(
  directoryStructure: Array<{ path: string; content: string; type?: string }>
): FileList {
  const files = directoryStructure.map((item) => ({
    name: item.path.split('/').pop() || '',
    content: item.content,
    type: item.type,
    webkitRelativePath: item.path
  }));

  return createMockFileList(files);
}

/**
 * Helper to create a promise that resolves after a delay
 * Useful for testing async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper to verify File API text() method works correctly
 * Since we're using Blob/File polyfills, this ensures they have the right methods
 */
export async function verifyFileAPI(file: File): Promise<boolean> {
  try {
    // Check if text() method exists and works
    if (typeof file.text !== 'function') {
      throw new Error('File.text() method not available');
    }

    const text = await file.text();
    return typeof text === 'string';
  } catch {
    return false;
  }
}

/**
 * Mock Web Crypto digest result for testing
 * Creates a deterministic hash-like ArrayBuffer
 */
export function createMockDigest(input: string, algorithm: string = 'SHA-256'): ArrayBuffer {
  // Create a deterministic "hash" based on input for testing
  // This is not a real hash but good enough for testing
  const hashLength = algorithm.includes('256') ? 32 : algorithm.includes('512') ? 64 : 20;
  const buffer = new ArrayBuffer(hashLength);
  const view = new Uint8Array(buffer);

  // Fill with deterministic values based on input
  for (let i = 0; i < hashLength; i++) {
    view[i] = (input.charCodeAt(i % input.length) + i) % 256;
  }

  return buffer;
}

/**
 * Convert ArrayBuffer to hex string for comparison in tests
 */
export function arrayBufferToHex(buffer: ArrayBuffer): string {
  const view = new Uint8Array(buffer);
  return Array.from(view)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
