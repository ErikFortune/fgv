/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { DetailedResult, Result, fail, succeed } from '@fgv/ts-utils';
import type { SaferFetch } from '@fgv/ts-extras';

/**
 * The safer-fetch surface this demo drives, injected rather than imported.
 *
 * @remarks
 * `blockPrivateNetworks` resolves names through `node:dns`, so importing it here would pull a
 * Node builtin into the browser bundle this package also produces. The types are `import type`
 * and erase; the values arrive from the CLI wrapper, which loads them behind a `webpackIgnore`
 * dynamic import. Same shape as the `localEmbeddingSearch` and `sqliteVec*` scenarios.
 * @public
 */
export interface ISaferFetchDemoDeps {
  readonly saferFetchJson: typeof SaferFetch.saferFetchJson;
  readonly saferFetchText: typeof SaferFetch.saferFetchText;
  readonly blockPrivateNetworks: typeof SaferFetch.blockPrivateNetworks;
  readonly allowContentTypes: typeof SaferFetch.allowContentTypes;
}

/** One demonstrated behaviour: what was asked for, and what the primitive did about it. */
export interface IDemoStep {
  readonly name: string;
  /** `true` when the primitive did what this step set out to show. */
  readonly asExpected: boolean;
  /** What actually happened, in one line. */
  readonly outcome: string;
}

/** The result of the whole walkthrough. */
export interface ISaferFetchDemoResult {
  readonly steps: ReadonlyArray<IDemoStep>;
  /** `true` when every step behaved as the design says it should. */
  readonly allAsExpected: boolean;
}

/** Inputs to {@link runSaferFetchDemo}. */
export interface ISaferFetchDemoParams {
  /**
   * Base URL of the scripted local server, e.g. `http://127.0.0.1:54321`. Loopback on purpose:
   * it is the address the default posture refuses, which makes the opt-in visible rather than
   * theoretical.
   */
  readonly baseUrl: string;
  readonly deps: ISaferFetchDemoDeps;
}

/**
 * A guard for the local sidecar case: loopback and plaintext HTTP permitted, and nothing else.
 *
 * @remarks
 * Every deviation from the default posture is named, and each is independently greppable at the
 * call site — which is the whole reason the options are spelled this way rather than collapsed
 * into one `permissive: true`.
 */
function sidecarGuard(deps: ISaferFetchDemoDeps, port: string): SaferFetch.IAddressGuard {
  return deps.blockPrivateNetworks({
    allowLoopback: true,
    allowInsecureHttp: true,
    allowHosts: ['127.0.0.1'],
    allowPorts: [Number(port)]
  });
}

function step(name: string, asExpected: boolean, outcome: string): IDemoStep {
  return { name, asExpected, outcome };
}

/** Whether a call failed with the taxonomy entry the step is about. */
function refusedBecause<T>(
  result: DetailedResult<SaferFetch.ISaferFetchResponse<T>, SaferFetch.FetchFailureReason>,
  kind: SaferFetch.FetchFailureReason['kind']
): boolean {
  return result.isFailure() && result.detail?.kind === kind;
}

/**
 * Whether the **address guard** refused, for the specific rule this step is about.
 *
 * @remarks
 * A step that only asked "was it refused?" is creditable by any failure at all, which for a
 * *demonstration* is worse than useless: the guards here come from one family and all refuse as
 * `'blocked-by-guard'`, so loopback, scheme and port refusals are indistinguishable at the
 * taxonomy level. `evidence` is the fragment of the guard's own reason that separates them.
 *
 * Matched against the reason, never the whole failure message. The message echoes the URL that
 * was refused, so `'6379'` would be satisfied by `http://127.0.0.1:6379/` itself no matter which
 * rule said no — the step would be credited by its own input.
 */
function refusedByGuard<T>(
  result: DetailedResult<SaferFetch.ISaferFetchResponse<T>, SaferFetch.FetchFailureReason>,
  evidence: string
): boolean {
  return (
    result.isFailure() &&
    result.detail?.kind === 'blocked-by-guard' &&
    result.detail.detail.includes(evidence)
  );
}

/**
 * Walks the Node safer-fetch path end to end against a scripted local server.
 *
 * @remarks
 * Every step is a behaviour the design commits to, exercised against a real socket rather than
 * a mock transport: the guard's default posture and its named opt-in, the content-type gate,
 * the streaming size cap, the guarded redirect walk, retry, and — the one that matters most —
 * a redirect to the cloud metadata endpoint refused *at the hop*, before any connection is made.
 *
 * Returns a `Result` that is only a `Failure` if the walkthrough itself could not run; a step
 * that behaved unexpectedly is reported as `asExpected: false` rather than as an error, so the
 * output shows the whole picture instead of stopping at the first surprise.
 */
