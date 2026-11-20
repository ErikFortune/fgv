import '@fgv/ts-utils-jest';
import { Ollama } from 'ollama';
import { createOllamaClient } from '../../index';

/**
 * Reads the upstream client's (protected) resolved host for assertion. The `Ollama` instance
 * keeps its config on a protected field; tests reach it through a narrow cast rather than widening
 * the production surface.
 */
function resolvedHost(client: unknown): string {
  return (client as { config: { host: string } }).config.host;
}

describe('createOllamaClient', () => {
  test('succeeds with default host when no params are supplied', () => {
    expect(createOllamaClient()).toSucceedAndSatisfy((client) => {
      expect(client).toBeInstanceOf(Ollama);
      expect(resolvedHost(client)).toBe('http://127.0.0.1:11434');
    });
  });

  test('applies a custom host', () => {
    expect(createOllamaClient({ host: 'http://10.0.0.5:11434' })).toSucceedAndSatisfy((client) => {
      expect(resolvedHost(client)).toBe('http://10.0.0.5:11434');
    });
  });

  test('accepts a custom fetch and headers', () => {
    const customFetch = jest.fn() as unknown as typeof fetch;
    expect(
      createOllamaClient({
        host: 'http://localhost:11434',
        fetch: customFetch,
        headers: { Authorization: 'Bearer token' }
      })
    ).toSucceedAndSatisfy((client) => {
      expect(client).toBeInstanceOf(Ollama);
    });
  });

  test('fails when the host is malformed (upstream constructor throws)', () => {
    expect(createOllamaClient({ host: 'not a url' })).toFailWith(/invalid url/i);
  });
});
