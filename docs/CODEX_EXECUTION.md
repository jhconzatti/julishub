# Codex Execution Standard

## Purpose

Execute repository tasks with the smallest reliable amount of exploration,
reasoning, file changes and validation.

This file defines the default execution behavior for Codex tasks in this
repository.

Task-specific instructions override this document when they explicitly conflict.

## Execution

- Work silently.
- Do not narrate plans, commands, progress or intermediate discoveries.
- Return only the requested final result.
- Do not perform a repository-wide audit unless explicitly requested.
- Read only files necessary for the requested scope.
- Prefer exact searches and direct references over broad recursive exploration.
- When the task identifies relevant files, inspect those first.
- When an approved implementation or pattern already exists, reuse it.
- Do not redesign architecture that is already settled.
- Do not refactor unrelated code.
- Do not add abstractions for hypothetical future use.
- Do not add or update dependencies unless explicitly required.
- Do not change public contracts unless the task requires it.
- Do not weaken validation or error handling merely to make a task pass.
- Do not fabricate placeholder data to hide unavailable data.
- Preserve existing user changes.
- Do not revert unrelated modifications.
- Do not modify pushed Git history.
- Do not commit, push or deploy unless explicitly authorized.

## Scope Control

Implement the smallest coherent change that satisfies the task.

If an unrelated issue is discovered:

- do not fix it;
- do not expand the task;
- mention it in the final response only if it materially affects the requested work.

Do not perform opportunistic cleanup.

A change being "nice to have" is not sufficient reason to expand scope.

## Existing Patterns

Before inventing a new pattern:

1. Find the closest approved implementation.
2. Reuse its structure and conventions.
3. Change only what differs for the current requirement.

Prefer existing:

- request helpers;
- validation patterns;
- error models;
- cache behavior;
- loading/error/stale states;
- responsive patterns;
- shared UI components;
- test structure.

Avoid parallel implementations of an established concern.

## Investigation

Start from the concrete failure, requirement or acceptance criterion.

Use the shortest path from evidence to implementation.

Do not investigate adjacent domains unless they are required to explain or fix
the requested behavior.

When the root cause is already established by the task, verify it briefly and
move to implementation instead of rediscovering it.

## Validation

Use validation proportional to the files changed.

### Documentation-only changes

Run:

- `git diff --check`
- `git status --short`
- any targeted consistency check required by the task

Do not run the full application toolchain without a concrete reason.

### Frontend changes

Run:

- `npm run lint`
- `npx tsc -b --pretty false`
- `npm run build`
- targeted checks relevant to the changed behavior
- `git diff --check`
- `git status --short`

### Backend changes

Run:

- Python compile/import checks relevant to the changed files
- focused automated tests for the changed behavior
- local smoke only when useful
- `git diff --check`
- `git status --short`

### Cross-stack/API contract changes

Run the relevant frontend and backend validations above, plus focused tests for
the contract being changed.

Do not run generic:

- dependency audits;
- security audits;
- performance audits;
- accessibility audits;
- repository-wide React audits;
- unrelated test suites;

unless explicitly requested or necessary to diagnose a concrete failure.

Known non-blocking warnings must not be fixed outside scope.

## Tests

Prefer extending an existing test file when it already covers the domain.

Add tests for:

- regressions being fixed;
- new contract semantics;
- important edge cases directly introduced by the change.

Do not create testing infrastructure for unrelated areas.

Do not over-test implementation details.

## Stop Conditions

Interrupt execution only when:

- a required user decision cannot be safely inferred;
- necessary information is unavailable;
- the requested change would require a materially larger scope than authorized;
- implementation would require a destructive or remote action not explicitly authorized.

Ask one short, objective question.

Otherwise continue to completion.

## Documentation

Update `docs/PROJECT_EVOLUTION.md` only when the task requests it or when the
change materially updates an existing tracked issue or architectural decision.

Keep project history concise and factual.

Do not duplicate the entire final response into documentation.

## Output

Keep the final response concise.

Return only what the task requests, normally:

- files changed;
- behavior implemented;
- important decisions;
- validation results;
- remaining manual or post-deploy checks.

Do not narrate implementation steps.