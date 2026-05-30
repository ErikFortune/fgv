/**
 * Manifest loader — reads and parses sync-manifest.json.
 */

import * as fs from 'fs';
import * as path from 'path';
import { IManifest } from './types';

export { IManifest, ISharedFile, ISharedPackage, ITemplatedFile } from './types';

/**
 * Load and parse a sync-manifest.json file.
 */
export function loadManifest(manifestPath: string): IManifest {
  const content = fs.readFileSync(manifestPath, 'utf-8');
  return JSON.parse(content) as IManifest;
}

/**
 * Resolve the default manifest path relative to this tool's location.
 * Works whether running from source (src/) or compiled (lib/).
 */
export function getDefaultManifestPath(): string {
  // Walk up from this file to the tool root, then find sync-manifest.json
  // In compiled form: lib/packlets/manifest/index.js → ../../.. → tool root
  // In source form: src/packlets/manifest/index.ts → ../../.. → tool root
  const toolRoot = path.resolve(__dirname, '..', '..', '..');
  return path.join(toolRoot, 'sync-manifest.json');
}
