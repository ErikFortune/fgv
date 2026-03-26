/**
 * @fgv/repo-template — CLI tool for creating and maintaining fgv-derived Rush monorepos.
 *
 * @packageDocumentation
 */

export { RepoTemplateCli } from './cli';
export { runCreate, ICreateOptions } from './commands/create';
export { runSync, ISyncOptions } from './commands/sync';
export { runPatch, IPatchOptions, parsePatchArgs } from './commands/patch';
export { runInitLibrary, IInitLibraryOptions, RigType, CategoryType } from './commands/init-library';
export { applyOperations, applyOperation, patchFile, IPatchOperation } from './packlets/jsonc';
export { loadManifest, IManifest, ISharedFile, ISharedPackage, ITemplatedFile } from './packlets/manifest';
export { renderTemplate, renderTemplateFile, ITemplateVars } from './packlets/template';
