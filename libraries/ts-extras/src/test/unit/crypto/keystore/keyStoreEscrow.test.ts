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

import { FileTree } from '@fgv/ts-json-base';
import * as CryptoUtils from '../../../../packlets/crypto-utils';
import { InMemoryPrivateKeyStorage } from './inMemoryPrivateKeyStorage';

const KeyStore = CryptoUtils.KeyStore.KeyStore;
const EncryptedFilePrivateKeyStorage = CryptoUtils.KeyStore.EncryptedFilePrivateKeyStorage;
const provider = CryptoUtils.nodeCryptoProvider;
const subtle = globalThis.crypto.subtle;
const testPassword = 'escrow-master-password-123';

type KeyStoreType = CryptoUtils.KeyStore.KeyStore;
type IKeyStoreFile = CryptoUtils.KeyStore.IKeyStoreFile;
type KeyPairAlgorithm = CryptoUtils.KeyStore.KeyPairAlgorithm;

const allAlgorithms: ReadonlyArray<KeyPairAlgorithm> = [
  'ecdsa-p256',
  'rsa-oaep-2048',
  'ecdh-p256',
  'ed25519',
  'x25519'
];

function makeTree(): FileTree.IFileTreeDirectoryItem {
  return FileTree.inMemory([], { mutable: true })
    .onSuccess((tree) => tree.getDirectory('/'))
    .orThrow();
}

function makeEncFileStorage(): CryptoUtils.KeyStore.EncryptedFilePrivateKeyStorage {
  return EncryptedFilePrivateKeyStorage.create({
    directory: '/keys',
    encryptionKey: provider.generateRandomBytes(32).orThrow(),
    cryptoProvider: provider,
    tree: makeTree()
  }).orThrow();
}

async function newDeviceKeystore(storage: CryptoUtils.KeyStore.IPrivateKeyStorage): Promise<KeyStoreType> {
  const ks = KeyStore.create({ cryptoProvider: provider, privateKeyStorage: storage }).orThrow();
  (await ks.initialize(testPassword)).orThrow();
  return ks;
}

async function openDeviceKeystore(
  file: IKeyStoreFile,
  storage: CryptoUtils.KeyStore.IPrivateKeyStorage,
  password: string = testPassword
): Promise<KeyStoreType> {
  const ks = KeyStore.open({
    cryptoProvider: provider,
    keystoreFile: file,
    privateKeyStorage: storage
  }).orThrow();
  (await ks.unlock(password)).orThrow();
  return ks;
}

// The decrypted vault shape we manipulate for back-compat / negative fixtures.
interface IVaultShape {
  version: string;
  secrets: Record<string, { escrowedPrivateKeyJwk?: JsonWebKey; [key: string]: unknown }>;
}

// Decrypt a saved vault, let the caller mutate it, then re-encrypt with the same
// derived key so the same password still unlocks. Used to synthesize a v1 file
// and to inject crafted escrow material for negative tests (rather than
// corrupting ciphertext, which GCM would reject before the code under test runs).
async function rewriteVault(
  file: IKeyStoreFile,
  password: string,
  mutate: (vault: IVaultShape) => void
): Promise<IKeyStoreFile> {
  const salt = provider.fromBase64(file.keyDerivation.salt).orThrow();
  const key = (await provider.deriveKey(password, salt, file.keyDerivation.iterations)).orThrow();
  const iv = provider.fromBase64(file.iv).orThrow();
  const authTag = provider.fromBase64(file.authTag).orThrow();
  const ciphertext = provider.fromBase64(file.encryptedData).orThrow();
  const json = (await provider.decrypt(ciphertext, key, iv, authTag)).orThrow();
  const vault = JSON.parse(json) as unknown as IVaultShape;
  mutate(vault);
  const encrypted = (await provider.encrypt(JSON.stringify(vault), key)).orThrow();
  return {
    ...file,
    iv: provider.toBase64(encrypted.iv),
    authTag: provider.toBase64(encrypted.authTag),
    encryptedData: provider.toBase64(encrypted.encryptedData)
  };
}

