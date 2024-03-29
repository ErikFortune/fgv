## API Report File for "@fgv/ts-json"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { Conversion } from '@fgv/ts-utils';
import { Converter } from '@fgv/ts-utils';
import { DetailedFailure } from '@fgv/ts-utils';
import { DetailedResult } from '@fgv/ts-utils';
import { Result } from '@fgv/ts-utils';

// @public
export function classifyJsonValue(from: unknown): Result<JsonValueType>;

// @public
export class CompositeJsonMap implements IJsonReferenceMap {
    // @internal
    protected constructor(maps: IJsonReferenceMap[]);
    static create(maps: IJsonReferenceMap[]): Result<CompositeJsonMap>;
    getJsonObject(key: string, context?: IJsonContext): DetailedResult<JsonObject, JsonReferenceMapFailureReason>;
    getJsonValue(key: string, context?: IJsonContext): DetailedResult<JsonValue, JsonReferenceMapFailureReason>;
    has(key: string): boolean;
    keyIsInRange(key: string): boolean;
    // @internal
    protected _maps: IJsonReferenceMap[];
}

// @public
function conditionalJson(options?: Partial<ConditionalJsonConverterOptions>): JsonConverter;

// @public
export class ConditionalJsonConverter extends JsonEditorConverter {
    constructor(options?: Partial<ConditionalJsonConverterOptions>);
    static readonly conditionalOptions: Partial<IJsonConverterOptions>;
    static create(options?: Partial<ConditionalJsonConverterOptions>): Result<JsonConverter>;
}

// @public
export type ConditionalJsonConverterOptions = Omit<TemplatedJsonConverterOptions, 'useConditionalNames'>;

// Warning: (ae-forgotten-export) The symbol "JsonEditorRuleBase" needs to be exported by the entry point index.d.ts
// Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
//
// @public
class ConditionalJsonEditorRule extends JsonEditorRuleBase {
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    constructor(options?: IConditionalJsonRuleOptions);
    // @internal
    protected _compare(left: string, right: string, operator: string): boolean;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    static create(options?: IConditionalJsonRuleOptions): Result<ConditionalJsonEditorRule>;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    editProperty(key: string, value: JsonValue, state: JsonEditorState): DetailedResult<JsonObject, JsonPropertyEditFailureReason>;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    finalizeProperties(finalized: JsonObject[], __state: JsonEditorState): DetailedResult<JsonObject[], JsonEditFailureReason>;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    protected _options?: IConditionalJsonRuleOptions;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    protected _tryParseCondition(key: string, state: JsonEditorState): DetailedResult<IConditionalJsonKeyResult, JsonPropertyEditFailureReason>;
}

// @public
export function contextFromConverterOptions(partial?: Partial<IJsonConverterOptions>): IJsonContext | undefined;

// Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
//
// @public
export function converterOptionsToEditor(partial?: Partial<IJsonConverterOptions>): Result<JsonEditor>;

declare namespace Converters {
    export {
        templatedJson,
        conditionalJson,
        richJson,
        json,
        jsonObject,
        jsonArray
    }
}
export { Converters }

// Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Files"
//
// @public
function convertJsonDirectorySync<T>(srcPath: string, options: IDirectoryConvertOptions<T>): Result<IReadDirectoryItem<T>[]>;

// Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Files"
//
// @public
function convertJsonDirectoryToMapSync<T, TC = unknown>(srcPath: string, options: IDirectoryToMapConvertOptions<T, TC>): Result<Map<string, T>>;

// @public
function convertJsonFileSync<T>(srcPath: string, converter: Converter<T>): Result<T>;

// @public
export function defaultExtendVars(base: TemplateVars | undefined, values: VariableValue[]): Result<TemplateVars | undefined>;

declare namespace EditorRules {
    export {
        IConditionalJsonKeyResult,
        IConditionalJsonDeferredObject,
        IConditionalJsonRuleOptions,
        ConditionalJsonEditorRule,
        IMultiValuePropertyParts,
        MultiValueJsonEditorRule,
        ReferenceJsonEditorRule,
        ITemplatedJsonRuleOptions,
        TemplatedJsonEditorRule
    }
}
export { EditorRules }

declare namespace File_2 {
    export {
        readJsonFileSync,
        convertJsonFileSync,
        convertJsonDirectorySync,
        convertJsonDirectoryToMapSync,
        writeJsonFileSync,
        IDirectoryConvertOptions,
        IReadDirectoryItem,
        ItemNameTransformFunction,
        IDirectoryToMapConvertOptions
    }
}
export { File_2 as File }

// Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
// Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
//
// @public
interface IConditionalJsonDeferredObject extends IConditionalJsonKeyResult {
    // (undocumented)
    value: JsonValue;
}

// Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
//
// @public
interface IConditionalJsonKeyResult extends JsonObject {
    // (undocumented)
    matchType: 'default' | 'match' | 'unconditional';
}

// Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
//
// @public
interface IConditionalJsonRuleOptions extends Partial<IJsonEditorOptions> {
    flattenUnconditionalValues?: boolean;
}

// @public
interface IDirectoryConvertOptions<T, TC = unknown> {
    converter: Converter<T, TC>;
}

// @public
interface IDirectoryToMapConvertOptions<T, TC = unknown> extends IDirectoryConvertOptions<T, TC> {
    // (undocumented)
    transformName?: ItemNameTransformFunction<T>;
}

// @public
export interface IJsonCloneEditor {
    clone(src: JsonValue, context?: IJsonContext): DetailedResult<JsonValue, JsonEditFailureReason>;
}

// @public
export interface IJsonContext {
    // (undocumented)
    extendVars?: TemplateVarsExtendFunction;
    // (undocumented)
    refs?: IJsonReferenceMap;
    // (undocumented)
    vars?: TemplateVars;
}

// @public
export interface IJsonConverterOptions {
    extendVars?: TemplateVarsExtendFunction;
    flattenUnconditionalValues: boolean;
    onInvalidPropertyName: 'error' | 'ignore';
    onInvalidPropertyValue: 'error' | 'ignore';
    onUndefinedPropertyValue: 'error' | 'ignore';
    refs?: IJsonReferenceMap;
    useConditionalNames: boolean;
    useMultiValueTemplateNames: boolean;
    useNameTemplates: boolean;
    useReferences: boolean;
    useValueTemplates: boolean;
    vars?: TemplateVars;
}

// Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
//
// @public
export interface IJsonEditorOptions {
    // (undocumented)
    context?: IJsonContext;
    // (undocumented)
    validation: IJsonEditorValidationOptions;
}

// Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
// Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
//
// @public
export interface IJsonEditorRule {
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    editProperty(key: string, value: JsonValue, state: JsonEditorState): DetailedResult<JsonObject, JsonPropertyEditFailureReason>;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    editValue(value: JsonValue, state: JsonEditorState): DetailedResult<JsonValue, JsonEditFailureReason>;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    finalizeProperties(deferred: JsonObject[], state: JsonEditorState): DetailedResult<JsonObject[], JsonEditFailureReason>;
}

// Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
//
// @public
export interface IJsonEditorValidationOptions {
    onInvalidPropertyName: 'error' | 'ignore';
    onInvalidPropertyValue: 'error' | 'ignore';
    onUndefinedPropertyValue: 'error' | 'ignore';
}

// @public
export interface IJsonReferenceMap {
    getJsonObject(key: string, context?: IJsonContext): DetailedResult<JsonObject, JsonReferenceMapFailureReason>;
    getJsonValue(key: string, context?: IJsonContext): DetailedResult<JsonValue, JsonReferenceMapFailureReason>;
    has(key: string): boolean;
    keyIsInRange(key: string): boolean;
}

// @public
interface IMultiValuePropertyParts {
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    readonly asArray: boolean;
    readonly propertyValues: string[];
    readonly propertyVariable: string;
    readonly token: string;
}

// @public
interface IReadDirectoryItem<T> {
    filename: string;
    item: T;
}

// @public
export interface IReferenceMapKeyPolicyValidateOptions {
    makeValid?: boolean;
}

// @public
export function isJsonArray(from: unknown): from is JsonArray;

// @public
export function isJsonObject(from: unknown): from is JsonObject;

// @public
export function isJsonPrimitive(from: unknown): from is JsonPrimitive;

// @public
type ItemNameTransformFunction<T> = (name: string, item: T) => Result<string>;

// Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
//
// @public
interface ITemplatedJsonRuleOptions extends Partial<IJsonEditorOptions> {
    useNameTemplates?: boolean;
    useValueTemplates?: boolean;
}

// @public
const json: JsonConverter;

// @public
export interface JsonArray extends Array<JsonValue> {
}

// @public
const jsonArray: Converter<JsonArray, IJsonContext>;

