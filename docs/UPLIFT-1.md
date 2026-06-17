# UPLIFT-1: Ship Data Depth And Manual Inspection

## Summary

This uplift expands ship generation, backing data, and regulation variety while preserving the core customs-inspection loop: read records, form suspicions, spend scanner power when needed, and make reversible allegations from evidence.

The main design shift is that not every violation should require an active scan. Roughly half of active regulations should be provable by manually comparing already-visible dossier and passive data. Scanners remain important for physical verification, hidden modules, cargo mass, reactor output, hull interrogation, and disputed paperwork.

The goal is not to make dossiers longer for atmosphere alone. Every new field should help the player:

- apply a regulation directly;
- identify a plausible false lead;
- choose a scanner with a hypothesis;
- understand audit feedback after a ruling.

## Current Constraints

Prototype-1 is a dependency-free static site loaded through ordered classic scripts. The uplift should keep that shape for now.

- Static domain content belongs in `data.js`.
- Balance, probabilities, thresholds, and scan configuration belong in `config.js`.
- Procedural construction, clue generation, report evidence, and validation belong in `ship-generator.js`.
- Mutable game state, allegation availability, scoring, departures, and audit text belong in `game-engine.js`.
- Rendering should stay evidence-driven and must not inspect hidden truth to reveal verdicts.

Existing invariants still apply:

- inactive regulations must never generate violations;
- every real violation needs a meaningful pre-resolution clue;
- scan reports return raw evidence, not pass/fail verdicts;
- clean ships may contain benign irregularities;
- detention succeeds only when allegations exactly match active violations;
- Focus Assist highlights anomalies, not offences or recommended actions.

## Regulation Model

Regulations should support two evidence paths.

### Scan-Confirmed Regulations

Scan-confirmed regulations keep the existing pattern:

```js
{
  id,
  code,
  title,
  criterion,
  confirmingScan: "modules",
  evidenceType: "scan"
}
```

The allegation control remains locked until the confirming report is discovered. UI copy should continue to show the relevant scanner, such as `Confirm: MODULE QUERY`.

Use scan confirmation for evidence that should require instrument work:

- measured hull or transponder mismatch;
- installed modules not visible in paperwork;
- measured mass or hidden cargo;
- reactor output samples;
- physical bay counts, seal anomalies, or concealed equipment.

### Dossier-Confirmed Regulations

Manual regulations are provable from already-visible records:

```js
{
  id,
  code,
  title,
  criterion,
  confirmingScan: null,
  evidenceType: "dossier"
}
```

Once a ship is selected, these rules are markable immediately. UI copy should say something like `Evidence: DOSSIER` instead of naming a scanner.

Use dossier confirmation for rule checks that are genuinely bureaucratic or relational:

- route permit does not match origin jurisdiction;
- cargo hazard class is incompatible with destination type;
- operator licence does not cover declared cargo;
- containment certificate does not satisfy the cargo class;
- registry authority does not issue the declared permit class.

Manual rules should not become easy "spot the bad label" checks. They should require comparing two or more visible values.

### Hybrid Regulations

Some rule families can have a manual lead and scan proof. For example, a service contractor or declared module family can hint at a component recall, but Module Query is needed to identify the installed lot.

Hybrid rules should use the scan-confirmed model for allegation gating unless the visible paperwork alone is sufficient under the active regulation text.

## Data Depth Roadmap

### Ships

Add ship attributes that connect identity, class, age, and operational role:

- generated vessel name and callsign;
- hull series and declared hull prefix;
- registry authority;
- hull age band or commission year;
- refit status;
- drive or reactor class;
- route profile, such as civil transfer, bonded freight, salvage return, survey transit, or relief charter.

Gameplay uses:

- registry rules can compare authority, hull prefix, and permit class;
- refit or age can create benign module and thermal false leads;
- route profile can constrain valid cargo, destination, or operator licence;
- class and role can bias, but must not hard-limit, likely violations.

### Ship Name Generator

Replace the short static `shipNames` list with composable name pools and templates.

Suggested pools should be broad enough that repeated play does not quickly expose the generator. Start with dozens of fragments per major category rather than a handful of finished names.

- poetic nouns: `Lantern`, `Wake`, `Psalm`, `Meridian`, `Vigil`;
- industrial nouns: `Hauler`, `Brace`, `Foundry`, `Ledger`, `Winch`;
- route nouns: `Gate`, `Polder`, `Relay`, `March`, `Anchorage`;
- qualifiers: `Cold`, `Blue`, `Grey`, `Cinder`, `Borrowed`;
- operator tags: company initials, registry suffixes, fleet numbers.

Suggested templates:

- poetic civilian: `{qualifier} {noun}`;
- freight: `{operatorCode}-{routeNoun}-{number}`;
- salvage: `{industrialNoun} {number}`;
- courier: `{qualifier} Vector`;
- colony shuttle: `{placeName} Transfer {number}`.

