jest.mock('../../src/io', () => {
  const actual = jest.requireActual('../../src/io') as typeof import('../../src/io');

  return {
    ...actual,
    copyTextToClipboard: jest.fn(),
    promptHidden: jest.fn(),
    promptVisible: jest.fn(),
    readAllFromStdin: jest.fn(),
    readTextFile: jest.fn()
  };
});

jest.mock('../../src/keystore', () => {
  const actual = jest.requireActual('../../src/keystore') as typeof import('../../src/keystore');

  return {
    ...actual,
    changeKeystorePassword: jest.fn(),
    createKeystore: jest.fn(),
    listSecrets: jest.fn(),
    openKeystore: jest.fn(),
    readSecret: jest.fn(),
    removeSecret: jest.fn(),
    saveKeystoreFile: jest.fn(),
    storeSecret: jest.fn()
  };
});

import '@fgv/ts-utils-jest';

import { succeed, fail } from '@fgv/ts-utils';

import { KsCli } from '../../src/app';
import {
  copyTextToClipboard,
  promptHidden,
  promptVisible,
  readAllFromStdin,
  readTextFile
} from '../../src/io';
import {
  changeKeystorePassword,
  createKeystore,
  listSecrets,
  openKeystore,
  readSecret,
  removeSecret,
  saveKeystoreFile,
  storeSecret
} from '../../src/keystore';

const promptHiddenMock = jest.mocked(promptHidden);
const promptVisibleMock = jest.mocked(promptVisible);
const storeSecretMock = jest.mocked(storeSecret);
const createKeystoreMock = jest.mocked(createKeystore);
const changeKeystorePasswordMock = jest.mocked(changeKeystorePassword);
const readSecretMock = jest.mocked(readSecret);
const listSecretsMock = jest.mocked(listSecrets);
const removeSecretMock = jest.mocked(removeSecret);
const openKeystoreMock = jest.mocked(openKeystore);
const saveKeystoreFileMock = jest.mocked(saveKeystoreFile);
const copyTextToClipboardMock = jest.mocked(copyTextToClipboard);
const readTextFileMock = jest.mocked(readTextFile);
const readAllFromStdinMock = jest.mocked(readAllFromStdin);

const mockKeystoreOpenResult = {
  path: '/home/test/.fgv-ks',
  keystore: {
    getApiKey: jest.fn(),
    importApiKey: jest.fn(),
    save: jest.fn()
  }
};

function saveEnv(): Record<string, string | undefined> {
  return {
    FGV_KS_PASSWORD: process.env.FGV_KS_PASSWORD,
    KS_PASSWORD: process.env.KS_PASSWORD
  };
}