// @public
export class JsonContextHelper {
    constructor(context?: IJsonContext);
    // @internal
    protected _context?: IJsonContext;
    static create(context?: IJsonContext): Result<JsonContextHelper>;
    static extendContext(baseContext?: IJsonContext | undefined, add?: {
        vars?: VariableValue[];
        refs?: IJsonReferenceMap[];
    }): Result<IJsonContext | undefined>;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: Unsupported system selector "static"
    extendContext(add?: {
        vars?: VariableValue[];
        refs?: IJsonReferenceMap[];
    }): Result<IJsonContext | undefined>;
    static extendContextRefs(baseContext: IJsonContext | undefined, refs?: IJsonReferenceMap[]): Result<IJsonReferenceMap | undefined>;
    static extendContextVars(baseContext: IJsonContext | undefined, vars?: VariableValue[]): Result<TemplateVars | undefined>;
    extendRefs(refs?: IJsonReferenceMap[]): Result<IJsonReferenceMap | undefined>;
    extendVars(vars?: VariableValue[]): Result<TemplateVars | undefined>;
    static mergeContext(baseContext: IJsonContext | undefined, add: IJsonContext | undefined): Result<IJsonContext | undefined>;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: Unsupported system selector "static"
    mergeContext(merge?: IJsonContext): Result<IJsonContext | undefined>;
}

// @public
export class JsonConverter extends JsonEditorConverter {
    constructor(options?: Partial<IJsonConverterOptions>);
    static create(options?: Partial<IJsonConverterOptions>): Result<JsonConverter>;
}

// @public
export type JsonEditFailureReason = 'ignore' | 'inapplicable' | 'edited' | 'error';

// @public
export class JsonEditor implements IJsonCloneEditor {
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    //
    // @internal
    protected constructor(options?: Partial<IJsonEditorOptions>, rules?: IJsonEditorRule[]);
    clone(src: JsonValue, context?: IJsonContext): DetailedResult<JsonValue, JsonEditFailureReason>;
    // @internal (undocumented)
    protected _cloneArray(src: JsonArray, context?: IJsonContext): DetailedResult<JsonArray, JsonEditFailureReason>;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    static create(options?: Partial<IJsonEditorOptions>, rules?: IJsonEditorRule[]): Result<JsonEditor>;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    static get default(): JsonEditor;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    //
    // @internal
    protected static _default?: JsonEditor;
    // @internal (undocumented)
    protected _editProperty(key: string, value: JsonValue, state: JsonEditorState): DetailedResult<JsonObject, JsonPropertyEditFailureReason>;
    // @internal (undocumented)
    protected _editValue(value: JsonValue, state: JsonEditorState): DetailedResult<JsonValue, JsonEditFailureReason>;
    // @internal (undocumented)
    protected _finalizeAndMerge(target: JsonObject, state: JsonEditorState): DetailedResult<JsonObject, JsonEditFailureReason>;
    // @internal (undocumented)
    protected static _getDefaultOptions(options?: Partial<IJsonEditorOptions>): Result<IJsonEditorOptions>;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    static getDefaultRules(options?: IJsonEditorOptions): Result<IJsonEditorRule[]>;
    // @internal (undocumented)
    protected _mergeClonedProperty(target: JsonObject, key: string, newValue: JsonValue, state: JsonEditorState): DetailedResult<JsonValue, JsonEditFailureReason>;
    mergeObjectInPlace(target: JsonObject, src: JsonObject, runtimeContext?: IJsonContext): Result<JsonObject>;
    // @internal (undocumented)
    protected _mergeObjectInPlace(target: JsonObject, src: JsonObject, state: JsonEditorState): Result<JsonObject>;
    mergeObjectsInPlace(target: JsonObject, srcObjects: JsonObject[]): Result<JsonObject>;
    mergeObjectsInPlaceWithContext(context: IJsonContext | undefined, base: JsonObject, srcObjects: JsonObject[]): Result<JsonObject>;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    options: IJsonEditorOptions;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    //
    // @internal
    protected _rules: IJsonEditorRule[];
}

// Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
//
// @public
export class JsonEditorConverter extends Conversion.BaseConverter<JsonValue, IJsonContext> {
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    constructor(editor: JsonEditor);
    array(): Converter<JsonArray, IJsonContext>;
    // (undocumented)
    protected _convert(from: unknown, context?: IJsonContext): Result<JsonValue>;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    static createWithEditor(editor: JsonEditor): Result<JsonEditorConverter>;
    // (undocumented)
    readonly editor: JsonEditor;
    object(): Converter<JsonObject, IJsonContext>;
}

// Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
//
// @public
export class JsonEditorState {
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    constructor(editor: IJsonCloneEditor, baseOptions: IJsonEditorOptions, runtimeContext?: IJsonContext);
    get context(): IJsonContext | undefined;
    defer(obj: JsonObject): void;
    get deferred(): JsonObject[];
    // @internal
    protected readonly _deferred: JsonObject[];
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    readonly editor: IJsonCloneEditor;
    extendContext(baseContext: IJsonContext | undefined, add: {
        vars?: VariableValue[];
        refs?: IJsonReferenceMap[];
    }): Result<IJsonContext | undefined>;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    failValidation<T = JsonObject>(rule: JsonEditorValidationRules, message?: string, validation?: IJsonEditorValidationOptions): DetailedFailure<T, JsonEditFailureReason>;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    getContext(defaultContext?: IJsonContext): IJsonContext | undefined;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    //
    // @internal
    protected static _getEffectiveOptions(options: IJsonEditorOptions, context?: IJsonContext): Result<IJsonEditorOptions>;
    getRefs(defaultContext?: IJsonContext): IJsonReferenceMap | undefined;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    getVars(defaultContext?: IJsonContext): TemplateVars | undefined;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    //
    // @internal
    protected readonly _id: number;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    //
    // @internal
    protected static _nextId: number;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    readonly options: IJsonEditorOptions;
}

// Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
//
// @public
export type JsonEditorValidationRules = 'invalidPropertyName' | 'invalidPropertyValue' | 'undefinedPropertyValue';

// @public
export interface JsonObject {
    // (undocumented)
    [key: string]: JsonValue;
}

// @public
const jsonObject: Converter<JsonObject, IJsonContext>;

// @public
export type JsonPrimitive = boolean | number | string | null;

// @public
export type JsonPropertyEditFailureReason = JsonEditFailureReason | 'deferred';

// @public
export type JsonReferenceMapFailureReason = 'unknown' | 'error';

// @public
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

// @public
export type JsonValueType = 'primitive' | 'object' | 'array';

// @public
export function mergeDefaultJsonConverterOptions(partial?: Partial<IJsonConverterOptions>): IJsonConverterOptions;

// Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
//
// @public
class MultiValueJsonEditorRule extends JsonEditorRuleBase {
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    constructor(options?: IJsonEditorOptions);
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    static create(options?: IJsonEditorOptions): Result<MultiValueJsonEditorRule>;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    protected _deriveContext(state: JsonEditorState, ...values: VariableValue[]): Result<IJsonContext | undefined>;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    editProperty(key: string, value: JsonValue, state: JsonEditorState): DetailedResult<JsonObject, JsonPropertyEditFailureReason>;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    protected _options?: IJsonEditorOptions;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    protected _tryParse(token: string, state: JsonEditorState): DetailedResult<IMultiValuePropertyParts, JsonEditFailureReason>;
}

// @public
export function pickJsonObject(src: JsonObject, path: string): Result<JsonObject>;

// @public
export function pickJsonValue(src: JsonObject, path: string): Result<JsonValue>;

// @public
export class PrefixedJsonMap extends SimpleJsonMap {
    // Warning: (ae-forgotten-export) The symbol "MapOrRecord" needs to be exported by the entry point index.d.ts
    // Warning: (ae-forgotten-export) The symbol "ISimpleJsonMapOptions" needs to be exported by the entry point index.d.ts
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    protected constructor(values?: MapOrRecord<JsonValue>, context?: IJsonContext, options?: ISimpleJsonMapOptions);
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    static createPrefixed(prefix: string, values?: MapOrRecord<JsonValue>, context?: IJsonContext, editor?: JsonEditor): Result<PrefixedJsonMap>;
    // Warning: (ae-forgotten-export) The symbol "IKeyPrefixOptions" needs to be exported by the entry point index.d.ts
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    static createPrefixed(prefixOptions: IKeyPrefixOptions, values?: MapOrRecord<JsonValue>, context?: IJsonContext, editor?: JsonEditor): Result<PrefixedJsonMap>;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "PrefixKeyPolicy"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "IKeyPrefixOptions"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "IKeyPrefixOptions"
    //
    // @internal
    protected static _toPolicy(prefixOptions: string | IKeyPrefixOptions): ReferenceMapKeyPolicy<JsonValue>;
}

// @public
function readJsonFileSync(srcPath: string): Result<JsonValue>;

// Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
//
// @public
class ReferenceJsonEditorRule extends JsonEditorRuleBase {
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    constructor(options?: IJsonEditorOptions);
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    static create(options?: IJsonEditorOptions): Result<ReferenceJsonEditorRule>;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    editProperty(key: string, value: JsonValue, state: JsonEditorState): DetailedResult<JsonObject, JsonPropertyEditFailureReason>;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    editValue(value: JsonValue, state: JsonEditorState): DetailedResult<JsonValue, JsonEditFailureReason>;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    //
    // @internal
    protected _extendContext(state: JsonEditorState, supplied: JsonValue): Result<IJsonContext | undefined>;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    protected _options?: IJsonEditorOptions;
}

