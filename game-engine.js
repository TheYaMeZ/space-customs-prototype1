(function initGameEngine(namespace) {
  const { data, config, utils, generator } = namespace;

  const state = {
    mode: "briefing",
    timeLeft: config.shiftDuration,
    score: 0,
    mistakes: 0,
    assistsLeft: config.assistCharges,
    scanPower: config.maxScanPower,
    powerRechargeIn: config.powerRechargeInterval,
    powerSpent: 0,
    powerRegenerated: 0,
    scansUsed: {},
    focusUses: 0,
    activeRuleIds: [],
    ruleVariants: {},
    nextShipId: 1,
    nextSpawnAt: config.shiftDuration - 10,
    traffic: [],
    selectedShipId: null,
    selectedRuleId: null,
    selectedReportId: null,
    log: [],
    resolvedShips: 0,
    collapsed: { rules: false, systems: false }
  };

  function refresh() {
    namespace.ui?.render();
  }

  function activeRules() {
    return state.activeRuleIds.map((ruleId) => {
      const rule = data.rules.find((item) => item.id === ruleId);
      const variant = state.ruleVariants[ruleId];
      return variant ? { ...rule, criterion: variant.criterion ?? rule.criterion, activeVariant: variant } : rule;
    });
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

  function addLog(message, tone = "info") {
    state.log.unshift({ id: `${Date.now()}-${Math.random()}`, message, tone });
    state.log = state.log.slice(0, 24);
    namespace.ui?.renderLog();
  }

  function scheduleNextSpawn() {
    state.nextSpawnAt = state.timeLeft - utils.randInt(config.contactSpawn[0], config.contactSpawn[1]);
  }

  function spawnShip() {
    if (state.mode !== "active" || state.traffic.length >= config.maxContacts) return;
    const ship = generator.generateShip(state.activeRuleIds, state.nextShipId++, state.ruleVariants);
    state.traffic.push(ship);
    state.selectedShipId ??= ship.id;
    addLog(`${ship.name} entered lane control. Passive survey and declaration packet received.`);
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

    const report = ship.reports.find((item) => item.action === scanId);
    if (report.discovered || ship.scansRunning[scanId]) return;
    if (state.scanPower < scan.cost) {
      addLog(`${scan.label}: insufficient scan power.`, "warn");
      return;
    }

    state.scanPower -= scan.cost;
    state.powerSpent += scan.cost;
    state.scansUsed[scanId] = (state.scansUsed[scanId] ?? 0) + 1;
    ship.scansRunning[scanId] = scan.duration;
    addLog(`${scan.label} committed to ${ship.name}; ${scan.cost} power debited.`);
    refresh();
  }

  function evaluateAssist(ship) {
    if (!ship?.assistActive) return;
    const visible = generator.visibleAnomalies(ship);
    const strongest = visible.reduce((best, item) => item.anomalyScore > (best?.anomalyScore ?? -1) ? item : best, null);

    if (!strongest || strongest.anomalyScore < config.assistThreshold) {
      ship.assistHighlightKeys = [];
      ship.assistMessage = "NO NOTABLE IRREGULARITY IN AVAILABLE DATA";
      return;
    }

    const isRecordCheck = !strongest.key.startsWith("passive.") && !strongest.key.startsWith("scan.");
    ship.assistHighlightKeys = visible
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
    ship.assistMessage = `PATTERN ISOLATED: ${category}`;
  }

  function useAssist() {
    const ship = getShip();
    if (!ship) {
      addLog("Focus Assist requires a selected contact.", "warn");
      return;
    }
    if (ship.assistActive) {
      addLog(`Focus Assist is already active on ${ship.name}.`);
      return;
    }
    if (state.assistsLeft <= 0) {
      addLog("No Focus Assist cycles remain.", "warn");
      return;
    }

    ship.assistActive = true;
    state.assistsLeft -= 1;
    state.focusUses += 1;
    evaluateAssist(ship);
    addLog(`${ship.name}: ${ship.assistMessage}.`);
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
        evaluateAssist(ship);
        addLog(`${ship.name}: ${scanConfig(scanId).label} record available.`);
        if (ship.assistActive) addLog(`${ship.name}: Assist re-analysis: ${ship.assistMessage}.`);
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
    if (ship && rule?.evidenceType === "dossier") return true;
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
      addLog(`${rule.code} requires a completed ${scanConfig(rule.confirmingScan).label} record.`, "warn");
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
    const correct = decision === "clear"
      ? ship.actualViolations.length === 0
      : ship.actualViolations.length > 0 && setsMatch(ship.allegedViolationIds, ship.actualViolations);

    if (correct) {
      state.score += decision === "clear" ? 12 : 18;
      const detail = decision === "clear"
        ? "No active-rule violations present."
        : `Supported allegations: ${ship.actualViolations.map((ruleId) => describeViolation(ship, ruleId)).join(" | ")}`;
      addLog(`${ship.name}: ${decision.toUpperCase()} accepted. ${detail}`, "success");
    } else {
      state.mistakes += 1;
      state.score = Math.max(0, state.score - 10);
      addLog(`${ship.name}: ${auditFailureMessage(ship, decision)}`, "alert");
    }

    state.traffic = state.traffic.filter((item) => item.id !== ship.id);
    state.selectedShipId = state.traffic[0]?.id ?? null;
    state.selectedReportId = null;
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
      state.score = Math.max(0, state.score - 12);
      if (ship.actualViolations.length) {
        addLog(`${ship.name} departed. Missed: ${ship.actualViolations.map((ruleId) => missedViolationDetail(ship, ruleId)).join(" | ")}`, "alert");
      } else {
        addLog(`${ship.name} departed unresolved. Miss recorded; audit result: no active-rule violations.`, "alert");
      }
    });
    if (!getShip()) state.selectedShipId = state.traffic[0]?.id ?? null;
  }

  function tick() {
    if (state.mode !== "active") return;
    state.timeLeft -= 1;
    tickPowerRecharge();
    handleDepartures();
    if (state.timeLeft > 24 && state.timeLeft <= state.nextSpawnAt) spawnShip();
    if (state.timeLeft <= 0) endShift();
    else refresh();
  }

  function startShift() {
    state.mode = "active";
    namespace.ui.hideOverlay();
    addLog(`Shift active. Regulations: ${activeRules().map((rule) => rule.code).join(", ")}.`);
    spawnShip();
  }

  function endShift() {
    state.mode = "report";
    namespace.ui.showShiftReport();
    refresh();
  }

  function reset() {
    Object.assign(state, {
      mode: "briefing",
      timeLeft: config.shiftDuration,
      score: 0,
      mistakes: 0,
      assistsLeft: config.assistCharges,
      scanPower: config.maxScanPower,
      powerRechargeIn: config.powerRechargeInterval,
      powerSpent: 0,
      powerRegenerated: 0,
      scansUsed: {},
      focusUses: 0,
      activeRuleIds: [],
      ruleVariants: {},
      nextShipId: 1,
      nextSpawnAt: config.shiftDuration - 10,
      traffic: [],
      selectedShipId: null,
      selectedRuleId: null,
      selectedReportId: null,
      log: [],
      resolvedShips: 0,
      collapsed: { rules: false, systems: false }
    });
    state.activeRuleIds = generator.selectActiveRuleIds();
    state.ruleVariants = generator.selectRuleVariants(state.activeRuleIds);
    scheduleNextSpawn();
    addLog("Workstation initialised. Awaiting shift authority.");
    namespace.ui?.showBriefing();
    refresh();
  }

  namespace.engine = {
    state,
    activeRules,
    scanConfig,
    getShip,
    getSelectedReport,
    addLog,
    spawnShip,
    startScan,
    useAssist,
    hasConfirmingReport,
    toggleAllegation,
    resolveShip,
    tick,
    startShift,
    endShift,
    reset,
    evaluateAssist
  };
})(window.SpaceCustoms = window.SpaceCustoms || {});
