/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * `wire-probe` — what each provider wire actually accepts, compared with the keyword-capability
 * tables `ai-assist` adapts schemas with.
 *
 * ## The question
 *
 * The tables in `@fgv/ts-extras` `schemaKeywords.ts` say, per wire, which constraint and annotation
 * keywords pass to the provider and which are folded into the description, translated, dropped or
 * refused. Most entries rest on provider documentation; some (#736: the OpenAI/xAI numeric-enum
 * pass, the Anthropic-tools `{}` pass, the OpenAI function-tools `{}` refuse) are inferences. This
 * probe turns them into observations.
 *
 * ## Method
 *
 * For each wire whose key is configured and each fixture (`./fixtures`):
 * 1. **Ours.** Run the fixture through `JsonSchema.adaptSchemaKeywords` with the wire's own table,
 *    read from the library: unchanged is `pass`, changed is `adapt`, a failure is `refuse`.
 * 2. **Raw.** Send the fixture **unadapted** in a minimal request and record whether the provider
 *    accepts it (2xx) or rejects it (400/422), with its error text. Anything else — 401, 404, 429,
 *    5xx, a transport failure — says nothing about the schema and is `inconclusive`.
 * 3. **Classify.** `agrees`; `conservative` (we adapt or refuse, the provider accepted the raw
 *    schema); `unsafe` (we pass, the provider rejected it).
 * 4. **End to end.** Send the fixture **through** `ai-assist` and confirm the request we actually
 *    send is accepted — or, where the table refuses, that it is refused before anything is sent.
 *
 * The control fixture goes first on every wire. If the provider does not accept it, the envelope
 * is wrong (a retired model, a bad key) and no row on that wire is classified.
 *
 * ## Exit status
 *
 * Non-zero only when a row is `unsafe` — a pass the provider rejects, or an adapted request it
 * rejects end to end. Those are the rows where `ai-assist` sends something that fails. A
 * `conservative` row is a finding, not a failure. It shows the request was accepted, not that the
 * keyword is honoured, so it is not by itself a reason to loosen the table: a fold keeps the
 * constraint in front of the model as text, and a pass to a provider that ignores it loses that.
 *
 * @packageDocumentation
 */

import { Converters, Hash, captureResult, fail, mapResults, succeed } from '@fgv/ts-utils';
import type { Converter, Result } from '@fgv/ts-utils';
import { AiAssist } from '@fgv/ts-extras';
import { JsonSchema, type JsonValue } from '@fgv/ts-json-base';

import type { IScenarioContext } from '../../shell';
import { resolveProviderApiKey } from '../aiProviderSecrets';
import { CONTROL_FIXTURE_ID, type IWireProbeFixture, WIRE_PROBE_FIXTURES, readFixture } from './fixtures';
import { formatWireProbeReport } from './report';
import { type IRawRequest, type IWireProbeWire, buildRawRequest, wireSchemaKeywords } from './wires';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * What the table does with a fixture.
 * @public
 */
export type OurVerdict = 'pass' | 'adapt' | 'refuse';

/**
 * What a provider did with one request.
 * @public
 */
export type ProviderObservation =
  | { readonly kind: 'accepted' }
  | { readonly kind: 'rejected'; readonly detail: string }
  | { readonly kind: 'inconclusive'; readonly detail: string };

/**
 * What `ai-assist` did with one fixture end to end.
 * @public
 */
export type AdaptedObservation =
  | { readonly kind: 'accepted' }
  | { readonly kind: 'refused-locally'; readonly detail: string }
  | { readonly kind: 'rejected'; readonly detail: string }
  | { readonly kind: 'inconclusive'; readonly detail: string };

/**
 * A row's classification.
 * @public
 */
export type RowOutcome = 'agrees' | 'conservative' | 'unsafe' | 'inconclusive';

/**
 * Whether the end-to-end request did what the table says it should.
 * @public
 */
export type EndToEndOutcome = 'ok' | 'unsafe' | 'mismatch' | 'inconclusive';

/**
 * One fixture on one wire.
 * @public
 */
export interface IWireProbeRow {
  readonly fixtureId: string;
  readonly row: string;
  readonly ours: OurVerdict;
  readonly raw: ProviderObservation;
  readonly outcome: RowOutcome;
  readonly adapted: AdaptedObservation;
  readonly endToEnd: EndToEndOutcome;
}

/**
 * One wire's result. `skipped` is set when the wire was not probed at all.
 * @public
 */
