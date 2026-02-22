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

// Mocks before imports
const mockPassword = jest.fn();
jest.mock('@inquirer/prompts', () => ({
  password: mockPassword,
  search: jest.fn()
}));

const mockReadFileSync = jest.fn();
const mockWriteFileSync = jest.fn();
const mockExistsSync = jest.fn();
jest.mock('fs', () => ({
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
  writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args),
  existsSync: (...args: unknown[]) => mockExistsSync(...args)
}));

const mockKeystoreCreate = jest.fn();
const mockKeystoreOpen = jest.fn();
jest.mock('@fgv/ts-extras', () => {
  const actual = jest.requireActual('@fgv/ts-extras');
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CryptoUtils: {
      ...actual.CryptoUtils,
      nodeCryptoProvider: {},
      // eslint-disable-next-line @typescript-eslint/naming-convention
      KeyStore: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        KeyStore: {
          create: mockKeystoreCreate,
          open: mockKeystoreOpen
        }
      }
    }
  };
});

const mockConfirmAction = jest.fn();
const mockShowSuccess = jest.fn();
const mockShowError = jest.fn();
const mockShowInfo = jest.fn();
jest.mock('../../../../commands/workspace/shared', () => ({
  confirmAction: mockConfirmAction,
  showSuccess: mockShowSuccess,
  showError: mockShowError,
  showInfo: mockShowInfo
}));

import { succeed, fail } from '@fgv/ts-utils';
import { createKeystoreCommand } from '../../../../commands/workspace/keystoreCommand';

