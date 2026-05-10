jest.mock('../../src/io', () => {
  const actual = jest.requireActual('../../src/io') as typeof import('../../src/io');

  return {
    ...actual,
    promptHidden: jest.fn(),
    promptVisible: jest.fn()
  };
});

jest.mock('../../src/keystore', () => {
  const actual = jest.requireActual('../../src/keystore') as typeof import('../../src/keystore');

  return {
    ...actual,
    storeSecret: jest.fn()
  };
});

import '@fgv/ts-utils-jest';

import { succeed } from '@fgv/ts-utils';

import { KsCli } from '../../src/app';
import { promptHidden, promptVisible } from '../../src/io';
import { storeSecret } from '../../src/keystore';

describe('KsCli put command', () => {
  const promptHiddenMock = jest.mocked(promptHidden);
  const promptVisibleMock = jest.mocked(promptVisible);
  const storeSecretMock = jest.mocked(storeSecret);
  const originalFgvPassword = process.env.FGV_KS_PASSWORD;
  const originalKsPassword = process.env.KS_PASSWORD;

  beforeEach(() => {
    process.env.FGV_KS_PASSWORD = 'test-password';
    delete process.env.KS_PASSWORD;

    promptHiddenMock.mockReset();
    promptVisibleMock.mockReset();
    storeSecretMock.mockReset();

    promptHiddenMock.mockResolvedValue(succeed('secret-value'));
    promptVisibleMock.mockResolvedValue(succeed('secret-name'));
    storeSecretMock.mockResolvedValue(succeed('/mock/keystore/path'));
  });

  afterAll(() => {
    if (originalFgvPassword === undefined) {
      delete process.env.FGV_KS_PASSWORD;
    } else {
      process.env.FGV_KS_PASSWORD = originalFgvPassword;
    }

    if (originalKsPassword === undefined) {
      delete process.env.KS_PASSWORD;
    } else {
      process.env.KS_PASSWORD = originalKsPassword;
    }
  });

  test('prompts for both the secret name and value when no name is provided', async () => {
    await new KsCli().run(['node', 'ks', 'put']);

    expect(promptVisibleMock).toHaveBeenCalledWith('Secret name: ');
    expect(promptHiddenMock).toHaveBeenCalledWith('Secret value: ');
    expect(storeSecretMock).toHaveBeenCalledWith(
      expect.any(String),
      'test-password',
      'secret-name',
      'secret-value',
      {
        description: undefined,
        replace: false
      }
    );
  });

  test('uses --name and only prompts for the secret value', async () => {
    await new KsCli().run(['node', 'ks', 'put', '--name', 'api-key']);

    expect(promptVisibleMock).not.toHaveBeenCalled();
    expect(promptHiddenMock).toHaveBeenCalledWith('Secret value: ');
    expect(storeSecretMock).toHaveBeenCalledWith(
      expect.any(String),
      'test-password',
      'api-key',
      'secret-value',
      {
        description: undefined,
        replace: false
      }
    );
  });

  test('continues to accept a positional secret name for compatibility', async () => {
    await new KsCli().run(['node', 'ks', 'put', 'legacy-key']);

    expect(promptVisibleMock).not.toHaveBeenCalled();
    expect(promptHiddenMock).toHaveBeenCalledWith('Secret value: ');
    expect(storeSecretMock).toHaveBeenCalledWith(
      expect.any(String),
      'test-password',
      'legacy-key',
      'secret-value',
      {
        description: undefined,
        replace: false
      }
    );
  });
});
