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

/**
 * Tests for image (vision) attachment handling on the non-streaming completion
 * paths, including the pre-flight capability check.
 */

import '@fgv/ts-utils-jest';

import { AiAssist } from '../../..';
import {
  anthropicResponse,
  geminiResponse,
  makeDescriptor,
  mockFetchResponse,
  openAiResponse,
  responsesApiResponse,
  testPrompt
} from './apiClientFixtures';

// ============================================================================
// Image input (vision) across chat adapters
// ============================================================================

const TEST_PNG: AiAssist.IAiImageAttachment = {
  mimeType: 'image/png',
  base64: 'AAAA'
};
const TEST_JPEG: AiAssist.IAiImageAttachment = {
  mimeType: 'image/jpeg',
  base64: 'BBBB',
  detail: 'high'
};

function visionPrompt(...attachments: AiAssist.IAiImageAttachment[]): AiAssist.AiPrompt {
  return new AiAssist.AiPrompt('what is in this picture?', 'You see all.', attachments);
}

describe('image input (vision) — pre-flight', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('rejects when attachments present and provider does not accept image input', async () => {
    const descriptor = makeDescriptor({ acceptsImageInput: false });

    const result = await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'test-key',
      ...visionPrompt(TEST_PNG).toRequest()
    });

    expect(result).toFailWith(/does not accept image input/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('passes through when attachments empty even on non-vision provider', async () => {
    const descriptor = makeDescriptor({ acceptsImageInput: false });
    mockFetchResponse(openAiResponse('ok'));

    const result = await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'test-key',
      ...testPrompt.toRequest()
    });

    expect(result).toSucceed();
  });
});

describe('image input — openai chat completions', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('user message becomes a parts array with image_url', async () => {
    mockFetchResponse(openAiResponse('a cat'));
    const descriptor = makeDescriptor({ apiFormat: 'openai', acceptsImageInput: true });

    await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'test-key',
      ...visionPrompt(TEST_PNG).toRequest()
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const userMsg = body.messages.find((m: { role: string }) => m.role === 'user');
    expect(Array.isArray(userMsg.content)).toBe(true);
    expect(userMsg.content[0]).toEqual({ type: 'text', text: 'what is in this picture?' });
    expect(userMsg.content[1]).toEqual({
      type: 'image_url',
      image_url: { url: 'data:image/png;base64,AAAA' }
    });
  });

  test('forwards detail hint when supplied', async () => {
    mockFetchResponse(openAiResponse('ok'));
    const descriptor = makeDescriptor({ apiFormat: 'openai', acceptsImageInput: true });

    await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'test-key',
      ...visionPrompt(TEST_JPEG).toRequest()
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const userMsg = body.messages.find((m: { role: string }) => m.role === 'user');
    expect(userMsg.content[1]).toEqual({
      type: 'image_url',
      image_url: { url: 'data:image/jpeg;base64,BBBB', detail: 'high' }
    });
  });

  test('keeps user content as a string when no attachments', async () => {
    mockFetchResponse(openAiResponse('ok'));
    const descriptor = makeDescriptor({ apiFormat: 'openai' });

    await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'test-key',
      ...testPrompt.toRequest()
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const userMsg = body.messages.find((m: { role: string }) => m.role === 'user');
    expect(typeof userMsg.content).toBe('string');
  });

  test('attaches multiple images in the same user message', async () => {
    mockFetchResponse(openAiResponse('ok'));
    const descriptor = makeDescriptor({ apiFormat: 'openai', acceptsImageInput: true });

    await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'test-key',
      ...visionPrompt(TEST_PNG, TEST_JPEG).toRequest()
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const userMsg = body.messages.find((m: { role: string }) => m.role === 'user');
    expect(userMsg.content).toHaveLength(3); // text + 2 images
    expect(userMsg.content[1].type).toBe('image_url');
    expect(userMsg.content[2].type).toBe('image_url');
  });
});

describe('image input — openai responses API', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('user message uses input_text and input_image part types', async () => {
    mockFetchResponse(responsesApiResponse('ok'));
    const descriptor = makeDescriptor({ apiFormat: 'openai', acceptsImageInput: true });

    await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'test-key',
      ...visionPrompt(TEST_PNG).toRequest(),
      tools: [{ type: 'web_search' }] // forces Responses API path
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const userInput = body.input.find((m: { role: string }) => m.role === 'user');
    expect(userInput.content[0]).toEqual({ type: 'input_text', text: 'what is in this picture?' });
    expect(userInput.content[1]).toEqual({
      type: 'input_image',
      image_url: 'data:image/png;base64,AAAA'
    });
  });

  test('forwards detail hint on input_image', async () => {
    mockFetchResponse(responsesApiResponse('ok'));
    const descriptor = makeDescriptor({ apiFormat: 'openai', acceptsImageInput: true });

    await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'test-key',
      ...visionPrompt(TEST_JPEG).toRequest(),
      tools: [{ type: 'web_search' }]
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const userInput = body.input.find((m: { role: string }) => m.role === 'user');
    expect(userInput.content[1]).toEqual({
      type: 'input_image',
      image_url: 'data:image/jpeg;base64,BBBB',
      detail: 'high'
    });
  });
});

describe('image input — anthropic', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('user message becomes a parts array with image source block', async () => {
    mockFetchResponse(anthropicResponse('ok'));
    const descriptor = makeDescriptor({
      apiFormat: 'anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      acceptsImageInput: true
    });

    await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'test-key',
      ...visionPrompt(TEST_PNG).toRequest()
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const userMsg = body.messages[0];
    expect(userMsg.content[0]).toEqual({ type: 'text', text: 'what is in this picture?' });
    expect(userMsg.content[1]).toEqual({
      type: 'image',
      source: { type: 'base64', media_type: 'image/png', data: 'AAAA' }
    });
  });

  test('preserves system as a top-level field with attachments', async () => {
    mockFetchResponse(anthropicResponse('ok'));
    const descriptor = makeDescriptor({
      apiFormat: 'anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      acceptsImageInput: true
    });

    await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'test-key',
      ...visionPrompt(TEST_PNG).toRequest()
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.system).toBe('You see all.');
  });
});

describe('image input — gemini', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('user parts include inlineData block', async () => {
    mockFetchResponse(geminiResponse('ok'));
    const descriptor = makeDescriptor({
      apiFormat: 'gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      acceptsImageInput: true,
      streamingCorsRestricted: false,
      defaultModel: 'gemini-2.5-flash'
    });

    await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'test-key',
      ...visionPrompt(TEST_PNG).toRequest()
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const userTurn = body.contents[0];
    expect(userTurn.role).toBe('user');
    expect(userTurn.parts[0]).toEqual({ text: 'what is in this picture?' });
    expect(userTurn.parts[1]).toEqual({
      inlineData: { mimeType: 'image/png', data: 'AAAA' }
    });
  });
});

describe('image input — proxied completion forwards attachments', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('includes attachments in the proxy body when present', async () => {
    mockFetchResponse({ content: 'ok', truncated: false });

    await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      ...visionPrompt(TEST_PNG).toRequest()
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.messages[body.messages.length - 1].attachments).toEqual([TEST_PNG]);
  });

  test('omits attachments key when none present', async () => {
    mockFetchResponse({ content: 'ok', truncated: false });

    await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest()
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.messages[body.messages.length - 1].attachments).toBeUndefined();
  });
});
