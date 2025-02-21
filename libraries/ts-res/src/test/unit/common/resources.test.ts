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

import '@fgv/ts-utils-jest';
import * as TsRes from '../../../index';

const validIdentifiers: string[] = [
  'abc',
  '_a10',
  'this-is-an-identifier',
  '_This_Is_Also-An_Identifier10',
  'A'
];

const invalidIdentifiers: string[] = [
  '',
  ' not_an_identifier',
  'also not an identifier',
  '1not_identifier',
  'rats!'
];

const validResourceIds: { id: string; parts: string[] }[] = [
  { id: 'resource', parts: ['resource'] },
  { id: 'some.resource.path', parts: ['some', 'resource', 'path'] },
  { id: 'a.resource.with_underscores', parts: ['a', 'resource', 'with_underscores'] }
];

describe('common resources', () => {
  test.each(validIdentifiers)('%s is valid as ResourceName and ResourceTypeName', (identifier) => {
    expect(TsRes.Validate.isValidResourceName(identifier)).toBe(true);
    expect(TsRes.Validate.isValidResourceTypeName(identifier)).toBe(true);
    expect(TsRes.Validate.toResourceName(identifier)).toSucceedWith(identifier as TsRes.ResourceName);
    expect(TsRes.Validate.toResourceTypeName(identifier)).toSucceedWith(identifier as TsRes.ResourceTypeName);
  });

  test.each(invalidIdentifiers)('%s is not a valid ResourceName and ResourceTypeName', (identifier) => {
    expect(TsRes.Validate.isValidResourceName(identifier)).toBe(false);
    expect(TsRes.Validate.isValidResourceTypeName(identifier)).toBe(false);
    expect(TsRes.Validate.toResourceName(identifier)).toFailWith(/not a valid resource name/i);
    expect(TsRes.Validate.toResourceTypeName(identifier)).toFailWith(/not a valid resource type name/i);
  });

  test.each([0, 1, 10, 100])('%s is a valid index for various resource collectibles', (index) => {
    expect(TsRes.Validate.isValidResourceIndex(index)).toBe(true);
    expect(TsRes.Validate.isValidResourceTypeIndex(index)).toBe(true);
    expect(TsRes.Validate.toResourceIndex(index)).toSucceedWith(index as TsRes.ResourceIndex);
    expect(TsRes.Validate.toResourceTypeIndex(index)).toSucceedWith(index as TsRes.ResourceTypeIndex);
  });

  test.each([-1, -10, -100])('%s is not a valid index for various resource collectibles', (index) => {
    expect(TsRes.Validate.isValidResourceIndex(index)).toBe(false);
    expect(TsRes.Validate.isValidResourceTypeIndex(index)).toBe(false);
    expect(TsRes.Validate.toResourceIndex(index)).toFailWith(/not a valid resource index/i);
    expect(TsRes.Validate.toResourceTypeIndex(index)).toFailWith(/not a valid resource type index/i);
  });

  test.each(['resource', 'some.resource.path', 'a.resource.with_underscores'])(
    '%s is a valid ResourceId',
    (id) => {
      expect(TsRes.Validate.isValidResourceId(id)).toBe(true);
      expect(TsRes.Validate.toResourceId(id)).toSucceedWith(id as TsRes.ResourceId);
    }
  );

  test.each([
    '',
    'resource.',
    '.resource',
    'resource..path',
    'resource.path.',
    'resource.path..',
    'resource.path..id',
    'resource.path.id.',
    'resource.path.id..',
    'resource.path.id..extra'
  ])('%s is not a valid ResourceId', (id) => {
    expect(TsRes.Validate.isValidResourceId(id)).toBe(false);
    expect(TsRes.Validate.toResourceId(id)).toFailWith(/not a valid resource id/i);
  });

  describe('splitResourceId', () => {
    test.each(validResourceIds)('splits %s into %o', (tc) => {
      expect(TsRes.Validate.splitResourceId(tc.id as TsRes.ResourceId)).toSucceedWith(
        tc.parts as TsRes.ResourceName[]
      );
    });

    test.each([
      '',
      'resource.',
      '.resource',
      'resource..path',
      'resource.path.',
      'resource+path',
      'resource/path'
    ])('fails for invalid id %s', (id) => {
      expect(TsRes.Validate.splitResourceId(id as TsRes.ResourceId)).toFailWith(/not a valid resource/i);
    });
  });

  describe('joinResourceIds', () => {
    test.each(validResourceIds)('joins %o into %s', (tc) => {
      expect(TsRes.Validate.joinResourceIds('foo', ...(tc.parts as TsRes.ResourceName[]))).toSucceedWith(
        `foo.${tc.id}` as TsRes.ResourceId
      );
    });

    test('fails if any part is invalid', () => {
      expect(TsRes.Validate.joinResourceIds('foo', 'bar', 'b@z')).toFailWith(/not a valid resource/i);
    });

    test('fails if resulting id is empty', () => {
      expect(TsRes.Validate.joinResourceIds(undefined, undefined)).toFailWith(/not a valid resource/i);
    });
  });

  describe('joinOptionalResourceIds', () => {
    test.each(validResourceIds)('joins %o into %s', (tc) => {
      expect(
        TsRes.Validate.joinOptionalResourceIds('foo', ...(tc.parts as TsRes.ResourceName[]))
      ).toSucceedWith(`foo.${tc.id}` as TsRes.ResourceId);
    });

    test('fails if any part is invalid', () => {
      expect(TsRes.Validate.joinOptionalResourceIds('foo', 'bar', 'b@z')).toFailWith(/not a valid resource/i);
    });

    test('returns undefined if resulting id is empty', () => {
      expect(TsRes.Validate.joinOptionalResourceIds(undefined, undefined)).toSucceedWith(undefined);
    });
  });
});