Names should remain flavour, but generated names can help sell class and operator identity without creating hidden rule logic.

### Registry ID Generator

Registry IDs should not always start with `J4`. The current fixed `J4` prefix should become one possible authority style among several.

Add registry authority objects:

```js
{
  id,
  name,
  code,
  jurisdiction,
  formats,
  permitGrades,
  restrictedPrefixes
}
```

The generator should choose an authority and format that fits the ship's class, route, and declared hull. IDs should look institutional and readable on a terminal, with segments that can support later rule checks.

Suggested format styles:

- compact civil: `{authority}-{classPrefix}-{serial}-{check}`, such as `J4-CF-7382-Q`;
- ledger style: `{authority}/{classPrefix}.{sector}-{serial}`, such as `LCL/CR.08-4417`;
- yard issue: `{authority}-{hullSeries}-{batch}.{serial}`, such as `DYA-KES-14.229`;
- frontier provisional: `{authority}-{routeCode}-{classPrefix}{serial}`, such as `FPR-TERN-SV91K`;
- bonded corporate: `{operatorCode}-{authority}-{serial}-{permitGrade}`, such as `VCT-MRA-6621-B`;
- restricted authority: `{authority}-{restrictedPrefix}-{serial}-{endorsementCode}`, such as `MIL-MX-4047-ACT`.

Suggested registry authorities:

- `J4 Registry Works`, civil lane registry;
- `Lattice Civic Ledger`, habitat and passenger registry;
- `Deneb Yard Authority`, shipyard-origin hull records;
- `Morrow Registry Annex`, freight and bonded cargo registry;
- `Frontier Provisional Register`, remote-port temporary records;
- `Corporate Transit Bureau`, operator-sponsored permits;
- `Military Active Ledger`, restricted and endorsed hulls.

Gameplay uses:

- dossier rules can compare registry authority, permit grade, route profile, and origin jurisdiction;
- Active Ping can confirm whether measured hull authority matches the declared registry;
- benign leads can use strange but valid provisional or bonded ID styles;
- audit text can cite the exact registry segment that mattered instead of treating the whole ID as opaque.

### Locations

Replace flat origin and destination strings with location objects:

```js
{
  id,
  name,
  kind,          // anchorage, belt, station, relay, habitat, shipyard, extraction zone
  jurisdiction,  // civil, corporate, military, quarantine, embargo, frontier
  portStatus,    // open, restricted, quarantine, sanction-watch, relief-only
  exportTags,
  importTags
}
```

Gameplay uses:

- route regulations can compare origin status against route endorsements;
- cargo regulations can compare destination kind against cargo hazard class;
- benign false leads can come from restricted but permitted ports;
- class and operator can be biased toward plausible routes.

### Operators

Replace flat company strings with operator objects:

```js
{
  id,
  name,
  code,
  homeJurisdiction,
  licenceScopes, // freight, passenger, salvage, survey, medical, hazardous, bonded
  permitGrade,
  reputationTags
}
```

Gameplay uses:

- operator licence rules can compare licence scope against cargo and route;
- reputation tags can create weak passive or paperwork anomalies;
- operator code can feed ship name templates and registry IDs.

### Cargo

Replace class-local cargo strings with cargo objects that can still be class-biased:

```js
{
  id,
  name,
  category,      // industrial, medical, agricultural, salvage, passenger, volatile, controlled
  hazardClass,   // none, bio, pressure, radiological, weapons-adjacent, volatile
  massRange,
  sealScheme,
  requiredCerts,
  allowedDestinationKinds
}
```

Gameplay uses:

- cargo hazard compatibility can be checked manually;
- seal and mass rules remain scan-confirmed through Hold Tomography;
- clean ships can carry suspicious but properly certified cargo.

### Manufacturers And Modules

Replace a single `bannedManufacturer` with richer manufacturer, module, model, and lot data:

```js
{
  id,
  name,
  jurisdiction,
  certifications,
  moduleFamilies: [
    {
      family,
      types,
      models,
      lotPrefixes,
      recallTags
    }
  ]
}
```

Gameplay uses:

- active rules can restrict a model family, lot prefix, certification, or firmware branch;
- Module Query can reveal exact installed components;
- service contractors can create pre-scan leads without proving the violation;
- known legal manufacturers can still have restricted lots.

Manufacturer and contractor names should also be generated from pools instead of a short finished-name list.

Suggested manufacturer pools:

