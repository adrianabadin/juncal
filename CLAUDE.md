@AGENTS.md


<!-- pmc:init -->
# PMC Commands



PMC first, files second.

Query PMC before reading more than 3 files. Prefer PMC for architecture, symbol lookup, dependencies, and callers before reading raw source.

Available PMC MCP tools: `pmc_query_project`, `pmc_search_symbols`, `pmc_get_dependents`, `pmc_get_dependencies`.

`/get-context` resolves a target (symbol, file, or query) and returns structural context. Accepts optional depth (compact|extended|deep) and focus (all|dependencies|callers|containment|impact).

When the user types `/map-project`, run:

```bash
pmc map-project --all --enrich
```

When the user types `/get-context`, run:

```bash
pmc get-context <target> [depth] [focus]
```

When the user types `/enrich`, launch enrichment:

```bash
pmc enrich .
```

When the user types `/enrich-status`, run:

```bash
pmc enrich-status
```

When the user types `/pmc-doctor`, run:

```bash
pmc doctor
```

When the user types `/init-project`, run:

```bash
pmc init-project
```

When the user types `/sync-context`, run:

```bash
pmc sync-context
```

When the user types `/sanitize`, run:

```bash
pmc sanitize
```

## Session Autostart

Session initialization is handled automatically by the `pmc session-start` hook
(installed by `pmc setup`). The hook runs **outside the model context window**, costs zero
tokens, and injects a compact status + project context summary as `additionalContext`.

**If your harness does NOT have a SessionStart hook configured**, run this once per session:

```bash
pmc session-start .
```

This command handles everything deterministic in one shot:
- Checks enrichment status; launches background enrich + watchdog if needed
- Reports pending sync operations (run `/sync-context` to apply)
- Loads project context from materialized disk artifacts tagged `project-context` (no MCP round-trip)
- Reports if LLM subagent drain is needed

**If the session summary reports `subagentQueue.pending > 0`**, dispatch the `enrich` subagent
to drain those entries — that is the only step that requires LLM involvement.

**Remind**: use `/get-context <target>` before reading files.

## Mandatory Workflow (ENFORCED)

- BEFORE reading any source file: run `/get-context <file-or-symbol>` FIRST
- AFTER code changes: run `pmc refresh-context --enrich` (refreshes graph + queues + launches enrichment) then `pmc sync-context`
- Default depth: `compact`. `extended`/`deep` only on explicit request.
- `map-project --all` only for full reinstall or ground-up graph rebuild — not needed for routine changes.
<!-- /pmc:init -->
