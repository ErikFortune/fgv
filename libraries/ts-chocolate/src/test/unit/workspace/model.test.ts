// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import '@fgv/ts-utils-jest';

// eslint-disable-next-line @rushstack/packlets/mechanics
import { toLibraryParams, toUserLibraryParams } from '../../../packlets/workspace/model';
import { JournalLibrary } from '../../../packlets/entities';

describe('workspace model helpers', () => {
  // ============================================================================
  // toLibraryParams
  // ============================================================================

  describe('toLibraryParams', () => {
    test('extracts builtin from workspace params', () => {
      const result = toLibraryParams({ builtin: true });
      expect(result.builtin).toBe(true);
    });

    test('extracts builtin: false from workspace params', () => {
      const result = toLibraryParams({ builtin: false });
      expect(result.builtin).toBe(false);
    });

    test('returns undefined builtin when not provided', () => {
      const result = toLibraryParams({});
      expect(result.builtin).toBeUndefined();
    });

    test('extracts libraries from workspace params', () => {
      const mockLibraries = {} as Parameters<typeof toLibraryParams>[0]['libraries'];
      const result = toLibraryParams({ libraries: mockLibraries });
      expect(result.libraries).toBe(mockLibraries);
    });

    test('extracts fileSources from workspace params', () => {
      const mockFileSources = [] as unknown as Parameters<typeof toLibraryParams>[0]['fileSources'];
      const result = toLibraryParams({ fileSources: mockFileSources });
      expect(result.fileSources).toBe(mockFileSources);
    });

    test('extracts logger from workspace params', () => {
      const mockLogger = {} as Parameters<typeof toLibraryParams>[0]['logger'];
      const result = toLibraryParams({ logger: mockLogger });
      expect(result.logger).toBe(mockLogger);
    });

    test('returns empty-ish object for empty params', () => {
      const result = toLibraryParams({});
      expect(result.builtin).toBeUndefined();
      expect(result.fileSources).toBeUndefined();
      expect(result.libraries).toBeUndefined();
      expect(result.logger).toBeUndefined();
    });
  });

  // ============================================================================
  // toUserLibraryParams
  // ============================================================================

  describe('toUserLibraryParams', () => {
    test('maps userFileSources to fileSources', () => {
      const mockFileSources = [] as unknown as Parameters<typeof toUserLibraryParams>[0]['userFileSources'];
      const result = toUserLibraryParams({ userFileSources: mockFileSources });
      expect(result.fileSources).toBe(mockFileSources);
    });

    test('returns undefined libraries when no journals', () => {
      const result = toUserLibraryParams({});
      expect(result.libraries).toBeUndefined();
    });

    test('maps journals to libraries.journals', () => {
      const journals = JournalLibrary.create({ builtin: false }).orThrow();
      const result = toUserLibraryParams({ journals });
      expect(result.libraries).toBeDefined();
      expect(result.libraries!.journals).toBe(journals);
    });

    test('maps logger from workspace params', () => {
      const mockLogger = {} as Parameters<typeof toUserLibraryParams>[0]['logger'];
      const result = toUserLibraryParams({ logger: mockLogger });
      expect(result.logger).toBe(mockLogger);
    });

    test('returns all undefined for empty params', () => {
      const result = toUserLibraryParams({});
      expect(result.fileSources).toBeUndefined();
      expect(result.libraries).toBeUndefined();
      expect(result.logger).toBeUndefined();
    });
  });
});