// Proves that `privateKey` is the counterpart of `publicJwk` using the operation
// natural to the algorithm — a same-identity check that works for signing,
// encryption, and key-agreement keys alike.
async function assertSameIdentity(
  algorithm: KeyPairAlgorithm,
  privateKey: CryptoKey,
  publicJwk: JsonWebKey
): Promise<void> {
  const data = new TextEncoder().encode('escrow-recovery-identity-proof');
  if (algorithm === 'ecdsa-p256' || algorithm === 'ed25519') {
    const importAlg =
      algorithm === 'ecdsa-p256' ? { name: 'ECDSA', namedCurve: 'P-256' } : { name: 'Ed25519' };
    const signAlg = algorithm === 'ecdsa-p256' ? { name: 'ECDSA', hash: 'SHA-256' } : { name: 'Ed25519' };
    const publicKey = await subtle.importKey('jwk', publicJwk, importAlg, true, ['verify']);
    const signature = await subtle.sign(signAlg, privateKey, data);
    expect(await subtle.verify(signAlg, publicKey, signature, data)).toBe(true);
    return;
  }
  if (algorithm === 'rsa-oaep-2048') {
    const publicKey = await subtle.importKey('jwk', publicJwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, [
      'encrypt'
    ]);
    const ciphertext = await subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, data);
    const recovered = await subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, ciphertext);
    expect(new Uint8Array(recovered)).toEqual(data);
    return;
  }
  // ecdh-p256 / x25519: ECDH symmetry — deriving with (privateKey, ephemeralPub)
  // must equal deriving with (ephemeralPriv, originalPub) iff privateKey is the
  // counterpart of publicJwk.
  const derive = algorithm === 'ecdh-p256' ? 'ECDH' : 'X25519';
  const genAlg = algorithm === 'ecdh-p256' ? { name: 'ECDH', namedCurve: 'P-256' } : { name: 'X25519' };
  const originalPublic = await subtle.importKey('jwk', publicJwk, genAlg, true, []);
  const ephemeral = (await subtle.generateKey(genAlg, true, ['deriveBits'])) as CryptoKeyPair;
  const derived1 = new Uint8Array(
    await subtle.deriveBits({ name: derive, public: ephemeral.publicKey }, privateKey, 256)
  );
  const derived2 = new Uint8Array(
    await subtle.deriveBits({ name: derive, public: originalPublic }, ephemeral.privateKey, 256)
  );
  expect(derived1).toEqual(derived2);
}

