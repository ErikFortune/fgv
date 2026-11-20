/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { IEmbeddedFragment, embeddedFragmentConverter, fragmentLocatorConverter } from '../../../index';

describe('fragmentLocatorConverter', () => {
  test('converts a well-formed span', () => {
    expect(fragmentLocatorConverter.convert({ start: 3, end: 11 })).toSucceedWith({ start: 3, end: 11 });
  });

  test('rejects a non-numeric offset', () => {
    expect(fragmentLocatorConverter.convert({ start: 'nope', end: 11 })).toFailWith(/start/i);
  });

  test('rejects a span missing an offset', () => {
    expect(fragmentLocatorConverter.convert({ start: 3 })).toFailWith(/end/i);
  });
});

describe('embeddedFragmentConverter', () => {
  const vector: Float32Array = Float32Array.from([1, 0, 0]);

  describe('identity invariant', () => {
    test('accepts a fragment identified only by its locator', () => {
      expect(
        embeddedFragmentConverter.convert({ locator: { start: 0, end: 4 }, vector })
      ).toSucceedAndSatisfy((fragment: IEmbeddedFragment) => {
        expect(fragment.locator).toEqual({ start: 0, end: 4 });
        expect(fragment.fragmentId).toBeUndefined();
      });
    });

    test('accepts a fragment identified only by its fragmentId', () => {
      expect(embeddedFragmentConverter.convert({ fragmentId: 'frag-7', vector })).toSucceedAndSatisfy(
        (fragment: IEmbeddedFragment) => {
          expect(fragment.fragmentId).toBe('frag-7');
          expect(fragment.locator).toBeUndefined();
        }
      );
    });

    test('accepts a fragment carrying both identities', () => {
      expect(
        embeddedFragmentConverter.convert({ locator: { start: 0, end: 4 }, fragmentId: 'frag-7', vector })
      ).toSucceedAndSatisfy((fragment: IEmbeddedFragment) => {
        expect(fragment.locator).toEqual({ start: 0, end: 4 });
        expect(fragment.fragmentId).toBe('frag-7');
      });
    });

    test('rejects a fragment carrying neither identity', () => {
      expect(embeddedFragmentConverter.convert({ vector })).toFailWith(
        /at least one of .locator. or .fragmentId./i
      );
    });
  });

  describe('field validation', () => {
    test('rejects a vector that is not a Float32Array', () => {
      expect(embeddedFragmentConverter.convert({ fragmentId: 'frag-7', vector: [1, 0, 0] })).toFailWith(
        /Float32Array/i
      );
    });

    test('rejects a missing vector', () => {
      expect(embeddedFragmentConverter.convert({ fragmentId: 'frag-7' })).toFailWith(/vector/i);
    });

    test('rejects a non-string fragmentId', () => {
      expect(embeddedFragmentConverter.convert({ fragmentId: 7, vector })).toFailWith(/fragmentId/i);
    });

    test('rejects a malformed locator', () => {
      expect(embeddedFragmentConverter.convert({ locator: { start: 0 }, vector })).toFailWith(/locator/i);
    });
  });
});
