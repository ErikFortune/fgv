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

// Address classification is prefix arithmetic: every range test is a mask and a
// compare, and every IPv6 group/byte conversion is a shift. Spelling those as
// arithmetic instead would be strictly harder to audit against the RFCs, which
// is the opposite of what this file needs. The repo already takes per-site
// disables for the same reason in `crypto-utils/keystore` and `ts-random`.
/* eslint-disable no-bitwise */

import { type Result, fail, succeed } from '@fgv/ts-utils';

/**
 * The address family of a parsed IP address literal.
 * @public
 */
export type AddressFamily = 'ipv4' | 'ipv6';

/**
 * The security-relevant classification of an IP address.
 *
 * `'public'` is the only classification that describes an address which is
 * globally routable on the public internet; every other value names a
 * special-purpose range that a server-side fetch reaching untrusted input
 * should not be able to reach by default.
 *
 * @public
 */
export type AddressClassification =
  /** Globally routable unicast — the only classification a default guard permits. */
  | 'public'
  /** `0.0.0.0/8` and `::` — "this host on this network"; routes to localhost on Linux. */
  | 'unspecified'
  /** `127.0.0.0/8` and `::1`. */
  | 'loopback'
  /**
   * `169.254.0.0/16` and `fe80::/10`. The IPv4 range contains the cloud
   * instance-metadata endpoint (`169.254.169.254`) and is the single
   * highest-value SSRF target.
   */
  | 'link-local'
  /** RFC 1918 — `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`. */
  | 'private'
  /** RFC 4193 IPv6 unique-local — `fc00::/7`. */
  | 'unique-local'
  /** RFC 6598 carrier-grade NAT — `100.64.0.0/10`. Frequently carrier or container internal. */
  | 'carrier-grade-nat'
  /** RFC 2544 benchmarking — `198.18.0.0/15`. */
  | 'benchmarking'
  /** Documentation ranges — `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32`. */
  | 'documentation'
  /** IETF protocol assignments — `192.0.0.0/24` and `2001::/23`. */
  | 'protocol-assignment'
  /** `224.0.0.0/4` and `ff00::/8`. */
  | 'multicast'
  /** `255.255.255.255/32`. */
  | 'broadcast'
  /** Every other special-purpose or future-use range (e.g. `240.0.0.0/4`, `fec0::/10`). */
  | 'reserved';

/**
 * The way an IPv6 address carried the IPv4 address whose classification was used.
 *
 * Each of these is a documented SSRF bypass: an address such as
 * `::ffff:169.254.169.254` is an IPv6 address by family, but the address the
 * connection actually reaches is the embedded IPv4 one, so the embedded
 * address is what must be classified.
 *
 * @public
 */
export type Ipv4EmbeddingKind =
  /** `::ffff:0:0/96` — the IPv4-mapped IPv6 form. */
  | 'ipv4-mapped'
  /** `::/96` — the deprecated (RFC 4291) IPv4-compatible form. */
  | 'ipv4-compatible'
  /** `64:ff9b::/96` — the RFC 6052 well-known NAT64 prefix. */
  | 'nat64'
  /** `2002::/16` — the RFC 3056 6to4 form, whose IPv4 lives in bits 16..47. */
  | '6to4';

/**
 * The IPv4 address an IPv6 address embedded, and the way it embedded it.
 * @public
 */
export interface IEmbeddedIpv4 {
  /** The encoding that carried the IPv4 address. */
  readonly kind: Ipv4EmbeddingKind;
  /** The dotted-quad form of the embedded IPv4 address. */
  readonly address: string;
}

/**
 * The result of classifying a single IP address literal.
 * @public
 */
export interface IClassifiedAddress {
  /** The address exactly as supplied to {@link classifyAddress}. */
  readonly address: string;
  /**
   * A canonical textual form of the address: dotted-quad for IPv4, and
   * lowercase RFC 5952 hex-group form (with `::` run compression) for IPv6.
   * Note that IPv6 addresses embedding an IPv4 address canonicalize to their
   * hex-group form (`::ffff:a9fe:a9fe`), not to the dotted-quad mixed form;
   * `embeddedIpv4` carries the readable IPv4 value.
   */
  readonly canonical: string;
  /** The address family of the literal as supplied — never the embedded family. */
  readonly family: AddressFamily;
  /**
   * The classification used for policy decisions. For an IPv6 address that
   * embeds an IPv4 address, this is the classification of the *embedded* IPv4
   * address.
   */
  readonly classification: AddressClassification;
  /**
   * Present exactly when `classification` was derived from an IPv4 address
   * embedded in this IPv6 address, and absent otherwise.
   */
  readonly embeddedIpv4?: IEmbeddedIpv4;
}

