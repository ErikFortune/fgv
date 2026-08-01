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
  type AddressClassification,
  type AddressFamily,
  type IEmbeddedIpv4,
  classifyAddress
} from '../../../packlets/safer-fetch';

interface ICase {
  readonly address: string;
  readonly classification: AddressClassification;
  readonly canonical?: string;
  readonly family?: AddressFamily;
  readonly embeddedIpv4?: IEmbeddedIpv4;
}

function expectClassification(testCase: ICase): void {
  expect(classifyAddress(testCase.address)).toSucceedAndSatisfy((classified) => {
    expect(classified.classification).toBe(testCase.classification);
    expect(classified.address).toBe(testCase.address);
    expect(classified.family).toBe(testCase.family ?? 'ipv4');
    if (testCase.canonical !== undefined) {
      expect(classified.canonical).toBe(testCase.canonical);
    }
    expect(classified.embeddedIpv4).toEqual(testCase.embeddedIpv4);
  });
}

function runCases(cases: ReadonlyArray<ICase>): void {
  for (const testCase of cases) {
    test(`${testCase.address} classifies as ${testCase.classification}`, () => {
      expectClassification(testCase);
    });
  }
}

describe('classifyAddress', () => {
  describe('IPv4 special-purpose ranges, at their boundaries', () => {
    // Every rejected range from the threat model's § 3.6 table is tested at both
    // edges, and the addresses immediately below and above each range are tested
    // as public. A classifier that rejects everything passes a one-directional
    // suite and would push consumers straight to `allowAnyAddress()`.
    runCases([
      { address: '0.0.0.0', classification: 'unspecified' },
      { address: '0.255.255.255', classification: 'unspecified' },
      { address: '1.0.0.0', classification: 'public' },

      { address: '9.255.255.255', classification: 'public' },
      { address: '10.0.0.0', classification: 'private' },
      { address: '10.1.2.3', classification: 'private' },
      { address: '10.255.255.255', classification: 'private' },
      { address: '11.0.0.0', classification: 'public' },

      // CGNAT: 100.64.0.0/10 is 100.64.0.0 - 100.127.255.255. Off-by-one on the
      // mask is the classic error, so both edges plus both neighbours are here.
      { address: '100.63.255.255', classification: 'public' },
      { address: '100.64.0.0', classification: 'carrier-grade-nat' },
      { address: '100.64.0.1', classification: 'carrier-grade-nat' },
      { address: '100.127.255.255', classification: 'carrier-grade-nat' },
      { address: '100.128.0.0', classification: 'public' },
      { address: '100.128.0.1', classification: 'public' },

      { address: '126.255.255.255', classification: 'public' },
      { address: '127.0.0.0', classification: 'loopback' },
      { address: '127.0.0.1', classification: 'loopback' },
      { address: '127.255.255.255', classification: 'loopback' },
      { address: '128.0.0.0', classification: 'public' },

      // Link-local carries the cloud instance-metadata endpoint.
      { address: '169.253.255.255', classification: 'public' },
      { address: '169.254.0.0', classification: 'link-local' },
      { address: '169.254.169.254', classification: 'link-local' },
      { address: '169.254.255.255', classification: 'link-local' },
      { address: '169.255.0.0', classification: 'public' },

      { address: '172.15.255.255', classification: 'public' },
      { address: '172.16.0.0', classification: 'private' },
      { address: '172.31.255.255', classification: 'private' },
      { address: '172.32.0.0', classification: 'public' },

      { address: '192.0.0.0', classification: 'protocol-assignment' },
      { address: '192.0.0.255', classification: 'protocol-assignment' },
      { address: '192.0.1.0', classification: 'public' },
      { address: '192.0.2.0', classification: 'documentation' },
      { address: '192.0.2.255', classification: 'documentation' },
      { address: '192.0.3.0', classification: 'public' },

      { address: '192.88.98.255', classification: 'public' },
      { address: '192.88.99.1', classification: 'reserved' },
      { address: '192.88.100.0', classification: 'public' },

      { address: '192.167.255.255', classification: 'public' },
      { address: '192.168.0.0', classification: 'private' },
      { address: '192.168.255.255', classification: 'private' },
      { address: '192.169.0.0', classification: 'public' },

      { address: '198.17.255.255', classification: 'public' },
      { address: '198.18.0.0', classification: 'benchmarking' },
      { address: '198.19.255.255', classification: 'benchmarking' },
      { address: '198.20.0.0', classification: 'public' },

      { address: '198.51.99.255', classification: 'public' },
      { address: '198.51.100.5', classification: 'documentation' },
      { address: '198.51.101.0', classification: 'public' },

      { address: '203.0.112.255', classification: 'public' },
      { address: '203.0.113.5', classification: 'documentation' },
      { address: '203.0.114.0', classification: 'public' },

      { address: '223.255.255.255', classification: 'public' },
      { address: '224.0.0.1', classification: 'multicast' },
      { address: '239.255.255.255', classification: 'multicast' },
      { address: '240.0.0.0', classification: 'reserved' },
      { address: '255.255.255.254', classification: 'reserved' },
      { address: '255.255.255.255', classification: 'broadcast' },

      { address: '8.8.8.8', classification: 'public' },
      { address: '93.184.216.34', classification: 'public' }
    ]);
  });

  describe('IPv4 literal encodings the URL parser accepts', () => {
    // `0177.0.0.1` is `127.0.0.1`; so is `2130706433`. A guard that string-matches
    // on `127.` or `10.` is bypassed by every row here — and, in the other
    // direction, wrongly rejects `010.0.0.1`, which is 8.0.0.1 and public.
    runCases([
      { address: '2130706433', classification: 'loopback', canonical: '127.0.0.1' },
      { address: '0177.0.0.1', classification: 'loopback', canonical: '127.0.0.1' },
      { address: '0x7f.1', classification: 'loopback', canonical: '127.0.0.1' },
      { address: '0x7f000001', classification: 'loopback', canonical: '127.0.0.1' },
      { address: '0X7F000001', classification: 'loopback', canonical: '127.0.0.1' },
      { address: '127.1', classification: 'loopback', canonical: '127.0.0.1' },
      { address: '127.0.1', classification: 'loopback', canonical: '127.0.0.1' },
      { address: '0177.0.0.01', classification: 'loopback', canonical: '127.0.0.1' },
      { address: '127.0.0.1.', classification: 'loopback', canonical: '127.0.0.1' },
      { address: '  127.0.0.1  ', classification: 'loopback', canonical: '127.0.0.1' },

      { address: '2852039166', classification: 'link-local', canonical: '169.254.169.254' },
      { address: '0xa9fea9fe', classification: 'link-local', canonical: '169.254.169.254' },
      { address: '0251.0376.0251.0376', classification: 'link-local', canonical: '169.254.169.254' },
      { address: '169.254.43518', classification: 'link-local', canonical: '169.254.169.254' },

      // Stripping the radix prefix can leave nothing behind, and the WHATWG
      // number parser reads that as zero — so a bare `0x` is `0` and
      // `127.0x.1` is `127.0.0.1`. Rejecting it would leave a live bypass.
      { address: '127.0x.1', classification: 'loopback', canonical: '127.0.0.1' },
      { address: '0177.0x.1', classification: 'loopback', canonical: '127.0.0.1' },
      { address: '0x7f.0X.0x.1', classification: 'loopback', canonical: '127.0.0.1' },
      { address: '0x', classification: 'unspecified', canonical: '0.0.0.0' },
      { address: '169.254.0x.0xfe', classification: 'link-local', canonical: '169.254.0.254' },

      { address: '0x0a.0.0.1', classification: 'private', canonical: '10.0.0.1' },
      { address: '0xc0a80001', classification: 'private', canonical: '192.168.0.1' },
      { address: '0144.100.0.1', classification: 'carrier-grade-nat', canonical: '100.100.0.1' },

      // The other direction: these superficially resemble private literals but
      // are public once the radix rules are applied.
      { address: '010.0.0.1', classification: 'public', canonical: '8.0.0.1' },
      { address: '0172.16.0.1', classification: 'public', canonical: '122.16.0.1' },
      { address: '134744072', classification: 'public', canonical: '8.8.8.8' },
      { address: '0x08080808', classification: 'public', canonical: '8.8.8.8' },
      { address: '4294967295', classification: 'broadcast', canonical: '255.255.255.255' },

      // A trailing dot is stripped and the remaining components are then read
      // with the usual "final component absorbs the rest" rule, which is what
      // the URL parser does: `1.2.3.` is `1.2.0.3`, not `1.2.3.0`.
      { address: '1.2.3.', classification: 'public', canonical: '1.2.0.3' }
    ]);
  });

  describe('IPv6 ranges', () => {
    runCases([
      { address: '::', classification: 'unspecified', canonical: '::', family: 'ipv6' },
      { address: '0:0:0:0:0:0:0:0', classification: 'unspecified', canonical: '::', family: 'ipv6' },
      { address: '::1', classification: 'loopback', canonical: '::1', family: 'ipv6' },
      { address: '[::1]', classification: 'loopback', canonical: '::1', family: 'ipv6' },
      { address: '0:0:0:0:0:0:0:1', classification: 'loopback', canonical: '::1', family: 'ipv6' },

      { address: 'fc00::', classification: 'unique-local', family: 'ipv6' },
      { address: 'fd00::1', classification: 'unique-local', family: 'ipv6' },
      { address: 'fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', classification: 'unique-local', family: 'ipv6' },
      { address: 'fb00::1', classification: 'reserved', family: 'ipv6' },

      { address: 'fe80::1', classification: 'link-local', family: 'ipv6' },
      { address: 'fe80::1%eth0', classification: 'link-local', family: 'ipv6' },
      { address: 'febf:ffff::', classification: 'link-local', family: 'ipv6' },
      { address: 'fec0::1', classification: 'reserved', family: 'ipv6' },
      { address: 'fe00::1', classification: 'reserved', family: 'ipv6' },

      { address: 'ff00::', classification: 'multicast', family: 'ipv6' },
      { address: 'ff02::1', classification: 'multicast', family: 'ipv6' },

      { address: '2001::1', classification: 'protocol-assignment', family: 'ipv6' },
      { address: '2001:1ff:ffff::', classification: 'protocol-assignment', family: 'ipv6' },
      { address: '2001:200::', classification: 'public', family: 'ipv6' },
      { address: '2001:db8::1', classification: 'documentation', family: 'ipv6' },
      { address: '2001:db9::1', classification: 'public', family: 'ipv6' },
      { address: '3fff::1', classification: 'documentation', family: 'ipv6' },
      { address: '3fff:1000::', classification: 'public', family: 'ipv6' },

      // Only 2000::/3 is assigned as global unicast; everything else that
      // matched no special-purpose range is reserved, never public.
      { address: '2606:4700::1111', classification: 'public', family: 'ipv6' },
      { address: '2000::', classification: 'public', family: 'ipv6' },
      { address: '3fff:ffff::', classification: 'public', family: 'ipv6' },
      { address: '1fff::1', classification: 'reserved', family: 'ipv6' },
      { address: '4000::1', classification: 'reserved', family: 'ipv6' },
      { address: '100::1', classification: 'reserved', family: 'ipv6' },
      { address: '64:ff9b::1:0:1', classification: 'reserved', family: 'ipv6' }
    ]);
  });

  describe('IPv6 forms that embed an IPv4 address', () => {
    // The single most common bypass: `::ffff:169.254.169.254` must classify as
    // link-local, not as "some IPv6 address".
    runCases([
      {
        address: '::ffff:169.254.169.254',
        classification: 'link-local',
        canonical: '::ffff:a9fe:a9fe',
        family: 'ipv6',
        embeddedIpv4: { kind: 'ipv4-mapped', address: '169.254.169.254' }
      },
      {
        address: '::ffff:a9fe:a9fe',
        classification: 'link-local',
        canonical: '::ffff:a9fe:a9fe',
        family: 'ipv6',
        embeddedIpv4: { kind: 'ipv4-mapped', address: '169.254.169.254' }
      },
      {
        address: '::FFFF:127.0.0.1',
        classification: 'loopback',
        canonical: '::ffff:7f00:1',
        family: 'ipv6',
        embeddedIpv4: { kind: 'ipv4-mapped', address: '127.0.0.1' }
      },
      {
        address: '::ffff:10.0.0.1',
        classification: 'private',
        family: 'ipv6',
        embeddedIpv4: { kind: 'ipv4-mapped', address: '10.0.0.1' }
      },
      {
        address: '::ffff:100.64.0.1',
        classification: 'carrier-grade-nat',
        family: 'ipv6',
        embeddedIpv4: { kind: 'ipv4-mapped', address: '100.64.0.1' }
      },
      // Other direction: a mapped public address stays public.
      {
        address: '::ffff:8.8.8.8',
        classification: 'public',
        family: 'ipv6',
        embeddedIpv4: { kind: 'ipv4-mapped', address: '8.8.8.8' }
      },
      {
        address: '::ffff:100.128.0.1',
        classification: 'public',
        family: 'ipv6',
        embeddedIpv4: { kind: 'ipv4-mapped', address: '100.128.0.1' }
      },

      // NAT64, RFC 6052 well-known prefix.
      {
        address: '64:ff9b::169.254.169.254',
        classification: 'link-local',
        canonical: '64:ff9b::a9fe:a9fe',
        family: 'ipv6',
        embeddedIpv4: { kind: 'nat64', address: '169.254.169.254' }
      },
      {
        address: '64:ff9b::a9fe:a9fe',
        classification: 'link-local',
        family: 'ipv6',
        embeddedIpv4: { kind: 'nat64', address: '169.254.169.254' }
      },
      {
        address: '64:ff9b::8.8.8.8',
        classification: 'public',
        family: 'ipv6',
        embeddedIpv4: { kind: 'nat64', address: '8.8.8.8' }
      },

      // 6to4 — the IPv4 address lives in bits 16..47, not the low 32.
      {
        address: '2002:a9fe:a9fe::',
        classification: 'link-local',
        family: 'ipv6',
        embeddedIpv4: { kind: '6to4', address: '169.254.169.254' }
      },
      {
        address: '2002:7f00:1::1',
        classification: 'loopback',
        family: 'ipv6',
        embeddedIpv4: { kind: '6to4', address: '127.0.0.1' }
      },
      {
        address: '2002:5db8:d822::1',
        classification: 'public',
        family: 'ipv6',
        embeddedIpv4: { kind: '6to4', address: '93.184.216.34' }
      },

      // Deprecated IPv4-compatible form (`::a.b.c.d`).
      {
        address: '::7f00:1',
        classification: 'loopback',
        family: 'ipv6',
        embeddedIpv4: { kind: 'ipv4-compatible', address: '127.0.0.1' }
      },
      {
        address: '::169.254.169.254',
        classification: 'link-local',
        canonical: '::a9fe:a9fe',
        family: 'ipv6',
        embeddedIpv4: { kind: 'ipv4-compatible', address: '169.254.169.254' }
      },
      {
        address: '::0.0.0.2',
        classification: 'unspecified',
        family: 'ipv6',
        embeddedIpv4: { kind: 'ipv4-compatible', address: '0.0.0.2' }
      },
      {
        address: '::8.8.8.8',
        classification: 'public',
        family: 'ipv6',
        embeddedIpv4: { kind: 'ipv4-compatible', address: '8.8.8.8' }
      },

      // `::ffff:0:0:0/96` (IPv4-translated) is only meaningful inside a
      // translator, so it is rejected outright rather than decoded.
      { address: '::ffff:0:a9fe:a9fe', classification: 'reserved', family: 'ipv6' }
    ]);

    test('the unspecified and loopback addresses are not decoded as IPv4-compatible', () => {
      expect(classifyAddress('::')).toSucceedAndSatisfy((classified) => {
        expect(classified.classification).toBe('unspecified');
        expect(classified.embeddedIpv4).toBeUndefined();
      });
      expect(classifyAddress('::1')).toSucceedAndSatisfy((classified) => {
        expect(classified.classification).toBe('loopback');
        expect(classified.embeddedIpv4).toBeUndefined();
      });
    });
  });

  describe('canonical form', () => {
    test.each([
      ['0:0:0:0:0:0:0:1', '::1'],
      ['0:0:0:0:0:0:0:0', '::'],
      ['2001:0db8:0000:0000:0000:0000:0000:0001', '2001:db8::1'],
      ['2001:DB8::1', '2001:db8::1'],
      // RFC 5952: the leftmost of two equally long zero runs is the one compressed.
      ['2001:db8:0:0:1:0:0:1', '2001:db8::1:0:0:1'],
      ['1:0:0:0:2:0:0:3', '1::2:0:0:3'],
      ['1:2:3:4:5:6:7:8', '1:2:3:4:5:6:7:8'],
      // RFC 5952: a single zero group is never compressed.
      ['0:1:2:3:4:5:6:7', '0:1:2:3:4:5:6:7'],
      ['1:2:3:4:5:6:7:0', '1:2:3:4:5:6:7:0'],
      ['ff00::', 'ff00::'],
      ['::ffff:1.2.3.4', '::ffff:102:304']
    ])('%s canonicalizes to %s', (address, canonical) => {
      expect(classifyAddress(address)).toSucceedAndSatisfy((classified) => {
        expect(classified.canonical).toBe(canonical);
      });
    });

    test('an IPv4 literal canonicalizes to dotted-quad regardless of the form supplied', () => {
      expect(classifyAddress('0x7f.1')).toSucceedAndSatisfy((classified) => {
        expect(classified.canonical).toBe('127.0.0.1');
        expect(classified.address).toBe('0x7f.1');
      });
    });
  });

  describe('input that is not an IP address literal', () => {
    test.each([
      ['', /empty/i],
      ['   ', /empty/i],
      ['[]', /empty/i],
      // A zone identifier belongs to IPv6 only, so this must fail rather than
      // be read as 8.8.8.8.
      ['%eth0', /not a valid IP address/i],
      ['8.8.8.8%eth0', /not a valid IP address/i],
      ['127.0.0.1%eth0', /not a valid IP address/i],
      ['example.com', /not a valid IP address/i],
      ['localhost', /not a valid IP address/i],
      ['LOCALHOST.', /not a valid IP address/i],
      ['metadata.google.internal', /not a valid IP address/i],
      ['1.2.3.4.5', /not a valid IP address/i],
      ['256.0.0.1', /not a valid IP address/i],
      ['1.2.3.256', /not a valid IP address/i],
      ['08.0.0.1', /not a valid IP address/i],
      ['0xzz', /not a valid IP address/i],
      ['-1.0.0.1', /not a valid IP address/i],
      ['1.2..3', /not a valid IP address/i],
      ['.', /not a valid IP address/i],
      ['..', /not a valid IP address/i],
      ['4294967296', /not a valid IP address/i],
      ['999999999999999999999999', /not a valid IP address/i],
      ['127.0.0.1/8', /not a valid IP address/i]
    ])('%s fails', (address, pattern) => {
      expect(classifyAddress(address)).toFailWith(pattern);
    });

    test.each([
      ['1::2::3'],
      [':::'],
      ['::1::'],
      ['1:2:3:4:5:6:7'],
      ['1:2:3:4:5:6:7:8:9'],
      ['1:2:3:4:5:6:7:8::'],
      ['12345::'],
      ['gggg::1'],
      ['::ffff:0177.0.0.1'],
      ['::ffff:127.0.0.1.5'],
      ['::1.2.3'],
      ['::1.2.3.256'],
      ['::0x7f.0.0.1'],
      ['1.2.3.4:5'],
      ['::1.2.3.4:5'],
      // An embedded IPv4 tail may only end the whole address, so this is
      // malformed rather than `102:304::`.
      ['1.2.3.4::'],
      ['1.2.3.4::5'],
      ['1:2:1.2.3.4::5'],
      ['[::1'],
      ['::1]'],
      [':1:2:3:4:5:6:7:8'],
      ['1:2:3:4:5:6:7:8:'],
      [':']
    ])('%s fails as an IPv6 literal', (address) => {
      expect(classifyAddress(address)).toFailWith(/not a valid IPv6 address literal/i);
    });

    test('the failing message quotes the address exactly as supplied', () => {
      expect(classifyAddress('metadata.internal')).toFailWith(/"metadata\.internal"/);
    });

    // The platform's URL parser applies IDNA/Unicode normalization, so every
    // string below is the host `127.0.0.1` once it has been through `new URL`.
    // This function deliberately does not do that normalization — it classifies
    // a `hostname`, which has already had it. Handed the raw text it fails,
    // which is fail-closed only because the caller then resolves it as a name.
    // These cases pin that boundary so it cannot drift silently.
    test.each([['１２７.０.０.１'], ['127。0。0。1'], ['⑫7.0.0.1']])(
      'does not itself normalize %s, which the URL parser reads as 127.0.0.1',
      (address) => {
        expect(new URL(`http://${address}/`).hostname).toBe('127.0.0.1');
        expect(classifyAddress(address)).toFail();
        expect(classifyAddress(new URL(`http://${address}/`).hostname)).toSucceedAndSatisfy((classified) => {
          expect(classified.classification).toBe('loopback');
        });
      }
    );
  });
});
