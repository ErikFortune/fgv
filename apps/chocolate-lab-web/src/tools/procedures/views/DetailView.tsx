import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeftIcon, PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import {
  Editing,
  Converters as ChocolateConverters,
  Entities,
  type BaseProcedureId,
  type ProcedureId,
  type SourceId,
  type TaskId
} from '@fgv/ts-chocolate';
import { useRuntime } from '../../../contexts/RuntimeContext';
import { KeyValueTableEditor, LoadingSpinner, Modal, type IKeyValueRow } from '../../../components/common';
import { Mustache as MustacheModule } from '@fgv/ts-extras';
import { useEditing } from '../../../contexts/EditingContext';
import { useSettings } from '../../../contexts/SettingsContext';

export interface IDetailViewProps {
  procedureId: ProcedureId;
  onBack: () => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTaskRef(invocation: unknown): invocation is { taskId: TaskId; params: Record<string, unknown> } {
  return isRecord(invocation) && 'taskId' in invocation;
}

function isInlineTask(invocation: unknown): invocation is {
  task: { template: string; defaults?: Record<string, unknown> };
  params: Record<string, unknown>;
} {
  return isRecord(invocation) && 'task' in invocation;
}

function getProcedureSourceId(id: ProcedureId): SourceId {
  return ((id as string).split('.')[0] ?? '') as SourceId;
}

function getProcedureBaseId(id: ProcedureId): BaseProcedureId {
  const parts = (id as string).split('.');
  return ((parts.length > 1 ? parts.slice(1).join('.') : parts[0]) ?? '') as BaseProcedureId;
}

function generateUniqueBaseId(baseId: string, existing: ReadonlySet<string>): string {
  if (!existing.has(baseId)) {
    return baseId;
  }
  let i = 1;
  while (true) {
    const candidate = `${baseId}-copy${i === 1 ? '' : `-${i}`}`;
    if (!existing.has(candidate)) {
      return candidate;
    }
    i += 1;
  }
}

function sanitizeBaseTaskId(value: string): string {
  const sanitized = value
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
  return sanitized.length > 0 ? sanitized : 'task';
}

function parsePrimitiveValue(text: string): unknown {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return '';
  }
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  const asNumber = Number(trimmed);
  if (Number.isFinite(asNumber) && String(asNumber) === trimmed) {
    return asNumber;
  }
  return trimmed;
}

function paramsToRows(params: Record<string, unknown> | undefined): IKeyValueRow[] {
  if (!params) {
    return [];
  }
  const entries = Object.entries(params);
  return entries.map(([k, v]) => ({ key: k, value: v === undefined || v === null ? '' : String(v) }));
}

function rowsToRenderParams(rows: ReadonlyArray<IKeyValueRow>): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const row of rows) {
    const key = row.key.trim();
    const valueText = row.value.trim();
    if (key.length === 0 || valueText.length === 0) {
      continue;
    }
    const parsed = parsePrimitiveValue(valueText);
    if (parsed === '' || parsed === undefined || parsed === null) {
      continue;
    }
    obj[key] = parsed;
  }
  return obj;
}

function omitEmptyStringValues(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === '' || v === undefined || v === null) {
      continue;
    }
    out[k] = v;
  }
  return out;
}

