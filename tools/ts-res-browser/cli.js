#!/usr/bin/env node

const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const command = process.argv[2];
const projectRoot = __dirname;

// Check if we have a built dist directory
const distPath = path.join(projectRoot, 'dist');
const hasBuiltFiles = fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'));

function startDevServer(port = 3000) {
  const packageManager = fs.existsSync(path.join(projectRoot, 'package-lock.json'))
    ? 'npm'
    : fs.existsSync(path.join(projectRoot, 'yarn.lock'))
    ? 'yarn'
    : 'npm';

  console.log('Starting TS-RES Browser development server...');
  console.log(`Using ${packageManager} to start server...`);

  const child = spawn(packageManager, ['run', 'dev'], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env, PORT: port.toString() }
  });

  child.on('error', (error) => {
    console.error(`Error starting dev server: ${error.message}`);
    process.exit(1);
  });
}

function serveBuildFiles(port = 8080) {
  if (!hasBuiltFiles) {
    console.error('No built files found. Please run "ts-res-browser build" first.');
    process.exit(1);
  }

  // Try to use a simple static server
  try {
    const handler = require('serve-handler');
    const http = require('http');

    const server = http.createServer((request, response) => {
      return handler(request, response, {
        public: distPath,
        rewrites: [{ source: '**', destination: '/index.html' }]
      });
    });

    server.listen(port, () => {
      console.log(`TS-RES Browser running at http://localhost:${port}`);
      console.log('Press Ctrl+C to stop');
    });
  } catch (error) {
    // Fallback: just open the HTML file
    console.log(`Built files available at: ${path.join(distPath, 'index.html')}`);
    console.log('To serve the files, install a static server like: npm install -g serve');
    console.log(`Then run: serve -s ${distPath} -p ${port}`);
  }
}

switch (command) {
  case 'dev':
    const devPort = process.argv[3] || process.env.PORT || 3000;
    startDevServer(devPort);
    break;

  case 'serve':
  case 'start':
    const servePort = process.argv[3] || 8080;
    serveBuildFiles(servePort);
    break;

  case 'build':
    console.log('Building TS-RES Browser...');
    const packageManager = fs.existsSync(path.join(projectRoot, 'package-lock.json')) ? 'npm' : 'npm';

    const buildChild = spawn(packageManager, ['run', 'build'], {
      cwd: projectRoot,
      stdio: 'inherit'
    });

    buildChild.on('error', (error) => {
      console.error(`Error building: ${error.message}`);
      process.exit(1);
    });

    buildChild.on('close', (code) => {
      if (code === 0) {
        console.log('Build completed successfully!');
        console.log('To serve the built files, run: ts-res-browser serve');
      } else {
        console.error(`Build failed with code ${code}`);
        process.exit(code);
      }
    });
    break;

  default:
    console.log('TS-RES Browser CLI');
    console.log('');
    console.log('Usage:');
    console.log('  ts-res-browser dev    - Start development server');
    console.log('  ts-res-browser build  - Build for production');
    console.log('  ts-res-browser serve  - Serve built files');
    console.log('');
    console.log('Options:');
    console.log('  ts-res-browser dev [port]   - Start dev server on specific port');
    console.log('  ts-res-browser serve [port] - Serve on specific port');
    console.log('');
    if (hasBuiltFiles) {
      console.log('✅ Built files found - you can run "ts-res-browser serve"');
    } else {
      console.log('⚠️  No built files - run "ts-res-browser build" first');
    }
    break;
}