function restoreEnv(saved: Record<string, string | undefined>): void {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe('KsCli put command', () => {
  let savedEnv: Record<string, string | undefined>;

  beforeEach(() => {
    savedEnv = saveEnv();
    process.env.FGV_KS_PASSWORD = 'test-password';
    delete process.env.KS_PASSWORD;

    promptHiddenMock.mockReset();
    promptVisibleMock.mockReset();
    storeSecretMock.mockReset();

    promptHiddenMock.mockResolvedValue(succeed('secret-value'));
    promptVisibleMock.mockResolvedValue(succeed('secret-name'));
    storeSecretMock.mockResolvedValue(succeed(undefined));
  });

  afterEach(() => {
    restoreEnv(savedEnv);
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

describe('KsCli init command', () => {
  let savedEnv: Record<string, string | undefined>;
  let exitSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    savedEnv = saveEnv();
    process.env.FGV_KS_PASSWORD = 'test-password';
    delete process.env.KS_PASSWORD;

    createKeystoreMock.mockReset();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw Object.assign(new Error(`process.exit:${code as number}`), { isProcessExit: true });
    });
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    restoreEnv(savedEnv);
    jest.restoreAllMocks();
  });

  test('creates a keystore using the password from the environment', async () => {
    createKeystoreMock.mockResolvedValue(succeed({ path: '/test/ks', keystore: {} as never }));

    await new KsCli().run(['node', 'ks', 'init']);

    expect(createKeystoreMock).toHaveBeenCalledWith(expect.any(String), 'test-password');
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('exits with an error when createKeystore fails', async () => {
    createKeystoreMock.mockResolvedValue(fail('Already exists'));

    await expect(new KsCli().run(['node', 'ks', 'init'])).rejects.toThrow('process.exit:1');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Already exists'));
  });
});

describe('KsCli password command', () => {
  let savedEnv: Record<string, string | undefined>;
  let exitSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    savedEnv = saveEnv();
    process.env.FGV_KS_PASSWORD = 'current-password';
    delete process.env.KS_PASSWORD;

    changeKeystorePasswordMock.mockReset();
    promptHiddenMock.mockReset();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw Object.assign(new Error(`process.exit:${code as number}`), { isProcessExit: true });
    });
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    restoreEnv(savedEnv);
    jest.restoreAllMocks();
  });

  test('changes the password using explicit new-password env var', async () => {
    process.env.NEW_PW_VAR = 'new-password';
    changeKeystorePasswordMock.mockResolvedValue(succeed({ path: '/test/ks', keystore: {} as never }));

    try {
      await new KsCli().run(['node', 'ks', 'password', '--new-password-env', 'NEW_PW_VAR']);
    } finally {
      delete process.env.NEW_PW_VAR;
    }

    expect(changeKeystorePasswordMock).toHaveBeenCalledWith(
      expect.any(String),
      'current-password',
      'new-password'
    );
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('prompts for and confirms new password when no explicit new-password source is given', async () => {
    changeKeystorePasswordMock.mockResolvedValue(succeed({ path: '/test/ks', keystore: {} as never }));
    promptHiddenMock
      .mockResolvedValueOnce(succeed('new-password'))
      .mockResolvedValueOnce(succeed('new-password'));

    await new KsCli().run(['node', 'ks', 'password']);

    expect(promptHiddenMock).toHaveBeenCalledWith('New keystore password: ');
    expect(promptHiddenMock).toHaveBeenCalledWith('New keystore password (confirm): ');
    expect(changeKeystorePasswordMock).toHaveBeenCalledWith(
      expect.any(String),
      'current-password',
      'new-password'
    );
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('exits with error when new password confirmation does not match', async () => {
    promptHiddenMock
      .mockResolvedValueOnce(succeed('new-password'))
      .mockResolvedValueOnce(succeed('different-password'));

    await expect(new KsCli().run(['node', 'ks', 'password'])).rejects.toThrow('process.exit:1');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Passwords do not match'));
  });

  test('exits with error when changeKeystorePassword fails', async () => {
    changeKeystorePasswordMock.mockResolvedValue(fail('Wrong password'));
    promptHiddenMock
      .mockResolvedValueOnce(succeed('new-password'))
      .mockResolvedValueOnce(succeed('new-password'));

    await expect(new KsCli().run(['node', 'ks', 'password'])).rejects.toThrow('process.exit:1');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Wrong password'));
  });
});

describe('KsCli get command', () => {
  let savedEnv: Record<string, string | undefined>;
  let exitSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    savedEnv = saveEnv();
    process.env.FGV_KS_PASSWORD = 'test-password';
    delete process.env.KS_PASSWORD;

    readSecretMock.mockReset();
    copyTextToClipboardMock.mockReset();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw Object.assign(new Error(`process.exit:${code as number}`), { isProcessExit: true });
    });
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    restoreEnv(savedEnv);
    jest.restoreAllMocks();
  });

  test('prints the secret value to stdout', async () => {
    readSecretMock.mockResolvedValue(succeed('my-secret-value'));

    await new KsCli().run(['node', 'ks', 'get', 'my-key']);

    expect(readSecretMock).toHaveBeenCalledWith(expect.any(String), 'test-password', 'my-key');
    expect(consoleLogSpy).toHaveBeenCalledWith('my-secret-value');
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('copies the secret to the clipboard when --clipboard is specified', async () => {
    readSecretMock.mockResolvedValue(succeed('my-secret-value'));
    copyTextToClipboardMock.mockResolvedValue(succeed('copied'));

    await new KsCli().run(['node', 'ks', 'get', 'my-key', '--clipboard']);

    expect(copyTextToClipboardMock).toHaveBeenCalledWith('my-secret-value');
    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('exits with error when readSecret fails', async () => {
    readSecretMock.mockResolvedValue(fail('Secret not found'));

    await expect(new KsCli().run(['node', 'ks', 'get', 'my-key'])).rejects.toThrow('process.exit:1');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Secret not found'));
  });

  test('exits with error when clipboard copy fails', async () => {
    readSecretMock.mockResolvedValue(succeed('my-secret-value'));
    copyTextToClipboardMock.mockResolvedValue(fail('Clipboard unavailable'));

    await expect(new KsCli().run(['node', 'ks', 'get', 'my-key', '--clipboard'])).rejects.toThrow(
      'process.exit:1'
    );

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Clipboard unavailable'));
  });
});

describe('KsCli list command', () => {
  let savedEnv: Record<string, string | undefined>;
  let exitSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    savedEnv = saveEnv();
    process.env.FGV_KS_PASSWORD = 'test-password';
    delete process.env.KS_PASSWORD;

    listSecretsMock.mockReset();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw Object.assign(new Error(`process.exit:${code as number}`), { isProcessExit: true });
    });
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    restoreEnv(savedEnv);
    jest.restoreAllMocks();
  });

  test('prints each secret name on its own line', async () => {
    listSecretsMock.mockResolvedValue(succeed(['key-a', 'key-b']));

    await new KsCli().run(['node', 'ks', 'list']);

    expect(listSecretsMock).toHaveBeenCalledWith(expect.any(String), 'test-password');
    expect(consoleLogSpy).toHaveBeenCalledWith('key-a');
    expect(consoleLogSpy).toHaveBeenCalledWith('key-b');
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('exits with error when listSecrets fails', async () => {
    listSecretsMock.mockResolvedValue(fail('Keystore locked'));

    await expect(new KsCli().run(['node', 'ks', 'list'])).rejects.toThrow('process.exit:1');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Keystore locked'));
  });
});

describe('KsCli remove command', () => {
  let savedEnv: Record<string, string | undefined>;
  let exitSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    savedEnv = saveEnv();
    process.env.FGV_KS_PASSWORD = 'test-password';
    delete process.env.KS_PASSWORD;

    removeSecretMock.mockReset();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw Object.assign(new Error(`process.exit:${code as number}`), { isProcessExit: true });
    });
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    restoreEnv(savedEnv);
    jest.restoreAllMocks();
  });

  test('removes the named secret', async () => {
    removeSecretMock.mockResolvedValue(succeed(undefined));

    await new KsCli().run(['node', 'ks', 'remove', 'my-key']);

    expect(removeSecretMock).toHaveBeenCalledWith(expect.any(String), 'test-password', 'my-key');
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('exits with error when removeSecret fails', async () => {
    removeSecretMock.mockResolvedValue(fail('Key not found'));

    await expect(new KsCli().run(['node', 'ks', 'remove', 'my-key'])).rejects.toThrow('process.exit:1');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Key not found'));
  });
});

