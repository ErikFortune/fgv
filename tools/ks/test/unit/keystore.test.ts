jest.mock('../../src/io', () => ({
  defaultKeystorePath: jest.fn(() => '/home/test/.fgv-ks'),
  readTextFile: jest.fn(),
  writeTextFile: jest.fn(),
  resolvePath: jest.fn((p: string) => p)
}));

jest.mock('@fgv/ts-extras', () => ({
  CryptoUtils: {
    nodeCryptoProvider: {},
    KeyStore: {
      KeyStore: {
        create: jest.fn(),
        open: jest.fn()
      },
      Converters: {
        keystoreFile: {
          convert: jest.fn()
        }
      }
    }
  }
}));

import '@fgv/ts-utils-jest';

import fs from 'fs';
import { fail, succeed } from '@fgv/ts-utils';
import { CryptoUtils } from '@fgv/ts-extras';

import { readTextFile, writeTextFile } from '../../src/io';
import {
  resolveKeystorePath,
  loadKeystoreFile,
  saveKeystoreFile,
  openKeystore,
  createKeystore,
  changeKeystorePassword,
  storeSecret,
  readSecret,
  listSecrets,
  removeSecret
} from '../../src/keystore';

const mockExistsSync = jest.spyOn(fs, 'existsSync');
const mockReadTextFile = readTextFile as unknown as jest.Mock;
const mockWriteTextFile = writeTextFile as unknown as jest.Mock;
const mockKeystoreFileConvert = CryptoUtils.KeyStore.Converters.keystoreFile.convert as unknown as jest.Mock;
const mockKeystoreCreate = CryptoUtils.KeyStore.KeyStore.create as unknown as jest.Mock;
const mockKeystoreOpen = CryptoUtils.KeyStore.KeyStore.open as unknown as jest.Mock;

const testKeystoreFile = { format: 'keystore-v1' } as unknown as CryptoUtils.KeyStore.IKeyStoreFile;

const mockKeystore = {
  unlock: jest.fn(),
  initialize: jest.fn(),
  save: jest.fn(),
  changePassword: jest.fn(),
  importApiKey: jest.fn(),
  getApiKey: jest.fn(),
  listSecrets: jest.fn(),
  removeSecret: jest.fn()
} as unknown as CryptoUtils.KeyStore.KeyStore;

function setupSuccessfulOpen(): void {
  mockReadTextFile.mockReturnValue(succeed('{"format":"keystore-v1"}'));
  mockKeystoreFileConvert.mockReturnValue(succeed(testKeystoreFile));
  mockKeystoreOpen.mockReturnValue(succeed(mockKeystore));
  (mockKeystore.unlock as jest.Mock).mockResolvedValue(succeed(mockKeystore));
}

