/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * AI completion route handler.
 * @packageDocumentation
 */

import { Hono } from 'hono';
import { AiAssist } from '@fgv/ts-extras';

import { aiCompletionRequest } from './model';

/**
 * Hono sub-app with AI completion routes.
 * @public
 */
export const aiRoutes: Hono = new Hono();

aiRoutes.post('/completion', async (c) => {
  const body = await c.req.json().catch(() => undefined);
  if (body === undefined) {
    return c.json({ error: 'invalid JSON body' }, 400);
  }

  const requestResult = aiCompletionRequest.convert(body);
  if (requestResult.isFailure()) {
    return c.json({ error: `invalid request: ${requestResult.message}` }, 400);
  }
  const request = requestResult.value;

  const descriptorResult = AiAssist.getProviderDescriptor(request.providerId);
  if (descriptorResult.isFailure()) {
    return c.json({ error: descriptorResult.message }, 400);
  }
  const descriptor = descriptorResult.value;

  const prompt = new AiAssist.AiPrompt(request.prompt.user, request.prompt.system);

  const completionResult = await AiAssist.callProviderCompletion({
    descriptor,
    apiKey: request.apiKey,
    prompt,
    additionalMessages: request.additionalMessages,
    temperature: request.temperature,
    modelOverride: request.modelOverride,
    tools: request.tools
  });

  if (completionResult.isFailure()) {
    return c.json({ error: completionResult.message }, 502);
  }

  return c.json(completionResult.value);
});
