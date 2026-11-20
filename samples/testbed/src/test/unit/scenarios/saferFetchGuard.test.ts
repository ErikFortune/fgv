/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * The walkthrough core, driven against a scripted stand-in for the safer-fetch surface rather
 * than a live server: the scenario's job is to *demonstrate* nine behaviours, and what belongs
 * in a unit test is that it asks for the right nine and reports each one honestly. Whether the
 * primitive actually behaves that way is `@fgv/ts-extras`'s test, and the CLI wrapper proves it
 * against a real socket.
 */

import '@fgv/ts-utils-jest';

import { fail, failWithDetail, succeed, succeedWithDetail, type DetailedResult } from '@fgv/ts-utils';
import type { SaferFetch } from '@fgv/ts-extras';

import {
  IDemoStep,
  ISaferFetchDemoDeps,
  ISaferFetchDemoResult,
  runSaferFetchDemo
} from '../../../scenarios/saferFetchGuard';

const BASE_URL: string = 'http://127.0.0.1:54321';

/** The name the stand-in gives a guard relaxed enough to clear the local sidecar. */
const SIDECAR_GUARD: string = 'blockPrivateNetworks(sidecar)';

type Outcome<T> = DetailedResult<SaferFetch.ISaferFetchResponse<T>, SaferFetch.FetchFailureReason>;

function response<T>(value: T, urlChain: ReadonlyArray<string>): SaferFetch.ISaferFetchResponse<T> {
  return { value, status: 200, headers: {}, urlChain, bytesRead: 42 };
}

/**
 * A guard refusal. `detail` carries the rule that said no, exactly as the real guard's message
 * does — several steps use guards from the same family whose refusals are all
 * `'blocked-by-guard'`, and the message is the only thing that distinguishes them.
 */
function blocked<T>(url: string, why: string = 'is loopback and is not allowed'): Outcome<T> {
  return failWithDetail(`address guard rejected ${url}: ${why}`, {
    kind: 'blocked-by-guard',
    url,
    hop: 0,
    guard: 'blockPrivateNetworks',
    detail: why
  });
}

/** A stand-in whose answer depends only on the path, so each step is scripted independently. */
function deps(overrides?: Partial<ISaferFetchDemoDeps>): ISaferFetchDemoDeps {
  const answer = <T>(url: string, value: T): Outcome<T> => {
    const path: string = new URL(url).pathname;
    switch (path) {
      case '/html':
        return failWithDetail('content-type "text/html" is not accepted', {
          kind: 'unsupported-content-type',
          contentType: 'text/html',
          accepted: ['application/json']
        });
      case '/big':
        return failWithDetail('response exceeded the 1024-byte cap', {
          kind: 'too-large',
          bytesRead: 2048,
          limit: 1024,
          declared: 12
        });
      case '/redirect':
        return succeedWithDetail(response(value, [`${BASE_URL}/redirect`, `${BASE_URL}/final`]));
      case '/redirect-to-metadata':
        return blocked(
          'http://169.254.169.254/latest/meta-data/iam/security-credentials/',
          '169.254.169.254 is link-local and is not allowed'
        );
      case '/always-503':
        return failWithDetail('returned 503 Service Unavailable', {
          kind: 'http-status',
          status: 503,
          statusText: 'Service Unavailable'
        });
      default:
        return succeedWithDetail(response(value, [url]));
    }
  };

  return {
    saferFetchJson: (async (url: string | URL) =>
      answer(String(url), { ok: true } as unknown)) as unknown as ISaferFetchDemoDeps['saferFetchJson'],
    saferFetchText: (async (url: string | URL, options: SaferFetch.ISaferFetchOptions) => {
      const asString: string = String(url);
      // The steps that turn on the *guard* rather than on the path. Only the fully-relaxed
      // sidecar guard clears a loopback, plaintext-http destination — the default posture and
      // the loopback-only guard each refuse for their own reason — and even the sidecar guard
      // refuses a port it was not given.
      if (options.addressGuard.name === 'blockPrivateNetworks(partial)') {
        // Loopback permitted, plaintext http not — so the scheme rule is the one that refuses.
        return blocked(asString, 'http: is not allowed without allowInsecureHttp');
      }
      if (options.addressGuard.name !== SIDECAR_GUARD) {
        return blocked(asString);
      }
      const port: string = new URL(asString).port;
      if (port === '6379') {
        return blocked(asString, `port ${port} is not in the allowed port list`);
      }
      return answer(asString, 'body text');
    }) as unknown as ISaferFetchDemoDeps['saferFetchText'],
    blockPrivateNetworks: ((options?: SaferFetch.IBlockPrivateNetworksGuardOptions) => ({
      // Named by how relaxed it is, mirroring how the real factory names itself after its
      // relaxations — which is what lets the stand-in above tell the three postures apart.
      name:
        options === undefined
          ? 'blockPrivateNetworks'
          : options.allowHosts !== undefined
          ? SIDECAR_GUARD
          : 'blockPrivateNetworks(partial)',
      check: jest.fn()
    })) as unknown as ISaferFetchDemoDeps['blockPrivateNetworks'],
    allowContentTypes: (() =>
      succeed({
        name: 'allowContentTypes',
        acceptedContentTypes: ['application/json'],
        check: jest.fn()
      })) as unknown as ISaferFetchDemoDeps['allowContentTypes'],
    ...overrides
  };
}

