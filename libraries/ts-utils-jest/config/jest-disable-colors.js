// Disable colors in Jest to ensure consistent snapshot behavior
// This setup file ensures that Jest matchers don't include ANSI color codes
// in their output, which was causing snapshot test failures when running
// via different environments (direct Jest vs Heft/Rush)

// Force Jest to not use colors
process.env.FORCE_COLOR = '0';

// Monkey patch the jest-matcher-utils functions to remove colors
const matcherUtils = require('jest-matcher-utils');

// Store original functions
const originalPrintExpected = matcherUtils.printExpected;
const originalPrintReceived = matcherUtils.printReceived;
const originalMatcherHint = matcherUtils.matcherHint;

// Override with non-colored versions
matcherUtils.printExpected = function (value) {
  // Remove ANSI color codes from the output
  const result = originalPrintExpected.call(this, value);
  return result.replace(/\x1b\[[0-9;]*m/g, '');
};

matcherUtils.printReceived = function (value) {
  // Remove ANSI color codes from the output
  const result = originalPrintReceived.call(this, value);
  return result.replace(/\x1b\[[0-9;]*m/g, '');
};

matcherUtils.matcherHint = function (matcherName, received, expected, options) {
  // Remove ANSI color codes from the output
  const result = originalMatcherHint.call(this, matcherName, received, expected, options);
  return result.replace(/\x1b\[[0-9;]*m/g, '');
};
