/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Failure, Success } from '../../packlets/base';

/**
 * `orDefaultWith` — the deferring sibling of `orDefault`.
 *
 * In its own file rather than appended to `result.test.ts`, which sits 11 lines
 * under the 2000-line `max-lines` cap; that cap is a CI failure rather than a
 * warning, because `rush rebuild` exits non-zero on SUCCESS WITH WARNINGS while
 * a per-project `rushx lint` exits 0.
 */
describe('Result orDefaultWith', () => {
  describe('Success', () => {
    test('returns the value and never invokes the callback', () => {
      const s = new Success('hello');
      let calls = 0;
      expect(
        s.orDefaultWith(() => {
          calls++;
          return 'default';
        })
      ).toEqual('hello');
      // The whole point: the default is not computed on the success path.
      expect(calls).toBe(0);
    });

    test('invokes the callback for a Success carrying undefined', () => {
      // Behaviourally identical to orDefault(dflt), which also treats an
      // undefined value as absent — switching between them must change only
      // WHEN the default is computed, never WHICH value comes back.
      const s = new Success<string | undefined>(undefined);
      let calls = 0;
      expect(
        s.orDefaultWith(() => {
          calls++;
          return 'default';
        })
      ).toEqual('default');
      expect(calls).toBe(1);
    });

    test('agrees with orDefault on every input, differing only in when', () => {
      const cases: ReadonlyArray<string | undefined> = ['hello', undefined];
      for (const value of cases) {
        const a = new Success<string | undefined>(value);
        const b = new Success<string | undefined>(value);
        expect(a.orDefaultWith(() => 'default')).toEqual(b.orDefault('default'));
      }
    });
  });

  describe('Failure', () => {
    test('invokes the callback and returns its value', () => {
      const f = new Failure<string>('oops');
      let calls = 0;
      expect(
        f.orDefaultWith(() => {
          calls++;
          return 'default';
        })
      ).toEqual('default');
      expect(calls).toBe(1);
    });

    test('agrees with orDefault', () => {
      const f = new Failure<string>('oops');
      expect(f.orDefaultWith(() => 'default')).toEqual(new Failure<string>('oops').orDefault('default'));
    });
  });
});
