/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * `saferFetchGuard` scenario (CLI-only).
 *
 * Drives the Node safer-fetch path end to end against a scripted local HTTP server — a real
 * socket, not a mock transport. It shows the default posture refusing loopback, the named
 * opt-in permitting exactly one host and port, the content-type gate rejecting an HTML page
 * served as `200`, the streaming size cap tripping despite a lying `Content-Length`, a guarded
 * redirect walk, retry recovering from a `503`, retry declining a `POST`, and — the step that
 * matters most — a `302` to `169.254.169.254` refused *at the hop*, before any connection.
 *
 * The server binds to `127.0.0.1` on an ephemeral port and is torn down in a `finally`. Loopback
 * is deliberate: it is the address the default posture refuses, which makes the opt-in visible
 * rather than theoretical.
 *
 * CLI-only: `blockPrivateNetworks` resolves names through `node:dns` and the scripted server is
 * `node:http`, so both are loaded via `webpackIgnore` dynamic imports that never enter the
 * browser bundle. The walkthrough itself lives in the fully-testable `saferFetchDemo` module;
 * this file is the thin wrapper that supplies a live server and the real Node guard.
 */

import { Result, captureAsyncResult, fail, succeed } from '@fgv/ts-utils';
import type { IScenario, IScenarioContext, ICliScenarioImpl } from '../../shell';
import { IDemoStep, ISaferFetchDemoDeps, runSaferFetchDemo } from './saferFetchDemo';

/** A body comfortably over the demo's 1 KiB cap, served with a `Content-Length` that lies. */
const BIG_BODY: string = 'x'.repeat(64 * 1024);

const cliImpl: ICliScenarioImpl = {
  async run(context: IScenarioContext): Promise<Result<string>> {
    const http = await import(/* webpackIgnore: true */ 'node:http');
    const extras = await import(/* webpackIgnore: true */ '@fgv/ts-extras');
    const SaferFetch = extras.SaferFetch;

    const deps: ISaferFetchDemoDeps = {
      saferFetchJson: SaferFetch.saferFetchJson,
      saferFetchText: SaferFetch.saferFetchText,
      blockPrivateNetworks: SaferFetch.blockPrivateNetworks,
      allowContentTypes: SaferFetch.allowContentTypes
    };

    // One visit to /flaky fails, the next succeeds — so retry is demonstrated rather than
    // asserted.
    let flakyVisits: number = 0;
    const server = http.createServer((request, response) => {
      const path: string = (request.url ?? '/').split('?')[0];
      switch (path) {
        case '/json':
          response.writeHead(200, { 'content-type': 'application/json' });
          response.end(JSON.stringify({ ok: true, served: 'by the local scenario server' }));
          return;
        case '/html':
          // The case the content-type gate exists for: an error page with a 200, which would
          // otherwise be decoded and fail as 'parse' twenty frames from where it went wrong.
          response.writeHead(200, { 'content-type': 'text/html' });
          response.end('<html><body>not the JSON you asked for</body></html>');
          return;
        case '/big':
          // A `Content-Length` an attacker chooses freely: the cap must hold with no help
          // from it, which is what counting during the read buys.
          response.writeHead(200, { 'content-type': 'text/plain', 'content-length': '12' });
          response.end(BIG_BODY);
          return;
        case '/redirect':
          response.writeHead(302, { location: '/final' });
          response.end();
          return;
        case '/redirect-to-metadata':
          response.writeHead(302, {
            location: 'http://169.254.169.254/latest/meta-data/iam/security-credentials/'
          });
          response.end();
          return;
        case '/final':
          response.writeHead(200, { 'content-type': 'text/plain' });
          response.end('arrived, every hop guarded');
          return;
        case '/flaky':
          flakyVisits += 1;
          if (flakyVisits === 1) {
            response.writeHead(503, { 'retry-after': '1' });
            response.end();
            return;
          }
          response.writeHead(200, { 'content-type': 'text/plain' });
          response.end('answered on the retry');
          return;
        case '/always-503':
          response.writeHead(503);
          response.end();
          return;
        default:
          response.writeHead(404);
          response.end();
      }
    });

    const listening = await captureAsyncResult(
      async () =>
        new Promise<number>((resolve, reject) => {
          server.once('error', reject);
          server.listen(0, '127.0.0.1', () => {
            const address = server.address();
            if (address === null || typeof address === 'string') {
              reject(new Error('server did not report a numeric address'));
              return;
            }
            resolve(address.port);
          });
        })
    );
    if (listening.isFailure()) {
      return fail(`could not start the scenario server: ${listening.message}`);
    }
    const baseUrl: string = `http://127.0.0.1:${listening.value}`;
    context.logger.info(`safer-fetch scenario server listening on ${baseUrl}`);

    try {
      const demo = await runSaferFetchDemo({ baseUrl, deps });
      if (demo.isFailure()) {
        return fail(demo.message);
      }
      const lines: string = demo.value.steps
        .map(
          (s: IDemoStep, i: number) =>
            `  ${i + 1}. ${s.asExpected ? '✅' : '❌'} ${s.name}\n     ${s.outcome}`
        )
        .join('\n');
      return succeed(
        `safer-fetch (Node) end-to-end walkthrough against ${baseUrl}\n${lines}\n` +
          `Overall: ${
            demo.value.allAsExpected
              ? 'every step behaved as the design says it should'
              : 'AT LEAST ONE STEP DID NOT BEHAVE AS EXPECTED'
          }`
      );
    } finally {
      // Awaited: `close()` is asynchronous, and returning while the listener is still shutting
      // down leaves an open handle for whatever runs next in the same process. The callback
      // reports a close error, which is not worth failing a completed walkthrough over — the
      // scenario's result is already decided — so it is resolved either way.
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }
};

/**
 * `saferFetchGuard` scenario: the Node safer-fetch primitive driven end to end against a
 * scripted local server — guard posture, content-type gate, size cap, guarded redirect walk,
 * retry, and an SSRF redirect refused at the hop. CLI-only.
 * @public
 */
export const saferFetchGuardScenario: IScenario = {
  id: 'safer-fetch-guard',
  title: 'Safer Fetch — guard, gate, cap, retry',
  description:
    'Drives `@fgv/ts-extras/safer-fetch` against a scripted local HTTP server: the default ' +
    'posture refusing loopback, the named opt-in permitting exactly one host and port, the ' +
    'content-type gate, the streaming size cap under a lying Content-Length, a guarded redirect ' +
    'walk, opt-in retry, and a 302 to the cloud metadata endpoint refused at the hop before any ' +
    'connection is made. CLI-only.',
  category: 'general',
  tags: ['safer-fetch', 'ssrf', 'security', 'retry', 'http'],
  cli: cliImpl
};

// Re-export the testable core.
export { runSaferFetchDemo };
export type {
  IDemoStep,
  ISaferFetchDemoDeps,
  ISaferFetchDemoParams,
  ISaferFetchDemoResult
} from './saferFetchDemo';
