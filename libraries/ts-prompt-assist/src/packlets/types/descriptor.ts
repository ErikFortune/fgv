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

import type { Result } from '@fgv/ts-utils';
import type {
  OutputContractKind,
  PromptStoreEventKind,
  ResourceSubstitutionMode,
  SlotDirective,
  SlotWritability,
  SuspiciousDisposition
} from './enums';
import type {
  AxisName,
  ConverterId,
  PromptId,
  ResourceId,
  ScopeKey,
  SerializerId,
  SlotName,
  ValidatorId
} from './ids';
import type { IQualifierContext, PromptSubstitutions, SlotBinding } from './bindings';

export type { OutputContractKind };

/**
 * Structural representation of a ts-res condition set declaration.
 * Matches the shape of `ResourceJson.Json.ConditionSetDecl` from `@fgv/ts-res`.
 * @public
 */
export type ConditionSetDecl =
  | ReadonlyArray<Readonly<Record<string, string | ILooseConditionDecl>>>
  | Record<string, string | IChildConditionDecl>;

/**
 * Structural match for a loose condition declaration (array-form element).
 * @public
 */
export interface ILooseConditionDecl {
  readonly name?: string;
  readonly value?: string;
  readonly operator?: string;
  readonly priority?: number;
  [key: string]: unknown;
}

/**
 * Structural match for a child condition declaration (record-form value).
 * @public
 */
export interface IChildConditionDecl {
  readonly operator?: string;
  readonly priority?: number;
  [key: string]: unknown;
}

/**
 * Structural representation of a ts-res condition match result.
 * Matches the shape of `Runtime.IConditionMatchResult` from `@fgv/ts-res`.
 * @public
 */
export interface IConditionMatchResult {
  /** The condition index. */
  readonly conditionIndex: number;
  /** Whether the condition matched. */
  readonly matched: boolean;
  /** Match score, if applicable. */
  readonly matchScore?: number;
}

/**
 * Output contract for a free-text prompt.
 * @public
 */
export interface ITextOutputContract {
  /** Discriminator. */
  readonly kind: 'free-text';
}

/**
 * Output contract for a JSON-structured prompt.
 * @public
 */
export interface IJsonOutputContract {
  /** Discriminator. */
  readonly kind: 'json';
  /** The registered converter to apply to parsed output. */
  readonly converterId: ConverterId;
}

/**
 * Discriminated union of prompt output contracts.
 * @public
 */
export type PromptOutputContract = ITextOutputContract | IJsonOutputContract;

/**
 * Metadata about an expected qualifier axis.
 * @public
 */
export interface IExpectedQualifierAxis {
  /** The axis name. */
  readonly name: AxisName;
  /** Human-readable description. */
  readonly description?: string;
  /** Suggested values for editor UI hints. */
  readonly suggestedValues?: ReadonlyArray<string>;
}

/**
 * Qualifier axis metadata for a prompt descriptor.
 * @public
 */
export interface IPromptQualifierMetadata {
  /** Axes that must be present in the qualifier context. */
  readonly required?: ReadonlyArray<AxisName>;
  /** Axes expected (with optional hints). */
  readonly expected?: ReadonlyArray<IExpectedQualifierAxis>;
  /** Axes that must not be present. */
  readonly disallowed?: ReadonlyArray<AxisName>;
}

/**
 * A single slot in a prompt descriptor.
 * @public
 */
export interface IPromptSlot {
  /** The slot name used in Mustache templates as `{{{name}}}`. */
  readonly name: SlotName;
  /** Human-readable description. */
  readonly description: string;
  /** Whether the slot must be filled. Default: true. */
  readonly required?: boolean;
  /** Default binding if no caller or scope binding is supplied. */
  readonly defaultBinding?: SlotBinding;
  /** Slot kind for serialization. Default: 'string'. */
  readonly kind?: string;
  /** Serializer id, required when kind !== 'string'. */
  readonly serializerId?: SerializerId;
  /** Directives the slot accepts. Default: any. */
  readonly allowedDirectives?: ReadonlyArray<SlotDirective>;
  /** Which scope tier may write this slot. Default: 'any-scope'. */
  readonly writableBy?: SlotWritability;
  /** Per-slot maximum length cap. */
  readonly maxLength?: number;
  /** Source tag for safety screening (e.g. 'user', 'system'). */
  readonly source?: string;
}

/**
 * An example input/output pair for a prompt.
 * @public
 */
export interface IPromptExamplePair {
  /** The example input. */
  readonly input: unknown;
  /** The expected output. */
  readonly output: unknown;
}

