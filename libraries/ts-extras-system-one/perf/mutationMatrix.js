/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 *
 * Revert matrix for @fgv/ts-extras-system-one (implementation plan § 5.2), modelled on
 * `libraries/ts-agent-tasks/perf/mutationMatrix.js`.
 *
 * Deliberately NOT a jest test. Each row neuters one protection, rebuilds, runs the suite, records
 * which tests went red, and restores the file. It edits source in place, so it refuses to run
 * against this package's own directory: give it a copy.
 *
 *   node perf/mutationMatrix.js --check [R1 R2 ...]
 *   node perf/mutationMatrix.js --pkg <copy> [--out <file.json>] [R1 R2 ...]
 *
 *   --check   only confirm every pattern occurs exactly once in this package's source; no builds
 *   --pkg     REQUIRED for a run: a real copy of this package (with a `node_modules` symlink to
 *             this package's), which the run mutates. It refuses this package's own directory, a
 *             copy whose `src` is a symlink, and a copy whose mutated files are hard links to this
 *             package's: each would mutate this package in place
 *   --out     write the results as JSON
 *   R…        run only the named rows
 *
 * The rules:
 * - a row whose pattern is not found exactly once, whose mutant does not build, or whose run
 *   reports no failure count, is UNVERIFIED, never "nothing went red";
 * - a row that builds and leaves every test green is `0 red`, and is a finding;
 * - each row names the tests that must go red, and is VERIFIED only if one of them is among the
 *   red. "Something went red" is not enough: a row once went green for the wrong protection.
 *
 * When a refactor moves a protected line, re-point its row here; `--check` lists stale rows.
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const CLIENT = 'src/client.ts';
const CLASSIFY = 'src/classify.ts';
const MEASURE = 'src/measure.ts';
const VALIDATE = 'src/validate.ts';
const LOGGING = 'src/logging.ts';
const SHAPES = 'src/shapes.ts';

function m(name, mustGoRed, file, from, to) {
  return { name, mustGoRed, edits: [{ file, from, to }] };
}

/**
 * A row for a guard that another layer deliberately backs up: reverting it alone is masked by
 * construction, so the row reverts the guard and its backstops together.
 */
function paired(name, mustGoRed, edits) {
  return { name, mustGoRed, edits };
}

const HARNESS = 'perf/systemOneLive.js';

/**
 * A row for the live harness, which the jest suite does not cover: the run builds the package
 * from its unmutated source, then runs `perf/systemOneLive.selftest.js`, whose failures print in
 * jest's `● <id> …` / `Failures: N` shape.
 */
function harness(name, mustGoRed, from, to) {
  return { name, mustGoRed, edits: [{ file: HARNESS, from, to }], suite: 'selftest' };
}

const MUTATIONS = [
  m(
    'R1 the bound runs after the SDK call',
    ['U1'],
    CLIENT,
    '  return checkRequest(request)\n',
    '  await bindings\n    .get(client)\n    ?.sdk.systemOne({ state: request.state, questions: request.questions })\n    .withResponse()\n    .catch(() => undefined);\n  return checkRequest(request)\n'
  ),
  m(
    'R2 >= instead of >',
    ['U2'],
    MEASURE,
    'question.stateAndInstructions > maxChars',
    'question.stateAndInstructions >= maxChars'
  ),
  m(
    'R3 the separator is not counted',
    ['U3'],
    MEASURE,
    'stateLength + separatorLength + lengthOf(',
    'stateLength + lengthOf('
  ),
  m(
    'R4 the instructions are not counted',
    ['U3'],
    MEASURE,
    'stateLength + separatorLength + lengthOf(questions[questionId].instructions)',
    'stateLength + separatorLength'
  ),
  m(
    'R5 the criteria are not bounded',
    ['U4'],
    MEASURE,
    'for (const criterion of question.criteria) {',
    'for (const criterion of question.criteria.slice(0, 0)) {'
  ),
  m(
    "R5b noul's default candidate is not measured",
    ['U4'],
    MEASURE,
    '? noulDefaults[key].length + instructions',
    '? 0'
  ),
  m(
    'R6 a structured state is measured as String(state)',
    ['U5'],
    MEASURE,
    'JSON.stringify(value).length',
    'String(value).length'
  ),
  m(
    'R7 the refusal names the first question',
    ['U6'],
    MEASURE,
    "        questionId: question.questionId,\n        part: 'state+instructions',",
    "        questionId: measure.questions[0].questionId,\n        part: 'state+instructions',"
  ),
  m(
    "R8 'unchecked' is treated as maxChars: 0",
    ['U7'],
    MEASURE,
    "limit === 'unchecked' ? succeedWithDetail(undefined) : bound(state, questions, limit.maxChars)",
    "bound(state, questions, limit === 'unchecked' ? 0 : limit.maxChars)"
  ),
  m(
    "R9 the SDK's synchronous throw is not captured",
    ['U10'],
    CLIENT,
    '  return captureResult(() =>\n    binding.sdk',
    '  return succeed(\n    binding.sdk'
  ),
  m(
    'R10 connection is tested before timeout',
    ['U14'],
    CLASSIFY,
    "  if (err instanceof APITimeoutError) {\n    return 'timeout';\n  }\n  if (err instanceof APIConnectionError) {\n    return 'connection';\n  }",
    "  if (err instanceof APIConnectionError) {\n    return 'connection';\n  }\n  if (err instanceof APITimeoutError) {\n    return 'timeout';\n  }"
  ),
  m(
    'R11 abort is not classified',
    ['U15'],
    CLASSIFY,
    "  if (err instanceof APIUserAbortError) {\n    return 'aborted';\n  }\n",
    ''
  ),
  m(
    'R12 other 4xx fall through to server',
    ['U12'],
    CLASSIFY,
    "  if (status >= 400 && status < 500) {\n    return 'invalid-request';",
    "  if (status >= 400 && status < 500) {\n    return 'server';"
  ),
  m(
    'R13 401/403 are invalid-request',
    ['U11'],
    CLASSIFY,
    "  if (status === 401 || status === 403) {\n    return 'unauthorized';",
    "  if (status === 401 || status === 403) {\n    return 'invalid-request';"
  ),
  m('R14 408 is not timeout', ['U11'], CLASSIFY, "  if (status === 408) {\n    return 'timeout';\n  }\n", ''),
  m(
    'R15 only "every question answered" is checked',
    ['U16a'],
    VALIDATE,
    'questionIds.length === answerIds.size && ',
    ''
  ),
  m(
    'R16 no answer-id check at all',
    ['U16b'],
    VALIDATE,
    'return questionIds.length === answerIds.size && questionIds.every((id) => answerIds.has(id));',
    'return answerIds.size >= 0;'
  ),
  m(
    'R17 no answer-type check',
    ['U16c'],
    VALIDATE,
    "if (received.type === 'noul' && question.type === 'noul') {",
    "if (received.type === 'noul') {"
  ),
  m(
    'R18 key sets compared by count',
    ['U16d'],
    VALIDATE,
    'return actual.length === expected.length && actual.every((key) => expectedSet.has(key));',
    'return actual.length === expected.length && expectedSet.size >= 0;'
  ),
  m(
    'R19 the choice need not be a label',
    ['U16e'],
    VALIDATE,
    'labels.includes(choice.choice)\n',
    'labels.length >= 0\n'
  ),
  m('R20 the score may reach n', ['U16f'], VALIDATE, 'score.score <= top', 'score.score <= top + 1'),
  m(
    'R21 no upper bound on a probability',
    ['U16g'],
    VALIDATE,
    'return value >= 0 && value <= 1;',
    'return value >= 0;'
  ),
  m(
    'R22 non-finite values accepted (usage counts; a probability’s finiteness is its [0, 1] range, which R21 covers)',
    ['U16h'],
    VALIDATE,
    'return Number.isFinite(value) && value >= 0;\n}',
    'return value >= 0;\n}'
  ),
  m(
    'R23 no sum check',
    ['U16i'],
    VALIDATE,
    'if (Math.abs(sum - 1) > sumTolerance + sumRoundingAllowance) {',
    'if (Number.isNaN(sum)) {'
  ),
  m(
    'R24 a non-object body is not converted',
    ['U17'],
    VALIDATE,
    '  return safeConvert(body, data)\n',
    '  return succeed(data as IReceivedBody)\n'
  ),
  m(
    "R25 the server's choice answer is passed through",
    ['U18'],
    VALIDATE,
    '  choice: choiceAnswer,',
    '  choice: Converters.generic((from: unknown) =>\n    choiceAnswer.convert(from).onSuccess(() => succeed(from as ProjectedChoice))\n  ),'
  ),
  paired(
    'R26 model is in neither the request nor defaultModel',
    ['U21'],
    [
      {
        file: CLIENT,
        from: '.systemOne({ state, questions, model: binding.model }',
        to: '.systemOne({ state, questions }'
      },
      { file: CLIENT, from: '        defaultModel: model,\n', to: '' }
    ]
  ),
  m('R27 baseURL is not passed', ['U22'], CLIENT, '        baseURL,\n', ''),
  m(
    'R28 an ILogger at all maps to debug',
    ['U23'],
    LOGGING,
    "      // all, detail, info\n      return 'info';",
    "      return 'debug';"
  ),
  paired(
    'R29 no logger: neither the no-op sink nor the off level (each masks the other)',
    ['U23'],
    [
      {
        file: LOGGING,
        from: "return { logLevel: 'off', logger: noOpSink };",
        to: 'return { logLevel: undefined, logger: undefined } as unknown as ISdkLogging;'
      }
    ]
  ),
  m(
    'R30 requestId read from the body',
    ['U20'],
    CLIENT,
    'requestId: received.requestId,',
    'requestId: undefined,'
  ),
  m(
    'R31 server-timing parsed to a number',
    ['U20'],
    CLIENT,
    "{ 'server-timing': serverTiming }",
    "{ 'server-timing': String(Number.parseFloat(serverTiming)) }"
  ),
  m(
    'R32 elapsedMs does not cover retries',
    ['U20'],
    CLIENT,
    'answerFrom<Q>(questions, received, Date.now() - started)',
    'answerFrom<Q>(questions, received, Date.now() - Date.now())'
  ),
  m(
    'R33 the models shape error is invalid-request',
    ['U19'],
    CLIENT,
    "                err,\n                'invalid-response',\n                response.status,",
    "                err,\n                'invalid-request',\n                response.status,"
  ),
  m(
    'R34 measureSystemOneInput does not check the state, so an unserializable one throws',
    ['U28', 'U30', 'U31'],
    SHAPES,
    '  return safeConvert(entry, state)\n',
    '  return succeed(state as EntryType)\n'
  ),
  m(
    "R35 an APIError's body-derived message reaches the failure message",
    ['U23'],
    CLASSIFY,
    'failureMessage(reason, err.name, err.status, err.requestId)',
    'failureMessage(reason, err.message, err.status, err.requestId)'
  ),
  m(
    "R36 a 2xx body that is not a response is quoted by the converter's message",
    ['U23'],
    VALIDATE,
    '.withErrorFormat(() => describeUnconvertible(questions, data))',
    '.withErrorFormat((message) => `${message}; ${describeUnconvertible(questions, data)}`)'
  ),
  m(
    'R37 a rejected choice is quoted',
    ['U23'],
    VALIDATE,
    "fail(`${id}: the choice is not one of [${labels.join(', ')}]`)",
    "fail(`${id}: the choice '${choice.choice}' is not one of [${labels.join(', ')}]`)"
  ),
  m(
    'R38 a rejected baseUrl is echoed, credentials included',
    ['U24'],
    CLIENT,
    "'invalid-request: baseUrl must be an absolute http(s) URL with no whitespace, query, fragment or credentials';",
    "`invalid-request: baseUrl must be an absolute http(s) URL with no whitespace, query, fragment or credentials, got '${baseUrl}'`;"
  ),
  m(
    'R39 a rejected noul quotes the received value',
    ['U16g'],
    VALIDATE,
    'fail(`${id}: noul is not a number in [0, 1]`)',
    'fail(`${id}: noul ${noul.noul} is not a number in [0, 1]`)'
  ),
  m(
    'R39b a rejected score quotes the received value',
    ['U16f'],
    VALIDATE,
    'fail(`${id}: score is not in [0, ${top}]`)',
    'fail(`${id}: score ${score.score} is not in [0, ${top}]`)'
  ),
  m(
    'R39c a rejected sum quotes the received value',
    ['U16i'],
    VALIDATE,
    'fail(`${id}: probabilities do not sum to 1 within ${sumTolerance}`)',
    'fail(`${id}: probabilities sum to ${sum}, not 1 within ${sumTolerance}`)'
  ),
  m(
    'R40 no rounding allowance on the sum tolerance',
    ['U16i'],
    VALIDATE,
    'if (Math.abs(sum - 1) > sumTolerance + sumRoundingAllowance) {',
    'if (Math.abs(sum - 1) > sumTolerance) {'
  ),
  m(
    'R41 createSystemOneClient reads its parameters unconverted',
    ['U28'],
    CLIENT,
    'return checkClientParams(params).onSuccess((checked) => clientFrom(checked));',
    'return clientFrom(params);'
  ),
  m(
    "R42 the questions are not checked before the input limit, so 'unchecked' mode sends a malformed question",
    ['U27b'],
    SHAPES,
    'checkQuestions(record.questions).onSuccess((questions) =>',
    'succeed(record.questions as Questions).onSuccess((questions) =>'
  ),
  m(
    'R43 a malformed model list is quoted',
    ['U19'],
    CLIENT,
    'describeModelList(received.data),',
    'JSON.stringify(received.data),'
  ),
  m('R44 a base URL with whitespace is accepted', ['U24'], CLIENT, '      !/\\s/.test(baseUrl) &&\n', ''),
  m(
    'R45 askSystemOne reads its request unchecked',
    ['U29'],
    CLIENT,
    '  return checkRequest(request)\n',
    '  return succeed<ICheckedRequest>(request)\n'
  ),
  m(
    'R46 measureSystemOneInput measures questions of the wrong shape',
    ['U28'],
    MEASURE,
    'return checkInput(state, questions).onSuccess(',
    'return succeed({ state, questions }).onSuccess('
  ),
  m(
    'R47 a conversion that throws is not caught',
    ['U30', 'U34'],
    SHAPES,
    'return captureResult(() => converter.convert(from)).onSuccess((result) => result);',
    'return converter.convert(from);'
  ),
  m(
    "R48 the request's top level is converted unguarded, so a bigint request throws",
    ['U30'],
    SHAPES,
    'return safeConvert(callerRecord, request)',
    'return callerRecord.convert(request)'
  ),
  m(
    "R49 the client parameters' top level is converted unguarded",
    ['U30'],
    SHAPES,
    'return safeConvert(callerRecord, params)',
    'return callerRecord.convert(params)'
  ),
  m(
    'R50 a body field is described unguarded, so a circular or bigint field throws',
    ['U34'],
    SHAPES,
    'safeConvert(fields[field], record[field])',
    'fields[field].convert(record[field])'
  ),
  m(
    'R51 a question is converted unguarded, so a circular question throws',
    ['U30'],
    SHAPES,
    '.onSuccess((snapshot) => safeConvert(question, snapshot))',
    '.onSuccess((snapshot) => question.convert(snapshot))'
  ),
  m(
    'R52 the input limit is converted unguarded, so a circular limit throws',
    ['U30'],
    MEASURE,
    'safeConvert(inputLimitShape, inputLimit)',
    'inputLimitShape.convert(inputLimit)'
  ),
  m(
    'R53 the body is converted unguarded',
    ['U34'],
    VALIDATE,
    'safeConvert(body, data)',
    'body.convert(data)'
  ),
  m(
    'R54 an unconvertible body is described unguarded',
    ['U34'],
    VALIDATE,
    'safeConvert(jsonRecord, data)',
    'jsonRecord.convert(data)'
  ),
  m(
    'R55 the answer set is described unguarded',
    ['U34'],
    VALIDATE,
    'safeConvert(jsonRecord, answers)',
    'jsonRecord.convert(answers)'
  ),
  m(
    'R56 each answer is described unguarded',
    ['U34'],
    VALIDATE,
    'safeConvert(answer, record[id])',
    'answer.convert(record[id])'
  ),
  m(
    'R57 each model card is described unguarded',
    ['U34'],
    VALIDATE,
    'safeConvert(modelCard, entry)',
    'modelCard.convert(entry)'
  ),
  m(
    'R58 an EntryType is not checked as JSON',
    ['U31'],
    SHAPES,
    '.onSuccess((snapshot) => JsonConverters.jsonValue.convert(snapshot))',
    '.onSuccess((snapshot) => succeed(snapshot as EntryType))'
  ),
  m(
    'R59 a bare number or boolean is accepted as an EntryType',
    ['U31'],
    SHAPES,
    "fail('not text, a JSON object or array, or null')",
    'succeed(value as unknown as EntryType)'
  ),
  m(
    'R60 a received or request record may carry an own __proto__ key',
    ['U33'],
    SHAPES,
    'reserved ? fail(\'"__proto__" is a reserved key\')',
    'reserved === undefined ? fail(\'"__proto__" is a reserved key\')'
  ),
  m(
    'R61 a __proto__ question id is not named as reserved',
    ['U33'],
    SHAPES,
    "          ? fail('invalid-request: [__proto__] is a reserved key and cannot be a question id')",
    '          ? fail(questionsShape)'
  ),
  m(
    'R62 a reserved answer id is not counted',
    ['U33'],
    VALIDATE,
    'const reserved = reservedKeyIn(answers).orDefault(false) ? 1 : 0;',
    'const reserved = 0;'
  ),
  m(
    "R63 a request's fields are converted unguarded, so a circular field throws",
    ['U30'],
    SHAPES,
    'return safeConvert(converter, from).withErrorFormat(() => name);',
    'return converter.convert(from).withErrorFormat(() => name);'
  ),
  m(
    "R64 createSystemOneClient builds the client from the caller's parameters after the gate",
    ['U35'],
    CLIENT,
    '.onSuccess((checked) => clientFrom(checked));',
    '.onSuccess(() => clientFrom(params));'
  ),
  m(
    "R65 askSystemOne bounds the caller's request rather than the converted one",
    ['U35'],
    CLIENT,
    'checkInputLimit(checked.state, checked.questions, checked.inputLimit)',
    'checkInputLimit(request.state, request.questions, request.inputLimit)'
  ),
  m(
    "R66 askSystemOne sends the caller's request rather than the converted one",
    ['U35'],
    CLIENT,
    '.onSuccess((binding) => startCall(binding, checked))',
    '.onSuccess((binding) => startCall(binding, request))'
  ),
  m(
    "R67 the answers are validated against the caller's questions rather than those sent",
    ['U35'],
    CLIENT,
    'answerFrom<Q>(questions, received, Date.now() - started)',
    'answerFrom<Q>(request.questions, received, Date.now() - started)'
  ),
  m(
    "R68 measureSystemOneInput measures the caller's input rather than the converted one",
    ['U35'],
    MEASURE,
    'succeed(measureChecked(checked.state, checked.questions))',
    'succeed(measureChecked(state, questions))'
  ),
  m(
    "R69 a question is converted from the caller's object, so its type is read twice",
    ['U35'],
    SHAPES,
    '.onSuccess((snapshot) => safeConvert(question, snapshot))',
    '.onSuccess(() => safeConvert(question, from))'
  ),
  m(
    "R70 the input limit is a oneOf, whose failed alternative reads the caller's object first",
    ['U35'],
    MEASURE,
    "from === 'unchecked' ? succeed('unchecked') : maxCharsShape.convert(from)",
    "Converters.oneOf<SystemOneInputLimit>([Converters.literal('unchecked'), maxCharsShape]).convert(from)"
  ),
  m(
    "R71 a noul's criteria are a oneOf, whose failed alternative reads the caller's object first",
    ['U35'],
    SHAPES,
    '(from === null ? succeed(null) : noulOutcomes.convert(from))',
    'Converters.oneOf<NoulCriteria>([Converters.literal(null), noulOutcomes]).convert(from)'
  ),
  m(
    "R72 the logger's methods are not bound to the caller's logger",
    ['U23', 'U35'],
    SHAPES,
    'info: fields.info.bind(from),',
    'info: fields.info,'
  ),
  m(
    "R73 retry overrides are passed through, so the SDK reads the caller's object",
    ['U35'],
    SHAPES,
    "retry: () => named('retry', retryShape.optional(), record.retry),",
    'retry: () => succeed(record.retry as Partial<RetryPolicy> | undefined),'
  ),
  m(
    'R74 the reserved-key probe is not guarded, so a throwing Proxy trap throws',
    ['U36'],
    SHAPES,
    "  return captureResult(\n    () => typeof from === 'object'",
    "  return succeed(\n    typeof from === 'object'"
  ),
  m(
    'R75 any string is accepted as a logger level',
    ['U37'],
    SHAPES,
    'logLevel: Logging.reporterLogLevel,',
    'logLevel: Converters.string as unknown as Converter<Logging.ReporterLogLevel>,'
  ),
  m(
    'R76 a nested __proto__ in a JSON entry is not refused',
    ['U38'],
    SHAPES,
    "entries.some(([key]) => key === '__proto__')",
    "entries.some(([key]) => key === 'never')"
  ),
  m(
    'R77 the reserved-key walk does not descend into arrays',
    ['U38'],
    SHAPES,
    '    return mapResults(from.map(withoutReservedKeys));\n',
    '    return succeed(from);\n'
  ),
  m(
    'R78 the reserved-key walk does not descend into objects',
    ['U38'],
    SHAPES,
    'withoutReservedKeys(value).onSuccess(',
    'succeed(value).onSuccess('
  ),
  m(
    'R80 a non-finite number in a JSON entry is not refused',
    ['U39'],
    SHAPES,
    "  if (typeof from === 'number' && !Number.isFinite(from)) {",
    "  if (typeof from === 'number' && Number.isFinite(from) && !Number.isFinite(from)) {"
  ),
  m(
    'R81 an error that throws when inspected is classified unguarded',
    ['U40'],
    CLASSIFY,
    '  return captureResult(() => classifyReadableError(err, baseErrorReason, status, requestId)).orDefaultWith(',
    '  return captureResult(() => classifyReadableError(err, baseErrorReason, status, requestId)).orThrow() &&\n    captureResult(() => classifyReadableError(err, baseErrorReason, status, requestId)).orDefaultWith('
  ),
  m(
    "R79 the JSON converter reads the caller's value again rather than the walk's snapshot",
    ['U35'],
    SHAPES,
    '.onSuccess((snapshot) => JsonConverters.jsonValue.convert(snapshot))',
    '.onSuccess(() => JsonConverters.jsonValue.convert(from))'
  ),
  harness(
    'H1 an unknown option is accepted',
    ['S1'],
    'if (!allowed.includes(name)) {',
    'if (allowed.length < 0 && !allowed.includes(name)) {'
  ),
  harness(
    "H2 a noul's criteria are not checked",
    ['S2'],
    "if (q.type === 'noul' && !isNoulCriteria(q.criteria)) {",
    "if (q.type === 'noul' && !isNoulCriteria(undefined)) {"
  ),
  harness(
    'H3 the unknown-model probe records no status',
    ['S3'],
    'const status = statusOf(asked.message);',
    'const status = undefined;'
  ),
  harness(
    'H4 a model-listing failure does not fail the probe',
    ['S4'],
    'if (!listModels.ok) {',
    "if (listModels.ok === 'never') {"
  ),
  harness('H5 a URL with whitespace is accepted', ['S5'], '    !/\\s/.test(value) &&\n', ''),
  harness(
    'H6 --check may be given twice',
    ['S6'],
    "      if (flags.check) {\n        usage('--check is given more than once');\n      }\n",
    ''
  ),
  harness('H7 questions given as a list are accepted', ['S7'], ' || Array.isArray(item.questions)) {', ') {'),
  harness(
    'H8 a noul criterion must be text',
    ['S2'],
    "  return value === null || typeof value === 'string' || typeof value === 'object';",
    "  return typeof value === 'string';"
  ),
  harness(
    'H9 the state is not checked',
    ['S8'],
    '    if (!isEntry(item.state)) {\n',
    "    if (item.state === 'never') {\n"
  ),
  harness(
    'H10 instructions are not checked',
    ['S8'],
    'if (q.instructions !== undefined && !isEntry(q.instructions)) {',
    "if (q.instructions === 'never') {"
  ),
  harness(
    'H11 choice descriptions and labels are not checked',
    ['S8'],
    "        (Object.prototype.hasOwnProperty.call(q.criteria, '__proto__') ||\n          !Object.values(q.criteria).every(isEntry))\n",
    "        q.criteria === 'never'\n"
  ),
  harness(
    'H12 score levels are not checked',
    ['S8'],
    "if (q.type === 'score' && !q.criteria.every(isEntry)) {",
    "if (q.type === 'never') {"
  ),
  harness(
    'H13 a __proto__ question id is accepted',
    ['S8'],
    "    if (Object.prototype.hasOwnProperty.call(item.questions, '__proto__')) {\n",
    "    if (item.questions === 'never') {\n"
  ),
  harness(
    'H14 a nested __proto__ key is not checked',
    ['S9'],
    '  return isTopLevelEntry(value) && !hasUnsendable(value);',
    '  return isTopLevelEntry(value);'
  ),
  harness(
    'H15 the nested __proto__ check does not descend into arrays',
    ['S9'],
    '    return value.some(hasUnsendable);\n',
    '    return false;\n'
  ),
  harness(
    'H16 a non-finite number is not checked',
    ['S9'],
    '    return !Number.isFinite(value);\n',
    '    return false;\n'
  )
];

/**
 * Refuses a --pkg that would mutate this package's own source: the same directory, a `src` that is
 * a symlink, or a source file hard-linked to this package's (same device and inode).
 */
function refuseInPlace(pkg) {
  const refuse = (why) => {
    console.error(`mutationMatrix: refusing --pkg ${pkg}: ${why}; pass a real copy`);
    process.exit(2);
  };
  if (fs.realpathSync(pkg) === fs.realpathSync(PACKAGE_DIR)) {
    refuse('it is this package');
  }
  const src = path.join(pkg, 'src');
  if (
    fs.lstatSync(src).isSymbolicLink() ||
    fs.realpathSync(src) === fs.realpathSync(path.join(PACKAGE_DIR, 'src'))
  ) {
    refuse("its src is a link to this package's src");
  }
  for (const file of new Set(MUTATIONS.flatMap((row) => row.edits.map((edit) => edit.file)))) {
    const theirs = fs.statSync(path.join(pkg, file));
    const ours = fs.statSync(path.join(PACKAGE_DIR, file));
    if (theirs.dev === ours.dev && theirs.ino === ours.ino) {
      refuse(`${file} is a hard link to this package's`);
    }
  }
}

const PACKAGE_DIR = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = { check: false, pkg: undefined, out: undefined, only: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--check') {
      args.check = true;
    } else if (arg === '--pkg') {
      args.pkg = path.resolve(argv[++i]);
    } else if (arg === '--out') {
      args.out = path.resolve(argv[++i]);
    } else {
      args.only.push(arg);
    }
  }
  if (args.check) {
    args.pkg = args.pkg ?? PACKAGE_DIR;
  } else if (args.pkg === undefined) {
    console.error('mutationMatrix: --pkg <copy> is required; the run mutates the package it is given');
    process.exit(2);
  } else {
    refuseInPlace(args.pkg);
  }
  return args;
}

