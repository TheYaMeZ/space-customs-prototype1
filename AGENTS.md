# Project Guidance

This repository is a gameplay prototype for a retro-future space customs inspection game.

## Required Context

Before changing gameplay, presentation, or data generation, read:

1. [`docs/DESIGN.md`](docs/DESIGN.md) for the intended player experience, mood, and prototype goals.
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for script boundaries, state ownership, and data interfaces.
3. [`docs/DECISIONS.md`](docs/DECISIONS.md) before reversing an established design choice.

[`IDEA.md`](IDEA.md) and [`prototype1-scope.md`](prototype1-scope.md) are historical source documents. They explain where the project began, but the files under `docs/` describe the current intent.

## Core Invariants

- The player should infer violations from plausible records; controls must not reveal whether an inference is correct.
- Passive cues and AI Validation may direct attention, but must not issue verdicts or prescribe a scanner.
- Every real violation must have a meaningful pre-scan clue and a confirming active-system report.
- Clean ships may contain benign irregularities, so anomalies are reasons to investigate rather than proof.
- Allegations are reversible and receive correctness feedback only when the ship is cleared, detained, or leaves unresolved.
- Preserve the outdated, heavy-duty military terminal aesthetic and information-first layout.
- Keep the prototype dependency-free and directly runnable from `index.html` unless a build system becomes clearly necessary.

## Working Agreements

- Preserve the ordered classic-script architecture and the shared `window.SpaceCustoms` namespace.
- Put flavour pools and regulation definitions in `data.js`; put balancing constants in `config.js`.
- Update the canonical docs when a change alters design intent, an interface, or a consequential decision.
- Do not edit `IDEA.md` or `prototype1-scope.md` to make history match the current implementation.

## Verification

After JavaScript changes, syntax-check every script:

```powershell
$files = 'data.js','config.js','ship-generator.js','game-engine.js','ui.js','app.js'
foreach ($file in $files) { node --check $file; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
```

Run generator validation when changing rules, clues, scans, classes, or ship generation:

```powershell
@'
const fs = require('fs');
const vm = require('vm');
const context = { window: {} };
vm.createContext(context);
for (const file of ['data.js', 'config.js', 'ship-generator.js']) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
}
const result = context.window.SpaceCustoms.generator.validate(2000);
console.log(result);
if (!result.passed) process.exit(1);
'@ | node -
```