describe('keystore module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resolveKeystorePath', () => {
    test('returns the resolved form of a supplied path', () => {
      expect(resolveKeystorePath('/custom/path')).toBe('/custom/path');
    });

    test('falls back to the default path when no path is supplied', () => {
      expect(resolveKeystorePath()).toBe('/home/test/.fgv-ks');
    });
  });

  describe('loadKeystoreFile', () => {
    test('reads, parses, and validates the keystore file', async () => {
      mockReadTextFile.mockReturnValue(succeed('{"format":"keystore-v1"}'));
      mockKeystoreFileConvert.mockReturnValue(succeed(testKeystoreFile));

      const result = await loadKeystoreFile('/test/keystore');
      expect(result).toSucceedWith(testKeystoreFile);
    });

    test('fails when readTextFile fails', async () => {
      mockReadTextFile.mockReturnValue(fail('File not found'));

      const result = await loadKeystoreFile('/test/keystore');
      expect(result).toFailWith(/file not found/i);
    });

    test('fails when the file contains invalid JSON', async () => {
      mockReadTextFile.mockReturnValue(succeed('not-valid-json'));

      const result = await loadKeystoreFile('/test/keystore');
      expect(result).toFailWith(/invalid keystore file/i);
    });

    test('fails when the converter rejects the file format', async () => {
      mockReadTextFile.mockReturnValue(succeed('{}'));
      mockKeystoreFileConvert.mockReturnValue(fail('Unrecognized format'));

      const result = await loadKeystoreFile('/test/keystore');
      expect(result).toFailWith(/invalid keystore file/i);
    });
  });

  describe('saveKeystoreFile', () => {
    test('serializes and writes the keystore file', async () => {
      mockWriteTextFile.mockReturnValue(succeed('/test/keystore'));

      const result = await saveKeystoreFile('/test/keystore', testKeystoreFile);
      expect(result).toSucceedWith('/test/keystore');
      expect(mockWriteTextFile).toHaveBeenCalledWith(
        '/test/keystore',
        expect.stringContaining('keystore-v1')
      );
    });

    test('fails when writeTextFile fails', async () => {
      mockWriteTextFile.mockReturnValue(fail('Permission denied'));

      const result = await saveKeystoreFile('/test/keystore', testKeystoreFile);
      expect(result).toFailWith(/permission denied/i);
    });
  });

  describe('openKeystore', () => {
    test('loads, opens, and unlocks the keystore', async () => {
      setupSuccessfulOpen();

      const result = await openKeystore('/test/keystore', 'password');
      expect(result).toSucceedAndSatisfy((opened) => {
        expect(opened.path).toBe('/test/keystore');
        expect(opened.keystore).toBe(mockKeystore);
      });
    });

    test('fails when loading the file fails', async () => {
      mockReadTextFile.mockReturnValue(fail('Not found'));

      const result = await openKeystore('/test/keystore', 'password');
      expect(result).toFailWith(/not found/i);
    });

    test('fails when KeyStore.open fails', async () => {
      mockReadTextFile.mockReturnValue(succeed('{}'));
      mockKeystoreFileConvert.mockReturnValue(succeed(testKeystoreFile));
      mockKeystoreOpen.mockReturnValue(fail('Invalid keystore format'));

      const result = await openKeystore('/test/keystore', 'password');
      expect(result).toFailWith(/invalid keystore format/i);
    });

    test('fails when unlock fails', async () => {
      mockReadTextFile.mockReturnValue(succeed('{}'));
      mockKeystoreFileConvert.mockReturnValue(succeed(testKeystoreFile));
      mockKeystoreOpen.mockReturnValue(succeed(mockKeystore));
      (mockKeystore.unlock as jest.Mock).mockResolvedValue(fail('Wrong password'));

      const result = await openKeystore('/test/keystore', 'password');
      expect(result).toFailWith(/wrong password/i);
    });
  });

  describe('createKeystore', () => {
    test('creates, initializes, saves, and persists a new keystore', async () => {
      mockExistsSync.mockReturnValue(false);
      mockKeystoreCreate.mockReturnValue(succeed(mockKeystore));
      (mockKeystore.initialize as jest.Mock).mockResolvedValue(succeed(mockKeystore));
      (mockKeystore.save as jest.Mock).mockResolvedValue(succeed(testKeystoreFile));
      mockWriteTextFile.mockReturnValue(succeed('/home/test/.fgv-ks'));

      const result = await createKeystore(undefined, 'password');
      expect(result).toSucceedAndSatisfy((opened) => {
        expect(opened.keystore).toBe(mockKeystore);
      });
    });

    test('fails when a readable keystore file already exists at the path', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadTextFile.mockReturnValue(succeed('{"format":"keystore-v1"}'));

      const result = await createKeystore('/test/keystore', 'password');
      expect(result).toFailWith(/keystore already exists/i);
    });

    test('fails when the file exists but cannot be read', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadTextFile.mockReturnValue(fail('Permission denied'));

      const result = await createKeystore('/test/keystore', 'password');
      expect(result).toFailWith(/exists but cannot be read/i);
    });

    test('fails when KeyStore.create fails', async () => {
      mockExistsSync.mockReturnValue(false);
      mockKeystoreCreate.mockReturnValue(fail('Crypto unavailable'));

      const result = await createKeystore('/test/keystore', 'password');
      expect(result).toFailWith(/failed to create keystore/i);
    });

    test('fails when initialization fails', async () => {
      mockExistsSync.mockReturnValue(false);
      mockKeystoreCreate.mockReturnValue(succeed(mockKeystore));
      (mockKeystore.initialize as jest.Mock).mockResolvedValue(fail('Init error'));

      const result = await createKeystore('/test/keystore', 'password');
      expect(result).toFailWith(/failed to initialize keystore/i);
    });

    test('fails when save fails', async () => {
      mockExistsSync.mockReturnValue(false);
      mockKeystoreCreate.mockReturnValue(succeed(mockKeystore));
      (mockKeystore.initialize as jest.Mock).mockResolvedValue(succeed(mockKeystore));
      (mockKeystore.save as jest.Mock).mockResolvedValue(fail('Save error'));

      const result = await createKeystore('/test/keystore', 'password');
      expect(result).toFailWith(/failed to save keystore/i);
    });

    test('fails when writing the keystore file fails', async () => {
      mockExistsSync.mockReturnValue(false);
      mockKeystoreCreate.mockReturnValue(succeed(mockKeystore));
      (mockKeystore.initialize as jest.Mock).mockResolvedValue(succeed(mockKeystore));
      (mockKeystore.save as jest.Mock).mockResolvedValue(succeed(testKeystoreFile));
      mockWriteTextFile.mockReturnValue(fail('Disk full'));

      const result = await createKeystore('/test/keystore', 'password');
      expect(result).toFailWith(/failed to write keystore file/i);
    });
  });

  describe('changeKeystorePassword', () => {
    beforeEach(() => {
      setupSuccessfulOpen();
    });

    test('opens, changes the password, saves, and persists', async () => {
      (mockKeystore.changePassword as jest.Mock).mockResolvedValue(succeed(mockKeystore));
      (mockKeystore.save as jest.Mock).mockResolvedValue(succeed(testKeystoreFile));
      mockWriteTextFile.mockReturnValue(succeed('/test/keystore'));

      const result = await changeKeystorePassword('/test/keystore', 'old-pw', 'new-pw');
      expect(result).toSucceedAndSatisfy((opened) => {
        expect(opened.keystore).toBe(mockKeystore);
      });
    });

    test('fails when openKeystore fails', async () => {
      mockReadTextFile.mockReturnValue(fail('Not found'));

      const result = await changeKeystorePassword('/test/keystore', 'old-pw', 'new-pw');
      expect(result).toFailWith(/not found/i);
    });

    test('fails when changePassword fails', async () => {
      (mockKeystore.changePassword as jest.Mock).mockResolvedValue(fail('Wrong password'));

      const result = await changeKeystorePassword('/test/keystore', 'old-pw', 'new-pw');
      expect(result).toFailWith(/failed to change password/i);
    });

    test('fails when save fails', async () => {
      (mockKeystore.changePassword as jest.Mock).mockResolvedValue(succeed(mockKeystore));
      (mockKeystore.save as jest.Mock).mockResolvedValue(fail('Save error'));

      const result = await changeKeystorePassword('/test/keystore', 'old-pw', 'new-pw');
      expect(result).toFailWith(/failed to save keystore/i);
    });

    test('fails when writing the file fails', async () => {
      (mockKeystore.changePassword as jest.Mock).mockResolvedValue(succeed(mockKeystore));
      (mockKeystore.save as jest.Mock).mockResolvedValue(succeed(testKeystoreFile));
      mockWriteTextFile.mockReturnValue(fail('Write failed'));

      const result = await changeKeystorePassword('/test/keystore', 'old-pw', 'new-pw');
      expect(result).toFailWith(/failed to write keystore file/i);
    });
  });

  describe('storeSecret', () => {
    beforeEach(() => {
      setupSuccessfulOpen();
    });

    test('opens, stores, saves, and persists a secret', async () => {
      (mockKeystore.importApiKey as jest.Mock).mockResolvedValue(succeed({ entry: {}, replaced: false }));
      (mockKeystore.save as jest.Mock).mockResolvedValue(succeed(testKeystoreFile));
      mockWriteTextFile.mockReturnValue(succeed('/test/keystore'));

      const result = await storeSecret('/test/keystore', 'password', 'my-key', 'secret-value');
      expect(result).toSucceed();
    });

    test('passes options through to importApiKey', async () => {
      (mockKeystore.importApiKey as jest.Mock).mockResolvedValue(succeed({ entry: {}, replaced: true }));
      (mockKeystore.save as jest.Mock).mockResolvedValue(succeed(testKeystoreFile));
      mockWriteTextFile.mockReturnValue(succeed('/test/keystore'));

      await storeSecret('/test/keystore', 'password', 'my-key', 'secret-value', {
        description: 'A test key',
        replace: true
      });

      expect(mockKeystore.importApiKey).toHaveBeenCalledWith('my-key', 'secret-value', {
        description: 'A test key',
        replace: true
      });
    });

    test('fails when openKeystore fails', async () => {
      mockReadTextFile.mockReturnValue(fail('Not found'));

      const result = await storeSecret('/test/keystore', 'password', 'my-key', 'secret-value');
      expect(result).toFailWith(/not found/i);
    });

    test('fails when importApiKey fails', async () => {
      (mockKeystore.importApiKey as jest.Mock).mockResolvedValue(fail('Key already exists'));

      const result = await storeSecret('/test/keystore', 'password', 'my-key', 'secret-value');
      expect(result).toFailWith(/failed to store secret/i);
    });

    test('fails when save fails', async () => {
      (mockKeystore.importApiKey as jest.Mock).mockResolvedValue(succeed({ entry: {}, replaced: false }));
      (mockKeystore.save as jest.Mock).mockResolvedValue(fail('Save error'));

      const result = await storeSecret('/test/keystore', 'password', 'my-key', 'secret-value');
      expect(result).toFailWith(/failed to save keystore/i);
    });

    test('fails when writing the file fails', async () => {
      (mockKeystore.importApiKey as jest.Mock).mockResolvedValue(succeed({ entry: {}, replaced: false }));
      (mockKeystore.save as jest.Mock).mockResolvedValue(succeed(testKeystoreFile));
      mockWriteTextFile.mockReturnValue(fail('Disk full'));

      const result = await storeSecret('/test/keystore', 'password', 'my-key', 'secret-value');
      expect(result).toFailWith(/failed to write keystore file/i);
    });
  });

  describe('readSecret', () => {
    beforeEach(() => {
      setupSuccessfulOpen();
    });

    test('opens and returns the secret value', async () => {
      (mockKeystore.getApiKey as jest.Mock).mockReturnValue(succeed('secret-value'));

      const result = await readSecret('/test/keystore', 'password', 'my-key');
      expect(result).toSucceedWith('secret-value');
    });

    test('fails when openKeystore fails', async () => {
      mockReadTextFile.mockReturnValue(fail('Not found'));

      const result = await readSecret('/test/keystore', 'password', 'my-key');
      expect(result).toFailWith(/not found/i);
    });

    test('fails when getApiKey fails', async () => {
      (mockKeystore.getApiKey as jest.Mock).mockReturnValue(fail('Key not found'));

      const result = await readSecret('/test/keystore', 'password', 'my-key');
      expect(result).toFailWith(/key not found/i);
    });
  });

  describe('listSecrets', () => {
    beforeEach(() => {
      setupSuccessfulOpen();
    });

    test('opens and returns the list of secret names', async () => {
      (mockKeystore.listSecrets as jest.Mock).mockReturnValue(succeed(['key1', 'key2']));

      const result = await listSecrets('/test/keystore', 'password');
      expect(result).toSucceedWith(['key1', 'key2']);
    });

    test('fails when openKeystore fails', async () => {
      mockReadTextFile.mockReturnValue(fail('Not found'));

      const result = await listSecrets('/test/keystore', 'password');
      expect(result).toFailWith(/not found/i);
    });
  });

  describe('removeSecret', () => {
    beforeEach(() => {
      setupSuccessfulOpen();
    });

    test('opens, removes, saves, and persists', async () => {
      (mockKeystore.removeSecret as jest.Mock).mockResolvedValue(succeed({ entry: {} }));
      (mockKeystore.save as jest.Mock).mockResolvedValue(succeed(testKeystoreFile));
      mockWriteTextFile.mockReturnValue(succeed('/test/keystore'));

      const result = await removeSecret('/test/keystore', 'password', 'my-key');
      expect(result).toSucceed();
    });

    test('fails when openKeystore fails', async () => {
      mockReadTextFile.mockReturnValue(fail('Not found'));

      const result = await removeSecret('/test/keystore', 'password', 'my-key');
      expect(result).toFailWith(/not found/i);
    });

    test('fails when removeSecret fails', async () => {
      (mockKeystore.removeSecret as jest.Mock).mockResolvedValue(fail('Key not found'));

      const result = await removeSecret('/test/keystore', 'password', 'my-key');
      expect(result).toFailWith(/failed to remove secret/i);
    });

    test('fails when save fails', async () => {
      (mockKeystore.removeSecret as jest.Mock).mockResolvedValue(succeed({ entry: {} }));
      (mockKeystore.save as jest.Mock).mockResolvedValue(fail('Save error'));

      const result = await removeSecret('/test/keystore', 'password', 'my-key');
      expect(result).toFailWith(/failed to save keystore/i);
    });

    test('fails when writing the file fails', async () => {
      (mockKeystore.removeSecret as jest.Mock).mockResolvedValue(succeed({ entry: {} }));
      (mockKeystore.save as jest.Mock).mockResolvedValue(succeed(testKeystoreFile));
      mockWriteTextFile.mockReturnValue(fail('Write failed'));

      const result = await removeSecret('/test/keystore', 'password', 'my-key');
      expect(result).toFailWith(/failed to write keystore file/i);
    });
  });
});
