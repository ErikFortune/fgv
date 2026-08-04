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

// This module is **Node-only**: it imports `node:dns/promises` for its default resolver, so it
// is deliberately absent from the packlet's browser barrel. It is also the only module in the
// packlet that performs I/O.

import { captureAsyncResult, fail, succeed, type Result } from '@fgv/ts-utils';
import { lookup } from 'node:dns/promises';

import { classifyAddress } from './addressClassification';
import {
  blockPrivateNetworksPolicy,
  type IAddressPolicy,
  type IBlockPrivateNetworksOptions
} from './addressPolicy';
import type { IAddressGuard, IGuardVerdict, IRequestHop } from './model';

/**
 * Resolves a hostname to every address it names.
 *
 * @remarks
 * Injectable so that the resolving half of an address guard is testable without a network — a
 * guard test that performs a real lookup fails in CI for reasons unrelated to the guard, and a
 * guard test that could reach `169.254.169.254` is worse than flaky.
 *
 * An implementation must return a `Failure` rather than reject: `node:dns` rejects on
 * `ENOTFOUND`, `EAI_AGAIN` and friends, and an entry point documented to always return a
 * `Result` must not let that escape as a throw. {@link SaferFetch.nodeHostResolver} converts.
 *
 * @param hostname - The host to resolve, with no surrounding brackets.
 * @public
 */
export type HostResolver = (hostname: string) => Promise<Result<ReadonlyArray<string>>>;

/**
 * The default {@link SaferFetch.HostResolver}: `node:dns`'s `lookup`, returning every address.
 *
 * @remarks
 * `lookup` rather than `resolve4`/`resolve6` deliberately. `lookup` goes through the operating
 * system's resolver — the same path `fetch`'s connect takes — so it sees `/etc/hosts`, `nsswitch`
 * ordering, and any local override. `resolve4` queries DNS directly and would miss a
 * `hosts`-file entry pointing an allowlisted name at `127.0.0.1`, which is a bypass rather than
 * a curiosity.
 *
 * `all: true` because the list contract is reject-if-any: a name resolving to one public and one
 * private address must be refused, and asking for one address would hide the second.
 *
 * A rejected lookup (`ENOTFOUND`, `EAI_AGAIN`, …) becomes a `Failure`, never a throw.
 * @public
 */
export const nodeHostResolver: HostResolver = async (
  hostname: string
): Promise<Result<ReadonlyArray<string>>> => {
  return captureAsyncResult(async () => lookup(hostname, { all: true, verbatim: true }))
    .withErrorFormat((message) => `failed to resolve "${hostname}": ${message}`)
    .onSuccess((entries) => succeed(entries.map((entry) => entry.address)));
};

/**
 * Options for {@link SaferFetch.blockPrivateNetworks}.
 * @public
 */
export interface IBlockPrivateNetworksGuardOptions extends IBlockPrivateNetworksOptions {
  /**
   * Name resolution. Defaults to {@link SaferFetch.nodeHostResolver}.
   *
   * @remarks
   * Present so the guard is unit-testable with no network. It is **not** a hook through which
   * DNS rebinding can be closed: swapping the resolver changes only the address the guard
   * validates, while the transport still connects by hostname and resolves again. Closing that
   * requires a pinning transport — see `IGuardVerdict.pinnedAddress`.
   */
  readonly resolve?: HostResolver;
}

/**
 * Resolves a hop's hostname if it is not already an IP literal, and hands every resolved address
 * to the policy.
 *
 * A `classifyAddress` failure means "this is not an IP literal, so resolve it" — it never means
 * "block". Treating an unparseable literal as hostile would reject every ordinary hostname.
 */
async function _addressesFor(
  hostname: string,
  resolve: HostResolver
): Promise<Result<ReadonlyArray<string>>> {
  // Classify `url.hostname`, never raw URL text. By the time the WHATWG parser has produced a
  // hostname, `127.0x.1` is already `127.0.0.1`, `⑫7.0.0.1` is already `127.0.0.1`, and
  // `::ffff:169.254.169.254` is already `::ffff:a9fe:a9fe`. Text matching misses all three.
  const literal = classifyAddress(hostname);
  return literal.isSuccess() ? succeed([hostname]) : resolve(hostname);
}

/**
 * Creates the recommended address guard: resolves each hop's host and requires every resolved
 * address to be globally routable public unicast.
 *
 * @remarks
 * **Node only** — it resolves names, and no browser API returns a hostname's A/AAAA records.
 * `allowAnyAddress()` is the honest choice there, and its name says so.
 *
 * This is the guard an entry point's `addressGuard` option takes. It is the resolving,
 * hop-chain-aware half; the judgement itself belongs to
 * {@link SaferFetch.blockPrivateNetworksPolicy}, which this guard delegates to unchanged. Keeping
 * the adversarial classification matrix in one pure, synchronous implementation is what makes
 * "did the address check run, and run correctly?" answerable by reading one file.
 *
 * The guard is invoked **once per redirect hop**, on the last entry of the chain. Hop 0 is not a
 * special case: a guard that only validated the initial URL is defeated by a single `302` to
 * `http://169.254.169.254/`.
 *
 * **What this does not protect against.** It validates a resolved address and the transport then
 * re-resolves, so hostile DNS can answer the two lookups differently — the documented
 * DNS-rebinding limit, which is open in this release. It does not narrow the scheme beyond the
 * core's refusal of everything that is not `http:`/`https:`, and it applies no host or port
 * allowlist; a strict host allowlist remains the recommended posture and is the caller's to add
 * as an additional guard.
 *
 * @param options - optional relaxations of the default posture, plus the resolver seam.
 * @returns the guard. Construction cannot fail.
 * @public
 */
export function blockPrivateNetworks(options?: IBlockPrivateNetworksGuardOptions): IAddressGuard {
  const allowLoopback: boolean = options?.allowLoopback === true;
  const resolve: HostResolver = options?.resolve ?? nodeHostResolver;
  const policy: IAddressPolicy = blockPrivateNetworksPolicy({ allowLoopback });
  const name: string = allowLoopback ? 'blockPrivateNetworks(allowLoopback)' : 'blockPrivateNetworks';

  return {
    name,
    check: async (chain: ReadonlyArray<IRequestHop>): Promise<Result<IGuardVerdict>> => {
      const hop = chain[chain.length - 1] ?? undefined;
      if (hop === undefined) {
        return fail(`${name}: hop chain is empty.`);
      }
      return (await _addressesFor(hop.url.hostname, resolve))
        .withErrorFormat((message) => `${name}: ${message}`)
        .onSuccess((addresses) => policy.checkAddresses(addresses))
        .onSuccess(() =>
          // `pinnedAddress` is deliberately left undefined. The guard validated a resolved
          // address, but `platformFetchTransport` connects by hostname and would have to fail
          // rather than honor a pin — so claiming one here would either break every call or,
          // worse, advertise a rebinding defense that is not in place.
          succeed({ url: hop.url })
        );
    }
  };
}