interface IIpv4Range {
  readonly network: number;
  readonly prefixLength: number;
  readonly classification: AddressClassification;
}

interface IIpv6Range {
  /** Leading bytes of the prefix; length is `ceil(prefixLength / 8)`. */
  readonly prefix: ReadonlyArray<number>;
  readonly prefixLength: number;
  readonly classification: AddressClassification;
}

/**
 * IPv4 special-purpose ranges, most specific first. The broadcast address is
 * listed ahead of `240.0.0.0/4` because it falls inside it.
 */
const IPV4_RANGES: ReadonlyArray<IIpv4Range> = [
  { network: 0xffffffff, prefixLength: 32, classification: 'broadcast' },
  { network: 0x00000000, prefixLength: 8, classification: 'unspecified' },
  { network: 0x0a000000, prefixLength: 8, classification: 'private' },
  { network: 0x64400000, prefixLength: 10, classification: 'carrier-grade-nat' },
  { network: 0x7f000000, prefixLength: 8, classification: 'loopback' },
  { network: 0xa9fe0000, prefixLength: 16, classification: 'link-local' },
  { network: 0xac100000, prefixLength: 12, classification: 'private' },
  { network: 0xc0000000, prefixLength: 24, classification: 'protocol-assignment' },
  { network: 0xc0000200, prefixLength: 24, classification: 'documentation' },
  { network: 0xc0586300, prefixLength: 24, classification: 'reserved' },
  { network: 0xc0a80000, prefixLength: 16, classification: 'private' },
  { network: 0xc6120000, prefixLength: 15, classification: 'benchmarking' },
  { network: 0xc6336400, prefixLength: 24, classification: 'documentation' },
  { network: 0xcb007100, prefixLength: 24, classification: 'documentation' },
  { network: 0xe0000000, prefixLength: 4, classification: 'multicast' },
  { network: 0xf0000000, prefixLength: 4, classification: 'reserved' }
];

/**
 * IPv6 special-purpose ranges, most specific first. Ranges whose addresses
 * embed an IPv4 address are handled separately, before this table is consulted,
 * and anything outside global unicast (`2000::/3`) that matches nothing here is
 * classified `'reserved'` — so this table only needs to name the ranges that
 * deserve a more specific classification than that fallback gives them.
 */
const IPV6_RANGES: ReadonlyArray<IIpv6Range> = [
  { prefix: [0x20, 0x01, 0x0d, 0xb8], prefixLength: 32, classification: 'documentation' },
  { prefix: [0x20, 0x01, 0x00], prefixLength: 23, classification: 'protocol-assignment' },
  { prefix: [0x3f, 0xff, 0x00], prefixLength: 20, classification: 'documentation' },
  { prefix: [0xfc], prefixLength: 7, classification: 'unique-local' },
  { prefix: [0xfe, 0x80], prefixLength: 10, classification: 'link-local' },
  { prefix: [0xff], prefixLength: 8, classification: 'multicast' }
];

/** The first three bits of a global unicast IPv6 address (`2000::/3`). */
const IPV6_GLOBAL_UNICAST_MASK: number = 0xe0;
const IPV6_GLOBAL_UNICAST_VALUE: number = 0x20;

/**
 * Parses one component of an IPv4 literal using `inet_aton` conventions: a
 * `0x`/`0X` prefix selects hexadecimal, an otherwise-leading `0` selects octal,
 * and anything else is decimal.
 *
 * This is deliberately permissive about *radix* because the WHATWG URL parser
 * is: `http://0177.0.0.1/` and `http://2130706433/` are both `127.0.0.1`, and a
 * classifier that only understands dotted decimal is bypassed by either.
 */
function parseIpv4Component(text: string): number | undefined {
  if (text.length === 0) {
    return undefined;
  }

  let radix: number = 10;
  let digits: string = text;
  if (text.length > 1 && (text[1] === 'x' || text[1] === 'X') && text[0] === '0') {
    radix = 16;
    digits = text.slice(2);
  } else if (text.length > 1 && text[0] === '0') {
    radix = 8;
    digits = text.slice(1);
  }

  // The WHATWG IPv4 number parser returns 0 when stripping the radix prefix
  // leaves nothing behind, so a bare `0x` is zero: `127.0x.1` is `127.0.0.1`.
  // Rejecting it here would leave a live encoding bypass.
  if (digits.length === 0) {
    return 0;
  }

  const allowed: RegExp = radix === 16 ? /^[0-9a-fA-F]+$/ : radix === 8 ? /^[0-7]+$/ : /^[0-9]+$/;
  if (!allowed.test(digits)) {
    return undefined;
  }

  const value: number = Number.parseInt(digits, radix);
  return Number.isSafeInteger(value) ? value : undefined;
}

