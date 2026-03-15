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
  public getItem(path: string): Result<IStorageTreeItem> {
    return succeed({ path, name: 'item', type: 'file' });
  }

  public getChildren(path: string): Result<ReadonlyArray<IStorageTreeItem>> {
    return succeed([{ path: `${path}/child.txt`, name: 'child.txt', type: 'file' }]);
  }

  public getFile(path: string): Result<IStorageFileResponse> {
    return succeed({ path, contents: 'contents' });
  }

  public saveFile(path: string, contents: string, contentType?: string): Result<IStorageFileResponse> {
    return succeed({ path, contents, contentType });
  }

  public createDirectory(path: string): Result<IStorageTreeItem> {
    return succeed({ path, name: 'created', type: 'directory' });
  }

  public async sync(): Promise<Result<IStorageSyncResponse>> {
    return Promise.resolve(succeed({ synced: 7 }));
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
  test('maps getChildren response shape', () => {
    const service = new HttpStorageService(new StubProviderFactory(new StubProvider()));

    const result = service.getChildren({ path: '/data', namespace: 'default' });
    expect(result.isSuccess()).toBe(true);
    expect(result.orThrow()).toEqual({
      path: '/data',
      children: [{ path: '/data/child.txt', name: 'child.txt', type: 'file' }]
    });
  });

  test('formats provider lookup failures', async () => {
    const service = new HttpStorageService(new FailingProviderFactory());

    const getResult = service.getFile({ path: '/missing', namespace: 'default' });
    expect(getResult.isFailure()).toBe(true);
    expect(getResult.message).toBe('provider: missing provider');

    const syncResult = await service.sync({ namespace: 'default' });
    expect(syncResult.isFailure()).toBe(true);
    expect(syncResult.message).toBe('provider: missing provider');
  });
});