export interface IWireProbeWireResult {
  readonly wire: IWireProbeWire;
  readonly model?: string;
  readonly skipped?: string;
  /** Set when the control fixture was not accepted; every row is then inconclusive. */
  readonly controlFailure?: string;
  readonly rows: ReadonlyArray<IWireProbeRow>;
}

/**
 * An HTTP response as the probe needs it: the status and the body text.
 * @public
 */
export interface IHttpResponse {
  readonly status: number;
  readonly body: string;
}

/**
 * An end-to-end request through `ai-assist`.
 * @public
 */
export interface IAdaptedRequest {
  readonly wire: IWireProbeWire;
  readonly descriptor: AiAssist.IAiProviderDescriptor;
  readonly model: string;
  readonly apiKey: string;
  readonly schema: JsonSchema.ISchemaValidator<unknown>;
}

/**
 * Injected seams: the raw POST and the end-to-end call. Both touch the network, so both are
 * injected and the classification and the report are driven over recorded responses in tests —
 * the `mcpProbe` / `xaiCacheProbe` pattern.
 * @public
 */
export interface IWireProbeDeps {
  /** POSTs a raw request. A failure is a transport failure; any HTTP status is a success. */
  postJson(request: IRawRequest): Promise<Result<IHttpResponse>>;
  /** Sends the fixture through `ai-assist`; the `Result` is the library's own. */
  sendAdapted(request: IAdaptedRequest): Promise<Result<string>>;
}

// ---------------------------------------------------------------------------
// Ours
// ---------------------------------------------------------------------------

const normalizer: Hash.Crc32Normalizer = new Hash.Crc32Normalizer();

/** Exact structural equality: RFC 8785 canonical forms compared as strings (as `agentTasks` does). */
function sameValue(a: JsonValue, b: JsonValue): boolean {
  return normalizer
    .canonicalize(a)
    .onSuccess((left) => normalizer.canonicalize(b).onSuccess((right) => succeed(left === right)))
    .orDefault(false);
}

/**
 * What `table` does with `raw`: `pass` when adaptation leaves it unchanged, `adapt` when it folds,
 * translates or drops anything, `refuse` when the wire cannot carry it.
 * @public
 */
export function ourVerdict(raw: JsonValue, table: JsonSchema.SchemaKeywordCapabilities): OurVerdict {
  return JsonSchema.adaptSchemaKeywords(raw, table)
    .onSuccess((adapted): Result<OurVerdict> => succeed(sameValue(adapted, raw) ? 'pass' : 'adapt'))
    .orDefault('refuse');
}

// ---------------------------------------------------------------------------
// Observations
// ---------------------------------------------------------------------------

/** The longest provider error text the report carries. */
const MAX_DETAIL: number = 300;

/**
 * One report line: line breaks become ` | ` (Gemini lists one error per line, which broke the
 * report's indentation on the first live run), then the text is capped at `MAX_DETAIL`.
 */
function truncate(text: string): string {
  const line = text.replace(/\s*\n\s*/g, ' | ');
  return line.length > MAX_DETAIL ? `${line.slice(0, MAX_DETAIL)}…` : line;
}

/**
 * Provider error bodies: OpenAI, Anthropic and Gemini nest a `message` under `error`; xAI has been
 * seen to put a string there.
 */
const providerError: Converter<string> = Converters.oneOf<string>([
  Converters.object<{ error: { message: string } }>({
    error: Converters.object<{ message: string }>({ message: Converters.string })
  }).map((e) => succeed(e.error.message)),
  Converters.object<{ error: string }>({ error: Converters.string }).map((e) => succeed(e.error))
]);

/**
 * The provider's error text from a response body: the error message when the body has a known
 * shape, otherwise the body itself, truncated.
 * @public
 */
export function providerErrorText(body: string): string {
  return truncate(
    captureResult(() => JSON.parse(body) as unknown)
      .onSuccess((parsed) => providerError.convert(parsed))
      .orDefault(body)
  );
}

/** The statuses that mean "this schema", rather than the key, the model or the service. */
const SCHEMA_REJECTION_STATUSES: ReadonlySet<number> = new Set([400, 422]);

/**
 * Classifies a raw response.
 * @public
 */
export function observeRaw(response: Result<IHttpResponse>): ProviderObservation {
  if (response.isFailure()) {
    return { kind: 'inconclusive', detail: `transport: ${response.message}` };
  }
  const { status, body } = response.value;
  if (status >= 200 && status < 300) {
    return { kind: 'accepted' };
  }
  const detail = `${status} ${providerErrorText(body)}`;
  return SCHEMA_REJECTION_STATUSES.has(status)
    ? { kind: 'rejected', detail }
    : { kind: 'inconclusive', detail };
}