/**
 * Parses an IPv4 literal in any of the forms the platform URL parser accepts
 * (`a.b.c.d`, `a.b.c`, `a.b`, `a`), returning the address as an unsigned 32-bit
 * value. The final component absorbs all remaining bytes, so `127.1` is
 * `127.0.0.1` and `2130706433` is also `127.0.0.1`.
 */
function parseIpv4(text: string): number | undefined {
  const parts: string[] = text.split('.');
  if (parts.length > 4) {
    return undefined;
  }

  const values: number[] = [];
  for (const part of parts) {
    const value: number | undefined = parseIpv4Component(part);
    if (value === undefined) {
      return undefined;
    }
    values.push(value);
  }

  const leading: number = values.length - 1;
  for (let i: number = 0; i < leading; i++) {
    if (values[i] > 0xff) {
      return undefined;
    }
  }
  if (values[leading] > Math.pow(256, 4 - leading) - 1) {
    return undefined;
  }

  let address: number = values[leading];
  for (let i: number = 0; i < leading; i++) {
    address += values[i] * Math.pow(256, 3 - i);
  }
  return address >>> 0;
}

/**
 * Parses a strict dotted-quad IPv4 literal — exactly four decimal components,
 * each `0..255`, with no octal or hexadecimal forms. This is the grammar RFC
 * 4291 permits for the IPv4 tail of an IPv6 literal, and it is deliberately
 * stricter than {@link parseIpv4}: an unparseable literal fails closed.
 */
function parseStrictDottedQuad(text: string): number | undefined {
  const parts: string[] = text.split('.');
  if (parts.length !== 4) {
    return undefined;
  }

  let address: number = 0;
  for (const part of parts) {
    if (!/^(0|[1-9][0-9]{0,2})$/.test(part)) {
      return undefined;
    }
    const value: number = Number.parseInt(part, 10);
    if (value > 0xff) {
      return undefined;
    }
    address = address * 256 + value;
  }
  return address >>> 0;
}

/**
 * Parses a colon-separated run of IPv6 groups, allowing a trailing embedded
 * dotted-quad IPv4 literal which expands to the final two groups.
 *
 * @param allowEmbeddedIpv4 - whether this run may end in a dotted-quad IPv4
 * literal. Only the run that ends the whole address may, so the run *before* a
 * `::` never does: `1.2.3.4::` is malformed, not `102:304::`.
 */
function parseIpv6Groups(text: string, allowEmbeddedIpv4: boolean): number[] | undefined {
  if (text.length === 0) {
    return [];
  }

  const parts: string[] = text.split(':');
  const groups: number[] = [];
  for (let i: number = 0; i < parts.length; i++) {
    const part: string = parts[i];
    if (part.indexOf('.') >= 0) {
      if (!allowEmbeddedIpv4 || i !== parts.length - 1) {
        return undefined;
      }
      const embedded: number | undefined = parseStrictDottedQuad(part);
      if (embedded === undefined) {
        return undefined;
      }
      groups.push((embedded >>> 16) & 0xffff, embedded & 0xffff);
      continue;
    }
    if (!/^[0-9a-fA-F]{1,4}$/.test(part)) {
      return undefined;
    }
    groups.push(Number.parseInt(part, 16));
  }
  return groups;
}

/**
 * Parses an IPv6 literal into its 16 constituent bytes.
 */
function parseIpv6(text: string): Uint8Array | undefined {
  const doubleColon: number = text.indexOf('::');
  let groups: number[] | undefined;

  if (doubleColon >= 0) {
    if (text.indexOf('::', doubleColon + 1) >= 0) {
      return undefined;
    }
    const head: number[] | undefined = parseIpv6Groups(text.slice(0, doubleColon), false);
    const tail: number[] | undefined = parseIpv6Groups(text.slice(doubleColon + 2), true);
    if (head === undefined || tail === undefined) {
      return undefined;
    }
    const elided: number = 8 - head.length - tail.length;
    if (elided < 1) {
      return undefined;
    }
    groups = head.concat(new Array<number>(elided).fill(0), tail);
  } else {
    groups = parseIpv6Groups(text, true);
    if (groups === undefined || groups.length !== 8) {
      return undefined;
    }
  }

  const bytes: Uint8Array = new Uint8Array(16);
  for (let i: number = 0; i < 8; i++) {
    bytes[i * 2] = (groups[i] >>> 8) & 0xff;
    bytes[i * 2 + 1] = groups[i] & 0xff;
  }
  return bytes;
}