// @public
export class ReferenceMapKeyPolicy<T> {
    constructor(options?: IReferenceMapKeyPolicyValidateOptions, isValid?: (key: string, item?: T) => boolean);
    static defaultKeyPredicate(key: string): boolean;
    // @internal (undocumented)
    protected readonly _defaultOptions?: IReferenceMapKeyPolicyValidateOptions;
    isValid(key: string, item?: T): boolean;
    // @internal (undocumented)
    protected readonly _isValid: (key: string, item?: T) => boolean;
    validate(key: string, item?: T, __options?: IReferenceMapKeyPolicyValidateOptions): Result<string>;
    validateItems(items: [string, T][], options?: IReferenceMapKeyPolicyValidateOptions): Result<[string, T][]>;
    validateMap(map: Map<string, T>, options?: IReferenceMapKeyPolicyValidateOptions): Result<Map<string, T>>;
}

// @public
function richJson(options?: Partial<RichJsonConverterOptions>): JsonConverter;

// @public
export class RichJsonConverter extends JsonEditorConverter {
    constructor(options?: Partial<RichJsonConverterOptions>);
    static create(options?: Partial<RichJsonConverterOptions>): Result<JsonConverter>;
    static readonly richOptions: Partial<IJsonConverterOptions>;
}

// @public
export type RichJsonConverterOptions = Omit<ConditionalJsonConverterOptions, 'useReferences'>;

// Warning: (ae-forgotten-export) The symbol "SimpleJsonMapBase" needs to be exported by the entry point index.d.ts
//
// @public
export class SimpleJsonMap extends SimpleJsonMapBase<JsonValue> {
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "ISimpleJsonMapOptions"
    protected constructor(values?: MapOrRecord<JsonValue>, context?: IJsonContext, options?: ISimpleJsonMapOptions);
    // @internal (undocumented)
    protected _clone(value: JsonValue, context?: IJsonContext): DetailedResult<JsonValue, JsonReferenceMapFailureReason>;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "ISimpleJsonMapOptions"
    static createSimple(values?: MapOrRecord<JsonValue>, context?: IJsonContext, options?: ISimpleJsonMapOptions): Result<SimpleJsonMap>;
    // @internal (undocumented)
    protected _editor?: JsonEditor;
    getJsonValue(key: string, context?: IJsonContext): DetailedResult<JsonValue, JsonReferenceMapFailureReason>;
}

// @public
function templatedJson(options?: Partial<TemplatedJsonConverterOptions>): JsonConverter;

// @public
export class TemplatedJsonConverter extends JsonEditorConverter {
    constructor(options?: Partial<TemplatedJsonConverterOptions>);
    static create(options?: Partial<TemplatedJsonConverterOptions>): Result<JsonConverter>;
    static readonly templateOptions: Partial<IJsonConverterOptions>;
}

// @public
export type TemplatedJsonConverterOptions = Omit<IJsonConverterOptions, 'useNameTemplates' | 'useValueTemplates' | 'useMultiValueTemplateNames'>;

// Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
//
// @public
class TemplatedJsonEditorRule extends JsonEditorRuleBase {
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    constructor(options?: ITemplatedJsonRuleOptions);
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    static create(options?: ITemplatedJsonRuleOptions): Result<TemplatedJsonEditorRule>;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    editProperty(key: string, value: JsonValue, state: JsonEditorState): DetailedResult<JsonObject, JsonPropertyEditFailureReason>;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    editValue(value: JsonValue, state: JsonEditorState): DetailedResult<JsonValue, JsonEditFailureReason>;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    protected _options?: ITemplatedJsonRuleOptions;
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-json" does not have an export "Editor"
    //
    // @internal
    protected _render(template: string, state: JsonEditorState): DetailedResult<string, JsonEditFailureReason>;
}

// @public
export type TemplateVars = Record<string, unknown>;

// @public
export type TemplateVarsExtendFunction = (base: TemplateVars | undefined, values: VariableValue[]) => Result<TemplateVars | undefined>;

// @public
export type VariableValue = [string, unknown];

// @public
function writeJsonFileSync(srcPath: string, value: JsonValue): Result<boolean>;

// (No @packageDocumentation comment for this package)

```
