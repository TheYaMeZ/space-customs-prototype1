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
- Ship classes, cargo pools, route/location data, registry authorities, and operator licences.
- Name pools, contractors, manufacturers, module families, and recall policies.
- Restricted and military-specific domain values.

Add flavour here when it does not affect balance or timing.

### `config.js`

Balancing and system configuration:

- Shift, spawn, and contact timing.
- Scanner cost, duration, labels, and descriptions.
- Power and AI Validation limits.
- Anomaly thresholds.
- Per-class passive baselines and rule risk weights.
- Active regulation evidence mix.
- Shared randomisation utilities under `SpaceCustoms.utils`.

Values that change difficulty or probability belong here rather than in rendering code.

### `ship-generator.js`

Procedural vessel construction:

- Selects class-biased active-rule violations.
- Selects active regulations with a dossier/scan evidence mix.
- Adds benign irregularities to some legal ships.
- Builds passive surveys, dossiers, modules, registry IDs, ship names, and scan reports.
- Guarantees meaningful clues and either dossier evidence or confirming scan evidence.
- Exposes generator validation for large-sample invariant checks.

Hidden anomaly metadata is generated here but is not ordinarily rendered as a score.

### `game-engine.js`

Authoritative mutable game state and gameplay transitions:

- Shift lifecycle, spawning, departures, and scoring.
- Scanner activation and completion.
- Power regeneration.
- AI Validation activation and re-evaluation.
- Evidence-linked allegation toggles.
- Clear/detain resolution and diagnostic audit messages.
- Ops Log history, Lane Comms history, and shift statistics.

The engine may request a UI refresh, but it should not construct DOM markup.

### `ui.js`

DOM lookup, rendering, CSS-state application, and event binding:

- Regulations, contact tabs, dossier forms, systems, and reports.
- AI Validation highlights.
- Allegation controls and judgement buttons.
- Persistent active-system returns in the Contact Dossier.
- Ops Log, Lane Comms, and briefing/report overlays.
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
  confirmingScan,
  evidenceType
}
```

`confirmingScan` references a scanner ID from `config.scans` for scan-confirmed rules. Dossier-confirmed rules use `confirmingScan: null` and `evidenceType: "dossier"`; these are markable as soon as a ship is selected.

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

- `key` is stable within a ship and supports AI Validation highlighting.
- `ruleIds` describes relevance, not guilt.
- `anomalyScore` is hidden implementation metadata.
- `anomalyCategory` may be presented as a neutral cue above the configured threshold for passive survey fields. Dossier categories are internal metadata and should not be rendered as badges.
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

`violationRuleIds` is hidden truth used by generation validation and audit logic. UI availability must depend on the regulation evidence path: dossier rules are immediately markable for selected ships, while scan rules depend on `discovered` and the regulation's `confirmingScan`. It must never depend on `violationRuleIds`.

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
  packetStatus,
  allegedViolationIds,
  actualViolations,
  benignHintRuleIds,
  ruleEvidence,
  aiValidationActive,
  aiValidationMessage,
  aiValidationHighlightKeys
}
```

`packetStatus` gates whether detailed declaration rows are currently visible. Active-system returns remain visible in the dossier when discovered, including while a declaration packet is pending. `aiValidationHighlightKeys` is added when AI Validation evaluates visible evidence. `actualViolations`, `benignHintRuleIds`, `ruleEvidence`, and anomaly scores are hidden state and must not directly drive normal UI verdicts.

### Engine State

The singleton `SpaceCustoms.engine.state` owns:

- Current mode and shift timing.
- Score, mistakes, and resource counters.
- Active regulation IDs.
- Active regulation variants.
- Traffic and selected ship/rule/report IDs.
- Ops Log entries, Lane Comms entries, and resolved-contact count.
- Side-panel collapse state.

Ship-specific scan, allegation, and AI Validation state remains on each generated ship. The Regulations panel owns the always-visible ruling controls, while the Active Systems panel owns scan and AI Validation actions.

Lane Comms entries are presentation state for non-proof radio transcript flavour. A scheduled entry can be inserted after a short delay, then reserves its row with a temporary `TX` or `RX` carrier label in the message area before revealing its transcript. Initial ship replies mark the declaration packet as received; Comms must not inspect hidden violation truth or otherwise determine correctness.

## Important Invariants

- `activeRuleIds` contains four distinct rules selected from `data.rules`.
- Ships may violate only active regulations.
- Every violation has a passive or dossier clue at or above `passiveTagThreshold`.
- Every scan-confirmed violation appears in the correct confirming report.
- Every dossier-confirmed violation has visible supporting fields in the dossier.
- Legal ships may contain benign anomalies but no hidden active violation.
- A scan-confirmed regulation becomes markable when its confirming report is discovered, independent of report truth.
- A dossier-confirmed regulation is markable once a ship is selected and its declaration packet has been received.
- Detention succeeds only when alleged and actual violation sets match exactly.
- Any unresolved departure counts as a miss and does not count as a resolved contact.
- AI Validation considers only evidence currently visible to the player.
- Completed scan reports are opened from their scan button and displayed persistently in the Contact Dossier; the button state may show acquisition, unread, selected, or complete, but must not indicate whether the report proves a violation.

## Safe Extension Points

- Add flavour by extending entity pools in `data.js`.
- Add a regulation by defining its data, generation condition, clue, confirming report evidence, audit description, and class risk weights together.
- Add a scanner by extending `config.scans`, report generation, UI rendering expectations, and audit mappings.
- Add a new dossier section only when at least one mechanic asks the player to use it.
- Change balancing through `config.js` before embedding special cases in the engine.

Any new rule or scanner should be accompanied by generator-validation coverage and a manual check that the UI does not leak hidden truth.

## Verification

Use the commands in [`../AGENTS.md`](../AGENTS.md). Generator validation is especially important after changing probabilities, evidence metadata, rules, scanners, or class profiles.

Because the prototype has no automated browser suite, layout and interaction changes still require a manual browser playthrough when practical.