function ipv4ToString(address: number): string {
  return [(address >>> 24) & 0xff, (address >>> 16) & 0xff, (address >>> 8) & 0xff, address & 0xff].join('.');
}

/**
 * Renders the RFC 5952 canonical text form of an IPv6 address: lowercase, no
 * leading zeros in a group, and the leftmost longest run of two or more
 * all-zero groups replaced by `::`.
 */
function ipv6ToString(bytes: Uint8Array): string {
  const groups: number[] = [];
  for (let i: number = 0; i < 8; i++) {
    groups.push((bytes[i * 2] << 8) | bytes[i * 2 + 1]);
  }

  let bestStart: number = -1;
  let bestLength: number = 0;
  let runStart: number = -1;
  let runLength: number = 0;
  for (let i: number = 0; i < 8; i++) {
    if (groups[i] === 0) {
      if (runStart < 0) {
        runStart = i;
        runLength = 0;
      }
      runLength++;
      if (runLength > bestLength) {
        bestStart = runStart;
        bestLength = runLength;
      }
    } else {
      runStart = -1;
      runLength = 0;
    }
  }

  const rendered: string[] = groups.map((g) => g.toString(16));
  if (bestLength < 2) {
    return rendered.join(':');
  }
  const head: string = rendered.slice(0, bestStart).join(':');
  const tail: string = rendered.slice(bestStart + bestLength).join(':');
  return `${head}::${tail}`;
}

function classifyIpv4Value(address: number): AddressClassification {
  for (const range of IPV4_RANGES) {
    const mask: number = (0xffffffff << (32 - range.prefixLength)) >>> 0;
    if ((address & mask) >>> 0 === range.network) {
      return range.classification;
    }
  }
  return 'public';
}

function matchesIpv6Range(bytes: Uint8Array, range: IIpv6Range): boolean {
  const fullBytes: number = range.prefixLength >>> 3;
  for (let i: number = 0; i < fullBytes; i++) {
    if (bytes[i] !== range.prefix[i]) {
      return false;
    }
  }
  const remainingBits: number = range.prefixLength & 7;
  if (remainingBits === 0) {
    return true;
  }
  const mask: number = (0xff << (8 - remainingBits)) & 0xff;
  return (bytes[fullBytes] & mask) === (range.prefix[fullBytes] & mask);
}

function allZero(bytes: Uint8Array, start: number, end: number): boolean {
  for (let i: number = start; i < end; i++) {
    if (bytes[i] !== 0) {
      return false;
    }
  }
  return true;
}

function readIpv4At(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0
  );
}

interface IIpv6Embedding {
  readonly kind: Ipv4EmbeddingKind;
  readonly value: number;
}

/**
 * Detects the IPv4 address embedded in an IPv6 address, if any. `::` and `::1`
 * are excluded before the IPv4-compatible check so that the unspecified and
 * loopback addresses keep their own classifications.
 */
function detectIpv6Embedding(bytes: Uint8Array): IIpv6Embedding | undefined {
  if (allZero(bytes, 0, 10) && bytes[10] === 0xff && bytes[11] === 0xff) {
    return { kind: 'ipv4-mapped', value: readIpv4At(bytes, 12) };
  }
  if (
    bytes[0] === 0x00 &&
    bytes[1] === 0x64 &&
    bytes[2] === 0xff &&
    bytes[3] === 0x9b &&
    allZero(bytes, 4, 12)
  ) {
    return { kind: 'nat64', value: readIpv4At(bytes, 12) };
  }
  if (bytes[0] === 0x20 && bytes[1] === 0x02) {
    return { kind: '6to4', value: readIpv4At(bytes, 2) };
  }
  if (allZero(bytes, 0, 12)) {
    return { kind: 'ipv4-compatible', value: readIpv4At(bytes, 12) };
  }
  return undefined;
}