export async function runSaferFetchDemo(
  params: ISaferFetchDemoParams
): Promise<Result<ISaferFetchDemoResult>> {
  const { deps } = params;
  const base = new URL(params.baseUrl);
  const guard = sidecarGuard(deps, base.port);
  const steps: IDemoStep[] = [];

  // 1. The default posture refuses loopback — before any connection is attempted.
  //
  //    Spelled `https:` deliberately, even though the scenario's server speaks plaintext. The
  //    default posture refuses BOTH loopback and `http:`, so an `http://127.0.0.1/…` URL here
  //    would be refused on the scheme and this step would quietly prove the wrong thing. The
  //    guard decides before any connection, so it never matters that nothing is listening for
  //    TLS on the other end.
  const defaultPosture = await deps.saferFetchText(`https://${base.host}/json`, {
    addressGuard: deps.blockPrivateNetworks()
  });
  steps.push(
    step(
      'default posture refuses a loopback URL',
      refusedBecause(defaultPosture, 'blocked-by-guard'),
      defaultPosture.isFailure() ? defaultPosture.message : 'unexpectedly succeeded'
    )
  );

  // 1b. And refuses plaintext HTTP on its own account — the other half of the default posture,
  //     shown separately so neither can be mistaken for the other. Loopback is permitted here,
  //     so the only thing left to refuse is the scheme.
  const plaintext = await deps.saferFetchText(`${params.baseUrl}/json`, {
    addressGuard: deps.blockPrivateNetworks({ allowLoopback: true })
  });
  steps.push(
    step(
      'default posture refuses plaintext http, even to an allowed address',
      // The evidence, not just the refusal: loopback is permitted by this guard, so only the
      // scheme rule can have said no — and its message is what proves which one did.
      refusedByGuard(plaintext, 'allowInsecureHttp'),
      plaintext.isFailure() ? plaintext.message : 'unexpectedly succeeded'
    )
  );

  // 2. The named opt-in permits exactly that host and port, and nothing else.
  const jsonGate = deps.allowContentTypes(['application/json']);
  if (jsonGate.isFailure()) {
    // The walkthrough cannot continue without the gate it is meant to demonstrate, and a
    // malformed entry in a security-adjacent allowlist is its author's problem to hear about.
    return fail(jsonGate.message);
  }
  const permitted = await deps.saferFetchJson(`${params.baseUrl}/json`, {
    addressGuard: guard,
    responseHeadersGuard: jsonGate.value
  });
  steps.push(
    step(
      'the named opt-in permits the sidecar',
      permitted.isSuccess(),
      permitted.isSuccess()
        ? `200, ${permitted.value.bytesRead} bytes, chain ${permitted.value.urlChain.join(' → ')}`
        : permitted.message
    )
  );

  // 3. The same guard still refuses a different loopback port — the opt-in bought one
  //    destination, not "loopback is fine now".
  const wrongPort = await deps.saferFetchText(`http://127.0.0.1:6379/`, { addressGuard: guard });
  steps.push(
    step(
      'the same guard still refuses the Redis port',
      refusedByGuard(wrongPort, '6379'),
      wrongPort.isFailure() ? wrongPort.message : 'unexpectedly succeeded'
    )
  );

  // 4. The content-type gate rejects an HTML error page served with a 200, on the header —
  //    a header comparison instead of a body transfer, and the failure names the type.
  const wrongType = await deps.saferFetchJson(`${params.baseUrl}/html`, {
    addressGuard: guard,
    responseHeadersGuard: jsonGate.value
  });
  steps.push(
    step(
      'the content-type gate rejects an HTML page served as 200',
      refusedBecause(wrongType, 'unsupported-content-type'),
      wrongType.isFailure() ? wrongType.message : 'unexpectedly succeeded'
    )
  );

  // 5. The size cap is counted during the read, so a lying Content-Length does not help.
  const capped = await deps.saferFetchText(`${params.baseUrl}/big`, {
    addressGuard: guard,
    maxResponseBytes: 1024
  });
  steps.push(
    step(
      'the streaming size cap trips despite a lying Content-Length',
      refusedBecause(capped, 'too-large'),
      capped.isFailure() ? capped.message : 'unexpectedly succeeded'
    )
  );

  // 6. A guarded redirect walk: every hop address-checked before it is requested.
  const followed = await deps.saferFetchText(`${params.baseUrl}/redirect`, {
    addressGuard: guard,
    redirectPolicy: 'validate-each-hop'
  });
  steps.push(
    step(
      'a redirect is followed only after the guard clears the new hop',
      followed.isSuccess(),
      followed.isSuccess() ? `chain ${followed.value.urlChain.join(' → ')}` : followed.message
    )
  );

  // 7. The one that matters: a 302 to the cloud metadata endpoint. The guard refuses the hop,
  //    so the request is never made — a failure that arrived after the connect would look
  //    identical to the caller and would still have hit the metadata service.
  const ssrf = await deps.saferFetchText(`${params.baseUrl}/redirect-to-metadata`, {
    addressGuard: guard,
    redirectPolicy: 'validate-each-hop'
  });
  steps.push(
    step(
      'a 302 to 169.254.169.254 is refused at the hop, before any connection',
      refusedByGuard(ssrf, '169.254.169.254'),
      ssrf.isFailure() ? ssrf.message : 'unexpectedly succeeded'
    )
  );

  // 8. Retry: the endpoint fails once and then answers. Every attempt re-walks from hop 0, so
  //    the guard runs again rather than reusing the verdict that cleared the first attempt.
  const retried = await deps.saferFetchText(`${params.baseUrl}/flaky`, {
    addressGuard: guard,
    retry: { attempts: 2, baseDelayMs: 10, maxDelayMs: 50 }
  });
  steps.push(
    step(
      'a 503 is retried, and the retry re-runs the guard from hop 0',
      retried.isSuccess(),
      retried.isSuccess() ? `recovered: "${retried.value.value}"` : retried.message
    )
  );

  // 9. Retry declines a non-idempotent method by default: a timeout does not say whether the
  //    server processed the request.
  const post = await deps.saferFetchText(`${params.baseUrl}/always-503`, {
    addressGuard: guard,
    method: 'POST',
    body: 'payload',
    retry: { attempts: 2, baseDelayMs: 10 }
  });
  steps.push(
    step(
      'a POST is not retried without retryNonIdempotent',
      refusedBecause(post, 'http-status'),
      post.isFailure() ? post.message : 'unexpectedly succeeded'
    )
  );

  return succeed({ steps, allAsExpected: steps.every((s) => s.asExpected) });
}
