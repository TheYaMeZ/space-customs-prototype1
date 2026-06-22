(function initUi(namespace) {
  const { data, config, engine } = namespace;
  const presentedAiTraceKeys = new WeakMap();

  const els = {
    workspace: document.querySelector("#workspace"),
    rulesPanel: document.querySelector("#rules-panel"),
    systemsPanel: document.querySelector("#systems-panel"),
    shiftTimer: document.querySelector("#shift-timer"),
    rulingsIssued: document.querySelector("#rulings-issued"),
    auditAccuracy: document.querySelector("#audit-accuracy"),
    aiCycles: document.querySelector("#ai-cycles-left"),
    scanPower: document.querySelector("#scan-budget"),
    powerRecharge: document.querySelector("#power-recharge"),
    rulesList: document.querySelector("#rules-list"),
    trafficLoad: document.querySelector("#traffic-load"),
    trafficList: document.querySelector("#traffic-list"),
    shipName: document.querySelector("#ship-name"),
    shipDeparture: document.querySelector("#ship-departure"),
    shipSummary: document.querySelector("#ship-summary"),
    shipDataBoard: document.querySelector("#ship-data-board"),
    actionGrid: document.querySelector("#action-grid"),
    allegationList: document.querySelector("#allegation-list"),
    clearShip: document.querySelector("#clear-ship"),
    detainShip: document.querySelector("#detain-ship"),
    logCount: document.querySelector("#log-count"),
    logList: document.querySelector("#log-list"),
    commsCount: document.querySelector("#comms-count"),
    commsList: document.querySelector("#comms-list"),
    overlay: document.querySelector("#overlay"),
    overlayEyebrow: document.querySelector("#overlay-eyebrow"),
    overlayTitle: document.querySelector("#overlay-title"),
    overlaySummary: document.querySelector("#overlay-summary"),
    overlayRules: document.querySelector("#overlay-rules"),
    overlayAction: document.querySelector("#overlay-action"),
    overlayRestart: document.querySelector("#overlay-restart")
  };

  function isAiTraced(ship, item) {
    return ship?.aiValidationActive && ship.aiValidationHighlightKeys?.includes(item.key);
  }

  function anomalyTag(item) {
    if (!item.anomalyCategory || item.anomalyScore < config.passiveTagThreshold) return "";
    return `<i class="anomaly-tag">${item.anomalyCategory}</i>`;
  }

  function formRow(ship, item) {
    return `
      <div class="form-row evidence-row ${isAiTraced(ship, item) ? "is-ai-traced" : ""}">
        <span>${item.label}</span>
        <strong>${item.value}</strong>
        <i class="ai-trace-mark ${isAiTraced(ship, item) ? "is-visible" : ""}" aria-hidden="true">AI TRACE</i>
      </div>
    `;
  }

  function renderStatus() {
    const { state } = engine;
    els.shiftTimer.textContent = `${state.timeLeft}s`;
    const minimumRulings = state.campaign.mode === "campaign" ? config.campaign.qualification.minimumRulings : "--";
    els.rulingsIssued.textContent = state.campaign.mode === "campaign" ? `${state.rulingsIssued}/${minimumRulings}` : state.resolvedShips;
    const accuracy = engine.currentAccuracy();
    els.auditAccuracy.textContent = accuracy === null ? "--" : `${Math.round(accuracy * 100)}%`;
    els.aiCycles.textContent = state.aiCyclesLeft;
    els.scanPower.textContent = `${state.scanPower}/${config.maxScanPower}`;
    els.powerRecharge.textContent = state.scanPower >= config.maxScanPower ? "FULL" : `+1 IN ${state.powerRechargeIn}s`;
  }

  function renderRules() {
    const { state } = engine;
    const ship = engine.getShip();
    const fullRuleRow = (rule) => {
      const selected = state.selectedRuleId === rule.id;
      const alleged = ship?.allegedViolationIds.includes(rule.id);
      const canMark = engine.hasConfirmingReport(ship, rule.id);
      const evidenceLine = rule.evidenceType === "dossier"
        ? "Evidence: DOSSIER"
        : `Confirm: ${engine.scanConfig(rule.confirmingScan).label}`;
      return `
        <div class="rule-row ${selected ? "is-selected" : ""} ${alleged ? "is-alleged" : ""}">
          <button class="rule-select" data-rule="${rule.id}">
            <div class="rule-select-top">
              <span>${rule.code}</span>
              ${selected ? '<b class="selected-marker">SELECTED</b>' : ""}
            </div>
            <strong>${rule.title}</strong>
            <small>${rule.criterion}</small>
          </button>
          <div class="rule-row-footer">
            <em>${evidenceLine}</em>
            <button class="rule-mark" data-allegation-rule="${rule.id}" ${canMark ? "" : "disabled"}>${alleged ? "REMOVE" : "MARK"}</button>
          </div>
        </div>
      `;
    };
    const compactOrderRow = (rule) => {
      const alleged = ship?.allegedViolationIds.includes(rule.id);
      const canMark = engine.hasConfirmingReport(ship, rule.id);
      return `
        <div class="standing-order-row ${alleged ? "is-alleged" : ""}">
          <b>${rule.code}</b>
          <span>${rule.shortCriterion ?? rule.criterion}</span>
          <button class="rule-mark standing-order-mark" data-allegation-rule="${rule.id}" ${canMark ? "" : "disabled"}>${alleged ? "REMOVE" : "MARK"}</button>
        </div>
      `;
    };
    const standing = engine.standingOrders();
    const regulations = engine.activeRegulations();
    els.rulesList.innerHTML = `
      <div class="rule-group-label">STANDING ORDERS</div>
      ${standing.length ? standing.map(compactOrderRow).join("") : '<p class="rule-group-empty">NONE ISSUED</p>'}
      <div class="rule-group-label">ACTIVE REGULATIONS</div>
      ${regulations.length ? regulations.map(fullRuleRow).join("") : '<p class="rule-group-empty">NONE ACTIVE</p>'}
    `;
    els.rulesList.querySelectorAll("[data-rule]").forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedRuleId = button.dataset.rule;
        render();
      });
    });
    els.rulesList.querySelectorAll("[data-allegation-rule]").forEach((button) => {
      button.addEventListener("click", () => {
        engine.toggleAllegation(button.dataset.allegationRule);
      });
    });
  }

  function renderTrafficTabs() {
    const { state } = engine;
    els.trafficLoad.textContent = `${state.traffic.length} CONTACT${state.traffic.length === 1 ? "" : "S"}`;
    els.trafficList.innerHTML = state.traffic.map((ship) => `
      <button class="contact-tab ${ship.id === state.selectedShipId ? "is-selected" : ""} ${ship.leaveIn <= 30 ? "is-urgent" : ""} ${ship.packetStatus === "pending" ? "is-packet-pending" : ""}" data-ship="${ship.id}">
        <strong>${ship.name}</strong><span>${ship.className}</span><span>${ship.packetStatus === "pending" ? "PKT WAIT" : `T-${ship.leaveIn}`}</span>
      </button>
    `).join("");
    els.trafficList.querySelectorAll("[data-ship]").forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedShipId = Number(button.dataset.ship);
        state.selectedReportId = null;
        render();
      });
    });
  }

  function dossierSection(ship, sectionId, heading, content, options = {}) {
    const collapsed = ship.collapsedDossierSectionIds?.includes(sectionId) ?? false;
    const contentId = `dossier-${ship.id}-${sectionId}`;
    return `
      <section class="form-section dossier-section ${collapsed ? "is-collapsed" : ""} ${options.selected ? "is-selected" : ""}" data-dossier-section="${sectionId}" ${options.reportId ? `data-report-id="${options.reportId}"` : ""}>
        <button class="dossier-section-toggle" data-dossier-toggle="${sectionId}" aria-expanded="${!collapsed}" aria-controls="${contentId}">
          <span>${heading}</span>
          <b aria-hidden="true">[${collapsed ? "+" : "-"}]</b>
        </button>
        <div id="${contentId}" class="dossier-section-content ${options.contentClass ?? ""}" ${collapsed ? "hidden" : ""}>
          ${content}
        </div>
      </section>
    `;
  }

  function reportRows(ship, report) {
    let currentGroup = null;
    return report.lines.map((item) => {
      const divider = item.group && item.group !== currentGroup
        ? `<div class="form-subhead"><span>MODULE ${item.group}</span></div>`
        : "";
      currentGroup = item.group;
      return `${divider}${formRow(ship, item)}`;
    }).join("");
  }

  function activeReturnSections(ship) {
    return ship.reports
      .filter((report) => report.discovered)
      .map((report) => {
        const scanIndex = config.scans.findIndex((scan) => scan.id === report.action);
        const sectionNumber = String(scanIndex + 4).padStart(2, "0");
        const scan = engine.scanConfig(report.action);
        return dossierSection(
          ship,
          `scan-${report.action}`,
          `${sectionNumber} / ${scan.label} RETURN`,
          `<div class="form-stack">${reportRows(ship, report)}</div>`,
          { selected: report.id === engine.state.selectedReportId, reportId: report.id }
        );
      })
      .join("");
  }

  function bindDossierSections(ship) {
    els.shipDataBoard.querySelectorAll("[data-dossier-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        const sectionId = button.dataset.dossierToggle;
        const collapsedIds = ship.collapsedDossierSectionIds ??= [];
        const collapsed = collapsedIds.includes(sectionId);
        ship.collapsedDossierSectionIds = collapsed
          ? collapsedIds.filter((id) => id !== sectionId)
          : [...collapsedIds, sectionId];

        const section = button.closest("[data-dossier-section]");
        const content = section.querySelector(".dossier-section-content");
        section.classList.toggle("is-collapsed", !collapsed);
        content.hidden = !collapsed;
        button.setAttribute("aria-expanded", String(collapsed));
        button.querySelector("b").textContent = `[${collapsed ? "-" : "+"}]`;
      });
    });
  }

  function expandDossierSections(ship, sectionIds) {
    if (!ship || !sectionIds.length) return;
    const sectionSet = new Set(sectionIds);
    ship.collapsedDossierSectionIds = (ship.collapsedDossierSectionIds ?? [])
      .filter((sectionId) => !sectionSet.has(sectionId));
  }

  function sectionIdsForEvidence(ship, evidenceKeys) {
    const sectionIds = new Set();
    evidenceKeys.forEach((key) => {
      if (ship.passiveSurvey.some((item) => item.key === key)) sectionIds.add("passive");
      if (ship.dossier.some((item) => item.key === key)) {
        if (key.startsWith("declaration.")) sectionIds.add("declaration");
        if (key.startsWith("route.")) sectionIds.add("route");
        if (key.startsWith("manifest.") || key.startsWith("load.")) sectionIds.add("cargo");
      }
      const report = ship.reports.find((item) => item.lines.some((line) => line.key === key));
      if (report) sectionIds.add(`scan-${report.action}`);
    });
    return [...sectionIds];
  }

  function revealNewAiTraceSections(ship) {
    const currentKeys = ship.aiValidationHighlightKeys ?? [];
    const previousKeys = presentedAiTraceKeys.get(ship) ?? [];
    const previousSet = new Set(previousKeys);
    const newKeys = currentKeys.filter((key) => !previousSet.has(key));
    expandDossierSections(ship, sectionIdsForEvidence(ship, newKeys));
    presentedAiTraceKeys.set(ship, [...currentKeys]);
  }

  function renderShip() {
    const ship = engine.getShip();
    renderTrafficTabs();
    if (!ship) {
      els.shipName.textContent = "NO CONTACT SELECTED";
      els.shipDeparture.textContent = engine.state.mode === "active" ? "AWAITING" : "STANDBY";
      els.shipSummary.textContent = "Select a contact to load its evidence packet.";
      els.shipDataBoard.innerHTML = '<p class="empty-state">NO DOSSIER DATA</p>';
      return;
    }

    els.shipName.textContent = ship.name;
    els.shipDeparture.textContent = `T-${ship.leaveIn} SEC`;
    els.shipSummary.textContent = ship.packetStatus === "pending"
      ? "Passive survey received. Waiting for vessel declaration packet over Lane Comms."
      : ship.pilotNote;
    revealNewAiTraceSections(ship);

    const passiveSection = dossierSection(ship, "passive", "00 / PASSIVE SURVEY", `
        <div class="passive-grid">
          ${ship.passiveSurvey.map((item) => `
            <div class="passive-reading ${isAiTraced(ship, item) ? "is-ai-traced" : ""}">
              <span>${item.label}</span>
              <strong>${item.value}</strong>
              ${anomalyTag(item)}
              ${isAiTraced(ship, item) ? "<b>AI TRACE</b>" : ""}
            </div>
          `).join("")}
        </div>
    `);

    if (ship.packetStatus === "pending") {
      els.shipDataBoard.innerHTML = `
        ${passiveSection}
        ${dossierSection(ship, "declaration", "01 / DECLARATION PACKET", "<p>AWAITING VESSEL RESPONSE ON LANE COMMS</p>", { contentClass: "packet-pending" })}
        ${activeReturnSections(ship)}
      `;
      bindDossierSections(ship);
      return;
    }

    const declaration = ship.dossier.filter((item) => item.key.startsWith("declaration."));
    const route = ship.dossier.filter((item) => item.key.startsWith("route."));
    const cargo = ship.dossier.filter((item) => item.key.startsWith("manifest.") || item.key.startsWith("load."));
    els.shipDataBoard.innerHTML = `
      ${passiveSection}
      ${dossierSection(ship, "declaration", "01 / DECLARATION", `
        <div class="form-columns">
          <div class="form-stack">${declaration.slice(0, Math.ceil(declaration.length / 2)).map((item) => formRow(ship, item)).join("")}</div>
          <div class="form-stack">${declaration.slice(Math.ceil(declaration.length / 2)).map((item) => formRow(ship, item)).join("")}</div>
        </div>
      `)}
      ${dossierSection(ship, "route", "02 / ROUTE AND AUTHORITY", `
        <div class="form-columns">
          <div class="form-stack">${route.slice(0, Math.ceil(route.length / 2)).map((item) => formRow(ship, item)).join("")}</div>
          <div class="form-stack">${route.slice(Math.ceil(route.length / 2)).map((item) => formRow(ship, item)).join("")}</div>
        </div>
      `)}
      ${dossierSection(ship, "cargo", "03 / CARGO AND LOAD RECORDS", `
        <div class="form-stack">${cargo.map((item) => formRow(ship, item)).join("")}</div>
      `)}
      ${activeReturnSections(ship)}
    `;
    bindDossierSections(ship);
  }

  function renderActions() {
    const { state } = engine;
    const ship = engine.getShip();
    const essentialScans = new Set(engine.activeRules().map((rule) => rule.confirmingScan).filter(Boolean));
    const scanButtons = config.scans.map((scan) => {
      const authorized = engine.isScanAuthorized(scan.id);
      const report = ship?.reports.find((item) => item.action === scan.id);
      const remaining = ship?.scansRunning[scan.id];
      const isSelected = report?.id === state.selectedReportId;
      const disabled = !authorized || !ship || remaining || (!report?.discovered && (state.mode !== "active" || state.scanPower < scan.cost));
      const progress = remaining ? Math.round(((scan.duration - remaining) / scan.duration) * 100) : 0;
      const stateClass = [
        remaining ? "is-running" : "",
        report?.discovered ? "is-complete" : "",
        report?.unread ? "is-unread" : "",
        isSelected ? "is-selected" : ""
      ].filter(Boolean).join(" ");
      const status = !authorized
        ? "AUTH LOCK"
        : remaining
        ? `ACQUIRING ${remaining}s`
        : isSelected
          ? "RECORD OPEN"
          : report?.unread
            ? "UNREAD"
            : report?.discovered
              ? "OPEN RECORD"
              : `PWR ${scan.cost}`;
      return `
        <button class="scan-button ${stateClass} ${authorized ? "" : "is-locked"} ${essentialScans.has(scan.id) ? "" : "is-nonessential"}" data-scan="${scan.id}" style="--scan-progress: ${progress / 100}" ${disabled ? "disabled" : ""}>
          <span>${scan.label}</span>
          <small>${scan.description}${authorized ? essentialScans.has(scan.id) ? "" : " / NONESSENTIAL THIS SHIFT" : " / NOT AUTHORIZED"}</small>
          <b>${status}</b>
          ${remaining ? '<i class="scan-progress" aria-hidden="true"></i>' : ""}
        </button>
      `;
    }).join("");
    const aiAuthorized = engine.isAiValidationAuthorized();
    const aiDisabled = !aiAuthorized || !ship || ship.aiValidationActive || state.aiCyclesLeft <= 0 || state.mode !== "active";
    const aiStatus = !aiAuthorized
      ? "AUTH LOCK"
      : ship?.aiValidationActive
      ? "ACTIVE"
      : state.aiCyclesLeft <= 0
        ? "DEPLETED"
        : "AI 1";
    els.actionGrid.innerHTML = `${scanButtons}
      <button class="scan-button ai-validation-button ${!aiAuthorized ? "is-locked" : ""} ${ship?.aiValidationActive ? "is-complete" : ""}" data-ai-validation ${aiDisabled ? "disabled" : ""}>
        <span>AI VALIDATION</span>
        <small>Bounded cognition anomaly pass${aiAuthorized ? "" : " / NOT AUTHORIZED"}</small>
        <b>${aiStatus}</b>
      </button>
    `;
    els.actionGrid.querySelectorAll("[data-scan]").forEach((button) => {
      button.addEventListener("click", () => {
        const scanId = button.dataset.scan;
        const ship = engine.getShip();
        const existingReport = ship?.reports.find((item) => item.action === scanId);
        if (existingReport?.discovered) expandDossierSections(ship, [`scan-${scanId}`]);
        engine.startScan(scanId);
        const report = engine.getShip()?.reports.find((item) => item.action === scanId);
        if (!report?.discovered) return;
        requestAnimationFrame(() => {
          document.querySelector(`[data-report-id="${report.id}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        });
      });
    });
    els.actionGrid.querySelector("[data-ai-validation]").addEventListener("click", engine.useAiValidation);
  }

  function renderRulings() {
    const ship = engine.getShip();
    if (!ship) {
      els.allegationList.textContent = "NONE";
      els.clearShip.disabled = true;
      els.detainShip.disabled = true;
      return;
    }

    const hasAllegations = ship.allegedViolationIds.length > 0;
    els.allegationList.innerHTML = ship.allegedViolationIds.length
      ? ship.allegedViolationIds.map((ruleId) => `<span>${data.rules.find((rule) => rule.id === ruleId).code}</span>`).join("")
      : "NONE";
    els.clearShip.disabled = hasAllegations;
    els.detainShip.disabled = !hasAllegations;
  }

  function renderLog() {
    const { state } = engine;
    els.logCount.textContent = `${state.log.length} ENTR${state.log.length === 1 ? "Y" : "IES"}`;
    els.logList.innerHTML = state.log.map((entry) => `
      <div class="log-entry ${entry.tone}"><span>${entry.tone.toUpperCase()}</span><p>${entry.message}</p></div>
    `).join("");
  }

  function renderComms() {
    const { state } = engine;
    els.commsCount.textContent = `${state.comms.length} ENTR${state.comms.length === 1 ? "Y" : "IES"}`;
    els.commsList.innerHTML = state.comms.map((entry) => {
      const label = entry.direction.toUpperCase();
      const placeholder = entry.direction === "tx" ? "CARRIER OPEN" : "DECODING AUDIO";
      const isPending = entry.status === "pending";
      return `
        <div class="comms-entry ${entry.direction} ${entry.tone} ${isPending ? "is-pending" : "is-complete"}">
          <strong>${entry.speaker}</strong>
          <p>${isPending ? `<span class="comms-carrier">${label}</span> ${placeholder}` : entry.message}</p>
        </div>
      `;
    }).join("");
  }

  function renderPanels() {
    const { state } = engine;
    els.workspace.classList.toggle("rules-collapsed", state.collapsed.rules);
    els.workspace.classList.toggle("systems-collapsed", state.collapsed.systems);
    els.rulesPanel.classList.toggle("is-collapsed", state.collapsed.rules);
    els.systemsPanel.classList.toggle("is-collapsed", state.collapsed.systems);
    document.querySelector('[data-panel="rules"]').textContent = state.collapsed.rules ? "[>]" : "[<]";
    document.querySelector('[data-panel="systems"]').textContent = state.collapsed.systems ? "[<]" : "[>]";
  }

  function render() {
    renderStatus();
    renderRules();
    renderShip();
    renderActions();
    renderRulings();
    renderLog();
    renderComms();
    renderPanels();
  }

  function hideOverlay() {
    els.overlay.classList.add("hidden");
  }

  function showBriefing() {
    const shift = engine.currentShiftDefinition();
    els.overlay.classList.remove("hidden");
    els.overlayEyebrow.textContent = engine.state.campaign.mode === "campaign" ? "J4 FREIGHT ANNEX / PRE-SHIFT" : "PRE-SHIFT BRIEFING";
    els.overlayTitle.textContent = shift?.title ?? "OBSERVE. FORM A SUSPICION. ACQUIRE PROOF.";
    els.overlaySummary.textContent = shift?.briefing ??
      `${config.activeRuleCount} regulations are active. Vessel class, passive readings, and paperwork can suggest where closer inspection may pay off. A cue is not proof.`;
    const standingItems = engine.standingOrders().map((rule) => `<li><strong>STANDING / ${rule.code}</strong> ${rule.criterion}</li>`);
    const regulationItems = engine.activeRegulations().map((rule) => `
      <li><strong>ACTIVE / ${rule.code}</strong> ${rule.criterion}<br>${rule.evidenceType === "dossier" ? "Evidence in dossier." : `Confirm with ${engine.scanConfig(rule.confirmingScan).label}.`}</li>
    `);
    const qualification = engine.state.campaign.mode === "campaign"
      ? [`<li><strong>QUALIFICATION</strong> Issue at least ${config.campaign.qualification.minimumRulings} rulings, maintain ${Math.round(config.campaign.qualification.qualifiedAccuracy * 100)}% accuracy, and rule correctly on the Greywake audit shipment.</li>`, `<li><strong>AUTHORIZED</strong> HOLD TOMOGRAPHY only. Other systems remain locked.</li>`]
      : [];
    els.overlayRules.innerHTML = [...standingItems, ...regulationItems, ...qualification].join("");
    els.overlayAction.textContent = "BEGIN SHIFT";
    els.overlayAction.classList.remove("hidden");
    els.overlayRestart.classList.add("hidden");
  }

  function showShiftReport() {
    const { state } = engine;
    const scanSummary = config.scans.map((scan) => `${scan.label} ${state.scansUsed[scan.id] ?? 0}`).join("; ");
    els.overlay.classList.remove("hidden");
    els.overlayEyebrow.textContent = "SHIFT REPORT";
    els.overlayTitle.textContent = state.score >= 110 ? "AUDIT: STRONG" : state.score >= 70 ? "AUDIT: ACCEPTABLE" : "AUDIT: DEFICIENT";
    els.overlaySummary.textContent =
      `Rules: ${engine.activeRules().map((rule) => rule.code).join(", ")}. ${state.resolvedShips} contacts resolved; ${state.mistakes} failures. ` +
      `${state.powerSpent} power spent, ${state.powerRegenerated} regenerated. AI validations ${state.aiValidationsUsed}. Scans: ${scanSummary}.`;
    els.overlayRules.innerHTML = "";
    els.overlayAction.textContent = "RUN ANOTHER SHIFT";
    els.overlayAction.classList.remove("hidden");
    els.overlayRestart.classList.add("hidden");
  }

  function resultSummary(result) {
    const percent = Math.round(result.accuracy * 100);
    return `${result.rulingsIssued} rulings; ${percent}% final accuracy. ${result.correctContacts} correct, ${result.incorrectContacts} incorrect, ${result.unresolvedAtCutoff} unresolved at cutoff.`;
  }

  function showIntershift(result) {
    const shift = engine.currentShiftDefinition();
    const passed = result.passed;
    const nextShift = passed ? engine.currentPosting().shifts[engine.state.campaign.shiftIndex + 1] : shift;
    const consequence = shift.consequenceCopy[result.grade];
    els.overlay.classList.remove("hidden");
    els.overlayEyebrow.textContent = `SHIFT AUDIT / ${result.grade.toUpperCase()}`;
    els.overlayTitle.textContent = passed ? nextShift.title : `${shift.title} / RETRY REQUIRED`;
    els.overlaySummary.textContent = `${resultSummary(result)} ${consequence} ${passed ? nextShift.briefing : shift.briefing}`;
    const reasons = result.reasons.map((reason) => `<li><strong>DEFICIENCY</strong> ${reason}</li>`);
    const nextRules = nextShift.activeRegulationIds.map((ruleId) => data.rules.find((rule) => rule.id === ruleId)).map((rule) => `<li><strong>NEXT / ${rule.code}</strong> ${rule.criterion}</li>`);
    els.overlayRules.innerHTML = [...reasons, ...nextRules].join("");
    els.overlayAction.textContent = passed ? "BEGIN NEXT SHIFT" : "RETRY SHIFT";
    els.overlayAction.classList.remove("hidden");
    els.overlayRestart.classList.add("hidden");
  }

  function showCampaignComplete(result) {
    const posting = engine.currentPosting();
    els.overlay.classList.remove("hidden");
    els.overlayEyebrow.textContent = `POSTING COMPLETE / ${result.grade.toUpperCase()}`;
    els.overlayTitle.textContent = "J4 FREIGHT QUALIFICATION GRANTED";
    els.overlaySummary.textContent = `${resultSummary(result)} ${engine.currentShiftDefinition().consequenceCopy[result.grade]} ${posting.completionCopy}`;
    els.overlayRules.innerHTML = '<li><strong>NEW STANDING ORDER / CAR-19</strong> Cargo declaration accuracy is now standing practice.</li>';
    els.overlayAction.textContent = "RESTART CAMPAIGN";
    els.overlayAction.classList.remove("hidden");
    els.overlayRestart.classList.add("hidden");
  }

  function bindEvents() {
    document.querySelectorAll(".panel-toggle").forEach((button) => {
      button.addEventListener("click", () => {
        engine.state.collapsed[button.dataset.panel] = !engine.state.collapsed[button.dataset.panel];
        renderPanels();
      });
    });
    els.clearShip.addEventListener("click", () => engine.resolveShip("clear"));
    els.detainShip.addEventListener("click", () => engine.resolveShip("detain"));
    els.overlayAction.addEventListener("click", engine.continueFromOverlay);
    els.overlayRestart.addEventListener("click", engine.continueFromOverlay);
  }

  namespace.ui = {
    render,
    renderLog,
    renderComms,
    bindEvents,
    hideOverlay,
    showBriefing,
    showShiftReport,
    showIntershift,
    showCampaignComplete
  };
})(window.SpaceCustoms = window.SpaceCustoms || {});
