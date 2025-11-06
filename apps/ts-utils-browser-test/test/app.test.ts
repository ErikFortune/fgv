import { describe, expect, test } from 'vitest';

describe('Vite app imports @fgv/ts-utils safely', () => {
  test('dynamic import of app works even if TextEncoder is missing', async () => {
    const originalTextEncoder = (globalThis as unknown as { TextEncoder?: unknown }).TextEncoder;
    try {
      // Simulate consumer environment where TextEncoder is not defined
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (globalThis as unknown as { TextEncoder?: unknown }).TextEncoder;

      const mod = await import('../src/main');
      const res = mod.exercisePacklets();
      expect(res.validationOk).toBe(true);
      expect(res.converted).toBe('123');
      expect(res.collectionSize).toBe(1);
      expect(typeof res.hash).toBe('string');
      expect(res.hash.length).toBe(8);
    } finally {
      (globalThis as unknown as { TextEncoder?: unknown }).TextEncoder = originalTextEncoder;
    }
  });
});
