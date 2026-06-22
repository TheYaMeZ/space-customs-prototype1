# UPLIFT-2: Duty Station Campaign

## Summary

Extend the prototype beyond isolated inspection shifts with a lightweight campaign built from authored duty station postings.

The player should feel that they are moving through increasingly demanding customs assignments, building fluency with baseline law while adapting to posting-specific enforcement priorities. Standing Orders become the stable foundation of inspection practice, while Active Regulations make each posting feel distinct and responsive to its operational context.

This uplift should remain focused on the core question of the prototype: is reading records, forming suspicions, acquiring proof, and issuing rulings enjoyable? The campaign connects and teaches inspection shifts; it must not turn the prototype into a broad management game.

## Current Baseline

The current prototype has:

- eight regulation definitions;
- four regulations selected randomly for each shift;
- a fixed mix of two dossier-confirmed and two scan-confirmed regulations;
- one ten-minute shift followed by a report and full reset;
- no posting, campaign, progression, or persistent save state;
- a single active-rule set used by generation, allegations, exact-match rulings, and audit feedback.

The runtime lifecycle is currently:

`briefing -> active shift -> report -> reset`

UPLIFT-2 changes both the source of the enforced rules and the lifecycle around a shift. It is therefore a rule-model and state-ownership change before it is a panel-layout change.

## Goals And Constraints

### Campaign Shape

- Use an authored, linear campaign rather than procedural or branching postings.
- Divide the campaign into postings representing distinct duty stations, lanes, or operational contexts.
- Give each posting two or three shifts with a clear theme, a compact story arc, a characteristic traffic profile, and a limited set of related Active Regulations.
- Use the first posting as an onboarding chapter and implement it as the initial vertical slice.
- Keep campaign state in memory for this uplift. Refreshing the page intentionally starts a new campaign.

### Inspection Invariants

UPLIFT-2 must preserve the existing inspection principles:

- The player infers violations from plausible records.
- Every real violation has a meaningful pre-scan clue and an appropriate evidence path.
- Active systems return raw evidence rather than verdicts.
- Clean ships may contain benign irregularities.
- Allegations are reversible and do not reveal correctness before resolution.
- Detention requires the exact set of real enforced-rule violations.
- AI Validation may direct attention but must not name an offence or prescribe a scanner.
- The prototype remains dependency-free and directly runnable from `index.html`.

### Campaign Boundaries

- Do not add resource management, equipment purchasing, character statistics, or a strategic map.
- Keep story delivery short and operational: briefings, audit consequences, transfers, commendations, reprimands, and policy changes.
- Add dossier fields or systems only when a posting teaches or tests a meaningful inspection relationship.
- Do not use campaign progression to weaken evidence rules or reveal hidden truth.

## Rule Taxonomy

### Standing Orders

Standing Orders are cumulative, always-active baseline laws. Once introduced, they remain enforced in later shifts and represent knowledge the player is expected to carry forward.

They use the same evidence and allegation model as Active Regulations:

- a Standing Order may be dossier-confirmed or scan-confirmed;
- the player must mark a supported allegation before detaining a violating ship;
- a real Standing Order violation is part of the exact allegation set required for a successful detention;
- unsupported Standing Order allegations cause detention to fail and receive post-ruling audit feedback.

Standing Orders must describe interesting, evidence-based inspection relationships. Temporary workstation procedure is not a Standing Order. For example, waiting for a declaration packet before clearing a ship is an action-availability rule, not an offence worth alleging.

The campaign uses a provisional maximum of five cumulative Standing Orders. The first posting introduces one new baseline rule:

```js
{
  id: "commercial-service-authority",
  code: "LIC-01",
  title: "Commercial service authority",
  criterion: "Vessels declaring bonded freight, civil freight, or frontier freight service require operator licence scope FREIGHT.",
  confirmingScan: null,
  evidenceType: "dossier"
}
```

`LIC-01` compares `ROUTE PROFILE` with `OPERATOR LICENCE`. Legal traffic must include both ordinary broad licences and suspicious-looking narrow licences that remain valid for the declared service.

Completing the first posting promotes `CAR-19` to the cumulative Standing Order set. `LIC-22` and `ARM-04` remain candidates for later promotion, subject to their own posting designs and playtests. The campaign should not commit the remaining three permanent slots before later postings establish what deserves to become baseline practice.

