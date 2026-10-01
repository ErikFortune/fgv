/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { AiAssist } from '@fgv/ts-extras';
import {
  Converters,
  Result,
  captureResult,
  fail,
  failWithDetail,
  mapResults,
  succeed,
  succeedWithDetail
} from '@fgv/ts-utils';
import {
  CommandRejectionReason,
  IBoundTaskWriter,
  ICommandReceipt,
  ICommandRequest,
  ITaskCommandHandle,
  ITaskCommandToolSpec,
  ITaskEnvironment,
  ITaskFailure,
  ITaskKindRegistry,
  TaskCommandToolResult,
  TaskFailureCode,
  TaskId,
  TaskInspection,
  TaskResult
} from '../types';
import { ITaskCommandToolArgs, taskCommandSchema } from './schemas';
import {
  IFailureWording,
  IToolContext,
  argumentMessage,
  askView,
  codeLine,
  convertAnswer,
  mintOperationId
} from './toolSupport';
import { IWriterAnswerConverters } from './writerAnswers';

/**
 * The names of the fixed task tools. A generated command tool may not take one, whether or not that
 * tool is offered: a name means one thing in every tool set a host builds.
 * @internal
 */
export const fixedTaskToolNames: ReadonlyArray<string> = [
  'task_query',
  'task_inspect',
  'task_create',
  'task_update',
  'task_reassign',
  'task_stop',
  'task_stop_inspect'
];

/**
 * A tool name every provider accepts: a letter or underscore, then letters, digits, `_` or `-`, at
 * most 64 in all (the intersection of Anthropic's, OpenAI's and Gemini's rules).
 */
const toolNamePattern: RegExp = /^[A-Za-z_][A-Za-z0-9_-]{0,63}$/;

/**
 * What the command tools are built over, beyond what every tool has: the writer — the same binding
 * the view is — and where operation ids come from.
 * @internal
 */
export interface ICommandToolContext extends IToolContext {
  readonly writer: IBoundTaskWriter;
  readonly environment: Pick<ITaskEnvironment, 'newOperationId'>;
  readonly receipts: IWriterAnswerConverters;
}

/** One command a host offered, resolved against the registry at build time. */
interface ICommandTool {
  readonly spec: ITaskCommandToolSpec;
  readonly name: string;
  readonly handle: ITaskCommandHandle;
}

/**
 * What the model is told for every command whose outcome is not known — an `indeterminate` receipt, a
 * receipt that does not convert, a writer that throws, and every writer failure but a refusal of the
 * task itself.
 *
 * @remarks
 * A command's outcome is unknown far more often than a catalog change's: once its intent is recorded
 * the broker may send it later (the host's `resolveCommands` pump), and failures after that point carry
 * ordinary codes — a moved policy is `conflict`, an unreadable policy epoch is `invalid`. A tool cannot
 * tell those from the same codes before anything was recorded, so it does not try.
 *
 * **Not sending it again is the point.** Every call mints a fresh operation id, so a second call is a
 * second command. A `source-key` source deduplicates the *same* key, which is what makes the pump's
 * resend safe; a model's resend carries a new one, and could apply the command twice. A `none`
 * command — or one whose key the source has forgotten — is never resent by the pump at all: a
 * source with a lookup may resolve it by asking; without one it is held until the host abandons it.
 * Either way it is exactly the case a blind resend would duplicate.
 */
const unknownCommandLine: string =
  'the outcome is not known: the command may or may not have been recorded or applied, and the host ' +
  'resolves or abandons any that was — do not send it again; inspect the task later';

/**
 * The wording for a command. Only a refusal of the task itself (`not-found-or-denied`, which the broker
 * decides before recording anything) is a known outcome.
 */
const commandWording: IFailureWording = {
  thrown: unknownCommandLine,
  unclassified: unknownCommandLine,
  unknownLine: unknownCommandLine,
  determinate: ['not-found-or-denied']
};

/**
 * What the model is told for each rejection a receipt carries. A receipt's rejection is a known outcome
 * — nothing was sent, or the source refused it — so a retry after inspecting is safe.
 *
 * @remarks
 * - `denied` reads exactly as a task that is missing or not visible, the line I1a and I1b give every
 *   refusal of authority: telling a model it is not permitted would restore the distinction that line
 *   removed.
 * - `stop-active` reads as `conflict`, whether or not the host offers the stop tools: a latch on a task
 *   can come from a stop on an ancestor this principal cannot see, and no tool's answers change with
 *   which other tools are offered. A model that requested a stop inspects it with `task_stop_inspect`.
 * - `invalid-transition` and `idempotency-conflict` read as `conflict` too: the task does not accept
 *   the command now, and inspecting it says why as far as this principal may see.
 */
const rejectionCodes: Readonly<Record<CommandRejectionReason, TaskFailureCode>> = {
  denied: 'not-found-or-denied',
  unsupported: 'unsupported',
  conflict: 'conflict',
  'invalid-transition': 'conflict',
  'stop-active': 'conflict',
  'idempotency-conflict': 'conflict'
};

const commandAnnotations: AiAssist.IAiToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: true
};

