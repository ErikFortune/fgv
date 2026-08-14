import { fail, type Result, succeed } from '@fgv/ts-utils';

import {
  createStorageRoutes,
  type IHttpStorageProvider,
  type IHttpStorageProviderFactory,
  type IStorageFileResponse,
  type IStorageSyncResponse,
  type IStorageTreeItem,
  type StorageContentEncoding
} from '../../../packlets/storage';

class InMemoryProvider implements IHttpStorageProvider {
  /** Records the encoding the route passed through, so a test can assert it arrived. */
  public lastEncoding: StorageContentEncoding | undefined;

  private readonly _files: Map<string, string> = new Map();

  private _basename(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1] ?? '';
  }

  public async getItem(path: string): Promise<Result<IStorageTreeItem>> {
    if (this._files.has(path)) {
      return succeed({ path, name: this._basename(path), type: 'file' as const });
    }
    return fail(`${path}: not found`);
  }

  public async getChildren(path: string): Promise<Result<ReadonlyArray<IStorageTreeItem>>> {
    const children: IStorageTreeItem[] = [];
    for (const filePath of this._files.keys()) {
      if (filePath.startsWith(`${path}/`)) {
        const name = filePath.substring(path.length + 1);
        if (!name.includes('/')) {
          children.push({ path: filePath, name, type: 'file' });
        }
      }
    }
    return succeed(children);
  }

  public async getFile(
    path: string,
    encoding?: StorageContentEncoding
  ): Promise<Result<IStorageFileResponse>> {
    this.lastEncoding = encoding;
    const contents = this._files.get(path);
    if (contents === undefined) {
      return fail(`${path}: not found`);
    }
    if (encoding === 'base64') {
      return succeed({ path, contents: Buffer.from(contents, 'utf8').toString('base64'), encoding });
    }
    return succeed({ path, contents });
  }

  public async saveFile(path: string, contents: string): Promise<Result<IStorageFileResponse>> {
    this._files.set(path, contents);
    return succeed({ path, contents });
  }

  public async deleteFile(path: string): Promise<Result<boolean>> {
    if (!this._files.has(path)) {
      return fail(`${path}: not found`);
    }
    this._files.delete(path);
    return succeed(true);
  }

  public async createDirectory(path: string): Promise<Result<IStorageTreeItem>> {
    return succeed({ path, name: this._basename(path), type: 'directory' });
  }

  public async sync(): Promise<Result<IStorageSyncResponse>> {
    return succeed({ synced: this._files.size });
  }
}

class TestProviderFactory implements IHttpStorageProviderFactory {
  private readonly _provider: InMemoryProvider;

  public constructor(provider: InMemoryProvider) {
    this._provider = provider;
  }

  public forNamespace(): Result<IHttpStorageProvider> {
    return succeed(this._provider);
  }
}

describe('createStorageRoutes', () => {
  test('writes then reads a file', async () => {
    const provider = new InMemoryProvider();
    const app = createStorageRoutes({ providers: new TestProviderFactory(provider) });

    const putResponse = await app.request(
      new Request('http://localhost/file', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/data/demo.txt', contents: 'hello' })
      })
    );
    expect(putResponse.status).toBe(200);

    const getResponse = await app.request(new Request('http://localhost/file?path=/data/demo.txt'));
    expect(getResponse.status).toBe(200);
    await expect(getResponse.json()).resolves.toEqual({ path: '/data/demo.txt', contents: 'hello' });
  });

  test('returns 400 for invalid put body', async () => {
    const provider = new InMemoryProvider();
    const app = createStorageRoutes({ providers: new TestProviderFactory(provider) });

    const response = await app.request(
      new Request('http://localhost/file', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: '{ not-json'
      })
    );

    expect(response.status).toBe(400);
    const payload = (await response.json()) as { error?: string };
    expect(payload.error).toContain('invalid JSON body');
  });

  test('returns sync payload from provider', async () => {
    const provider = new InMemoryProvider();
    const app = createStorageRoutes({ providers: new TestProviderFactory(provider) });

    await app.request(
      new Request('http://localhost/file', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/alpha.txt', contents: 'a' })
      })
    );

    const response = await app.request(
      new Request('http://localhost/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ synced: 1 });
  });

  test('deletes a file through DELETE /file', async () => {
    const provider = new InMemoryProvider();
    const app = createStorageRoutes({ providers: new TestProviderFactory(provider) });

    await app.request(
      new Request('http://localhost/file', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/data/remove-me.txt', contents: 'gone soon' })
      })
    );

    const deleteResponse = await app.request(
      new Request('http://localhost/file?path=/data/remove-me.txt', {
        method: 'DELETE'
      })
    );
    expect(deleteResponse.status).toBe(200);
    await expect(deleteResponse.json()).resolves.toEqual({ deleted: true });

    const getResponse = await app.request(new Request('http://localhost/file?path=/data/remove-me.txt'));
    expect(getResponse.status).toBe(404);
  });

  test('passes the encoding query parameter through to the provider', async () => {
    const provider = new InMemoryProvider();
    const app = createStorageRoutes({ providers: new TestProviderFactory(provider) });

    await app.request(
      new Request('http://localhost/file', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/a.txt', contents: 'hello' })
      })
    );

    const plain = await app.request(new Request('http://localhost/file?path=/a.txt'));
    expect(plain.status).toBe(200);
    expect(provider.lastEncoding).toBeUndefined();
    await expect(plain.json()).resolves.toEqual({ path: '/a.txt', contents: 'hello' });

    const encoded = await app.request(new Request('http://localhost/file?path=/a.txt&encoding=base64'));
    expect(encoded.status).toBe(200);
    expect(provider.lastEncoding).toBe('base64');
    await expect(encoded.json()).resolves.toEqual({
      path: '/a.txt',
      contents: Buffer.from('hello', 'utf8').toString('base64'),
      encoding: 'base64'
    });
  });

  test('rejects an unrecognized encoding rather than silently ignoring it', async () => {
    // A typo must not quietly degrade to utf8 — that is how a caller ends up
    // believing it has byte fidelity it never had.
    const provider = new InMemoryProvider();
    const app = createStorageRoutes({ providers: new TestProviderFactory(provider) });

    const response = await app.request(new Request('http://localhost/file?path=/a.txt&encoding=base-64'));
    expect(response.status).toBe(400);
  });
});
