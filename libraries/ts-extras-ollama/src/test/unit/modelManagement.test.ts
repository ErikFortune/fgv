import '@fgv/ts-utils-jest';
import { type IOllamaClient, listModels, listRunning, showModel, deleteModel } from '../../index';
import { psResponse, showResponse, showResponseMinimal, tagsResponse } from './fixtures/wireFixtures';

/**
 * Builds a structural client mock exposing only the methods under test, typed back to
 * {@link IOllamaClient}. This is the layer-1 seam from the design (§7) — it verifies the wire→fgv
 * mapping and Result success/failure paths without HTTP or the `ollama` lib internals.
 */
function mockClient(methods: Partial<Record<'list' | 'ps' | 'show' | 'delete', unknown>>): IOllamaClient {
  return methods as unknown as IOllamaClient;
}

describe('listModels', () => {
  test('normalizes /api/tags entries to camelCase with a parsed modifiedAt Date', async () => {
    const client = mockClient({ list: jest.fn().mockResolvedValue(tagsResponse) });
    expect(await listModels(client)).toSucceedAndSatisfy((models) => {
      expect(models).toHaveLength(2);
      const [full, sparse] = models;
      expect(full.name).toBe('llama3.1:8b');
      expect(full.size).toBe(4661226402);
      expect(full.digest).toBe('sha256:abc123');
      expect(full.modifiedAt).toBeInstanceOf(Date);
      expect(full.modifiedAt.toISOString()).toBe('2024-08-01T12:34:56.789Z');
      expect(full.details).toEqual({
        parentModel: '',
        format: 'gguf',
        family: 'llama',
        families: ['llama'],
        parameterSize: '8.0B',
        quantizationLevel: 'Q4_0'
      });
      // An empty `parent_model` is preserved as '' (present-and-empty, distinct from undefined).
      expect(full.details.parentModel).toBe('');
      // Sparse details: omitted wire fields normalize to undefined.
      expect(sparse.details.format).toBe('gguf');
      expect(sparse.details.parameterSize).toBeUndefined();
      expect(sparse.details.quantizationLevel).toBeUndefined();
      expect(sparse.details.parentModel).toBeUndefined();
      expect(sparse.details.families).toBeUndefined();
    });
  });

  test('fails when the client throws', async () => {
    const client = mockClient({ list: jest.fn().mockRejectedValue(new Error('connection refused')) });
    expect(await listModels(client)).toFailWith(/connection refused/);
  });
});

describe('listRunning', () => {
  test('normalizes /api/ps entries with expiresAt Date and sizeVram', async () => {
    const client = mockClient({ ps: jest.fn().mockResolvedValue(psResponse) });
    expect(await listRunning(client)).toSucceedAndSatisfy((running) => {
      expect(running).toHaveLength(1);
      const [model] = running;
      expect(model.name).toBe('llama3.1:8b');
      expect(model.sizeVram).toBe(4661226402);
      expect(model.expiresAt).toBeInstanceOf(Date);
      expect(model.expiresAt.toISOString()).toBe('2024-08-01T13:00:00.000Z');
      expect(model.details.family).toBe('llama');
    });
  });

  test('fails when the client throws', async () => {
    const client = mockClient({ ps: jest.fn().mockRejectedValue(new Error('daemon down')) });
    expect(await listRunning(client)).toFailWith(/daemon down/);
  });
});

describe('showModel', () => {
  test('normalizes /api/show including the model_info metadata bag', async () => {
    const show = jest.fn().mockResolvedValue(showResponse);
    const client = mockClient({ show });
    expect(await showModel(client, 'llama3.1:8b')).toSucceedAndSatisfy((info) => {
      expect(info.modelfile).toBe('FROM llama3.1:8b');
      expect(info.parameters).toBe('stop "<|eot_id|>"');
      expect(info.template).toBe('{{ .Prompt }}');
      expect(info.capabilities).toEqual(['completion', 'tools']);
      expect(info.modelInfo).toEqual({
        'general.architecture': 'llama',
        'llama.context_length': 131072,
        'llama.embedding_length': 4096
      });
      expect(info.details.parameterSize).toBe('8.0B');
    });
    // No verbose flag was requested, so only `model` is on the request body.
    expect(show).toHaveBeenCalledWith({ model: 'llama3.1:8b' });
  });

  test('maps an absent model_info to undefined', async () => {
    const client = mockClient({ show: jest.fn().mockResolvedValue(showResponseMinimal) });
    expect(await showModel(client, 'custom:latest')).toSucceedAndSatisfy((info) => {
      expect(info.modelInfo).toBeUndefined();
      expect(info.capabilities).toBeUndefined();
      expect(info.modelfile).toBeUndefined();
      expect(info.details.family).toBe('llama');
    });
  });

  test('forwards verbose: true on the /api/show request body', async () => {
    const show = jest.fn().mockResolvedValue(showResponse);
    const client = mockClient({ show });
    expect(await showModel(client, 'llama3.1:8b', { verbose: true })).toSucceed();
    expect(show).toHaveBeenCalledWith({ model: 'llama3.1:8b', verbose: true });
  });

  test('fails when the client throws (unknown model)', async () => {
    const client = mockClient({ show: jest.fn().mockRejectedValue(new Error('model not found')) });
    expect(await showModel(client, 'nope:latest')).toFailWith(/model not found/);
  });
});

describe('deleteModel', () => {
  test('succeeds with a meaningful result and forwards the model name', async () => {
    const del = jest.fn().mockResolvedValue({ status: 'success' });
    const client = mockClient({ delete: del });
    expect(await deleteModel(client, 'llama3.1:8b')).toSucceedWith({
      model: 'llama3.1:8b',
      deleted: true
    });
    expect(del).toHaveBeenCalledWith({ model: 'llama3.1:8b' });
  });

  test('fails when the client throws (missing model)', async () => {
    const client = mockClient({ delete: jest.fn().mockRejectedValue(new Error('model not found')) });
    expect(await deleteModel(client, 'nope:latest')).toFailWith(/model not found/);
  });
});