describe('KsCli export command', () => {
  let savedEnv: Record<string, string | undefined>;
  let exitSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    savedEnv = saveEnv();
    process.env.FGV_KS_PASSWORD = 'test-password';
    delete process.env.KS_PASSWORD;

    openKeystoreMock.mockReset();
    copyTextToClipboardMock.mockReset();
    promptHiddenMock.mockReset();
    saveKeystoreFileMock.mockReset();
    mockKeystoreOpenResult.keystore.getApiKey.mockReset();
    mockKeystoreOpenResult.keystore.importApiKey.mockReset();
    mockKeystoreOpenResult.keystore.save.mockReset();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw Object.assign(new Error(`process.exit:${code as number}`), { isProcessExit: true });
    });
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    restoreEnv(savedEnv);
    jest.restoreAllMocks();
  });

  test('renders a template-string and prints the result to stdout', async () => {
    openKeystoreMock.mockResolvedValue(succeed(mockKeystoreOpenResult as never));
    mockKeystoreOpenResult.keystore.getApiKey.mockReturnValue(succeed('my-api-key'));

    await new KsCli().run(['node', 'ks', 'export', '--template-string', 'export XAI_API_KEY={{xai}}']);

    expect(openKeystoreMock).toHaveBeenCalledWith(expect.any(String), 'test-password');
    expect(consoleLogSpy).toHaveBeenCalledWith("export XAI_API_KEY='my-api-key'");
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('copies rendered output to clipboard when --clipboard is specified', async () => {
    openKeystoreMock.mockResolvedValue(succeed(mockKeystoreOpenResult as never));
    mockKeystoreOpenResult.keystore.getApiKey.mockReturnValue(succeed('my-api-key'));
    copyTextToClipboardMock.mockResolvedValue(succeed('copied'));

    await new KsCli().run([
      'node',
      'ks',
      'export',
      '--template-string',
      'export XAI_API_KEY={{xai}}',
      '--clipboard'
    ]);

    expect(copyTextToClipboardMock).toHaveBeenCalledWith("export XAI_API_KEY='my-api-key'");
    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('exits with error when no template source is specified', async () => {
    await expect(new KsCli().run(['node', 'ks', 'export'])).rejects.toThrow('process.exit:1');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('template'));
  });

  test('exits with error when openKeystore fails', async () => {
    openKeystoreMock.mockResolvedValue(fail('Wrong password'));

    await expect(
      new KsCli().run(['node', 'ks', 'export', '--template-string', 'export X={{x}}'])
    ).rejects.toThrow('process.exit:1');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Wrong password'));
  });

  test('prompts for missing secrets and persists them when --persist-missing is set', async () => {
    openKeystoreMock.mockResolvedValue(succeed(mockKeystoreOpenResult as never));
    mockKeystoreOpenResult.keystore.getApiKey.mockReturnValue(fail('not found'));
    promptHiddenMock.mockResolvedValue(succeed('prompted-value'));
    mockKeystoreOpenResult.keystore.importApiKey.mockResolvedValue(succeed(undefined));
    mockKeystoreOpenResult.keystore.save.mockResolvedValue(succeed('encrypted'));
    saveKeystoreFileMock.mockResolvedValue(succeed('written'));

    await new KsCli().run([
      'node',
      'ks',
      'export',
      '--template-string',
      'export X={{xai}}',
      '--persist-missing'
    ]);

    expect(promptHiddenMock).toHaveBeenCalledWith("Secret 'xai' is missing. Enter value: ");
    expect(mockKeystoreOpenResult.keystore.importApiKey).toHaveBeenCalledWith('xai', 'prompted-value', {
      replace: true
    });
    expect(consoleLogSpy).toHaveBeenCalledWith("export X='prompted-value'");
    expect(exitSpy).not.toHaveBeenCalled();
  });
});

describe('KsCli session command', () => {
  let exitSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    promptHiddenMock.mockReset();
    copyTextToClipboardMock.mockReset();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw Object.assign(new Error(`process.exit:${code as number}`), { isProcessExit: true });
    });
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('emits a shell export statement for the password', async () => {
    promptHiddenMock.mockResolvedValue(succeed('my-password'));

    await new KsCli().run(['node', 'ks', 'session']);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/^export FGV_KS_PASSWORD=/));
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('uses a custom variable name when --var is specified', async () => {
    promptHiddenMock.mockResolvedValue(succeed('my-password'));

    await new KsCli().run(['node', 'ks', 'session', '--var', 'MY_KS_PW']);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/^export MY_KS_PW=/));
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('exits with error when --var is not a valid shell identifier', async () => {
    await expect(new KsCli().run(['node', 'ks', 'session', '--var', '123invalid'])).rejects.toThrow(
      'process.exit:1'
    );

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('123invalid'));
  });

  test('copies the export statement to the clipboard when --clipboard is specified', async () => {
    promptHiddenMock.mockResolvedValue(succeed('my-password'));
    copyTextToClipboardMock.mockResolvedValue(succeed('copied'));

    await new KsCli().run(['node', 'ks', 'session', '--clipboard']);

    expect(copyTextToClipboardMock).toHaveBeenCalledWith(expect.stringMatching(/^export FGV_KS_PASSWORD=/));
    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('exits with error when promptHidden fails', async () => {
    promptHiddenMock.mockResolvedValue(fail('Not a TTY'));

    await expect(new KsCli().run(['node', 'ks', 'session'])).rejects.toThrow('process.exit:1');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Not a TTY'));
  });
});

