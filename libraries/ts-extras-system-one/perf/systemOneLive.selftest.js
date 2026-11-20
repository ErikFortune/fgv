/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 *
 * Self-test for perf/systemOneLive.js. The harness is not part of the jest suite, so this runs it
 * as a child process against local stub servers and checks its exit codes, its output and its
 * record. It needs a built `lib/`.
 *
 *   node perf/systemOneLive.selftest.js
 *
 * It prints `● <id> <name>` for each failing case and `Failures: <n>`, the same shape
 * `perf/mutationMatrix.js` reads from jest, so the matrix's harness rows run it directly.
 */

/* eslint-disable no-console */

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const HARNESS = path.join(__dirname, 'systemOneLive.js');
const SERVER_MARKER = 'SERVER-ECHO-5e21';

function run(args, env = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [HARNESS, ...args], {
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

/** The last JSON object the harness printed. */
function recordOf(stdout) {
  const start = stdout.lastIndexOf('\n{\n');
  return JSON.parse(start >= 0 ? stdout.slice(start + 1) : stdout);
}

const probeAnswers = {
  billing: { type: 'noul', noul: 0.9 },
  route: {
    type: 'choice',
    choice: 'billing',
    confidence: 0.7,
    probabilities: { billing: 0.8, technical: 0.15, other: 0.05 }
  },
  urgency: {
    type: 'score',
    score: 1.2,
    confidence: 0.3,
    legend: { 0: 'Not urgent', 1: 'Somewhat urgent', 2: 'Very urgent' },
    probabilities: { 0: 0.2, 1: 0.4, 2: 0.4 }
  }
};

/**
 * A stub System-1 server. `ask(model)` returns `[status, body]` for `/v1/systemone`, and `models`
 * returns `[status, body]` for `/v1/models`.
 */
function stub({ ask, models }) {
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      const [status, body] =
        req.url === '/v1/models' ? models() : ask(raw.length > 0 ? JSON.parse(raw).model : undefined);
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

const knownOnly = (model) =>
  model === 'clm-latest'
    ? [200, { model, answers: probeAnswers, usage: { input_tokens: 9, output_tokens: 0 } }]
    : [422, { detail: `unknown model ${model}; ${SERVER_MARKER}` }];
const anyModel = (model) => [
  200,
  { model, answers: { billing: probeAnswers.billing }, usage: { input_tokens: 1, output_tokens: 0 } }
];
const modelList = () => [
  200,
  { models: [{ name: 'clm-latest', description: 'CLM', release_date: '2026-09-01' }] }
];
const brokenList = () => [500, { error: SERVER_MARKER }];
const brokenAsk = () => [503, { error: SERVER_MARKER }];

async function withStub(handlers, fn) {
  const server = await stub(handlers);
  try {
    return await fn(`http://127.0.0.1:${server.address().port}`);
  } finally {
    server.close();
  }
}

function questionFile(dir, criteria) {
  const file = path.join(dir, `q-${Math.random().toString(36).slice(2)}.json`);
  const noulQuestion = { type: 'noul', instructions: 'Is it?' };
  if (criteria !== '<absent>') {
    noulQuestion.criteria = criteria;
  }
  fs.writeFileSync(file, JSON.stringify({ items: [{ state: 's', questions: { n: noulQuestion } }] }));
  return file;
}

const parityCheck = (file) => [
  'parity',
  '--a',
  'http://127.0.0.1:8700,clm-latest',
  '--b',
  'http://127.0.0.1:8701,clm-latest',
  '--questions',
  file,
  '--max-chars',
  '2400',
  '--min-top-agreement',
  '0.9',
  '--max-mean-abs-diff',
  '0.1',
  '--check'
];

const CASES = [
  [
    'S1',
    'an unknown or repeated option is refused before any output, naming the flag but not its value',
    async (fail) => {
      const misspelt = await run([
        'probe',
        '--url',
        'http://127.0.0.1:8700',
        '--model',
        'm',
        '--max-char',
        '2400',
        '--check'
      ]);
      if (misspelt.code !== 3) fail(`--max-char: exit ${misspelt.code}, expected 3`);
      if (misspelt.stdout !== '') fail('--max-char: printed output before refusing');
      if (!misspelt.stderr.includes('--max-char')) fail('--max-char: the message does not name the flag');
      if (misspelt.stderr.includes('2400')) fail('--max-char: the message echoes the value');
      const wrongMode = await run([
        'probe',
        '--url',
        'http://127.0.0.1:8700',
        '--model',
        'm',
        '--a',
        'http://u:pw@h,m',
        '--check'
      ]);
      if (wrongMode.code !== 3 || wrongMode.stderr.includes('pw'))
        fail('a parity flag on probe is not refused cleanly');
      const repeated = await run([
        'probe',
        '--url',
        'http://127.0.0.1:8700',
        '--model',
        'm',
        '--model',
        'n',
        '--check'
      ]);
      if (repeated.code !== 3) fail(`a repeated --model: exit ${repeated.code}, expected 3`);
      const stray = await run(['probe', 'http://user:secret@h', '--check']);
      if (stray.code !== 3 || stray.stderr.includes('secret'))
        fail('a stray argument is not refused cleanly');
    }
  ],
  [
    'S2',
    "--check validates a noul's criteria as the SDK and askSystemOne accept them",
    async (fail, dir) => {
      const cases = [
        ['<absent>', 0],
        [null, 0],
        [{}, 0],
        [{ true: 'yes' }, 0],
        [{ true: 'yes', false: 'no' }, 0],
        [{ false: null }, 0],
        [{ true: { says: 'yes' }, false: ['no'] }, 0],
        [['yes', 'no'], 3],
        [{ true: 'yes', maybe: 'perhaps' }, 3],
        [{ true: 5 }, 3],
        [{ false: true }, 3],
        ['yes', 3]
      ];
      for (const [criteria, expected] of cases) {
        const result = await run(parityCheck(questionFile(dir, criteria)));
        if (result.code !== expected)
          fail(`criteria ${JSON.stringify(criteria)}: exit ${result.code}, expected ${expected}`);
      }
    }
  ],
  [
    'S3',
    'the probe records how an unknown model is refused, and nothing the server sent',
    async (fail) => {
      await withStub({ ask: knownOnly, models: modelList }, async (url) => {
        const result = await run(['probe', '--url', url, '--model', 'clm-latest']);
        if (result.code !== 0) fail(`exit ${result.code}, expected 0: ${result.stderr}`);
        const record = recordOf(result.stdout);
        const unknown = record.unknownModel ?? {};
        if (!/^fgv-probe-unknown-model-[0-9a-f]{12}$/.test(unknown.model ?? ''))
          fail(`model id ${unknown.model}`);
        if (unknown.reason !== 'invalid-request') fail(`reason ${unknown.reason}, expected invalid-request`);
        if (unknown.status !== 422) fail(`status ${unknown.status}, expected 422`);
        if (unknown.outcome !== 'refused as expected') fail(`outcome ${unknown.outcome}`);
        if (result.stdout.includes(SERVER_MARKER)) fail('the record holds text the server sent');
      });
      await withStub({ ask: anyModel, models: modelList }, async (url) => {
        const result = await run(['probe', '--url', url, '--model', 'clm-latest']);
        const unknown = recordOf(result.stdout).unknownModel ?? {};
        if (!/surprising/.test(unknown.outcome ?? ''))
          fail(`an accepted unknown model is not recorded as surprising: ${unknown.outcome}`);
      });
    }
  ],
  [
    'S4',
    'a model-listing failure fails the probe; when both fail, the ask is reported',
    async (fail) => {
      await withStub({ ask: knownOnly, models: brokenList }, async (url) => {
        const result = await run(['probe', '--url', url, '--model', 'clm-latest']);
        if (result.code !== 2) fail(`listing only: exit ${result.code}, expected 2`);
        const record = recordOf(result.stdout);
        if (
          record.ok !== false ||
          record.failedStep !== 'listSystemOneModels' ||
          record.reason !== 'server'
        ) {
          fail(`listing only: ok ${record.ok}, failedStep ${record.failedStep}, reason ${record.reason}`);
        }
        if (result.stdout.includes(SERVER_MARKER))
          fail('listing only: the record holds text the server sent');
      });
      await withStub({ ask: brokenAsk, models: brokenList }, async (url) => {
        const result = await run(['probe', '--url', url, '--model', 'clm-latest']);
        const record = recordOf(result.stdout);
        if (result.code !== 2 || record.failedStep !== 'askSystemOne' || record.listModels?.ok !== false) {
          fail(
            `both: exit ${result.code}, failedStep ${record.failedStep}, listModels.ok ${record.listModels?.ok}`
          );
        }
      });
    }
  ],
  [
    'S5',
    'a base URL with whitespace is refused, as the client refuses it',
    async (fail) => {
      for (const url of [' http://127.0.0.1:8700', 'http://127.0.0.1:8700 ', 'http://127.0.0.1:8700\t']) {
        const result = await run(['probe', '--url', url, '--model', 'm', '--check']);
        if (result.code !== 3 || result.stdout !== '')
          fail(`${JSON.stringify(url)}: exit ${result.code}, expected 3`);
      }
      const spaced = await run([
        'parity',
        ...parityCheck('unused')
          .slice(1)
          .map((arg) =>
            arg === 'http://127.0.0.1:8700,clm-latest' ? ' http://127.0.0.1:8700,clm-latest' : arg
          )
      ]);
      if (spaced.code !== 3) fail(`parity --a with leading whitespace: exit ${spaced.code}, expected 3`);
    }
  ],
  [
    'S6',
    '--check given twice is refused',
    async (fail) => {
      const twice = await run([
        'probe',
        '--url',
        'http://127.0.0.1:8700',
        '--model',
        'm',
        '--check',
        '--check'
      ]);
      if (twice.code !== 3 || twice.stdout !== '') fail(`exit ${twice.code}, expected 3 with no output`);
    }
  ],
  [
    'S7',
    'questions given as a list are refused',
    async (fail, dir) => {
      const file = path.join(dir, 'list.json');
      fs.writeFileSync(
        file,
        JSON.stringify({ items: [{ state: 's', questions: [{ type: 'noul', instructions: 'Is it?' }] }] })
      );
      const result = await run(parityCheck(file));
      if (result.code !== 3) fail(`exit ${result.code}, expected 3`);
    }
  ],
  [
    'S8',
    '--check validates the state, instructions, choice descriptions and score levels as askSystemOne does',
    async (fail, dir) => {
      const noulQ = (fields) => `{"type":"noul","instructions":"Is it?"${fields}}`;
      const choiceQ = (criteria, fields = '') =>
        `{"type":"choice","instructions":"Which?","criteria":${criteria}${fields}}`;
      const scoreQ = (levels, fields = '') =>
        `{"type":"score","instructions":"How much?","criteria":${levels}${fields}}`;
      const cases = [
        ['a text state', '"s"', `{"n":${noulQ('')}}`, 0],
        ['an object state', '{"a":[1,true,null]}', `{"n":${noulQ('')}}`, 0],
        ['a null state', 'null', `{"n":${noulQ('')}}`, 0],
        ['a numeric state', '5', `{"n":${noulQ('')}}`, 3],
        ['a boolean state', 'true', `{"n":${noulQ('')}}`, 3],
        ['noul: object instructions', '"s"', `{"n":{"type":"noul","instructions":{"q":"Is it?"}}}`, 0],
        ['noul: numeric instructions', '"s"', `{"n":{"type":"noul","instructions":7}}`, 3],
        ['choice: list and null descriptions', '"s"', `{"c":${choiceQ('{"a":["x"],"b":null}')}}`, 0],
        ['choice: a numeric description', '"s"', `{"c":${choiceQ('{"a":"x","b":5}')}}`, 3],
        ['choice: a __proto__ label', '"s"', `{"c":${choiceQ('{"a":"x","__proto__":"y"}')}}`, 3],
        [
          'choice: boolean instructions',
          '"s"',
          `{"c":{"type":"choice","instructions":true,"criteria":{"a":"x","b":"y"}}}`,
          3
        ],
        ['score: object levels', '"s"', `{"s":${scoreQ('[{"d":"low"},"high"]')}}`, 0],
        ['score: a boolean level', '"s"', `{"s":${scoreQ('["low",false]')}}`, 3],
        [
          'score: numeric instructions',
          '"s"',
          `{"s":{"type":"score","instructions":7,"criteria":["low","high"]}}`,
          3
        ],
        ['a __proto__ question id', '"s"', `{"__proto__":${noulQ('')}}`, 3]
      ];
      for (const [label, state, questions, expected] of cases) {
        const file = path.join(dir, `s8-${Math.random().toString(36).slice(2)}.json`);
        fs.writeFileSync(file, `{"items":[{"state":${state},"questions":${questions}}]}`);
        const result = await run(parityCheck(file));
        if (result.code !== expected) fail(`${label}: exit ${result.code}, expected ${expected}`);
      }
    }
  ],
  [
    'S9',
    '--check refuses a __proto__ key or a non-finite number nested anywhere in the state, an instruction or a criterion',
    async (fail, dir) => {
      const nested = '{"d":{"__proto__":{"x":1},"e":2}}';
      const noulQ = '{"type":"noul","instructions":"Is it?"}';
      const cases = [
        ['nested JSON without the key', '{"a":[{"b":{"proto":"__proto__"}}]}', `{"n":${noulQ}}`, 0],
        ['the state, two levels down', '{"a":{"__proto__":1,"b":2}}', `{"n":${noulQ}}`, 3],
        ['the state, inside an array', '[[{"a":{"__proto__":null}}]]', `{"n":${noulQ}}`, 3],
        ['a noul instruction', '"s"', `{"n":{"type":"noul","instructions":${nested}}}`, 3],
        ['a noul criterion', '"s"', `{"n":{"type":"noul","criteria":{"true":${nested}}}}`, 3],
        ['a choice description', '"s"', `{"c":{"type":"choice","criteria":{"a":${nested},"b":null}}}`, 3],
        ['a score level', '"s"', `{"s":{"type":"score","criteria":["low",[${nested}]]}}`, 3],
        ['finite numbers', '{"a":[0,-1.5,1e308]}', `{"n":${noulQ}}`, 0],
        ['1e999 in the state', '{"a":[1e999]}', `{"n":${noulQ}}`, 3],
        ['-1e999 in a criterion', '"s"', '{"n":{"type":"noul","criteria":{"true":{"x":-1e999}}}}', 3]
      ];
      for (const [label, state, questions, expected] of cases) {
        const file = path.join(dir, `s9-${Math.random().toString(36).slice(2)}.json`);
        fs.writeFileSync(file, `{"items":[{"state":${state},"questions":${questions}}]}`);
        const result = await run(parityCheck(file));
        if (result.code !== expected) fail(`${label}: exit ${result.code}, expected ${expected}`);
      }
    }
  ]
];

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'system-one-selftest-'));
  let failures = 0;
  try {
    for (const [id, name, body] of CASES) {
      const problems = [];
      try {
        await body((problem) => problems.push(problem), dir);
      } catch (err) {
        problems.push(`threw: ${err.message}`);
      }
      if (problems.length > 0) {
        failures++;
        console.log(`  ● ${id} ${name}`);
        for (const problem of problems) {
          console.log(`      ${problem}`);
        }
      } else {
        console.log(`  ✓ ${id} ${name}`);
      }
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  console.log(`Successes: ${CASES.length - failures}\nFailures: ${failures}`);
  process.exitCode = failures > 0 ? 1 : 0;
}

main();