describe('keystore command', () => {
  let mockConsoleLog: jest.SpyInstance;
  let mockProcessExit: jest.SpyInstance;
  let mockKeystore: {
    initialize: jest.Mock;
    save: jest.Mock;
    unlock: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }) as unknown as () => never);

    mockKeystore = {
      initialize: jest.fn(),
      save: jest.fn(),
      unlock: jest.fn()
    };

    // Default mocks
    mockExistsSync.mockReturnValue(false);
    mockPassword.mockResolvedValue('test-password');
    mockKeystoreCreate.mockReturnValue(succeed(mockKeystore));
    mockKeystore.initialize.mockResolvedValue(succeed(undefined));
    mockKeystore.save.mockResolvedValue(
      succeed({
        format: 'keystore-v1',
        algorithm: 'aes-256-gcm',
        encryptedData: 'encrypted-data',
        keyDerivation: {
          kdf: 'pbkdf2',
          salt: 'test-salt',
          iterations: 100000
        }
      })
    );
    mockConfirmAction.mockResolvedValue(true);
    mockShowSuccess.mockImplementation();
    mockShowError.mockImplementation();
    mockShowInfo.mockImplementation();
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockProcessExit.mockRestore();
  });

  describe('init subcommand', () => {
    test('initializes new keystore with matching passwords', async () => {
      mockPassword.mockResolvedValueOnce('my-password').mockResolvedValueOnce('my-password');

      const cmd = createKeystoreCommand();
      await cmd.parseAsync(['init', '-w', '/test/workspace'], { from: 'user' });

      expect(mockPassword).toHaveBeenCalledTimes(2);
      expect(mockKeystoreCreate).toHaveBeenCalled();
      expect(mockKeystore.initialize).toHaveBeenCalledWith('my-password');
      expect(mockKeystore.save).toHaveBeenCalledWith('my-password');
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('keystore.json'),
        expect.any(String),
        'utf8'
      );
      expect(mockShowSuccess).toHaveBeenCalledWith(expect.stringContaining('initialized successfully'));
    });

    test('exits with error when passwords do not match', async () => {
      mockPassword.mockResolvedValueOnce('password1').mockResolvedValueOnce('password2');

      const cmd = createKeystoreCommand();

      try {
        await cmd.parseAsync(['init', '-w', '/test/workspace'], { from: 'user' });
      } catch {
        // Expected - process.exit throws
      }

      expect(mockKeystore.initialize).not.toHaveBeenCalled();
      expect(mockShowError).toHaveBeenCalledWith(expect.stringContaining('do not match'));
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    test('prompts confirmation when reinitializing existing keystore', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          format: 'keystore-v1',
          algorithm: 'aes-256-gcm',
          encryptedData: 'existing-data',
          keyDerivation: {
            kdf: 'pbkdf2',
            salt: 'old-salt',
            iterations: 100000
          }
        })
      );
      mockConfirmAction.mockResolvedValue(true);
      mockPassword.mockResolvedValueOnce('new-password').mockResolvedValueOnce('new-password');

      const cmd = createKeystoreCommand();
      await cmd.parseAsync(['init', '-w', '/test/workspace'], { from: 'user' });

      expect(mockConfirmAction).toHaveBeenCalledWith(expect.stringContaining('Reinitialize'), false);
      expect(mockKeystore.initialize).toHaveBeenCalledWith('new-password');
      expect(mockShowSuccess).toHaveBeenCalled();
    });

    test('exits when user cancels reinitializing existing keystore', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          format: 'keystore-v1',
          algorithm: 'aes-256-gcm',
          encryptedData: 'existing-data',
          keyDerivation: {
            kdf: 'pbkdf2',
            salt: 'old-salt',
            iterations: 100000
          }
        })
      );
      mockConfirmAction.mockResolvedValue(false);

      const cmd = createKeystoreCommand();

      try {
        await cmd.parseAsync(['init', '-w', '/test/workspace'], { from: 'user' });
      } catch {
        // Expected - process.exit throws
      }

      expect(mockPassword).not.toHaveBeenCalled();
      expect(mockKeystore.initialize).not.toHaveBeenCalled();
      expect(mockShowError).toHaveBeenCalledWith(expect.stringContaining('cancelled'));
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    test('exits with error when keystore creation fails', async () => {
      mockKeystoreCreate.mockReturnValue(fail('Failed to create keystore instance'));

      const cmd = createKeystoreCommand();

      try {
        await cmd.parseAsync(['init', '-w', '/test/workspace'], { from: 'user' });
      } catch {
        // Expected - process.exit throws
      }

      expect(mockShowError).toHaveBeenCalledWith(expect.stringContaining('Failed to create keystore'));
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    test('exits with error when keystore initialization fails', async () => {
      mockKeystore.initialize.mockResolvedValue(fail('Initialization error'));

      const cmd = createKeystoreCommand();

      try {
        await cmd.parseAsync(['init', '-w', '/test/workspace'], { from: 'user' });
      } catch {
        // Expected - process.exit throws
      }

      expect(mockShowError).toHaveBeenCalledWith(expect.stringContaining('Failed to initialize keystore'));
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    test('exits with error when keystore save fails', async () => {
      mockKeystore.save.mockResolvedValue(fail('Save error'));

      const cmd = createKeystoreCommand();

      try {
        await cmd.parseAsync(['init', '-w', '/test/workspace'], { from: 'user' });
      } catch {
        // Expected - process.exit throws
      }

      expect(mockShowError).toHaveBeenCalledWith(expect.stringContaining('Failed to save keystore'));
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });

  describe('status subcommand', () => {
    test('shows "No keystore file found" when file does not exist', async () => {
      mockExistsSync.mockReturnValue(false);

      const cmd = createKeystoreCommand();
      await cmd.parseAsync(['status', '-w', '/test/workspace'], { from: 'user' });

      expect(mockShowInfo).toHaveBeenCalledWith('No keystore file found');
    });

    test('shows status when keystore file is not initialized', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({}));

      const cmd = createKeystoreCommand();
      await cmd.parseAsync(['status', '-w', '/test/workspace'], { from: 'user' });

      expect(mockShowInfo).toHaveBeenCalledWith(expect.stringContaining('not initialized'));
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Use "choco workspace keystore init"')
      );
    });

    test('shows format, algorithm, KDF, and iterations when initialized', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          format: 'keystore-v1',
          algorithm: 'aes-256-gcm',
          encryptedData: 'data',
          keyDerivation: {
            kdf: 'pbkdf2',
            salt: 'salt',
            iterations: 100000
          }
        })
      );

      const cmd = createKeystoreCommand();
      await cmd.parseAsync(['status', '-w', '/test/workspace'], { from: 'user' });

      expect(mockShowInfo).toHaveBeenCalledWith(expect.stringContaining('initialized'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Format: keystore-v1'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Algorithm: aes-256-gcm'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('KDF: pbkdf2'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Iterations: 100000'));
    });

    test('exits with error when keystore file read fails', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation(() => {
        throw new Error('Read error');
      });

      const cmd = createKeystoreCommand();

      try {
        await cmd.parseAsync(['status', '-w', '/test/workspace'], { from: 'user' });
      } catch {
        // Expected - process.exit throws
      }

      expect(mockShowError).toHaveBeenCalledWith(expect.stringContaining('cannot be read'));
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });

  describe('unlock subcommand', () => {
    test('successfully unlocks keystore with correct password', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          format: 'keystore-v1',
          algorithm: 'aes-256-gcm',
          encryptedData: 'data',
          keyDerivation: {
            kdf: 'pbkdf2',
            salt: 'salt',
            iterations: 100000
          }
        })
      );
      mockKeystoreOpen.mockReturnValue(succeed(mockKeystore));
      mockKeystore.unlock.mockResolvedValue(succeed(undefined));
      mockPassword.mockResolvedValue('correct-password');

      const cmd = createKeystoreCommand();
      await cmd.parseAsync(['unlock', '-w', '/test/workspace'], { from: 'user' });

      expect(mockKeystoreOpen).toHaveBeenCalled();
      expect(mockPassword).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('keystore password')
        })
      );
      expect(mockKeystore.unlock).toHaveBeenCalledWith('correct-password');
      expect(mockShowSuccess).toHaveBeenCalledWith(expect.stringContaining('unlocked successfully'));
    });

    test('exits with error when password is wrong', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          format: 'keystore-v1',
          algorithm: 'aes-256-gcm',
          encryptedData: 'data',
          keyDerivation: { kdf: 'pbkdf2', salt: 'salt', iterations: 100000 }
        })
      );
      mockKeystoreOpen.mockReturnValue(succeed(mockKeystore));
      mockKeystore.unlock.mockResolvedValue(fail('Invalid password'));
      mockPassword.mockResolvedValue('wrong-password');

      const cmd = createKeystoreCommand();

      try {
        await cmd.parseAsync(['unlock', '-w', '/test/workspace'], { from: 'user' });
      } catch {
        // Expected - process.exit throws
      }

      expect(mockShowError).toHaveBeenCalledWith(expect.stringContaining('Failed to unlock keystore'));
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    test('exits with error when no keystore file exists', async () => {
      mockExistsSync.mockReturnValue(false);

      const cmd = createKeystoreCommand();

      try {
        await cmd.parseAsync(['unlock', '-w', '/test/workspace'], { from: 'user' });
      } catch {
        // Expected - process.exit throws
      }

      expect(mockShowError).toHaveBeenCalledWith(expect.stringContaining('No keystore file found'));
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    test('exits with error when keystore file read fails', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation(() => {
        throw new Error('Read error');
      });

      const cmd = createKeystoreCommand();

      try {
        await cmd.parseAsync(['unlock', '-w', '/test/workspace'], { from: 'user' });
      } catch {
        // Expected - process.exit throws
      }

      expect(mockShowError).toHaveBeenCalledWith(expect.stringContaining('Failed to read keystore'));
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    test('exits with error when keystore open fails', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          format: 'keystore-v1',
          algorithm: 'aes-256-gcm',
          encryptedData: 'data',
          keyDerivation: { kdf: 'pbkdf2', salt: 'salt', iterations: 100000 }
        })
      );
      mockKeystoreOpen.mockReturnValue(fail('Corrupted keystore'));

      const cmd = createKeystoreCommand();

      try {
        await cmd.parseAsync(['unlock', '-w', '/test/workspace'], { from: 'user' });
      } catch {
        // Expected - process.exit throws
      }

      expect(mockShowError).toHaveBeenCalledWith(expect.stringContaining('Failed to open keystore'));
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });
});