### Active Regulations

Active Regulations are temporary, posting-specific enforcement priorities. They should be narrower and more contextual than Standing Orders, with roughly three active during a typical shift.

Examples include:

- cargo mass and seal verification during a commercial fraud posting;
- habitat containment requirements during a supply emergency;
- defensive-system licensing during a border-security posting;
- reactor-output enforcement after a gate-proximity incident;
- restricted-origin endorsement during a sanction or quarantine posting.

An existing regulation may begin as a posting-specific teaching rule and later become a Standing Order. Promotion must be an explicit authored posting reward. In the first posting, `CAR-19` is promoted after the resolution shift; `REG-12`, `MAT-31`, `OPS-08`, `RTE-17`, and `CAR-27` remain posting-specific.

### Enforced Rule Set

For a given shift, the enforceable rule set is:

`introduced Standing Orders + current shift Active Regulations`

Generation, clue guarantees, allegation availability, exact-match rulings, and audit feedback must all use this same union. Presentation may separate the categories, but adjudication must not create two competing truth models.

## Phase 0 Decisions

### Qualification And Retry Policy

Campaign advancement requires a successful shift audit. A shift passes only when:

- at least six contacts receive a ruling;
- at least 75% of all spawned contacts are ruled correctly;
- the scripted story contact is ruled correctly.

Any contact still unresolved at the six-minute cutoff counts as incorrect. To keep the hard cutoff fair, a shift must stop spawning new contacts at least 90 seconds before it ends.

Successful grades are:

- `QUALIFIED` for 75% through 89% accuracy;
- `COMMENDED` for 90% through 100% accuracy;
- `DEFICIENT` when any pass condition is missed.

Commendation changes feedback copy only. A deficient result repeats the same authored duty period with regenerated ordinary traffic and a rerolled story-contact truth variant. The narrative does not attempt to explain the repeated timeline.

### Teaching And Equipment Policy

- Active Regulations accumulate within a posting so each shift reinforces earlier concepts.
- Mature shifts should use roughly three Active Regulations in addition to accumulated Standing Orders.
- Only Hold Tomography is authorized during the first posting.
- Active Ping, Module Query, Thermal Lens, and AI Validation remain visible but locked, foreshadowing later instruction without adding usable actions.
- Each newly introduced rule receives at least one violating example and one benign false lead during its teaching shift.
- Guaranteed lesson contacts are shuffled into traffic so their arrival order does not reveal truth.
- The scripted story contact counts toward normal accuracy and throughput and must also be resolved correctly as a separate qualification condition.

### Questions Deferred Beyond The First Posting

- Which later postings earn promotion of `LIC-22`, `ARM-04`, or another new baseline relationship?
- Does the five-order ceiling remain readable once several orders are active?
- Should campaign completion offer restart only or a posting selector for replay and development?

### Before Committing The Panel Layout

- How many compact Standing Orders remain readable before scrolling becomes necessary?
- Does separating the two categories help the player understand permanence and posting context?
- Can allegations and final ruling controls remain visible with the expected maximum rule load?
- Does a temporarily expanded Regulations panel improve comparison, or obscure the dossier fields needed for that comparison?
- What happens at narrower viewport widths where doubling the panel is not viable?

The proposed double-width panel is a prototype option, not an established design decision. Test it against a simpler internal scroll or full-height reference mode before committing to it.

### Before Expanding Beyond One Posting

- Did players retain Standing Orders without repeatedly reopening every rule?
- Does cumulative law feel like growing competence or merely increasing reference burden?
- Are posting-specific regulations memorable because of context rather than conspicuous bad strings?
- Are later shifts harder through richer relationships and pressure, rather than only more rules?
- Do benign irregularities remain understandable as leads rather than arbitrary noise?

## Proposed Domain Model

The exact property names may change during implementation, but the interfaces should preserve these responsibilities.

### Regulation Definition

Keep campaign category out of the regulation definition:

```js
{
  id,
  code,
  title,
  criterion,
  confirmingScan,
  evidenceType // "dossier" or "scan"
}
```

Standing Order versus Active Regulation is contextual campaign state, not an immutable property of the law. This allows `CAR-19` to begin as an Active Regulation and later become a Standing Order without duplicating its definition or changing its evidence behavior.

