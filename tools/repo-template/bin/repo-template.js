#!/usr/bin/env node

const { RepoTemplateCli } = require('../lib/cli');

async function main() {
  try {
    const cli = new RepoTemplateCli();
    await cli.run(process.argv);
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
