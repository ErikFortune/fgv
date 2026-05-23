/**
 * `@fgv/ts-web-extras-transformers` — Result-integration boundary over `@huggingface/transformers`
 * (browser-side).
 *
 * Provisional B-1 scaffolding: this package is empty at B-1 and gets its primitives populated
 * in B-2 of the `local-ai-exploration` cluster. The cluster's done-or-discard gate at B-3 exit
 * may discard the package entirely if the facade does not earn its keep.
 *
 * Expected shape (B-2): the browser counterpart to `@fgv/ts-extras-transformers`. Same surface
 * (`loadPipeline`, `classify`, `embed`, etc.) wrapping the browser-friendly call paths of
 * `@huggingface/transformers`. Mirrors the `@fgv/ts-web-extras-webauthn` discipline — one-line
 * `captureAsyncResult` wrappers over upstream calls with no opinionated orchestration above the
 * boundary.
 *
 * @packageDocumentation
 */

/**
 * Sentinel export confirming the package was loaded. Provisional placeholder; replaced by real
 * primitives in B-2. The string identifies the cluster phase that authored the scaffold so
 * post-B-2 PRs that forget to remove this constant fail review obviously.
 * @public
 */
export const PROVISIONAL_SCAFFOLD: 'local-ai-exploration:B-1' = 'local-ai-exploration:B-1';
