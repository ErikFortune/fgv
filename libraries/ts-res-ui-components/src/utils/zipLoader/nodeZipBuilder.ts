/**
 * @deprecated Use ts-res zip-archive packlet or ts-res-browser-cli for ZIP creation
 */

import { Result, fail } from '@fgv/ts-utils';

/**
 * @deprecated Use ts-res zip-archive packlet directly
 */
export class NodeZipBuilder {
  async createFromFiles(): Promise<Result<any>> {
    return fail('NodeZipBuilder is deprecated - use ts-res zip-archive packlet or ts-res-browser-cli');
  }

  async createFromDirectory(): Promise<Result<any>> {
    return fail('NodeZipBuilder is deprecated - use ts-res zip-archive packlet or ts-res-browser-cli');
  }

  async createFromPath(): Promise<Result<any>> {
    return fail('NodeZipBuilder is deprecated - use ts-res zip-archive packlet or ts-res-browser-cli');
  }
}

/**
 * @deprecated Use ts-res zip-archive packlet directly
 */
export function createNodeZipBuilder(): NodeZipBuilder {
  console.warn('createNodeZipBuilder is deprecated - use ts-res zip-archive packlet directly');
  return new NodeZipBuilder();
}

/**
 * @deprecated Use ts-res zip-archive packlet directly
 */
export interface BrowserZipData {
  files: any[];
  manifest: any;
  config?: any;
}

/**
 * @deprecated Use ts-res zip-archive packlet directly
 */
export function prepareZipData(): Result<BrowserZipData> {
  return fail('prepareZipData is deprecated - use ts-res zip-archive packlet directly');
}

/**
 * @deprecated Use ts-res zip-archive packlet directly
 */
export function prepareZipDataFromDirectory(): Result<BrowserZipData> {
  return fail('prepareZipDataFromDirectory is deprecated - use ts-res zip-archive packlet directly');
}
