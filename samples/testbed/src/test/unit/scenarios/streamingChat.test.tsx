/**
 * Unit tests for the `streaming-chat` scenario: `promptLibrary`, `ChatSettingsPanel`,
 * `ChatPanel`, and the orchestrating `index.tsx` component. Network calls
 * (`AiAssist.callProviderCompletionStream`) are stubbed via `jest.spyOn` — the same
 * pattern `useAiAssist.test.ts` uses in `@fgv/ts-app-shell`.
 *
 * @packageDocumentation
 */

import '@fgv/ts-utils-jest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { fail, succeed, type Result } from '@fgv/ts-utils';
import { AiAssist } from '@fgv/ts-extras';
import { PromptStoreFixture } from '@fgv/ts-prompt-assist';

import * as streamingChatPromptLibraryModule from '../../../scenarios/streamingChat/promptLibrary';
import {
  chatToneConverter,
  chatTones,
  createPromptLibrary,
  resolveChatSystemPrompt
} from '../../../scenarios/streamingChat/promptLibrary';
import type { ChatPromptLibrary } from '../../../scenarios/streamingChat/promptLibrary';
import { ChatSettingsPanel } from '../../../scenarios/streamingChat/SettingsPanel';
import { ChatPanel } from '../../../scenarios/streamingChat/ChatPanel';
import type { IChatTurn } from '../../../scenarios/streamingChat/ChatPanel';
import {
  CHAT_PROVIDERS,
  defaultModelFor,
  streamingChatScenario
} from '../../../scenarios/streamingChat';
import type { IScenarioContext } from '../../../shell';

// ---------------------------------------------------------------------------
// promptLibrary
// ---------------------------------------------------------------------------

describe('streamingChat promptLibrary', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('createPromptLibrary builds a library successfully', async () => {
    const result = await createPromptLibrary();
    expect(result).toSucceed();
  });

  test('createPromptLibrary propagates a PromptStoreFixture.build failure', async () => {
    jest.spyOn(PromptStoreFixture, 'build').mockResolvedValue(fail('fixture build exploded'));
    const result = await createPromptLibrary();
    expect(result).toFailWith(/fixture build exploded/);
  });

  test('resolveChatSystemPrompt resolves the neutral (base) body by default', async () => {
    const library = (await createPromptLibrary()).orThrow();
    const result = await resolveChatSystemPrompt(library, 'neutral');
    expect(result).toSucceedWith('You are a helpful assistant. Answer the user clearly and concisely.');
  });

  test('resolveChatSystemPrompt resolves the formal partial when tone is formal', async () => {
    const library = (await createPromptLibrary()).orThrow();
    const result = await resolveChatSystemPrompt(library, 'formal');
    expect(result).toSucceedAndSatisfy((body) => {
      expect(body).toMatch(/formal register/);
      expect(body).toMatch(/helpful assistant/);
    });
  });

  test('chatToneConverter narrows a valid tone string', () => {
    expect(chatToneConverter.convert('formal')).toSucceedWith('formal');
  });

  test('chatToneConverter fails on an unrecognized string', () => {
    expect(chatToneConverter.convert('sarcastic')).toFail();
  });

  test('chatTones lists neutral and formal', () => {
    expect(chatTones).toEqual(['neutral', 'formal']);
  });
});

// ---------------------------------------------------------------------------
// Scenario metadata
// ---------------------------------------------------------------------------