function occurrences(text, pattern) {
  return text.split(pattern).length - 1;
}

function runSuite(pkg, suite) {
  const options = { cwd: pkg, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 };
  if (suite === 'selftest') {
    // A jest row's `heft test --clean` leaves `lib/` built from its mutant, so rebuild from the
    // restored source before running the harness against it.
    const build = spawnSync('node_modules/.bin/heft', ['build', '--clean'], options);
    const built = `${build.stdout}${build.stderr}`;
    if (build.status !== 0) {
      return `${built}\nbuild encountered an error`;
    }
    const out = spawnSync(process.execPath, ['perf/systemOneLive.selftest.js'], options);
    return `${out.stdout}${out.stderr}`;
  }
  const out = spawnSync('node_modules/.bin/heft', ['test', '--clean', '--disable-code-coverage'], options);
  return `${out.stdout}${out.stderr}`;
}

function namesTest(redName, id) {
  return new RegExp(`(^|[^A-Za-z0-9])${id}([^A-Za-z0-9]|$)`).test(redName);
}

function classify(text, mustGoRed) {
  if (
    text.includes('error TS') ||
    (text.includes('build encountered an error') && !text.includes('[test:jest]'))
  ) {
    const errors = text
      .split('\n')
      .filter((line) => line.includes('error'))
      .slice(0, 3);
    return { verdict: 'UNVERIFIED: did not build', red: errors };
  }
  const red = Array.from(new Set(Array.from(text.matchAll(/● (.+)/g), (match) => match[1].trim()))).sort();
  const failures = /Failures: (\d+)/.exec(text);
  if (failures === null) {
    return { verdict: 'UNVERIFIED: the run reported no failure count', red };
  }
  if (failures[1] === '0') {
    return { verdict: '0 red', red };
  }
  const named = red.filter((name) => mustGoRed.some((id) => namesTest(name, id)));
  return {
    verdict:
      named.length > 0
        ? `VERIFIED (${failures[1]} red)`
        : `UNVERIFIED: ${failures[1]} red, none of [${mustGoRed.join(', ')}]`,
    red
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  // A misspelt id would otherwise select nothing and report a clean run of fewer rows.
  const known = new Set(MUTATIONS.map((row) => row.name.split(' ')[0]));
  const unknown = args.only.filter((id) => !known.has(id));
  if (unknown.length > 0) {
    console.error(`mutationMatrix: no row named [${unknown.join(', ')}]; nothing was run`);
    process.exit(2);
  }
  const rows = MUTATIONS.filter(
    (row) => args.only.length === 0 || args.only.includes(row.name.split(' ')[0])
  );
  const results = [];
  for (const row of rows) {
    const files = row.edits.map((edit) => {
      const file = path.join(args.pkg, edit.file);
      return { ...edit, file, source: fs.readFileSync(file, 'utf8') };
    });
    const miss = files.find((edit) => occurrences(edit.source, edit.from) !== 1);
    let result;
    if (miss !== undefined) {
      result = { verdict: `UNVERIFIED: pattern found ${occurrences(miss.source, miss.from)} times`, red: [] };
    } else if (args.check) {
      result = { verdict: 'pattern ok', red: [] };
    } else {
      // Edits to one file apply in turn, each against the text the previous one left.
      const mutated = new Map();
      for (const edit of files) {
        const text = mutated.has(edit.file) ? mutated.get(edit.file) : edit.source;
        mutated.set(
          edit.file,
          text.replace(edit.from, () => edit.to)
        );
      }
      // Every write is inside the protected region, so a failure part-way through a set of writes
      // still restores every file, including those already written. Each original was read before
      // any write, and each restore is attempted even if another fails.
      const originals = new Map(files.map((edit) => [edit.file, edit.source]));
      try {
        for (const [file, text] of mutated) {
          fs.writeFileSync(file, text);
        }
        result = classify(runSuite(args.pkg, row.suite), row.mustGoRed);
      } finally {
        const unrestored = [];
        for (const [file, source] of originals) {
          try {
            fs.writeFileSync(file, source);
          } catch (err) {
            unrestored.push(`${file}: ${err.message}`);
          }
        }
        if (unrestored.length > 0) {
          // Stop the run: every later row would be measured against a mutant.
          throw new Error(`could not restore, the copy is still mutated:\n  ${unrestored.join('\n  ')}`);
        }
      }
    }
    results.push({ name: row.name, mustGoRed: row.mustGoRed, ...result });
    console.log(`${row.name} [must go red: ${row.mustGoRed.join(', ')}]: ${result.verdict}`);
    for (const test of result.red) {
      console.log(`    ${test}`);
    }
  }
  if (args.out !== undefined) {
    fs.writeFileSync(args.out, `${JSON.stringify(results, undefined, 1)}\n`);
  }
  const bad = results.filter((r) => !r.verdict.startsWith('VERIFIED') && r.verdict !== 'pattern ok');
  console.log(`\n${results.length} rows; ${bad.length} not VERIFIED`);
  process.exitCode = bad.length > 0 ? 1 : 0;
}

main();
