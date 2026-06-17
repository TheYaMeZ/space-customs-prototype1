# Design Intent

## Project

The player operates a customs inspection workstation near a jumpgate or controlled space lane. Civilian ships enter the area under time pressure. The player reads their records, notices suspicious relationships, commits limited scanner power, and decides whether to clear or detain them.

This prototype exists to answer one question: **is the act of checking ships, forming suspicions, and confirming them enjoyable?**

The wider idea may eventually include patrol assets, communications, progression, corruption, unreliable AI, combat, and changing duty stations. Those are future possibilities, not requirements for this prototype.

## Player Fantasy

The player should feel like a competent operator using imperfect institutional machinery:

- Reading forms and sensor output rather than waiting for a quest marker.
- Developing intuition about which details deserve attention.
- Making calculated choices under moderate time and power pressure.
- Feeling responsible for a lane containing several moving contacts.
- Occasionally being fooled for understandable reasons, then learning from the audit.

The fantasy is closer to operating an old naval or aerospace workstation than commanding a sleek omniscient starship computer.

## Intended Mood

The setting is bureaucratic, industrial, and slightly worn:

- Outdated military-specification hardware still in active service.
- Heavy switches, phosphor displays, stamped panel codes, and dense technical forms.
- A future built from contractors, registries, manifests, adapters, old standards, and institutional jargon.
- Technology that is capable but bounded. Sensors take time, consume power, and produce data rather than answers.
- Dry procedural tension rather than heroic spectacle.

The interface should feel terminal-like without becoming a typing game. It should be legible and purposeful, not a decorative wall of noise.

## Design Pillars

### Informed Suspicion

The player should choose what to investigate from vessel class, passive readings, paperwork, and relationships between values. Scanner selection should follow a hypothesis, not a random guess.

Every real violation needs at least one meaningful clue before resolution. Some regulations are proven by comparing visible dossier fields, while others still require a confirming scan. Clean ships may carry benign anomalies so a clue never becomes automatic proof.

### Raw Evidence, Not Verdicts

Active systems reveal measured hulls, masses, modules, licences, and reactor samples. They do not say `PASS`, `FAIL`, or `VIOLATION`.

The player compares those values against the active regulations and decides what they mean.

### Reversible Judgment

After the relevant scan exists, the player may mark or remove an allegation. Marking an allegation must not reveal whether it is correct. The final ruling is evaluated only when the player clears or detains the ship.

Detention requires the allegations to exactly match the real active-rule violations. A clean ruling requires no allegations.

### Bounded Assistance

Focus Assist is an anomaly finder, not a rule tutor or automated inspector. It highlights the strongest currently visible irregularity and re-evaluates when new scan data arrives. It never names a regulation, recommends an active system, or declares compliance.

### Useful Pressure

Contacts remain long enough to read, but unresolved ships eventually leave and count as misses whether clean or violating. Scanner power regenerates periodically, allowing strategic restraint rather than permanent resource starvation.

## Current Prototype Loop

1. Read the four active regulations before starting the shift.
2. Monitor incoming contacts and their remaining lane time.
3. Review passive readings, declaration data, cargo paperwork, and lower-confidence irregularities expressed through the records themselves.
4. Form a suspicion and run one or more active systems.
5. Read the resulting raw scan record.
6. Mark any alleged active-rule violations whose evidence path is available: dossier rules are markable from the visible packet, while scan-confirmed rules require their report.
7. Remove accidental or reconsidered allegations as needed.
8. Clear a ship with no allegations, or detain it with the exact alleged violation set.
9. Use the Ops Log and end-of-shift report to understand mistakes and resource use.

Current shifts last ten minutes. Four regulations are active, selected as a mix of dossier-confirmed and scan-confirmed rules. Up to four contacts may occupy the lane. Active systems take two to four seconds, consume a shared eight-point power reserve, and power regenerates over time.

## Current Evidence Language

The passive survey uses neutral anomaly categories:

- `MASS VAR`
- `THERMAL VAR`
- `IFF ECHO`
- `EM ECHO`

These indicate that a broad sensor channel is unusual enough to inspect. They are not offences and should not map one-to-one to guilt.

Dossier fields may still carry hidden irregularity scores for Focus Assist and generator validation, but dossier rows should not show category badges. Manual-rule play should come from reading and comparing records, not from spotting `DOC VAR` or other internal labels.

Ship classes bias which violations are more common and define normal passive baselines. They must never hard-restrict a class to one kind of offence, and the UI should not explicitly teach a class lookup table.

## Active Regulations

- `REG-12`: restricted hull authority, confirmed by Active Ping.
- `ARM-04`: civil defensive-system licensing, confirmed by Module Query.
- `MAT-31`: active component recall lot, confirmed by Module Query.
- `OPS-08`: reactor output above rated limits, confirmed by Thermal Lens.
- `CAR-19`: cargo mass or seal mismatch, confirmed by Hold Tomography.
- `RTE-17`: restricted-origin route endorsement, confirmed from dossier records.
- `LIC-22`: operator licence scope, confirmed from dossier records.
- `CAR-27`: habitat cargo containment certificate, confirmed from dossier records.

Only active regulations may generate violations during a shift.

## Anti-Goals

- Do not make every available scanner mandatory for every ship.
- Do not encode guilt as a memorisable collection of special "bad strings."
- Do not enable, colour, or label controls based on hidden correctness.
- Do not let scanners or Focus Assist state the answer.
- Do not fill the screen with independent cards when a compact technical form communicates the data better.
- Do not add flavour records that have no gameplay relationship merely to make the dossier longer.
- Do not expand into combat, progression, or narrative before the inspection loop is understood.

## Open Design Questions

- Is the clue density sufficient for informed scanner choices without becoming obvious?
- Are benign irregularities understandable false leads or merely noise?
- Does having four active regulations create useful variety or excessive reference burden?
- Is Focus Assist valuable enough to spend, while still withholding the answer?
- Are time pressure, contact count, scan power, and recharge producing meaningful prioritisation?
- Does exact-match detention feel fair when a ship carries multiple violations?
- Which regulations or evidence relationships should be added in the next prototype?

## Source Material

[`../IDEA.md`](../IDEA.md) contains the broader game concept. [`../prototype1-scope.md`](../prototype1-scope.md) defines the original reduction in scope. This document is canonical when those early notes differ from playtest-driven decisions in the current prototype.
