# Architecture

## Runtime Model

The prototype is a dependency-free static website. It can be opened directly through `index.html` or served from any static host, including GitHub Pages.

There is no module bundler, package manager, backend, persistence layer, or network dependency. Browser scripts are classic scripts that attach their public interfaces to a shared `window.SpaceCustoms` namespace.

`index.html` must load scripts in this order:

1. `data.js`
2. `config.js`
3. `ship-generator.js`
4. `game-engine.js`
5. `ui.js`
6. `app.js`

Later scripts depend on interfaces created by earlier scripts.

## Script Responsibilities

### `data.js`

Static content and domain definitions:

- Regulations and their confirming scanners.
- Ship classes and cargo pools.
- Names, locations, operators, contractors, and manufacturers.
- Banned and military-specific domain values.

Add flavour here when it does not affect balance or timing.

### `config.js`

Balancing and system configuration:

- Shift, spawn, and contact timing.
- Scanner cost, duration, labels, and descriptions.
- Power and Focus Assist limits.
- Anomaly thresholds.
- Per-class passive baselines and rule risk weights.
- Shared randomisation utilities under `SpaceCustoms.utils`.

Values that change difficulty or probability belong here rather than in rendering code.

### `ship-generator.js`

Procedural vessel construction:

- Selects class-biased active-rule violations.
- Adds benign irregularities to some legal ships.
- Builds passive surveys, dossiers, modules, and scan reports.
- Guarantees meaningful clues and confirming evidence.
- Exposes generator validation for large-sample invariant checks.

Hidden anomaly metadata is generated here but is not ordinarily rendered as a score.

### `game-engine.js`

Authoritative mutable game state and gameplay transitions:

- Shift lifecycle, spawning, departures, and scoring.
- Scanner activation and completion.
- Power regeneration.
- Focus Assist activation and re-evaluation.
- Evidence-linked allegation toggles.
- Clear/detain resolution and diagnostic audit messages.
- Ops Log history and shift statistics.

The engine may request a UI refresh, but it should not construct DOM markup.

### `ui.js`

DOM lookup, rendering, CSS-state application, and event binding:

- Regulations, contact tabs, dossier forms, systems, and reports.
- Focus Assist highlights.
- Allegation controls and judgement buttons.
- Ops Log and briefing/report overlays.
- Collapsible side panels.

The UI may derive presentation state from the engine. It must not inspect hidden truth to enable controls or reveal verdicts.

### `app.js`

Minimal bootstrap:

- Bind events.
- Reset the engine into briefing mode.
- Run generator validation in the development console.
- Start the one-second engine tick.

## Core Interfaces

### Regulation

```js
{
  id,
  code,
  title,
  criterion,
  confirmingScan
}
```

`confirmingScan` references a scanner ID from `config.scans`.

### Evidence Field

```js
{
  key,
  label,
  value,
  ruleIds,
  anomalyScore,
  anomalyCategory,
  group
}
```

- `key` is stable within a ship and supports Focus Assist highlighting.
- `ruleIds` describes relevance, not guilt.
- `anomalyScore` is hidden implementation metadata.
- `anomalyCategory` may be presented as a neutral cue above the configured threshold.
- `group` is currently used to visually separate Module Query module slots.

### Scan Report

```js
{
  id,
  action,
  lines,
  violationRuleIds,
  discovered,
  unread
}
```

`violationRuleIds` is hidden truth used by generation validation and audit logic. UI availability must depend on `discovered` and the regulation's `confirmingScan`, never on `violationRuleIds`.

### Generated Ship

```js
{
  id,
  name,
  className,
  leaveIn,
  pilotNote,
  passiveSurvey,
  dossier,
  reports,
  scansRunning,
  allegedViolationIds,
  actualViolations,
  benignHintRuleIds,
  assistActive,
  assistMessage,
  assistHighlightKeys
}
```

`assistHighlightKeys` is added when Focus Assist evaluates visible evidence. `actualViolations`, `benignHintRuleIds`, and anomaly scores are hidden state and must not directly drive normal UI verdicts.

### Engine State

The singleton `SpaceCustoms.engine.state` owns:

- Current mode and shift timing.
- Score, mistakes, and resource counters.
- Active regulation IDs.
- Traffic and selected ship/rule/report IDs.
- Ops Log entries and resolved-contact count.
- Side-panel collapse state.

Ship-specific scan, allegation, and assist state remains on each generated ship.

## Important Invariants

- `activeRuleIds` contains four distinct rules selected from `data.rules`.
- Ships may violate only active regulations.
- Every violation has a passive or dossier clue at or above `passiveTagThreshold`.
- Every violation appears in the correct confirming report.
- Legal ships may contain benign anomalies but no hidden active violation.
- A regulation becomes markable when its confirming report is discovered, independent of report truth.
- Detention succeeds only when alleged and actual violation sets match exactly.
- Any unresolved departure counts as a miss and does not count as a resolved contact.
- Focus Assist considers only evidence currently visible to the player.

## Safe Extension Points

- Add flavour by extending arrays in `data.js`.
- Add a regulation by defining its data, generation condition, clue, confirming report evidence, audit description, and class risk weights together.
- Add a scanner by extending `config.scans`, report generation, UI rendering expectations, and audit mappings.
- Add a new dossier section only when at least one mechanic asks the player to use it.
- Change balancing through `config.js` before embedding special cases in the engine.

Any new rule or scanner should be accompanied by generator-validation coverage and a manual check that the UI does not leak hidden truth.

## Verification

Use the commands in [`../AGENTS.md`](../AGENTS.md). Generator validation is especially important after changing probabilities, evidence metadata, rules, scanners, or class profiles.

Because the prototype has no automated browser suite, layout and interaction changes still require a manual browser playthrough when practical.