/** The default tool name for a command: provider-safe, under a prefix no fixed tool uses. */
function _defaultName(command: string): string {
  return `task_command_${command.replace(/[^A-Za-z0-9_-]/g, '_')}`;
}

/**
 * Resolves one offered command against the registry. Asks the registry, never the policy: offering a
 * command authorizes nothing.
 */
function _resolve(registry: ITaskKindRegistry, spec: ITaskCommandToolSpec): Result<ICommandTool> {
  return captureResult(() => registry.getCommand(spec.kind, spec.detailVersion, spec.command))
    .onSuccess((handle) => handle)
    .onSuccess((handle) => {
      const name: string = spec.name ?? _defaultName(spec.command);
      if (!toolNamePattern.test(name)) {
        return fail<ICommandTool>(
          `tool name '${name}' is not one every provider accepts (${toolNamePattern.source})`
        );
      }
      return fixedTaskToolNames.includes(name)
        ? fail<ICommandTool>(`tool name '${name}' is a fixed task tool's`)
        : succeed({ spec, name, handle });
    })
    .withErrorFormat((message) => `${spec.kind}@${spec.detailVersion} '${spec.command}': ${message}`);
}

/**
 * Resolves every offered command, refusing the set if two would share a tool name. Two kinds that
 * register a command of the same name clash under the default name, and the host must name one.
 * @internal
 */
export function resolveCommandTools(
  ctx: ICommandToolContext,
  registry: ITaskKindRegistry,
  enable: unknown
): Result<ReadonlyArray<ICommandTool>> {
  const converters = ctx.renderer.converters;
  // Each element is converted by the strict spec converter itself. (`arrayOf` drops an element its
  // item converter turns into `undefined`, so an identity item converter would let `[undefined]`
  // through as an empty offer; a strict object never converts to `undefined`.)
  const spec = Converters.strictObject<ITaskCommandToolSpec>({
    kind: converters.ids.taskKind,
    detailVersion: Converters.number.withConstraint((n) => Number.isSafeInteger(n) && n > 0),
    command: converters.commands.commandName,
    name: Converters.string.optional(),
    description: Converters.string.optional()
  });
  return Converters.arrayOf(spec)
    .convert(enable)
    .onSuccess((specs) => mapResults(specs.map((s) => _resolve(registry, s))))
    .onSuccess((tools) => {
      const seen: Map<string, ITaskCommandToolSpec> = new Map();
      for (const tool of tools) {
        const other: ITaskCommandToolSpec | undefined = seen.get(tool.name);
        if (other !== undefined) {
          return fail<ReadonlyArray<ICommandTool>>(
            `tool name '${tool.name}' is taken by both ${other.kind}@${other.detailVersion} '${other.command}' ` +
              `and ${tool.spec.kind}@${tool.spec.detailVersion} '${tool.spec.command}'; name one of them`
          );
        }
        seen.set(tool.name, tool.spec);
      }
      return succeed(tools);
    })
    .withErrorFormat((message) => `task tools: invalid commands.enable: ${message}`);
}

/**
 * The task must be of the kind and detail version the tool was generated for. A command name is
 * per kind: without this, a tool generated for one kind's command could send another kind's
 * same-named command — one the host never offered. Kind and detail version never change for a task
 * (storage refuses a replacement that changes either), so nothing can move between this read and
 * the command.
 */
function _ofKind(tool: ICommandTool, taskId: TaskId, inspection: TaskInspection): TaskResult<true> {
  const { id, kind, detailVersion } =
    inspection.state === 'resolved' ? inspection.envelope : inspection.reference;
  if (id !== taskId) {
    // Any `IBoundTaskView` may be passed: an inspection of another task is a malformed answer.
    return failWithDetail<true, ITaskFailure>(`the view answered for ${id}, not ${taskId}`, {
      code: 'invalid',
      retry: 'after-host-action'
    });
  }
  return kind === tool.spec.kind && detailVersion === tool.spec.detailVersion
    ? succeedWithDetail<true, ITaskFailure>(true)
    : failWithDetail<true, ITaskFailure>(
        `the task is ${kind}@${detailVersion}, not ${tool.spec.kind}@${tool.spec.detailVersion}`,
        { code: 'unsupported', retry: 'after-host-action' }
      );
}

/**
 * What the model is told a command did. Taken — `accepted` or `applied` — is a result. `accepted` is
 * the broker's receipt as it is: usually the source's answer, but a caller that finds another caller
 * already sending the same intent is handed the intent's provisional `accepted`, whose dispatch may
 * still end `indeterminate` (`docs/TECH_DEBT.md`). Either way the model must not resend it; a rejection is a
 * fixed code line; an `indeterminate` or `abandoned` command is an unknown outcome. Every free-form
 * string a receipt carries — a source's receipt, an indeterminate or abandoned reason — goes to the
 * host's logger and nowhere else.
 */