describe('KsCli resolvePassword - explicit source failure', () => {
  let savedEnv: Record<string, string | undefined>;
  let exitSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    savedEnv = saveEnv();
    delete process.env.FGV_KS_PASSWORD;
    delete process.env.KS_PASSWORD;

    promptHiddenMock.mockReset();
    readTextFileMock.mockReset();
    listSecretsMock.mockReset();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw Object.assign(new Error(`process.exit:${code as number}`), { isProcessExit: true });
    });
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    restoreEnv(savedEnv);
    jest.restoreAllMocks();
  });

  test('returns the error when --password-file is provided but the file is missing', async () => {
    readTextFileMock.mockReturnValue(fail('File not found'));

    await expect(
      new KsCli().run(['node', 'ks', 'list', '--password-file', '/nonexistent/pw.txt'])
    ).rejects.toThrow('process.exit:1');

    expect(promptHiddenMock).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('File not found'));
  });

  test('falls back to interactive prompt when no password source is configured', async () => {
    promptHiddenMock.mockResolvedValue(succeed('prompted-password'));
    listSecretsMock.mockResolvedValue(succeed(['key-a']));
    jest.spyOn(console, 'log').mockImplementation(() => {});

    await new KsCli().run(['node', 'ks', 'list']);

    expect(promptHiddenMock).toHaveBeenCalledWith('Keystore password: ');
    expect(exitSpy).not.toHaveBeenCalled();
  });
});

describe('KsCli password command - env var isolation for new password', () => {
  let savedEnv: Record<string, string | undefined>;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    savedEnv = saveEnv();
    process.env.FGV_KS_PASSWORD = 'current-password';
    delete process.env.KS_PASSWORD;

    changeKeystorePasswordMock.mockReset();
    promptHiddenMock.mockReset();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw Object.assign(new Error(`process.exit:${code as number}`), { isProcessExit: true });
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    restoreEnv(savedEnv);
    jest.restoreAllMocks();
  });

  test('prompts for new password even when FGV_KS_PASSWORD is set', async () => {
    changeKeystorePasswordMock.mockResolvedValue(succeed({ path: '/test/ks', keystore: {} as never }));
    promptHiddenMock
      .mockResolvedValueOnce(succeed('brand-new-password'))
      .mockResolvedValueOnce(succeed('brand-new-password'));

    await new KsCli().run(['node', 'ks', 'password']);

    expect(changeKeystorePasswordMock).toHaveBeenCalledWith(
      expect.any(String),
      'current-password',
      'brand-new-password'
    );
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
