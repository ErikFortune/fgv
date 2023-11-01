import '@fgv/ts-utils-jest';
import { Ids } from '../../packlets/core';

describe('core IDs module', () => {
  test.each([
    // cSpell: disable
    ['Denormalized String', 'denormalizedstring'],
    ['1 2 3 TEST', '123test'],
    ['123Test', '123test'],
    ["'N sync", 'nsync'],
    ["N' Sync", 'nsync'],
    [undefined, undefined]
    // cSpell: enable
  ])('%p normalizes to %p', (from, to) => {
    expect(Ids.normalize(from)).toEqual(to);
  });
});
