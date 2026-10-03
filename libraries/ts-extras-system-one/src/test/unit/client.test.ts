/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Logging } from '@fgv/ts-utils';
import * as Sdk from '@typesafe-ai/sdk';
import {
  askSystemOne,
  choice,
  createSystemOneClient,
  listSystemOneModels,
  noul,
  score,
  type ISystemOneClient
} from '../../index';
import {
  clientFor,
  jsonResponse,
  scriptedFetch,
  sentBody,
  shortChoice,
  shortChoiceBody,
  threeQuestions
} from './fixtures';

const envNames = [
  'TYPESAFE_BASE_URL',
  'TYPESAFE_DEFAULT_MODEL',
  'TYPESAFE_API_KEY',
  'TYPESAFE_LOG_LEVEL'
] as const;

describe('createSystemOneClient', () => {
  const saved: Partial<Record<(typeof envNames)[number], string>> = {};

  beforeEach(() => {
    for (const name of envNames) {
      saved[name] = process.env[name];
    }
  });

  afterEach(() => {
    for (const name of envNames) {
      if (saved[name] === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = saved[name];
      }
    }
    jest.restoreAllMocks();
  });

  test('U24 rejects a relative or non-http(s) baseUrl and a blank model; accepts an empty apiKey', async () => {
    const base = { model: 'clm-latest', apiKey: 'k' };
    expect(createSystemOneClient({ ...base, baseUrl: 'cfg.test:8700/v1' })).toFailWith(
      /baseUrl must be an absolute http\(s\) URL/
    );
    expect(createSystemOneClient({ ...base, baseUrl: '/v1' })).toFailWith(/baseUrl/);
    expect(createSystemOneClient({ ...base, baseUrl: 'ftp://cfg.test' })).toFailWith(/baseUrl/);
    expect(createSystemOneClient({ ...base, baseUrl: 'http://cfg.test/?x=1' })).toFailWith(/baseUrl/);
    expect(createSystemOneClient({ ...base, baseUrl: 'http://cfg.test/#frag' })).toFailWith(/baseUrl/);
    expect(createSystemOneClient({ ...base, baseUrl: 'http://user:pw@cfg.test' })).toFailWith(/baseUrl/);
    expect(createSystemOneClient({ ...base, baseUrl: 'http://user@cfg.test' })).toFailWith(/baseUrl/);
    expect(createSystemOneClient({ baseUrl: 'http://cfg.test', model: '   ', apiKey: 'k' })).toFailWith(
      /model must be a non-empty string/
    );

    // an empty key is used as given, never replaced by the environment's
    process.env.TYPESAFE_API_KEY = 'env-key';
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    const keyless = clientFor(fetch, { apiKey: '', model: '  clm-latest  ' });
    expect(keyless.model).toBe('clm-latest');
    expect(
      await askSystemOne(keyless, { state: 's', questions: { q: shortChoice() }, inputLimit: 'unchecked' })
    ).toSucceed();
    expect(new Headers(calls[0].init?.headers).get('authorization')).toBe('Bearer');
  });

  test('the client is frozen, and the model sent is the one it was created with', async () => {
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    const client = clientFor(fetch);
    expect(Object.isFrozen(client)).toBe(true);
    expect(
      await askSystemOne(client, { state: 's', questions: { q: shortChoice() }, inputLimit: 'unchecked' })
    ).toSucceed();
    expect(sentBody(calls[0])).toEqual(expect.objectContaining({ model: 'clm-latest' }));
  });

  test('U24 an option the SDK refuses is a failure, not a throw', () => {
    expect(
      createSystemOneClient({ baseUrl: 'http://cfg.test', model: 'm', apiKey: 'k', timeoutMs: -1 })
    ).toFailWith(/timeout/);
  });

  test('U21 the request body carries the configured model, whatever TYPESAFE_DEFAULT_MODEL says', async () => {
    process.env.TYPESAFE_DEFAULT_MODEL = 'env-model';
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    expect(
      await askSystemOne(clientFor(fetch), {
        state: 's',
        questions: { q: shortChoice() },
        inputLimit: 'unchecked'
      })
    ).toSucceed();
    expect(sentBody(calls[0])).toEqual(expect.objectContaining({ model: 'clm-latest' }));
  });

  test('U22 the configured baseUrl is the one called, whatever TYPESAFE_BASE_URL says', async () => {
    process.env.TYPESAFE_BASE_URL = 'http://env.test';
    const { fetch, calls } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    expect(
      await askSystemOne(clientFor(fetch), {
        state: 's',
        questions: { q: shortChoice() },
        inputLimit: 'unchecked'
      })
    ).toSucceed();
    expect(calls[0].url).toBe('http://cfg.test:8700/v1/systemone');
  });

  test('U23 the state never reaches a log, even with TYPESAFE_LOG_LEVEL=debug and a logger at all', async () => {
    process.env.TYPESAFE_LOG_LEVEL = 'debug';
    const logger = new Logging.InMemoryLogger('all');
    const seen: unknown[] = [];
    for (const method of ['detail', 'info', 'warn', 'error'] as const) {
      const original = logger[method].bind(logger);
      jest.spyOn(logger, method).mockImplementation((message?: unknown, ...parameters: unknown[]) => {
        seen.push(message, ...parameters);
        return original(message, ...parameters);
      });
    }
    const { fetch } = scriptedFetch(jsonResponse(200, shortChoiceBody('q')));
    const client = clientFor(fetch, { logger });
    expect(
      await askSystemOne(client, {
        state: 'ticket MARKER-7f3a says hello',
        questions: { q: shortChoice() },
        inputLimit: 'unchecked'
      })
    ).toSucceed();
    // the SDK logged its request summary, so logging is live
    expect(seen.some((entry) => String(entry).includes('POST /v1/systemone'))).toBe(true);
    const rendered = seen
      .map((entry) => (typeof entry === 'string' ? entry : JSON.stringify(entry)))
      .join('\n');
    expect(rendered).not.toContain('MARKER-7f3a');
  });

  test('U23 with no logger, console is never called', async () => {
    process.env.TYPESAFE_LOG_LEVEL = 'info';
    const spies = (['log', 'debug', 'info', 'warn', 'error'] as const).map((method) =>
      jest.spyOn(console, method).mockImplementation(() => undefined)
    );
    const { fetch, calls } = scriptedFetch(
      jsonResponse(503, { error: 'busy' }),
      jsonResponse(200, shortChoiceBody('q'))
    );
    const client = clientFor(fetch, { retry: { maxRetries: 1, backoffInitialMs: 1, backoffMaxMs: 1 } });
    expect(
      await askSystemOne(client, { state: 's', questions: { q: shortChoice() }, inputLimit: 'unchecked' })
    ).toSucceed();
    expect(calls).toHaveLength(2);
    for (const spy of spies) {
      expect(spy).not.toHaveBeenCalled();
    }
  });

  test('U25 noul, choice and score are the SDK’s own functions', () => {
    expect(noul).toBe(Sdk.noul);
    expect(choice).toBe(Sdk.choice);
    expect(score).toBe(Sdk.score);
  });

  test('a client not created by createSystemOneClient is refused', async () => {
    const forged: ISystemOneClient = { model: 'clm-latest' };
    const asked = await askSystemOne(forged, {
      state: 's',
      questions: threeQuestions,
      inputLimit: 'unchecked'
    });
    expect(asked).toFailWith(/^invalid-request: client was not created by createSystemOneClient/);
    expect(asked.detail).toBe('invalid-request');
    expect(await listSystemOneModels(forged)).toFailWith(/^invalid-request: client was not created/);
  });
});

