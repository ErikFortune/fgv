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

/**
 * Hono app factory — exported for testing.
 * @packageDocumentation
 */

import { AsyncLocalStorage } from 'async_hooks';

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { MongoClient } from 'mongodb';

import {
  createStorageRoutes,
  FsStorageProviderFactory,
  type IHttpStorageProviderFactory
} from '@fgv/ts-http-storage';

import { aiRoutes } from '../ai';
import { MongoStorageProviderFactory } from '../storage';

/**
 * Storage backend type.
 * @public
 */
export type StorageType = 'file' | 'mongo';

const _requestUserId: AsyncLocalStorage<string> = new AsyncLocalStorage<string>();

/**
 * Creates the Hono application with all routes and middleware.
 *
 * When `CHOCOLATE_LAB_STORAGE_TYPE` is `'mongo'`, connects to MongoDB
 * and creates indexes at startup. Falls back to filesystem storage.
 *
 * @returns Configured Hono app
 * @public
 */
export async function createApp(): Promise<Hono> {
  const app = new Hono();
  const storageType = (process.env.CHOCOLATE_LAB_STORAGE_TYPE ?? 'file') as StorageType;
  const defaultUserId = process.env.MONGODB_DEFAULT_USER_ID ?? 'default-user';
  const staticPath = process.env.STATIC_FILES_PATH;

  app.use('*', cors());

  // Extract X-User-Id from request headers and store in AsyncLocalStorage
  app.use('/api/storage/*', async (c, next) => {
    const userId = c.req.header('X-User-Id') ?? defaultUserId;
    return _requestUserId.run(userId, () => next());
  });

  app.get('/health', (c) => c.json({ status: 'ok' }));

  // Serve frontend defaults when running in container mode (STATIC_FILES_PATH set).
  // The frontend fetches this at startup to auto-enable cloud storage for first-time users.
  app.get('/api/config', (c) => {
    if (!staticPath) {
      return c.json({});
    }
    return c.json({
      cloudStorage: {
        enabled: true,
        baseUrl: '/api/storage'
      }
    });
  });

  app.route('/api/ai', aiRoutes);

  const providers = await _createProviderFactory(storageType, defaultUserId);
  app.route('/api/storage', createStorageRoutes({ providers }));

  // Serve static frontend files when STATIC_FILES_PATH is set (container mode)
  if (staticPath) {
    const { serveStatic } = await import('@hono/node-server/serve-static');
    // Serve static assets first
    app.use('/*', serveStatic({ root: staticPath }));
    // SPA fallback: serve index.html for unmatched routes
    app.use('/*', serveStatic({ root: staticPath, path: 'index.html' }));
  }

  return app;
}

async function _createProviderFactory(
  storageType: StorageType,
  defaultUserId: string
): Promise<IHttpStorageProviderFactory> {
  if (storageType === 'mongo') {
    const connectionString = process.env.MONGODB_CONNECTION_STRING ?? 'mongodb://localhost:27017';
    const dbName = process.env.MONGODB_DB_NAME ?? 'chocolate-lab';

    const client = new MongoClient(connectionString);
    await client.connect();
    console.log(`Connected to MongoDB at ${connectionString} (db: ${dbName})`);

    const db = client.db(dbName);
    // Read userId per-request from AsyncLocalStorage (set by middleware from X-User-Id header).
    // Falls back to the env var default when no header is present.
    const factory = new MongoStorageProviderFactory({
      db,
      userId: (): string => _requestUserId.getStore() ?? defaultUserId
    });

    // Ensure indexes exist at startup
    const indexResult = await factory.ensureIndexes();
    if (indexResult.isFailure()) {
      console.error(`Warning: failed to ensure indexes: ${indexResult.message}`);
    }

    // Graceful shutdown
    const shutdown = (): void => {
      console.log('Closing MongoDB connection...');
      client.close().catch((err: unknown) => {
        console.error(`Error closing MongoDB: ${err instanceof Error ? err.message : String(err)}`);
      });
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    return factory;
  }

  // Default: filesystem storage
  const storageRootPath = process.env.CHOCOLATE_LAB_STORAGE_ROOT ?? './data/storage';
  return new FsStorageProviderFactory({ rootPath: storageRootPath });
}