function classifyIpv6Bytes(bytes: Uint8Array): IClassifiedAddress {
  const canonical: string = ipv6ToString(bytes);

  if (allZero(bytes, 0, 16)) {
    return { address: canonical, canonical, family: 'ipv6', classification: 'unspecified' };
  }
  if (allZero(bytes, 0, 15) && bytes[15] === 0x01) {
    return { address: canonical, canonical, family: 'ipv6', classification: 'loopback' };
  }

  const embedding: IIpv6Embedding | undefined = detectIpv6Embedding(bytes);
  if (embedding !== undefined) {
    return {
      address: canonical,
      canonical,
      family: 'ipv6',
      classification: classifyIpv4Value(embedding.value),
      embeddedIpv4: { kind: embedding.kind, address: ipv4ToString(embedding.value) }
    };
  }

  for (const range of IPV6_RANGES) {
    if (matchesIpv6Range(bytes, range)) {
      return { address: canonical, canonical, family: 'ipv6', classification: range.classification };
    }
  }

  // Only `2000::/3` is assigned as global unicast. Everything else that reached
  // this point is unassigned or reserved for future use, so it is never public.
  const classification: AddressClassification =
    (bytes[0] & IPV6_GLOBAL_UNICAST_MASK) === IPV6_GLOBAL_UNICAST_VALUE ? 'public' : 'reserved';
  return { address: canonical, canonical, family: 'ipv6', classification };
}

/**
 * Normalizes the textual forms an address can arrive in before parsing:
 * surrounding whitespace and the square brackets a URL `hostname` carries for
 * an IPv6 literal. A zone identifier is *not* stripped here — it is stripped on
 * the IPv6 path only, because `8.8.8.8%something` is not an address with a zone
 * and must fail rather than be read as `8.8.8.8`.
 */
function normalizeAddressText(address: string): string {
  const text: string = address.trim();
  if (text.length > 1 && text[0] === '[' && text[text.length - 1] === ']') {
    return text.slice(1, -1);
  }
  return text;
}

/** Strips an IPv6 zone identifier (`fe80::1%eth0`). */
function stripIpv6Zone(text: string): string {
  const zone: number = text.indexOf('%');
  return zone >= 0 ? text.slice(0, zone) : text;
}

/**
 * Classifies a single IP address literal.
 *
 * The function is pure, synchronous, and deterministic — it performs no name
 * resolution and no I/O. Input that is not an IP address literal (a DNS
 * hostname, for instance) fails; callers that accept hostnames should treat a
 * failure here as "not a literal" and resolve the name, then classify each
 * resolved address.
 *
 * Accepted forms:
 *
 * - dotted-quad IPv4 (`169.254.169.254`)
 * - the shortened and non-decimal IPv4 forms the WHATWG URL parser accepts
 *   (`127.1`, `2130706433`, `0177.0.0.1`, `0x7f.1`)
 * - IPv6, with or without `::` compression, optionally bracketed as a URL
 *   `hostname` is (`[::1]`) and optionally carrying a zone id (`fe80::1%eth0`)
 * - IPv6 forms that embed an IPv4 address — IPv4-mapped, IPv4-compatible,
 *   NAT64 and 6to4 — which are classified by their embedded IPv4 address
 *
 * A trailing dot is accepted on an IPv4 literal (`127.0.0.1.`), matching URL
 * hostname normalization.
 *
 * **Classify a URL's `hostname`, never the raw URL text.** This function does
 * not apply IDNA/Unicode normalization, and that step is not cosmetic: the
 * platform's URL parser reads `http://１２７.０.０.１/`, `http://127。0。0。1/` and
 * even `http://⑫7.0.0.1/` as the host `127.0.0.1`, because IDNA normalizes
 * fullwidth digits, the ideographic full stop and circled numbers to their
 * ASCII equivalents. Handed one of those strings directly this function fails —
 * which is fail-closed, but only because the caller is then expected to treat
 * "not a literal" as "resolve it as a name". Reading `new URL(...).hostname`
 * gets the normalization for free and is the only supported use.
 *
 * @param address - the address literal to classify.
 * @returns `Success` with the {@link IClassifiedAddress | classification},
 * or `Failure` if the supplied text is not a well-formed IP address literal.
 * @public
 */
export function classifyAddress(address: string): Result<IClassifiedAddress> {
  const text: string = normalizeAddressText(address);
  if (text.length === 0) {
    return fail(`"${address}": not a valid IP address literal (empty)`);
  }

  if (text.indexOf(':') >= 0) {
    const bytes: Uint8Array | undefined = parseIpv6(stripIpv6Zone(text));
    if (bytes === undefined) {
      return fail(`"${address}": not a valid IPv6 address literal`);
    }
    return succeed({ ...classifyIpv6Bytes(bytes), address });
  }

  const v4Text: string = text.length > 1 && text[text.length - 1] === '.' ? text.slice(0, -1) : text;
  const value: number | undefined = parseIpv4(v4Text);
  if (value === undefined) {
    return fail(`"${address}": not a valid IP address literal`);
  }
  const canonical: string = ipv4ToString(value);
  return succeed({
    address,
    canonical,
    family: 'ipv4',
    classification: classifyIpv4Value(value)
  });
}
