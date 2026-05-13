import { fail, type Result, succeed } from '@fgv/ts-utils';

import {
  HttpStorageService,
  type IHttpStorageProvider,
  type IHttpStorageProviderFactory,
  type IStorageFileResponse,
  type IStorageSyncResponse,
  type IStorageTreeItem
} from '../../../packlets/storage';

class StubProvider implements IHttpStorageProvider {
  public async getItem(path: string): Promise<Result<IStorageTreeItem>> {
    return succeed({ path, name: 'item', type: 'file' });
  }

  public async getChildren(path: string): Promise<Result<ReadonlyArray<IStorageTreeItem>>> {
    return succeed([{ path: `${path}/child.txt`, name: 'child.txt', type: 'file' }]);
  }

  public async getFile(path: string): Promise<Result<IStorageFileResponse>> {
    return succeed({ path, contents: 'contents' });
  }

  public async saveFile(
    path: string,
    contents: string,
    contentType?: string
  ): Promise<Result<IStorageFileResponse>> {
    return succeed({ path, contents, contentType });
  }

  public async deleteFile(__path: string): Promise<Result<boolean>> {
    return succeed(true);
  }

  public async createDirectory(path: string): Promise<Result<IStorageTreeItem>> {
    return succeed({ path, name: 'created', type: 'directory' });
  }

  public async sync(): Promise<Result<IStorageSyncResponse>> {
    return succeed({ synced: 7 });
  }
}

class StubProviderFactory implements IHttpStorageProviderFactory {
  private readonly _provider: IHttpStorageProvider;

  public constructor(provider: IHttpStorageProvider) {
    this._provider = provider;
  }

  public forNamespace(): Result<IHttpStorageProvider> {
    return succeed(this._provider);
  }
}

class FailingProviderFactory implements IHttpStorageProviderFactory {
  public forNamespace(): Result<IHttpStorageProvider> {
    return fail('missing provider');
  }
}

describe('HttpStorageService', () => {
  test('maps getChildren response shape', async () => {
    const service = new HttpStorageService(new StubProviderFactory(new StubProvider()));

    const result = await service.getChildren({ path: '/data', namespace: 'default' });
    expect(result.isSuccess()).toBe(true);
    expect(result.orThrow()).toEqual({
      path: '/data',
      children: [{ path: '/data/child.txt', name: 'child.txt', type: 'file' }]
    });
  });

  test('formats provider lookup failures', async () => {
    const service = new HttpStorageService(new FailingProviderFactory());

    const getResult = await service.getFile({ path: '/missing', namespace: 'default' });
    expect(getResult.isFailure()).toBe(true);
    expect(getResult.message).toBe('provider: missing provider');

    const syncResult = await service.sync({ namespace: 'default' });
    expect(syncResult.isFailure()).toBe(true);
    expect(syncResult.message).toBe('provider: missing provider');
  });

  test('forwards deleteFile to provider', async () => {
    const service = new HttpStorageService(new StubProviderFactory(new StubProvider()));

    const result = await service.deleteFile({ path: '/data/remove.txt', namespace: 'default' });
    expect(result.isSuccess()).toBe(true);
    expect(result.orThrow()).toBe(true);
  });
});
