import { fail, type Result, succeed } from '@fgv/ts-utils';

import {
  createStorageRoutes,
  type IHttpStorageProvider,
  type IHttpStorageProviderFactory,
  type IStorageFileResponse,
  type IStorageSyncResponse,
  type IStorageTreeItem
} from '../../../packlets/storage';

class InMemoryProvider implements IHttpStorageProvider {
  private readonly _files: Map<string, string> = new Map();

  private _basename(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1] ?? '';
  }

  public getItem(path: string): Result<IStorageTreeItem> {
    if (this._files.has(path)) {
      return succeed({ path, name: this._basename(path), type: 'file' as const });
    }
    return fail(`${path}: not found`);
  }

  public getChildren(path: string): Result<ReadonlyArray<IStorageTreeItem>> {
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

  public getFile(path: string): Result<IStorageFileResponse> {
    const contents = this._files.get(path);
    if (contents === undefined) {
      return fail(`${path}: not found`);
    }
    return succeed({ path, contents });
  }

  public saveFile(path: string, contents: string): Result<IStorageFileResponse> {
    this._files.set(path, contents);
    return succeed({ path, contents });
  }

  public createDirectory(path: string): Result<IStorageTreeItem> {
    return succeed({ path, name: this._basename(path), type: 'directory' });
  }

  public async sync(): Promise<Result<IStorageSyncResponse>> {
    return Promise.resolve(succeed({ synced: this._files.size }));
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
});