/**
 * Classifies the library's result for an end-to-end request.
 *
 * @remarks
 * Read from the failure text, because that is all the library returns. Its HTTP failures read
 * `AI API returned <status>: <body>` (streaming: `AI streaming API returned …`), and a schema the
 * wire cannot carry is refused before sending with `… cannot be sent …`. Any other failure — an
 * empty reply under the small cap, a stream that ended oddly — came after the provider accepted
 * the request or before it was built, so it says nothing about the schema.
 * @public
 */
export function observeAdapted(result: Result<string>): AdaptedObservation {
  if (result.isSuccess()) {
    return { kind: 'accepted' };
  }
  const message = result.message;
  if (/cannot be sent/.test(message)) {
    return { kind: 'refused-locally', detail: truncate(message) };
  }
  const http = /API returned (\d{3}): ?([\s\S]*)$/.exec(message);
  if (http !== null) {
    const status = Number(http[1]);
    const detail = `${status} ${providerErrorText(http[2])}`;
    return SCHEMA_REJECTION_STATUSES.has(status)
      ? { kind: 'rejected', detail }
      : { kind: 'inconclusive', detail };
  }
  return { kind: 'inconclusive', detail: truncate(message) };
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

/**
 * Classifies a raw observation against the table.
 * @public
 */
export function classifyRow(ours: OurVerdict, raw: ProviderObservation): RowOutcome {
  if (raw.kind === 'inconclusive') {
    return 'inconclusive';
  }
  if (ours === 'pass') {
    return raw.kind === 'accepted' ? 'agrees' : 'unsafe';
  }
  return raw.kind === 'accepted' ? 'conservative' : 'agrees';
}

/**
 * Judges the end-to-end request against the table: a refused fixture must be refused before it is
 * sent, and anything else must be accepted.
 * @public
 */
export function classifyEndToEnd(ours: OurVerdict, adapted: AdaptedObservation): EndToEndOutcome {
  if (adapted.kind === 'inconclusive') {
    return 'inconclusive';
  }
  if (ours === 'refuse') {
    // A refused fixture that was sent anyway and then rejected is a request we actually send that
    // fails: that is unsafe, whatever the table said.
    if (adapted.kind === 'rejected') {
      return 'unsafe';
    }
    return adapted.kind === 'refused-locally' ? 'ok' : 'mismatch';
  }
  if (adapted.kind === 'refused-locally') {
    return 'mismatch';
  }
  return adapted.kind === 'accepted' ? 'ok' : 'unsafe';
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * The wires to probe: all of them, or the comma-separated ids in `WIRE_PROBE_WIRES`.
 * @public
 */
export function selectWires(
  env: Readonly<Record<string, string | undefined>>,
  wires: ReadonlyArray<IWireProbeWire>
): Result<ReadonlyArray<IWireProbeWire>> {
  const requested = env.WIRE_PROBE_WIRES?.trim();
  if (requested === undefined || requested === '') {
    return succeed(wires);
  }
  return mapResults(
    requested.split(',').map((raw) => {
      const id = raw.trim();
      const wire = wires.find((w) => w.id === id);
      return wire !== undefined
        ? succeed(wire)
        : fail<IWireProbeWire>(
            `WIRE_PROBE_WIRES: unknown wire '${id}' (known: ${wires.map((w) => w.id).join(', ')})`
          );
    })
  );
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

/** A fixture read into its validator (see `readFixture`), with the raw JSON the probe sends. */
interface IPreparedFixture {
  readonly fixture: IWireProbeFixture;
  readonly validator: JsonSchema.ISchemaValidator<unknown>;
  readonly raw: JsonValue;
}

function prepareFixture(fixture: IWireProbeFixture): Result<IPreparedFixture> {
  return readFixture(fixture)
    .withErrorFormat((msg) => `fixture '${fixture.id}': ${msg}`)
    .onSuccess((validator) => succeed({ fixture, validator, raw: validator.toJson() }));
}

interface IWireSetup {
  readonly descriptor: AiAssist.IAiProviderDescriptor;
  readonly model: string;
  readonly apiKey: string;
  readonly table: JsonSchema.SchemaKeywordCapabilities;
}

async function setUpWire(context: IScenarioContext, wire: IWireProbeWire): Promise<Result<IWireSetup>> {
  const key = await resolveProviderApiKey(context, wire.providerId);
  if (key.isFailure()) {
    return fail(`no ${wire.providerId} key: ${key.message}`);
  }
  return AiAssist.getProviderDescriptor(wire.providerId)
    .onSuccess((descriptor) =>
      AiAssist.resolveProviderModel(descriptor, wire.model).onSuccess((model) => {
        const table = wireSchemaKeywords(wire, descriptor, model);
        return table === undefined
          ? fail<IWireSetup>(`${model} declares no structured-output capability`)
          : succeed({ descriptor, model, apiKey: key.value, table });
      })
    )
    .withErrorFormat((msg) => `registry: ${msg}`);
}

async function probeRow(
  context: IScenarioContext,
  deps: IWireProbeDeps,
  wire: IWireProbeWire,
  setup: IWireSetup,
  prepared: IPreparedFixture
): Promise<IWireProbeRow> {
  const ours = ourVerdict(prepared.raw, setup.table);
  const request = buildRawRequest(wire, setup.descriptor, setup.model, setup.apiKey, prepared.raw);
  // The URL only: the headers carry the key.
  context.logger.info(`[${wire.id}] ${prepared.fixture.id}: POST ${request.url}`);
  const raw = observeRaw(await deps.postJson(request));
  const adapted = observeAdapted(
    await deps.sendAdapted({
      wire,
      descriptor: setup.descriptor,
      model: setup.model,
      apiKey: setup.apiKey,
      schema: prepared.validator
    })
  );
  return {
    fixtureId: prepared.fixture.id,
    row: prepared.fixture.row,
    ours,
    raw,
    outcome: classifyRow(ours, raw),
    adapted,
    endToEnd: classifyEndToEnd(ours, adapted)
  };
}

async function probeWire(
  context: IScenarioContext,
  deps: IWireProbeDeps,
  wire: IWireProbeWire,
  fixtures: ReadonlyArray<IPreparedFixture>
): Promise<IWireProbeWireResult> {
  const setup = await setUpWire(context, wire);
  if (setup.isFailure()) {
    context.logger.info(`[${wire.id}] skipped: ${setup.message}`);
    return { wire, skipped: setup.message, rows: [] };
  }
  const rows: IWireProbeRow[] = [];
  for (const prepared of fixtures) {
    const row = await probeRow(context, deps, wire, setup.value, prepared);
    if (prepared.fixture.id === CONTROL_FIXTURE_ID && row.raw.kind !== 'accepted') {
      // The envelope is wrong, so the control row measures nothing either — and nothing after it
      // would measure a keyword, so stop spending requests on the wire.
      return {
        wire,
        model: setup.value.model,
        controlFailure: row.raw.detail,
        rows: [{ ...row, outcome: 'inconclusive', endToEnd: 'inconclusive' }]
      };
    }
    rows.push(row);
  }
  return { wire, model: setup.value.model, rows };
}

/**
 * The unsafe rows, raw or end to end, as `wire/fixture`.
 * @public
 */
export function unsafeRows(results: ReadonlyArray<IWireProbeWireResult>): ReadonlyArray<string> {
  return results.flatMap((r) =>
    r.rows
      .filter((row) => row.outcome === 'unsafe' || row.endToEnd === 'unsafe')
      .map((row) => `${r.wire.id}/${row.fixtureId}`)
  );
}

/**
 * Runs the probe over `wires` and returns the report. Fails — the CLI then exits non-zero — when any
 * row is unsafe, with the report in the failure message.
 * @public
 */
export async function runWireProbe(
  context: IScenarioContext,
  deps: IWireProbeDeps,
  wires: ReadonlyArray<IWireProbeWire>,
  fixtures: ReadonlyArray<IWireProbeFixture> = WIRE_PROBE_FIXTURES
): Promise<Result<string>> {
  const prepared = mapResults(fixtures.map(prepareFixture));
  if (prepared.isFailure()) {
    return fail(prepared.message);
  }
  const results: IWireProbeWireResult[] = [];
  for (const wire of wires) {
    results.push(await probeWire(context, deps, wire, prepared.value));
  }
  const report = formatWireProbeReport(results);
  const unsafe = unsafeRows(results);
  return unsafe.length === 0
    ? succeed(report)
    : fail(`${report}\n\n${unsafe.length} unsafe row(s): ${unsafe.join(', ')}`);
}
