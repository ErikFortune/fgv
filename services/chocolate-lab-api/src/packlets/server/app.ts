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

import { type Result, fail, succeed } from '@fgv/ts-utils';
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

  // Track startup errors for health/config reporting
  let startupError: string | undefined;

  app.use('*', cors());

  // Extract X-User-Id from request headers and store in AsyncLocalStorage
  app.use('/api/storage/*', async (c, next) => {
    const userId = c.req.header('X-User-Id') ?? defaultUserId;
    return _requestUserId.run(userId, () => next());
  });

  app.get('/health', (c) => {
    if (startupError) {
      return c.json({ status: 'degraded', error: startupError }, 503);
    }
    return c.json({ status: 'ok' });
  });

  // Serve frontend defaults when running in container mode (STATIC_FILES_PATH set).
  // The frontend fetches this at startup to auto-enable cloud storage for first-time users.
  app.get('/api/config', (c) => {
    if (!staticPath) {
      return c.json({});
    }
    return c.json({
      cloudStorage: {
        enabled: !startupError,
        baseUrl: '/api/storage'
      },
      proxyAvailable: true,
      keystoreInCloud: true,
      ...(startupError ? { error: startupError } : {})
    });
  });

  app.route('/api/ai', aiRoutes);

  const factoryResult = await _createProviderFactory(storageType, defaultUserId);
  if (factoryResult.isSuccess()) {
    app.route('/api/storage', createStorageRoutes({ providers: factoryResult.value }));
  } else {
    startupError = factoryResult.message;
    console.error(`Storage unavailable: ${startupError}`);
    // Mount a stub so storage routes return 503 instead of 404
    const storageStub = new Hono();
    storageStub.all('*', (c) => c.json({ error: `Storage unavailable: ${startupError}` }, 503));
    app.route('/api/storage', storageStub);
  }

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

/**
 * Builds a MongoDB connection URI from individual environment variables.
 * Used when MONGODB_CONNECTION_STRING is not set (e.g. Olares middleware injection).
 */
function _buildMongoUri(): string {
  const host = process.env.MONGODB_HOST || 'localhost';
  const port = process.env.MONGODB_PORT || '27017';
  const user = process.env.MONGODB_USER;
  const password = process.env.MONGODB_PASSWORD;
  const authSource = process.env.MONGODB_AUTH_SOURCE || process.env.MONGODB_DATABASE;
  if (user && password) {
    const base = `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}`;
    return authSource ? `${base}/?authSource=${encodeURIComponent(authSource)}` : base;
  }
  return `mongodb://${host}:${port}`;
}

async function _createProviderFactory(
  storageType: StorageType,
  defaultUserId: string
): Promise<Result<IHttpStorageProviderFactory>> {
  if (storageType === 'mongo') {
    // Log raw env vars for diagnostics
    console.log('MongoDB env vars:', {
      MONGODB_CONNECTION_STRING: process.env.MONGODB_CONNECTION_STRING ? '(set)' : '(unset)',
      MONGODB_HOST: process.env.MONGODB_HOST || '(unset)',
      MONGODB_PORT: process.env.MONGODB_PORT || '(unset)',
      MONGODB_USER: process.env.MONGODB_USER ? '(set)' : '(unset)',
      MONGODB_PASSWORD: process.env.MONGODB_PASSWORD ? '(set)' : '(unset)',
      MONGODB_DATABASE: process.env.MONGODB_DATABASE || '(unset)',
      MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || '(unset)'
    });

    const connectionString = process.env.MONGODB_CONNECTION_STRING || _buildMongoUri();
    const dbName = process.env.MONGODB_DATABASE || process.env.MONGODB_DB_NAME || 'chocolate-lab';

    // Log connection details (mask password) for diagnostics
    const safeUri = connectionString.replace(/:([^@/]+)@/, ':***@');
    console.log(`Connecting to MongoDB at ${safeUri} (db: ${dbName})...`);

    try {
      const client = new MongoClient(connectionString);
      await client.connect();
      console.log(`Connected to MongoDB at ${safeUri} (db: ${dbName})`);

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

      return succeed(factory);
    } catch (err: unknown) {
      const message = `MongoDB connection failed (${safeUri}, db: ${dbName}): ${
        err instanceof Error ? err.message : String(err)
      }`;
      console.error(message);
      return fail(message);
    }
  }

  // Default: filesystem storage
  const storageRootPath = process.env.CHOCOLATE_LAB_STORAGE_ROOT ?? './data/storage';
  return succeed(new FsStorageProviderFactory({ rootPath: storageRootPath }));
}
