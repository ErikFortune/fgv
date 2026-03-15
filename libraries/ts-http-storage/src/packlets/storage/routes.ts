/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Hono } from 'hono';

import type { Logging } from '@fgv/ts-utils';

import {
  storagePathRequest,
  storageSyncRequest,
  storageWriteFileRequest,
  storageTreeChildrenResponse,
  storageTreeItem,
  storageFileResponse
} from './converters';
import { HttpStorageService } from './service';
import type { IStoragePathRequest, IStorageSyncRequest } from './model';
import type { IHttpStorageProviderFactory } from './provider';

/**
 * Options for creating storage routes.
 * @public
 */
export interface ICreateStorageRoutesOptions {
  readonly providers: IHttpStorageProviderFactory;
  readonly logger?: Logging.ILogger;
}

function parsePathQuery(path: string | undefined, namespace: string | undefined): IStoragePathRequest {
  return {
    path: path ?? '/',
    namespace
  };
}

function parseSyncRequest(namespace: string | undefined): IStorageSyncRequest {
  return { namespace };
}

/**
 * Builds storage routes for a Hono app.
 * @public
 */
export function createStorageRoutes(options: ICreateStorageRoutesOptions): Hono {
  const routes = new Hono();
  const service = new HttpStorageService(options.providers);

  routes.get('/health', async (c) => {
    const namespace = c.req.query('namespace');
    const syncResult = await service.sync(parseSyncRequest(namespace));
    if (syncResult.isFailure()) {
      return c.json({ error: syncResult.message }, 500);
    }
    return c.json({ status: 'ok', namespace: namespace ?? 'default' });
  });

  routes.get('/tree/item', (c) => {
    const parsed = storagePathRequest.convert(parsePathQuery(c.req.query('path'), c.req.query('namespace')));
    if (parsed.isFailure()) {
      return c.json({ error: `invalid request: ${parsed.message}` }, 400);
    }

    const result = service.getItem(parsed.value);
    if (result.isFailure()) {
      return c.json({ error: result.message }, 404);
    }

    const converted = storageTreeItem.convert(result.value);
    if (converted.isFailure()) {
      return c.json({ error: `invalid response: ${converted.message}` }, 500);
    }
    return c.json(converted.value);
  });

  routes.get('/tree/children', (c) => {
    const parsed = storagePathRequest.convert(parsePathQuery(c.req.query('path'), c.req.query('namespace')));
    if (parsed.isFailure()) {
      return c.json({ error: `invalid request: ${parsed.message}` }, 400);
    }

    const result = service.getChildren(parsed.value);
    if (result.isFailure()) {
      return c.json({ error: result.message }, 404);
    }

    const converted = storageTreeChildrenResponse.convert(result.value);
    if (converted.isFailure()) {
      return c.json({ error: `invalid response: ${converted.message}` }, 500);
    }
    return c.json(converted.value);
  });

  routes.get('/file', (c) => {
    const parsed = storagePathRequest.convert(parsePathQuery(c.req.query('path'), c.req.query('namespace')));
    if (parsed.isFailure()) {
      return c.json({ error: `invalid request: ${parsed.message}` }, 400);
    }

    const result = service.getFile(parsed.value);
    if (result.isFailure()) {
      return c.json({ error: result.message }, 404);
    }

    const converted = storageFileResponse.convert(result.value);
    if (converted.isFailure()) {
      return c.json({ error: `invalid response: ${converted.message}` }, 500);
    }
    return c.json(converted.value);
  });

  routes.put('/file', async (c) => {
    const raw = await c.req.json().catch(() => undefined);
    if (raw === undefined) {
      return c.json({ error: 'invalid JSON body' }, 400);
    }

    const parsed = storageWriteFileRequest.convert(raw);
    if (parsed.isFailure()) {
      return c.json({ error: `invalid request: ${parsed.message}` }, 400);
    }

    const result = service.saveFile(parsed.value);
    if (result.isFailure()) {
      return c.json({ error: result.message }, 400);
    }

    const converted = storageFileResponse.convert(result.value);
    if (converted.isFailure()) {
      return c.json({ error: `invalid response: ${converted.message}` }, 500);
    }

    options.logger?.detail(`storage write: ${parsed.value.namespace ?? 'default'}:${parsed.value.path}`);
    return c.json(converted.value);
  });

  routes.post('/directories', async (c) => {
    const raw = await c.req.json().catch(() => undefined);
    if (raw === undefined) {
      return c.json({ error: 'invalid JSON body' }, 400);
    }

    const parsed = storagePathRequest.convert(raw);
    if (parsed.isFailure()) {
      return c.json({ error: `invalid request: ${parsed.message}` }, 400);
    }

    const result = service.createDirectory(parsed.value);
    if (result.isFailure()) {
      return c.json({ error: result.message }, 400);
    }

    const converted = storageTreeItem.convert(result.value);
    if (converted.isFailure()) {
      return c.json({ error: `invalid response: ${converted.message}` }, 500);
    }
    return c.json(converted.value);
  });

  routes.post('/sync', async (c) => {
    const raw = await c.req.json().catch(() => ({}));
    const parsed = storageSyncRequest.convert(raw);
    if (parsed.isFailure()) {
      return c.json({ error: `invalid request: ${parsed.message}` }, 400);
    }

    const result = await service.sync(parsed.value);
    if (result.isFailure()) {
      return c.json({ error: result.message }, 500);
    }

    return c.json(result.value);
  });

  routes.onError((err, c) => {
    const message = err instanceof Error ? err.message : String(err);
    options.logger?.error(`storage route error: ${message}`);
    return c.json({ error: message }, 500);
  });

  return routes;
}