describe('streamingChatScenario metadata', () => {
  test('declares the id, category, and a web impl with no cli impl', () => {
    expect(streamingChatScenario.id).toBe('streaming-chat');
    expect(streamingChatScenario.category).toBe('prompts');
    expect(streamingChatScenario.web).toBeDefined();
    expect(streamingChatScenario.cli).toBeUndefined();
  });

  test('CHAT_PROVIDERS is non-empty and includes every keyed provider', () => {
    expect(CHAT_PROVIDERS.length).toBeGreaterThan(0);
    expect(CHAT_PROVIDERS).toContain('openai');
    expect(CHAT_PROVIDERS).toContain('anthropic');
    expect(CHAT_PROVIDERS).toContain('google-gemini');
    expect(CHAT_PROVIDERS).toContain('xai-grok');
  });

  test('requiredSecrets covers all four keyed providers', () => {
    const ids = (streamingChatScenario.requiredSecrets ?? []).map((s) => s.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'openai-api-key',
        'anthropic-api-key',
        'gemini-api-key',
        'google-api-key',
        'xai-api-key'
      ])
    );
  });

  test('defaultModelFor returns the empty string for an unknown provider id', () => {
    expect(defaultModelFor('does-not-exist' as AiAssist.AiProviderId)).toBe('');
  });

  test('defaultModelFor resolves the base tier for a known provider', () => {
    expect(defaultModelFor('openai').length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// ChatSettingsPanel
// ---------------------------------------------------------------------------

describe('streamingChat ChatSettingsPanel', () => {
  afterEach(cleanup);

  function baseProps(): React.ComponentProps<typeof ChatSettingsPanel> {
    return {
      providers: ['openai', 'anthropic'],
      provider: 'openai',
      onProviderChange: jest.fn(),
      apiKeyStatus: 'loading',
      apiKeyError: undefined,
      model: '',
      modelPlaceholder: 'gpt-5.6-luna',
      onModelChange: jest.fn()
    };
  }

  test('shows the loading key affordance', () => {
    render(<ChatSettingsPanel {...baseProps()} apiKeyStatus="loading" />);
    expect(screen.getByTestId('streaming-chat-key-loading')).not.toBeNull();
  });

  test('shows the ready key affordance', () => {
    render(<ChatSettingsPanel {...baseProps()} apiKeyStatus="ready" />);
    expect(screen.getByTestId('streaming-chat-key-ready')).not.toBeNull();
  });

  test('shows the missing key affordance with the error message', () => {
    render(<ChatSettingsPanel {...baseProps()} apiKeyStatus="missing" apiKeyError="not set" />);
    expect(screen.getByTestId('streaming-chat-key-missing').textContent).toContain('not set');
  });

  test('changing the provider select calls onProviderChange', () => {
    const onProviderChange = jest.fn();
    render(<ChatSettingsPanel {...baseProps()} onProviderChange={onProviderChange} />);
    fireEvent.change(screen.getByTestId('streaming-chat-provider-select'), {
      target: { value: 'anthropic' }
    });
    expect(onProviderChange).toHaveBeenCalledWith('anthropic');
  });

  test('changing the model input calls onModelChange', () => {
    const onModelChange = jest.fn();
    render(<ChatSettingsPanel {...baseProps()} onModelChange={onModelChange} />);
    fireEvent.change(screen.getByTestId('streaming-chat-model-input'), {
      target: { value: 'claude-sonnet-5' }
    });
    expect(onModelChange).toHaveBeenCalledWith('claude-sonnet-5');
  });

  test('shows the streaming-CORS-restricted badge for a provider whose descriptor declares it', () => {
    // xai-grok is the only chat-capable provider with streamingCorsRestricted: true in
    // the registry — see libraries/ts-extras/src/packlets/ai-assist/registry.ts.
    render(<ChatSettingsPanel {...baseProps()} provider="xai-grok" />);
    expect(screen.getByText('Streaming CORS-restricted — calls will fail without a proxy')).not.toBeNull();
  });

  test('falls back to the raw provider id when there is no registry descriptor (ready)', () => {
    const unknownProvider = 'not-a-real-provider' as AiAssist.AiProviderId;
    render(
      <ChatSettingsPanel
        {...baseProps()}
        providers={[unknownProvider]}
        provider={unknownProvider}
        apiKeyStatus="ready"
      />
    );
    expect(screen.getByText(unknownProvider)).not.toBeNull();
    expect(screen.getByTestId('streaming-chat-key-ready').textContent).toContain(unknownProvider);
    expect(screen.queryByText('Streaming CORS-restricted — calls will fail without a proxy')).toBeNull();
  });

  test('falls back to the raw provider id in the "missing key" affordance too', () => {
    const unknownProvider = 'not-a-real-provider' as AiAssist.AiProviderId;
    render(
      <ChatSettingsPanel
        {...baseProps()}
        providers={[unknownProvider]}
        provider={unknownProvider}
        apiKeyStatus="missing"
      />
    );
    expect(screen.getByTestId('streaming-chat-key-missing').textContent).toContain(unknownProvider);
  });
});

// ---------------------------------------------------------------------------
// ChatPanel
// ---------------------------------------------------------------------------

describe('streamingChat ChatPanel', () => {
  afterEach(cleanup);

  function baseProps(
    overrides: Partial<React.ComponentProps<typeof ChatPanel>> = {}
  ): React.ComponentProps<typeof ChatPanel> {
    return {
      provider: 'openai',
      isWorking: false,
      canSubmit: true,
      disabledReason: '',
      turns: [],
      error: undefined,
      activeToolEvents: [],
      tone: 'neutral',
      onToneChange: jest.fn(),
      onSend: jest.fn(async () => undefined),
      onAbort: jest.fn(),
      onClear: jest.fn(),
      ...overrides
    };
  }

  test('shows the empty-transcript placeholder when there are no turns', () => {
    render(<ChatPanel {...baseProps()} />);
    expect(screen.getByText(/Type a question below/)).not.toBeNull();
  });

  test('renders each turn with its role label', () => {
    const turns: IChatTurn[] = [
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello there' }
    ];
    render(<ChatPanel {...baseProps({ turns })} />);
    expect(screen.getByTestId('streaming-chat-turn-0').textContent).toContain('You');
    expect(screen.getByTestId('streaming-chat-turn-1').textContent).toContain('Assistant');
  });

  test('shows a streaming ellipsis while the assistant turn has no content yet', () => {
    const turns: IChatTurn[] = [{ role: 'assistant', content: '', isStreaming: true }];
    render(<ChatPanel {...baseProps({ turns })} />);
    expect(screen.getByText('…')).not.toBeNull();
  });

  test('shows a streaming cursor once partial content has arrived', () => {
    const turns: IChatTurn[] = [{ role: 'assistant', content: 'partial', isStreaming: true }];
    const { container } = render(<ChatPanel {...baseProps({ turns })} />);
    expect(container.querySelector('.animate-pulse')).not.toBeNull();
  });

  test('shows active tool events', () => {
    render(<ChatPanel {...baseProps({ activeToolEvents: ['Searching the web…'] })} />);
    expect(screen.getByTestId('streaming-chat-tool-events').textContent).toContain('Searching the web…');
  });

  test('shows the error banner when error is set', () => {
    render(<ChatPanel {...baseProps({ error: 'boom' })} />);
    expect(screen.getByTestId('streaming-chat-error').textContent).toContain('boom');
  });

  test('the clear button only appears once there are turns, and calls onClear', () => {
    const onClear = jest.fn();
    const { rerender } = render(<ChatPanel {...baseProps({ onClear })} />);
    expect(screen.queryByTestId('streaming-chat-clear-btn')).toBeNull();

    rerender(<ChatPanel {...baseProps({ turns: [{ role: 'user', content: 'hi' }], onClear })} />);
    fireEvent.click(screen.getByTestId('streaming-chat-clear-btn'));
    expect(onClear).toHaveBeenCalled();
  });

  test('submitting via the send button calls onSend with the typed text and clears the input', () => {
    const onSend = jest.fn(async () => undefined);
    render(<ChatPanel {...baseProps({ onSend })} />);
    const input = screen.getByTestId('streaming-chat-input') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'hello there' } });
    fireEvent.click(screen.getByTestId('streaming-chat-send-btn'));
    expect(onSend).toHaveBeenCalledWith('hello there', { tools: undefined });
    expect(input.value).toBe('');
  });

  test('pressing Enter (without shift) submits the message', () => {
    const onSend = jest.fn(async () => undefined);
    render(<ChatPanel {...baseProps({ onSend })} />);
    const input = screen.getByTestId('streaming-chat-input');
    fireEvent.change(input, { target: { value: 'hi' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });
    expect(onSend).toHaveBeenCalledWith('hi', { tools: undefined });
  });

  test('pressing Shift+Enter does not submit', () => {
    const onSend = jest.fn(async () => undefined);
    render(<ChatPanel {...baseProps({ onSend })} />);
    const input = screen.getByTestId('streaming-chat-input');
    fireEvent.change(input, { target: { value: 'hi' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });

  test('does not submit an empty message', () => {
    const onSend = jest.fn(async () => undefined);
    render(<ChatPanel {...baseProps({ onSend })} />);
    fireEvent.click(screen.getByTestId('streaming-chat-send-btn'));
    expect(onSend).not.toHaveBeenCalled();
  });

  test('does not submit while canSubmit is false, and shows the disabled hint', () => {
    const onSend = jest.fn(async () => undefined);
    render(<ChatPanel {...baseProps({ canSubmit: false, disabledReason: 'no key', onSend })} />);
    fireEvent.change(screen.getByTestId('streaming-chat-input'), { target: { value: 'hi' } });
    fireEvent.click(screen.getByTestId('streaming-chat-send-btn'));
    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByTestId('streaming-chat-disabled-hint').textContent).toBe('no key');
  });

  test('submitting the form directly (bypassing the disabled button) still honors the canSubmit guard', () => {
    // The send button is disabled while `canSubmit` is false, so a real click never
    // reaches `submitMessage` — dispatch the form's `submit` event directly (e.g. an
    // Enter keypress takes this path even with the button disabled).
    const onSend = jest.fn(async () => undefined);
    const { container } = render(<ChatPanel {...baseProps({ canSubmit: false, onSend })} />);
    fireEvent.submit(container.querySelector('form')!);
    expect(onSend).not.toHaveBeenCalled();
  });

  test('submitting the form directly while isWorking honors the guard', () => {
    const onSend = jest.fn(async () => undefined);
    const { container } = render(<ChatPanel {...baseProps({ isWorking: true, onSend })} />);
    fireEvent.submit(container.querySelector('form')!);
    expect(onSend).not.toHaveBeenCalled();
  });

  test('shows the abort button while working, and clicking it calls onAbort', () => {
    const onAbort = jest.fn();
    render(<ChatPanel {...baseProps({ isWorking: true, onAbort })} />);
    fireEvent.click(screen.getByTestId('streaming-chat-abort-btn'));
    expect(onAbort).toHaveBeenCalled();
  });

  test('changing the tone select calls onToneChange with the converted tone', () => {
    const onToneChange = jest.fn();
    render(<ChatPanel {...baseProps({ onToneChange })} />);
    fireEvent.change(screen.getByTestId('streaming-chat-tone-select'), { target: { value: 'formal' } });
    expect(onToneChange).toHaveBeenCalledWith('formal');
  });

  test('shows the web-search checkbox only for a provider that supports the tool, and sends it when checked', () => {
    const onSend = jest.fn(async () => undefined);
    // openai supports web_search per the registry; verify presence and wiring.
    const descriptor = AiAssist.getProviderDescriptor('openai').orThrow();
    const supportsWebSearch = descriptor.supportedTools.includes('web_search');
    render(<ChatPanel {...baseProps({ provider: 'openai', onSend })} />);
    if (supportsWebSearch) {
      const checkbox = screen.getByTestId('streaming-chat-web-search-checkbox');
      fireEvent.click(checkbox);
      fireEvent.change(screen.getByTestId('streaming-chat-input'), { target: { value: 'search this' } });
      fireEvent.click(screen.getByTestId('streaming-chat-send-btn'));
      expect(onSend).toHaveBeenCalledWith('search this', { tools: [{ type: 'web_search' }] });
    } else {
      expect(screen.queryByTestId('streaming-chat-web-search-checkbox')).toBeNull();
    }
  });

  test('hides the web-search checkbox for a provider with no registry descriptor', () => {
    render(<ChatPanel {...baseProps({ provider: 'not-a-real-provider' as AiAssist.AiProviderId })} />);
    expect(screen.queryByTestId('streaming-chat-web-search-checkbox')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// index.tsx (integration, mocked AiAssist dispatch)
// ---------------------------------------------------------------------------

describe('streamingChat integration', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    cleanup();
  });

  function makeContext(resolveSecret: IScenarioContext['resolveSecret']): IScenarioContext {
    return {
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        detail: jest.fn()
      } as unknown as IScenarioContext['logger'],
      keyStore: undefined,
      resolveSecret,
      dataTree: {} as unknown as IScenarioContext['dataTree']
    };
  }

  test('shows the missing-key disabled reason before the prompt library is ready', async () => {
    const context = makeContext(async () => fail('secret not configured'));
    const Component = streamingChatScenario.web!.component;
    render(<Component context={context} />);
    await waitFor(() => expect(screen.getByTestId('streaming-chat-key-missing')).not.toBeNull());
    expect(screen.getByTestId('streaming-chat-disabled-hint').textContent).toMatch(/API key/);
  });

  test('shows the prompt-library-error disabled reason when createPromptLibrary fails', async () => {
    jest
      .spyOn(streamingChatPromptLibraryModule, 'createPromptLibrary')
      .mockResolvedValue(fail('vault unreachable'));
    const context = makeContext(async () => succeed('sk-test'));
    const Component = streamingChatScenario.web!.component;
    render(<Component context={context} />);
    await waitFor(() => expect(screen.getByTestId('streaming-chat-key-ready')).not.toBeNull());
    await waitFor(() =>
      expect(screen.getByTestId('streaming-chat-disabled-hint').textContent).toMatch(
        /Prompt library failed to load: vault unreachable/
      )
    );
  });

  test('shows the prompt-library-initializing reason once the key resolves but before the library loads', async () => {
    // Build the real library BEFORE mocking createPromptLibrary — the mock replaces
    // the same module-object property this real call goes through.
    const realResult = await createPromptLibrary();
    let resolveLibrary: (result: Result<ChatPromptLibrary>) => void = () => undefined;
    const pending = new Promise<Result<ChatPromptLibrary>>((resolve) => {
      resolveLibrary = resolve;
    });
    jest.spyOn(streamingChatPromptLibraryModule, 'createPromptLibrary').mockReturnValue(pending);

    const context = makeContext(async () => succeed('sk-test'));
    const Component = streamingChatScenario.web!.component;
    render(<Component context={context} />);
    await waitFor(() => expect(screen.getByTestId('streaming-chat-key-ready')).not.toBeNull());
    expect(screen.getByTestId('streaming-chat-disabled-hint').textContent).toBe(
      'Prompt library is still initializing…'
    );

    resolveLibrary(realResult);
    // Eventually the prompt library resolves and the composer becomes enabled.
    await waitFor(() => expect(screen.queryByTestId('streaming-chat-disabled-hint')).toBeNull());
  });

  test('the createPromptLibrary effect ignores a resolution that arrives after unmount', async () => {
    const realResult = await createPromptLibrary();
    let resolveLibrary: (result: Result<ChatPromptLibrary>) => void = () => undefined;
    const pending = new Promise<Result<ChatPromptLibrary>>((resolve) => {
      resolveLibrary = resolve;
    });
    jest.spyOn(streamingChatPromptLibraryModule, 'createPromptLibrary').mockReturnValue(pending);

    const context = makeContext(async () => succeed('sk-test'));
    const Component = streamingChatScenario.web!.component;
    const { unmount } = render(<Component context={context} />);
    unmount();

    resolveLibrary(realResult);
    await new Promise((resolve) => setTimeout(resolve, 0));
    // Test passes if no "can't update unmounted component" warning fires.
  });

  test('sends a message and streams text deltas into the transcript', async () => {
    const context = makeContext(async () => succeed('sk-test'));
    async function* events(): AsyncGenerator<AiAssist.IAiStreamEvent> {
      yield { type: 'text-delta', delta: 'Hello' };
      yield { type: 'text-delta', delta: ' world' };
      yield { type: 'done', fullText: 'Hello world', truncated: false };
    }
    jest.spyOn(AiAssist, 'callProviderCompletionStream').mockResolvedValue(succeed(events()));

    const Component = streamingChatScenario.web!.component;
    render(<Component context={context} />);
    await waitFor(() => expect(screen.queryByTestId('streaming-chat-disabled-hint')).toBeNull());

    fireEvent.change(screen.getByTestId('streaming-chat-input'), { target: { value: 'hi there' } });
    fireEvent.click(screen.getByTestId('streaming-chat-send-btn'));

    await waitFor(() => expect(screen.getByText('Hello world')).not.toBeNull());
  });

  test('shows an inline error when the stream ends in an error event', async () => {
    const context = makeContext(async () => succeed('sk-test'));
    async function* events(): AsyncGenerator<AiAssist.IAiStreamEvent> {
      yield { type: 'error', message: 'connection reset' };
    }
    jest.spyOn(AiAssist, 'callProviderCompletionStream').mockResolvedValue(succeed(events()));

    const Component = streamingChatScenario.web!.component;
    render(<Component context={context} />);
    await waitFor(() => expect(screen.queryByTestId('streaming-chat-disabled-hint')).toBeNull());

    fireEvent.change(screen.getByTestId('streaming-chat-input'), { target: { value: 'hi there' } });
    fireEvent.click(screen.getByTestId('streaming-chat-send-btn'));

    await waitFor(() => expect(screen.getByTestId('streaming-chat-error')).not.toBeNull());
    expect(screen.getByTestId('streaming-chat-error').textContent).toContain('connection reset');
  });

  test('shows an inline error when the stream fails to open', async () => {
    const context = makeContext(async () => succeed('sk-test'));
    jest.spyOn(AiAssist, 'callProviderCompletionStream').mockResolvedValue(fail('could not connect'));

    const Component = streamingChatScenario.web!.component;
    render(<Component context={context} />);
    await waitFor(() => expect(screen.queryByTestId('streaming-chat-disabled-hint')).toBeNull());

    fireEvent.change(screen.getByTestId('streaming-chat-input'), { target: { value: 'hi there' } });
    fireEvent.click(screen.getByTestId('streaming-chat-send-btn'));

    await waitFor(() => expect(screen.getByTestId('streaming-chat-error')).not.toBeNull());
    expect(screen.getByTestId('streaming-chat-error').textContent).toContain('could not connect');
  });

  test('clearing the conversation empties the transcript', async () => {
    const context = makeContext(async () => succeed('sk-test'));
    async function* events(): AsyncGenerator<AiAssist.IAiStreamEvent> {
      yield { type: 'done', fullText: 'hi back', truncated: false };
    }
    jest.spyOn(AiAssist, 'callProviderCompletionStream').mockResolvedValue(succeed(events()));

    const Component = streamingChatScenario.web!.component;
    render(<Component context={context} />);
    await waitFor(() => expect(screen.queryByTestId('streaming-chat-disabled-hint')).toBeNull());

    fireEvent.change(screen.getByTestId('streaming-chat-input'), { target: { value: 'hi there' } });
    fireEvent.click(screen.getByTestId('streaming-chat-send-btn'));
    await waitFor(() => expect(screen.getByText('hi back')).not.toBeNull());

    fireEvent.click(screen.getByTestId('streaming-chat-clear-btn'));
    expect(screen.queryByTestId('streaming-chat-turn-0')).toBeNull();
  });

  test('switching the tone re-resolves the system prompt on the next send', async () => {
    const context = makeContext(async () => succeed('sk-test'));
    let lastSystem: string | undefined;
    jest
      .spyOn(AiAssist, 'callProviderCompletionStream')
      .mockImplementation(async (params: AiAssist.IProviderCompletionStreamParams) => {
        lastSystem = params.system;
        async function* events(): AsyncGenerator<AiAssist.IAiStreamEvent> {
          yield { type: 'done', fullText: 'ok', truncated: false };
        }
        return succeed(events());
      });

    const Component = streamingChatScenario.web!.component;
    render(<Component context={context} />);
    await waitFor(() => expect(screen.queryByTestId('streaming-chat-disabled-hint')).toBeNull());

    fireEvent.change(screen.getByTestId('streaming-chat-tone-select'), { target: { value: 'formal' } });
    fireEvent.change(screen.getByTestId('streaming-chat-input'), { target: { value: 'hi there' } });
    fireEvent.click(screen.getByTestId('streaming-chat-send-btn'));

    await waitFor(() => expect(lastSystem).toMatch(/formal register/));
  });

  test('overriding the model input updates the resolved model for the current provider', async () => {
    const context = makeContext(async () => succeed('sk-test'));
    const Component = streamingChatScenario.web!.component;
    render(<Component context={context} />);
    await waitFor(() => expect(screen.queryByTestId('streaming-chat-disabled-hint')).toBeNull());

    const modelInput = screen.getByTestId('streaming-chat-model-input') as HTMLInputElement;
    fireEvent.change(modelInput, { target: { value: 'custom-model-override' } });
    expect(modelInput.value).toBe('custom-model-override');
  });

  test('shows an inline error and rolls back the placeholder turns when resolveChatSystemPrompt fails', async () => {
    jest
      .spyOn(streamingChatPromptLibraryModule, 'resolveChatSystemPrompt')
      .mockResolvedValue(fail('tone resolution exploded'));
    const context = makeContext(async () => succeed('sk-test'));
    const Component = streamingChatScenario.web!.component;
    render(<Component context={context} />);
    await waitFor(() => expect(screen.queryByTestId('streaming-chat-disabled-hint')).toBeNull());

    fireEvent.change(screen.getByTestId('streaming-chat-input'), { target: { value: 'hi there' } });
    fireEvent.click(screen.getByTestId('streaming-chat-send-btn'));

    await waitFor(() => expect(screen.getByTestId('streaming-chat-error')).not.toBeNull());
    expect(screen.getByTestId('streaming-chat-error').textContent).toContain('tone resolution exploded');
    // The optimistic user+assistant placeholder turns are rolled back on failure.
    expect(screen.queryByTestId('streaming-chat-turn-0')).toBeNull();
  });

  test('shows tool-use events while a server-side tool call is in progress', async () => {
    const context = makeContext(async () => succeed('sk-test'));
    async function* events(): AsyncGenerator<AiAssist.IAiStreamEvent> {
      yield { type: 'tool-event', phase: 'started', toolType: 'web_search' };
      yield { type: 'text-delta', delta: 'partial' };
      yield { type: 'tool-event', phase: 'completed', toolType: 'web_search' };
      yield { type: 'done', fullText: 'partial', truncated: false };
    }
    jest.spyOn(AiAssist, 'callProviderCompletionStream').mockResolvedValue(succeed(events()));

    const Component = streamingChatScenario.web!.component;
    render(<Component context={context} />);
    await waitFor(() => expect(screen.queryByTestId('streaming-chat-disabled-hint')).toBeNull());

    fireEvent.change(screen.getByTestId('streaming-chat-input'), { target: { value: 'search please' } });
    fireEvent.click(screen.getByTestId('streaming-chat-send-btn'));

    await waitFor(() => expect(screen.getByText('partial')).not.toBeNull());
    // Tool events clear once the stream completes.
    expect(screen.queryByTestId('streaming-chat-tool-events')).toBeNull();
  });

  test('clicking Cancel while streaming aborts the request signal', async () => {
    const context = makeContext(async () => succeed('sk-test'));
    let capturedSignal: AbortSignal | undefined;
    let resolveNext: (result: IteratorResult<AiAssist.IAiStreamEvent>) => void = () => undefined;
    const pendingNext = new Promise<IteratorResult<AiAssist.IAiStreamEvent>>((resolve) => {
      resolveNext = resolve;
    });
    const events: AsyncIterable<AiAssist.IAiStreamEvent> = {
      [Symbol.asyncIterator]() {
        let askedOnce = false;
        return {
          next: async (): Promise<IteratorResult<AiAssist.IAiStreamEvent>> => {
            if (!askedOnce) {
              askedOnce = true;
              return pendingNext;
            }
            return { done: true, value: undefined };
          }
        };
      }
    };
    jest
      .spyOn(AiAssist, 'callProviderCompletionStream')
      .mockImplementation(async (params: AiAssist.IProviderCompletionStreamParams) => {
        capturedSignal = params.signal;
        return succeed(events);
      });

    const Component = streamingChatScenario.web!.component;
    render(<Component context={context} />);
    await waitFor(() => expect(screen.queryByTestId('streaming-chat-disabled-hint')).toBeNull());

    fireEvent.change(screen.getByTestId('streaming-chat-input'), { target: { value: 'hi there' } });
    fireEvent.click(screen.getByTestId('streaming-chat-send-btn'));

    await waitFor(() => expect(screen.getByTestId('streaming-chat-abort-btn')).not.toBeNull());
    fireEvent.click(screen.getByTestId('streaming-chat-abort-btn'));
    expect(capturedSignal?.aborted).toBe(true);

    resolveNext({ done: true, value: undefined });
  });
});
