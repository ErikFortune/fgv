/**
 * Shell packlet — scenario contract types and the shared `IScenarioContext` plumbing
 * the testbed exposes to every scenario.
 *
 * The contract intentionally mirrors the brief's `IScenario` shape: scenarios are first-class
 * entities described by metadata (id, title, category, tags) and may expose a `web` impl, a
 * `cli` impl, or both. Adding a scenario is a one-file change (drop a module, register in
 * `scenarios/index.ts`).
 *
 * @packageDocumentation
 */

import type { ComponentType } from 'react';
import type { Logging, Result } from '@fgv/ts-utils';
import type { FileTree } from '@fgv/ts-json-base';
import { CryptoUtils } from '@fgv/ts-extras';

/**
 * Scenario categories used for sidebar grouping. Add a new category here when a scenario
 * doesn't fit any of the existing ones; the sidebar groups by category automatically.
 * @public
 */
export type ScenarioCategory = 'ai' | 'i18n' | 'crypto' | 'prompts' | 'resources' | 'general';

/**
 * Identifies a secret that a scenario requires, with both the KeyStore id and the fallback
 * environment variable name. The shell's `resolveSecret` consults the KeyStore first and falls
 * back to the env var if the KeyStore is locked or missing the entry.
 * @public
 */
export interface ISecretSpec {
  /** KeyStore-compatible id (e.g. `'openai-api-key'`). */
  readonly id: string;
  /** Fallback env var (e.g. `'OPENAI_API_KEY'`). */
  readonly envVarName: string;
  /** Human-readable description surfaced in the missing-secret diagnostic. */
  readonly description: string;
}

/**
 * Shared per-scenario context provided by the testbed shell. The shell constructs one
 * `IScenarioContext` and hands it to every scenario implementation (web or CLI).
 * @public
 */
export interface IScenarioContext {
  /** LogReporter bridged to MessagesProvider on web; to stderr on CLI. */
  readonly logger: Logging.LogReporter<unknown>;
  /** Unlocked KeyStore, or `undefined` if none is unlocked yet. */
  readonly keyStore: CryptoUtils.KeyStore.KeyStore | undefined;
  /** Resolve a secret from KeyStore first, env-var second. */
  readonly resolveSecret: (spec: ISecretSpec) => Promise<Result<string>>;
  /** In-memory data tree generated from `samples/testbed/data/`. */
  readonly dataTree: FileTree.FileTree;
}

/**
 * Metadata common to every scenario, independent of web/CLI surface.
 * @public
 */
export interface IScenarioBase {
  /** Stable, URL-safe id. Used as the deep-link key. */
  readonly id: string;
  /** Short human-readable title (sidebar + main heading). */
  readonly title: string;
  /** One- or two-sentence description displayed above the scenario component. */
  readonly description: string;
  /** Category bucket used for sidebar grouping. */
  readonly category: ScenarioCategory;
  /** Capability tags (e.g. `['ts-res', 'local-ai', 'classification']`); searchable. */
  readonly tags: readonly string[];
  /** Secrets the scenario depends on; surfaced in the secrets modal. */
  readonly requiredSecrets?: readonly ISecretSpec[];
}

/**
 * Web-surface implementation for a scenario.
 * @public
 */
export interface IWebScenarioImpl {
  /** React component receiving the shared context as a prop. */
  readonly component: ComponentType<{ context: IScenarioContext }>;
  /**
   * Optional async setup hook. Resolving `true` indicates the component is ready to mount;
   * `false` means the shell should keep showing the loading state. Failures bubble to the
   * shell's error UI.
   */
  readonly initialize?: (context: IScenarioContext) => Promise<Result<boolean>>;
}

/**
 * CLI-surface implementation for a scenario. `run` returns a one-line success summary that
 * the CLI prints to stdout; failures bubble to the CLI's structured error output.
 * @public
 */
export interface ICliScenarioImpl {
  readonly run: (context: IScenarioContext) => Promise<Result<string>>;
}

/**
 * A scenario is metadata plus at least one of (web impl, CLI impl). A scenario that exposes
 * only `web` is still listed in CLI help with a "web-only" note (and vice versa).
 * @public
 */
export interface IScenario extends IScenarioBase {
  readonly web?: IWebScenarioImpl;
  readonly cli?: ICliScenarioImpl;
}

export { resolveSecret } from './secretResolver';