describe('KeyStore private-key escrow', () => {
  describe('end-to-end cross-device recovery (per algorithm)', () => {
    test.each(allAlgorithms)('recovers a %s identity on a fresh device', async (algorithm) => {
      // Device A: create, escrow-enabled keypair, save.
      const deviceA = await newDeviceKeystore(new InMemoryPrivateKeyStorage());
      const added = await deviceA.addKeyPair('identity', { algorithm, escrow: true });
      const publicJwk = added.orThrow().entry.publicKeyJwk;
      expect(added.orThrow().entry.escrowedPrivateKeyJwk).toBeDefined();
      const file = (await deviceA.save(testPassword)).orThrow();
      expect(file.format).toBe('keystore-v3');

      // Device B: fresh empty backend + the recovered vault file.
      const deviceBStorage = new InMemoryPrivateKeyStorage();
      const deviceB = await openDeviceKeystore(file, deviceBStorage);

      const recovered = await deviceB.getKeyPair('identity', { rehydrate: true });
      expect(recovered).toSucceedAndSatisfy(({ privateKey }) => {
        expect(privateKey.type).toBe('private');
      });
      await assertSameIdentity(algorithm, recovered.orThrow().privateKey, publicJwk);

      // Rehydration filled the gap: the blob is now stored and a plain
      // (non-rehydrating) getKeyPair works.
      expect(deviceBStorage.entries.has(added.orThrow().entry.id)).toBe(true);
      expect(await deviceB.getKeyPair('identity')).toSucceed();
    });
  });

  test('getKeyPair without rehydrate fails on a fresh device despite escrow material', async () => {
    const deviceA = await newDeviceKeystore(new InMemoryPrivateKeyStorage());
    (await deviceA.addKeyPair('identity', { algorithm: 'ed25519', escrow: true })).orThrow();
    const file = (await deviceA.save(testPassword)).orThrow();

    const deviceB = await openDeviceKeystore(file, new InMemoryPrivateKeyStorage());
    expect(await deviceB.getKeyPair('identity')).toFailWith(/Failed to load private key/i);
  });

  describe('escrow-window invariant', () => {
    test('the live stored key is non-extractable on a supportsNonExtractable backend', async () => {
      const storage = new InMemoryPrivateKeyStorage();
      const keystore = await newDeviceKeystore(storage);
      (await keystore.addKeyPair('signing', { algorithm: 'ed25519', escrow: true })).orThrow();

      // The transient extractable key never becomes the live copy.
      expect(await keystore.getKeyPair('signing')).toSucceedAndSatisfy(({ privateKey }) => {
        expect(privateKey.extractable).toBe(false);
      });
    });

    test('escrow with extractable:true yields an extractable live key (explicit, legal)', async () => {
      const storage = new InMemoryPrivateKeyStorage();
      const keystore = await newDeviceKeystore(storage);
      const added = await keystore.addKeyPair('signing', {
        algorithm: 'ed25519',
        escrow: true,
        extractable: true
      });
      expect(added.orThrow().entry.escrowedPrivateKeyJwk).toBeDefined();
      expect(await keystore.getKeyPair('signing')).toSucceedAndSatisfy(({ privateKey }) => {
        expect(privateKey.extractable).toBe(true);
      });
    });
  });

  test('tampering with the ciphertext fails unlock (GCM covers the escrow field)', async () => {
    const deviceA = await newDeviceKeystore(new InMemoryPrivateKeyStorage());
    (await deviceA.addKeyPair('identity', { algorithm: 'ecdsa-p256', escrow: true })).orThrow();
    const file = (await deviceA.save(testPassword)).orThrow();

    const rawData = provider.fromBase64(file.encryptedData).orThrow();
    rawData[0] ^= 0xff;
    const tampered: IKeyStoreFile = { ...file, encryptedData: provider.toBase64(rawData) };

    const reopened = KeyStore.open({
      cryptoProvider: provider,
      keystoreFile: tampered,
      privateKeyStorage: new InMemoryPrivateKeyStorage()
    }).orThrow();
    expect(await reopened.unlock(testPassword)).toFailWith(/Incorrect password or corrupted key store/i);
  });

  test('changing the master password re-wraps escrow and still recovers', async () => {
    const newPassword = 'rotated-master-password-456';
    const deviceA = await newDeviceKeystore(new InMemoryPrivateKeyStorage());
    const added = await deviceA.addKeyPair('identity', { algorithm: 'ed25519', escrow: true });
    const publicJwk = added.orThrow().entry.publicKeyJwk;
    (await deviceA.changePassword(testPassword, newPassword)).orThrow();
    const file = (await deviceA.save(newPassword)).orThrow();

    const deviceC = await openDeviceKeystore(file, new InMemoryPrivateKeyStorage(), newPassword);
    const recovered = await deviceC.getKeyPair('identity', { rehydrate: true });
    expect(recovered).toSucceed();
    await assertSameIdentity('ed25519', recovered.orThrow().privateKey, publicJwk);
  });

  describe('keystore-v1 back-compat', () => {
    async function makeV1File(): Promise<IKeyStoreFile> {
      const deviceA = await newDeviceKeystore(new InMemoryPrivateKeyStorage());
      (await deviceA.addKeyPair('identity', { algorithm: 'ed25519' })).orThrow(); // no escrow
      const v2 = (await deviceA.save(testPassword)).orThrow();
      const rewritten = await rewriteVault(v2, testPassword, (vault) => {
        vault.version = 'keystore-v1';
      });
      return { ...rewritten, format: 'keystore-v1' };
    }

    test('opens and unlocks; rehydrate fails cleanly with no escrow material', async () => {
      const v1 = await makeV1File();
      expect(v1.format).toBe('keystore-v1');

      const keystore = await openDeviceKeystore(v1, new InMemoryPrivateKeyStorage());
      expect(await keystore.getKeyPair('identity', { rehydrate: true })).toFailWith(
        /Failed to load private key/i
      );
    });

    test('re-saving a v1 vault silently upgrades the file to keystore-v3', async () => {
      const v1 = await makeV1File();
      const keystore = await openDeviceKeystore(v1, new InMemoryPrivateKeyStorage());
      const resaved = (await keystore.save(testPassword)).orThrow();
      expect(resaved.format).toBe('keystore-v3');
    });

    test('isKeyStoreFile recognizes both v1 and v2 files', async () => {
      const v1 = await makeV1File();
      const deviceA = await newDeviceKeystore(new InMemoryPrivateKeyStorage());
      const v2 = (await deviceA.save(testPassword)).orThrow();
      expect(CryptoUtils.KeyStore.isKeyStoreFile(v1)).toBe(true);
      expect(CryptoUtils.KeyStore.isKeyStoreFile(v2)).toBe(true);
      expect(CryptoUtils.KeyStore.isKeyStoreFile({ format: 'not-a-keystore' })).toBe(false);
    });
  });

  describe('both storage backends', () => {
    test('EncryptedFilePrivateKeyStorage (extractable) escrows and recovers', async () => {
      const deviceA = KeyStore.create({
        cryptoProvider: provider,
        privateKeyStorage: makeEncFileStorage()
      }).orThrow();
      (await deviceA.initialize(testPassword)).orThrow();
      const added = await deviceA.addKeyPair('identity', { algorithm: 'ecdsa-p256', escrow: true });
      const publicJwk = added.orThrow().entry.publicKeyJwk;
      const file = (await deviceA.save(testPassword)).orThrow();

      // Live copy is extractable on this backend (round-trips via JWK).
      expect(await deviceA.getKeyPair('identity')).toSucceedAndSatisfy(({ privateKey }) => {
        expect(privateKey.extractable).toBe(true);
      });

      // Fresh EncryptedFile backend on device B — rehydrate from escrow.
      const deviceB = KeyStore.open({
        cryptoProvider: provider,
        keystoreFile: file,
        privateKeyStorage: makeEncFileStorage()
      }).orThrow();
      (await deviceB.unlock(testPassword)).orThrow();
      const recovered = await deviceB.getKeyPair('identity', { rehydrate: true });
      expect(recovered).toSucceed();
      await assertSameIdentity('ecdsa-p256', recovered.orThrow().privateKey, publicJwk);
    });

    test('supportsNonExtractable backend keeps the live copy non-extractable', async () => {
      const storage = new InMemoryPrivateKeyStorage();
      const keystore = await newDeviceKeystore(storage);
      (await keystore.addKeyPair('identity', { algorithm: 'ecdsa-p256', escrow: true })).orThrow();
      expect(await keystore.getKeyPair('identity')).toSucceedAndSatisfy(({ privateKey }) => {
        expect(privateKey.extractable).toBe(false);
      });
    });
  });

  describe('rehydration edge cases', () => {
    test('does not overwrite an existing storage blob (fill-a-gap only)', async () => {
      const storage = new InMemoryPrivateKeyStorage();
      const keystore = await newDeviceKeystore(storage);
      const added = await keystore.addKeyPair('identity', { algorithm: 'ed25519', escrow: true });
      const id = added.orThrow().entry.id;
      const storedKey = storage.entries.get(id);

      // rehydrate:true with a blob present must load, not re-import.
      const result = await keystore.getKeyPair('identity', { rehydrate: true });
      expect(result).toSucceedAndSatisfy(({ privateKey }) => {
        expect(privateKey).toBe(storedKey);
      });
    });

    test('rehydrate succeeds when the escrowed JWK omits key_ops', async () => {
      const deviceA = await newDeviceKeystore(new InMemoryPrivateKeyStorage());
      const added = await deviceA.addKeyPair('identity', { algorithm: 'ed25519', escrow: true });
      const publicJwk = added.orThrow().entry.publicKeyJwk;
      const file = (await deviceA.save(testPassword)).orThrow();

      const stripped = await rewriteVault(file, testPassword, (vault) => {
        const jwk = vault.secrets.identity.escrowedPrivateKeyJwk;
        if (jwk) {
          delete jwk.key_ops;
        }
      });

      const deviceB = await openDeviceKeystore(stripped, new InMemoryPrivateKeyStorage());
      const recovered = await deviceB.getKeyPair('identity', { rehydrate: true });
      expect(recovered).toSucceed();
      await assertSameIdentity('ed25519', recovered.orThrow().privateKey, publicJwk);
    });

    test('rehydrate fails cleanly when the escrowed JWK is malformed', async () => {
      const deviceA = await newDeviceKeystore(new InMemoryPrivateKeyStorage());
      (await deviceA.addKeyPair('identity', { algorithm: 'ed25519', escrow: true })).orThrow();
      const file = (await deviceA.save(testPassword)).orThrow();

      const corrupted = await rewriteVault(file, testPassword, (vault) => {
        // Valid JWK *shape* (kty present) but invalid key material — passes the
        // converter's shape check, fails at crypto.subtle.importKey.
        vault.secrets.identity.escrowedPrivateKeyJwk = {
          kty: 'OKP',
          crv: 'Ed25519',
          x: 'AAAA'
        };
      });

      const deviceB = await openDeviceKeystore(corrupted, new InMemoryPrivateKeyStorage());
      expect(await deviceB.getKeyPair('identity', { rehydrate: true })).toFailWith(
        /rehydrate private key.*from escrow/i
      );
    });

    test('rehydrate surfaces a storage store() failure', async () => {
      const deviceA = await newDeviceKeystore(new InMemoryPrivateKeyStorage());
      (await deviceA.addKeyPair('identity', { algorithm: 'ed25519', escrow: true })).orThrow();
      const file = (await deviceA.save(testPassword)).orThrow();

      // Empty backend whose store() fails: load misses, import succeeds, persist fails.
      const failingStorage = new InMemoryPrivateKeyStorage({ failOn: { store: 'disk full' } });
      const deviceB = await openDeviceKeystore(file, failingStorage);
      expect(await deviceB.getKeyPair('identity', { rehydrate: true })).toFailWith(
        /persist rehydrated private key.*disk full/i
      );
    });
  });

  describe('escrow x extractable x backend matrix', () => {
    interface IMatrixCase {
      readonly escrow?: boolean;
      readonly extractable?: boolean;
      readonly supportsNonExtractable: boolean;
      readonly expectEscrow: boolean;
      readonly expectLiveExtractable: boolean;
    }

    const cases: ReadonlyArray<IMatrixCase> = [
      // escrow absent → unchanged behavior (no escrow copy; backend-default extractability).
      { supportsNonExtractable: true, expectEscrow: false, expectLiveExtractable: false },
      { supportsNonExtractable: false, expectEscrow: false, expectLiveExtractable: true },
      // escrow, extractable unset → escrow present; live follows backend default.
      { escrow: true, supportsNonExtractable: true, expectEscrow: true, expectLiveExtractable: false },
      { escrow: true, supportsNonExtractable: false, expectEscrow: true, expectLiveExtractable: true },
      // escrow, extractable: true → escrow present; live extractable (explicit).
      {
        escrow: true,
        extractable: true,
        supportsNonExtractable: true,
        expectEscrow: true,
        expectLiveExtractable: true
      },
      // escrow, extractable: false on a capable backend → escrow present; live non-extractable.
      {
        escrow: true,
        extractable: false,
        supportsNonExtractable: true,
        expectEscrow: true,
        expectLiveExtractable: false
      }
    ];

    test.each(cases)(
      'escrow=$escrow extractable=$extractable supportsNonExtractable=$supportsNonExtractable',
      async ({ escrow, extractable, supportsNonExtractable, expectEscrow, expectLiveExtractable }) => {
        const storage = new InMemoryPrivateKeyStorage({ supportsNonExtractable });
        const keystore = await newDeviceKeystore(storage);
        const result = await keystore.addKeyPair('identity', { algorithm: 'ed25519', escrow, extractable });

        expect(result).toSucceedAndSatisfy(({ entry }) => {
          expect(entry.escrowedPrivateKeyJwk !== undefined).toBe(expectEscrow);
          expect(storage.entries.get(entry.id)?.extractable).toBe(expectLiveExtractable);
        });
      }
    );

    test('escrow with extractable:false fails loudly on an incapable backend', async () => {
      const storage = new InMemoryPrivateKeyStorage({ supportsNonExtractable: false });
      const keystore = await newDeviceKeystore(storage);
      const result = await keystore.addKeyPair('identity', {
        algorithm: 'ed25519',
        escrow: true,
        extractable: false
      });
      expect(result).toFailWith(/does not support non-extractable keys/i);
      expect(keystore.hasSecret('identity')).toSucceedWith(false);
      expect(storage.entries.size).toBe(0);
    });
  });
});
