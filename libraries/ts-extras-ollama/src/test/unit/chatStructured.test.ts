import '@fgv/ts-utils-jest';
import { succeed } from '@fgv/ts-utils';
import { JsonSchema, type JsonObject } from '@fgv/ts-json-base';
import { type IOllamaChatMessage, type IOllamaClient, chatStructured, createOllamaClient } from '../../index';

const personSchema = JsonSchema.object({
  name: JsonSchema.string(),
  age: JsonSchema.integer()
});
type Person = JsonSchema.Static<typeof personSchema>;

/** A streaming `/api/chat` chunk in the upstream `ChatResponse` shape (the fields we consume). */
interface IChatChunk {
  model: string;
  message: { role: string; content: string };
  done: boolean;
  done_reason?: string;
}

/**
 * Builds a structural mock of the upstream `AbortableAsyncIterator<ChatResponse>` returned by
 * `client.chat({ stream: true })`. `abort()` flips a flag the generator checks before each chunk.
 */
function makeChatIterator(
  chunks: ReadonlyArray<IChatChunk>
): { abort: jest.Mock } & AsyncIterable<IChatChunk> {
  let aborted = false;
  return {
    abort: jest.fn(() => {
      aborted = true;
    }),
    async *[Symbol.asyncIterator](): AsyncGenerator<IChatChunk> {
      for (const chunk of chunks) {
        if (aborted) {
          throw new Error('The operation was aborted');
        }
        yield chunk;
      }
    }
  };
}

/**
 * Like {@link makeChatIterator}, but yields control (a real timer) after each chunk so a signal
 * aborted *after* the listener is attached lands mid-stream — exercising the abort-listener path
 * (vs. the already-aborted branch).
 */
function makeDelayedChatIterator(
  chunks: ReadonlyArray<IChatChunk>
): { abort: jest.Mock } & AsyncIterable<IChatChunk> {
  let aborted = false;
  return {
    abort: jest.fn(() => {
      aborted = true;
    }),
    async *[Symbol.asyncIterator](): AsyncGenerator<IChatChunk> {
      for (const chunk of chunks) {
        if (aborted) {
          throw new Error('The operation was aborted');
        }
        yield chunk;
        await new Promise<void>((resolve) => setTimeout(resolve, 30));
      }
    }
  };
}

function mockChatClient(chat: unknown): IOllamaClient {
  return { chat } as unknown as IOllamaClient;
}

/** Chunks whose assembled `message.content` is `{"name":"ada","age":42}`. */
function validPersonChunks(model: string = 'llama3.1:8b'): IChatChunk[] {
  return [
    { model, message: { role: 'assistant', content: '{"name":"ada",' }, done: false },
    { model, message: { role: 'assistant', content: '"age":42}' }, done: false },
    { model, message: { role: 'assistant', content: '' }, done: true, done_reason: 'stop' }
  ];
}

const userTurn: ReadonlyArray<IOllamaChatMessage> = [{ role: 'user', content: 'Describe Ada.' }];

