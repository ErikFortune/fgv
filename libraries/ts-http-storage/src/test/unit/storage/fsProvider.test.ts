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

  test('saves and loads files', () => {
    const provider = new FsStorageProvider(rootPath);

    const saveResult = provider.saveFile('/data/example.txt', 'hello');
    expect(saveResult.isSuccess()).toBe(true);

    const fileResult = provider.getFile('/data/example.txt');
    expect(fileResult.isSuccess()).toBe(true);
    expect(fileResult.orThrow()).toEqual({
      path: '/data/example.txt',
      contents: 'hello'
    });
  });

  test('lists children in a directory', () => {
    const provider = new FsStorageProvider(rootPath);
    provider.saveFile('/data/one.txt', 'one');
    provider.saveFile('/data/two.txt', 'two');

    const childrenResult = provider.getChildren('/data');
    expect(childrenResult.isSuccess()).toBe(true);

    const childNames = childrenResult
      .orThrow()
      .map((child) => child.name)
      .sort();
    expect(childNames).toEqual(['one.txt', 'two.txt']);
  });

  test('normalizes traversal-like request paths under storage root', () => {
    const provider = new FsStorageProvider(rootPath);

    const result = provider.getItem('../../etc/passwd');
    expect(result.isFailure()).toBe(true);
    expect(result.message).toContain('ENOENT');
    expect(result.message).toContain(path.join(rootPath, 'etc/passwd'));
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

  test('creates namespace-scoped providers', () => {
    const factory = new FsStorageProviderFactory({ rootPath });

    const providerResult = factory.forNamespace('team-a');
    expect(providerResult.isSuccess()).toBe(true);

    const provider = providerResult.orThrow();
    const saveResult = provider.saveFile('/notes.txt', 'namespaced');
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
