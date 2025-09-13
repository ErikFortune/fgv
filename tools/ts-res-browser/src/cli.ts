#!/usr/bin/env node

import { exec } from 'child_process';
import { join } from 'path';

const command = process.argv[2];

switch (command) {
  case 'dev':
    console.log('Starting TS-RES Browser development server...');
    exec('npm run dev', { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error}`);
        return;
      }
      console.log(stdout);
      if (stderr) console.error(stderr);
    });
    break;

  case 'build':
    console.log('Building TS-RES Browser...');
    exec('npm run build', { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error}`);
        return;
      }
      console.log(stdout);
      if (stderr) console.error(stderr);
    });
    break;

  default:
    console.log('TS-RES Browser CLI');
    console.log('');
    console.log('Usage:');
    console.log('  ts-res-browser dev   - Start development server');
    console.log('  ts-res-browser build - Build for production');
    console.log('');
    console.log('For development, you can also use:');
    console.log('  rushx dev   - Start development server');
    console.log('  rushx build - Build for production');
    break;
}