/**
 * A set of examples scoped to qualifier conditions.
 * @public
 */
export interface IPromptExampleSet {
  /** Qualifier conditions this example set applies to. */
  readonly conditions: Readonly<Record<string, string>>;
  /** The example pairs. */
  readonly pairs: ReadonlyArray<IPromptExamplePair>;
}

/**
 * Join policy for composing partial candidates.
 * @public
 */
export interface IPromptJoinPolicy {
  /** String inserted between fragments. Default: '\n\n'. */
  readonly separator?: string;
  /** Fragment order. Default: 'specificity-ascending'. */
  readonly order?: 'specificity-ascending' | 'specificity-descending';
  /** Strip trailing whitespace per fragment before joining. Default: true. */
  readonly trimTrailingWhitespace?: boolean;
}

/**
 * Per-prompt safeguard overrides.
 * @public
 */
export interface IPromptSafeguardOverrides {
  /** Override the default max length for this prompt's slots. */
  readonly defaultMaxLength?: number;
  /** Skip injection screening for this prompt. */
  readonly skipInjectionScreening?: boolean;
}

/**
 * A prompt descriptor: metadata + slot definitions + output contract.
 * @public
 */
export interface IPromptDescriptor {
  /** The unique prompt identifier. */
  readonly id: PromptId;
  /** Human-readable title. */
  readonly title: string;
  /** Optional description. */
  readonly description?: string;
  /** Schema version. Always '1' for v0.1. */
  readonly schemaVersion: '1';
  /** The surface this prompt targets (open; consumer-narrowed). */
  readonly surface: string;
  /** Qualifier axis metadata. */
  readonly qualifiers?: IPromptQualifierMetadata;
  /** The slots this prompt exposes. */
  readonly slots: ReadonlyArray<IPromptSlot>;
  /** The output contract. */
  readonly output: PromptOutputContract;
  /** Join policy for partial candidate composition. */
  readonly join?: IPromptJoinPolicy;
  /** Per-prompt safeguard overrides. */
  readonly safeguards?: IPromptSafeguardOverrides;
  /** Optional examples. */
  readonly examples?: ReadonlyArray<IPromptExampleSet>;
  /** Output validation ids to run after the converter. */
  readonly outputValidations?: ReadonlyArray<ValidatorId>;
}

/**
 * A single prompt candidate stored in a record.
 * @public
 */
export interface IPromptCandidateRecord {
  /**
   * Full ts-res ConditionSetDecl shape (record-sugar, record-with-details, or array form).
   * Empty `{}` means unconditional base.
   */
  readonly conditions: ConditionSetDecl;
  /**
   * When true, this candidate layers under more-specific candidates.
   * When false or omitted, this candidate terminates the composition chain.
   */
  readonly isPartial?: boolean;
  /** The Mustache template body (must use triple-brace tokens). */
  readonly body: string;
}

/**
 * A stored prompt record: scope + descriptor + candidates.
 * @public
 */
export interface IStoredPromptRecord {
  /** The scope this record belongs to. */
  readonly scope: ScopeKey;
  /** The prompt identifier. */
  readonly id: PromptId;
  /** The prompt descriptor. */
  readonly descriptor: IPromptDescriptor;
  /** The candidate bodies with conditions. */
  readonly candidates: ReadonlyArray<IPromptCandidateRecord>;
}

/**
 * A resolve request to PromptLibrary.resolve.
 * @public
 */
export interface IPromptResolveRequest {
  /** The prompt to resolve. */
  readonly id: PromptId;
  /** Scope chain, most-specific to most-general. */
  readonly chain: ReadonlyArray<ScopeKey>;
  /** Qualifier context for candidate selection. */
  readonly qualifiers: IQualifierContext;
  /** Caller-supplied slot substitutions. */
  readonly substitutions?: PromptSubstitutions;
}

/**
 * A resolved prompt: body + descriptor + trace.
 * @public
 */
export interface IResolvedPrompt {
  /** The prompt id. */
  readonly id: PromptId;
  /** The fully rendered Mustache body. */
  readonly body: string;
  /** The prompt descriptor. */
  readonly descriptor: IPromptDescriptor;
  /** Resolution trace. */
  readonly trace: IPromptResolveTrace;
}

/**
 * Trace entry for a resolved slot binding.
 * @public
 */