export function DetailView({ procedureId, onBack }: IDetailViewProps): React.ReactElement {
  const { runtime, loadingState, dataVersion } = useRuntime();
  const { commitProcedureCollection, commitTaskCollection } = useEditing();
  const { settings } = useSettings();

  const [showRendered, setShowRendered] = useState(true);
  const [contextRows, setContextRows] = useState<IKeyValueRow[]>([]);
  const [autoContextKeys, setAutoContextKeys] = useState<ReadonlyArray<string>>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [draftProcedure, setDraftProcedure] = useState<Record<string, unknown> | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [addStepSearch, setAddStepSearch] = useState('');

  const [showPromoteTaskModal, setShowPromoteTaskModal] = useState(false);
  const [promoteTaskTargetCollectionId, setPromoteTaskTargetCollectionId] = useState<SourceId | null>(null);
  const [promoteTaskName, setPromoteTaskName] = useState('');
  const [promoteTaskBaseId, setPromoteTaskBaseId] = useState('');
  const [isPromoteTaskIdManuallyEdited, setIsPromoteTaskIdManuallyEdited] = useState(false);
  const [isPromotingTask, setIsPromotingTask] = useState(false);
  const [promoteTaskError, setPromoteTaskError] = useState<string | null>(null);

  const [showPromoteInlineModal, setShowPromoteInlineModal] = useState(false);
  const [promoteInlineTargetCollectionId, setPromoteInlineTargetCollectionId] = useState<SourceId | null>(
    null
  );
  const [promoteInlineName, setPromoteInlineName] = useState('');
  const [promoteInlineBaseId, setPromoteInlineBaseId] = useState('');
  const [isPromoteInlineIdManuallyEdited, setIsPromoteInlineIdManuallyEdited] = useState(false);
  const [isPromotingInline, setIsPromotingInline] = useState(false);
  const [promoteInlineError, setPromoteInlineError] = useState<string | null>(null);

  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneTargetCollectionId, setCloneTargetCollectionId] = useState<SourceId | null>(null);
  const [cloneBaseId, setCloneBaseId] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [cloneError, setCloneError] = useState<string | null>(null);

  const [selectedStepOrder, setSelectedStepOrder] = useState<number | null>(null);
  const [stepParamsRows, setStepParamsRows] = useState<IKeyValueRow[]>([]);
  const [autoStepParamKeys, setAutoStepParamKeys] = useState<ReadonlyArray<string>>([]);
  const [stepNotes, setStepNotes] = useState('');
  const [stepActiveTime, setStepActiveTime] = useState<string>('');
  const [stepWaitTime, setStepWaitTime] = useState<string>('');
  const [stepHoldTime, setStepHoldTime] = useState<string>('');
  const [stepTemperature, setStepTemperature] = useState<string>('');
  const [stepTaskId, setStepTaskId] = useState('');
  const [stepTemplate, setStepTemplate] = useState('');

  const runtimeProcedureResult = useMemo(() => {
    void dataVersion;
    if (!runtime) {
      return null;
    }
    return runtime.getRuntimeProcedure(procedureId);
  }, [dataVersion, procedureId, runtime]);

  const runtimeProcedure = runtimeProcedureResult?.isSuccess() ? runtimeProcedureResult.value : null;

  const sourceId = useMemo(() => getProcedureSourceId(procedureId), [procedureId]);
  const baseId = useMemo(() => getProcedureBaseId(procedureId), [procedureId]);

  const collectionEntryResult = useMemo(() => {
    if (!runtime) {
      return null;
    }
    return runtime.library.procedures.collections.get(sourceId).asResult;
  }, [runtime, sourceId]);

  const canEdit = useMemo(() => {
    const entry = collectionEntryResult?.isSuccess() ? collectionEntryResult.value : null;
    if (!entry) {
      return false;
    }
    const unlocked = settings.collections[sourceId]?.unlocked !== false;
    return entry.isMutable && unlocked;
  }, [collectionEntryResult, settings.collections, sourceId]);

  const mutableCollectionIds = useMemo((): ReadonlyArray<SourceId> => {
    if (!runtime) {
      return [];
    }
    const ids = Array.from(runtime.library.procedures.collections.keys()) as SourceId[];
    return ids
      .filter((id) => {
        const result = runtime.library.procedures.collections.get(id);
        return result.isSuccess() && !!result.value && result.value.isMutable;
      })
      .filter((id) => settings.collections[id]?.unlocked !== false);
  }, [runtime, settings.collections]);

  const mutableTaskCollectionIds = useMemo((): ReadonlyArray<SourceId> => {
    if (!runtime) {
      return [];
    }
    const ids = Array.from(runtime.library.tasks.collections.keys()) as SourceId[];
    return ids
      .filter((id) => {
        const result = runtime.library.tasks.collections.get(id);
        return result.isSuccess() && !!result.value && result.value.isMutable;
      })
      .filter((id) => settings.collections[id]?.unlocked !== false);
  }, [runtime, settings.collections]);

  const displayProcedure = useMemo(() => {
    if (isEditing && draftProcedure) {
      return draftProcedure;
    }
    if (!runtimeProcedure) {
      return null;
    }
    return runtimeProcedure.raw as unknown as Record<string, unknown>;
  }, [draftProcedure, isEditing, runtimeProcedure]);

  const displaySteps = useMemo((): ReadonlyArray<Record<string, unknown>> => {
    if (!displayProcedure) {
      return [];
    }
    const steps = displayProcedure.steps;
    if (Array.isArray(steps)) {
      return steps.filter((s) => isRecord(s)) as ReadonlyArray<Record<string, unknown>>;
    }
    return [];
  }, [displayProcedure]);

  const beginEdit = useCallback(() => {
    if (!runtimeProcedure) {
      return;
    }
    setSaveError(null);
    setIsEditing(true);
    const raw = runtimeProcedure.raw as unknown as Record<string, unknown>;
    const copiedSteps = Array.isArray(raw.steps)
      ? raw.steps
          .filter((s) => isRecord(s))
          .map((s) => {
            const step = s as Record<string, unknown>;
            const task = step.task;
            const taskCopy = isRecord(task) ? { ...task } : task;
            return { ...step, task: taskCopy };
          })
      : [];
    setDraftProcedure({ ...raw, steps: copiedSteps });
  }, [runtimeProcedure]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setDraftProcedure(null);
    setSaveError(null);
  }, []);

  const updateDraftStep = useCallback(
    (order: number, updater: (prev: Record<string, unknown>) => Record<string, unknown>): void => {
      setDraftProcedure((prev) => {
        if (!prev) {
          return prev;
        }
        const stepsValue = prev.steps;
        if (!Array.isArray(stepsValue)) {
          return prev;
        }

        const steps = stepsValue.map((s) => {
          if (!isRecord(s)) {
            return s;
          }
          const step = s as Record<string, unknown>;
          const stepOrder = typeof step.order === 'number' ? step.order : 0;
          if (stepOrder !== order) {
            return step;
          }
          return updater(step);
        });
        return { ...prev, steps };
      });
    },
    []
  );

  const normalizeStepOrders = useCallback(
    (steps: ReadonlyArray<Record<string, unknown>>): Record<string, unknown>[] => {
      return steps.map((s, index) => ({ ...s, order: index + 1 }));
    },
    []
  );

  const addBlankStep = useCallback(() => {
    if (!isEditing) {
      return;
    }
    setDraftProcedure((prev) => {
      if (!prev) {
        return prev;
      }
      const stepsValue = prev.steps;
      const existing = Array.isArray(stepsValue)
        ? (stepsValue.filter((s) => isRecord(s)) as ReadonlyArray<Record<string, unknown>>)
        : [];

      const nextOrder = existing.length + 1;
      const newStep: Record<string, unknown> = {
        order: nextOrder,
        task: {
          task: { baseId: `step-${nextOrder}`, name: `Step ${nextOrder}`, template: '' },
          params: {}
        },
        notes: ''
      };
      const normalized = normalizeStepOrders([...existing, newStep]);
      return { ...prev, steps: normalized };
    });
    setSelectedStepOrder(displaySteps.length + 1);
  }, [displaySteps.length, isEditing, normalizeStepOrders]);

  const allTasks = useMemo((): ReadonlyArray<{ id: TaskId; name: string; template: string }> => {
    void dataVersion;
    if (!runtime) {
      return [];
    }
    return Array.from(runtime.library.tasks.entries())
      .map(([id, task]) => ({ id: id as TaskId, name: task.name, template: task.template }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [dataVersion, runtime]);

  const filteredTasks = useMemo((): ReadonlyArray<{ id: TaskId; name: string; template: string }> => {
    if (!addStepSearch.trim()) {
      return allTasks;
    }
    const q = addStepSearch.trim().toLowerCase();
    return allTasks.filter((t) => {
      return t.name.toLowerCase().includes(q) || (t.id as string).toLowerCase().includes(q);
    });
  }, [addStepSearch, allTasks]);

  const addTaskRefStep = useCallback(
    (taskId: TaskId) => {
      if (!isEditing) {
        return;
      }
      setDraftProcedure((prev) => {
        if (!prev) {
          return prev;
        }
        const stepsValue = prev.steps;
        const existing = Array.isArray(stepsValue)
          ? (stepsValue.filter((s) => isRecord(s)) as ReadonlyArray<Record<string, unknown>>)
          : [];

        const nextOrder = existing.length + 1;
        const newStep: Record<string, unknown> = {
          order: nextOrder,
          task: {
            taskId,
            params: {}
          },
          notes: ''
        };

        const normalized = normalizeStepOrders([...existing, newStep]);
        return { ...prev, steps: normalized };
      });
      setSelectedStepOrder(displaySteps.length + 1);
      setShowAddStepModal(false);
      setAddStepSearch('');
    },
    [displaySteps.length, isEditing, normalizeStepOrders]
  );

  const removeSelectedStep = useCallback(() => {
    if (!isEditing || selectedStepOrder === null) {
      return;
    }
    setDraftProcedure((prev) => {
      if (!prev) {
        return prev;
      }
      const stepsValue = prev.steps;
      const existing = Array.isArray(stepsValue)
        ? (stepsValue.filter((s) => isRecord(s)) as ReadonlyArray<Record<string, unknown>>)
        : [];
      const filtered = existing.filter((s) => (s.order as number) !== selectedStepOrder);
      return { ...prev, steps: normalizeStepOrders(filtered) };
    });
    setSelectedStepOrder(null);
  }, [isEditing, normalizeStepOrders, selectedStepOrder]);

  const handleSave = useCallback(() => {
    if (!runtime || !runtimeProcedure || !draftProcedure) {
      return;
    }
    if (!canEdit) {
      setSaveError('This procedure is read-only');
      return;
    }
    const entry = collectionEntryResult?.isSuccess() ? collectionEntryResult.value : null;
    if (!entry) {
      setSaveError(`Collection "${sourceId}" not found`);
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const validateResult = Entities.Procedures.Converters.procedureData.convert(draftProcedure);
      if (validateResult.isFailure()) {
        setSaveError(validateResult.message);
        setIsSaving(false);
        return;
      }

      const validator = entry.items.validating as unknown as {
        set: (key: string, value: unknown) => { asResult: { isFailure(): boolean; message: string } };
      };

      const updateResult = validator.set(baseId as unknown as string, validateResult.value).asResult;
      if (updateResult.isFailure()) {
        setSaveError(updateResult.message);
        setIsSaving(false);
        return;
      }

      void (async () => {
        const commitResult = await commitProcedureCollection(sourceId);
        if (commitResult.isFailure()) {
          setSaveError(commitResult.message);
          setIsSaving(false);
          return;
        }

        setIsSaving(false);
        setIsEditing(false);
        setDraftProcedure(null);
      })();
    } catch (e) {
      setSaveError(`Save failed: ${e instanceof Error ? e.message : String(e)}`);
      setIsSaving(false);
    }
  }, [
    baseId,
    canEdit,
    collectionEntryResult,
    commitProcedureCollection,
    draftProcedure,
    runtime,
    runtimeProcedure,
    sourceId
  ]);

  useEffect(() => {
    if (!showCloneModal) {
      return;
    }
    if (mutableCollectionIds.length === 0) {
      return;
    }
    if (cloneTargetCollectionId && mutableCollectionIds.includes(cloneTargetCollectionId)) {
      return;
    }
    setCloneTargetCollectionId(mutableCollectionIds[0]);
  }, [cloneTargetCollectionId, mutableCollectionIds, showCloneModal]);

  const existingTargetBaseIds = useMemo((): ReadonlySet<string> => {
    if (!runtime || !cloneTargetCollectionId) {
      return new Set();
    }
    const collectionResult = runtime.library.procedures.collections.get(cloneTargetCollectionId).asResult;
    if (collectionResult.isFailure()) {
      return new Set();
    }
    return new Set(Array.from(collectionResult.value.items.keys()) as string[]);
  }, [cloneTargetCollectionId, runtime]);

  useEffect(() => {
    if (!showCloneModal) {
      return;
    }
    const suggested = generateUniqueBaseId(baseId as unknown as string, existingTargetBaseIds);
    setCloneBaseId(suggested);
  }, [baseId, existingTargetBaseIds, showCloneModal]);

  const handleClone = useCallback(() => {
    if (!runtime || !runtimeProcedure) {
      return;
    }
    if (!cloneTargetCollectionId) {
      setCloneError('Select a target collection');
      return;
    }

    setIsCloning(true);
    setCloneError(null);

    try {
      const idResult = ChocolateConverters.baseProcedureId.convert(cloneBaseId);
      if (idResult.isFailure()) {
        setCloneError(`Invalid procedure ID: ${idResult.message}`);
        setIsCloning(false);
        return;
      }
      const validatedBaseId = idResult.value;

      const collectionResult = runtime.library.procedures.collections.get(cloneTargetCollectionId).asResult;
      if (collectionResult.isFailure()) {
        setCloneError(`Collection "${cloneTargetCollectionId}" not found`);
        setIsCloning(false);
        return;
      }
      const entry = collectionResult.value;
      if (!entry.isMutable) {
        setCloneError(`Collection "${cloneTargetCollectionId}" is not mutable`);
        setIsCloning(false);
        return;
      }
      if (settings.collections[cloneTargetCollectionId]?.unlocked === false) {
        setCloneError(`Collection "${cloneTargetCollectionId}" is locked`);
        setIsCloning(false);
        return;
      }

      const raw = runtimeProcedure.raw as unknown as Record<string, unknown>;
      const cloned: Record<string, unknown> = {
        ...raw,
        baseId: validatedBaseId
      };

      const validateResult = Entities.Procedures.Converters.procedureData.convert(cloned);
      if (validateResult.isFailure()) {
        setCloneError(validateResult.message);
        setIsCloning(false);
        return;
      }

      const addResult = entry.items.validating.add(
        validatedBaseId as unknown as string,
        validateResult.value
      ).asResult;
      if (addResult.isFailure()) {
        setCloneError(addResult.message);
        setIsCloning(false);
        return;
      }

      void (async () => {
        const commitResult = await commitProcedureCollection(cloneTargetCollectionId);
        if (commitResult.isFailure()) {
          setCloneError(commitResult.message);
          setIsCloning(false);
          return;
        }

        setIsCloning(false);
        setShowCloneModal(false);
      })();
    } catch (e) {
      setCloneError(`Clone failed: ${e instanceof Error ? e.message : String(e)}`);
      setIsCloning(false);
    }
  }, [
    cloneBaseId,
    cloneTargetCollectionId,
    commitProcedureCollection,
    runtime,
    runtimeProcedure,
    settings.collections
  ]);

  const requiredContextVars = useMemo((): ReadonlyArray<string> => {
    if (!runtimeProcedure || !runtime) {
      return [];
    }

    const vars = new Set<string>();
    for (const step of displaySteps) {
      const invocation = (step as { task: unknown }).task;
      if (isTaskRef(invocation)) {
        const taskResult = runtime.getRuntimeTask((invocation as { taskId: TaskId }).taskId);
        if (taskResult.isSuccess()) {
          for (const v of taskResult.value.requiredVariables) {
            vars.add(v);
          }
        }
      } else if (isInlineTask(invocation)) {
        const parsed = MustacheModule.MustacheTemplate.create(
          (invocation as { task: { template: string } }).task.template
        );
        if (parsed.isSuccess()) {
          for (const v of parsed.value.extractVariableNames()) {
            vars.add(v);
          }
        }
      }
    }

    return Array.from(vars.values()).sort((a, b) => a.localeCompare(b));
  }, [displaySteps, runtime, runtimeProcedure]);

  useEffect(() => {
    if (requiredContextVars.length === 0) {
      return;
    }

    const requiredSet = new Set(requiredContextVars);
    setAutoContextKeys((prev) => prev.filter((k) => requiredSet.has(k)));

    const autoSet = new Set(autoContextKeys);
    setContextRows((prev) => {
      const nextRows = prev.filter((r) => {
        const key = r.key.trim();
        if (key.length === 0) {
          return true;
        }
        const isRequired = requiredSet.has(key);
        const isAuto = autoSet.has(key);
        const isBlank = r.value.trim().length === 0;
        return isRequired || !isAuto || !isBlank;
      });

      const existingKeys = new Set(nextRows.map((r) => r.key.trim()).filter((k) => k.length > 0));
      const missing = requiredContextVars.filter((v) => !existingKeys.has(v));
      if (missing.length === 0) {
        return nextRows;
      }

      setAutoContextKeys((prevKeys) => {
        const combined = new Set(prevKeys);
        for (const m of missing) {
          combined.add(m);
        }
        return Array.from(combined.values());
      });

      return [...nextRows, ...missing.map((v) => ({ key: v, value: '' }))];
    });
  }, [autoContextKeys, requiredContextVars]);

  useEffect(() => {
    if (requiredContextVars.length !== 0) {
      return;
    }

    if (autoContextKeys.length === 0) {
      return;
    }

    setContextRows((prev) => {
      const autoSet = new Set(autoContextKeys);
      return prev.filter((r) => {
        const key = r.key.trim();
        if (key.length === 0) {
          return true;
        }
        const isAuto = autoSet.has(key);
        const isBlank = r.value.trim().length === 0;
        return !isAuto || !isBlank;
      });
    });
    setAutoContextKeys([]);
  }, [autoContextKeys, requiredContextVars.length]);

  const contextParams = useMemo((): Record<string, unknown> => {
    return rowsToRenderParams(contextRows);
  }, [contextRows]);

  const selectedStep = useMemo(() => {
    if (selectedStepOrder === null) {
      return null;
    }

    return displaySteps.find((s) => (s as { order: number }).order === selectedStepOrder) ?? null;
  }, [displaySteps, selectedStepOrder]);

  const selectedInvocation = useMemo(() => {
    if (!selectedStep) {
      return null;
    }
    return (selectedStep as { task: unknown }).task;
  }, [selectedStep]);

  const selectedTaskId = useMemo((): TaskId | null => {
    if (!selectedInvocation || !isTaskRef(selectedInvocation)) {
      return null;
    }
    return (selectedInvocation as { taskId: TaskId }).taskId;
  }, [selectedInvocation]);

  const selectedInlineTask = useMemo((): Record<string, unknown> | null => {
    if (!selectedInvocation || !isInlineTask(selectedInvocation)) {
      return null;
    }
    const task = (selectedInvocation as { task: unknown }).task;
    return isRecord(task) ? (task as Record<string, unknown>) : null;
  }, [selectedInvocation]);

  const selectedTaskTemplate = useMemo((): string => {
    if (!runtime || !selectedInvocation || !isTaskRef(selectedInvocation)) {
      return '';
    }
    const taskId = (selectedInvocation as { taskId: TaskId }).taskId;
    const taskResult = runtime.getRuntimeTask(taskId);
    return taskResult.isSuccess() ? taskResult.value.template : '';
  }, [runtime, selectedInvocation]);

  const requiredStepVars = useMemo((): ReadonlyArray<string> => {
    if (!selectedInvocation || !runtime) {
      return [];
    }

    if (isTaskRef(selectedInvocation)) {
      const taskResult = runtime.getRuntimeTask((selectedInvocation as { taskId: TaskId }).taskId);
      if (taskResult.isSuccess()) {
        return taskResult.value.requiredVariables;
      }
      return [];
    }

    if (isInlineTask(selectedInvocation)) {
      const template = String((selectedInvocation as { task: { template: string } }).task.template ?? '');
      const parsed = MustacheModule.MustacheTemplate.create(template);
      if (parsed.isSuccess()) {
        return parsed.value.extractVariableNames();
      }
      return [];
    }

    return [];
  }, [runtime, selectedInvocation]);

  useEffect(() => {
    if (!selectedStep) {
      setStepParamsRows([]);
      setAutoStepParamKeys([]);
      setStepNotes('');
      setStepActiveTime('');
      setStepWaitTime('');
      setStepHoldTime('');
      setStepTemperature('');
      setStepTaskId('');
      setStepTemplate('');
      return;
    }

    const invocation = (selectedStep as { task: unknown }).task;
    if (isTaskRef(invocation)) {
      setStepParamsRows(paramsToRows((invocation as { params?: Record<string, unknown> }).params ?? {}));
      setStepTaskId(String((invocation as { taskId?: unknown }).taskId ?? ''));
      setStepTemplate('');
    } else if (isInlineTask(invocation)) {
      setStepParamsRows(paramsToRows((invocation as { params?: Record<string, unknown> }).params ?? {}));
      setStepTaskId('');
      setStepTemplate(
        String(((invocation as { task?: { template?: unknown } }).task?.template as unknown) ?? '')
      );
    } else {
      setStepParamsRows([]);
      setStepTaskId('');
      setStepTemplate('');
    }

    setStepNotes((selectedStep as { notes?: string }).notes ?? '');
    setStepActiveTime((selectedStep as { activeTime?: number }).activeTime?.toString() ?? '');
    setStepWaitTime((selectedStep as { waitTime?: number }).waitTime?.toString() ?? '');
    setStepHoldTime((selectedStep as { holdTime?: number }).holdTime?.toString() ?? '');
    setStepTemperature((selectedStep as { temperature?: number }).temperature?.toString() ?? '');
  }, [selectedStep]);

  useEffect(() => {
    if (!selectedStep || requiredStepVars.length === 0) {
      return;
    }

    const requiredSet = new Set(requiredStepVars);
    setAutoStepParamKeys((prev) => prev.filter((k) => requiredSet.has(k)));

    const autoSet = new Set(autoStepParamKeys);
    setStepParamsRows((prev) => {
      const nextRows = prev.filter((r) => {
        const key = r.key.trim();
        if (key.length === 0) {
          return true;
        }
        const isRequired = requiredSet.has(key);
        const isAuto = autoSet.has(key);
        const isBlank = r.value.trim().length === 0;
        return isRequired || !isAuto || !isBlank;
      });

      const existingKeys = new Set(nextRows.map((r) => r.key.trim()).filter((k) => k.length > 0));
      const missing = requiredStepVars.filter((v) => !existingKeys.has(v));
      if (missing.length === 0) {
        return nextRows;
      }

      setAutoStepParamKeys((prevKeys) => {
        const combined = new Set(prevKeys);
        for (const m of missing) {
          combined.add(m);
        }
        return Array.from(combined.values());
      });

      return [...nextRows, ...missing.map((v) => ({ key: v, value: '' }))];
    });
  }, [autoStepParamKeys, requiredStepVars, selectedStep]);

  const convertSelectedToInline = useCallback(() => {
    if (!runtime || !isEditing || selectedStepOrder === null) {
      return;
    }
    if (!selectedInvocation || !isTaskRef(selectedInvocation)) {
      return;
    }

    const taskId = (selectedInvocation as { taskId: TaskId }).taskId;
    const taskResult = runtime.getRuntimeTask(taskId);

    const template = taskResult.isSuccess() ? taskResult.value.template : '';
    const name = taskResult.isSuccess() ? taskResult.value.name : `Step ${selectedStepOrder}`;
    const defaults = taskResult.isSuccess() ? taskResult.value.defaults : undefined;
    const defaultActiveTime = taskResult.isSuccess() ? taskResult.value.defaultActiveTime : undefined;
    const defaultWaitTime = taskResult.isSuccess() ? taskResult.value.defaultWaitTime : undefined;
    const defaultHoldTime = taskResult.isSuccess() ? taskResult.value.defaultHoldTime : undefined;
    const defaultTemperature = taskResult.isSuccess() ? taskResult.value.defaultTemperature : undefined;
    const notes = taskResult.isSuccess() ? taskResult.value.notes : undefined;
    const tags = taskResult.isSuccess() ? taskResult.value.tags : undefined;

    const params = (selectedInvocation as { params?: Record<string, unknown> }).params ?? {};
    const syntheticBaseId = sanitizeBaseTaskId(`${procedureId as string}-step-${selectedStepOrder}`);

    updateDraftStep(selectedStepOrder, (prev) => {
      return {
        ...prev,
        task: {
          task: {
            baseId: syntheticBaseId,
            name,
            template,
            defaults,
            defaultActiveTime,
            defaultWaitTime,
            defaultHoldTime,
            defaultTemperature,
            notes,
            tags
          },
          params
        }
      };
    });
    setStepTaskId('');
    setStepTemplate(template);
  }, [isEditing, procedureId, runtime, selectedInvocation, selectedStepOrder, updateDraftStep]);

  useEffect(() => {
    if (!showPromoteTaskModal) {
      return;
    }
    if (mutableTaskCollectionIds.length === 0) {
      return;
    }
    if (promoteTaskTargetCollectionId && mutableTaskCollectionIds.includes(promoteTaskTargetCollectionId)) {
      return;
    }
    setPromoteTaskTargetCollectionId(mutableTaskCollectionIds[0]);
  }, [mutableTaskCollectionIds, promoteTaskTargetCollectionId, showPromoteTaskModal]);

  useEffect(() => {
    if (!showPromoteTaskModal) {
      return;
    }
    if (!runtime || !selectedTaskId) {
      setPromoteTaskName('');
      setIsPromoteTaskIdManuallyEdited(false);
      return;
    }
    const taskResult = runtime.getRuntimeTask(selectedTaskId);
    if (taskResult.isFailure()) {
      setPromoteTaskName('');
      setIsPromoteTaskIdManuallyEdited(false);
      return;
    }
    setPromoteTaskName(taskResult.value.name);
    setIsPromoteTaskIdManuallyEdited(false);
  }, [runtime, selectedTaskId, showPromoteTaskModal]);

  const existingPromoteTaskBaseIds = useMemo((): ReadonlySet<string> => {
    if (!runtime || !promoteTaskTargetCollectionId) {
      return new Set();
    }
    const collectionResult = runtime.library.tasks.collections.get(promoteTaskTargetCollectionId).asResult;
    if (collectionResult.isFailure()) {
      return new Set();
    }
    return new Set(Array.from(collectionResult.value.items.keys()) as string[]);
  }, [promoteTaskTargetCollectionId, runtime]);

  const derivedPromoteTaskBaseId = useMemo((): string => {
    if (isPromoteTaskIdManuallyEdited) {
      return promoteTaskBaseId;
    }
    const trimmedName = promoteTaskName.trim();
    if (trimmedName.length === 0) {
      return '';
    }
    const deriveResult = Editing.Helpers.generateUniqueBaseIdFromName(
      trimmedName,
      Array.from(existingPromoteTaskBaseIds)
    );
    return deriveResult.isSuccess() ? (deriveResult.value as string) : '';
  }, [existingPromoteTaskBaseIds, isPromoteTaskIdManuallyEdited, promoteTaskBaseId, promoteTaskName]);

  useEffect(() => {
    if (!showPromoteTaskModal) {
      return;
    }
    if (!isPromoteTaskIdManuallyEdited) {
      setPromoteTaskBaseId(derivedPromoteTaskBaseId);
    }
  }, [derivedPromoteTaskBaseId, isPromoteTaskIdManuallyEdited, showPromoteTaskModal]);

  useEffect(() => {
    if (!showPromoteInlineModal) {
      return;
    }
    if (mutableTaskCollectionIds.length === 0) {
      return;
    }
    if (
      promoteInlineTargetCollectionId &&
      mutableTaskCollectionIds.includes(promoteInlineTargetCollectionId)
    ) {
      return;
    }
    setPromoteInlineTargetCollectionId(mutableTaskCollectionIds[0]);
  }, [mutableTaskCollectionIds, promoteInlineTargetCollectionId, showPromoteInlineModal]);

  useEffect(() => {
    if (!showPromoteInlineModal) {
      return;
    }
    if (!selectedInlineTask || selectedStepOrder === null) {
      setPromoteInlineName('');
      setIsPromoteInlineIdManuallyEdited(false);
      return;
    }
    setPromoteInlineName(String(selectedInlineTask.name ?? `Step ${selectedStepOrder}`));
    setIsPromoteInlineIdManuallyEdited(false);
  }, [selectedInlineTask, selectedStepOrder, showPromoteInlineModal]);

  const existingPromoteInlineBaseIds = useMemo((): ReadonlySet<string> => {
    if (!runtime || !promoteInlineTargetCollectionId) {
      return new Set();
    }
    const collectionResult = runtime.library.tasks.collections.get(promoteInlineTargetCollectionId).asResult;
    if (collectionResult.isFailure()) {
      return new Set();
    }
    return new Set(Array.from(collectionResult.value.items.keys()) as string[]);
  }, [promoteInlineTargetCollectionId, runtime]);

  const derivedPromoteInlineBaseId = useMemo((): string => {
    if (isPromoteInlineIdManuallyEdited) {
      return promoteInlineBaseId;
    }
    const trimmedName = promoteInlineName.trim();
    if (trimmedName.length === 0) {
      return '';
    }
    const deriveResult = Editing.Helpers.generateUniqueBaseIdFromName(
      trimmedName,
      Array.from(existingPromoteInlineBaseIds)
    );
    return deriveResult.isSuccess() ? (deriveResult.value as string) : '';
  }, [existingPromoteInlineBaseIds, isPromoteInlineIdManuallyEdited, promoteInlineBaseId, promoteInlineName]);

  useEffect(() => {
    if (!showPromoteInlineModal) {
      return;
    }
    if (!isPromoteInlineIdManuallyEdited) {
      setPromoteInlineBaseId(derivedPromoteInlineBaseId);
    }
  }, [derivedPromoteInlineBaseId, isPromoteInlineIdManuallyEdited, showPromoteInlineModal]);

  const handlePromoteTask = useCallback(() => {
    if (!runtime || !isEditing || selectedStepOrder === null) {
      return;
    }
    if (!selectedTaskId) {
      setPromoteTaskError('No task selected');
      return;
    }
    if (!promoteTaskTargetCollectionId) {
      setPromoteTaskError('Select a target collection');
      return;
    }
    if (promoteTaskName.trim().length === 0) {
      setPromoteTaskError('Enter a task name');
      return;
    }

    setIsPromotingTask(true);
    setPromoteTaskError(null);

    try {
      const idResult = ChocolateConverters.baseTaskId.convert(promoteTaskBaseId);
      if (idResult.isFailure()) {
        setPromoteTaskError(`Invalid task ID: ${idResult.message}`);
        setIsPromotingTask(false);
        return;
      }
      const validatedBaseId = idResult.value;

      const collectionResult = runtime.library.tasks.collections.get(promoteTaskTargetCollectionId).asResult;
      if (collectionResult.isFailure()) {
        setPromoteTaskError(`Collection "${promoteTaskTargetCollectionId}" not found`);
        setIsPromotingTask(false);
        return;
      }
      const entry = collectionResult.value;
      if (!entry.isMutable) {
        setPromoteTaskError(`Collection "${promoteTaskTargetCollectionId}" is not mutable`);
        setIsPromotingTask(false);
        return;
      }
      if (settings.collections[promoteTaskTargetCollectionId]?.unlocked === false) {
        setPromoteTaskError(`Collection "${promoteTaskTargetCollectionId}" is locked`);
        setIsPromotingTask(false);
        return;
      }

      const taskResult = runtime.getRuntimeTask(selectedTaskId);
      if (taskResult.isFailure()) {
        setPromoteTaskError(taskResult.message);
        setIsPromotingTask(false);
        return;
      }

      const contextDefaults = rowsToRenderParams(contextRows);
      const stepDefaults = rowsToRenderParams(stepParamsRows);
      const mergedDefaults = {
        ...((taskResult.value.defaults ?? {}) as unknown as Record<string, unknown>),
        ...(contextDefaults as Record<string, unknown>),
        ...(stepDefaults as Record<string, unknown>)
      };
      const defaults = Object.keys(mergedDefaults).length > 0 ? mergedDefaults : undefined;

      const newTask: Record<string, unknown> = {
        baseId: validatedBaseId,
        name: promoteTaskName.trim(),
        template: taskResult.value.template,
        defaults,
        defaultActiveTime: taskResult.value.defaultActiveTime,
        defaultWaitTime: taskResult.value.defaultWaitTime,
        defaultHoldTime: taskResult.value.defaultHoldTime,
        defaultTemperature: taskResult.value.defaultTemperature,
        notes: taskResult.value.notes,
        tags: taskResult.value.tags
      };

      const validateResult = Entities.Tasks.Converters.taskData.convert(newTask);
      if (validateResult.isFailure()) {
        setPromoteTaskError(validateResult.message);
        setIsPromotingTask(false);
        return;
      }

      const addResult = entry.items.validating.add(
        validatedBaseId as unknown as string,
        validateResult.value
      ).asResult;
      if (addResult.isFailure()) {
        setPromoteTaskError(addResult.message);
        setIsPromotingTask(false);
        return;
      }

      void (async () => {
        const commitResult = await commitTaskCollection(promoteTaskTargetCollectionId);
        if (commitResult.isFailure()) {
          setPromoteTaskError(commitResult.message);
          setIsPromotingTask(false);
          return;
        }

        const newTaskId = `${promoteTaskTargetCollectionId}.${
          validatedBaseId as unknown as string
        }` as TaskId;
        updateDraftStep(selectedStepOrder, (prev) => {
          const invocation = (prev.task as unknown) ?? {};
          const invocationRecord = isRecord(invocation) ? (invocation as Record<string, unknown>) : {};
          const params = (invocationRecord.params as Record<string, unknown>) ?? {};
          return {
            ...prev,
            task: {
              ...invocationRecord,
              taskId: newTaskId,
              params
            }
          };
        });
        setStepTaskId(newTaskId as unknown as string);

        setIsPromotingTask(false);
        setShowPromoteTaskModal(false);
      })();
    } catch (e) {
      setPromoteTaskError(`Promotion failed: ${e instanceof Error ? e.message : String(e)}`);
      setIsPromotingTask(false);
    }
  }, [
    commitTaskCollection,
    isEditing,
    promoteTaskBaseId,
    promoteTaskTargetCollectionId,
    runtime,
    promoteTaskName,
    contextRows,
    stepParamsRows,
    selectedStepOrder,
    selectedTaskId,
    settings.collections,
    updateDraftStep
  ]);

  const handlePromoteInlineTask = useCallback(() => {
    if (!runtime || !isEditing || selectedStepOrder === null) {
      return;
    }
    if (!selectedInlineTask) {
      setPromoteInlineError('No inline task selected');
      return;
    }
    if (!promoteInlineTargetCollectionId) {
      setPromoteInlineError('Select a target collection');
      return;
    }
    if (promoteInlineName.trim().length === 0) {
      setPromoteInlineError('Enter a task name');
      return;
    }

    setIsPromotingInline(true);
    setPromoteInlineError(null);

    try {
      const idResult = ChocolateConverters.baseTaskId.convert(promoteInlineBaseId);
      if (idResult.isFailure()) {
        setPromoteInlineError(`Invalid task ID: ${idResult.message}`);
        setIsPromotingInline(false);
        return;
      }
      const validatedBaseId = idResult.value;

      const collectionResult = runtime.library.tasks.collections.get(
        promoteInlineTargetCollectionId
      ).asResult;
      if (collectionResult.isFailure()) {
        setPromoteInlineError(`Collection "${promoteInlineTargetCollectionId}" not found`);
        setIsPromotingInline(false);
        return;
      }
      const entry = collectionResult.value;
      if (!entry.isMutable) {
        setPromoteInlineError(`Collection "${promoteInlineTargetCollectionId}" is not mutable`);
        setIsPromotingInline(false);
        return;
      }
      if (settings.collections[promoteInlineTargetCollectionId]?.unlocked === false) {
        setPromoteInlineError(`Collection "${promoteInlineTargetCollectionId}" is locked`);
        setIsPromotingInline(false);
        return;
      }

      const contextDefaults = rowsToRenderParams(contextRows);
      const stepDefaults = rowsToRenderParams(stepParamsRows);
      const mergedDefaults = {
        ...((selectedInlineTask.defaults ?? {}) as unknown as Record<string, unknown>),
        ...(contextDefaults as Record<string, unknown>),
        ...(stepDefaults as Record<string, unknown>)
      };
      const defaults = Object.keys(mergedDefaults).length > 0 ? mergedDefaults : undefined;

      const newTask: Record<string, unknown> = {
        baseId: validatedBaseId,
        name: promoteInlineName.trim(),
        template: String(selectedInlineTask.template ?? ''),
        defaults,
        defaultActiveTime: selectedInlineTask.defaultActiveTime,
        defaultWaitTime: selectedInlineTask.defaultWaitTime,
        defaultHoldTime: selectedInlineTask.defaultHoldTime,
        defaultTemperature: selectedInlineTask.defaultTemperature,
        notes: selectedInlineTask.notes,
        tags: selectedInlineTask.tags
      };

      const validateResult = Entities.Tasks.Converters.taskData.convert(newTask);
      if (validateResult.isFailure()) {
        setPromoteInlineError(validateResult.message);
        setIsPromotingInline(false);
        return;
      }

      const addResult = entry.items.validating.add(
        validatedBaseId as unknown as string,
        validateResult.value
      ).asResult;
      if (addResult.isFailure()) {
        setPromoteInlineError(addResult.message);
        setIsPromotingInline(false);
        return;
      }

      void (async () => {
        const commitResult = await commitTaskCollection(promoteInlineTargetCollectionId);
        if (commitResult.isFailure()) {
          setPromoteInlineError(commitResult.message);
          setIsPromotingInline(false);
          return;
        }

        const newTaskId = `${promoteInlineTargetCollectionId}.${
          validatedBaseId as unknown as string
        }` as TaskId;
        updateDraftStep(selectedStepOrder, (prev) => {
          const invocation = (prev.task as unknown) ?? {};
          const invocationRecord = isRecord(invocation) ? (invocation as Record<string, unknown>) : {};
          const params = (invocationRecord.params as Record<string, unknown>) ?? {};
          return {
            ...prev,
            task: {
              taskId: newTaskId,
              params
            }
          };
        });

        setStepTaskId(newTaskId as unknown as string);
        setStepTemplate('');

        setIsPromotingInline(false);
        setShowPromoteInlineModal(false);
      })();
    } catch (e) {
      setPromoteInlineError(`Promotion failed: ${e instanceof Error ? e.message : String(e)}`);
      setIsPromotingInline(false);
    }
  }, [
    commitTaskCollection,
    isEditing,
    promoteInlineBaseId,
    promoteInlineTargetCollectionId,
    runtime,
    promoteInlineName,
    contextRows,
    stepParamsRows,
    selectedInlineTask,
    selectedStepOrder,
    settings.collections,
    updateDraftStep
  ]);

  const renderedSteps = useMemo(() => {
    if (!runtimeProcedure || !runtime) {
      return [] as ReadonlyArray<{
        order: number;
        text: string;
        status: 'ok' | 'warning' | 'error';
      }>;
    }

    return displaySteps.map((step) => {
      const order = (step as { order: number }).order;
      const invocation = (step as { task: unknown }).task;

      if (isTaskRef(invocation)) {
        const taskResult = runtime.getRuntimeTask((invocation as { taskId: TaskId }).taskId);
        if (taskResult.isFailure()) {
          return {
            order,
            text: `${order}. [Missing task: ${(invocation as { taskId: TaskId }).taskId as string}]`,
            status: 'error' as const
          };
        }

        const template = taskResult.value.template;
        if (!showRendered) {
          return { order, text: `${order}. ${template}`, status: 'ok' as const };
        }

        const mergedParams = {
          ...(contextParams as Record<string, unknown>),
          ...(((invocation as { params?: Record<string, unknown> }).params ?? {}) as Record<string, unknown>)
        };
        const renderResult = taskResult.value.validateAndRender(omitEmptyStringValues(mergedParams));
        if (renderResult.isFailure()) {
          return { order, text: `${order}. ${renderResult.message}`, status: 'warning' as const };
        }
        return { order, text: `${order}. ${renderResult.value}`, status: 'ok' as const };
      }

      if (isInlineTask(invocation)) {
        const template = (invocation as { task: { template: string } }).task.template;
        if (!showRendered) {
          return { order, text: `${order}. ${template}`, status: 'ok' as const };
        }

        const parsed = MustacheModule.MustacheTemplate.create(template);
        if (parsed.isFailure()) {
          return { order, text: `${order}. ${parsed.message}`, status: 'error' as const };
        }

        const mergedParams = {
          ...(((invocation as { task: { defaults?: Record<string, unknown> } }).task.defaults ??
            {}) as Record<string, unknown>),
          ...(contextParams as Record<string, unknown>),
          ...(((invocation as { params?: Record<string, unknown> }).params ?? {}) as Record<string, unknown>)
        };
        const renderResult = parsed.value.validateAndRender(omitEmptyStringValues(mergedParams));
        if (renderResult.isFailure()) {
          return { order, text: `${order}. ${renderResult.message}`, status: 'warning' as const };
        }
        return { order, text: `${order}. ${renderResult.value}`, status: 'ok' as const };
      }

      return { order, text: `${order}. [Invalid step task]`, status: 'error' as const };
    });
  }, [contextParams, displaySteps, runtime, runtimeProcedure, showRendered]);

  if (loadingState === 'loading' || !runtime) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" message="Loading..." />
      </div>
    );
  }

  if (!runtimeProcedureResult || runtimeProcedureResult.isFailure() || !runtimeProcedure) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500 dark:text-red-400 mb-4">Procedure not found</p>
        <button
          type="button"
          onClick={onBack}
          className="text-chocolate-600 dark:text-chocolate-400 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to browse
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {runtimeProcedure.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{procedureId as string}</p>
              </div>

              <div className="flex items-center gap-2">
                {!canEdit ? (
                  <button
                    type="button"
                    onClick={() => setShowCloneModal(true)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-chocolate-600 hover:bg-chocolate-700 rounded-md"
                  >
                    Clone to...
                  </button>
                ) : isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-chocolate-600 hover:bg-chocolate-700 rounded-md disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={beginEdit}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>
            </div>

            {!canEdit ? (
              <div className="mb-4 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3">
                <div className="text-sm text-amber-800 dark:text-amber-200">This procedure is read-only.</div>
              </div>
            ) : null}

            {saveError ? (
              <div className="mb-4 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
                <div className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">{saveError}</div>
              </div>
            ) : null}

            {runtimeProcedure.description ? (
              <p className="text-gray-600 dark:text-gray-400 mb-4">{runtimeProcedure.description}</p>
            ) : null}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Steps</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {runtimeProcedure.stepCount}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Active</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {runtimeProcedure.totalActiveTime ?? 0}m
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Wait</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {runtimeProcedure.totalWaitTime ?? 0}m
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Hold</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {runtimeProcedure.totalHoldTime ?? 0}m
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 mb-6">
              <div className="flex items-center justify-between gap-4 mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                  Context
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRendered(true)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border ${
                      showRendered
                        ? 'bg-chocolate-600 border-chocolate-700 text-white'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Rendered
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRendered(false)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border ${
                      !showRendered
                        ? 'bg-chocolate-600 border-chocolate-700 text-white'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Template
                  </button>
                </div>
              </div>

              <KeyValueTableEditor
                rows={contextRows}
                onChange={setContextRows}
                keyPlaceholder="name"
                valuePlaceholder="value"
                emptyMessage={
                  requiredContextVars.length === 0 ? 'No required variables' : 'No context values'
                }
              />
            </div>

            <div className="flex items-center justify-between gap-4 mb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                Steps
              </h3>
              {canEdit && isEditing ? (
                <button
                  type="button"
                  onClick={() => setShowAddStepModal(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-chocolate-600 hover:bg-chocolate-700 rounded-md"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Step
                </button>
              ) : null}
            </div>

            <div className="space-y-2">
              {renderedSteps.map((s) => {
                const isSelected = selectedStepOrder === s.order;
                const statusClass =
                  s.status === 'ok'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                    : s.status === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';

                return (
                  <button
                    key={s.order}
                    type="button"
                    onClick={() => setSelectedStepOrder(s.order)}
                    className={`w-full text-left rounded-md border p-4 transition-colors ${
                      isSelected
                        ? 'border-chocolate-400 ring-2 ring-chocolate-300 dark:border-chocolate-500 dark:ring-chocolate-700 bg-white dark:bg-gray-800'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-chocolate-200 dark:hover:border-chocolate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                          {s.text}
                        </div>
                      </div>
                      <div
                        className={`flex-shrink-0 text-xs font-medium px-2 py-1 rounded border ${statusClass}`}
                      >
                        {s.status}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide mb-3">
              Step Editor
            </h3>

            {!selectedStep ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">Select a step to edit.</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Step</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {(selectedStep as { order: number }).order}
                  </div>
                </div>

                {canEdit && isEditing ? (
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={removeSelectedStep}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Remove Step
                    </button>
                  </div>
                ) : null}

                {selectedInvocation && isTaskRef(selectedInvocation) ? (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Task ID
                    </label>
                    <input
                      value={stepTaskId}
                      onChange={(e) => {
                        const next = e.target.value;
                        setStepTaskId(next);
                        if (isEditing && selectedStepOrder !== null) {
                          updateDraftStep(selectedStepOrder, (prev) => {
                            const task = (prev.task as unknown) ?? {};
                            const taskRecord = isRecord(task) ? (task as Record<string, unknown>) : {};
                            const params = (taskRecord.params as Record<string, unknown>) ?? {};
                            return {
                              ...prev,
                              task: {
                                ...taskRecord,
                                taskId: next,
                                params
                              }
                            };
                          });
                        }
                      }}
                      disabled={!canEdit || !isEditing}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-60"
                    />
                    {canEdit && isEditing ? (
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={convertSelectedToInline}
                          className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                        >
                          Convert to inline
                        </button>
                      </div>
                    ) : null}

                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Template
                      </label>
                      <textarea
                        value={selectedTaskTemplate}
                        readOnly
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    {canEdit && isEditing ? (
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setPromoteTaskError(null);
                            setShowPromoteTaskModal(true);
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                        >
                          Promote to...
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : selectedInvocation && isInlineTask(selectedInvocation) ? (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Template
                    </label>
                    <textarea
                      value={stepTemplate}
                      onChange={(e) => {
                        const next = e.target.value;
                        setStepTemplate(next);
                      }}
                      onBlur={(e) => {
                        const next = e.target.value;
                        if (isEditing && selectedStepOrder !== null) {
                          updateDraftStep(selectedStepOrder, (prev) => {
                            const invocation = (prev.task as unknown) ?? {};
                            const invocationRecord = isRecord(invocation)
                              ? (invocation as Record<string, unknown>)
                              : {};
                            const taskValue = (invocationRecord.task as unknown) ?? {};
                            const taskRecord = isRecord(taskValue)
                              ? (taskValue as Record<string, unknown>)
                              : {};
                            const params = (invocationRecord.params as Record<string, unknown>) ?? {};
                            return {
                              ...prev,
                              task: {
                                ...invocationRecord,
                                task: {
                                  ...taskRecord,
                                  template: next
                                },
                                params
                              }
                            };
                          });
                        }
                      }}
                      rows={4}
                      disabled={!canEdit || !isEditing}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-60"
                    />

                    {canEdit && isEditing ? (
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setPromoteInlineError(null);
                            setShowPromoteInlineModal(true);
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                        >
                          Promote to...
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={stepNotes}
                    onChange={(e) => {
                      const next = e.target.value;
                      setStepNotes(next);
                      if (isEditing && selectedStepOrder !== null) {
                        updateDraftStep(selectedStepOrder, (prev) => ({ ...prev, notes: next }));
                      }
                    }}
                    rows={3}
                    disabled={!canEdit || !isEditing}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Active
                    </label>
                    <input
                      value={stepActiveTime}
                      onChange={(e) => {
                        const next = e.target.value;
                        setStepActiveTime(next);
                        if (isEditing && selectedStepOrder !== null) {
                          const parsed = next.trim().length > 0 ? Number(next) : undefined;
                          updateDraftStep(selectedStepOrder, (prev) => ({ ...prev, activeTime: parsed }));
                        }
                      }}
                      placeholder="minutes"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Wait
                    </label>
                    <input
                      value={stepWaitTime}
                      onChange={(e) => {
                        const next = e.target.value;
                        setStepWaitTime(next);
                        if (isEditing && selectedStepOrder !== null) {
                          const parsed = next.trim().length > 0 ? Number(next) : undefined;
                          updateDraftStep(selectedStepOrder, (prev) => ({ ...prev, waitTime: parsed }));
                        }
                      }}
                      placeholder="minutes"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Hold
                    </label>
                    <input
                      value={stepHoldTime}
                      onChange={(e) => {
                        const next = e.target.value;
                        setStepHoldTime(next);
                        if (isEditing && selectedStepOrder !== null) {
                          const parsed = next.trim().length > 0 ? Number(next) : undefined;
                          updateDraftStep(selectedStepOrder, (prev) => ({ ...prev, holdTime: parsed }));
                        }
                      }}
                      placeholder="minutes"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Temp
                    </label>
                    <input
                      value={stepTemperature}
                      onChange={(e) => {
                        const next = e.target.value;
                        setStepTemperature(next);
                        if (isEditing && selectedStepOrder !== null) {
                          const parsed = next.trim().length > 0 ? Number(next) : undefined;
                          updateDraftStep(selectedStepOrder, (prev) => ({ ...prev, temperature: parsed }));
                        }
                      }}
                      placeholder="°C"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Params
                  </label>
                  <KeyValueTableEditor
                    rows={stepParamsRows}
                    onChange={(rows) => {
                      setStepParamsRows(rows);
                      if (isEditing && selectedStepOrder !== null) {
                        const params = rowsToRenderParams(rows);
                        updateDraftStep(selectedStepOrder, (prev) => {
                          const task = (prev.task as unknown) ?? {};
                          const taskRecord = isRecord(task) ? (task as Record<string, unknown>) : {};
                          return {
                            ...prev,
                            task: {
                              ...taskRecord,
                              params
                            }
                          };
                        });
                      }
                    }}
                    keyPlaceholder="name"
                    valuePlaceholder="value"
                    emptyMessage="No params"
                  />
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Context values apply to all steps; step params override context.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showCloneModal}
        onClose={() => {
          setShowCloneModal(false);
          setCloneError(null);
        }}
        title="Clone Procedure"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setShowCloneModal(false);
                setCloneError(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleClone}
              disabled={isCloning || mutableCollectionIds.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-chocolate-600 hover:bg-chocolate-700 rounded-md disabled:opacity-50"
            >
              Clone
            </button>
          </>
        }
      >
        {mutableCollectionIds.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            No writable procedure collections available.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target collection
              </label>
              <select
                value={cloneTargetCollectionId ?? ''}
                onChange={(e) => setCloneTargetCollectionId(e.target.value as SourceId)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                {mutableCollectionIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New base ID
              </label>
              <input
                value={cloneBaseId}
                onChange={(e) => setCloneBaseId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            {cloneError ? (
              <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
                <div className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">{cloneError}</div>
              </div>
            ) : null}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showAddStepModal}
        onClose={() => {
          setShowAddStepModal(false);
          setAddStepSearch('');
        }}
        title="Add Step"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setShowAddStepModal(false);
                setAddStepSearch('');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                addBlankStep();
                setShowAddStepModal(false);
                setAddStepSearch('');
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-chocolate-600 hover:bg-chocolate-700 rounded-md"
            >
              Blank Step
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Choose task
            </label>
            <input
              value={addStepSearch}
              onChange={(e) => setAddStepSearch(e.target.value)}
              placeholder="Search by task name or id..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
              {filteredTasks.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 dark:text-gray-400">No matching tasks.</div>
              ) : (
                filteredTasks.slice(0, 200).map((t) => (
                  <button
                    key={t.id as string}
                    type="button"
                    onClick={() => addTaskRefStep(t.id)}
                    className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {t.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {t.id as string}
                        </div>
                      </div>
                      <div className="text-xs text-chocolate-700 dark:text-chocolate-300 flex-shrink-0">
                        Add
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Selecting a task creates a reference step; you can convert it to inline later for template
            editing.
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showPromoteTaskModal}
        onClose={() => {
          setShowPromoteTaskModal(false);
          setPromoteTaskError(null);
        }}
        title="Promote Task"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setShowPromoteTaskModal(false);
                setPromoteTaskError(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePromoteTask}
              disabled={
                isPromotingTask ||
                mutableTaskCollectionIds.length === 0 ||
                promoteTaskTargetCollectionId === null ||
                !selectedTaskId ||
                promoteTaskName.trim().length === 0
              }
              className="px-4 py-2 text-sm font-medium text-white bg-chocolate-600 hover:bg-chocolate-700 rounded-md disabled:opacity-50"
            >
              Promote
            </button>
          </>
        }
      >
        {mutableTaskCollectionIds.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            No writable task collections available.
          </div>
        ) : !selectedTaskId ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">No task selected.</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target collection
              </label>
              <select
                value={promoteTaskTargetCollectionId ?? ''}
                onChange={(e) => setPromoteTaskTargetCollectionId(e.target.value as SourceId)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                {mutableTaskCollectionIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                value={promoteTaskName}
                onChange={(e) => setPromoteTaskName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Task ID
              </label>
              <input
                value={promoteTaskBaseId}
                onChange={(e) => {
                  setPromoteTaskBaseId(e.target.value);
                  setIsPromoteTaskIdManuallyEdited(true);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Source task: {selectedTaskId as string}
              </div>
            </div>
            {promoteTaskError ? (
              <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
                <div className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
                  {promoteTaskError}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showPromoteInlineModal}
        onClose={() => {
          setShowPromoteInlineModal(false);
          setPromoteInlineError(null);
        }}
        title="Promote Inline Task"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setShowPromoteInlineModal(false);
                setPromoteInlineError(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePromoteInlineTask}
              disabled={
                isPromotingInline ||
                mutableTaskCollectionIds.length === 0 ||
                promoteInlineTargetCollectionId === null ||
                !selectedInlineTask ||
                promoteInlineName.trim().length === 0
              }
              className="px-4 py-2 text-sm font-medium text-white bg-chocolate-600 hover:bg-chocolate-700 rounded-md disabled:opacity-50"
            >
              Promote
            </button>
          </>
        }
      >
        {mutableTaskCollectionIds.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            No writable task collections available.
          </div>
        ) : !selectedInlineTask ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">No inline task selected.</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target collection
              </label>
              <select
                value={promoteInlineTargetCollectionId ?? ''}
                onChange={(e) => setPromoteInlineTargetCollectionId(e.target.value as SourceId)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                {mutableTaskCollectionIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                value={promoteInlineName}
                onChange={(e) => setPromoteInlineName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Task ID
              </label>
              <input
                value={promoteInlineBaseId}
                onChange={(e) => {
                  setPromoteInlineBaseId(e.target.value);
                  setIsPromoteInlineIdManuallyEdited(true);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              This will create a library task and replace the step with a task reference.
            </div>
            {promoteInlineError ? (
              <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
                <div className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
                  {promoteInlineError}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Modal>
    </div>
  );
}