function stepNamed(result: ISaferFetchDemoResult, fragment: string): IDemoStep {
  const found = result.steps.find((s) => s.name.includes(fragment));
  if (found === undefined) {
    throw new Error(`no step matching "${fragment}" in [${result.steps.map((s) => s.name).join(', ')}]`);
  }
  return found;
}

describe('runSaferFetchDemo', () => {
  test('demonstrates every behaviour, and reports them all as expected', async () => {
    await expect(runSaferFetchDemo({ baseUrl: BASE_URL, deps: deps() })).resolves.toSucceedAndSatisfy(
      (result: ISaferFetchDemoResult) => {
        expect(result.allAsExpected).toBe(true);
        expect(result.steps).toHaveLength(10);
        for (const s of result.steps) {
          expect(s.outcome).not.toBe('');
        }
      }
    );
  });

  test('names the SSRF step by what it proves: refused before any connection', async () => {
    await expect(runSaferFetchDemo({ baseUrl: BASE_URL, deps: deps() })).resolves.toSucceedAndSatisfy(
      (result: ISaferFetchDemoResult) => {
        const ssrf = stepNamed(result, '169.254.169.254');
        expect(ssrf.asExpected).toBe(true);
        expect(ssrf.name).toMatch(/before any connection/i);
        expect(ssrf.outcome).toMatch(/169\.254\.169\.254/);
      }
    );
  });

  test('reports the redirect walk with the chain it actually took', async () => {
    await expect(runSaferFetchDemo({ baseUrl: BASE_URL, deps: deps() })).resolves.toSucceedAndSatisfy(
      (result: ISaferFetchDemoResult) => {
        const followed = stepNamed(result, 'redirect is followed');
        expect(followed.asExpected).toBe(true);
        expect(followed.outcome).toContain('/redirect → ');
        expect(followed.outcome).toContain('/final');
      }
    );
  });

  test('marks a step that did not behave as expected rather than failing the run', async () => {
    // A surprise is data, not an error: the output should show the whole picture instead of
    // stopping at the first one.
    const permissive = deps({
      saferFetchText: (async () =>
        succeedWithDetail(
          response('unexpectedly fine', [BASE_URL])
        )) as unknown as ISaferFetchDemoDeps['saferFetchText']
    });
    await expect(runSaferFetchDemo({ baseUrl: BASE_URL, deps: permissive })).resolves.toSucceedAndSatisfy(
      (result: ISaferFetchDemoResult) => {
        expect(result.allAsExpected).toBe(false);
        expect(stepNamed(result, 'default posture').asExpected).toBe(false);
        expect(stepNamed(result, 'default posture').outcome).toBe('unexpectedly succeeded');
        // And the run still reported every step.
        expect(result.steps).toHaveLength(10);
      }
    );
  });

  test('reports every step as unexpected when nothing refuses anything', async () => {
    // The inverse of the happy path: a surface that permits everything should light up every
    // step, not just the first, so a regression in the primitive is visible as a pattern.
    const permissive = deps({
      saferFetchText: (async () =>
        succeedWithDetail(
          response('unexpectedly fine', [BASE_URL])
        )) as unknown as ISaferFetchDemoDeps['saferFetchText'],
      saferFetchJson: (async () =>
        succeedWithDetail(
          response({ ok: true }, [BASE_URL])
        )) as unknown as ISaferFetchDemoDeps['saferFetchJson']
    });
    await expect(runSaferFetchDemo({ baseUrl: BASE_URL, deps: permissive })).resolves.toSucceedAndSatisfy(
      (result: ISaferFetchDemoResult) => {
        expect(result.allAsExpected).toBe(false);
        // The three steps that expect a *success* still pass; the seven that expect a refusal
        // all report the surprise.
        expect(result.steps.filter((s) => !s.asExpected)).toHaveLength(7);
        for (const s of result.steps.filter((step) => !step.asExpected)) {
          expect(s.outcome).toBe('unexpectedly succeeded');
        }
      }
    );
  });

  test('does not credit a refusal whose reason is not the one the step is about', async () => {
    // A step that only asked "did it fail?" would pass on any failure at all. Each one names the
    // taxonomy entry it is demonstrating, so a call that failed for an unrelated reason — or one
    // carrying no detail at all — is reported as unexpected rather than counted as a pass.
    const detailless = <T>(): Outcome<T> =>
      failWithDetail(
        'something went wrong, and we cannot say what',
        undefined as unknown as SaferFetch.FetchFailureReason
      );
    const opaque = deps({
      saferFetchText: (async () => detailless()) as unknown as ISaferFetchDemoDeps['saferFetchText'],
      saferFetchJson: (async () => detailless()) as unknown as ISaferFetchDemoDeps['saferFetchJson']
    });
    await expect(runSaferFetchDemo({ baseUrl: BASE_URL, deps: opaque })).resolves.toSucceedAndSatisfy(
      (result: ISaferFetchDemoResult) => {
        // The two steps that assert only "it was refused" still pass; every step that names a
        // taxonomy entry, and every step that expects a success, does not.
        expect(stepNamed(result, 'default posture').asExpected).toBe(false);
        expect(stepNamed(result, '169.254.169.254').asExpected).toBe(false);
        // Not credited either: a detail-less failure names no rule, and the port step is about
        // the port allowlist specifically.
        expect(stepNamed(result, 'Redis port').asExpected).toBe(false);
        expect(stepNamed(result, 'named opt-in').asExpected).toBe(false);
        expect(stepNamed(result, 'named opt-in').outcome).toMatch(/cannot say what/);
      }
    );
  });

  test('does not credit a step whose refusal names a different rule', async () => {
    // The sharpest failure mode for a *demonstration*: several of these guards refuse as
    // `'blocked-by-guard'`, so a step that only asked "was it refused?" would be credited by
    // the wrong rule saying no — and the walkthrough would claim to prove something it did not.
    const wrongReason = deps({
      saferFetchText: (async (url: string | URL) =>
        blocked(String(url), 'some other rule said no')) as unknown as ISaferFetchDemoDeps['saferFetchText']
    });
    await expect(runSaferFetchDemo({ baseUrl: BASE_URL, deps: wrongReason })).resolves.toSucceedAndSatisfy(
      (result: ISaferFetchDemoResult) => {
        // Refused, and still not credited: neither the scheme step nor the port step names the
        // rule it is about.
        expect(stepNamed(result, 'plaintext http').asExpected).toBe(false);
        expect(stepNamed(result, 'Redis port').asExpected).toBe(false);
        // The step that only asks for *a* guard block is still satisfied, which is correct —
        // that one is about loopback being refused at all, and it names no narrower rule.
        expect(stepNamed(result, 'default posture refuses a loopback').asExpected).toBe(true);
      }
    );
  });

  test('fails the run when the content-type gate itself cannot be constructed', async () => {
    // A malformed entry in a security-adjacent allowlist is reported to its author rather than
    // silently compiled into a pattern that never matches — so the walkthrough stops.
    const broken = deps({
      allowContentTypes: (() =>
        fail(
          'allowContentTypes: at least one media type is required.'
        )) as unknown as ISaferFetchDemoDeps['allowContentTypes']
    });
    await expect(runSaferFetchDemo({ baseUrl: BASE_URL, deps: broken })).resolves.toFailWith(
      /at least one media type is required/
    );
  });
});
