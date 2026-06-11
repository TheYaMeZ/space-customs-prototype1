(function initShipGenerator(namespace) {
  const { data, config, utils } = namespace;

  function field(key, label, value, ruleIds = [], anomalyScore = 0, anomalyCategory = null, group = null) {
    return { key, label, value, ruleIds, anomalyScore, anomalyCategory, group };
  }

  function report(action, lines, violationRuleIds = []) {
    return {
      id: `${action}-${Math.random().toString(36).slice(2, 8)}`,
      action,
      lines,
      violationRuleIds,
      discovered: false,
      unread: false
    };
  }

  function chooseViolations(activeRuleIds, className) {
    const weights = config.classProfiles[className].risk;
    const selected = activeRuleIds.filter((ruleId) => {
      const probability = Math.min(0.48, 0.17 * weights[ruleId]);
      return utils.chance(probability);
    });
    if (selected.length === 0 && utils.chance(0.38)) {
      const weighted = activeRuleIds.flatMap((ruleId) => {
        const copies = Math.max(1, Math.round(weights[ruleId] * 4));
        return Array(copies).fill(ruleId);
      });
      selected.push(utils.randomFrom(weighted));
    }
    return new Set(selected);
  }

  function chooseBenignHints(activeRuleIds, violations) {
    return new Set(activeRuleIds.filter((ruleId) => !violations.has(ruleId) && utils.chance(0.23)));
  }

  function makeModules(violations, benignHints) {
    const modules = [];
    const count = utils.randInt(3, 5);
    for (let index = 0; index < count; index += 1) {
      const manufacturer = utils.randomFrom(data.manufacturers);
      modules.push({
        slot: `M${String(index + 1).padStart(2, "0")}`,
        type: utils.randomFrom(data.moduleTypes),
        manufacturer: manufacturer.name,
        model: utils.randomFrom(manufacturer.models),
        licence: "N/A"
      });
    }

    if (violations.has("banned-manufacturer")) {
      const target = utils.randInt(0, modules.length - 1);
      modules[target] = {
        slot: modules[target].slot,
        type: "shield lattice",
        manufacturer: data.bannedManufacturer.name,
        model: utils.randomFrom(data.bannedManufacturer.models),
        licence: "N/A"
      };
    }

    const hasDefence = violations.has("weapon-license") || benignHints.has("weapon-license") || utils.chance(0.16);
    if (hasDefence) {
      modules.push({
        slot: `H${utils.randInt(1, 4)}`,
        type: "point-defence mount",
        manufacturer: "Aegis Systems",
        model: "PD-8",
        licence: violations.has("weapon-license") ? "NONE" : "DEF-CIV"
      });
    }
    return modules;
  }

  function anomalyFor(ruleId, violations, benignHints, strong = 78) {
    if (violations.has(ruleId)) return strong + utils.randInt(0, 15);
    if (benignHints.has(ruleId)) return config.passiveTagThreshold + utils.randInt(0, 10);
    return utils.randInt(2, 24);
  }

  function buildPassiveSurvey(context) {
    const { profile, violations, benignHints, measuredMass, declaredMass, modules } = context;
    const massVariance = Math.abs(measuredMass - declaredMass);
    const thermalVariance = violations.has("unsafe-reactor")
      ? profile.baseline.thermalVariance + utils.randInt(70, 130) / 10
      : benignHints.has("unsafe-reactor")
        ? profile.baseline.thermalVariance + utils.randInt(20, 45) / 10
        : Math.max(0.5, profile.baseline.thermalVariance + utils.randInt(-20, 15) / 10);
    const iffDrift = violations.has("military-registry")
      ? profile.baseline.iffDrift + utils.randInt(30, 60) / 10
      : benignHints.has("military-registry")
        ? profile.baseline.iffDrift + utils.randInt(10, 25) / 10
        : Math.max(0.3, profile.baseline.iffDrift + utils.randInt(-10, 8) / 10);
    const apertures = modules.filter((module) => module.slot.startsWith("H")).length +
      (violations.has("banned-manufacturer") ? 1 : 0);

    return [
      field(
        "passive.mass",
        "MASS SHADOW",
        `${utils.fixed(massVariance)} t variance`,
        ["manifest-match"],
        anomalyFor("manifest-match", violations, benignHints),
        "MASS VAR"
      ),
      field(
        "passive.thermal",
        "PLUME STABILITY",
        `${utils.fixed(thermalVariance)}% cycle spread`,
        ["unsafe-reactor"],
        anomalyFor("unsafe-reactor", violations, benignHints),
        "THERMAL VAR"
      ),
      field(
        "passive.iff",
        "IFF COHERENCE",
        `${utils.fixed(iffDrift)} ms phase drift`,
        ["military-registry"],
        anomalyFor("military-registry", violations, benignHints),
        "IFF ECHO"
      ),
      field(
        "passive.em",
        "EM APERTURES",
        `${apertures} intermittent returns`,
        ["weapon-license", "banned-manufacturer"],
        Math.max(
          anomalyFor("weapon-license", violations, benignHints, 72),
          anomalyFor("banned-manufacturer", violations, benignHints, 72)
        ),
        "EM ECHO"
      )
    ];
  }

  function buildDossier(context) {
    const {
      shipClass, cargo, violations, benignHints, declaredHullCode,
      registryEndorsement, declaredMass, measuredMass, modules
    } = context;

    return [
      field("declaration.registry", "REGISTRY ID", utils.serial("J4")),
      field("declaration.operator", "OPERATOR", utils.randomFrom(data.companies)),
      field("declaration.class", "DECLARED CLASS", shipClass.name),
      field(
        "declaration.hull",
        "DECLARED HULL",
        declaredHullCode,
        ["military-registry"],
        benignHints.has("military-registry") ? 46 : 8,
        "IFF ECHO"
      ),
      field("declaration.origin", "ORIGIN", utils.randomFrom(data.origins)),
      field("declaration.destination", "DESTINATION", utils.randomFrom(data.destinations)),
      field("declaration.permit", "TRANSIT PERMIT", utils.serial("TR")),
      field(
        "declaration.endorsement",
        "ENDORSEMENT",
        registryEndorsement,
        ["military-registry"],
        violations.has("military-registry") ? 66 : 10,
        "IFF ECHO"
      ),
      field(
        "declaration.defenceLicence",
        "DEFENCE LICENCE",
        violations.has("weapon-license")
          ? "NONE"
          : modules.some((module) => module.type === "point-defence mount") ? "DEF-CIV" : "NOT DECLARED",
        ["weapon-license"],
        violations.has("weapon-license") ? 74 : benignHints.has("weapon-license") ? 48 : 8,
        "EM ECHO"
      ),
      field("manifest.description", "CARGO DESCRIPTION", cargo.name, ["manifest-match"], 8, "MASS VAR"),
      field("manifest.mass", "DECLARED MASS", `${utils.fixed(declaredMass)} t`, ["manifest-match"], 12, "MASS VAR"),
      field(
        "manifest.seals",
        "SEAL LEDGER",
        `${shipClass.bays} bays / ${shipClass.bays} seals`,
        ["manifest-match"],
        violations.has("manifest-match") ? 62 : benignHints.has("manifest-match") ? 46 : 7,
        "MASS VAR"
      ),
      field(
        "load.certificate",
        "DEPARTURE LOAD CERT",
        `${utils.fixed(
          violations.has("manifest-match")
            ? measuredMass
            : benignHints.has("manifest-match") ? declaredMass + utils.randInt(25, 50) / 10 : declaredMass + utils.randInt(-10, 10) / 10
        )} t`,
        ["manifest-match"],
        anomalyFor("manifest-match", violations, benignHints, 72),
        "MASS VAR"
      )
    ];
  }

  function buildReports(context) {
    const {
      shipClass, cargo, violations, declaredHullCode, measuredHullCode,
      hullDescription, registryEndorsement, declaredMass, measuredMass,
      detectedBayCount, modules, reactorSamples
    } = context;

    return [
      report("transponder", [
        field("scan.transponder.declaredHull", "DECLARED.HULL", declaredHullCode, ["military-registry"], 10, "IFF ECHO"),
        field("scan.transponder.measuredHull", "MEASURED.HULL", measuredHullCode, ["military-registry"], violations.has("military-registry") ? 96 : 8, "IFF ECHO"),
        field("scan.transponder.geometry", "GEOMETRY", hullDescription, ["military-registry"], violations.has("military-registry") ? 88 : 8, "IFF ECHO"),
        field("scan.transponder.endorsement", "REGISTRY.ENDORSEMENT", registryEndorsement, ["military-registry"], violations.has("military-registry") ? 94 : 8, "IFF ECHO"),
        field("scan.transponder.drift", "BEACON.DRIFT", `${utils.fixed(utils.randInt(1, 38) / 10)} ms`)
      ], violations.has("military-registry") ? ["military-registry"] : []),
      report("cargo", [
        field("scan.cargo.manifestMass", "MANIFEST.MASS", `${utils.fixed(declaredMass)} t`, ["manifest-match"], 8, "MASS VAR"),
        field("scan.cargo.measuredMass", "MEASURED.MASS", `${utils.fixed(measuredMass)} t`, ["manifest-match"], violations.has("manifest-match") ? 96 : 10, "MASS VAR"),
        field("scan.cargo.delta", "MASS.DELTA", `${utils.fixed(measuredMass - declaredMass)} t`, ["manifest-match"], violations.has("manifest-match") ? 98 : 10, "MASS VAR"),
        field("scan.cargo.bay1", "BAY.01", cargo.name, ["manifest-match"], 5, "MASS VAR"),
        field("scan.cargo.bay2", "BAY.02", violations.has("manifest-match") ? "sealed weapons container" : cargo.name, ["manifest-match"], violations.has("manifest-match") ? 99 : 5, "MASS VAR"),
        field("scan.cargo.seals", "SEAL.COUNT", `${shipClass.bays} declared / ${detectedBayCount} detected`, ["manifest-match"], violations.has("manifest-match") ? 95 : 5, "MASS VAR")
      ], violations.has("manifest-match") ? ["manifest-match"] : []),
      report("modules", modules.flatMap((module) => [
        field(`scan.modules.${module.slot}.type`, `${module.slot}.TYPE`, module.type, ["weapon-license"], module.type === "point-defence mount" ? 65 : 5, "EM ECHO", module.slot),
        field(`scan.modules.${module.slot}.make`, `${module.slot}.MAKE`, module.manufacturer, ["banned-manufacturer"], module.manufacturer === data.bannedManufacturer.name ? 99 : 5, "EM ECHO", module.slot),
        field(`scan.modules.${module.slot}.model`, `${module.slot}.MODEL`, module.model, ["banned-manufacturer"], module.manufacturer === data.bannedManufacturer.name ? 92 : 5, "EM ECHO", module.slot),
        field(`scan.modules.${module.slot}.lic`, `${module.slot}.LIC`, module.licence, ["weapon-license"], module.type === "point-defence mount" && module.licence === "NONE" ? 99 : 5, "EM ECHO", module.slot)
      ]), [
        ...(violations.has("weapon-license") ? ["weapon-license"] : []),
        ...(violations.has("banned-manufacturer") ? ["banned-manufacturer"] : [])
      ]),
      report("thermal", [
        field("scan.thermal.rated", "RATED.OUTPUT", "100.0 %", ["unsafe-reactor"], 5, "THERMAL VAR"),
        ...reactorSamples.map((sample, index) => field(
          `scan.thermal.sample${index + 1}`,
          `SAMPLE.${String(index + 1).padStart(2, "0")}`,
          `${utils.fixed(sample)} %`,
          ["unsafe-reactor"],
          sample > 100 ? 90 + Math.min(9, Math.round(sample - 100)) : 8,
          "THERMAL VAR"
        )),
        field("scan.thermal.coolant", "COOLANT.PRESS", `${utils.fixed(utils.randInt(380, 470) / 10)} MPa`)
      ], violations.has("unsafe-reactor") ? ["unsafe-reactor"] : [])
    ];
  }

  function generateShip(activeRuleIds, id) {
    const shipClass = utils.randomFrom(data.shipClasses);
    const profile = config.classProfiles[shipClass.name];
    const cargo = utils.randomFrom(shipClass.cargo);
    const violations = chooseViolations(activeRuleIds, shipClass.name);
    const benignHints = chooseBenignHints(activeRuleIds, violations);
    const declaredHullCode = utils.serial(shipClass.codePrefix);
    const militaryHull = utils.randomFrom(data.militaryHulls);
    const measuredHullCode = violations.has("military-registry") ? utils.serial(militaryHull.codePrefix) : declaredHullCode;
    const hullDescription = violations.has("military-registry") ? militaryHull.description : shipClass.hullDescription;
    const registryEndorsement = violations.has("military-registry") ? "NONE" : "CIV-ACTIVE";
    const declaredMass = utils.randInt(cargo.massRange[0], cargo.massRange[1]);
    const massDelta = violations.has("manifest-match") ? utils.randInt(40, 180) / 10 : utils.randInt(-12, 12) / 10;
    const measuredMass = declaredMass + massDelta;
    const detectedBayCount = shipClass.bays + (violations.has("manifest-match") ? 1 : 0);
    const modules = makeModules(violations, benignHints);
    const reactorSamples = [0, 1, 2, 3, 4].map((index) => {
      const base = violations.has("unsafe-reactor") ? 101.5 + index * 2.1 : 72 + index * 3.4;
      return Math.min(119.8, base + utils.randInt(-10, 10) / 10);
    });
    const context = {
      shipClass, profile, cargo, violations, benignHints, declaredHullCode,
      measuredHullCode, hullDescription, registryEndorsement, declaredMass,
      measuredMass, detectedBayCount, modules, reactorSamples
    };

    return {
      id,
      name: `${utils.randomFrom(data.shipNames)}-${utils.randInt(10, 99)}`,
      className: shipClass.name,
      leaveIn: utils.randInt(config.contactLifetime[0], config.contactLifetime[1]),
      pilotNote: utils.randomFrom(data.pilotNotes),
      passiveSurvey: buildPassiveSurvey(context),
      dossier: buildDossier(context),
      reports: buildReports(context),
      scansRunning: {},
      allegedViolationIds: [],
      actualViolations: [...violations],
      benignHintRuleIds: [...benignHints],
      assistActive: false,
      assistMessage: null
    };
  }

  function visibleAnomalies(ship) {
    return [
      ...ship.passiveSurvey,
      ...ship.dossier,
      ...ship.reports.filter((item) => item.discovered).flatMap((item) => item.lines)
    ];
  }

  function validate(iterations = 500) {
    const seenRules = new Set();
    const failures = [];
    const distribution = {};
    let benignCleanShips = 0;

    for (let index = 0; index < iterations; index += 1) {
      const active = utils.shuffle(data.rules).slice(0, config.activeRuleCount).map((rule) => rule.id);
      active.forEach((ruleId) => seenRules.add(ruleId));
      const ship = generateShip(active, index + 1);
      distribution[ship.className] ??= {};
      ship.actualViolations.forEach((ruleId) => {
        distribution[ship.className][ruleId] = (distribution[ship.className][ruleId] ?? 0) + 1;
        if (!active.includes(ruleId)) failures.push(`inactive violation ${ruleId}`);
        const hint = [...ship.passiveSurvey, ...ship.dossier]
          .some((item) => item.ruleIds.includes(ruleId) && item.anomalyScore >= config.passiveTagThreshold);
        const rule = data.rules.find((item) => item.id === ruleId);
        const proof = ship.reports.find((item) => item.action === rule.confirmingScan);
        if (!hint) failures.push(`missing hint ${ruleId}`);
        if (!proof?.violationRuleIds.includes(ruleId)) failures.push(`missing proof ${ruleId}`);
      });
      if (ship.actualViolations.length === 0 && visibleAnomalies(ship).some((item) => item.anomalyScore >= config.passiveTagThreshold)) {
        benignCleanShips += 1;
      }
    }

    return {
      passed: failures.length === 0 && seenRules.size === data.rules.length && benignCleanShips > 0,
      failures,
      seenRules: [...seenRules],
      benignCleanShips,
      distribution
    };
  }

  namespace.generator = { generateShip, visibleAnomalies, validate };
})(window.SpaceCustoms = window.SpaceCustoms || {});
