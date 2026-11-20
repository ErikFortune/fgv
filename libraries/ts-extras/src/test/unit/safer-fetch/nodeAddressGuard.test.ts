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

import { fail, succeed, type Result } from '@fgv/ts-utils';

import { SaferFetch } from '../../..';

const { blockPrivateNetworks, nodeHostResolver } = SaferFetch;

/** Records what it was asked to resolve, so "was this even a lookup?" is assertable. */
interface IRecordingResolver {
  readonly resolve: SaferFetch.HostResolver;
  readonly hostnames: ReadonlyArray<string>;
}

function resolvesTo(...addresses: ReadonlyArray<string>): IRecordingResolver {
  const hostnames: string[] = [];
  return {
    hostnames,
    resolve: async (hostname: string): Promise<Result<ReadonlyArray<string>>> => {
      hostnames.push(hostname);
      return succeed(addresses);
    }
  };
}

function resolverFails(message: string): SaferFetch.HostResolver {
  return async (): Promise<Result<ReadonlyArray<string>>> => fail(message);
}

/** The guard reads only the last hop, so a one-entry chain is a complete input. */
function chainTo(url: string): ReadonlyArray<SaferFetch.IRequestHop> {
  return [{ url: new URL(url) }];
}

describe('blockPrivateNetworks (address guard)', () => {
  describe('identity', () => {
    test('names itself after the factory, and says so when loopback is permitted', () => {
      expect(blockPrivateNetworks().name).toBe('blockPrivateNetworks');
      expect(blockPrivateNetworks({}).name).toBe('blockPrivateNetworks');
      expect(blockPrivateNetworks({ allowLoopback: false }).name).toBe('blockPrivateNetworks');
      expect(blockPrivateNetworks({ allowLoopback: true }).name).toBe('blockPrivateNetworks(allowLoopback)');
    });
  });

  describe('IP literals', () => {
    test('classifies a literal without resolving it', async () => {
      const resolver = resolvesTo('10.0.0.1');
      const guard = blockPrivateNetworks({ resolve: resolver.resolve });
      await expect(guard.check(chainTo('https://93.184.216.34/x'))).resolves.toSucceedAndSatisfy(
        (verdict: SaferFetch.IGuardVerdict) => {
          expect(verdict.url.toString()).toBe('https://93.184.216.34/x');
          // A literal that was resolved anyway would have picked up the resolver's private
          // address and been rejected — so this also proves the literal short-circuit.
          expect(verdict.pinnedAddress).toBeUndefined();
        }
      );
      expect(resolver.hostnames).toEqual([]);
    });

    test('blocks the cloud metadata endpoint', async () => {
      await expect(
        blockPrivateNetworks({ allowInsecureHttp: true }).check(
          chainTo('http://169.254.169.254/latest/meta-data/')
        )
      ).resolves.toFailWith(/blockPrivateNetworks.*169\.254\.169\.254 is link-local/);
    });

    test('blocks a bracketed IPv6 literal, and permits loopback only on request', async () => {
      await expect(blockPrivateNetworks().check(chainTo('https://[::1]:8443/'))).resolves.toFailWith(
        /is loopback/
      );
      await expect(
        blockPrivateNetworks({ allowLoopback: true }).check(chainTo('https://[::1]:8443/'))
      ).resolves.toSucceed();
    });

    test.each([
      ['octal', 'http://0177.0.0.1/'],
      ['decimal', 'http://2130706433/'],
      ['empty hex remainder', 'http://127.0x.1/'],
      ['IPv4-mapped IPv6', 'http://[::ffff:169.254.169.254]/'],
      ['6to4', 'http://[2002:a9fe:a9fe::]/'],
      ['NAT64', 'http://[64:ff9b::a9fe:a9fe]/'],
      ['unspecified', 'http://0.0.0.0/'],
      ['fullwidth digits', 'http://１２７.０.０.１/']
    ])('blocks the %s encoding of a private address', async (__name: string, url: string) => {
      // Every one of these is already canonical by the time the WHATWG parser has produced a
      // hostname, which is exactly why the guard classifies `url.hostname` and never raw text.
      const resolver = resolvesTo('93.184.216.34');
      const guard = blockPrivateNetworks({ resolve: resolver.resolve });
      await expect(guard.check(chainTo(url))).resolves.toFail();
      expect(resolver.hostnames).toEqual([]);
    });
  });

  describe('hostnames', () => {
    test('resolves the hostname and permits a public address', async () => {
      const resolver = resolvesTo('93.184.216.34');
      const guard = blockPrivateNetworks({ resolve: resolver.resolve });
      await expect(guard.check(chainTo('https://example.com/thing'))).resolves.toSucceedAndSatisfy(
        (verdict: SaferFetch.IGuardVerdict) => {
          expect(verdict.url.toString()).toBe('https://example.com/thing');
        }
      );
      expect(resolver.hostnames).toEqual(['example.com']);
    });

    test('rejects if ANY resolved address is disallowed, not if the first is', async () => {
      const guard = blockPrivateNetworks({ resolve: resolvesTo('93.184.216.34', '169.254.169.254').resolve });
      await expect(guard.check(chainTo('https://rebind.example/'))).resolves.toFailWith(
        /169\.254\.169\.254 is link-local/
      );
    });

    test('rejects a hostname that resolves to nothing', async () => {
      const guard = blockPrivateNetworks({ resolve: resolvesTo().resolve });
      await expect(guard.check(chainTo('https://void.example/'))).resolves.toFailWith(
        /no addresses to check/
      );
    });

    test('reports a resolution failure as a guard failure, never as a throw', async () => {
      const guard = blockPrivateNetworks({ resolve: resolverFails('getaddrinfo ENOTFOUND nope.example') });
      await expect(guard.check(chainTo('https://nope.example/'))).resolves.toFailWith(
        /blockPrivateNetworks.*ENOTFOUND/
      );
    });

    test('resolves the last hop of a chain, not the first', async () => {
      const resolver = resolvesTo('93.184.216.34');
      const guard = blockPrivateNetworks({ resolve: resolver.resolve });
      const chain: ReadonlyArray<SaferFetch.IRequestHop> = [
        { url: new URL('https://first.example/'), status: 302 },
        { url: new URL('https://second.example/') }
      ];
      await expect(guard.check(chain)).resolves.toSucceed();
      expect(resolver.hostnames).toEqual(['second.example']);
    });

    test('fails on an empty chain rather than guessing at a destination', async () => {
      await expect(blockPrivateNetworks().check([])).resolves.toFailWith(/hop chain is empty/);
    });
  });
});

