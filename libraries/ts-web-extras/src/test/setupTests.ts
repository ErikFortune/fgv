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

import { webcrypto } from 'crypto';
import { TextEncoder, TextDecoder } from 'util';

// Setup Web Crypto API using Node.js webcrypto
Object.defineProperty(global, 'crypto', {
  value: webcrypto,
  writable: true,
  configurable: true
});

// Setup TextEncoder/TextDecoder for Node environment
Object.defineProperty(global, 'TextEncoder', {
  value: TextEncoder,
  writable: true,
  configurable: true
});

Object.defineProperty(global, 'TextDecoder', {
  value: TextDecoder,
  writable: true,
  configurable: true
});

// Mock DataTransfer for File API testing
class MockDataTransfer {
  items: { add: (file: File) => void };
  files: FileList;

  constructor() {
    const fileArray: File[] = [];

    this.items = {
      add: (file: File) => {
        fileArray.push(file);
        this.files = createFileList(fileArray);
      }
    };

    this.files = createFileList([]);
  }
}

function createFileList(files: File[]): FileList {
  const fileList = {
    length: files.length,
    item: (index: number) => files[index] || null,
    [Symbol.iterator]: function* () {
      for (const file of files) {
        yield file;
      }
    }
  };

  for (let i = 0; i < files.length; i++) {
    (fileList as unknown as Record<number, File>)[i] = files[i];
  }

  return fileList as unknown as FileList;
}

Object.defineProperty(global, 'DataTransfer', {
  value: MockDataTransfer,
  writable: true,
  configurable: true
});