### Posting Definition

```js
{
  id,
  title,
  dutyStation,
  theme,
  summary,
  initialStandingOrderIds,
  completionStandingOrderIds,
  shifts
}
```

A posting owns narrative and teaching progression. Static posting and shift definitions belong with other domain content rather than mutable engine state.

### Shift Definition

```js
{
  id,
  title,
  briefing,
  activeRegulationIds,
  introducedStandingOrderIds,
  duration,
  finalSpawnCutoff,
  authorizedScanIds,
  aiValidationAvailable,
  qualification,
  trafficProfile,
  lessonGuarantees,
  scriptedContact,
  consequenceCopy
}
```

The authored shift supplies its rule set and traffic profile. The generator must no longer choose the campaign rules independently. Random selection may remain available as a development or standalone mode only if it has a clear, separate entry path.

The first posting uses `duration: 360`, a 90-second final spawn cutoff, Hold Tomography as its only authorized scan, no AI Validation, and qualification thresholds of six rulings and 75% accuracy. Consequence copy supports deficient, qualified, and commended results without branching the authored campaign.

### Campaign State

```js
{
  postingIndex,
  shiftIndex,
  introducedStandingOrderIds,
  completedShiftResults,
  currentAttempt
}
```

Campaign state is session-only and owned by the engine. It selects the current authored shift and survives intershift transitions, but not a page refresh.

Shift-local state such as traffic, power, logs, allegations, scans, and time remaining must still reset between shifts. Campaign state must not be erased by that shift reset.

### Traffic Profile And Generator Input

Refactor generation conceptually toward an explicit input:

```js
generateShip(enforcedRuleIds, trafficProfile, shipId, ruleVariants, constraints)
```

The first two shifts use strict lesson pools. The third uses weighted class, cargo, hazard, destination, and operator selection. `constraints` supports reserved lesson cases and scripted contacts without teaching the general generator about campaign sequencing.

Lesson guarantees reserve a violation and a benign false lead for each newly introduced rule before remaining traffic is filled randomly. A retry rebuilds the reservations and random traffic from scratch.

### Scripted Contact

Each first-posting shift includes one authored Greywake Trade shipment. Its operator, identity, narrative purpose, and permitted evidence variants are fixed, but its actual clean or violating variant is rerolled for each attempt.

The scripted identity must never be a guilt cue. Variants must use ordinary evidence relationships supported by the enforced rules, and later shifts may include supported multi-rule cases. Mishandling or failing to resolve the contact makes the shift deficient regardless of aggregate accuracy.

## Posting 1: J4 Freight Annex

The first posting is a supervised civil-freight qualification with three six-minute shifts. Its story is a bureaucratic escalation: routine freight-ledger discrepancies lead to an operator-licence review and then a targeted habitat-supply audit. Recurring Greywake Trade shipments connect the shifts without making Greywake automatically guilty.

### Shift 1 - Freight Desk Certification

- Enforced rules: Standing Order `LIC-01`; Active Regulation `CAR-19`.
- Teach dossier comparison, passive mass cues, Hold Tomography, reversible allegations, Clear and Detain, and audit feedback.
- Use a strict Light Freighter and Courier pool with civil and bonded freight.
- Guarantee separate violating and benign-false-lead examples for both `LIC-01` and `CAR-19`.
- Add one Greywake shipment with clean, `LIC-01`, or `CAR-19` variants.

Briefing premise: the player begins supervised qualification while freight-ledger discrepancies increase across the annex.

### Shift 2 - Licence Review

- Enforced rules: Standing Order `LIC-01`; Active Regulations `CAR-19` and `LIC-22`.
- Retain the strict Light Freighter and Courier pool while increasing hazardous and weapons-adjacent cargo.
- Guarantee one `LIC-22` violation and one suspicious but properly authorized hazardous shipment.
- Return `LIC-01` and `CAR-19` to normal weighted selection after their Shift 1 guarantees.
- Add a second Greywake shipment with clean, single-rule, or supported multi-rule variants.

Briefing premise: the initial discrepancy report expands into a review of whether freight operators are authorized for their declared cargo.

### Shift 3 - Habitat Supply Audit

