/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 *
 * Live checks for @fgv/ts-extras-system-one (implementation plan § 6 and § 8).
 *
 * Deliberately NOT a jest test, and not published (`perf/` is outside `files`). It talks to real
 * servers, so it runs on demand, and its JSON output is pasted into the stream's `result.md` as the
 * record of a live leg. It needs a built `lib/` (`rushx build`) and uses only the public exports.
 *
 *   node perf/systemOneLive.js probe --url <u> --model <m> [--key-env <VAR>] [--max-chars <n>] [--check]
 *   node perf/systemOneLive.js parity --a <url,model> --b <url,model> --questions <file>
 *        --max-chars <n> --min-top-agreement <x> --max-mean-abs-diff <y>
 *        [--key-env-a <VAR>] [--key-env-b <VAR>] [--check]
 *
 *   probe   one askSystemOne with a fixed noul + choice + score question set, plus
 *           listSystemOneModels; prints the § 6 record as JSON. Exit 0 on success, 2 on a
 *           classified failure (the record names the reason and status).
 *   parity  refuses to start unless both thresholds are given, and prints them first. Probes both
 *           endpoints and exits 2 if either probe fails ("refused, not a parity result"). Asks
 *           every item of the question file of both, each bounded by --max-chars so truncation is
 *           not what is measured, and reports top-answer agreement and the mean and maximum
 *           per-option absolute difference. Exit 0 (pass) or 1 (fail).
 *   --check validates the arguments and the question file and makes no request (exit 0, or 3).
 *
 * Keys are read from the environment variable named by --key-env / --key-env-a / --key-env-b,
 * never from an argument, so they appear in neither the shell history nor the record. With no
 * key variable the key is '' (a keyless local clm-serve).
 *
 * Exit 3 is a usage error.
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const USAGE_ERROR = 3;

function usage(message) {
  console.error(`systemOneLive: ${message}`);
  process.exit(USAGE_ERROR);
}

function parseArgs(argv) {
  const [mode, ...rest] = argv;
  const flags = { check: false };
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === '--check') {
      flags.check = true;
    } else if (arg.startsWith('--')) {
      const value = rest[++i];
      if (value === undefined || value.startsWith('--')) {
        usage(`${arg} needs a value`);
      }
      flags[arg.slice(2)] = value;
    } else {
      usage(`unexpected argument '${arg}'`);
    }
  }
  return { mode, flags };
}

function positiveInteger(name, value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    usage(`--${name} must be a positive integer, got '${value}'`);
  }
  return n;
}

function fraction(name, value) {
  const n = Number(value);
  if (value === undefined || !Number.isFinite(n) || n < 0 || n > 1) {
    usage(`--${name} is required and must be a number in [0, 1], got '${value}'`);
  }
  return n;
}

/**
 * A URL with its userinfo, query and fragment removed, for messages: a rejected value may carry
 * credentials or a token, and is never echoed whole.
 */
function redactedUrl(value) {
  try {
    const url = new URL(value);
    return `'${url.protocol}//${url.host}${url.pathname}' (userinfo, query and fragment removed)`;
  } catch {
    return 'a value that is not a URL';
  }
}

/**
 * Applies `createSystemOneClient`'s constraints — an absolute `http:` or `https:` URL with no
 * query, fragment or credentials — and returns the URL a live run would use: the SDK strips
 * trailing slashes, so they are stripped here too.
 */
function absoluteUrl(name, value) {
  if (value === undefined) {
    usage(`--${name} is required`);
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    usage(`--${name} must be an absolute http(s) URL; got ${redactedUrl(value)}`);
  }
  const valid =
    (url.protocol === 'http:' || url.protocol === 'https:') &&
    !value.includes('?') &&
    !value.includes('#') &&
    url.username === '' &&
    url.password === '';
  if (!valid) {
    usage(
      `--${name} must be an absolute http(s) URL with no query, fragment or credentials; got ${redactedUrl(
        value
      )}`
    );
  }
  return value.replace(/\/+$/, '');
}

/** A model id as the client sends it: trimmed, and required. */
function modelId(name, value) {
  const model = (value ?? '').trim();
  if (model === '') {
    usage(`--${name} needs a model id`);
  }
  return model;
}

function endpoint(name, value, keyEnv) {
  if (value === undefined) {
    usage(`--${name} <url,model> is required`);
  }
  const comma = value.lastIndexOf(',');
  if (comma <= 0 || comma === value.length - 1) {
    usage(`--${name} must be <url,model>`);
  }
  return {
    url: absoluteUrl(name, value.slice(0, comma)),
    model: modelId(name, value.slice(comma + 1)),
    keyEnv
  };
}

