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
 *   probe   one askSystemOne with a fixed noul + choice + score question set, then
 *           listSystemOneModels, then one ask with a model id that cannot exist (L1 / OQ-6: the
 *           record keeps its classified reason and status, nothing the server sent, and expects
 *           invalid-request; it is an observation and never fails the probe). Prints the § 6
 *           record as JSON. Exit 0 when the ask and the listing both succeed; 2 when either fails,
 *           with `failedStep`, `reason` and `message`. When both fail, the ask's failure is the
 *           one reported; the listing's stays in `listModels`.
 *   parity  refuses to start unless both thresholds are given, and prints them first. Probes both
 *           endpoints and exits 2 if either probe fails ("refused, not a parity result"). Asks
 *           every item of the question file of both, each bounded by --max-chars so truncation is
 *           not what is measured, and reports top-answer agreement and the mean and maximum
 *           per-option absolute difference. Exit 0 (pass) or 1 (fail).
 *   --check validates the arguments and the question file and makes no request (exit 0, or 3).
 *           Each mode accepts only its own flags: an unknown or repeated flag is refused (exit 3)
 *           before any output or request, and the message names the flag, never its value. In the
 *           question file, a noul's criteria, when given, are `true` and/or `false` descriptions.
 *
 * Keys are read from the environment variable named by --key-env / --key-env-a / --key-env-b,
 * never from an argument, so they appear in neither the shell history nor the record. With no
 * key variable the key is '' (a keyless local clm-serve).
 *
 * Exit 3 is a usage error.
 */

/* eslint-disable no-console */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const USAGE_ERROR = 3;

function usage(message) {
  console.error(`systemOneLive: ${message}`);
  process.exit(USAGE_ERROR);
}

/** The flags each mode accepts, besides `--check`. Anything else is refused before any work. */
const MODE_FLAGS = {
  probe: ['url', 'model', 'key-env', 'max-chars'],
  parity: [
    'a',
    'b',
    'questions',
    'max-chars',
    'min-top-agreement',
    'max-mean-abs-diff',
    'key-env-a',
    'key-env-b'
  ]
};

/**
 * Parses the mode and its flags. An unknown mode, an unknown or repeated flag, or a stray argument
 * is a usage error, raised before any output or request; the message names the flag, never a
 * value, since a value may be a URL with credentials.
 */