- corporate roots: `Aegis`, `Morrow`, `Triton`, `Akheton`, `Pale`, `Cinder`, `Subach`, `Innes`, `Kestrel`, `Orison`;
- industrial suffixes: `Systems`, `Foundry`, `Dynamics`, `Works`, `Forge`, `Lattice`, `Instrument`, `Yards`, `Machinery`, `Controls`;
- legacy forms: `{founderA}-{founderB}`, `{place} Yard Services`, `{root} Certified Refit`;
- model prefixes: `CVR`, `MULE`, `RAD`, `KPR`, `VCTR`, `LATCH`, `PROM`, `ORION`, `MANTA`;
- lot suffixes: `A`, `B`, `C`, `K`, `R`, `field`, `dock`, `export`, `recert`.

The implementation can still keep curated finished names for tone, but the primary generation path should be compositional.

## Static Pool Organisation

UPLIFT-1 should intentionally add many more static string pools than the current prototype. The goal is not endless flavour; it is enough variety to stop regulations from becoming memorised bad strings.

Recommended pool groups:

- `shipNamePools`: qualifiers, poetic nouns, industrial nouns, route nouns, religious/procedural nouns, callsign fragments, fleet suffixes;
- `registryPools`: authorities, format templates, permit grades, sector codes, check characters, endorsement codes;
- `locationPools`: place roots, port types, belt names, station names, jurisdiction labels, route codes;
- `operatorPools`: company roots, operating forms, licence labels, reputation tags, fleet codes;
- `manufacturerPools`: roots, suffixes, founder names, module families, model prefixes, lot suffixes, firmware branches;
- `cargoPools`: commodity roots, packaging forms, hazard labels, certificate codes, seal schemes;
- `contractorPools`: yard names, bureau names, service types, certification labels.

Implementation guidance:

- Keep logic keyed by stable IDs, not generated display strings.
- Store generated display names on the ship once, so audit text and reports stay consistent.
- Prefer compositional pools with a few curated exceptions over only large finished-name arrays.
- If `data.js` becomes hard to navigate, split static pools into additional classic scripts such as `data-pools.js` or `data-names.js` loaded before `data.js`.
- If files are split, update `index.html`, `docs/ARCHITECTURE.md`, and `AGENTS.md` verification instructions in the same implementation change.
- Do not introduce a build step merely to split data; separate classic scripts are sufficient for this prototype.

## Regulation Families

### Route / Jurisdiction Compliance

Manual-first.

Example regulation:

> Vessels departing quarantine or sanction-watch ports require endorsement RTE-INSPECT before lane transit.

Visible evidence:

- origin;
- origin port status;
- destination;
- route permit;
- registry authority;
- transit endorsement.

Good violations:

- origin is quarantine, endorsement is missing;
- origin is embargo, permit grade is civil-only;
- destination is relief-only, route profile is commercial freight.

Good benign leads:

- restricted origin with the correct endorsement;
- quarantine-adjacent jurisdiction but open port status;
- unusual route profile with matching permit.

### Cargo Hazard Compatibility

Manual or hybrid.

Example regulation:

> Volatile or pressure cargo may enter civilian habitats only with containment certificate CN-HAB.

Visible evidence:

- cargo description;
- cargo hazard class;
- destination kind;
- containment certificate;
- seal scheme.

Scanner involvement:

- not required when the declared cargo itself violates the active rule;
- Hold Tomography may still confirm hidden cargo, mass mismatch, or false seals under separate scan-confirmed cargo rules.

Good benign leads:

- volatile cargo routed to an industrial station;
- civilian habitat destination with a valid containment certificate;
- medical cargo with scary wording but hazard class `none`.

### Operator Licence Scope

Manual-first.

Example regulation:

> Operators without hazardous freight scope may not carry cargo with hazard class bio, pressure, radiological, or volatile.

Visible evidence:

- operator;
- operator licence scopes;
- cargo category;
- hazard class;
- destination jurisdiction.

Good violations:

- passenger operator carrying volatile drill propellant;
- salvage licence carrying medical bio-culture without medical scope;
- civil transfer operator carrying weapons-adjacent components.

Good benign leads:

- limited-scope operator carrying industrial cargo that looks severe but is non-hazardous;
- operator with a broad bonded licence;
- hazardous cargo covered by a narrow but valid special endorsement.

### Component Recall / Lot Restriction

Hybrid.

Example regulation:

> Installed radiator governors in lot series CVR-11-B are restricted pending recall verification.

Visible lead evidence:

- declared module family;
- service contractor;
- recent refit status;
- EM apertures;
- maintenance note.

Confirming evidence:

- Module Query reveals installed type, manufacturer, model, lot, and firmware.

Good violations:

- exact recalled lot installed;
- restricted firmware branch installed on a controlled module type.

Good benign leads:

- same manufacturer but different model family;
- recalled lot serviced but no longer installed;
- suspicious contractor with legal module.

### Registry Identity / Hull Authority

Scan-confirmed.

This expands the current restricted military hull concept into broader hull authority comparisons.

Example regulation:

> Measured hull prefixes issued by restricted authorities require matching active endorsement.