function keyFrom(keyEnv) {
  if (keyEnv === undefined) {
    return '';
  }
  const key = process.env[keyEnv];
  if (key === undefined) {
    usage(`environment variable ${keyEnv} (named by --key-env) is not set`);
  }
  return key;
}

const QUESTION_TYPES = ['noul', 'choice', 'score'];

/** Validates the parity question file: `{ "items": [{ "state": …, "questions": { id: Question } }] }`. */
function readQuestionFile(file) {
  if (file === undefined) {
    usage('--questions <file> is required');
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
  } catch (err) {
    usage(`cannot read --questions '${file}': ${err.message}`);
  }
  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    !Array.isArray(parsed.items) ||
    parsed.items.length === 0
  ) {
    usage(`--questions '${file}' must be { "items": [ ... ] } with at least one item`);
  }
  parsed.items.forEach((item, index) => {
    const where = `--questions item ${index}`;
    if (item === null || typeof item !== 'object' || !('state' in item)) {
      usage(`${where} needs a state`);
    }
    const ids = item.questions && typeof item.questions === 'object' ? Object.keys(item.questions) : [];
    if (ids.length === 0) {
      usage(`${where} needs at least one question`);
    }
    for (const id of ids) {
      const q = item.questions[id];
      if (q === null || typeof q !== 'object' || !QUESTION_TYPES.includes(q.type)) {
        usage(`${where} question '${id}' must have a type of ${QUESTION_TYPES.join(', ')}`);
      }
      if (
        q.type === 'choice' &&
        (q.criteria === null || typeof q.criteria !== 'object' || Array.isArray(q.criteria))
      ) {
        usage(`${where} question '${id}': choice criteria must be an object of labels`);
      }
      if (q.type === 'score' && (!Array.isArray(q.criteria) || q.criteria.length < 2)) {
        usage(`${where} question '${id}': score criteria must be a list of at least two levels`);
      }
    }
  });
  return parsed.items;
}

function loadPackage() {
  const lib = path.resolve(__dirname, '..', 'lib', 'index.js');
  if (!fs.existsSync(lib)) {
    usage(`no built lib at ${lib}; run 'rushx build' first`);
  }
  return require(lib);
}

/** The fixed probe question set: one of each type. */
function probeQuestions(pkg) {
  return {
    billing: pkg.noul('Is this message about billing?'),
    route: pkg.choice('Which team should handle it?', {
      billing: 'The billing team',
      technical: 'Technical support',
      other: 'Anyone else'
    }),
    urgency: pkg.score('How urgent is it?', ['Not urgent', 'Somewhat urgent', 'Very urgent'])
  };
}

const PROBE_STATE = 'I was charged twice for my subscription this month and need a refund before Friday.';

async function probe(pkg, target, maxChars) {
  const record = {
    date: new Date().toISOString(),
    url: target.url,
    model: target.model,
    keyEnv: target.keyEnv ?? null,
    node: process.version,
    host: { platform: process.platform, arch: process.arch },
    inputLimit: maxChars === undefined ? 'unchecked' : { maxChars }
  };
  const client = pkg.createSystemOneClient({
    baseUrl: target.url,
    model: target.model,
    apiKey: keyFrom(target.keyEnv)
  });
  if (client.isFailure()) {
    return { ...record, ok: false, reason: 'invalid-request', message: client.message };
  }
  const asked = await pkg.askSystemOne(client.value, {
    state: PROBE_STATE,
    questions: probeQuestions(pkg),
    inputLimit: maxChars === undefined ? 'unchecked' : { maxChars }
  });
  const models = await pkg.listSystemOneModels(client.value);
  const modelsRecord = models.isSuccess()
    ? { ok: true, models: models.value }
    : { ok: false, message: models.message };
  if (asked.isFailure()) {
    return { ...record, ok: false, reason: asked.detail, message: asked.message, listModels: modelsRecord };
  }
  return {
    ...record,
    ok: true,
    meta: asked.value.meta,
    result: asked.value.result,
    listModels: modelsRecord
  };
}

/** The top answer of one projected answer. */
function topOf(answer) {
  if (answer.type === 'noul') {
    return answer.noul >= 0.5 ? 'true' : 'false';
  }
  if (answer.type === 'choice') {
    return answer.choice;
  }
  const entries = Object.entries(answer.probabilities);
  return entries.reduce((best, entry) => (entry[1] > best[1] ? entry : best))[0];
}

