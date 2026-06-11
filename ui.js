(function initUi(namespace) {
  const { data, config, engine } = namespace;

  const els = {
    workspace: document.querySelector("#workspace"),
    rulesPanel: document.querySelector("#rules-panel"),
    systemsPanel: document.querySelector("#systems-panel"),
    shiftTimer: document.querySelector("#shift-timer"),
    score: document.querySelector("#score"),
    mistakes: document.querySelector("#mistakes"),
    assists: document.querySelector("#assists-left"),
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
    reportList: document.querySelector("#evidence-list"),
    selectedEvidenceText: document.querySelector("#selected-evidence-text"),
    focusStrip: document.querySelector("#focus-strip"),
    reportReadout: document.querySelector("#report-readout"),
    allegationList: document.querySelector("#allegation-list"),
    clearShip: document.querySelector("#clear-ship"),
    logCount: document.querySelector("#log-count"),
    logList: document.querySelector("#log-list"),
    overlay: document.querySelector("#overlay"),
    overlayEyebrow: document.querySelector("#overlay-eyebrow"),
    overlayTitle: document.querySelector("#overlay-title"),
    overlaySummary: document.querySelector("#overlay-summary"),
    overlayRules: document.querySelector("#overlay-rules"),
    overlayAction: document.querySelector("#overlay-action"),
    overlayRestart: document.querySelector("#overlay-restart")
  };

  function isAssisted(ship, item) {
    return ship?.assistActive && ship.assistHighlightKeys?.includes(item.key);
  }

  function anomalyTag(item) {
    if (!item.anomalyCategory || item.anomalyScore < config.passiveTagThreshold) return "";
    return `<i class="anomaly-tag">${item.anomalyCategory}</i>`;
  }

  function formRow(ship, item) {
    return `
      <div class="form-row evidence-row ${isAssisted(ship, item) ? "is-focused" : ""}">
        <span>${item.label}</span>
        <strong>${item.value}</strong>
        ${isAssisted(ship, item) ? "<i class=\"assist-mark\">FOCUS</i>" : ""}
      </div>
    `;
  }

  function renderStatus() {
    const { state } = engine;
    els.shiftTimer.textContent = `${state.timeLeft}s`;
    els.score.textContent = state.score;
    els.mistakes.textContent = state.mistakes;
    els.assists.textContent = state.assistsLeft;
    els.scanPower.textContent = `${state.scanPower}/${config.maxScanPower}`;
    els.powerRecharge.textContent = state.scanPower >= config.maxScanPower ? "FULL" : `+1 IN ${state.powerRechargeIn}s`;
  }

  function renderRules() {
    const { state } = engine;
    const rules = engine.activeRules();
    const ship = engine.getShip();
    els.rulesList.innerHTML = rules.map((rule) => {
      const selected = state.selectedRuleId === rule.id;
      const alleged = ship?.allegedViolationIds.includes(rule.id);
      const canMark = engine.hasConfirmingReport(ship, rule.id);
      return `
        <div class="rule-row ${selected ? "is-selected" : ""} ${alleged ? "is-alleged" : ""}">
          <button class="rule-select" data-rule="${rule.id}">
            <span>${rule.code}</span>
            ${selected ? '<b class="selected-marker">SELECTED</b>' : ""}
            <strong>${rule.title}</strong>
            <small>${rule.criterion}</small>
            <em>Confirm: ${engine.scanConfig(rule.confirmingScan).label}</em>
          </button>
          <button class="rule-mark" data-allegation-rule="${rule.id}" ${canMark ? "" : "disabled"}>${alleged ? "REMOVE" : "MARK"}</button>
        </div>
      `;
    }).join("");
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
      <button class="contact-tab ${ship.id === state.selectedShipId ? "is-selected" : ""} ${ship.leaveIn <= 30 ? "is-urgent" : ""}" data-ship="${ship.id}">
        <strong>${ship.name}</strong><span>${ship.className}</span><span>T-${ship.leaveIn}</span>
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
    els.shipSummary.textContent = ship.pilotNote;

    const declaration = ship.dossier.filter((item) => item.key.startsWith("declaration."));
    const cargo = ship.dossier.filter((item) => item.key.startsWith("manifest.") || item.key.startsWith("load."));
    els.shipDataBoard.innerHTML = `
      <section class="form-section">
        <h4>00 / PASSIVE SURVEY</h4>
        <div class="passive-grid">
          ${ship.passiveSurvey.map((item) => `
            <div class="passive-reading ${isAssisted(ship, item) ? "is-focused" : ""}">
              <span>${item.label}</span>
              <strong>${item.value}</strong>
              ${anomalyTag(item)}
              ${isAssisted(ship, item) ? "<b>FOCUS</b>" : ""}
            </div>
          `).join("")}
        </div>
      </section>
      <section class="form-section">
        <h4>01 / DECLARATION</h4>
        <div class="form-columns">
          <div>${declaration.slice(0, Math.ceil(declaration.length / 2)).map((item) => formRow(ship, item)).join("")}</div>
          <div>${declaration.slice(Math.ceil(declaration.length / 2)).map((item) => formRow(ship, item)).join("")}</div>
        </div>
      </section>
      <section class="form-section">
        <h4>02 / CARGO AND LOAD RECORDS</h4>
        ${cargo.map((item) => formRow(ship, item)).join("")}
      </section>
    `;
  }

  function renderActions() {
    const { state } = engine;
    const ship = engine.getShip();
    const essentialScans = new Set(engine.activeRules().map((rule) => rule.confirmingScan));
    els.actionGrid.innerHTML = config.scans.map((scan) => {
      const report = ship?.reports.find((item) => item.action === scan.id);
      const remaining = ship?.scansRunning[scan.id];
      const disabled = !ship || state.mode !== "active" || report?.discovered || remaining || state.scanPower < scan.cost;
      const progress = remaining ? Math.round(((scan.duration - remaining) / scan.duration) * 100) : 0;
      const stateClass = remaining ? "is-running" : report?.discovered ? "is-complete" : "";
      return `
        <button class="scan-button ${stateClass} ${essentialScans.has(scan.id) ? "" : "is-nonessential"}" data-scan="${scan.id}" style="--scan-progress: ${progress / 100}" ${disabled ? "disabled" : ""}>
          <span>${scan.label}</span>
          <small>${scan.description}${essentialScans.has(scan.id) ? "" : " / NONESSENTIAL THIS SHIFT"}</small>
          <b>${remaining ? `ACQUIRING ${remaining}s` : report?.discovered ? "RECORD READY" : `PWR ${scan.cost}`}</b>
          ${remaining ? '<i class="scan-progress" aria-hidden="true"></i>' : ""}
        </button>
      `;
    }).join("");
    els.actionGrid.querySelectorAll("[data-scan]").forEach((button) => {
      button.addEventListener("click", () => engine.startScan(button.dataset.scan));
    });
  }

  function renderAssistStatus(ship) {
    if (!ship?.assistActive) {
      els.focusStrip.classList.add("hidden");
      els.focusStrip.textContent = "";
      return;
    }
    els.focusStrip.classList.remove("hidden");
    els.focusStrip.textContent = ship.assistMessage;
  }

  function renderReports() {
    const { state } = engine;
    const ship = engine.getShip();
    renderAssistStatus(ship);
    if (!ship) {
      els.reportList.innerHTML = "";
      els.selectedEvidenceText.textContent = "NONE SELECTED";
      els.reportReadout.innerHTML = '<p class="empty-state">SELECT A COMPLETED RECORD</p>';
      els.allegationList.textContent = "NONE";
      els.clearShip.disabled = false;
      return;
    }

    els.reportList.innerHTML = ship.reports.map((report) => {
      const remaining = ship.scansRunning[report.action];
      const status = report.discovered ? "READY" : remaining ? `${remaining}s` : "NO DATA";
      return `<button class="report-tab ${report.id === state.selectedReportId ? "is-selected" : ""} ${report.unread ? "is-unread" : ""} ${report.discovered ? "is-complete" : ""}" data-report="${report.id}">${engine.scanConfig(report.action).label}<span>${status}</span></button>`;
    }).join("");
    els.reportList.querySelectorAll("[data-report]").forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedReportId = button.dataset.report;
        const report = ship.reports.find((item) => item.id === state.selectedReportId);
        if (report?.discovered) report.unread = false;
        render();
      });
    });

    const report = engine.getSelectedReport();
    els.selectedEvidenceText.textContent = report ? engine.scanConfig(report.action).label : "NONE SELECTED";
    if (!report?.discovered) {
      els.reportReadout.innerHTML = `<p class="empty-state">${report ? "RECORD ACQUISITION INCOMPLETE" : "SELECT A COMPLETED RECORD"}</p>`;
    } else {
      let currentGroup = null;
      els.reportReadout.innerHTML = report.lines.map((item) => {
        const divider = item.group && item.group !== currentGroup
          ? `<div class="readout-divider"><span>MODULE ${item.group}</span></div>`
          : "";
        currentGroup = item.group;
        return `${divider}
          <div class="readout-row ${isAssisted(ship, item) ? "is-focused" : ""}">
            <span>${item.label}</span>
            <strong>${item.value}</strong>
            ${isAssisted(ship, item) ? "<i>FOCUS</i>" : ""}
          </div>
        `;
      }).join("");
    }

    els.allegationList.innerHTML = ship.allegedViolationIds.length
      ? ship.allegedViolationIds.map((ruleId) => `<span>${data.rules.find((rule) => rule.id === ruleId).code}</span>`).join("")
      : "NONE";
    els.clearShip.disabled = ship.allegedViolationIds.length > 0;
  }

  function renderLog() {
    const { state } = engine;
    els.logCount.textContent = `${state.log.length} ENTR${state.log.length === 1 ? "Y" : "IES"}`;
    els.logList.innerHTML = state.log.map((entry) => `
      <div class="log-entry ${entry.tone}"><span>${entry.tone.toUpperCase()}</span><p>${entry.message}</p></div>
    `).join("");
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
    renderReports();
    renderPanels();
  }

  function hideOverlay() {
    els.overlay.classList.add("hidden");
  }

  function showBriefing() {
    els.overlay.classList.remove("hidden");
    els.overlayEyebrow.textContent = "PRE-SHIFT BRIEFING";
    els.overlayTitle.textContent = "OBSERVE. FORM A SUSPICION. ACQUIRE PROOF.";
    els.overlaySummary.textContent =
      `${config.activeRuleCount} regulations are active. Vessel class, passive readings, and paperwork can suggest where closer inspection may pay off. A cue is not proof.`;
    els.overlayRules.innerHTML = engine.activeRules().map((rule) => `
      <li><strong>${rule.code}</strong> ${rule.criterion}<br>Confirm with ${engine.scanConfig(rule.confirmingScan).label}.</li>
    `).join("");
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
      `${state.powerSpent} power spent, ${state.powerRegenerated} regenerated. Focus used ${state.focusUses}. Scans: ${scanSummary}.`;
    els.overlayRules.innerHTML = "";
    els.overlayAction.classList.add("hidden");
    els.overlayRestart.classList.remove("hidden");
  }

  function bindEvents() {
    document.querySelectorAll(".panel-toggle").forEach((button) => {
      button.addEventListener("click", () => {
        engine.state.collapsed[button.dataset.panel] = !engine.state.collapsed[button.dataset.panel];
        renderPanels();
      });
    });
    document.querySelector("#assist-button").addEventListener("click", engine.useAssist);
    els.clearShip.addEventListener("click", () => engine.resolveShip("clear"));
    document.querySelector("#detain-ship").addEventListener("click", () => engine.resolveShip("detain"));
    els.overlayAction.addEventListener("click", engine.startShift);
    els.overlayRestart.addEventListener("click", engine.reset);
  }

  namespace.ui = {
    render,
    renderLog,
    bindEvents,
    hideOverlay,
    showBriefing,
    showShiftReport
  };
})(window.SpaceCustoms = window.SpaceCustoms || {});