describe('chatStructured (layer 1 — structural client mock)', () => {
  test('validates the assembled document against the same schema sent on the wire', async () => {
    const chat = jest.fn().mockResolvedValue(makeChatIterator(validPersonChunks()));
    const client = mockChatClient(chat);

    expect(
      await chatStructured(client, { model: 'llama3.1:8b', messages: userTurn, schema: personSchema })
    ).toSucceedAndSatisfy((result) => {
      const value: Person = result.value;
      expect(value).toEqual({ name: 'ada', age: 42 });
      expect(result.raw).toBe('{"name":"ada","age":42}');
      expect(result.model).toBe('llama3.1:8b');
      expect(result.doneReason).toBe('stop');
    });

    // The wire request: streaming, messages mapped, and the sanitized schema as `format`.
    const request = chat.mock.calls[0][0] as JsonObject;
    expect(request.stream).toBe(true);
    expect(request.messages).toEqual([{ role: 'user', content: 'Describe Ada.' }]);
    const format = request.format as JsonObject;
    expect(format.type).toBe('object');
    expect(format.properties).toEqual({ name: { type: 'string' }, age: { type: 'integer' } });
    expect(format.required).toEqual(['name', 'age']);
    // Draft-07-only keywords are stripped before hitting Ollama's `format`.
    expect(format).not.toHaveProperty('additionalProperties');
    expect(format).not.toHaveProperty('$schema');
    // No options / keep_alive were supplied.
    expect(request).not.toHaveProperty('options');
    expect(request).not.toHaveProperty('keep_alive');
  });

  test('forwards options, keep_alive, and base64 images verbatim', async () => {
    const chat = jest.fn().mockResolvedValue(makeChatIterator(validPersonChunks()));
    const client = mockChatClient(chat);
    const messages: ReadonlyArray<IOllamaChatMessage> = [
      { role: 'system', content: 'Be terse.' },
      { role: 'user', content: 'Look', images: ['aGVsbG8='] }
    ];

    expect(
      await chatStructured(client, {
        model: 'llama3.1:8b',
        messages,
        schema: personSchema,
        options: { temperature: 0, seed: 7 },
        keepAlive: '5m'
      })
    ).toSucceed();

    const request = chat.mock.calls[0][0] as JsonObject;
    expect(request.options).toEqual({ temperature: 0, seed: 7 });
    expect(request.keep_alive).toBe('5m');
    expect(request.messages).toEqual([
      { role: 'system', content: 'Be terse.' },
      { role: 'user', content: 'Look', images: ['aGVsbG8='] }
    ]);
  });

  test('fails with context when the response parses but violates the schema', async () => {
    const chunks: IChatChunk[] = [
      {
        model: 'llama3.1:8b',
        message: { role: 'assistant', content: '{"name":"ada","age":"old"}' },
        done: true
      }
    ];
    const client = mockChatClient(jest.fn().mockResolvedValue(makeChatIterator(chunks)));

    expect(
      await chatStructured(client, { model: 'llama3.1:8b', messages: userTurn, schema: personSchema })
    ).toFailWith(/chatStructured\(llama3\.1:8b\): response failed schema validation/i);
  });

  test('fails with context when the response is not valid JSON', async () => {
    const chunks: IChatChunk[] = [
      { model: 'llama3.1:8b', message: { role: 'assistant', content: 'not json at all' }, done: true }
    ];
    const client = mockChatClient(jest.fn().mockResolvedValue(makeChatIterator(chunks)));

    expect(
      await chatStructured(client, { model: 'llama3.1:8b', messages: userTurn, schema: personSchema })
    ).toFailWith(/chatStructured\(llama3\.1:8b\): response was not valid JSON/i);
  });

  test('an already-aborted signal cancels the generation', async () => {
    const iterator = makeChatIterator(validPersonChunks());
    const client = mockChatClient(jest.fn().mockResolvedValue(iterator));
    const controller = new AbortController();
    controller.abort();

    expect(
      await chatStructured(client, {
        model: 'llama3.1:8b',
        messages: userTurn,
        schema: personSchema,
        signal: controller.signal
      })
    ).toFailWith(/abort/i);
    expect(iterator.abort).toHaveBeenCalledTimes(1);
  });

  test('a mid-stream abort cancels the generation and removes the listener', async () => {
    const iterator = makeDelayedChatIterator(validPersonChunks());
    const client = mockChatClient(jest.fn().mockResolvedValue(iterator));
    const controller = new AbortController();
    const removeSpy = jest.spyOn(controller.signal, 'removeEventListener');

    const promise = chatStructured(client, {
      model: 'llama3.1:8b',
      messages: userTurn,
      schema: personSchema,
      signal: controller.signal
    });
    // Let the request settle and the listener attach + first chunk land, then abort mid-stream so
    // the abort fires through the listener (not the already-aborted branch).
    await new Promise<void>((resolve) => setTimeout(resolve, 5));
    controller.abort();

    expect(await promise).toFailWith(/abort/i);
    expect(iterator.abort).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalledWith('abort', expect.any(Function));
  });

  test('removes the abort listener after a successful completion', async () => {
    const client = mockChatClient(jest.fn().mockResolvedValue(makeChatIterator(validPersonChunks())));
    const controller = new AbortController();
    const removeSpy = jest.spyOn(controller.signal, 'removeEventListener');

    expect(
      await chatStructured(client, {
        model: 'llama3.1:8b',
        messages: userTurn,
        schema: personSchema,
        signal: controller.signal
      })
    ).toSucceed();
    expect(removeSpy).toHaveBeenCalledWith('abort', expect.any(Function));
  });
});