export interface IBindingTraceEntry {
  /** Where the winning binding came from. */
  readonly source: 'caller-sub' | 'binding' | 'default' | 'empty';
  /** Winning scope, when source === 'binding'. */
  readonly winningScope?: ScopeKey;
  /** The directive of the winning binding. */
  readonly directive: SlotDirective;
  /** The slot value (post-serialization, pre-Mustache). */
  readonly value: string;
  /** True if the merged binding had enforced:true and a caller-sub was rejected. */
  readonly wasEnforced: boolean;
}

/**
 * Trace entry for a resource-binding resolution.
 * @public
 */
export interface IResourceBindingTraceEntry {
  /** The slot being filled by this resource binding. */
  readonly slot: SlotName;
  /** The resource id resolved. */
  readonly resourceId: ResourceId;
  /** Nesting depth (root resolve = 0). */
  readonly depth: number;
  /** Whether substitutions were replaced or inherited. */
  readonly substitutionMode: ResourceSubstitutionMode;
  /** Recursive trace for the inner resolve. */
  readonly innerTrace: IPromptResolveTrace;
}

/**
 * Per-candidate match trace entry.
 * @public
 */
export interface ICandidateMatchTraceEntry {
  /** Index into the record's candidates array. */
  readonly candidateIndex: number;
  /** ts-res match disposition. */
  readonly matchType: 'match' | 'matchAsDefault';
  /** Per-condition match details from ts-res. */
  readonly conditions: ReadonlyArray<IConditionMatchResult>;
}

/**
 * A safeguard finding recorded during resolve.
 * @public
 */
export interface ISafeguardFinding {
  /** The slot triggering this finding. */
  readonly slot: SlotName;
  /** The kind of finding. */
  readonly kind: 'max-length' | 'suspicious-pattern' | 'screening-skipped' | 'enforced-override-ignored';
  /** The disposition. */
  readonly disposition: 'warn' | 'reject' | 'info';
  /** Human-readable detail. */
  readonly detail: string;
}

/**
 * Full trace for a prompt resolve.
 * @public
 */
export interface IPromptResolveTrace {
  /** The scope whose record won the chain walk. */
  readonly winningScope: ScopeKey;
  /** All scopes consulted (most-specific first). */
  readonly scopesConsulted: ReadonlyArray<ScopeKey>;
  /** Merged binding decisions per slot. */
  readonly mergedBindings: ReadonlyMap<SlotName, IBindingTraceEntry>;
  /** Resource binding resolution details. */
  readonly resourceBindingResolutions: ReadonlyArray<IResourceBindingTraceEntry>;
  /** Safeguard findings (length cap, regex screen, etc.). */
  readonly safeguardFindings: ReadonlyArray<ISafeguardFinding>;
  /** Per-candidate match dispositions. */
  readonly candidateMatches: ReadonlyArray<ICandidateMatchTraceEntry>;
}

/**
 * Safety policy for the PromptLibrary.
 * @public
 */
export interface IPromptSafetyPolicy {
  /** Default maximum length for slot values. */
  readonly defaultMaxLength: number;
  /** Patterns to scan for suspicious content. */
  readonly suspiciousPatterns: ReadonlyArray<RegExp>;
  /** Slot sources eligible for screening. */
  readonly screenedSources: ReadonlyArray<string>;
  /** What to do when a suspicious pattern matches. */
  readonly onSuspicious: SuspiciousDisposition;
  /** Optional anti-jailbreak preface hook. */
  readonly antiJailbreakPreface?: (descriptor: IPromptDescriptor) => Result<string>;
}

/**
 * A store change-notification event.
 * @public
 */
export interface IPromptStoreEvent {
  /** The kind of change. */
  readonly kind: PromptStoreEventKind;
  /** The affected scope. */
  readonly scope: ScopeKey;
  /** The affected prompt id (set for descriptor-changed / descriptor-removed). */
  readonly id?: PromptId;
}

/**
 * A disposable handle for a watch subscription.
 * @public
 */
export interface IDisposable {
  /** Unsubscribe from the watch. */
  dispose(): void;
}

/**
 * Structural representation of a ts-res qualifier declaration.
 * Matches the shape of `Qualifiers.IQualifierDecl` from `@fgv/ts-res`.
 * @public
 */
export interface IQualifierDecl {
  /** The qualifier name. */
  name: string;
  /** The qualifier type name. */
  typeName: string;
  /** The default priority for this qualifier. */
  defaultPriority: number;
  /** Optional token used in resource paths. */
  token?: string;
  /** Whether the token is optional. */
  tokenIsOptional?: boolean;
  /** Optional default value. */
  defaultValue?: string;
}