Visible lead evidence:

- declared hull;
- registry authority;
- declared class;
- IFF coherence;
- endorsement field.

Confirming evidence:

- Active Ping reveals measured hull, measured geometry, beacon drift, and registry endorsement.

Good violations:

- measured restricted hull with no matching endorsement;
- declared civilian class masking military or expeditionary geometry;
- registry authority mismatch.

Good benign leads:

- noisy IFF with matching measured hull;
- restricted-looking declared prefix with valid endorsement;
- old hull geometry that is unusual but not restricted.

## V1 Implementation Slice

The first implementation pass should be deliberately bounded.

1. Add richer data pools:
   - location objects;
   - operator objects;
   - cargo objects with category, hazard, certificate, and destination compatibility;
   - manufacturer/module family objects;
   - registry authority objects and ID format templates;
   - ship name template pools.

2. Add evidence-mode support:
   - `evidenceType: "scan"` for current scanner-gated rules;
   - `evidenceType: "dossier"` and `confirmingScan: null` for manual rules;
   - UI text that renders `Evidence: DOSSIER` for manual rules.

3. Add two manual-first rules:
   - route / jurisdiction compliance;
   - operator licence scope or cargo hazard compatibility.

4. Add one hybrid rule:
   - component recall / lot restriction confirmed by Module Query.

5. Keep the existing scanners:
   - Active Ping;
   - Hold Tomography;
   - Module Query;
   - Thermal Lens.

6. Add a `ROUTE / AUTHORITY` dossier section only if the declaration section becomes too crowded. The section should contain values used by active manual rules rather than atmospheric-only records.

7. Update audit text:
   - missed manual violations should name the relevant dossier comparison;
   - unsupported manual allegations should list the visible values that failed to support the allegation;
   - scan-confirmed audit text should keep naming the confirming scanner.

8. Preserve type-ready JavaScript:
   - keep data shapes regular;
   - use stable IDs rather than display names for rule logic;
   - avoid one-off globals like `bannedManufacturer` or a universal `J4` registry prefix;
   - consider JSDoc typedefs before a full TypeScript migration.

## Generator And Balance Notes

Manual rules change the pacing because they do not consume scan power. Balance should account for this.

- A shift should include a mix of dossier-confirmed and scan-confirmed rules.
- Manual rules should require comparison, not a single field with an obvious bad value.
- Scan power should remain scarce enough that choosing not to scan can be correct.
- Clean ships should still contain benign route, licence, cargo, and module irregularities.
- Class profiles can bias rule likelihoods, but every class should remain eligible for every active rule.
- Active regulations should rotate from a larger pool so the player reads the briefing instead of memorising universal bans.

Suggested initial mix:

- two dossier-confirmed active rules;
- two scan-confirmed active rules;
- optional fifth rule in the pool as hybrid or scan-confirmed.

If active rule count stays at four, the shift selector may need to preserve a target evidence mix rather than choosing purely random rules.

## Validation Plan

Extend generator validation before or alongside the first implementation pass.

Validation should verify:

- every rule appears across a large generated sample;
- inactive rules never generate violations;
- every violation has visible pre-resolution evidence;
- dossier-confirmed rules have visible supporting fields in the dossier or passive survey;
- scan-confirmed rules appear in their confirming report;
- dossier-confirmed rules are markable without a completed scan;
- scan-confirmed rules remain locked until the confirming report is discovered;
- clean ships can generate benign manual irregularities;
- audit descriptions can be produced for every rule without relying on hidden-only data.

After JavaScript changes, run the existing syntax checks and generator validation from `AGENTS.md`.

Manual playtest checks:

- a player can solve at least one violating ship without scanning;
- a player still has good reasons to spend scan power;
- Focus Assist highlights suspicious evidence without naming a rule;
- the rules briefing is readable under time pressure;
- exact-match detention remains fair when manual and scan-confirmed violations coexist.

## TypeScript Timing

This uplift should not require an immediate TypeScript conversion.

Recommended path:

1. Implement UPLIFT-1 in type-ready JavaScript while the data model is still changing.
2. Keep new entity shapes regular and ID-driven.
3. Add JSDoc typedefs or `// @ts-check` if schema mistakes become painful.
4. Consider a TypeScript migration after the new rule/data model proves useful.

Convert earlier only if the implementation becomes dominated by shape errors and the project is ready to accept a build step.

## Assumptions

- This document is planning-only; implementation happens in later code changes.
- About half of active rules should be solvable from visible records alone.
- Paperwork/manual violations are markable immediately once a ship is selected.
- Scanners remain part of the core loop, but not every regulation requires one.
- New flavour is acceptable only when it supports inspection, suspicion, false leads, scanner choice, or audit clarity.
- Prototype-1 remains dependency-free and directly runnable from `index.html` for this uplift.
