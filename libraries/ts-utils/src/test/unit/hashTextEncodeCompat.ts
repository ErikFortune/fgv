/*
 * Copyright (c) 2025 Erik Fortune
 */

import '../helpers/jest';

import { Crc32Normalizer } from '../../packlets/hash';

describe('Crc32Normalizer TextEncoder/Buffer compatibility', () => {
  test('falls back to a non-TextEncoder path when TextEncoder is unavailable', () => {
    const expected = Crc32Normalizer.crc32Hash(['hello']);

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const g = globalThis as unknown as { TextEncoder?: unknown };
    const originalTextEncoder = g.TextEncoder;
    try {
      delete g.TextEncoder;

      const actual = Crc32Normalizer.crc32Hash(['hello']);
      expect(actual).toEqual(expected);
    } finally {
      // Restore environment
      g.TextEncoder = originalTextEncoder;
    }
  });
});