describe('chatStructured — draft-07 format sanitizer', () => {
  test('recursively strips $schema and additionalProperties while preserving property names and arrays', async () => {
    // A schema double whose toJson() carries $schema, nested additionalProperties, an array, and a
    // property *named* additionalProperties (which must survive — it is a name, not a keyword).
    const rawSchema: JsonObject = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        nested: {
          type: 'object',
          properties: { x: { type: 'string' } },
          additionalProperties: false
        },
        additionalProperties: { type: 'string' }
      },
      required: ['nested'],
      additionalProperties: false
    };
    const schemaDouble = {
      _type: 'object',
      toJson: () => rawSchema,
      validate: (value: unknown) => succeed(value)
    } as unknown as JsonSchema.ISchemaValidator<unknown>;

    const chat = jest
      .fn()
      .mockResolvedValue(
        makeChatIterator([
          { model: 'm', message: { role: 'assistant', content: '{"nested":{"x":"y"}}' }, done: true }
        ])
      );
    const client = mockChatClient(chat);

    expect(
      await chatStructured(client, { model: 'm', messages: userTurn, schema: schemaDouble })
    ).toSucceed();

    const format = (chat.mock.calls[0][0] as JsonObject).format as JsonObject;
    expect(format).not.toHaveProperty('$schema');
    expect(format).not.toHaveProperty('additionalProperties');
    expect(format.required).toEqual(['nested']);
    const properties = format.properties as JsonObject;
    // The nested object's additionalProperties is stripped too.
    expect(properties.nested).toEqual({ type: 'object', properties: { x: { type: 'string' } } });
    // A property literally named `additionalProperties` is preserved (name, not keyword).
    expect(properties.additionalProperties).toEqual({ type: 'string' });
  });
});

/**
 * Layer 2 — a real client over a mock `fetch` that streams a newline-delimited `/api/chat`
 * response. Proves the no-drift claim end-to-end: the request body that actually goes on the wire
 * carries `format` = the sanitized `schema.toJson()`, and the assembled reply validates.
 */
function ndjsonResponse(lines: ReadonlyArray<string>): Response {
  const bytes = new TextEncoder().encode(lines.join('\n') + '\n');
  const mid = Math.floor(bytes.length / 2);
  const parts = [bytes.slice(0, mid), bytes.slice(mid)];
  let i = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller: ReadableStreamDefaultController<Uint8Array>): void {
      if (i < parts.length) {
        controller.enqueue(parts[i++]);
      } else {
        controller.close();
      }
    }
  });
  return new Response(stream, { status: 200 });
}

describe('chatStructured (layer 2 — fetch-level wire-format integration)', () => {
  test('sends the sanitized schema as the wire format and validates the assembled reply', async () => {
    const lines = [
      JSON.stringify({
        model: 'llama3.1:8b',
        message: { role: 'assistant', content: '{"name":"ada",' },
        done: false
      }),
      JSON.stringify({
        model: 'llama3.1:8b',
        message: { role: 'assistant', content: '"age":42}' },
        done: true,
        done_reason: 'stop'
      })
    ];
    const fetchMock = jest.fn().mockResolvedValue(ndjsonResponse(lines));
    const client = createOllamaClient({ fetch: fetchMock as unknown as typeof fetch }).orThrow();

    expect(
      await chatStructured(client, { model: 'llama3.1:8b', messages: userTurn, schema: personSchema })
    ).toSucceedAndSatisfy((result) => {
      expect(result.value).toEqual({ name: 'ada', age: 42 });
      expect(result.raw).toBe('{"name":"ada","age":42}');
      expect(result.doneReason).toBe('stop');
    });

    // The actual wire body carries the sanitized schema as `format` — no-drift proven end-to-end.
    const requestInit = fetchMock.mock.calls[0][1] as { body: string };
    const body = JSON.parse(requestInit.body) as JsonObject;
    expect(body.stream).toBe(true);
    const format = body.format as JsonObject;
    expect(format.type).toBe('object');
    expect(format.properties).toEqual({ name: { type: 'string' }, age: { type: 'integer' } });
    expect(format).not.toHaveProperty('additionalProperties');
    expect(format).not.toHaveProperty('$schema');
  });
});
