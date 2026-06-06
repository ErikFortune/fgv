#!/usr/bin/env node

const { runTestbedCli } = require('../lib/cli');

runTestbedCli(process.argv, { stdout: process.stdout, stderr: process.stderr })
  .then((code) => process.exit(code))
  .catch((err) => {
    process.stderr.write(`testbed CLI: unhandled error: ${err && err.message ? err.message : err}\n`);
    process.exit(1);
  });
