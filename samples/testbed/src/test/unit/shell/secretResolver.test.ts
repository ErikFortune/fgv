import '@fgv/ts-utils-jest';
import { resolveSecret } from '../../../shell/secretResolver';

describe('resolveSecret (B-1 stub)', () => {
  test('returns the documented B-1 stub failure naming the KeyStore id and env-var fallback', async () => {
    const result = await resolveSecret({
      spec: {
        id: 'openai-api-key',
        envVarName: 'OPENAI_API_KEY',
        description: 'OpenAI completions'
      },
      keyStore: undefined,
      getEnvVar: () => undefined
    });
    expect(result).toFailWith(/B-1 stub/i);
    expect(result).toFailWith(/openai-api-key/);
    expect(result).toFailWith(/OPENAI_API_KEY/);
    expect(result).toFailWith(/OpenAI completions/);
  });

  test('the stub does not depend on the keyStore or env-var lookup yet', async () => {
    const result = await resolveSecret({
      spec: { id: 'x', envVarName: 'X', description: 'irrelevant' },
      keyStore: undefined,
      getEnvVar: (name) => (name === 'X' ? 'env-value' : undefined)
    });
    // B-1 stub always fails; B-3 will wire real resolution.
    expect(result.isFailure()).toBe(true);
  });
});