function parseArgs(argv) {
  const [mode, ...rest] = argv;
  if (!Object.keys(MODE_FLAGS).includes(mode)) {
    usage(`the mode must be ${Object.keys(MODE_FLAGS).join(' or ')}`);
  }
  const allowed = MODE_FLAGS[mode];
  const flags = { check: false };
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === '--check') {
      if (flags.check) {
        usage('--check is given more than once');
      }
      flags.check = true;
    } else if (arg.startsWith('--')) {
      const name = arg.slice(2);
      if (!allowed.includes(name)) {
        usage(`unknown option ${arg} for ${mode}; it accepts --${allowed.join(', --')} and --check`);
      }
      if (name in flags) {
        usage(`${arg} is given more than once`);
      }
      const value = rest[++i];
      if (value === undefined || value.startsWith('--')) {
        usage(`${arg} needs a value`);
      }
      flags[name] = value;
    } else {
      usage(`unexpected argument at position ${i + 2}; every value follows its --option`);
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
 * whitespace, query, fragment or credentials — and returns the URL a live run would use: the SDK strips
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
    !/\s/.test(value) &&
    !value.includes('?') &&
    !value.includes('#') &&
    url.username === '' &&
    url.password === '';
  if (!valid) {
    usage(
      `--${name} must be an absolute http(s) URL with no whitespace, query, fragment or credentials; got ${redactedUrl(
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

/**
 * The SDK's `EntryType`, as `askSystemOne` checks it: text, a JSON object or array, or `null`, not
 * a bare number or boolean, and with no own `__proto__` key at any depth. The file is parsed JSON,
 * so everything inside is already JSON.
 */
function isEntry(value) {
  return isTopLevelEntry(value) && !hasReservedKey(value);
}

/**
 * Whether a parsed JSON value holds an own `__proto__` key at any depth, which `askSystemOne`
 * refuses: the JSON copy it sends would turn the key into a prototype and drop it.
 */
function hasReservedKey(value) {
  if (Array.isArray(value)) {
    return value.some(hasReservedKey);
  }
  if (value === null || typeof value !== 'object') {
    return false;
  }
  return (
    Object.prototype.hasOwnProperty.call(value, '__proto__') || Object.values(value).some(hasReservedKey)
  );
}

/** The top level of an `EntryType`. */
function isTopLevelEntry(value) {
  return value === null || typeof value === 'string' || typeof value === 'object';
}

/**
 * A `noul` question's optional criteria, as the SDK and `askSystemOne` accept them: absent, `null`,
 * or an object whose only keys are `true` and/or `false`, each an `EntryType` (text, a JSON object
 * or array, or `null`).
 */
function isNoulCriteria(criteria) {
  if (criteria === undefined || criteria === null) {
    return true;
  }
  if (typeof criteria !== 'object' || Array.isArray(criteria)) {
    return false;
  }
  return Object.keys(criteria).every((key) => (key === 'true' || key === 'false') && isEntry(criteria[key]));
}

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
    if (!isEntry(item.state)) {
      usage(`${where}: the state must be text, a JSON object or array, or null`);
    }
    if (item.questions === null || typeof item.questions !== 'object' || Array.isArray(item.questions)) {
      usage(`${where} needs questions as an object of named questions, not a list`);
    }
    if (Object.prototype.hasOwnProperty.call(item.questions, '__proto__')) {
      usage(`${where}: '__proto__' is a reserved key and cannot be a question id`);
    }
    const ids = Object.keys(item.questions);
    if (ids.length === 0) {
      usage(`${where} needs at least one question`);
    }
    for (const id of ids) {
      const q = item.questions[id];
      if (q === null || typeof q !== 'object' || !QUESTION_TYPES.includes(q.type)) {
        usage(`${where} question '${id}' must have a type of ${QUESTION_TYPES.join(', ')}`);
      }
      if (q.instructions !== undefined && !isEntry(q.instructions)) {
        usage(`${where} question '${id}': instructions must be text, a JSON object or array, or null`);
      }
      if (
        q.type === 'choice' &&
        (q.criteria === null || typeof q.criteria !== 'object' || Array.isArray(q.criteria))
      ) {
        usage(`${where} question '${id}': choice criteria must be an object of labels`);
      }
      if (
        q.type === 'choice' &&
        (Object.prototype.hasOwnProperty.call(q.criteria, '__proto__') ||
          !Object.values(q.criteria).every(isEntry))
      ) {
        usage(
          `${where} question '${id}': each choice description must be text, a JSON object or array, ` +
            "or null, and '__proto__' cannot be a label"
        );
      }
      if (q.type === 'score' && (!Array.isArray(q.criteria) || q.criteria.length < 2)) {
        usage(`${where} question '${id}': score criteria must be a list of at least two levels`);
      }
      if (q.type === 'score' && !q.criteria.every(isEntry)) {
        usage(`${where} question '${id}': each score level must be text, a JSON object or array, or null`);
      }
      if (q.type === 'noul' && !isNoulCriteria(q.criteria)) {
        usage(
          `${where} question '${id}': noul criteria, when given, must be an object whose keys are ` +
            "'true' and/or 'false', each text, a JSON object or array, or null"
        );
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
  const pkg = require(lib);
  REASONS = [...pkg.allSystemOneFailureReasons];
  return pkg;
}

/** The package's failure reasons, filled in by `loadPackage`. */
let REASONS = [];

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
  const listModels = models.isSuccess()
    ? { ok: true, models: models.value }
    : { ok: false, reason: reasonOf(models.message), message: models.message };
  const unknownModel = await probeUnknownModel(pkg, target);
  // Both steps are evidence the record must hold. When both fail, the ask's failure is the one
  // reported, since it is the round trip L1 exists to establish; the listing's stays in `listModels`.
  if (asked.isFailure()) {
    return {
      ...record,
      ok: false,
      failedStep: 'askSystemOne',
      reason: asked.detail,
      message: asked.message,
      listModels,
      unknownModel
    };
  }
  if (!listModels.ok) {
    return {
      ...record,
      ok: false,
      failedStep: 'listSystemOneModels',
      reason: listModels.reason,
      message: listModels.message,
      meta: asked.value.meta,
      listModels,
      unknownModel
    };
  }
  return {
    ...record,
    ok: true,
    meta: asked.value.meta,
    result: asked.value.result,
    listModels,
    unknownModel
  };
}

/**
 * The classified reason at the head of one of the package's failure messages, which it composes as
 * `<reason>[ (status N)][ (request R)]: …`. `undefined` when the message has no known reason.
 */
function reasonOf(message) {
  const head = /^([a-z-]+)[ :]/.exec(message);
  return head !== null && REASONS.includes(head[1]) ? head[1] : undefined;
}

/** The HTTP status in one of the package's failure messages, which it composes as `(status N)`. */
function statusOf(message) {
  const status = /^[a-z-]+ \(status (\d{3})\)/.exec(message);
  return status === null ? undefined : Number(status[1]);
}

/** A model id no server can have: a fixed prefix and a random suffix. */
function unknownModelId() {
  return `fgv-probe-unknown-model-${crypto.randomBytes(6).toString('hex')}`;
}

/**
 * Asks once with a model id that cannot exist and records how the server refuses it (L1, OQ-6):
 * the classified reason and the status, and nothing the server sent back. The expected outcome is
 * `invalid-request`. It is an observation, so it never fails the probe; a success is recorded as
 * surprising.
 * @remarks
 * The package's `DetailedResult` carries the reason as its detail but does not expose the HTTP
 * status as a field, so the status is read from the `(status N)` segment the package itself
 * composes in the message. The rest of the message is not recorded.
 */
async function probeUnknownModel(pkg, target) {
  const model = unknownModelId();
  const client = pkg.createSystemOneClient({ baseUrl: target.url, model, apiKey: keyFrom(target.keyEnv) });
  if (client.isFailure()) {
    return { model, outcome: 'not-asked', reason: 'invalid-request' };
  }
  const asked = await pkg.askSystemOne(client.value, {
    state: PROBE_STATE,
    questions: { billing: pkg.noul('Is this message about billing?') },
    inputLimit: 'unchecked'
  });
  if (asked.isSuccess()) {
    return { model, outcome: 'accepted (surprising: a server answered for a model id that cannot exist)' };
  }
  const status = statusOf(asked.message);
  return {
    model,
    outcome:
      asked.detail === 'invalid-request' ? 'refused as expected' : 'refused, with an unexpected reason',
    reason: asked.detail,
    ...(status !== undefined ? { status } : {})
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
  return usage('the mode must be probe or parity');
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