describe('URL-level constraints', () => {
  describe('scheme', () => {
    test('refuses http: by default', async () => {
      // Plaintext HTTP is exposed to a network-position attacker and is the scheme every SSRF
      // payload reaches for. The polarity matches allowLoopback: deny, and opt in visibly.
      const resolver = resolvesTo('93.184.216.34');
      await expect(
        blockPrivateNetworks({ resolve: resolver.resolve }).check(chainTo('http://example.com/x'))
      ).resolves.toFailWith(/http: is not allowed without allowInsecureHttp/);
      // Refused before the lookup: an off-posture URL costs a string comparison, not a query.
      expect(resolver.hostnames).toEqual([]);
    });

    test('permits http: on explicit opt-in', async () => {
      await expect(
        blockPrivateNetworks({
          allowInsecureHttp: true,
          resolve: resolvesTo('93.184.216.34').resolve
        }).check(chainTo('http://example.com/x'))
      ).resolves.toSucceed();
    });

    test.each(['ftp://example.com/x', 'file:///etc/passwd', 'gopher://example.com/'])(
      'refuses %s whether or not allowInsecureHttp is set',
      async (url: string) => {
        // `allowInsecureHttp` opts into `http:`, not into "any scheme that is not https". The
        // core refuses these before a guard ever sees them, so this is unreachable through the
        // shipped entry points — but the guard is a public export a caller may invoke directly,
        // and a security check that is only correct because something upstream is correct is one
        // refactor away from being wrong.
        const resolver = resolvesTo('93.184.216.34');
        for (const allowInsecureHttp of [false, true]) {
          await expect(
            blockPrivateNetworks({ allowInsecureHttp, resolve: resolver.resolve }).check(chainTo(url))
          ).resolves.toFailWith(/is not allowed \(only https:, or http: with allowInsecureHttp\)/);
        }
        expect(resolver.hostnames).toEqual([]);
      }
    );

    test('permits https: with no opt-in', async () => {
      await expect(
        blockPrivateNetworks({ resolve: resolvesTo('93.184.216.34').resolve }).check(
          chainTo('https://example.com/x')
        )
      ).resolves.toSucceed();
    });
  });

  describe('allowHosts', () => {
    test('permits a listed host', async () => {
      await expect(
        blockPrivateNetworks({
          allowHosts: ['example.com', 'other.example'],
          resolve: resolvesTo('93.184.216.34').resolve
        }).check(chainTo('https://other.example/x'))
      ).resolves.toSucceed();
    });

    test('refuses an unlisted host before resolving it', async () => {
      const resolver = resolvesTo('93.184.216.34');
      await expect(
        blockPrivateNetworks({ allowHosts: ['example.com'], resolve: resolver.resolve }).check(
          chainTo('https://elsewhere.example/x')
        )
      ).resolves.toFailWith(/host "elsewhere.example" is not in the allowed host list/);
      expect(resolver.hostnames).toEqual([]);
    });

    test('matches case-insensitively', async () => {
      await expect(
        blockPrivateNetworks({
          allowHosts: ['EXAMPLE.com'],
          resolve: resolvesTo('93.184.216.34').resolve
        }).check(chainTo('https://example.com/x'))
      ).resolves.toSucceed();
    });

    test('matches exactly, so a suffix is not a match', async () => {
      // `endsWith('.example.com')` is the classic host-allowlist bypass; an exact list has no
      // such reading. Both of these are refused.
      const guard = blockPrivateNetworks({
        allowHosts: ['example.com'],
        resolve: resolvesTo('93.184.216.34').resolve
      });
      await expect(guard.check(chainTo('https://evil-example.com/x'))).resolves.toFail();
      await expect(guard.check(chainTo('https://example.com.attacker.net/x'))).resolves.toFail();
    });

    test('an empty list refuses every host', async () => {
      await expect(
        blockPrivateNetworks({ allowHosts: [], resolve: resolvesTo('93.184.216.34').resolve }).check(
          chainTo('https://example.com/x')
        )
      ).resolves.toFailWith(/is not in the allowed host list/);
    });
  });

  describe('allowPorts', () => {
    test('permits a listed explicit port', async () => {
      await expect(
        blockPrivateNetworks({
          allowPorts: [8443],
          resolve: resolvesTo('93.184.216.34').resolve
        }).check(chainTo('https://example.com:8443/x'))
      ).resolves.toSucceed();
    });

    test('refuses an unlisted port before resolving', async () => {
      const resolver = resolvesTo('93.184.216.34');
      await expect(
        blockPrivateNetworks({ allowPorts: [443], resolve: resolver.resolve }).check(
          chainTo('https://example.com:8443/x')
        )
      ).resolves.toFailWith(/port 8443 is not in the allowed port list/);
      expect(resolver.hostnames).toEqual([]);
    });

    test("checks an absent port against the scheme's default", async () => {
      // Almost every real URL spells the default port by omitting it, so checking the raw
      // string would reject `https://example.com/` under `[443]`.
      await expect(
        blockPrivateNetworks({ allowPorts: [443], resolve: resolvesTo('93.184.216.34').resolve }).check(
          chainTo('https://example.com/x')
        )
      ).resolves.toSucceed();
      await expect(
        blockPrivateNetworks({
          allowPorts: [80],
          allowInsecureHttp: true,
          resolve: resolvesTo('93.184.216.34').resolve
        }).check(chainTo('http://example.com/x'))
      ).resolves.toSucceed();
      await expect(
        blockPrivateNetworks({ allowPorts: [80], resolve: resolvesTo('93.184.216.34').resolve }).check(
          chainTo('https://example.com/x')
        )
      ).resolves.toFailWith(/port 443 is not in the allowed port list/);
    });
  });

  test('the documented Ollama reconciliation is runnable as written', async () => {
    // Design section 13 L6: loopback stays blocked by default, and the local-development path
    // is reached by naming every deviation. Each one is independently greppable at the call site.
    const guard = blockPrivateNetworks({
      allowLoopback: true,
      allowInsecureHttp: true,
      allowHosts: ['localhost'],
      allowPorts: [11434],
      resolve: resolvesTo('127.0.0.1').resolve
    });
    await expect(guard.check(chainTo('http://localhost:11434/v1/models'))).resolves.toSucceed();
    // And the posture it bought is still narrow: the same guard refuses the Redis port on the
    // same loopback host, which is the failure the wrong polarity would have shipped.
    await expect(guard.check(chainTo('http://localhost:6379/'))).resolves.toFail();
  });

  test('names every relaxation, so a failure says which posture was in force', async () => {
    expect(
      blockPrivateNetworks({
        allowLoopback: true,
        allowInsecureHttp: true,
        allowHosts: ['localhost'],
        allowPorts: [11434]
      }).name
    ).toBe('blockPrivateNetworks(allowLoopback, allowInsecureHttp, allowHosts=localhost, allowPorts=11434)');
  });
});

describe('nodeHostResolver', () => {
  // Both cases are answered by the resolver stack without a DNS query — `localhost` from the
  // hosts file, and a name past the protocol's 255-octet limit rejected by `getaddrinfo` before
  // it asks anyone. A unit test that resolved a real name would fail in CI for reasons unrelated
  // to this code.
  test('returns every address a name resolves to', async () => {
    await expect(nodeHostResolver('localhost')).resolves.toSucceedAndSatisfy(
      (addresses: ReadonlyArray<string>) => {
        expect(addresses.length).toBeGreaterThan(0);
        for (const address of addresses) {
          expect(['127.0.0.1', '::1']).toContain(address);
        }
      }
    );
  });

  test('reports a rejected lookup as a Failure', async () => {
    await expect(nodeHostResolver('a'.repeat(300))).resolves.toFailWith(/failed to resolve/);
  });
});
