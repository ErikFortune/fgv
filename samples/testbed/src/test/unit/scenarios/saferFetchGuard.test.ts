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

type Outcome<T> = DetailedResult<SaferFetch.ISaferFetchResponse<T>, SaferFetch.FetchFailureReason>;

function response<T>(value: T, urlChain: ReadonlyArray<string>): SaferFetch.ISaferFetchResponse<T> {
  return { value, status: 200, headers: {}, urlChain, bytesRead: 42 };
}

function blocked<T>(url: string): Outcome<T> {
  return failWithDetail(`address guard rejected ${url}`, {
    kind: 'blocked-by-guard',
    url,
    hop: 0,
    guard: 'blockPrivateNetworks',
    detail: 'is loopback and is not allowed'
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
        return blocked('http://169.254.169.254/latest/meta-data/iam/security-credentials/');
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
      // The two steps that turn on the *guard*, not on the path: the default posture refuses a
      // loopback URL, and the sidecar guard refuses a port it was not given.
      if (options.addressGuard.name === 'blockPrivateNetworks') {
        return blocked(asString);
      }
      if (new URL(asString).port === '6379') {
        return blocked(asString);
      }
      return answer(asString, 'body text');
    }) as unknown as ISaferFetchDemoDeps['saferFetchText'],
    blockPrivateNetworks: ((options?: SaferFetch.IBlockPrivateNetworksGuardOptions) => ({
      name: options === undefined ? 'blockPrivateNetworks' : 'blockPrivateNetworks(sidecar)',
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
        expect(result.steps).toHaveLength(9);
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
        expect(result.steps).toHaveLength(9);
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
