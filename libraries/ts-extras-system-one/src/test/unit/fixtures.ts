/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { choice, noul, score, type ChoiceQuestion, type Fetch } from '@typesafe-ai/sdk';
import { createSystemOneClient, type ICreateSystemOneClientParams, type ISystemOneClient } from '../../index';

/** One recorded `fetch` call. */
export interface IFetchCall {
  readonly url: string;
  readonly init: RequestInit | undefined;
}

/** A scripted reply: a response, a rejection, or a function of the call. */
export type Reply = Response | Error | ((url: string, init: RequestInit | undefined) => Promise<Response>);

/** A `fetch` that answers each call with the next scripted reply, and records the calls. */
export interface IScriptedFetch {
  readonly fetch: Fetch;
  readonly calls: IFetchCall[];
}

export function scriptedFetch(...replies: Reply[]): IScriptedFetch {
  const calls: IFetchCall[] = [];
  const fetch: Fetch = async (url, init) => {
    calls.push({ url, init });
    const reply = replies[Math.min(calls.length - 1, replies.length - 1)];
    if (reply instanceof Response) {
      return reply.clone();
    }
    if (reply instanceof Error) {
      throw reply;
    }
    return reply(url, init);
  };
  return { fetch, calls };
}

/** A JSON response, as CLM and the SDK's servers send. */
export function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers }
  });
}

/** A response whose body is the given text, unparsed. */
export function textResponse(status: number, text: string, headers: Record<string, string> = {}): Response {
  return new Response(text, { status, headers });
}

/** A fetch reply that never settles unless its signal aborts, as the platform `fetch` does. */
export function hangingReply(url: string, init: RequestInit | undefined): Promise<Response> {
  return new Promise((resolve, reject) => {
    if (init?.signal?.aborted === true) {
      reject(new Error(`aborted ${url}`));
    }
    init?.signal?.addEventListener('abort', () => reject(new Error(`aborted ${url}`)));
  });
}

/** A fetch reply that waits `ms` before answering. */
export function delayedReply(ms: number, response: Response): () => Promise<Response> {
  return () => new Promise((resolve) => setTimeout(() => resolve(response.clone()), ms));
}

/** The JSON body a recorded call sent. */
export function sentBody(call: IFetchCall): unknown {
  return JSON.parse(String(call.init?.body));
}

/** A client against the scripted fetch, with retries off unless overridden. */
export function clientFor(
  fetch: Fetch,
  overrides: Partial<ICreateSystemOneClientParams> = {}
): ISystemOneClient {
  return createSystemOneClient({
    baseUrl: 'http://cfg.test:8700',
    model: 'clm-latest',
    apiKey: 'test-key',
    fetch,
    retry: { maxRetries: 0, backoffInitialMs: 1, backoffMaxMs: 1 },
    ...overrides
  }).orThrow();
}

/** One question of each type. */
export const threeQuestions = {
  billing: noul('Is this about billing?'),
  route: choice('Which team should take it?', { billing: 'The billing team', tech: 'Technical support' }),
  urgency: score('How urgent is it?', ['not urgent', 'somewhat urgent', 'very urgent'])
} as const;

/** A CLM-shaped body for {@link threeQuestions} (E5, E6): `confidence` present, `billing_units` sent. */
export function clmBody(): Record<string, unknown> {
  return {
    model: 'clm-latest',
    answers: {
      billing: { type: 'noul', noul: 0.91 },
      route: {
        type: 'choice',
        choice: 'billing',
        confidence: 0.8,
        probabilities: { billing: 0.9, tech: 0.1 }
      },
      urgency: {
        type: 'score',
        score: 0.6,
        confidence: 0.35,
        legend: byIndex(['not urgent', 'somewhat urgent', 'very urgent']),
        probabilities: byIndex([0.5, 0.4, 0.1])
      }
    },
    usage: { billing_units: 3, input_tokens: 42, output_tokens: 0 }
  };
}

/** A Jev/SDK-shaped body for {@link threeQuestions} (E11): no `billing_units`, extra fields. */
export function jevBody(): Record<string, unknown> {
  return {
    model: 'jev-latest',
    id: 'resp-1',
    answers: {
      billing: { type: 'noul', noul: 0.2, explanation: 'undeclared' },
      route: {
        type: 'choice',
        choice: 'tech',
        confidence: 0.61,
        probabilities: { billing: 0.25, tech: 0.75 },
        rationale: 'undeclared'
      },
      urgency: {
        type: 'score',
        score: 1.5,
        confidence: 0.12,
        legend: byIndex(['not urgent', 'somewhat urgent', 'very urgent']),
        probabilities: byIndex([0.1, 0.3, 0.6]),
        rationale: 'undeclared'
      }
    },
    usage: { input_tokens: 17, output_tokens: 0 }
  };
}

/** Keys a list by its indices, as the wire keys score levels: `{ "0": …, "1": … }`. */
export function byIndex<T>(values: ReadonlyArray<T>): Record<string, T> {
  return Object.fromEntries(values.map((value, index) => [String(index), value]));
}

/** A two-option choice with no descriptions, whose candidates are one character each. */
// eslint-disable-next-line @rushstack/no-new-null -- the SDK's own type for an undescribed label
export function shortChoice(instructions: string | null = null): ChoiceQuestion<{ a: null; b: null }> {
  return choice(instructions, { a: null, b: null });
}

/** A valid body answering `{ ids }` each with a {@link shortChoice} answer. */
export function shortChoiceBody(...ids: string[]): Record<string, unknown> {
  const answers: Record<string, unknown> = {};
  for (const id of ids) {
    answers[id] = { type: 'choice', choice: 'a', probabilities: { a: 0.75, b: 0.25 } };
  }
  return { model: 'clm-latest', answers, usage: { input_tokens: 1, output_tokens: 0 } };
}