- Enforced rules: Standing Order `LIC-01`; Active Regulations `CAR-19`, `LIC-22`, and `CAR-27`.
- Use weighted civil traffic: approximately 50% Light Freighter, 20% Courier, 20% Colony Shuttle, and 10% Salvage Skiff or Prospector.
- Bias destinations toward habitats and cargo toward pressure, volatile, medical, and colony supplies.
- Guarantee one `CAR-27` violation and one suspicious but properly certified habitat shipment.
- Add the final Greywake shipment with clean, single-rule, or supported multi-rule variants.

Briefing premise: the freight review expands into a targeted habitat-supply audit. A qualified or commended result completes freight certification and adds `CAR-19` to the Standing Order set for the next posting.

### Greywake Contact Variants

Each contact keeps the listed identity, class, operator, route profile, and cargo context across attempts. Only its authored evidence variant changes. Display names are first-pass copy and may receive tone edits without changing the scenario contract.

#### Shift 1: Grey Ledger 41

- Light Freighter operated by Greywake Trade.
- Civil freight carrying laminated habitat glass.
- Allowed truth variants: clean, `LIC-01`, or `CAR-19`.
- The clean variant may carry a benign mass cue, but Hold Tomography must remain within the `CAR-19` tolerance and match the seal ledger.
- The `LIC-01` variant shows a licence record without `FREIGHT`; the `CAR-19` variant shows a measured mass or seal-ledger mismatch.

#### Shift 2: Grey Ledger 62

- Light Freighter operated by Greywake Trade.
- Bonded freight carrying weapons-adjacent drive components.
- Allowed truth variants: clean, `CAR-19`, `LIC-22`, or combined `CAR-19` and `LIC-22`.
- The clean variant includes valid freight and hazardous authority despite the suspicious cargo.
- The `LIC-22` variant lacks hazardous freight scope; physical cargo discrepancies remain independently controlled by the `CAR-19` variant.

#### Shift 3: Grey Ledger 88

- Light Freighter operated by Greywake Trade.
- Civil freight carrying pressure-class reactor coolant to Nacre Port habitat.
- Allowed truth variants: clean; one of `CAR-19`, `LIC-22`, or `CAR-27`; or an authored combination of two of those rules.
- The clean variant includes `FREIGHT`, hazardous authority, valid `CN-HAB` containment, matching seals, and cargo mass within tolerance.
- Violation variants change only the evidence relationships relevant to their selected rules. `LIC-01` remains satisfied so the final case tests the posting's accumulated cargo curriculum rather than every rule at once.

### First-Pass Briefing And Consequence Copy

Copy should remain clipped and institutional. It provides motivation and evaluation without explaining evidence or recommending an action.

#### Shift 1

- Briefing: `Supervised freight-desk certification is active. Ledger variance reports are elevated across civil and bonded consignments. Apply standing service authority and current cargo-accuracy controls.`
- Deficient: `Freight-desk certification withheld. Repeat duty period under audit observation.`
- Qualified: `Freight-desk procedure accepted. Authority extended to controlled cargo review.`
- Commended: `Freight-desk procedure exceeds qualification standard. Authority extended to controlled cargo review.`

#### Shift 2

- Briefing: `Prior ledger findings have opened an operator-scope review. Hazardous and weapons-adjacent consignments require particular attention under current authority.`
- Deficient: `Controlled cargo authority withheld. Repeat licence-review duty period.`
- Qualified: `Licence-review procedure accepted. Report forwarded to habitat supply control.`
- Commended: `Licence-review procedure exceeds qualification standard. Report forwarded with commendation.`

#### Shift 3

- Briefing: `Habitat supply control has ordered a containment audit on inbound civil freight. Apply all accumulated freight controls before lane release.`
- Deficient: `Freight qualification withheld pending a repeated habitat-supply audit.`
- Qualified: `J4 freight qualification granted. Cargo declaration accuracy is now standing practice.`
- Commended: `J4 freight qualification granted with commendation. Cargo declaration accuracy is now standing practice.`
- Transfer: `Freight Annex posting complete. Await next duty-station assignment.`

## Intershift Experience

Between shifts, show one concise screen containing:

- shift audit summary;
- short story consequence;
- next shift and posting context;
- next shift's Active Regulations;
- any newly introduced Standing Order;
- the action that advances, retries, transfers, or completes the campaign.

