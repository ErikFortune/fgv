# @fgv/ts-web-extras-transformers

**Status:** provisional scaffolding (B-1 of the `local-ai-exploration` cluster).

Browser-side Result-integration boundary over
[`@huggingface/transformers`](https://huggingface.co/docs/transformers.js/en/index). The
companion package [`@fgv/ts-extras-transformers`](../ts-extras-transformers) provides the same
surface for Node consumers.

## What this is

A thin facade that wraps `@huggingface/transformers` calls in `Result<T>` from `@fgv/ts-utils`,
mirroring the discipline established by
[`@fgv/ts-web-extras-webauthn`](../ts-web-extras-webauthn): one-line `captureAsyncResult`
wrappers around upstream primitives with **no opinionated orchestration** above the boundary.
Consumers compose the primitives into their own pipelines.

## What this is *not*

- Not a pipeline builder or task orchestrator.
- Not a model registry or download manager.
- Not an opinionated wrapper that hides upstream options.

If you need any of those, use `@huggingface/transformers` directly (with `captureAsyncResult`
for your own Result wrapping). This package is intended to be the thinnest possible boundary.

## Status

Empty at B-1. Primitives populated in B-2. The done-or-discard gate at B-3 exit may discard
the package entirely if the facade does not earn its keep against direct
`@huggingface/transformers` use — see `.ai/tasks/active/local-ai-exploration/brief.md` for the
cluster contract.