/** The per-option probabilities of one projected answer. */
function distributionOf(answer) {
  return answer.type === 'noul' ? { true: answer.noul, false: 1 - answer.noul } : answer.probabilities;
}

async function parity(pkg, a, b, items, maxChars, thresholds) {
  const clients = [a, b].map((target) =>
    pkg.createSystemOneClient({ baseUrl: target.url, model: target.model, apiKey: keyFrom(target.keyEnv) })
  );
  for (const client of clients) {
    if (client.isFailure()) {
      return {
        exit: 2,
        report: { ok: false, refused: 'invalid client configuration', message: client.message }
      };
    }
  }
  const probes = [await probe(pkg, a, maxChars), await probe(pkg, b, maxChars)];
  if (probes.some((p) => !p.ok)) {
    return {
      exit: 2,
      report: { ok: false, refused: 'a probe failed: refused, not a parity result', probes }
    };
  }
  let questions = 0;
  let agreed = 0;
  let diffCount = 0;
  let diffSum = 0;
  let diffMax = 0;
  const failures = [];
  for (const [index, item] of items.entries()) {
    const request = { state: item.state, questions: item.questions, inputLimit: { maxChars } };
    const [ra, rb] = [
      await pkg.askSystemOne(clients[0].value, request),
      await pkg.askSystemOne(clients[1].value, request)
    ];
    if (ra.isFailure() || rb.isFailure()) {
      failures.push({
        item: index,
        a: ra.isFailure() ? ra.message : 'ok',
        b: rb.isFailure() ? rb.message : 'ok'
      });
      continue;
    }
    for (const id of Object.keys(item.questions)) {
      const [x, y] = [ra.value.result.answers[id], rb.value.result.answers[id]];
      questions++;
      if (topOf(x) === topOf(y)) {
        agreed++;
      }
      const [dx, dy] = [distributionOf(x), distributionOf(y)];
      for (const option of Object.keys(dx)) {
        const diff = Math.abs(dx[option] - dy[option]);
        diffSum += diff;
        diffCount++;
        diffMax = Math.max(diffMax, diff);
      }
    }
  }
  if (failures.length > 0) {
    return { exit: 2, report: { ok: false, refused: 'an item failed on one endpoint', failures, probes } };
  }
  const topAgreement = agreed / questions;
  const meanAbsDiff = diffSum / diffCount;
  const pass = topAgreement >= thresholds.minTopAgreement && meanAbsDiff <= thresholds.maxMeanAbsDiff;
  return {
    exit: pass ? 0 : 1,
    report: { ok: pass, thresholds, questions, topAgreement, meanAbsDiff, maxAbsDiff: diffMax, probes }
  };
}

async function main() {
  const { mode, flags } = parseArgs(process.argv.slice(2));
  if (mode === 'probe') {
    const target = {
      url: absoluteUrl('url', flags.url),
      model: modelId('model', flags.model),
      keyEnv: flags['key-env']
    };
    const maxChars =
      flags['max-chars'] === undefined ? undefined : positiveInteger('max-chars', flags['max-chars']);
    if (flags.check) {
      console.log(JSON.stringify({ check: 'ok', mode, target, maxChars: maxChars ?? 'unchecked' }));
      return 0;
    }
    const record = await probe(loadPackage(), target, maxChars);
    console.log(JSON.stringify(record, undefined, 2));
    return record.ok ? 0 : 2;
  }
  if (mode === 'parity') {
    // The thresholds come first, before anything else is validated or run.
    const thresholds = {
      minTopAgreement: fraction('min-top-agreement', flags['min-top-agreement']),
      maxMeanAbsDiff: fraction('max-mean-abs-diff', flags['max-mean-abs-diff'])
    };
    console.log(JSON.stringify({ thresholds }));
    const a = endpoint('a', flags.a, flags['key-env-a']);
    const b = endpoint('b', flags.b, flags['key-env-b']);
    if (flags['max-chars'] === undefined) {
      usage('--max-chars is required for parity, so that truncation is not what is measured');
    }
    const maxChars = positiveInteger('max-chars', flags['max-chars']);
    const items = readQuestionFile(flags.questions);
    if (flags.check) {
      console.log(JSON.stringify({ check: 'ok', mode, a, b, maxChars, items: items.length }));
      return 0;
    }
    const { exit, report } = await parity(loadPackage(), a, b, items, maxChars, thresholds);
    console.log(JSON.stringify(report, undefined, 2));
    return exit;
  }
  return usage(`the mode must be probe or parity, got '${mode}'`);
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (err) => {
    console.error(err);
    process.exitCode = 1;
  }
);