describe('listSystemOneModels', () => {
  const card = { name: 'clm-latest', description: 'CLM v0.1 8B', release_date: '2026-09-01' };

  test('U19 a CLM { models: [...] } body succeeds, keeping only the declared fields', async () => {
    const { fetch, calls } = scriptedFetch(jsonResponse(200, { models: [{ ...card, extra: 'x' }] }));
    expect(await listSystemOneModels(clientFor(fetch))).toSucceedWith([card]);
    expect(calls[0].url).toBe('http://cfg.test:8700/v1/models');
  });

  test('U19 a bare array is invalid-response', async () => {
    const { fetch } = scriptedFetch(jsonResponse(200, []));
    expect(await listSystemOneModels(clientFor(fetch))).toFailWith(
      /^invalid-response \(status 200\): Unexpected response shape/
    );
    const withId = scriptedFetch(jsonResponse(200, [], { 'x-typesafe-request-id': 'req-5' }));
    expect(await listSystemOneModels(clientFor(withId.fetch))).toFailWith(
      /^invalid-response \(status 200\) \(request req-5\): Unexpected response shape/
    );
  });

  test('U19 an element missing name is invalid-response', async () => {
    const { fetch } = scriptedFetch(
      jsonResponse(
        200,
        { models: [{ description: card.description, release_date: card.release_date }] },
        { 'x-typesafe-request-id': 'req-4' }
      )
    );
    expect(await listSystemOneModels(clientFor(fetch))).toFailWith(
      /^invalid-response \(status 200\) \(request req-4\):.*name/
    );
  });

  test('U19 an HTTP failure is classified as askSystemOne would', async () => {
    const { fetch } = scriptedFetch(jsonResponse(401, { error: 'bad key' }));
    expect(await listSystemOneModels(clientFor(fetch))).toFailWith(/^unauthorized \(status 401\)/);
  });
});
