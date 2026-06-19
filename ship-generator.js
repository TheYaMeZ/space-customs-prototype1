(function initShipGenerator(namespace) {
  const { data, config, utils } = namespace;

  const hazardousClasses = ["bio", "pressure", "radiological", "volatile", "weapons-adjacent"];
  const containmentHazards = ["pressure", "volatile"];
  const restrictedPortStatuses = ["quarantine", "sanction-watch"];

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

  function ruleById(ruleId) {
    return data.rules.find((rule) => rule.id === ruleId);
  }

  function cargoById(cargoId) {
    return data.cargo.find((cargo) => cargo.id === cargoId);
  }

  function selectActiveRuleIds() {
    const dossierRules = utils.shuffle(data.rules.filter((rule) => rule.evidenceType === "dossier"));
    const scanRules = utils.shuffle(data.rules.filter((rule) => rule.evidenceType !== "dossier"));
    const selected = [
      ...dossierRules.slice(0, config.activeRuleMix.dossier),
      ...scanRules.slice(0, config.activeRuleMix.scan)
    ];
    const remaining = utils.shuffle(data.rules.filter((rule) => !selected.includes(rule)));
    return [...selected, ...remaining]
      .slice(0, config.activeRuleCount)
      .map((rule) => rule.id);
  }

  function selectRuleVariants(activeRuleIds) {
    return activeRuleIds.reduce((variants, ruleId) => {
      const rule = ruleById(ruleId);
      if (rule?.variants?.length) variants[ruleId] = utils.randomFrom(rule.variants);
      return variants;
    }, {});
  }

  function chooseViolations(activeRuleIds, className) {
    const weights = config.classProfiles[className].risk;
    const selected = activeRuleIds.filter((ruleId) => {
      const probability = Math.min(0.48, 0.16 * (weights[ruleId] ?? 1));
      return utils.chance(probability);
    });
    if (selected.length === 0 && utils.chance(0.42)) {
      const weighted = activeRuleIds.flatMap((ruleId) => {
        const copies = Math.max(1, Math.round((weights[ruleId] ?? 1) * 4));
        return Array(copies).fill(ruleId);
      });
      selected.push(utils.randomFrom(weighted));
    }
    return new Set(selected);
  }

  function chooseBenignHints(activeRuleIds, violations) {
    return new Set(activeRuleIds.filter((ruleId) => !violations.has(ruleId) && utils.chance(0.26)));
  }

  function anomalyFor(ruleId, violations, benignHints, strong = 78) {
    if (violations.has(ruleId)) return strong + utils.randInt(0, 15);
    if (benignHints.has(ruleId)) return config.passiveTagThreshold + utils.randInt(0, 12);
    return utils.randInt(2, 24);
  }

  function randomCode(length) {
    return Array.from({ length }, () => String.fromCharCode(utils.randInt(65, 90))).join("");
  }

  function generateRegistryId(authority, shipClass, operator, origin, hullSeries, restrictedPrefix = null) {
    const format = utils.randomFrom(authority.formats);
    const serial = utils.randInt(1000, 9999);
    const check = String.fromCharCode(utils.randInt(65, 90));
    const sector = String(utils.randInt(1, 18)).padStart(2, "0");
    const batch = utils.randInt(10, 34);
    const permitGrade = utils.randomFrom(authority.permitGrades);
    const prefix = restrictedPrefix ?? shipClass.codePrefix;
    const formats = {
      compact: `${authority.code}-${prefix}-${serial}-${check}`,
      ledger: `${authority.code}/${prefix}.${sector}-${serial}`,
      yard: `${authority.code}-${hullSeries}-${batch}.${String(utils.randInt(100, 999))}`,
      frontier: `${authority.code}-${origin.routeCode}-${prefix}${utils.randInt(10, 99)}${check}`,
      bonded: `${operator.code}-${authority.code}-${serial}-${permitGrade}`,
      restricted: `${authority.code}-${prefix}-${serial}-ACT`
    };
    return formats[format] ?? formats.compact;
  }

  function generateShipName(shipClass, operator, origin) {
    const pools = data.namePools;
    const number = utils.randInt(10, 99);
    const templates = {
      "Light Freighter": [
        () => `${operator.code}-${utils.randomFrom(pools.routeNouns)}-${number}`,
        () => `${utils.randomFrom(pools.qualifiers)} ${utils.randomFrom(pools.industrialNouns)}`,
        () => `${origin.routeCode} ${utils.randomFrom(pools.poeticNouns)}`
      ],
      Courier: [
        () => `${utils.randomFrom(pools.qualifiers)} Vector`,
        () => `${operator.code}-${randomCode(2)}-${number}`,
        () => `${utils.randomFrom(pools.callsignFragments)} Dispatch ${number}`
      ],
      "Salvage Skiff": [
        () => `${utils.randomFrom(pools.industrialNouns)} ${number}`,
        () => `${utils.randomFrom(pools.qualifiers)} ${utils.randomFrom(pools.industrialNouns)}`,
        () => `${operator.code}-${utils.randomFrom(pools.callsignFragments)}-${utils.randomFrom(pools.fleetSuffixes)}`
      ],
      Prospector: [
        () => `${utils.randomFrom(pools.qualifiers)} ${utils.randomFrom(pools.routeNouns)}`,
        () => `${origin.routeCode} Survey ${number}`,
        () => `${utils.randomFrom(pools.callsignFragments)} Meridian`
      ],
      "Colony Shuttle": [
        () => `${origin.name.split(" ")[0]} Transfer ${number}`,
        () => `${utils.randomFrom(pools.qualifiers)} ${utils.randomFrom(pools.poeticNouns)}`,
        () => `${operator.code}-Relief-${number}`
      ]
    };
    return utils.randomFrom(templates[shipClass.name])();
  }

  function chooseCargo(shipClass, violations, benignHints) {
    let candidates = shipClass.cargoIds.map(cargoById).filter(Boolean);
    if (violations.has("cargo-containment") || benignHints.has("cargo-containment")) {
      candidates = candidates.filter((cargo) => containmentHazards.includes(cargo.hazardClass));
    }
    if (violations.has("operator-scope") || benignHints.has("operator-scope")) {
      candidates = candidates.filter((cargo) => hazardousClasses.includes(cargo.hazardClass));
    }
    if (!candidates.length) candidates = data.cargo.filter((cargo) => hazardousClasses.includes(cargo.hazardClass));
    return utils.randomFrom(candidates.length ? candidates : data.cargo);
  }

  function chooseDestination(cargo, violations, benignHints) {
    if (violations.has("cargo-containment") || benignHints.has("cargo-containment")) {
      return utils.randomFrom(data.locations.filter((location) => location.kind === "habitat"));
    }
    const compatible = data.locations.filter((location) => cargo.allowedDestinationKinds.includes(location.kind));
    return utils.randomFrom(compatible.length ? compatible : data.locations);
  }

  function chooseOrigin(violations, benignHints) {
    if (violations.has("route-endorsement") || benignHints.has("route-endorsement")) {
      return utils.randomFrom(data.locations.filter((location) => restrictedPortStatuses.includes(location.portStatus)));
    }
    return utils.randomFrom(data.locations);
  }

  function chooseOperator(cargo, violations, benignHints) {
    const hasHazardScope = (operator) => operator.licenceScopes.includes("hazardous");
    if (violations.has("operator-scope")) {
      return utils.randomFrom(data.operators.filter((operator) => !hasHazardScope(operator)));
    }
    if (hazardousClasses.includes(cargo.hazardClass) && (benignHints.has("operator-scope") || utils.chance(0.58))) {
      return utils.randomFrom(data.operators.filter(hasHazardScope));
    }
    return utils.randomFrom(data.operators);
  }

  function chooseRegistryAuthority(violations) {
    if (violations.has("military-registry")) {
      return utils.randomFrom(data.registryAuthorities.filter((authority) => authority.id !== "mil-active"));
    }
    return utils.randomFrom(data.registryAuthorities.filter((authority) => authority.id !== "mil-active"));
  }

  function buildRouteEndorsement(origin, violations) {
    if (restrictedPortStatuses.includes(origin.portStatus)) {
      return violations.has("route-endorsement") ? utils.randomFrom(["RTE-CIV", "RTE-BONDED", "NONE"]) : "RTE-INSPECT";
    }
    return utils.randomFrom(["RTE-CIV", "RTE-BONDED", "RTE-RELIEF"]);
  }

  function buildContainmentCert(cargo, destination, violations) {
    const needsHabCert = containmentHazards.includes(cargo.hazardClass) && destination.kind === "habitat";
    if (needsHabCert) return violations.has("cargo-containment") ? utils.randomFrom(["CN-IND", "CN-BIO", "NONE"]) : "CN-HAB";
    return cargo.requiredCerts[0] ?? "NONE";
  }

  function randomManufacturerModule(type = null) {
    const manufacturer = utils.randomFrom(data.manufacturers);
    let families = manufacturer.moduleFamilies;
    if (type) {
      families = families.filter((family) => family.types.includes(type));
    }
    const family = utils.randomFrom(families.length ? families : manufacturer.moduleFamilies);
    const moduleType = type ?? utils.randomFrom(family.types);
    return {
      manufacturer,
      family,
      type: moduleType,
      model: utils.randomFrom(family.models),
      lot: `${utils.randomFrom(family.lotPrefixes)}-${utils.randInt(10, 99)}`,
      firmware: `${family.family}.${utils.randInt(1, 6)}.${utils.randInt(10, 90)}`
    };
  }

  function moduleFromPolicy(policy, recalled = true) {
    const manufacturer = data.manufacturers.find((item) => item.id === policy.manufacturerId);
    const family = manufacturer.moduleFamilies.find((item) => item.family === policy.family);
    return {
      manufacturer,
      family,
      type: policy.type,
      model: utils.randomFrom(family.models),
      lot: `${recalled ? policy.lotPrefix : utils.randomFrom(family.lotPrefixes.filter((prefix) => prefix !== policy.lotPrefix) || family.lotPrefixes)}-${utils.randInt(10, 99)}`,
      firmware: `${family.family}.${utils.randInt(1, 6)}.${utils.randInt(10, 90)}`
    };
  }

  function makeModule(slot, moduleSpec, licence = "N/A") {
    return {
      slot,
      type: moduleSpec.type,
      manufacturerId: moduleSpec.manufacturer.id,
      manufacturer: moduleSpec.manufacturer.name,
      family: moduleSpec.family.family,
      model: moduleSpec.model,
      lot: moduleSpec.lot,
      firmware: moduleSpec.firmware,
      licence
    };
  }

  function makeModules(context) {
    const { violations, benignHints, recallPolicy } = context;
    const modules = [];
    const count = utils.randInt(3, 5);
    for (let index = 0; index < count; index += 1) {
      modules.push(makeModule(`M${String(index + 1).padStart(2, "0")}`, randomManufacturerModule()));
    }

    if (violations.has("component-recall")) {
      const target = utils.randInt(0, modules.length - 1);
      modules[target] = makeModule(modules[target].slot, moduleFromPolicy(recallPolicy, true));
    } else if (benignHints.has("component-recall")) {
      const target = utils.randInt(0, modules.length - 1);
      modules[target] = makeModule(modules[target].slot, moduleFromPolicy(recallPolicy, false));
    }

    const hasDefence = violations.has("weapon-license") || benignHints.has("weapon-license") || utils.chance(0.18);
    if (hasDefence) {
      modules.push(makeModule(
        `H${utils.randInt(1, 4)}`,
        randomManufacturerModule("point-defence mount"),
        violations.has("weapon-license") ? "NONE" : "DEF-CIV"
      ));
    }
    return modules;
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
      (violations.has("component-recall") || benignHints.has("component-recall") ? 1 : 0);

    return [
      field("passive.mass", "MASS SHADOW", `${utils.fixed(massVariance)} t variance`, ["manifest-match"], anomalyFor("manifest-match", violations, benignHints), "MASS VAR"),
      field("passive.thermal", "PLUME STABILITY", `${utils.fixed(thermalVariance)}% cycle spread`, ["unsafe-reactor"], anomalyFor("unsafe-reactor", violations, benignHints), "THERMAL VAR"),
      field("passive.iff", "IFF COHERENCE", `${utils.fixed(iffDrift)} ms phase drift`, ["military-registry", "route-endorsement"], Math.max(anomalyFor("military-registry", violations, benignHints), anomalyFor("route-endorsement", violations, benignHints, 58)), "IFF ECHO"),
      field("passive.em", "EM APERTURES", `${apertures} intermittent returns`, ["weapon-license", "component-recall"], Math.max(anomalyFor("weapon-license", violations, benignHints, 72), anomalyFor("component-recall", violations, benignHints, 72)), "EM ECHO")
    ];
  }

  function buildDossier(context) {
    const {
      shipClass, cargo, violations, benignHints, declaredHullCode, registryAuthority,
      registryId, registryEndorsement, declaredMass, measuredMass, modules, origin,
      destination, operator, routeEndorsement, routeProfile, containmentCert,
      serviceContractor, hullAge, refitStatus, reactorClass
    } = context;
    const defenceLicence = violations.has("weapon-license")
      ? "NONE"
      : modules.some((module) => module.type === "point-defence mount") ? "DEF-CIV" : "NOT DECLARED";
    const routeScore = Math.max(
      anomalyFor("route-endorsement", violations, benignHints, 74),
      restrictedPortStatuses.includes(origin.portStatus) ? 45 : 8
    );
    const operatorScore = anomalyFor("operator-scope", violations, benignHints, 76);
    const containmentScore = anomalyFor("cargo-containment", violations, benignHints, 76);

    return [
      field("declaration.registry", "REGISTRY ID", registryId, ["military-registry"], benignHints.has("military-registry") ? 46 : 8, "IFF ECHO"),
      field("declaration.registryAuthority", "REGISTRY AUTHORITY", registryAuthority.name, ["military-registry", "route-endorsement"], violations.has("military-registry") ? 58 : 8, "IFF ECHO"),
      field("declaration.operator", "OPERATOR", operator.name, ["operator-scope"], operatorScore, "DOC VAR"),
      field("declaration.operatorLicence", "OPERATOR LICENCE", operator.licenceScopes.join(" / ").toUpperCase(), ["operator-scope"], operatorScore, "DOC VAR"),
      field("declaration.class", "DECLARED CLASS", shipClass.name),
      field("declaration.hull", "DECLARED HULL", declaredHullCode, ["military-registry"], benignHints.has("military-registry") ? 46 : 8, "IFF ECHO"),
      field("declaration.hullAge", "HULL AGE", hullAge),
      field("declaration.refit", "REFIT STATUS", refitStatus, ["component-recall", "unsafe-reactor"], benignHints.has("component-recall") ? 45 : 8, "EM ECHO"),
      field("declaration.reactor", "REACTOR CLASS", reactorClass, ["unsafe-reactor"], benignHints.has("unsafe-reactor") ? 45 : 8, "THERMAL VAR"),
      field("declaration.endorsement", "REGISTRY ENDORSEMENT", registryEndorsement, ["military-registry"], violations.has("military-registry") ? 66 : 10, "IFF ECHO"),
      field("declaration.defenceLicence", "DEFENCE LICENCE", defenceLicence, ["weapon-license"], violations.has("weapon-license") ? 74 : benignHints.has("weapon-license") ? 48 : 8, "EM ECHO"),

      field("route.origin", "ORIGIN", origin.name, ["route-endorsement"], routeScore, "DOC VAR"),
      field("route.originStatus", "ORIGIN STATUS", origin.portStatus.toUpperCase(), ["route-endorsement"], routeScore, "DOC VAR"),
      field("route.destination", "DESTINATION", destination.name, ["cargo-containment", "route-endorsement"], containmentScore, "DOC VAR"),
      field("route.destinationKind", "DESTINATION TYPE", destination.kind.toUpperCase(), ["cargo-containment"], containmentScore, "DOC VAR"),
      field("route.profile", "ROUTE PROFILE", routeProfile.toUpperCase(), ["route-endorsement", "operator-scope"], Math.max(routeScore, operatorScore), "DOC VAR"),
      field("route.permit", "TRANSIT PERMIT", `${operator.permitGrade}-${origin.routeCode}-${destination.routeCode}-${utils.randInt(100, 999)}`, ["route-endorsement"], routeScore, "DOC VAR"),
      field("route.endorsement", "ROUTE ENDORSEMENT", routeEndorsement, ["route-endorsement"], routeScore, "DOC VAR"),

      field("manifest.description", "CARGO DESCRIPTION", cargo.name, ["manifest-match", "operator-scope", "cargo-containment"], Math.max(operatorScore, containmentScore, 8), "DOC VAR"),
      field("manifest.category", "CARGO CATEGORY", cargo.category.toUpperCase(), ["operator-scope"], operatorScore, "DOC VAR"),
      field("manifest.hazard", "HAZARD CLASS", cargo.hazardClass.toUpperCase(), ["operator-scope", "cargo-containment"], Math.max(operatorScore, containmentScore), "DOC VAR"),
      field("manifest.containment", "CONTAINMENT CERT", containmentCert, ["cargo-containment"], containmentScore, "DOC VAR"),
      field("manifest.sealScheme", "SEAL SCHEME", cargo.sealScheme, ["manifest-match", "cargo-containment"], Math.max(anomalyFor("manifest-match", violations, benignHints), containmentScore), "MASS VAR"),
      field("manifest.mass", "DECLARED MASS", `${utils.fixed(declaredMass)} t`, ["manifest-match"], 12, "MASS VAR"),
      field("manifest.seals", "SEAL LEDGER", `${shipClass.bays} bays / ${shipClass.bays} seals`, ["manifest-match"], violations.has("manifest-match") ? 62 : benignHints.has("manifest-match") ? 46 : 7, "MASS VAR"),
      field("load.certificate", "DEPARTURE LOAD CERT", `${utils.fixed(
        violations.has("manifest-match")
          ? measuredMass
          : benignHints.has("manifest-match") ? declaredMass + utils.randInt(25, 50) / 10 : declaredMass + utils.randInt(-10, 10) / 10
      )} t`, ["manifest-match"], anomalyFor("manifest-match", violations, benignHints, 72), "MASS VAR"),
      field("service.contractor", "SERVICE CONTRACTOR", serviceContractor.name, ["component-recall"], benignHints.has("component-recall") || violations.has("component-recall") ? 48 : 8, "EM ECHO")
    ];
  }

  function buildReports(context) {
    const {
      shipClass, cargo, violations, declaredHullCode, measuredHullCode,
      hullDescription, registryAuthority, measuredRegistryAuthority, registryEndorsement,
      declaredMass, measuredMass, detectedBayCount, modules, reactorSamples, recallPolicy
    } = context;

    return [
      report("transponder", [
        field("scan.transponder.declaredHull", "DECLARED.HULL", declaredHullCode, ["military-registry"], 10, "IFF ECHO"),
        field("scan.transponder.measuredHull", "MEASURED.HULL", measuredHullCode, ["military-registry"], violations.has("military-registry") ? 96 : 8, "IFF ECHO"),
        field("scan.transponder.declaredAuthority", "DECLARED.AUTH", registryAuthority.name, ["military-registry"], 8, "IFF ECHO"),
        field("scan.transponder.measuredAuthority", "MEASURED.AUTH", measuredRegistryAuthority.name, ["military-registry"], violations.has("military-registry") ? 92 : 8, "IFF ECHO"),
        field("scan.transponder.geometry", "GEOMETRY", hullDescription, ["military-registry"], violations.has("military-registry") ? 88 : 8, "IFF ECHO"),
        field("scan.transponder.endorsement", "REGISTRY.ENDORSEMENT", registryEndorsement, ["military-registry"], violations.has("military-registry") ? 94 : 8, "IFF ECHO"),
        field("scan.transponder.drift", "BEACON.DRIFT", `${utils.fixed(utils.randInt(1, 38) / 10)} ms`)
      ], violations.has("military-registry") ? ["military-registry"] : []),
      report("cargo", [
        field("scan.cargo.manifestMass", "MANIFEST.MASS", `${utils.fixed(declaredMass)} t`, ["manifest-match"], 8, "MASS VAR"),
        field("scan.cargo.measuredMass", "MEASURED.MASS", `${utils.fixed(measuredMass)} t`, ["manifest-match"], violations.has("manifest-match") ? 96 : 10, "MASS VAR"),
        field("scan.cargo.delta", "MASS.DELTA", `${utils.fixed(measuredMass - declaredMass)} t`, ["manifest-match"], violations.has("manifest-match") ? 98 : 10, "MASS VAR"),
        field("scan.cargo.bay1", "BAY.01", cargo.name, ["manifest-match"], 5, "MASS VAR"),
        field("scan.cargo.bay2", "BAY.02", violations.has("manifest-match") ? "unmanifested sealed container" : cargo.name, ["manifest-match"], violations.has("manifest-match") ? 99 : 5, "MASS VAR"),
        field("scan.cargo.seals", "SEAL.COUNT", `${shipClass.bays} declared / ${detectedBayCount} detected`, ["manifest-match"], violations.has("manifest-match") ? 95 : 5, "MASS VAR")
      ], violations.has("manifest-match") ? ["manifest-match"] : []),
      report("modules", modules.flatMap((module) => {
        const recalled = module.manufacturerId === recallPolicy.manufacturerId && module.family === recallPolicy.family && module.lot.startsWith(recallPolicy.lotPrefix);
        return [
          field(`scan.modules.${module.slot}.type`, `${module.slot}.TYPE`, module.type, ["weapon-license", "component-recall"], module.type === "point-defence mount" ? 65 : recalled ? 80 : 5, "EM ECHO", module.slot),
          field(`scan.modules.${module.slot}.make`, `${module.slot}.MAKE`, module.manufacturer, ["component-recall"], recalled ? 92 : 5, "EM ECHO", module.slot),
          field(`scan.modules.${module.slot}.model`, `${module.slot}.MODEL`, module.model, ["component-recall"], recalled ? 88 : 5, "EM ECHO", module.slot),
          field(`scan.modules.${module.slot}.lot`, `${module.slot}.LOT`, module.lot, ["component-recall"], recalled ? 99 : 5, "EM ECHO", module.slot),
          field(`scan.modules.${module.slot}.firmware`, `${module.slot}.FIRMWARE`, module.firmware, ["component-recall"], recalled ? 74 : 5, "EM ECHO", module.slot),
          field(`scan.modules.${module.slot}.lic`, `${module.slot}.LIC`, module.licence, ["weapon-license"], module.type === "point-defence mount" && module.licence === "NONE" ? 99 : 5, "EM ECHO", module.slot)
        ];
      }), [
        ...(violations.has("weapon-license") ? ["weapon-license"] : []),
        ...(violations.has("component-recall") ? ["component-recall"] : [])
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

  function buildRuleEvidence(context) {
    const {
      origin, destination, routeEndorsement, operator, cargo, containmentCert,
      recallPolicy, registryEndorsement
    } = context;
    return {
      "route-endorsement": `${origin.name} status ${origin.portStatus.toUpperCase()}; route endorsement ${routeEndorsement}`,
      "operator-scope": `${operator.name} scopes ${operator.licenceScopes.join(" / ").toUpperCase()}; cargo hazard ${cargo.hazardClass.toUpperCase()}`,
      "cargo-containment": `${cargo.hazardClass.toUpperCase()} cargo to ${destination.kind.toUpperCase()}; containment ${containmentCert}`,
      "component-recall": recallPolicy.label,
      "military-registry": `registry endorsement ${registryEndorsement}`
    };
  }

  function generateShip(activeRuleIds, id, ruleVariants = {}) {
    const shipClass = utils.randomFrom(data.shipClasses);
    const profile = config.classProfiles[shipClass.name];
    const violations = chooseViolations(activeRuleIds, shipClass.name);
    const benignHints = chooseBenignHints(activeRuleIds, violations);
    const recallPolicy = ruleVariants["component-recall"]?.policyId
      ? data.recallPolicies.find((policy) => policy.id === ruleVariants["component-recall"].policyId)
      : utils.randomFrom(data.recallPolicies);
    const cargo = chooseCargo(shipClass, violations, benignHints);
    const origin = chooseOrigin(violations, benignHints);
    const destination = chooseDestination(cargo, violations, benignHints);
    const operator = chooseOperator(cargo, violations, benignHints);
    const registryAuthority = chooseRegistryAuthority(violations);
    const militaryAuthority = data.registryAuthorities.find((authority) => authority.id === "mil-active");
    const militaryHull = utils.randomFrom(data.militaryHulls);
    const measuredRegistryAuthority = violations.has("military-registry") ? militaryAuthority : registryAuthority;
    const measuredPrefix = violations.has("military-registry") ? militaryHull.codePrefix : shipClass.codePrefix;
    const declaredHullCode = utils.serial(shipClass.codePrefix);
    const measuredHullCode = violations.has("military-registry") ? utils.serial(measuredPrefix) : declaredHullCode;
    const hullDescription = violations.has("military-registry") ? militaryHull.description : shipClass.hullDescription;
    const registryEndorsement = violations.has("military-registry") ? "NONE" : registryAuthority.id === "mil-active" ? "MIL-ACTIVE" : "CIV-ACTIVE";
    const registryId = generateRegistryId(registryAuthority, shipClass, operator, origin, shipClass.hullSeries);
    const routeProfile = utils.randomFrom(shipClass.routeProfiles);
    const routeEndorsement = buildRouteEndorsement(origin, violations);
    const containmentCert = buildContainmentCert(cargo, destination, violations);
    const declaredMass = utils.randInt(cargo.massRange[0], cargo.massRange[1]);
    const massDelta = violations.has("manifest-match") ? utils.randInt(40, 180) / 10 : utils.randInt(-12, 12) / 10;
    const measuredMass = declaredMass + massDelta;
    const detectedBayCount = shipClass.bays + (violations.has("manifest-match") ? 1 : 0);
    const serviceContractor = violations.has("component-recall") || benignHints.has("component-recall")
      ? utils.randomFrom(data.contractors.filter((contractor) => contractor.certification === "RECALL" || contractor.certification === "RAD-GOV"))
      : utils.randomFrom(data.contractors);
    const hullAge = `${utils.randInt(4, 38)} years`;
    const refitStatus = utils.chance(0.45) || violations.has("component-recall") || benignHints.has("component-recall")
      ? `${serviceContractor.certification} refit ${utils.randInt(1, 18)} months ago`
      : "NO RECENT REFIT";
    const reactorClass = utils.randomFrom(["R-90 civil", "R-100 tug", "R-110 survey", "R-80 shuttle"]);
    const context = {
      shipClass, profile, violations, benignHints, recallPolicy, cargo, origin,
      destination, operator, registryAuthority, measuredRegistryAuthority,
      declaredHullCode, measuredHullCode, hullDescription, registryEndorsement,
      registryId, routeProfile, routeEndorsement, containmentCert, declaredMass,
      measuredMass, detectedBayCount, serviceContractor, hullAge, refitStatus,
      reactorClass
    };
    context.modules = makeModules(context);
    context.reactorSamples = [0, 1, 2, 3, 4].map((index) => {
      const base = violations.has("unsafe-reactor") ? 101.5 + index * 2.1 : 72 + index * 3.4;
      return Math.min(119.8, base + utils.randInt(-10, 10) / 10);
    });

    return {
      id,
      name: generateShipName(shipClass, operator, origin),
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
      ruleEvidence: buildRuleEvidence(context),
      aiValidationActive: false,
      aiValidationMessage: null,
      aiValidationHighlightKeys: [],
      collapsedDossierSectionIds: []
    };
  }

  function visibleAnomalies(ship) {
    return [
      ...ship.passiveSurvey,
      ...ship.dossier,
      ...ship.reports.filter((item) => item.discovered).flatMap((item) => item.lines)
    ];
  }

  function hasVisibleHint(ship, ruleId) {
    return [...ship.passiveSurvey, ...ship.dossier]
      .some((item) => item.ruleIds.includes(ruleId) && item.anomalyScore >= config.passiveTagThreshold);
  }

  function hasDossierEvidence(ship, ruleId) {
    return ship.dossier.some((item) => item.ruleIds.includes(ruleId));
  }

  function hasScanProof(ship, rule) {
    const proof = ship.reports.find((item) => item.action === rule.confirmingScan);
    return proof?.violationRuleIds.includes(rule.id);
  }

  function validate(iterations = 500) {
    const seenRules = new Set();
    const failures = [];
    const distribution = {};
    let benignCleanShips = 0;
    let dossierViolations = 0;
    let scanViolations = 0;

    for (let index = 0; index < iterations; index += 1) {
      const active = selectActiveRuleIds();
      const variants = selectRuleVariants(active);
      const activeRules = active.map(ruleById);
      active.forEach((ruleId) => seenRules.add(ruleId));
      const dossierCount = activeRules.filter((rule) => rule.evidenceType === "dossier").length;
      const scanCount = activeRules.filter((rule) => rule.evidenceType !== "dossier").length;
      if (dossierCount !== config.activeRuleMix.dossier || scanCount !== config.activeRuleMix.scan) {
        failures.push(`bad active mix dossier ${dossierCount} scan ${scanCount}`);
      }

      const ship = generateShip(active, index + 1, variants);
      distribution[ship.className] ??= {};
      ship.actualViolations.forEach((ruleId) => {
        distribution[ship.className][ruleId] = (distribution[ship.className][ruleId] ?? 0) + 1;
        if (!active.includes(ruleId)) failures.push(`inactive violation ${ruleId}`);
        const rule = ruleById(ruleId);
        if (!hasVisibleHint(ship, ruleId)) failures.push(`missing hint ${ruleId}`);
        if (rule.evidenceType === "dossier") {
          dossierViolations += 1;
          if (!hasDossierEvidence(ship, ruleId)) failures.push(`missing dossier evidence ${ruleId}`);
        } else {
          scanViolations += 1;
          if (!hasScanProof(ship, rule)) failures.push(`missing proof ${ruleId}`);
        }
      });
      if (ship.actualViolations.length === 0 && visibleAnomalies(ship).some((item) => item.anomalyScore >= config.passiveTagThreshold)) {
        benignCleanShips += 1;
      }
    }

    return {
      passed: failures.length === 0 && seenRules.size === data.rules.length && benignCleanShips > 0 && dossierViolations > 0 && scanViolations > 0,
      failures,
      seenRules: [...seenRules],
      benignCleanShips,
      dossierViolations,
      scanViolations,
      distribution
    };
  }

  namespace.generator = {
    generateShip,
    visibleAnomalies,
    validate,
    selectActiveRuleIds,
    selectRuleVariants
  };
})(window.SpaceCustoms = window.SpaceCustoms || {});
