// Copyright (c) 2026 Erik Fortune
// SPDX-License-Identifier: MIT

export * from './packlets/types';
export * from './packlets/converters';
export * from './packlets/registry';
export * from './packlets/store';
export * from './packlets/fixture';
export * from './packlets/observe';
export * from './packlets/resolve';

// Selective re-export: `createPatternScreener` is the public screener factory.
// `applySafeguards` / `ISafeguardResult` are `@internal` engine pieces consumed
// only by the resolve packlet, so they are intentionally not surfaced here.
export { createPatternScreener } from './packlets/safeguards';
export type { IPatternScreenerOptions } from './packlets/safeguards';
