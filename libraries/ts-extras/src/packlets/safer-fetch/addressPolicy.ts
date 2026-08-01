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

import { Result, fail, mapResults, succeed } from '@fgv/ts-utils';
import { AddressClassification, IClassifiedAddress, classifyAddress } from './addressClassification';

/**
 * The evidence behind an allowed address-policy decision.
 * @public
 */
export interface IAddressCheckVerdict {
  /** The {@link IAddressPolicy.name | name} of the policy that produced the verdict. */
  readonly policy: string;
  /**
   * The classification of every address the policy examined, in the order
   * supplied. Empty for {@link allowAnyAddress}, which classifies nothing.
   */
  readonly addresses: ReadonlyArray<IClassifiedAddress>;
}

/**
 * A pure, synchronous decision over a set of IP addresses.
 *
 * A policy performs no name resolution and no I/O: a caller resolves a
 * hostname to its addresses and hands the whole list to
 * {@link IAddressPolicy.checkAddresses}. The list contract is
 * **reject-if-any** — a hostname that resolves to one public and one private
 * address is disallowed, because without connect-time address pinning there is
 * no guarantee which address the connection will use.
 *
 * @public
 */
export interface IAddressPolicy {
  /**
   * A stable, greppable identifier for the posture this policy implements.
   * Surfaced in the failure message when an address is disallowed.
   */
  readonly name: string;

  /**
   * Decides whether a connection may be made to a destination that resolved to
   * `addresses`.
   *
   * @param addresses - every address the destination resolved to, or the
   * single literal address when the destination was an IP literal.
   * @returns `Success` with the {@link IAddressCheckVerdict | verdict} when
   * *every* address is permitted, `Failure` naming every address that is not.
   * An empty list is a failure for any policy that offers a guarantee: nothing
   * was verified, so nothing may be reached.
   */
  checkAddresses(addresses: ReadonlyArray<string>): Result<IAddressCheckVerdict>;
}

/**
 * Options for {@link blockPrivateNetworks}.
 * @public
 */
export interface IBlockPrivateNetworksOptions {
  /**
   * Permits `127.0.0.0/8` and `::1` (and their IPv4-mapped forms). Off by
   * default: the polarity that ships a guard permitting `http://127.0.0.1:6379/`
   * so a local-development convenience keeps working is the wrong one. A
   * caller talking to a local sidecar opts in here, and the opt-in is
   * independently greppable at the call site.
   */
  readonly allowLoopback?: boolean;
}

const PUBLIC_ONLY: ReadonlySet<AddressClassification> = new Set<AddressClassification>(['public']);
const PUBLIC_OR_LOOPBACK: ReadonlySet<AddressClassification> = new Set<AddressClassification>([
  'public',
  'loopback'
]);

function describeAddress(classified: IClassifiedAddress): string {
  const embedded: string =
    classified.embedding !== undefined
      ? ` via ${classified.embedding} ${String(classified.embeddedIpv4)}`
      : '';
  return `${classified.canonical} is ${classified.classification}${embedded}`;
}

function checkOneAddress(
  policyName: string,
  allowed: ReadonlySet<AddressClassification>,
  address: string
): Result<IClassifiedAddress> {
  return classifyAddress(address)
    .withErrorFormat((message) => `${policyName}: ${message}`)
    .onSuccess((classified) =>
      allowed.has(classified.classification)
        ? succeed(classified)
        : fail(`${policyName}: ${describeAddress(classified)} and is not allowed`)
    );
}

function checkAllAddresses(
  policyName: string,
  allowed: ReadonlySet<AddressClassification>,
  addresses: ReadonlyArray<string>
): Result<IAddressCheckVerdict> {
  if (addresses.length === 0) {
    return fail(`${policyName}: no addresses to check - the destination cannot be verified`);
  }
  return mapResults(addresses.map((address) => checkOneAddress(policyName, allowed, address))).onSuccess(
    (classified) => succeed({ policy: policyName, addresses: classified })
  );
}

/**
 * Creates the recommended address policy: every address must be a globally
 * routable public unicast address.
 *
 * Rejected, in both their plain and their IPv6-embedded encodings: loopback,
 * the link-local range that carries the cloud instance-metadata endpoint
 * (`169.254.169.254`), RFC 1918 private ranges, IPv6 unique-local, carrier-grade
 * NAT (`100.64.0.0/10`), the unspecified address, multicast, broadcast,
 * benchmarking, documentation and every other reserved range. The encoding
 * bypasses covered are IPv4-mapped IPv6 (`::ffff:169.254.169.254`),
 * IPv4-compatible IPv6, NAT64 (`64:ff9b::a9fe:a9fe`), 6to4 (`2002:a9fe:a9fe::`)
 * and the shortened / octal / hexadecimal / decimal IPv4 literal forms
 * (`127.1`, `0177.0.0.1`, `0x7f.1`, `2130706433`).
 *
 * **What this does not protect against.** The policy classifies addresses a
 * caller has already resolved; it cannot see the address the connection
 * ultimately uses. A hostile DNS server that answers the resolution with a
 * public address and the connect with a private one is not stopped by this
 * policy — closing that requires connecting to a pinned address. The policy
 * also says nothing about scheme, host, port, redirects or response content.
 *
 * @param options - optional {@link IBlockPrivateNetworksOptions | relaxations}
 * of the default posture.
 * @returns the policy. Construction cannot fail.
 * @public
 */
export function blockPrivateNetworks(options?: IBlockPrivateNetworksOptions): IAddressPolicy {
  const allowLoopback: boolean = options?.allowLoopback === true;
  const name: string = allowLoopback ? 'blockPrivateNetworks(allowLoopback)' : 'blockPrivateNetworks';
  const allowed: ReadonlySet<AddressClassification> = allowLoopback ? PUBLIC_OR_LOOPBACK : PUBLIC_ONLY;
  return {
    name,
    checkAddresses: (addresses: ReadonlyArray<string>): Result<IAddressCheckVerdict> =>
      checkAllAddresses(name, allowed, addresses)
  };
}

/**
 * Creates a policy that permits every address, including loopback, link-local
 * and private ones.
 *
 * **This policy provides no protection whatsoever.** It classifies nothing,
 * rejects nothing, and never fails — not even for an empty address list or an
 * address that is not a well-formed literal. It exists so that choosing to go
 * without an address guarantee is a deliberate, named, greppable act at the
 * call site rather than something reachable by omission, and so that tests and
 * genuinely trusted-input paths do not hand-roll something worse.
 *
 * It is the only correct choice in a browser, where neither name resolution nor
 * redirect interposition is available and no address guarantee is possible.
 *
 * @returns the policy.
 * @public
 */
export function allowAnyAddress(): IAddressPolicy {
  const name: string = 'allowAnyAddress';
  return {
    name,
    checkAddresses: (): Result<IAddressCheckVerdict> => succeed({ policy: name, addresses: [] })
  };
}
