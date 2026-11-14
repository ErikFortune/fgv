// Jest `testResultsProcessor` hook that makes a coverage-threshold miss cause the
// Heft "test" task to exit non-zero, so CI actually blocks on the repo's coverage gate.
//
// Why this exists:
//   `@rushstack/heft-jest-plugin` inspects `results.numFailedTests` and
//   `results.numFailedTestSuites` after `runCLI()` returns and only emits a Heft
//   error (which fails the task) for those two counters. Jest reflects a
//   coverage-*threshold* failure in `results.success === false` (the coverage
//   reporter records an error, which flips `success` in TestScheduler) but does
//   NOT increment the failed-test/suite counters. The plugin therefore prints the
//   `Jest: "global" coverage threshold ... not met` warning and still exits 0.
//
// Jest invokes `testResultsProcessor(results)` from `processResults()` AFTER
// `results.success` has been finalized, and the plugin reads back exactly the
// object this function returns. So when jest considers the run a failure but no
// test or suite failure was recorded (i.e. the failure is a coverage-threshold
// miss, or another run-level failure such as an obsolete snapshot under CI), we
// surface it as a failed test suite. That makes the plugin's existing
// `numFailedTestSuites > 0` check fire and fail the task, restoring
// `results.success` semantics that the plugin otherwise drops.
//
// This is a plain CommonJS module (the rig has no build step); it is referenced
// from the sibling `jest.config.json` via `testResultsProcessor`.

'use strict';

/**
 * @param {import('@jest/test-result').AggregatedResult} results
 * @returns {import('@jest/test-result').AggregatedResult}
 */
function coverageResultsProcessor(results) {
  if (
    results &&
    results.success === false &&
    results.numFailedTests === 0 &&
    results.numFailedTestSuites === 0
  ) {
    // No individual test/suite failed, yet jest deemed the run a failure. The
    // dominant cause is an unmet `coverageThreshold`. Surface it through the
    // counter the Heft jest plugin actually inspects.
    results.numFailedTestSuites += 1;
  }
  return results;
}

module.exports = coverageResultsProcessor;
