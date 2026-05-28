jest.mock('../../src/io', () => {
  const actual = jest.requireActual('../../src/io') as typeof import('../../src/io');

  return {
    ...actual,
    promptHidden: jest.fn(),
    promptVisible: jest.fn(),
    copyTextToClipboard: jest.fn()
  };
});

jest.mock('../../src/keystore', () => {
  const actual = jest.requireActual('../../src/keystore') as typeof import('../../src/keystore');

  return {
    ...actual,
    storeSecret: jest.fn(),
    readSecret: jest.fn(),
    openKeystore: jest.fn(),
    saveKeystoreFile: jest.fn()
  };
});

import '@fgv/ts-utils-jest';

import { fail, succeed } from '@fgv/ts-utils';

import { KsCli } from '../../src/app';
import { copyTextToClipboard, promptHidden, promptVisible } from '../../src/io';
import { openKeystore, readSecret, saveKeystoreFile, storeSecret } from '../../src/keystore';

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

describe('KsCli get command', () => {
  const readSecretMock = jest.mocked(readSecret);
  const copyTextToClipboardMock = jest.mocked(copyTextToClipboard);
  const originalFgvPassword = process.env.FGV_KS_PASSWORD;
  const originalKsPassword = process.env.KS_PASSWORD;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    process.env.FGV_KS_PASSWORD = 'test-password';
    delete process.env.KS_PASSWORD;

    readSecretMock.mockReset();
    copyTextToClipboardMock.mockReset();
    readSecretMock.mockResolvedValue(succeed('hello'));
    copyTextToClipboardMock.mockResolvedValue(succeed('copied'));

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(((__code?: number) => {
      throw new Error('process.exit');
    }) as never);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    exitSpy.mockRestore();
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

  test('emits the raw secret to stdout by default (text encoding)', async () => {
    await new KsCli().run(['node', 'ks', 'get', 'my-key']);
    expect(consoleLogSpy).toHaveBeenCalledWith('hello');
  });

  test('emits the base64-encoded secret with --encoding base64', async () => {
    await new KsCli().run(['node', 'ks', 'get', 'my-key', '--encoding', 'base64']);
    expect(consoleLogSpy).toHaveBeenCalledWith('aGVsbG8=');
  });

  test('emits the hex-encoded secret with --encoding hex', async () => {
    await new KsCli().run(['node', 'ks', 'get', 'my-key', '--encoding', 'hex']);
    expect(consoleLogSpy).toHaveBeenCalledWith('68656c6c6f');
  });

  test('copies the encoded value to the clipboard when --clipboard is set', async () => {
    await new KsCli().run(['node', 'ks', 'get', 'my-key', '--clipboard', '--encoding', 'base64']);
    expect(copyTextToClipboardMock).toHaveBeenCalledWith('aGVsbG8=');
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  test('rejects unknown encoding values', async () => {
    await expect(new KsCli().run(['node', 'ks', 'get', 'my-key', '--encoding', 'utf16'])).rejects.toThrow(
      'process.exit'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringMatching(/invalid encoding 'utf16'/i));
  });

  test('round-trips non-ASCII UTF-8 bytes through base64', async () => {
    readSecretMock.mockResolvedValue(succeed('café-✓'));
    await new KsCli().run(['node', 'ks', 'get', 'my-key', '--encoding', 'base64']);
    const emitted = consoleLogSpy.mock.calls[0][0] as string;
    expect(Buffer.from(emitted, 'base64').toString('utf8')).toBe('café-✓');
  });
});

describe('KsCli export command', () => {
  const openKeystoreMock = jest.mocked(openKeystore);
  const saveKeystoreFileMock = jest.mocked(saveKeystoreFile);
  const copyTextToClipboardMock = jest.mocked(copyTextToClipboard);
  const promptHiddenMock = jest.mocked(promptHidden);
  const originalFgvPassword = process.env.FGV_KS_PASSWORD;
  const originalKsPassword = process.env.KS_PASSWORD;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  const makeKeystore = (secrets: Record<string, string>): unknown => ({
    listSecrets: jest.fn(() => succeed(Object.keys(secrets))),
    getApiKey: jest.fn((name: string) =>
      secrets[name] !== undefined ? succeed(secrets[name]) : fail(`Secret '${name}' not found`)
    ),
    importApiKey: jest.fn(() => Promise.resolve(succeed({ entry: {}, replaced: false }))),
    save: jest.fn(() => Promise.resolve(succeed({ format: 'keystore-v1' })))
  });

  beforeEach(() => {
    process.env.FGV_KS_PASSWORD = 'test-password';
    delete process.env.KS_PASSWORD;

    openKeystoreMock.mockReset();
    saveKeystoreFileMock.mockReset();
    copyTextToClipboardMock.mockReset();
    promptHiddenMock.mockReset();
    copyTextToClipboardMock.mockResolvedValue(succeed('copied'));
    saveKeystoreFileMock.mockReturnValue(succeed('/mock/keystore'));

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(((__code?: number) => {
      throw new Error('process.exit');
    }) as never);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    exitSpy.mockRestore();
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

  test('renders the template with raw secret values by default', async () => {
    openKeystoreMock.mockResolvedValue(
      succeed({
        path: '/mock/keystore',
        keystore: makeKeystore({ xai: 'hello' }) as never
      })
    );

    await new KsCli().run(['node', 'ks', 'export', '--template-string', 'export X={{xai}}']);

    expect(consoleLogSpy).toHaveBeenCalledWith("export X='hello'");
  });

  test('renders the template with base64-encoded secret values', async () => {
    openKeystoreMock.mockResolvedValue(
      succeed({
        path: '/mock/keystore',
        keystore: makeKeystore({ xai: 'hello' }) as never
      })
    );

    await new KsCli().run([
      'node',
      'ks',
      'export',
      '--template-string',
      'export X={{xai}}',
      '--encoding',
      'base64'
    ]);

    expect(consoleLogSpy).toHaveBeenCalledWith("export X='aGVsbG8='");
  });

  test('renders the template with hex-encoded secret values', async () => {
    openKeystoreMock.mockResolvedValue(
      succeed({
        path: '/mock/keystore',
        keystore: makeKeystore({ xai: 'hello' }) as never
      })
    );

    await new KsCli().run([
      'node',
      'ks',
      'export',
      '--template-string',
      'export X={{xai}}',
      '--encoding',
      'hex'
    ]);

    expect(consoleLogSpy).toHaveBeenCalledWith("export X='68656c6c6f'");
  });

  test('rejects unknown encoding values', async () => {
    await expect(
      new KsCli().run([
        'node',
        'ks',
        'export',
        '--template-string',
        'export X={{xai}}',
        '--encoding',
        'utf16'
      ])
    ).rejects.toThrow('process.exit');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringMatching(/invalid encoding 'utf16'/i));
  });

  test('copies the encoded rendered template to the clipboard', async () => {
    openKeystoreMock.mockResolvedValue(
      succeed({
        path: '/mock/keystore',
        keystore: makeKeystore({ xai: 'hello' }) as never
      })
    );

    await new KsCli().run([
      'node',
      'ks',
      'export',
      '--template-string',
      'export X={{xai}}',
      '--encoding',
      'base64',
      '--clipboard'
    ]);

    expect(copyTextToClipboardMock).toHaveBeenCalledWith("export X='aGVsbG8='");
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  test('persists the raw unencoded prompted value with --persist-missing + non-text encoding', async () => {
    const keystore = makeKeystore({}) as {
      importApiKey: jest.Mock;
      save: jest.Mock;
    };
    openKeystoreMock.mockResolvedValue(
      succeed({
        path: '/mock/keystore',
        keystore: keystore as never
      })
    );
    promptHiddenMock.mockResolvedValue(succeed('raw-secret'));

    await new KsCli().run([
      'node',
      'ks',
      'export',
      '--template-string',
      'export X={{missing}}',
      '--encoding',
      'base64',
      '--persist-missing'
    ]);

    // Template substitution sees the encoded value.
    expect(consoleLogSpy).toHaveBeenCalledWith("export X='cmF3LXNlY3JldA=='");
    // But the keystore receives the raw, unencoded value — never the base64 form.
    expect(keystore.importApiKey).toHaveBeenCalledWith('missing', 'raw-secret', { replace: true });
    expect(keystore.importApiKey).not.toHaveBeenCalledWith('missing', 'cmF3LXNlY3JldA==', expect.anything());
  });
});
