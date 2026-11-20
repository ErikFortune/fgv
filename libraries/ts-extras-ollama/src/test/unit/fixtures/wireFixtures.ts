import { type ListResponse, type ShowResponse } from 'ollama';

/**
 * Canned wire-shape fixtures for the layer-1 structural-client-mock tests.
 *
 * These mirror the actual JSON the Ollama daemon returns — snake_case keys and **string**
 * timestamps. The upstream `ollama` types annotate `modified_at` / `expires_at` as `Date`, but the
 * library returns `response.json()` verbatim so the wire delivers RFC3339 strings; each fixture is
 * cast once (`as unknown as <Response>`) to reconcile the inaccurate upstream annotation with the
 * real shape, so the normalization layer is exercised against the data it actually sees.
 */

/** `GET /api/tags` — one fully-detailed model plus one with sparse `details` (missing fields). */
export const tagsResponse: ListResponse = {
  models: [
    {
      name: 'llama3.1:8b',
      model: 'llama3.1:8b',
      modified_at: '2024-08-01T12:34:56.789Z',
      size: 4661226402,
      digest: 'sha256:abc123',
      details: {
        parent_model: '',
        format: 'gguf',
        family: 'llama',
        families: ['llama'],
        parameter_size: '8.0B',
        quantization_level: 'Q4_0'
      }
    },
    {
      name: 'custom:latest',
      model: 'custom:latest',
      modified_at: '2024-09-15T08:00:00.000Z',
      size: 1234567,
      digest: 'sha256:def456',
      // Sparse details — Ollama omits fields it cannot determine; exercises the optional-field path.
      details: {
        format: 'gguf',
        family: 'llama'
      }
    }
  ]
} as unknown as ListResponse;

/** `GET /api/ps` — a running model with `expires_at` + `size_vram` (no `modified_at`). */
export const psResponse: ListResponse = {
  models: [
    {
      name: 'llama3.1:8b',
      model: 'llama3.1:8b',
      size: 4661226402,
      digest: 'sha256:abc123',
      details: {
        parent_model: '',
        format: 'gguf',
        family: 'llama',
        families: ['llama'],
        parameter_size: '8.0B',
        quantization_level: 'Q4_0'
      },
      expires_at: '2024-08-01T13:00:00.000Z',
      size_vram: 4661226402
    }
  ]
} as unknown as ListResponse;

/** `POST /api/show` — full response including the low-level `model_info` metadata bag. */
export const showResponse: ShowResponse = {
  modelfile: 'FROM llama3.1:8b',
  parameters: 'stop "<|eot_id|>"',
  template: '{{ .Prompt }}',
  details: {
    parent_model: '',
    format: 'gguf',
    family: 'llama',
    families: ['llama'],
    parameter_size: '8.0B',
    quantization_level: 'Q4_0'
  },
  model_info: {
    'general.architecture': 'llama',
    'llama.context_length': 131072,
    'llama.embedding_length': 4096
  },
  capabilities: ['completion', 'tools']
} as unknown as ShowResponse;

/** `POST /api/show` — a minimal response with `model_info` and `capabilities` omitted. */
export const showResponseMinimal: ShowResponse = {
  details: {
    format: 'gguf',
    family: 'llama'
  }
} as unknown as ShowResponse;
