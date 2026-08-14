import fs from 'fs';
import os from 'os';
import path from 'path';

import { FsStorageProvider, FsStorageProviderFactory, sanitizeNamespace } from '../../../packlets/storage';

describe('sanitizeNamespace', () => {
  test('returns default when namespace is empty', () => {
    expect(sanitizeNamespace(undefined).isSuccess()).toBe(true);
    expect(sanitizeNamespace('   ').isSuccess()).toBe(true);
    expect(sanitizeNamespace('   ').orThrow()).toBe('default');
  });

  test('accepts valid namespace values', () => {
    const result = sanitizeNamespace('team.alpha_01-dev');
    expect(result.isSuccess()).toBe(true);
    expect(result.orThrow()).toBe('team.alpha_01-dev');
  });

  test('rejects invalid namespace characters', () => {
    const result = sanitizeNamespace('../escape');
    expect(result.isFailure()).toBe(true);
    expect(result.message).toContain('only [a-zA-Z0-9._-] allowed');
  });
});

describe('FsStorageProvider', () => {
  let rootPath: string;

  beforeEach(() => {
    rootPath = fs.mkdtempSync(path.join(os.tmpdir(), 'ts-http-storage-test-'));
  });

  afterEach(() => {
    fs.rmSync(rootPath, { recursive: true, force: true });
  });

  test('saves and loads files', async () => {
    const provider = new FsStorageProvider(rootPath);

    const saveResult = await provider.saveFile('/data/example.txt', 'hello');
    expect(saveResult.isSuccess()).toBe(true);

    const fileResult = await provider.getFile('/data/example.txt');
    expect(fileResult.isSuccess()).toBe(true);
    expect(fileResult.orThrow()).toEqual({
      path: '/data/example.txt',
      contents: 'hello'
    });
  });

  test('lists children in a directory', async () => {
    const provider = new FsStorageProvider(rootPath);
    await provider.saveFile('/data/one.txt', 'one');
    await provider.saveFile('/data/two.txt', 'two');

    const childrenResult = await provider.getChildren('/data');
    expect(childrenResult.isSuccess()).toBe(true);

    const childNames = childrenResult
      .orThrow()
      .map((child) => child.name)
      .sort();
    expect(childNames).toEqual(['one.txt', 'two.txt']);
  });

  test('normalizes traversal-like request paths under storage root', async () => {
    const provider = new FsStorageProvider(rootPath);

    const result = await provider.getItem('../../etc/passwd');
    expect(result.isFailure()).toBe(true);
    expect(result.message).toContain('ENOENT');
    expect(result.message).toContain(path.join(rootPath, 'etc/passwd'));
  });

  test('deletes an existing file', async () => {
    const provider = new FsStorageProvider(rootPath);
    await provider.saveFile('/data/delete-me.txt', 'temporary');

    const deleteResult = await provider.deleteFile('/data/delete-me.txt');
    expect(deleteResult.isSuccess()).toBe(true);
    expect(deleteResult.orThrow()).toBe(true);

    const readResult = await provider.getFile('/data/delete-me.txt');
    expect(readResult.isFailure()).toBe(true);
  });
});

describe('FsStorageProviderFactory', () => {
  let rootPath: string;

  beforeEach(() => {
    rootPath = fs.mkdtempSync(path.join(os.tmpdir(), 'ts-http-storage-factory-'));
  });

  afterEach(() => {
    fs.rmSync(rootPath, { recursive: true, force: true });
  });

  test('creates namespace-scoped providers', async () => {
    const factory = new FsStorageProviderFactory({ rootPath });

    const providerResult = factory.forNamespace('team-a');
    expect(providerResult.isSuccess()).toBe(true);

    const provider = providerResult.orThrow();
    const saveResult = await provider.saveFile('/notes.txt', 'namespaced');
    expect(saveResult.isSuccess()).toBe(true);

    const expectedPath = path.join(rootPath, 'team-a', 'notes.txt');
    expect(fs.existsSync(expectedPath)).toBe(true);
  });

  test('fails for invalid namespace', () => {
    const factory = new FsStorageProviderFactory({ rootPath });
    const result = factory.forNamespace('bad/name');

    expect(result.isFailure()).toBe(true);
    expect(result.message).toContain('only [a-zA-Z0-9._-] allowed');
  });

  test('rejects namespace that resolves outside root', () => {
    const factory = new FsStorageProviderFactory({ rootPath });
    const result = factory.forNamespace('..');

    expect(result.isFailure()).toBe(true);
    expect(result.message).toContain('outside root');
  });
});

describe('FsStorageProvider content encoding', () => {
  /** Bytes that are not valid UTF-8 — a lone continuation byte and a truncated sequence. */
  const MALFORMED_UTF8: Buffer = Buffer.from([0x41, 0x80, 0xc3, 0x42]);

  let rootPath: string;

  beforeEach(() => {
    rootPath = fs.mkdtempSync(path.join(os.tmpdir(), 'ts-http-storage-encoding-'));
  });

  afterEach(() => {
    fs.rmSync(rootPath, { recursive: true, force: true });
  });

  test('base64 carries bytes the utf8 path destroys', async () => {
    fs.writeFileSync(path.join(rootPath, 'bad.bin'), MALFORMED_UTF8);
    const provider = new FsStorageProvider(rootPath);

    const asBytes = await provider.getFile('/bad.bin', 'base64');
    expect(asBytes.isSuccess()).toBe(true);
    expect(asBytes.orThrow().encoding).toBe('base64');
    expect(Buffer.from(asBytes.orThrow().contents, 'base64')).toEqual(MALFORMED_UTF8);

    // The default path is lossy, and this is the loss: the invalid sequences have
    // become U+FFFD and re-encoding cannot recover them.
    const asText = await provider.getFile('/bad.bin');
    expect(asText.isSuccess()).toBe(true);
    expect(asText.orThrow().encoding).toBeUndefined();
    expect(asText.orThrow().contents).toContain('�');
    expect(Buffer.from(asText.orThrow().contents, 'utf8')).not.toEqual(MALFORMED_UTF8);
  });

  test('reports the encoding it actually produced, so a client can branch on it', async () => {
    fs.writeFileSync(path.join(rootPath, 'a.txt'), 'hello');
    const provider = new FsStorageProvider(rootPath);

    // Absent means utf8, which keeps existing responses byte-identical — and means
    // "asked for base64, got no field" is itself the signal that it wasn't honoured.
    expect((await provider.getFile('/a.txt')).orThrow().encoding).toBeUndefined();
    expect((await provider.getFile('/a.txt', 'utf8')).orThrow().encoding).toBeUndefined();
    expect((await provider.getFile('/a.txt', 'base64')).orThrow().encoding).toBe('base64');
  });

  test('round-trips ordinary text through base64 unchanged', async () => {
    fs.writeFileSync(path.join(rootPath, 'a.txt'), 'héllo — em dash');
    const provider = new FsStorageProvider(rootPath);

    const result = await provider.getFile('/a.txt', 'base64');
    expect(Buffer.from(result.orThrow().contents, 'base64').toString('utf8')).toBe('héllo — em dash');
  });

  test('fails for a missing file regardless of encoding', async () => {
    const provider = new FsStorageProvider(rootPath);
    expect((await provider.getFile('/nope.bin', 'base64')).isFailure()).toBe(true);
  });
});
