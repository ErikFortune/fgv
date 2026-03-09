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

import { BaseLocationId, CollectionId } from '../../../packlets/common';
import { LocationsLibrary, ILocationEntity } from '../../../packlets/entities';

describe('LocationsLibrary', () => {
  const testLocationData: ILocationEntity = {
    baseId: 'kitchen-shelf' as BaseLocationId,
    name: 'Kitchen Shelf',
    description: 'Top shelf of the kitchen cabinet'
  };

  describe('create', () => {
    test('creates empty library with builtin: false', () => {
      expect(LocationsLibrary.create({ builtin: false })).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBe(0);
        expect(lib.collectionCount).toBe(0);
      });
    });

    test('creates library with initial collections', () => {
      expect(
        LocationsLibrary.create({
          builtin: false,
          collections: [
            {
              id: 'test' as CollectionId,
              isMutable: true,
              items: {
                kitchenShelf: testLocationData
              }
            }
          ]
        })
      ).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBe(1);
        expect(lib.collectionCount).toBe(1);
      });
    });

    test('fails when no params (no built-in locations directory)', () => {
      // Locations are user-specific with no built-in data.
      // Creating without builtin: false attempts to load from built-in tree which has no locations dir.
      expect(LocationsLibrary.create()).toFailWith(/locations/i);
    });
  });

  describe('createAsync', () => {
    test('creates empty library with builtin: false', async () => {
      const result = await LocationsLibrary.createAsync({ builtin: false });
      expect(result).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBe(0);
        expect(lib.collectionCount).toBe(0);
      });
    });

    test('creates library with initial collections', async () => {
      const result = await LocationsLibrary.createAsync({
        builtin: false,
        collections: [
          {
            id: 'test' as CollectionId,
            isMutable: true,
            items: {
              kitchenShelf: testLocationData
            }
          }
        ]
      });
      expect(result).toSucceedAndSatisfy((lib) => {
        expect(lib.size).toBe(1);
        expect(lib.collectionCount).toBe(1);
      });
    });
  });
});
