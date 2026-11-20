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

import {
  type IAddressPolicy,
  allowAnyAddressPolicy,
  blockPrivateNetworksPolicy
} from '../../../packlets/safer-fetch';

describe('blockPrivateNetworksPolicy', () => {
  const policy: IAddressPolicy = blockPrivateNetworksPolicy();

  test('is named for the posture it implements', () => {
    expect(policy.name).toBe('blockPrivateNetworksPolicy');
    expect(blockPrivateNetworksPolicy({}).name).toBe('blockPrivateNetworksPolicy');
    expect(blockPrivateNetworksPolicy({ allowLoopback: false }).name).toBe('blockPrivateNetworksPolicy');
    expect(blockPrivateNetworksPolicy({ allowLoopback: true }).name).toBe(
      'blockPrivateNetworksPolicy(allowLoopback)'
    );
  });

  describe('addresses it permits', () => {
    test.each([
      ['8.8.8.8'],
      ['93.184.216.34'],
      ['100.128.0.1'],
      ['172.32.0.1'],
      ['169.255.0.1'],
      ['2606:4700::1111'],
      ['::ffff:8.8.8.8'],
      ['64:ff9b::8.8.8.8'],
      ['2002:5db8:d822::1'],
      ['010.0.0.1'],
      ['134744072']
    ])('permits %s', (address) => {
      expect(policy.checkAddresses([address])).toSucceedAndSatisfy((verdict) => {
        expect(verdict.policy).toBe('blockPrivateNetworksPolicy');
        expect(verdict.addresses).toHaveLength(1);
        expect(verdict.addresses[0].classification).toBe('public');
      });
    });

    test('permits a list in which every address is public, preserving order', () => {
      expect(policy.checkAddresses(['8.8.8.8', '1.1.1.1', '2606:4700::1111'])).toSucceedAndSatisfy(
        (verdict) => {
          expect(verdict.addresses.map((a) => a.canonical)).toEqual([
            '8.8.8.8',
            '1.1.1.1',
            '2606:4700::1111'
          ]);
        }
      );
    });
  });

  describe('addresses it blocks', () => {
    test.each([
      ['127.0.0.1', /loopback/i],
      ['127.1', /loopback/i],
      ['0177.0.0.1', /loopback/i],
      ['2130706433', /loopback/i],
      ['0x7f.1', /loopback/i],
      ['0.0.0.0', /unspecified/i],
      ['10.0.0.5', /private/i],
      ['172.16.0.1', /private/i],
      ['192.168.1.1', /private/i],
      ['169.254.169.254', /link-local/i],
      ['100.64.0.1', /carrier-grade-nat/i],
      ['198.18.0.1', /benchmarking/i],
      ['192.0.2.1', /documentation/i],
      ['192.0.0.1', /protocol-assignment/i],
      ['224.0.0.1', /multicast/i],
      ['240.0.0.1', /reserved/i],
      ['255.255.255.255', /broadcast/i],
      ['::1', /loopback/i],
      ['::', /unspecified/i],
      ['fe80::1', /link-local/i],
      ['fd00::1', /unique-local/i],
      ['ff02::1', /multicast/i],
      ['2001:db8::1', /documentation/i],
      ['::ffff:169.254.169.254', /link-local/i],
      ['::ffff:127.0.0.1', /loopback/i],
      ['::7f00:1', /loopback/i],
      ['64:ff9b::a9fe:a9fe', /link-local/i],
      ['2002:a9fe:a9fe::', /link-local/i]
    ])('blocks %s', (address, pattern) => {
      expect(policy.checkAddresses([address])).toFailWith(pattern);
      expect(policy.checkAddresses([address])).toFailWith(/blockPrivateNetworksPolicy/);
      expect(policy.checkAddresses([address])).toFailWith(/is not allowed/);
    });

    test('names the embedding when the classification came from an embedded IPv4 address', () => {
      expect(policy.checkAddresses(['::ffff:169.254.169.254'])).toFailWith(/ipv4-mapped 169\.254\.169\.254/);
      expect(policy.checkAddresses(['2002:a9fe:a9fe::'])).toFailWith(/6to4 169\.254\.169\.254/);
      expect(policy.checkAddresses(['64:ff9b::a9fe:a9fe'])).toFailWith(/nat64 169\.254\.169\.254/);
      expect(policy.checkAddresses(['::7f00:1'])).toFailWith(/ipv4-compatible 127\.0\.0\.1/);
    });

    test('reports the canonical form of the address it rejected', () => {
      expect(policy.checkAddresses(['0177.0.0.1'])).toFailWith(/127\.0\.0\.1 is loopback/);
    });
  });

  describe('the list contract is reject-if-any', () => {
    test('rejects when any resolved address is disallowed, not only the first', () => {
      expect(policy.checkAddresses(['8.8.8.8', '169.254.169.254'])).toFailWith(/169\.254\.169\.254/);
      expect(policy.checkAddresses(['169.254.169.254', '8.8.8.8'])).toFailWith(/169\.254\.169\.254/);
      expect(policy.checkAddresses(['8.8.8.8', '1.1.1.1', '10.0.0.1'])).toFailWith(/10\.0\.0\.1/);
    });

    test('reports every disallowed address, not just the first', () => {
      expect(policy.checkAddresses(['10.0.0.1', '8.8.8.8', '127.0.0.1'])).toFailWith(
        /10\.0\.0\.1 is private/
      );
      expect(policy.checkAddresses(['10.0.0.1', '8.8.8.8', '127.0.0.1'])).toFailWith(
        /127\.0\.0\.1 is loopback/
      );
    });

    test('fails when the address list is empty rather than vacuously allowing it', () => {
      expect(policy.checkAddresses([])).toFailWith(/no addresses to check/i);
    });

    test('fails closed when an address is not a well-formed literal', () => {
      expect(policy.checkAddresses(['not-an-address'])).toFailWith(/not a valid IP address/i);
      expect(policy.checkAddresses(['8.8.8.8', '1::2::3'])).toFailWith(/not a valid IPv6 address/i);
      expect(policy.checkAddresses(['not-an-address'])).toFailWith(/blockPrivateNetworksPolicy/);
    });
  });

  describe('allowLoopback', () => {
    const loopbackOk: IAddressPolicy = blockPrivateNetworksPolicy({ allowLoopback: true });

    test.each([['127.0.0.1'], ['127.1'], ['0177.0.0.1'], ['::1'], ['::ffff:127.0.0.1'], ['::7f00:1']])(
      'permits %s',
      (address) => {
        expect(loopbackOk.checkAddresses([address])).toSucceedAndSatisfy((verdict) => {
          expect(verdict.policy).toBe('blockPrivateNetworksPolicy(allowLoopback)');
          expect(verdict.addresses[0].classification).toBe('loopback');
        });
      }
    );

    test('relaxes loopback only — every other range stays blocked', () => {
      expect(loopbackOk.checkAddresses(['169.254.169.254'])).toFailWith(/link-local/i);
      expect(loopbackOk.checkAddresses(['10.0.0.1'])).toFailWith(/private/i);
      expect(loopbackOk.checkAddresses(['0.0.0.0'])).toFailWith(/unspecified/i);
      expect(loopbackOk.checkAddresses(['100.64.0.1'])).toFailWith(/carrier-grade-nat/i);
      expect(loopbackOk.checkAddresses(['fd00::1'])).toFailWith(/unique-local/i);
      expect(loopbackOk.checkAddresses([])).toFailWith(/no addresses to check/i);
    });

    test('still permits public addresses', () => {
      expect(loopbackOk.checkAddresses(['8.8.8.8'])).toSucceed();
    });
  });
});

describe('allowAnyAddressPolicy', () => {
  const policy: IAddressPolicy = allowAnyAddressPolicy();

  test('is named so that the absence of protection is greppable at the call site', () => {
    expect(policy.name).toBe('allowAnyAddressPolicy');
  });

  test.each([
    [['127.0.0.1']],
    [['169.254.169.254']],
    [['::ffff:169.254.169.254']],
    [['10.0.0.1', '8.8.8.8']],
    [['not-an-address']],
    [[]]
  ])('permits %j', (addresses) => {
    expect(policy.checkAddresses(addresses)).toSucceedAndSatisfy((verdict) => {
      expect(verdict.policy).toBe('allowAnyAddressPolicy');
      expect(verdict.addresses).toEqual([]);
    });
  });
});