The screen should explain why the next priorities matter without teaching the solution, recommending a scanner, or adding evidence unavailable during inspection.

The existing overlay can be evolved for the vertical slice, but briefing, report, intershift, transfer, and campaign-complete states should be represented explicitly rather than inferred from button visibility.

## Regulations Panel UX

Split the panel conceptually into two sections:

1. **Standing Orders:** compact one-line reference rows for cumulative baseline law.
2. **Active Regulations:** full regulation rows using the current evidence and allegation presentation.

Compact Standing Order rows must still provide access to the complete criterion, evidence path, selected state, and reversible allegation action. Compactness must not turn them into unexplained codes or hide information needed for a ruling.

Prototype and compare:

- independent scrolling within the existing panel width;
- an expanded reference mode that temporarily widens the Regulations panel and narrows Active Systems;
- narrow-screen behavior where the panel must stack or use an overlay instead of doubling in width.

The Contact Dossier must remain usable while reading a rule. Allegations and final ruling controls should remain visible, and no layout state may change evidence availability.

## Phased Investigation And Implementation

### Phase 0 - Rule Taxonomy And Campaign Decisions

- Treat `LIC-01` as the initial Standing Order and `CAR-19` as the first authored promotion.
- Keep `LIC-22` and `ARM-04` as future candidates rather than committing all five permanent slots.
- Use a five-order provisional ceiling and approximately three Active Regulations in mature shifts.
- Require six rulings, 75% accuracy, and a correct scripted-contact ruling to advance.
- Regenerate traffic on a deficient retry; use 90% accuracy as the non-mechanical commendation threshold.
- Record consequential decisions in `docs/DECISIONS.md` only after they are accepted.

**Status:** first-pass decisions complete. Revisit only if the Phase 1 paper cases expose an evidence, pacing, or workload problem.

### Phase 1 - Campaign Content Specification

- Encode the three J4 Freight Annex shift definitions described above.
- Author the Greywake setup and truth variants for each shift.
- Define strict traffic pools for Shifts 1 and 2 and weighted civil traffic for Shift 3.
- Define reserved violation and false-lead lesson cases for every introduced rule.
- Draft briefing, deficient, qualified, commended, promotion, and transfer copy from the specified premises.
- Walk through clean, single-violation, multi-violation, benign-irregularity, scripted-contact, cutoff, and retry cases on paper.

**Status:** first-pass mechanics, scenario variants, and operational copy are complete. Paper walkthrough and tone polish remain before implementation.

### Phase 2 - Regulations Panel UX Prototype

- Render separate Standing Order and Active Regulation sections from representative maximum-load data.
- Design compact Standing Order rows without removing evidence or allegation access.
- Compare internal scrolling against the optional expanded reference mode.
- Test desktop, constrained-height, and narrow-width layouts.
- Confirm the dossier, systems, allegation list, and ruling controls remain usable in every layout state.

**Exit criteria:** a chosen panel behavior is readable at expected rule loads and does not obscure the evidence-comparison workflow.

### Phase 3 - Rule And Generator Plumbing

- Add authored availability while deriving Standing Order versus Active Regulation from campaign state rather than static rule category.
- Replace random campaign rule selection with the current shift's enforced-rule union.
- Pass the authored traffic profile into ship generation.
- Generate violations and benign hints only against enforced rules.
- Preserve dossier/scan evidence gating and exact-match adjudication across both categories.
- Extend generator validation for cumulative Standing Orders and posting-specific rules.

**Exit criteria:** generated ships obey the authored shift, every violation has a clue and proof path, and no inactive campaign rule can affect a ruling.

### Phase 4 - Campaign Lifecycle

- Separate campaign initialization from shift-state reset.
- Add explicit briefing, active, report/intershift, transfer, retry if selected, and campaign-complete transitions.
- Store posting index, shift index, introduced Standing Orders, and completed results in engine state.
- Populate intershift screens from authored definitions and actual shift results.
- Ensure starting the next shift clears contacts and shift resources without losing campaign progress.

**Exit criteria:** the player can complete the entire first posting in one browser session with correct rules, transitions, and accumulated Standing Orders.

### Phase 5 - Content Expansion And Balancing

