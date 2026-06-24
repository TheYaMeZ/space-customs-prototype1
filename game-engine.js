(function initGameEngine(namespace) {
  const { data, config, utils, generator } = namespace;

  const state = {
    mode: "briefing",
    campaign: {
      mode: "campaign",
      postingIndex: 0,
      shiftIndex: 0,
      attemptNumber: 1,
      introducedStandingOrderIds: [],
      completedShiftResults: []
    },
    timeLeft: config.shiftDuration,
    score: 0,
    mistakes: 0,
    aiCyclesLeft: config.aiValidationCycles,
    scanPower: config.maxScanPower,
    powerRechargeIn: config.powerRechargeInterval,
    powerSpent: 0,
    powerRegenerated: 0,
    scansUsed: {},
    aiValidationsUsed: 0,
    activeRuleIds: [],
    activeRegulationIds: [],
    standingOrderIds: [],
    ruleVariants: {},
    nextShipId: 1,
    nextSpawnAt: config.shiftDuration - 10,
    traffic: [],
    selectedShipId: null,
    selectedRuleId: null,
    selectedReportId: null,
    log: [],
    comms: [],
    scheduledComms: [],
    commsClock: 0,
    resolvedShips: 0,
    plannedContacts: 0,
    spawnedContacts: 0,
    rulingsIssued: 0,
    correctContacts: 0,
    incorrectContacts: 0,
    departedContacts: 0,
    unresolvedAtCutoff: 0,
    scriptedContactResolved: false,
    scriptedContactCorrect: false,
    attemptPlan: [],
    nextPlanIndex: 0,
    emptyLaneShiftEndAt: null,
    lastShiftResult: null,
    rulesPanelMode: "normal",
    collapsed: { systems: false }
  };

  function refresh() {
    namespace.ui?.render();
  }

  function rulesForIds(ruleIds) {
    return ruleIds.map((ruleId) => {
      const rule = data.rules.find((item) => item.id === ruleId);
      const variant = state.ruleVariants[ruleId];
      return variant ? { ...rule, criterion: variant.criterion ?? rule.criterion, activeVariant: variant } : rule;
    }).filter(Boolean);
  }

  function activeRules() {
    return rulesForIds(state.activeRuleIds);
  }

  function standingOrders() {
    return rulesForIds(state.standingOrderIds);
  }

  function activeRegulations() {
    return rulesForIds(state.activeRegulationIds);
  }

  function currentPosting() {
    return data.postings[state.campaign.postingIndex] ?? null;
  }

  function currentShiftDefinition() {
    return currentPosting()?.shifts[state.campaign.shiftIndex] ?? null;
  }

  function currentTrafficProfile() {
    const shift = currentShiftDefinition();
    return shift ? config.campaign.shiftProfiles[shift.id] : {};
  }

  function isScanAuthorized(scanId) {
    return state.campaign.mode === "random" || currentShiftDefinition()?.authorizedScanIds.includes(scanId);
  }

  function isAiValidationAuthorized() {
    return state.campaign.mode === "random" || Boolean(currentShiftDefinition()?.aiValidationAvailable);
  }

  function scanConfig(scanId) {
    return config.scans.find((scan) => scan.id === scanId);
  }

  function getShip(shipId = state.selectedShipId) {
    return state.traffic.find((ship) => ship.id === shipId) ?? null;
  }

  function getSelectedReport() {
    const ship = getShip();
    return ship?.reports.find((report) => report.id === state.selectedReportId) ?? null;
  }

  function packetReceived(ship) {
    return ship?.packetStatus !== "pending";
  }

  function addLog(message, tone = "info") {
    state.log.unshift({ id: `${Date.now()}-${Math.random()}`, message, tone });
    state.log = state.log.slice(0, 24);
    namespace.ui?.renderLog();
  }

  function transmissionDuration(message) {
    return Math.min(3, Math.max(1, Math.ceil(message.length / 46)));
  }

  const scanControlCopy = {
    transponder: [
      (ship, scan) => `${ship.name}, submit to active transponder interrogation. Keep beacon power steady.`,
      (ship, scan) => `${ship.name}, J4 Customs will run ${scan.label.toLowerCase()}. Hold registry channel open.`,
      (ship, scan) => `${ship.name}, maintain lane vector. We are polling hull and authority records.`
    ],
    cargo: [
      (ship, scan) => `${ship.name}, prepare for hold tomography. Lock cargo bay shutters and stand by.`,
      (ship, scan) => `${ship.name}, submit to cargo scan. Keep mass dampers stable until acquisition closes.`,
      (ship, scan) => `${ship.name}, J4 Customs is imaging your declared load. No bay cycling during scan.`
    ],
    modules: [
      (ship, scan) => `${ship.name}, submit installed systems for module registry query.`,
      (ship, scan) => `${ship.name}, keep service bus open. We are checking component registry returns.`,
      (ship, scan) => `${ship.name}, J4 Customs is polling installed module licences. Hold configuration.`
    ],
    thermal: [
      (ship, scan) => `${ship.name}, steady reactor output for thermal lens acquisition.`,
      (ship, scan) => `${ship.name}, hold thrust idle. We are sampling your reactor profile.`,
      (ship, scan) => `${ship.name}, thermal lens pass inbound. Keep output inside normal operating band.`
    ]
  };

  function controlCopy(event, ship, scan = null) {
    const pools = {
      packet: [
        () => `${ship.name}, this is J4 Customs. Hold lane vector and transmit declaration packet.`,
        () => `${ship.name}, J4 Control. Maintain approach marker and uplink customs declaration.`,
        () => `${ship.name}, customs check is active. Freeze vector and send registry packet.`
      ],
      clear: [
        () => `${ship.name}, customs release granted. Resume filed route.`,
        () => `${ship.name}, you are clear through J4. Keep to filed corridor until beacon handoff.`,
        () => `${ship.name}, inspection closed. Proceed on declared transit vector.`
      ],
      detain: [
        () => `${ship.name}, hold position. Detention order follows on authority channel.`,
        () => `${ship.name}, do not depart lane. Power down transit burn and await authority transfer.`,
        () => `${ship.name}, customs hold is in effect. Maintain position for detention control.`
      ],
      correction: [
        () => `${ship.name}, ruling transmission logged. Hold for amended lane instruction.`,
        () => `${ship.name}, customs ruling is under audit correction. Maintain present vector.`,
        () => `${ship.name}, stand by. J4 is reconciling the ruling packet.`
      ]
    };
    if (event === "scan" && scan) return utils.randomFrom(scanControlCopy[scan.id] ?? [
      () => `${ship.name}, stand by for ${scan.label.toLowerCase()} acquisition. Maintain present attitude.`
    ])(ship, scan);
    return utils.randomFrom(pools[event])();
  }

  const commsResponses = {
    packet(ship) {
      return utils.randomFrom([
        `J4 Control, ${ship.name}. ${ship.className} packet is uplinked; holding inspection vector.`,
        `${ship.name} to J4. Declaration packet sent. Holding vector and awaiting customs readback.`,
        `J4, ${ship.name}. Packet transfer complete; nav is steady on your lane marker.`,
        `${ship.name} copies customs hold. Registry and load packet are on the wire.`,
        `J4 Control, ${ship.name}. Declaration is away. We are hands-off the lane vector.`,
        `${ship.name} responding. Packet is cleanly transferred; awaiting inspection sequence.`,
        `J4, we have you. ${ship.name} is holding and the declaration packet is live.`
      ]);
    },
    scanStandby(ship, scan) {
      return utils.randomFrom([
        `${ship.name} copies. Holding attitude for ${scan.label.toLowerCase()}.`,
        `Standing by for ${scan.label.toLowerCase()}, J4. Thrusters cold.`,
        `${ship.name}. Present attitude locked; ready for your ${scan.label.toLowerCase()}.`,
        `J4, ${ship.name}. We are steady. Run your ${scan.label.toLowerCase()}.`,
        `${ship.name} copies scan order. No bay or bus changes until you release us.`,
        `Holding for customs acquisition. Call when the ${scan.label.toLowerCase()} is closed.`,
        `${ship.name} has the lane lock. Proceed with ${scan.label.toLowerCase()}.`,
        `Copy, J4. Crew is standing off controls for your scan pass.`
      ]);
    },
    scanReturn(ship, scan) {
      return utils.randomFrom([
        `${scan.label.toLowerCase()} return complete. Holding for customs instruction.`,
        `J4, ${ship.name}. ${scan.label.toLowerCase()} handshake closed; awaiting your call.`,
        `${ship.name} confirms ${scan.label.toLowerCase()} cycle complete. Still on lane vector.`,
        `Customs acquisition closed on our board. ${ship.name} remains at hold.`,
        `J4, our panel shows your ${scan.label.toLowerCase()} is complete. Standing by.`,
        `${ship.name}. Scan cycle ended; no manoeuvre pending your release.`,
        `Return acknowledged. ${ship.name} is waiting on customs disposition.`,
        `J4 Control, ${ship.name}. Your scan pass is clear of our bus.`
      ]);
    },
    clear(ship) {
      return utils.randomFrom([
        `${ship.name} copies release. Resuming filed route.`,
        `Customs release received, J4. ${ship.name} is outbound on filed vector.`,
        `${ship.name}. Release logged; thanks control.`,
        `J4, ${ship.name} is clear and coming back onto transit power.`,
        `${ship.name} copies clear. We will keep to the filed corridor.`,
        `Release received. ${ship.name} departing lane control.`,
        `Much obliged, J4. ${ship.name} is moving to beacon handoff.`,
        `${ship.name} has your release. Safe watch, control.`
      ]);
    },
    detain(ship) {
      return utils.randomFrom([
        `${ship.name} copies detention order. Holding position.`,
        `Detention order received, J4. ${ship.name} is safing drives.`,
        `${ship.name}. Holding for authority channel transfer.`,
        `J4, ${ship.name} acknowledges customs hold. Main burn is locked out.`,
        `Copy detention. ${ship.name} is maintaining lane position.`,
        `${ship.name} received. We are standing by for enforcement instructions.`,
        `Understood, J4. ${ship.name} will not depart controlled volume.`,
        `${ship.name} is holding. Crew requests authority channel when ready.`
      ]);
    }
  };

  function completeCommsEffect(entry) {
    if (entry.onComplete?.type !== "packet-received") return;
    const ship = getShip(entry.onComplete.shipId);
    if (!ship || ship.packetStatus === "received") return;
    ship.packetStatus = "received";
    addLog(`${ship.name}: declaration packet received.`);
  }

  function insertComms(entry) {
    state.comms.unshift({
      ...entry,
      status: "pending",
      revealAt: state.commsClock + transmissionDuration(entry.message)
    });
    state.comms = state.comms.slice(0, 24);
    namespace.ui?.renderComms();
  }

  function addComms({ direction = "rx", speaker = "LANE", message, tone = "traffic", delay = 0, onComplete = null }) {
    if (!message) return;
    const entry = {
      id: `${Date.now()}-${Math.random()}`,
      direction,
      speaker,
      message,
      tone,
      onComplete,
      startsAt: state.commsClock + delay
    };
    if (delay > 0) {
      state.scheduledComms.push(entry);
      return;
    }
    insertComms(entry);
  }

  function tickComms() {
    let changed = false;
    const due = state.scheduledComms.filter((entry) => entry.startsAt <= state.commsClock);
    state.scheduledComms = state.scheduledComms.filter((entry) => entry.startsAt > state.commsClock);
    due.forEach(insertComms);
    state.comms.forEach((entry) => {
      if (entry.status === "pending" && state.commsClock >= entry.revealAt) {
        entry.status = "complete";
        completeCommsEffect(entry);
        changed = true;
      }
    });
    if (changed) refresh();
  }

  function scheduleNextSpawn() {
    const range = state.campaign.mode === "campaign" ? config.campaign.contactSpawn : config.contactSpawn;
    state.nextSpawnAt = state.timeLeft - utils.randInt(range[0], range[1]);
  }

  function accelerateNextSpawn() {
    if (state.campaign.mode !== "campaign" || state.traffic.length || state.nextPlanIndex >= state.attemptPlan.length) return;
    state.nextSpawnAt = Math.max(state.nextSpawnAt, state.timeLeft - config.campaign.emptyLaneSpawnDelay);
  }

  function isCampaignLaneExhausted() {
    return state.mode === "active" &&
      state.campaign.mode === "campaign" &&
      state.traffic.length === 0 &&
      state.nextPlanIndex >= state.attemptPlan.length;
  }

  function updateExhaustedLaneAutoEnd() {
    if (!isCampaignLaneExhausted()) {
      state.emptyLaneShiftEndAt = null;
      return false;
    }
    if (state.emptyLaneShiftEndAt === null) {
      state.emptyLaneShiftEndAt = state.commsClock + config.campaign.emptyLaneShiftEndDelay;
      addLog(`No further scheduled contacts. Closing shift audit in ${config.campaign.emptyLaneShiftEndDelay} seconds.`);
      return false;
    }
    if (state.commsClock < state.emptyLaneShiftEndAt) return false;
    finishShift();
    return true;
  }

  function spawnShip() {
    if (state.mode !== "active" || state.traffic.length >= config.maxContacts) return;
    let ship;
    if (state.campaign.mode === "campaign") {
      if (state.timeLeft <= config.campaign.finalSpawnCutoff || state.nextPlanIndex >= state.attemptPlan.length) return;
      const slot = state.attemptPlan[state.nextPlanIndex++];
      ship = generator.generateShip({
        shipId: state.nextShipId++,
        enforcedRuleIds: state.activeRuleIds,
        ruleVariants: state.ruleVariants,
        trafficProfile: currentTrafficProfile(),
        constraints: slot.constraints
      });
    } else {
      ship = generator.generateShip({
        shipId: state.nextShipId++,
        enforcedRuleIds: state.activeRuleIds,
        ruleVariants: state.ruleVariants
      });
    }
    ship.packetStatus = "pending";
    state.traffic.push(ship);
    state.spawnedContacts += 1;
    state.selectedShipId ??= ship.id;
    addLog(`${ship.name} entered lane control. Passive survey acquired; declaration packet requested.`);
    addComms({
      direction: "tx",
      speaker: "J4 CONTROL",
      message: controlCopy("packet", ship)
    });
    addComms({
      direction: "rx",
      speaker: ship.name,
      message: commsResponses.packet(ship),
      delay: 2,
      onComplete: { type: "packet-received", shipId: ship.id }
    });
    scheduleNextSpawn();
    refresh();
  }

  function startScan(scanId) {
    const ship = getShip();
    const scan = scanConfig(scanId);
    if (!ship || !scan || state.mode !== "active") {
      addLog("Select an active contact before committing scan power.", "warn");
      return;
    }
    if (!isScanAuthorized(scanId)) {
      addLog(`${scan.label}: system not authorized for this posting.`, "warn");
      return;
    }

    const report = ship.reports.find((item) => item.action === scanId);
    if (report.discovered) {
      state.selectedReportId = report.id;
      report.unread = false;
      refresh();
      return;
    }
    if (ship.scansRunning[scanId]) return;
    if (state.scanPower < scan.cost) {
      addLog(`${scan.label}: insufficient scan power.`, "warn");
      return;
    }

    state.scanPower -= scan.cost;
    state.powerSpent += scan.cost;
    state.scansUsed[scanId] = (state.scansUsed[scanId] ?? 0) + 1;
    ship.scansRunning[scanId] = scan.duration;
    addLog(`${scan.label} committed to ${ship.name}; ${scan.cost} power debited.`);
    addComms({
      direction: "tx",
      speaker: "J4 CONTROL",
      message: controlCopy("scan", ship, scan)
    });
    addComms({
      direction: "rx",
      speaker: ship.name,
      message: commsResponses.scanStandby(ship, scan),
      delay: 1
    });
    refresh();
  }

  function evaluateAiValidation(ship) {
    if (!ship?.aiValidationActive) return;
    const visible = generator.visibleAnomalies(ship)
      .filter((item) => packetReceived(ship) || item.key.startsWith("passive.") || item.key.startsWith("scan."));
    const strongest = visible.reduce((best, item) => item.anomalyScore > (best?.anomalyScore ?? -1) ? item : best, null);

    if (!strongest || strongest.anomalyScore < config.aiValidationThreshold) {
      ship.aiValidationHighlightKeys = [];
      ship.aiValidationMessage = "NO NOTABLE IRREGULARITY IN AVAILABLE DATA";
      return;
    }

    const isRecordCheck = !strongest.key.startsWith("passive.") && !strongest.key.startsWith("scan.");
    ship.aiValidationHighlightKeys = visible
      .filter((item) => {
        const closeScore = item.anomalyScore >= strongest.anomalyScore - 12;
        if (!closeScore) return false;
        if (!isRecordCheck) return item.anomalyCategory === strongest.anomalyCategory;
        return item.ruleIds.some((ruleId) => strongest.ruleIds.includes(ruleId));
      })
      .map((item) => item.key);
    const category = strongest.key.startsWith("passive.") || strongest.key.startsWith("scan.")
      ? strongest.anomalyCategory
      : "RECORD CHECK";
    ship.aiValidationMessage = `PATTERN ISOLATED: ${category}`;
  }

  function useAiValidation() {
    const ship = getShip();
    if (!ship) {
      addLog("AI Validation requires a selected contact.", "warn");
      return;
    }
    if (!isAiValidationAuthorized()) {
      addLog("AI Validation is not authorized for this posting.", "warn");
      return;
    }
    if (ship.aiValidationActive) {
      addLog(`AI Validation is already active on ${ship.name}.`);
      return;
    }
    if (state.aiCyclesLeft <= 0) {
      addLog("No AI Validation cycles remain.", "warn");
      return;
    }

    ship.aiValidationActive = true;
    state.aiCyclesLeft -= 1;
    state.aiValidationsUsed += 1;
    evaluateAiValidation(ship);
    addLog(`${ship.name}: AI Validation: ${ship.aiValidationMessage}.`);
    refresh();
  }

  function tickScans(ship) {
    Object.keys(ship.scansRunning).forEach((scanId) => {
      ship.scansRunning[scanId] -= 1;
      if (ship.scansRunning[scanId] <= 0) {
        delete ship.scansRunning[scanId];
        const report = ship.reports.find((item) => item.action === scanId);
        report.discovered = true;
        report.unread = state.selectedShipId !== ship.id || state.selectedReportId !== report.id;
        evaluateAiValidation(ship);
        addLog(`${ship.name}: ${scanConfig(scanId).label} record available.`);
        addComms({
          direction: "rx",
          speaker: ship.name,
          message: commsResponses.scanReturn(ship, scanConfig(scanId))
        });
        if (ship.aiValidationActive) addLog(`${ship.name}: AI re-analysis: ${ship.aiValidationMessage}.`);
      }
    });
  }

  function tickPowerRecharge() {
    state.powerRechargeIn -= 1;
    if (state.powerRechargeIn > 0) return;
    state.powerRechargeIn = config.powerRechargeInterval;
    if (state.scanPower >= config.maxScanPower) return;
    state.scanPower += 1;
    state.powerRegenerated += 1;
  }

  function hasConfirmingReport(ship, ruleId) {
    const rule = activeRules().find((item) => item.id === ruleId);
    if (ship && rule?.evidenceType === "dossier") return packetReceived(ship);
    return Boolean(
      ship &&
      rule &&
      rule.confirmingScan &&
      ship.reports.some((report) => report.action === rule.confirmingScan && report.discovered)
    );
  }

  function setsMatch(left, right) {
    return left.length === right.length && left.every((item) => right.includes(item));
  }

  function toggleAllegation(ruleId) {
    const ship = getShip();
    const rule = activeRules().find((item) => item.id === ruleId);
    if (!ship || !rule) {
      addLog("Select an active contact and regulation before marking an allegation.", "warn");
      return;
    }
    state.selectedRuleId = rule.id;
    if (!hasConfirmingReport(ship, rule.id)) {
      const requirement = rule.evidenceType === "dossier"
        ? "received declaration packet"
        : `completed ${scanConfig(rule.confirmingScan).label} record`;
      addLog(`${rule.code} requires a ${requirement}.`, "warn");
      return;
    }

    if (ship.allegedViolationIds.includes(rule.id)) {
      ship.allegedViolationIds = ship.allegedViolationIds.filter((item) => item !== rule.id);
      addLog(`${ship.name}: ${rule.code} allegation removed.`);
    } else {
      ship.allegedViolationIds.push(rule.id);
      addLog(`${ship.name}: ${rule.code} marked as alleged.`);
    }
    refresh();
  }

  function reportValue(ship, action, label) {
    return ship.reports.find((report) => report.action === action)?.lines.find((line) => line.label === label)?.value;
  }

  function dossierValue(ship, label) {
    return ship.dossier.find((line) => line.label === label)?.value;
  }

  function describeViolation(ship, ruleId) {
    const rule = activeRules().find((item) => item.id === ruleId) ?? data.rules.find((item) => item.id === ruleId);
    const moduleReport = ship.reports.find((report) => report.action === "modules");
    const unlicensed = moduleReport?.lines.find((line) => line.label.endsWith(".LIC") && line.value === "NONE");
    const recalled = moduleReport?.lines.find((line) => line.label.endsWith(".LOT") && line.anomalyScore >= 90);
    const thermalSamples = ship.reports.find((report) => report.action === "thermal")?.lines
      .filter((line) => line.label.startsWith("SAMPLE."))
      .map((line) => Number.parseFloat(line.value)) ?? [];
    const details = {
      "commercial-service-authority": ship.ruleEvidence?.["commercial-service-authority"] ?? `route profile ${dossierValue(ship, "ROUTE PROFILE")}; operator scopes ${dossierValue(ship, "OPERATOR LICENCE")}`,
      "military-registry": `measured hull ${reportValue(ship, "transponder", "MEASURED.HULL")}; endorsement ${reportValue(ship, "transponder", "REGISTRY.ENDORSEMENT")}`,
      "weapon-license": `${unlicensed?.label.split(".")[0]} point-defence licence NONE`,
      "component-recall": `${recalled?.label.split(".")[0]} lot ${recalled?.value}; policy ${ship.ruleEvidence?.["component-recall"] ?? rule.criterion}`,
      "unsafe-reactor": `peak output ${thermalSamples.length ? Math.max(...thermalSamples).toFixed(1) : "unscanned"}%`,
      "manifest-match": `manifest ${reportValue(ship, "cargo", "MANIFEST.MASS")}; measured ${reportValue(ship, "cargo", "MEASURED.MASS")}; delta ${reportValue(ship, "cargo", "MASS.DELTA")}`,
      "route-endorsement": ship.ruleEvidence?.["route-endorsement"] ?? `${dossierValue(ship, "ORIGIN STATUS")}; route endorsement ${dossierValue(ship, "ROUTE ENDORSEMENT")}`,
      "operator-scope": ship.ruleEvidence?.["operator-scope"] ?? `${dossierValue(ship, "OPERATOR LICENCE")}; cargo hazard ${dossierValue(ship, "HAZARD CLASS")}`,
      "cargo-containment": ship.ruleEvidence?.["cargo-containment"] ?? `${dossierValue(ship, "HAZARD CLASS")} cargo to ${dossierValue(ship, "DESTINATION TYPE")}; containment ${dossierValue(ship, "CONTAINMENT CERT")}`
    };
    return `${rule.code}: ${details[ruleId]}`;
  }

  function primaryHint(ship, ruleId) {
    return [...ship.passiveSurvey, ...ship.dossier]
      .filter((item) => item.ruleIds.includes(ruleId))
      .sort((left, right) => right.anomalyScore - left.anomalyScore)[0];
  }

  function missedViolationDetail(ship, ruleId) {
    const rule = data.rules.find((item) => item.id === ruleId);
    const hint = primaryHint(ship, ruleId);
    const proof = rule.evidenceType === "dossier"
      ? "evidence in dossier"
      : `confirm with ${scanConfig(rule.confirmingScan).label}`;
    return `${describeViolation(ship, ruleId)}; cue ${hint?.anomalyCategory ?? hint?.label ?? "none"}; ${proof}`;
  }

  function unsupportedAllegationDetail(ship, ruleId) {
    const rule = data.rules.find((item) => item.id === ruleId);
    if (rule.evidenceType === "dossier") {
      const values = ship.dossier
        .filter((line) => line.ruleIds.includes(ruleId))
        .map((line) => `${line.label} ${line.value}`)
        .join(", ");
      return `${rule.code}: ${values || "no relevant dossier values"}; dossier did not support allegation`;
    }
    const report = ship.reports.find((item) => item.action === rule.confirmingScan);
    const values = (report?.lines ?? [])
      .filter((line) => line.ruleIds.includes(ruleId))
      .map((line) => `${line.label} ${line.value}`)
      .join(", ");
    return `${rule.code}: ${values || "no relevant values"}; ${scanConfig(rule.confirmingScan).label} showed no violation`;
  }

  function auditFailureMessage(ship, decision) {
    if (decision === "clear") {
      return `CLEAR failed. Missed: ${ship.actualViolations.map((ruleId) => missedViolationDetail(ship, ruleId)).join(" | ")}`;
    }
    if (ship.actualViolations.length === 0) {
      const unsupported = ship.allegedViolationIds.map((ruleId) => unsupportedAllegationDetail(ship, ruleId));
      return `DETAIN failed. Vessel had no active violations; unsupported allegations: ${unsupported.join(" | ") || "none supplied"}.`;
    }
    const missing = ship.actualViolations.filter((ruleId) => !ship.allegedViolationIds.includes(ruleId));
    const unsupported = ship.allegedViolationIds.filter((ruleId) => !ship.actualViolations.includes(ruleId));
    const parts = [];
    if (missing.length) parts.push(`missed: ${missing.map((ruleId) => missedViolationDetail(ship, ruleId)).join(" | ")}`);
    if (unsupported.length) {
      parts.push(`unsupported: ${unsupported.map((ruleId) => unsupportedAllegationDetail(ship, ruleId)).join(" | ")}`);
    }
    return `DETAIN failed. ${parts.join("; ")}`;
  }

  function resolveShip(decision) {
    const ship = getShip();
    if (!ship || state.mode !== "active") return;
    if (decision === "clear" && ship.allegedViolationIds.length) {
      addLog(`${ship.name}: remove all allegations before issuing CLEAR.`, "warn");
      return;
    }
    state.resolvedShips += 1;
    state.rulingsIssued += 1;
    const correct = decision === "clear"
      ? ship.actualViolations.length === 0
      : ship.actualViolations.length > 0 && setsMatch(ship.allegedViolationIds, ship.actualViolations);

    if (correct) {
      state.correctContacts += 1;
      state.score += decision === "clear" ? 12 : 18;
      const detail = decision === "clear"
        ? "No active-rule violations present."
        : `Supported allegations: ${ship.actualViolations.map((ruleId) => describeViolation(ship, ruleId)).join(" | ")}`;
      addLog(`${ship.name}: ${decision.toUpperCase()} accepted. ${detail}`, "success");
      addComms({
        direction: "tx",
        speaker: "J4 CONTROL",
        message: decision === "clear" ? controlCopy("clear", ship) : controlCopy("detain", ship)
      });
      addComms({
        direction: "rx",
        speaker: ship.name,
        message: decision === "clear" ? commsResponses.clear(ship) : commsResponses.detain(ship),
        delay: 1
      });
    } else {
      state.incorrectContacts += 1;
      state.mistakes += 1;
      state.score = Math.max(0, state.score - 10);
      addLog(`${ship.name}: ${auditFailureMessage(ship, decision)}`, "alert");
      addComms({
        direction: "tx",
        speaker: "J4 CONTROL",
        message: controlCopy("correction", ship)
      });
    }

    if (ship.isScriptedContact) {
      state.scriptedContactResolved = true;
      state.scriptedContactCorrect = correct;
    }

    state.traffic = state.traffic.filter((item) => item.id !== ship.id);
    state.selectedShipId = state.traffic[0]?.id ?? null;
    state.selectedReportId = null;
    accelerateNextSpawn();
    if (updateExhaustedLaneAutoEnd()) return;
    refresh();
  }

  function handleDepartures() {
    const departed = [];
    state.traffic.forEach((ship) => {
      ship.leaveIn -= 1;
      tickScans(ship);
      if (ship.leaveIn <= 0) departed.push(ship);
    });

    departed.forEach((ship) => {
      state.traffic = state.traffic.filter((item) => item.id !== ship.id);
      state.mistakes += 1;
      state.incorrectContacts += 1;
      state.departedContacts += 1;
      state.score = Math.max(0, state.score - 12);
      if (ship.actualViolations.length) {
        addLog(`${ship.name} departed. Missed: ${ship.actualViolations.map((ruleId) => missedViolationDetail(ship, ruleId)).join(" | ")}`, "alert");
      } else {
        addLog(`${ship.name} departed unresolved. Miss recorded; audit result: no active-rule violations.`, "alert");
      }
    });
    if (!getShip()) state.selectedShipId = state.traffic[0]?.id ?? null;
    accelerateNextSpawn();
    updateExhaustedLaneAutoEnd();
  }

  function tick() {
    if (state.mode !== "active") return;
    state.commsClock += 1;
    state.timeLeft -= 1;
    tickComms();
    tickPowerRecharge();
    handleDepartures();
    if (state.mode !== "active") return;
    const spawnCutoff = state.campaign.mode === "campaign" ? config.campaign.finalSpawnCutoff : 24;
    if (state.timeLeft > spawnCutoff && state.timeLeft <= state.nextSpawnAt) spawnShip();
    if (updateExhaustedLaneAutoEnd()) return;
    if (state.timeLeft <= 0) finishShift();
    else refresh();
  }

  function startShift() {
    state.rulesPanelMode = "normal";
    state.mode = "active";
    namespace.ui.hideOverlay();
    addLog(`Shift active. Enforced rules: ${activeRules().map((rule) => rule.code).join(", ")}.`);
    spawnShip();
  }

  function currentAccuracy() {
    const completed = state.correctContacts + state.incorrectContacts;
    return completed ? state.correctContacts / completed : null;
  }

  function evaluateQualification(stats, policy = config.campaign.qualification) {
    const completed = stats.correctContacts + stats.incorrectContacts;
    const accuracy = completed ? stats.correctContacts / completed : 0;
    const reasons = [];
    if (stats.rulingsIssued < policy.minimumRulings) reasons.push(`fewer than ${policy.minimumRulings} rulings`);
    if (accuracy < policy.qualifiedAccuracy) reasons.push(`accuracy below ${Math.round(policy.qualifiedAccuracy * 100)}%`);
    if (!stats.scriptedContactResolved || !stats.scriptedContactCorrect) reasons.push("Greywake audit shipment not ruled correctly");
    return {
      passed: reasons.length === 0,
      grade: reasons.length ? "deficient" : accuracy >= policy.commendedAccuracy ? "commended" : "qualified",
      accuracy,
      reasons
    };
  }

  function resetAttemptState(duration) {
    Object.assign(state, {
      mode: "briefing",
      timeLeft: duration,
      score: 0,
      mistakes: 0,
      aiCyclesLeft: state.campaign.mode === "campaign" && !currentShiftDefinition()?.aiValidationAvailable ? 0 : config.aiValidationCycles,
      scanPower: config.maxScanPower,
      powerRechargeIn: config.powerRechargeInterval,
      powerSpent: 0,
      powerRegenerated: 0,
      scansUsed: {},
      aiValidationsUsed: 0,
      activeRuleIds: [],
      activeRegulationIds: [],
      standingOrderIds: [],
      ruleVariants: {},
      nextShipId: 1,
      nextSpawnAt: duration - 10,
      traffic: [],
      selectedShipId: null,
      selectedRuleId: null,
      selectedReportId: null,
      log: [],
      comms: [],
      scheduledComms: [],
      commsClock: 0,
      resolvedShips: 0,
      plannedContacts: 0,
      spawnedContacts: 0,
      rulingsIssued: 0,
      correctContacts: 0,
      incorrectContacts: 0,
      departedContacts: 0,
      unresolvedAtCutoff: 0,
      scriptedContactResolved: false,
      scriptedContactCorrect: false,
      attemptPlan: [],
      nextPlanIndex: 0,
      emptyLaneShiftEndAt: null,
      lastShiftResult: null,
      rulesPanelMode: "normal"
    });
  }

  function prepareShiftAttempt(showBriefing = true) {
    const shift = currentShiftDefinition();
    resetAttemptState(config.campaign.shiftDuration);
    shift.introducedStandingOrderIds.forEach((ruleId) => {
      if (!state.campaign.introducedStandingOrderIds.includes(ruleId)) state.campaign.introducedStandingOrderIds.push(ruleId);
    });
    state.standingOrderIds = [...state.campaign.introducedStandingOrderIds];
    state.activeRegulationIds = [...shift.activeRegulationIds];
    state.activeRuleIds = [...new Set([...state.standingOrderIds, ...state.activeRegulationIds])];
    state.ruleVariants = generator.selectRuleVariants(state.activeRuleIds);
    state.attemptPlan = generator.createAttemptPlan(shift, currentTrafficProfile());
    state.plannedContacts = state.attemptPlan.length;
    addLog(`J4 Freight Annex / ${shift.title}. Awaiting shift authority.`);
    if (showBriefing) namespace.ui?.showBriefing();
    refresh();
  }

  function initializeCampaign() {
    state.campaign = {
      mode: "campaign",
      postingIndex: 0,
      shiftIndex: 0,
      attemptNumber: 1,
      introducedStandingOrderIds: [...data.postings[0].initialStandingOrderIds],
      completedShiftResults: []
    };
    state.rulesPanelMode = "normal";
    state.collapsed = { systems: false };
    prepareShiftAttempt(true);
  }

  function initializeRandomShift() {
    state.campaign = {
      mode: "random",
      postingIndex: 0,
      shiftIndex: 0,
      attemptNumber: 1,
      introducedStandingOrderIds: [],
      completedShiftResults: []
    };
    resetAttemptState(config.shiftDuration);
    state.activeRuleIds = generator.selectActiveRuleIds();
    state.activeRegulationIds = [...state.activeRuleIds];
    state.ruleVariants = generator.selectRuleVariants(state.activeRuleIds);
    addLog("Random inspection shift initialised. Awaiting shift authority.");
    namespace.ui?.showBriefing();
    refresh();
  }

  function finishShift() {
    if (state.mode !== "active") return;
    if (state.campaign.mode === "random") {
      state.mode = "intershift";
      namespace.ui.showShiftReport();
      refresh();
      return;
    }

    state.traffic.forEach((ship) => {
      state.incorrectContacts += 1;
      state.unresolvedAtCutoff += 1;
      state.mistakes += 1;
      if (ship.isScriptedContact) state.scriptedContactResolved = false;
    });
    state.traffic = [];
    state.selectedShipId = null;
    state.selectedReportId = null;
    state.scheduledComms = [];
    const qualification = evaluateQualification(state);
    const shift = currentShiftDefinition();
    const result = {
      shiftId: shift.id,
      attemptNumber: state.campaign.attemptNumber,
      grade: qualification.grade,
      passed: qualification.passed,
      accuracy: qualification.accuracy,
      reasons: qualification.reasons,
      plannedContacts: state.plannedContacts,
      spawnedContacts: state.spawnedContacts,
      rulingsIssued: state.rulingsIssued,
      correctContacts: state.correctContacts,
      incorrectContacts: state.incorrectContacts,
      departedContacts: state.departedContacts,
      unresolvedAtCutoff: state.unresolvedAtCutoff,
      scriptedContactCorrect: state.scriptedContactCorrect
    };
    state.lastShiftResult = result;
    state.campaign.completedShiftResults.push(result);

    const isFinalShift = state.campaign.shiftIndex === currentPosting().shifts.length - 1;
    if (result.passed && isFinalShift) {
      currentPosting().completionStandingOrderIds.forEach((ruleId) => {
        if (!state.campaign.introducedStandingOrderIds.includes(ruleId)) state.campaign.introducedStandingOrderIds.push(ruleId);
      });
      state.standingOrderIds = [...state.campaign.introducedStandingOrderIds];
      state.mode = "campaign-complete";
      namespace.ui.showCampaignComplete(result);
    } else {
      state.mode = "intershift";
      namespace.ui.showIntershift(result);
    }
    refresh();
  }

  function retryShift() {
    state.campaign.attemptNumber += 1;
    prepareShiftAttempt(false);
    startShift();
  }

  function advanceShift() {
    state.campaign.shiftIndex += 1;
    state.campaign.attemptNumber = 1;
    prepareShiftAttempt(false);
    startShift();
  }

  function continueFromOverlay() {
    if (state.mode === "briefing") return startShift();
    if (state.mode === "campaign-complete") return initializeCampaign();
    if (state.mode !== "intershift") return;
    if (state.campaign.mode === "random") return initializeRandomShift();
    return state.lastShiftResult?.passed ? advanceShift() : retryShift();
  }

  namespace.engine = {
    state,
    activeRules,
    standingOrders,
    activeRegulations,
    currentPosting,
    currentShiftDefinition,
    currentAccuracy,
    isScanAuthorized,
    isAiValidationAuthorized,
    scanConfig,
    getShip,
    getSelectedReport,
    addLog,
    addComms,
    spawnShip,
    startScan,
    useAiValidation,
    hasConfirmingReport,
    toggleAllegation,
    resolveShip,
    tick,
    startShift,
    finishShift,
    evaluateQualification,
    initializeCampaign,
    initializeRandomShift,
    prepareShiftAttempt,
    retryShift,
    advanceShift,
    continueFromOverlay,
    reset: initializeCampaign,
    evaluateAiValidation
  };
})(window.SpaceCustoms = window.SpaceCustoms || {});
