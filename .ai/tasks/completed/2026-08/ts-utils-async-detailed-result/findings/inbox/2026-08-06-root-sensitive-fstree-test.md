# Finding: `mutableFsTree` permission test cannot pass when the suite runs as root

**Stream:** `ts-utils-async-detailed-result`
**Date:** 2026-08-06
**Disposition:** out of scope — **observed, not fixed**. Recorded because cloud/agent containers
routinely run as root, so anyone reproducing CI locally from one will hit this and may mistake it
for a real regression in their own change. I did.

## What was observed

Running the CI test step locally (`rush test`, as `.github/workflows/ci.yml` does):

```
FAILURE: @fgv/ts-json-base
  ● FsFileTreeAccessors › fileIsMutable › returns permission-denied for read-only file
    Expected: Failure with /permission denied/i, Detail: "permission-denied"
    Received: Success with "true",              Detail: "persistent"
  at src/test/unit/file-tree/mutableFsTree.test.ts:89
```

## Why it is environmental, not a defect

The test `chmod`s a file read-only and asserts it is not writable. **Root ignores the permission
bits**, so the write succeeds and `fileIsMutable` correctly reports `true`. Confirmed directly:

```
uid=0 user=root
ROOT-EFFECT: can write to a 0444 file -> that test cannot pass here
```

GitHub Actions runs as the non-root `runner` user, so the test passes in CI. It also has nothing to
do with this stream — `@fgv/ts-json-base` is untouched here, and `ts-utils` / `ts-extras` both pass.

## Why it is worth recording anyway

The repo's own guidance is to reproduce CI locally before blaming CI. That advice quietly assumes a
non-root environment. An agent running in a root container who follows it will see a red suite in a
package they never touched, and the failure message ("permission denied" expected, "persistent"
received) does not hint at the cause.

Options if someone picks this up, in rough order of preference:

1. **Skip when `process.getuid?.() === 0`**, with a message naming root as the reason. Keeps the
   assertion honest where it is meaningful and removes the false signal where it is not.
2. Assert on the *accessor's* permission logic with an injected stat result, rather than on real
   filesystem enforcement — tests the code rather than the kernel.
3. Leave it, and document the root caveat in the package README.

Not filed as a bug against the test's correctness — it is correct for the environment it assumes.