function _presentCommand(
  ctx: ICommandToolContext,
  tool: string,
  receipt: ICommandReceipt
): TaskResult<Result<TaskCommandToolResult>> {
  const result = receipt.result;
  const told = (value: Result<TaskCommandToolResult>): TaskResult<Result<TaskCommandToolResult>> =>
    succeedWithDetail<Result<TaskCommandToolResult>, ITaskFailure>(value);
  switch (result.state) {
    case 'accepted':
      if (result.sourceReceipt !== undefined) {
        ctx.logger?.info(`${tool}: accepted by the source as ${result.sourceReceipt}`);
      }
      return told(succeed({ taskId: receipt.taskId, state: 'accepted' }));
    case 'applied':
      return told(succeed({ taskId: receipt.taskId, state: 'applied', revision: result.appliedRevision }));
    case 'rejected':
      ctx.logger?.warn(`${tool}: rejected: ${result.reason}`);
      return told(fail(codeLine(tool, rejectionCodes[result.reason])));
    case 'indeterminate':
      ctx.logger?.warn(`${tool}: indeterminate: ${result.reason}`);
      return told(fail(`${tool}: ${unknownCommandLine}`));
    default:
      // Abandoned is not an outcome either: the host stopped tracking a command it could not settle.
      ctx.logger?.warn(`${tool}: abandoned (${result.from}): ${result.reason}`);
      return told(fail(`${tool}: ${unknownCommandLine}`));
  }
}

/**
 * Sends one command: the task must be of this tool's kind, then the writer is asked with a minted
 * operation id and the schema-validated parameters, and its receipt is converted before anything reads it.
 */
async function _send(
  ctx: ICommandToolContext,
  tool: ICommandTool,
  taskId: TaskId,
  args: ITaskCommandToolArgs
): Promise<Result<TaskCommandToolResult>> {
  const name: string = tool.name;
  return (
    await askView(
      ctx,
      name,
      () => ctx.view.inspect(taskId),
      (answer) =>
        convertAnswer(ctx.answers.inspection, answer, "view's inspection").onSuccess((inspection) =>
          _ofKind(tool, taskId, inspection)
        )
    )
  )
    .onSuccess(() => mintOperationId(ctx, ctx.environment, name))
    .onSuccess((operationId) =>
      ctx.renderer.converters.commands.request
        .convert({
          taskId,
          operationId,
          expectedRevision: args.expectedRevision,
          command: tool.handle.name,
          // The parameters exactly as the registered schema accepted them. The writer canonicalizes
          // them — once — through the registered handle's `validate`; encoding here as well would
          // apply an encoder that need not be idempotent twice.
          parameters: args.parameters
        })
        .withErrorFormat((message) => argumentMessage(name, `invalid arguments: ${message}`))
    )
    .thenOnSuccess(async (request: ICommandRequest) => {
      // What the receipt must describe, captured before the writer is handed the request: any
      // `IBoundTaskWriter` may be passed, and one that rewrote the request in place would otherwise
      // move the very identity its receipt is checked against.
      const receipt = ctx.receipts.command({
        taskId: request.taskId,
        operationId: request.operationId,
        command: request.command,
        expectedRevision: request.expectedRevision
      });
      return (
        (
          await askView(
            ctx,
            name,
            () => ctx.writer.execute(request),
            (answer) =>
              convertAnswer(receipt, answer, "writer's receipt", 'commit-indeterminate').onSuccess(
                (receipt) => _presentCommand(ctx, name, receipt)
              ),
            commandWording
          )
        )
          // `_presentCommand` answers with the model-facing result *inside* a success, so that a
          // rejection's fixed line is not re-read by the failure classification as an unclassified
          // writer failure; this unwraps it.
          .onSuccess((told) => told)
      );
    });
}

function _commandTool(ctx: ICommandToolContext, tool: ICommandTool): AiAssist.IAiClientTool {
  const name: string = tool.name;
  const schema = taskCommandSchema(tool.handle.parameters);
  const lead: string =
    tool.spec.description ??
    `Send the '${tool.handle.name}' command to a task of kind ${tool.spec.kind} that you can see.`;
  return {
    config: {
      type: 'client_tool',
      name,
      description:
        `${lead} Pass the revision task_inspect returned. 'accepted' means the command is recorded for ` +
        "the task's executor, not that it has taken effect; 'applied' means it has. If the outcome is " +
        'not known, do not send it again.',
      parametersSchema: schema,
      annotations: commandAnnotations
    },
    // `execute` re-validates: a direct call reaches it without any harness in front.
    execute: async (args: unknown): Promise<Result<unknown>> =>
      schema
        .convert(args)
        .onSuccess((typed) =>
          ctx.renderer.converters.ids.taskId
            .convert(typed.taskId)
            .onSuccess((taskId) => succeed({ typed, taskId }))
        )
        .withErrorFormat((message) => argumentMessage(name, `invalid arguments: ${message}`))
        .thenOnSuccess(({ typed, taskId }) => _send(ctx, tool, taskId, typed))
  };
}

/**
 * The command tools a host offered, in the order it offered them.
 * @internal
 */
export function commandTools(
  ctx: ICommandToolContext,
  tools: ReadonlyArray<ICommandTool>
): ReadonlyArray<AiAssist.IAiClientTool> {
  return tools.map((tool) => _commandTool(ctx, tool));
}