- Playtest the vertical slice before authoring later postings.
- Measure rule-reference burden, missed-contact causes, scanner use, unsupported allegations, and retention of Standing Orders.
- Adjust rule count, traffic pressure, clue strength, and teaching pace through data and configuration.
- Add later postings only when each has a distinct inspection concept and traffic identity.

**Exit criteria:** the vertical slice demonstrates understandable teaching, meaningful escalation, and a manageable cumulative ruleset.

### Phase 6 - Canonical Documentation

- Update `docs/DESIGN.md` with the accepted campaign loop, Standing Order role, and intershift experience.
- Update `docs/ARCHITECTURE.md` with campaign definitions, state ownership, lifecycle, and generator interfaces.
- Record accepted rule-taxonomy, progression, panel, and persistence choices in `docs/DECISIONS.md`.
- Update verification instructions if script files or validation entry points change.

**Exit criteria:** canonical documentation describes the implemented and playtested behavior rather than speculative alternatives.

## Validation And Acceptance

### Generator And Rule Validation

- Every generated violation belongs to the union of introduced Standing Orders and current Active Regulations.
- Inactive or future campaign rules never generate violations.
- Every violation has a meaningful pre-scan clue and correct dossier or scan evidence.
- Benign irregularities remain possible for legal ships under both categories.
- Traffic profiles bias generation without making class or presentation deterministic proof.

### Adjudication

- Standing Orders and Active Regulations share reversible allegation behavior.
- Dossier-confirmed rules become markable from available dossier evidence.
- Scan-confirmed rules become markable only after their confirming report is discovered.
- Successful detention requires the exact violation set across both categories.
- Audit feedback identifies missing and unsupported allegations without leaking truth before resolution.

### Campaign Lifecycle

- Introduced Standing Orders remain active in every later shift.
- Active Regulations change only at authored shift boundaries.
- Shift-local state resets while campaign progress survives the transition.
- Intershift screens show the correct result, consequence, upcoming priorities, and new Standing Orders.
- A shift advances only with six or more rulings, at least 75% accuracy, and a correct scripted-contact ruling.
- A deficient retry regenerates ordinary traffic, lesson reservations, and the Greywake truth variant.
- Qualified and commended results advance identically; commendation changes copy only.
- Campaign completion offers the authored terminal action.
- Refreshing intentionally begins a new campaign.

### First Posting Experience

- Shift 1 teaches `LIC-01`, `CAR-19`, dossier reading, Hold Tomography, allegations, rulings, and audit feedback.
- Shift 2 retains earlier rules and adds `LIC-22` with guaranteed violating and benign hazardous examples.
- Shift 3 combines prior rules with `CAR-27` and broader weighted habitat-supply traffic.
- Only Hold Tomography is operable; other scanners and AI Validation are visible but locked.
- Each shift contains one Greywake contact whose identity is stable but truth variant is not.
- Mishandling the Greywake contact produces a deficient result even when aggregate thresholds are met.
- Completing Shift 3 promotes the existing `CAR-19` definition into the Standing Order set without duplication.
- Briefings provide operational motivation but do not reveal scanner choices or verdicts.

### Presentation And Technical Checks

- Manually test standard desktop, constrained-height, and narrow viewport layouts.
- Check long Standing Order lists, panel expansion or scrolling, allegation controls, and dossier readability.
- Confirm panel collapse and expansion never alter evidence or AI Validation behavior.
- Syntax-check every JavaScript file after implementation changes.
- Run generator validation after changing rule categories, clues, scans, traffic profiles, campaign rule selection, or generation.
- Complete a manual browser playthrough of the full first posting.

## Working Assumptions

- The first implementation target is one complete three-shift posting, not the full campaign.
- The campaign is authored and linear.
- Campaign progress is held in memory only.
- Standing Orders are cumulative, evidence-based offences using ordinary reversible allegations.
- Procedural action gates are not Standing Orders.
- The provisional Standing Order ceiling is five.
- A typical later shift has roughly three Active Regulations in addition to accumulated Standing Orders, subject to playtesting.
- Posting 1 uses six-minute hard-cutoff shifts and stops arrivals at least 90 seconds before cutoff.
- `QUALIFIED` and `COMMENDED` advance; `DEFICIENT` repeats the same duty period with regenerated traffic.
