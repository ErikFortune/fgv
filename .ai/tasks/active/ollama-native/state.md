# ollama-native — state

## Task A — recipe + capability config
**✅ SHIPPED via PR #468 (merged to `release`, 2026-06-06).**
- `ollama` + `openai-compat` catch-all `chat` rules added to `DEFAULT_MODEL_CAPABILITY_CONFIG` (registry.ts), parallel to `groq`/`mistral`.
- `LIBRARY_CAPABILITIES.md` recipe (empty-key omission, `defaultModel: ''` caveat, `endpoint` override across all four call paths incl. `executeClientToolTurn` per #466, `OLLAMA_ORIGINS` browser-CORS caveat).
- Unit + integration tests (through `callProviderListModels`); Rush change file (`@fgv/ts-extras`, minor).
- (A speculative `followup.md` the implementing agent added — written without this brief — was stripped before merge; the authoritative artifacts are `brief.md` + `design.md` here.)

## Task B — `@fgv/ts-extras-ollama` native-API boundary
**📐 Designed + amended; implementation NOT started.** See `design.md` (and its 2026-06-06 orchestrator-review amendment note).
Implementation (phases O-1…O-4) is gated on:
- Task A landed ✅
- MCP slice (`ts-extras-mcp`) lands
- **For the O-4 `embed` sub-task only:** the `ai-assist-embeddings` design concludes whether a cross-provider embedding primitive makes native Ollama `embed` redundant (resolves OQ-1).

Amendments locked: `chatStructured` gets `AbortSignal` (OQ-3); draft-07 `format` sanitizer budgeted into O-4 (Gemini precedent); `embed` HELD pending the embedding verdict.
