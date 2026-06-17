# Design Decisions

This file records consequential choices that are easy to accidentally reverse. It is not a chronological transcript or a list of every UI adjustment.

## D-001: The Prototype Tests Inspection, Not the Whole Game

**Decision:** Keep this prototype focused on reading ships, choosing scans, evaluating evidence, and issuing rulings.

**Why:** Combat, communications, progression, patrol dispatch, and narrative systems would make it harder to judge whether the core inspection loop is enjoyable.

**Consequence:** New features should earn their place by improving or testing that loop.

## D-002: Violations Are Relationships Between Normal-Looking Values

**Decision:** Generate full records whose values must be compared against regulations or one another.

**Why:** Separate pools of obviously "clean" and "odd" flavour strings become memorisable and turn inspection into pattern recall.

**Consequence:** A violation should be expressible through ordinary fields such as declared versus measured hull, licence versus installed module, rated versus sampled output, or declared versus measured mass.

## D-003: Scanners Return Raw Evidence

**Decision:** Active systems provide measured values without pass/fail headlines.

**Why:** A scanner verdict removes the central act of interpreting evidence.

**Consequence:** Report labels, colours, and button states may indicate availability or activity, but not correctness.

## D-004: Suspicion Uses Grounded Cues, Not Confidence Grades

**Decision:** Remove visible source-confidence classes and use passive anomalies, paperwork discrepancies, and class-biased generation instead.

**Why:** Confidence grades felt artificial and risked becoming a direct suspicion ranking rather than part of the fiction.

**Consequence:** Sources may have names for flavour, but they are not ranked `A-D`. Passive survey tags such as `MASS VAR` and `IFF ECHO` direct attention without proving guilt. Dossier irregularity metadata stays hidden so paperwork checks rely on comparing values.

## D-005: Ship Class Is Intuitive, Not a Lookup Table

**Decision:** Preserve class-biased risks and passive baselines internally, but remove the explicit Class Reference panel and class-tendency instructions.

**Why:** Class should support learned intuition rather than act as a deterministic scanner recommendation.

**Consequence:** Every class remains eligible for every active-rule violation.

## D-006: Four Regulations Rotate Per Shift

**Decision:** Select four of the five regulations for each shift and generate violations only from those active rules.

**Why:** Rotation creates reference pressure and replay variation without requiring a large rule library.

**Consequence:** Inactive rules must never punish the player. Scanner relevance may change with shift composition.

## D-007: Every Violation Has a Pre-Scan Lead

**Decision:** Guarantee at least one meaningful passive or paperwork clue for every real violation.

**Why:** Choosing an active system should be an informed hypothesis rather than random expenditure.

**Consequence:** Generator validation enforces clue and confirming-report coverage. Legal ships may still contain benign leads to prevent clues becoming proof.

## D-008: Focus Assist Finds Anomalies, Not Offences

**Decision:** Focus Assist activates per ship, consumes one of three shift charges, persists for that ship, and highlights the strongest visible anomaly group.

**Why:** Assistance should reduce search burden while preserving interpretation.

**Consequence:** It does not name a rule, recommend a scanner, or declare a verdict. It re-evaluates as scan reports become visible, and a weak result still consumes the charge.

## D-009: Allegations Are Evidence-Linked and Reversible

**Decision:** A scan-confirmed regulation can be marked after its confirming report is available, regardless of whether that report proves a violation. A dossier-confirmed regulation can be marked once the ship is selected because its evidence is already visible. Marks can be removed before resolution.

**Why:** Enabling a control based on hidden correctness gives away the answer, while irreversible filing makes accidental input disproportionately punishing.

**Consequence:** Marking or removing an allegation has no correctness feedback or score effect. `CLEAR` is unavailable while allegations remain.

## D-010: Detention Requires an Exact Allegation Set

**Decision:** A detention succeeds only when the allegations exactly match all real active-rule violations.

**Why:** Ignoring unsupported extra allegations rewards indiscriminate over-filing.

**Consequence:** Missing and unsupported allegations both fail the ruling and receive detailed post-ruling audit feedback.

## D-011: Unresolved Departures Always Count as Misses

**Decision:** Any ship leaving without a clear or detain ruling counts as a mistake, including a clean ship.

**Why:** The player's job includes processing traffic, not merely catching offenders.

**Consequence:** Departures receive the missed-contact score penalty, do not increase resolved-contact totals, and produce full debugging feedback in the Ops Log.

## D-012: Service Records Are Out Until They Serve a Rule

**Decision:** Remove the Service Record from generation and presentation.

**Why:** Its entries did not add a distinct useful comparison and consumed valuable dossier space.

**Consequence:** New record sections should not be added solely for atmosphere. Reintroduce service history only alongside mechanics that make it actionable.

## D-013: The Ops Log Is Persistent Workstation Feedback

**Decision:** Keep the Ops Log visible in the centre-bottom area rather than hiding it in a drawer.

**Why:** Ruling feedback and missed evidence are essential during prototype iteration.

**Consequence:** The log receives roughly one quarter of the centre panel and scrolls independently from contact data.

## D-014: The Interface Is Old, Heavy-Duty, and Information First

**Decision:** Use a restrained phosphor-and-amber terminal aesthetic with utilitarian panels, technical forms, visible acquisition states, and minimal imagery.

**Why:** The mood supports the fiction of bounded institutional hardware and makes text analysis feel like operating equipment.

**Consequence:** Avoid generic dashboard cards, glossy science-fiction holograms, decorative animation, and visual density that crushes the evidence.

## D-015: Manual Dossier Rules Are First-Class Regulations

**Decision:** Keep a mix of dossier-confirmed and scan-confirmed active regulations. Dossier rules are solved by comparing visible paperwork, route, licence, cargo, and authority values; scan rules still require active systems for physical proof.

**Why:** If every violation requires a scanner, pre-scan reading becomes only a way to choose instruments. Manual rules make document inspection itself part of the core game.

**Consequence:** Active-rule selection preserves a dossier/scan mix. Generator validation checks both evidence paths. Manual rules still need visible clues and benign false leads, and they must not collapse into single bad strings.
