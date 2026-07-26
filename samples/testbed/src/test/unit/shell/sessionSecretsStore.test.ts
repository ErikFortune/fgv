import { act, renderHook } from '@testing-library/react';

import { dedupeRequiredSecrets, useSessionSecretsStore } from '../../../shell/sessionSecretsStore';
import type { IScenario } from '../../../shell';

function makeScenario(id: string, requiredSecrets?: IScenario['requiredSecrets']): IScenario {
  return {
    id,
    title: id,
    description: 'desc',
    category: 'general',
    tags: [],
    requiredSecrets
  };
}

describe('dedupeRequiredSecrets', () => {
  test('returns an empty array when no scenario declares requiredSecrets', () => {
    expect(dedupeRequiredSecrets([makeScenario('a'), makeScenario('b')])).toEqual([]);
  });

  test('collects requiredSecrets across scenarios', () => {
    const specs = dedupeRequiredSecrets([
      makeScenario('a', [{ id: 'openai-api-key', envVarName: 'OPENAI_API_KEY', description: 'openai' }]),
      makeScenario('b', [{ id: 'anthropic-api-key', envVarName: 'ANTHROPIC_API_KEY', description: 'anthropic' }])
    ]);
    expect(specs.map((s) => s.id)).toEqual(['openai-api-key', 'anthropic-api-key']);
  });

  test('dedupes by id, keeping the first occurrence', () => {
    const specs = dedupeRequiredSecrets([
      makeScenario('a', [{ id: 'openai-api-key', envVarName: 'OPENAI_API_KEY', description: 'first' }]),
      makeScenario('b', [{ id: 'openai-api-key', envVarName: 'OPENAI_API_KEY', description: 'second' }])
    ]);
    expect(specs).toHaveLength(1);
    expect(specs[0]?.description).toBe('first');
  });
});

describe('useSessionSecretsStore', () => {
  test('starts with an empty secrets map', () => {
    const { result } = renderHook(() => useSessionSecretsStore());
    expect(result.current.secrets.size).toBe(0);
  });

  test('setSecret stores a value retrievable from the map', () => {
    const { result } = renderHook(() => useSessionSecretsStore());
    act(() => {
      result.current.setSecret('openai-api-key', 'sk-test');
    });
    expect(result.current.secrets.get('openai-api-key')).toBe('sk-test');
  });

  test('setSecret produces a new Map identity on every update', () => {
    const { result } = renderHook(() => useSessionSecretsStore());
    const before = result.current.secrets;
    act(() => {
      result.current.setSecret('openai-api-key', 'sk-test');
    });
    expect(result.current.secrets).not.toBe(before);
  });

  test('setSecret can overwrite an existing value', () => {
    const { result } = renderHook(() => useSessionSecretsStore());
    act(() => {
      result.current.setSecret('openai-api-key', 'sk-first');
    });
    act(() => {
      result.current.setSecret('openai-api-key', 'sk-second');
    });
    expect(result.current.secrets.get('openai-api-key')).toBe('sk-second');
  });
});
