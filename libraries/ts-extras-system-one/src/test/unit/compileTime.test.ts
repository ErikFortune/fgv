/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { askSystemOne, type ISystemOneClient } from '../../index';
import { shortChoice } from './fixtures';

describe('compile-time contract', () => {
  test('U8 inputLimit is mandatory and there is no per-call URL', () => {
    // Never called: these lines exist for the compiler. Each `@ts-expect-error` fails the build if
    // its line ever compiles.
    const neverCalled = (client: ISystemOneClient): ReadonlyArray<Promise<unknown>> => [
      // @ts-expect-error inputLimit is required
      askSystemOne(client, { state: 's', questions: { q: shortChoice() } }),
      askSystemOne(client, {
        state: 's',
        questions: { q: shortChoice() },
        inputLimit: 'unchecked',
        // @ts-expect-error there is no per-call URL
        baseUrl: 'http://elsewhere.test'
      })
    ];
    expect(typeof neverCalled).toBe('function');
  });
});
