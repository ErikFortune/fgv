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

import '@fgv/ts-utils-jest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {
  decodeKey,
  buildEncryptionConfig,
  readSecretsFile,
  buildFileSources,
  loadIngredientsLibrary,
  loadFillingsLibrary,
  loadMoldsLibrary,
  loadTasksLibrary,
  loadProceduresLibrary,
  loadConfectionsLibrary
} from '../../../../commands/shared/dataSourceLoader';
import { IDataSourceOptions } from '../../../../commands/shared/types';

// Path to the published chocolate data (real data, not test fixtures)
const PUBLISHED_DATA_DIR = path.resolve(__dirname, '../../../../../../data/published/chocolate');

// Helper to create a temporary directory with files
function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'choco-test-'));
}

function cleanupTempDir(dirPath: string): void {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

// Valid 32-byte key as base64 (256 bits)
const VALID_KEY_BASE64 = Buffer.from(new Uint8Array(32).fill(0xab)).toString('base64');

describe('dataSourceLoader', () => {
  // ============================================================================
  // decodeKey
  // ============================================================================

  describe('decodeKey', () => {
    test('decodes a valid 32-byte base64 key', () => {
      expect(decodeKey(VALID_KEY_BASE64)).toSucceedAndSatisfy((key) => {
        expect(key).toBeInstanceOf(Uint8Array);
        expect(key.length).toBe(32);
      });
    });

    test('fails when key is not 32 bytes', () => {
      const shortKey = Buffer.from(new Uint8Array(16).fill(0xab)).toString('base64');
      expect(decodeKey(shortKey)).toFailWith(/must be 32 bytes/i);
    });

    test('fails when key is empty', () => {
      expect(decodeKey('')).toFailWith(/must be 32 bytes/i);
    });

    test('fails for invalid base64', () => {
      // Node Buffer.from silently ignores invalid base64 chars, so this
      // typically produces a short buffer rather than a parse error
      const result = decodeKey('not-valid-base64!!!');
      expect(result).toFail();
    });
  });

  // ============================================================================
  // readSecretsFile
  // ============================================================================

  describe('readSecretsFile', () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = createTempDir();
    });

    afterEach(() => {
      cleanupTempDir(tmpDir);
    });

    test('reads a JSON secrets file', () => {
      const secretsPath = path.join(tmpDir, 'secrets.json');
      // eslint-disable-next-line @typescript-eslint/naming-convention
      fs.writeFileSync(secretsPath, JSON.stringify({ 'my-secret': VALID_KEY_BASE64 }));

      expect(readSecretsFile(secretsPath)).toSucceedAndSatisfy((secrets) => {
        expect(secrets['my-secret']).toBe(VALID_KEY_BASE64);
      });
    });

    test('reads a YAML secrets file', () => {
      const secretsPath = path.join(tmpDir, 'secrets.yaml');
      fs.writeFileSync(secretsPath, `my-secret: ${VALID_KEY_BASE64}\n`);

      expect(readSecretsFile(secretsPath)).toSucceedAndSatisfy((secrets) => {
        expect(secrets['my-secret']).toBe(VALID_KEY_BASE64);
      });
    });

    test('reads a .yml secrets file', () => {
      const secretsPath = path.join(tmpDir, 'secrets.yml');
      fs.writeFileSync(secretsPath, `my-secret: ${VALID_KEY_BASE64}\n`);

      expect(readSecretsFile(secretsPath)).toSucceedAndSatisfy((secrets) => {
        expect(secrets['my-secret']).toBe(VALID_KEY_BASE64);
      });
    });

    test('fails for non-existent file', () => {
      expect(readSecretsFile(path.join(tmpDir, 'missing.json'))).toFailWith(/failed to read secrets file/i);
    });

    test('fails for malformed JSON', () => {
      const secretsPath = path.join(tmpDir, 'bad.json');
      fs.writeFileSync(secretsPath, '{invalid json}');

      expect(readSecretsFile(secretsPath)).toFailWith(/failed to read secrets file/i);
    });
  });

  // ============================================================================
  // buildEncryptionConfig
  // ============================================================================

  describe('buildEncryptionConfig', () => {
    test('returns config with no keys when no options provided', () => {
      const options: IDataSourceOptions = {};
      expect(buildEncryptionConfig(options)).toSucceedAndSatisfy((config) => {
        expect(config.secrets).toBeUndefined();
        expect(config.onMissingKey).toBe('skip');
        expect(config.onDecryptionError).toBe('warn');
      });
    });

    test('includes secrets from secrets file', () => {
      const options: IDataSourceOptions = {};
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const secrets = { 'test-secret': VALID_KEY_BASE64 };

      expect(buildEncryptionConfig(options, secrets)).toSucceedAndSatisfy((config) => {
        expect(config.secrets).toHaveLength(1);
        expect(config.secrets![0].name).toBe('test-secret');
      });
    });

    test('includes multiple secrets from secrets file', () => {
      const options: IDataSourceOptions = {};
      const key2 = Buffer.from(new Uint8Array(32).fill(0xcd)).toString('base64');
      const secrets = { secret1: VALID_KEY_BASE64, secret2: key2 };

      expect(buildEncryptionConfig(options, secrets)).toSucceedAndSatisfy((config) => {
        expect(config.secrets).toHaveLength(2);
      });
    });

    test('includes single key from options', () => {
      const options: IDataSourceOptions = { key: VALID_KEY_BASE64 };

      expect(buildEncryptionConfig(options)).toSucceedAndSatisfy((config) => {
        expect(config.secrets).toHaveLength(1);
        expect(config.secrets![0].name).toBe('default');
      });
    });

    test('uses custom secret name for single key', () => {
      const options: IDataSourceOptions = { key: VALID_KEY_BASE64, secretName: 'my-key' };

      expect(buildEncryptionConfig(options)).toSucceedAndSatisfy((config) => {
        expect(config.secrets).toHaveLength(1);
        expect(config.secrets![0].name).toBe('my-key');
      });
    });

    test('does not duplicate single key if already in secrets file', () => {
      const options: IDataSourceOptions = { key: VALID_KEY_BASE64, secretName: 'existing' };
      const secrets = { existing: VALID_KEY_BASE64 };

      expect(buildEncryptionConfig(options, secrets)).toSucceedAndSatisfy((config) => {
        expect(config.secrets).toHaveLength(1);
      });
    });

    test('adds single key alongside secrets file entries', () => {
      const options: IDataSourceOptions = { key: VALID_KEY_BASE64 };
      const key2 = Buffer.from(new Uint8Array(32).fill(0xcd)).toString('base64');
      const secrets = { other: key2 };

      expect(buildEncryptionConfig(options, secrets)).toSucceedAndSatisfy((config) => {
        expect(config.secrets).toHaveLength(2);
      });
    });

    test('fails when secrets file contains invalid key', () => {
      const options: IDataSourceOptions = {};
      const shortKey = Buffer.from(new Uint8Array(16)).toString('base64');
      const secrets = { bad: shortKey };

      expect(buildEncryptionConfig(options, secrets)).toFailWith(/secret "bad"/i);
    });

    test('fails when single key is invalid', () => {
      const shortKey = Buffer.from(new Uint8Array(16)).toString('base64');
      const options: IDataSourceOptions = { key: shortKey };

      expect(buildEncryptionConfig(options)).toFailWith(/must be 32 bytes/i);
    });
  });

  // ============================================================================
  // buildFileSources
  // ============================================================================

  describe('buildFileSources', () => {
    test('returns empty array for empty paths', () => {
      expect(buildFileSources([])).toSucceedAndSatisfy((sources) => {
        expect(sources).toHaveLength(0);
      });
    });

    test('builds file source from valid directory', () => {
      const ingredientsDir = path.join(PUBLISHED_DATA_DIR, 'ingredients');
      // Only run if published data exists
      if (!fs.existsSync(ingredientsDir)) {
        return;
      }

      expect(buildFileSources([ingredientsDir])).toSucceedAndSatisfy((sources) => {
        expect(sources).toHaveLength(1);
        expect(sources[0].mutable).toBe(false);
      });
    });

    test('fails for non-existent path', () => {
      expect(buildFileSources(['/nonexistent/path'])).toFailWith(/does not exist/i);
    });

    test('fails when path is a file, not a directory', () => {
      const tmpDir = createTempDir();
      try {
        const filePath = path.join(tmpDir, 'file.txt');
        fs.writeFileSync(filePath, 'content');

        expect(buildFileSources([filePath])).toFailWith(/not a directory/i);
      } finally {
        cleanupTempDir(tmpDir);
      }
    });
  });

  // ============================================================================
  // Library Loaders (integration tests using published data)
  // ============================================================================

  describe('library loaders', () => {
    // Skip if published data not available
    const hasPublishedData = fs.existsSync(PUBLISHED_DATA_DIR);

    (hasPublishedData ? describe : describe.skip)('with published data', () => {
      const baseOptions: IDataSourceOptions = {
        library: [path.join(PUBLISHED_DATA_DIR, 'ingredients')],
        noBuiltin: true
      };

      test('loadIngredientsLibrary succeeds with published data', async () => {
        const result = await loadIngredientsLibrary(baseOptions);
        expect(result).toSucceed();
      });

      test('loadFillingsLibrary succeeds with published data', async () => {
        const options: IDataSourceOptions = {
          library: [path.join(PUBLISHED_DATA_DIR, 'fillings')],
          noBuiltin: true
        };
        const result = await loadFillingsLibrary(options);
        expect(result).toSucceed();
      });

      test('loadMoldsLibrary succeeds with published data', async () => {
        const options: IDataSourceOptions = {
          library: [path.join(PUBLISHED_DATA_DIR, 'molds')],
          noBuiltin: true
        };
        const result = await loadMoldsLibrary(options);
        expect(result).toSucceed();
      });

      test('loadTasksLibrary succeeds with published data', async () => {
        const options: IDataSourceOptions = {
          library: [path.join(PUBLISHED_DATA_DIR, 'tasks')],
          noBuiltin: true
        };
        const result = await loadTasksLibrary(options);
        expect(result).toSucceed();
      });

      test('loadProceduresLibrary succeeds with published data', async () => {
        const options: IDataSourceOptions = {
          library: [path.join(PUBLISHED_DATA_DIR, 'procedures')],
          noBuiltin: true
        };
        const result = await loadProceduresLibrary(options);
        expect(result).toSucceed();
      });

      test('loadConfectionsLibrary succeeds with published data', async () => {
        const options: IDataSourceOptions = {
          library: [path.join(PUBLISHED_DATA_DIR, 'confections')],
          noBuiltin: true
        };
        const result = await loadConfectionsLibrary(options);
        expect(result).toSucceed();
      });
    });

    test('loadIngredientsLibrary succeeds with builtin data only', async () => {
      const result = await loadIngredientsLibrary({});
      expect(result).toSucceed();
    });

    test('loadIngredientsLibrary fails with invalid library path', async () => {
      const result = await loadIngredientsLibrary({ library: ['/nonexistent'] });
      expect(result).toFailWith(/does not exist/i);
    });
  });
});
