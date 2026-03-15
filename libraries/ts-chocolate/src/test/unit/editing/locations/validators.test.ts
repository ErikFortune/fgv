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
import { BaseLocationId } from '../../../../index';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  validateLocationName,
  validateLocationEntity
} from '../../../../packlets/editing/locations/validators';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { createBlankLocationEntity } from '../../../../packlets/entities/locations/model';

describe('validateLocationName', () => {
  test('should succeed for valid name', () => {
    const location = createBlankLocationEntity('test' as BaseLocationId, 'Kitchen Shelf');
    expect(validateLocationName(location)).toSucceed();
  });

  test('should fail for empty name', () => {
    const location = createBlankLocationEntity('test' as BaseLocationId, '');
    expect(validateLocationName(location)).toFailWith(/name must not be empty/i);
  });

  test('should fail for whitespace-only name', () => {
    const location = createBlankLocationEntity('test' as BaseLocationId, '   ');
    expect(validateLocationName(location)).toFailWith(/name must not be empty/i);
  });
});

describe('validateLocationEntity', () => {
  test('should succeed for valid entity', () => {
    const location = createBlankLocationEntity('test' as BaseLocationId, 'Kitchen Shelf');
    expect(validateLocationEntity(location)).toSucceedAndSatisfy((result) => {
      expect(result.baseId).toBe('test');
      expect(result.name).toBe('Kitchen Shelf');
    });
  });

  test('should fail for invalid entity', () => {
    const location = createBlankLocationEntity('test' as BaseLocationId, '');
    expect(validateLocationEntity(location)).toFail();
  });
});
