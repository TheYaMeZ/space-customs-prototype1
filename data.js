(function initData(namespace) {
  namespace.data = {
    rules: [
      {
        id: "military-registry",
        code: "REG-12",
        title: "Restricted hull authority",
        criterion: "Measured hull prefixes MX and EX require endorsement MIL-ACTIVE from the issuing registry.",
        confirmingScan: "transponder",
        evidenceType: "scan"
      },
      {
        id: "weapon-license",
        code: "ARM-04",
        title: "Civil defence licensing",
        criterion: "Installed weapons and point-defence mounts require licence DEF-CIV.",
        confirmingScan: "modules",
        evidenceType: "scan"
      },
      {
        id: "component-recall",
        code: "MAT-31",
        title: "Component recall lot",
        criterion: "Installed modules matching the active recall family and lot prefix are restricted pending yard recertification.",
        confirmingScan: "modules",
        evidenceType: "scan",
        variants: [
          {
            id: "cvr-governor",
            policyId: "cvr-governor",
            criterion: "Installed Cinder Vale CVR radiator governors from lot prefix CVR-11-B are restricted pending yard recertification."
          },
          {
            id: "manta-drive",
            policyId: "manta-drive",
            criterion: "Installed Triton MANTA drive regulators from lot prefix MAN-B are restricted pending yard recertification."
          }
        ]
      },
      {
        id: "unsafe-reactor",
        code: "OPS-08",
        title: "Lane reactor limit",
        criterion: "Controlled-lane reactor output may not exceed 100.0% rated output.",
        confirmingScan: "thermal",
        evidenceType: "scan"
      },
      {
        id: "manifest-match",
        code: "CAR-19",
        title: "Cargo declaration accuracy",
        criterion: "Measured cargo must remain within +/- 2.0 tonnes and match the seal ledger.",
        confirmingScan: "cargo",
        evidenceType: "scan"
      },
      {
        id: "route-endorsement",
        code: "RTE-17",
        title: "Restricted-origin endorsement",
        criterion: "Departures from quarantine or sanction-watch ports require route endorsement RTE-INSPECT.",
        confirmingScan: null,
        evidenceType: "dossier"
      },
      {
        id: "operator-scope",
        code: "LIC-22",
        title: "Operator licence scope",
        criterion: "Operators without hazardous freight scope may not carry bio, pressure, radiological, volatile, or weapons-adjacent cargo.",
        confirmingScan: null,
        evidenceType: "dossier"
      },
      {
        id: "cargo-containment",
        code: "CAR-27",
        title: "Habitat cargo containment",
        criterion: "Volatile or pressure cargo routed to habitat destinations requires containment certificate CN-HAB.",
        confirmingScan: null,
        evidenceType: "dossier"
      }
    ],
    namePools: {
      qualifiers: [
        "Cold", "Blue", "Grey", "Cinder", "Borrowed", "Quiet", "Low", "Pale",
        "Signal", "Gilded", "Hollow", "Last", "First", "Amber", "Red", "Outer",
        "Silver", "Black", "Long", "Static", "Distant", "Morrow"
      ],
      poeticNouns: [
        "Lantern", "Wake", "Psalm", "Meridian", "Vigil", "Finch", "Hour", "Ark",
        "Mercy", "Hymn", "Rite", "Bloom", "Vector", "Crown", "Anchor", "Refrain",
        "Bell", "Orbit", "Fathom", "Promise", "Signal", "Dawn"
      ],
      industrialNouns: [
        "Hauler", "Brace", "Foundry", "Ledger", "Winch", "Cradle", "Tally", "Ragline",
        "Spanner", "Clamp", "Dray", "Keel", "Gantry", "Pallet", "Turnbolt", "Jack"
      ],
      routeNouns: [
        "Gate", "Polder", "Relay", "March", "Anchorage", "Reach", "Step", "Belt",
        "Exchange", "Junction", "Haven", "Spur", "Cut", "Lane", "Drift", "Span"
      ],
      callsignFragments: [
        "Kite", "Tern", "Mantis", "Kestrel", "Pillar", "Shale", "Dust", "Talon",
        "Nacre", "Vega", "Deneb", "Capella", "Sable", "Gamma", "Altair", "Triton"
      ],
      fleetSuffixes: ["A", "B", "C", "K", "Q", "R", "V", "X"]
    },
    registryAuthorities: [
      {
        id: "j4-civil",
        name: "J4 Registry Works",
        code: "J4",
        jurisdiction: "civil",
        formats: ["compact"],
        permitGrades: ["CIV", "BND"],
        restrictedPrefixes: []
      },
      {
        id: "lattice-ledger",
        name: "Lattice Civic Ledger",
        code: "LCL",
        jurisdiction: "civil",
        formats: ["ledger"],
        permitGrades: ["CIV", "PAX", "MED"],
        restrictedPrefixes: []
      },
      {
        id: "deneb-yard",
        name: "Deneb Yard Authority",
        code: "DYA",
        jurisdiction: "corporate",
        formats: ["yard"],
        permitGrades: ["YRD", "BND"],
        restrictedPrefixes: []
      },
      {
        id: "morrow-annex",
        name: "Morrow Registry Annex",
        code: "MRA",
        jurisdiction: "corporate",
        formats: ["bonded"],
        permitGrades: ["BND", "FRG"],
        restrictedPrefixes: []
      },
      {
        id: "frontier-provisional",
        name: "Frontier Provisional Register",
        code: "FPR",
        jurisdiction: "frontier",
        formats: ["frontier"],
        permitGrades: ["TMP", "FRG"],
        restrictedPrefixes: []
      },
      {
        id: "corporate-transit",
        name: "Corporate Transit Bureau",
        code: "CTB",
        jurisdiction: "corporate",
        formats: ["bonded", "compact"],
        permitGrades: ["BND", "HZ"],
        restrictedPrefixes: []
      },
      {
        id: "mil-active",
        name: "Military Active Ledger",
        code: "MIL",
        jurisdiction: "military",
        formats: ["restricted"],
        permitGrades: ["ACT"],
        restrictedPrefixes: ["MX", "EX"]
      }
    ],
    shipClasses: [
      {
        name: "Light Freighter",
        codePrefix: "CF",
        hullSeries: "KES",
        hullDescription: "Kestrel-pattern cargo shell",
        bays: 3,
        routeProfiles: ["bonded freight", "civil freight", "relief charter"],
        cargoIds: ["bio-tanks", "drive-components", "hab-glass", "medical-textiles", "filter-stacks", "drill-heads"]
      },
      {
        name: "Courier",
        codePrefix: "CR",
        hullSeries: "NDL",
        hullDescription: "Needle courier spine",
        bays: 2,
        routeProfiles: ["civil courier", "registry transfer", "bonded packet"],
        cargoIds: ["archive-racks", "legal-containers", "coolant-canisters", "diplomatic-lockers", "survey-cradles"]
      },
      {
        name: "Salvage Skiff",
        codePrefix: "SV",
        hullSeries: "BRC",
        hullDescription: "Brace-frame industrial tug",
        bays: 3,
        routeProfiles: ["salvage return", "yard transfer", "frontier freight"],
        cargoIds: ["salvage-lattice", "reclaimed-machinery", "guidance-rings", "ore-drums", "drive-components"]
      },
      {
        name: "Prospector",
        codePrefix: "PR",
        hullSeries: "DST",
        hullDescription: "Dust-line survey chassis",
        bays: 2,
        routeProfiles: ["survey transit", "extraction return", "frontier freight"],
        cargoIds: ["ore-samples", "survey-cradles", "mineral-slurry", "drill-heads", "coolant-canisters"]
      },
      {
        name: "Colony Shuttle",
        codePrefix: "CS",
        hullSeries: "CVB",
        hullDescription: "Civil transfer bus",
        bays: 2,
        routeProfiles: ["civil transfer", "relief charter", "medical shuttle"],
        cargoIds: ["fabricator-units", "filter-stacks", "medical-stores", "hab-modules", "bio-tanks"]
      }
    ],
    militaryHulls: [
      { codePrefix: "MX", series: "MNT", description: "Mantis escort frame" },
      { codePrefix: "EX", series: "PCK", description: "Expeditionary picket hull" }
    ],
    locations: [
      { id: "morrow-anchorage", name: "Morrow Anchorage", kind: "anchorage", jurisdiction: "civil", portStatus: "open", routeCode: "MOR", exportTags: ["freight", "medical"], importTags: ["industrial", "passenger"] },
      { id: "kite-reach", name: "Kite Reach", kind: "relay", jurisdiction: "frontier", portStatus: "restricted", routeCode: "KTE", exportTags: ["courier", "survey"], importTags: ["relief", "industrial"] },
      { id: "stonewake", name: "Stonewake", kind: "extraction zone", jurisdiction: "frontier", portStatus: "sanction-watch", routeCode: "STN", exportTags: ["ore", "salvage"], importTags: ["machinery"] },
      { id: "nacre-port", name: "Nacre Port", kind: "habitat", jurisdiction: "civil", portStatus: "open", routeCode: "NAC", exportTags: ["passenger", "medical"], importTags: ["agricultural", "medical"] },
      { id: "tern-belt", name: "Tern Belt", kind: "belt", jurisdiction: "frontier", portStatus: "open", routeCode: "TRN", exportTags: ["ore", "survey"], importTags: ["volatile", "industrial"] },
      { id: "hollow-step", name: "Hollow Step", kind: "relay", jurisdiction: "quarantine", portStatus: "quarantine", routeCode: "HST", exportTags: ["medical", "relief"], importTags: ["medical"] },
      { id: "capella-anchorage", name: "Capella Anchorage", kind: "anchorage", jurisdiction: "corporate", portStatus: "restricted", routeCode: "CAP", exportTags: ["freight"], importTags: ["bonded", "industrial"] },
      { id: "deneb-shipyards", name: "Deneb Shipyards", kind: "shipyard", jurisdiction: "corporate", portStatus: "open", routeCode: "DNB", exportTags: ["modules", "refit"], importTags: ["salvage", "machinery"] },
      { id: "vega-transfer", name: "Vega Transfer", kind: "station", jurisdiction: "civil", portStatus: "open", routeCode: "VEG", exportTags: ["passenger", "freight"], importTags: ["medical", "agricultural"] },
      { id: "altair-ring", name: "Altair Commercial Ring", kind: "station", jurisdiction: "corporate", portStatus: "sanction-watch", routeCode: "ALT", exportTags: ["bonded", "modules"], importTags: ["freight"] },
      { id: "lattice-haven", name: "Lattice Haven", kind: "habitat", jurisdiction: "civil", portStatus: "relief-only", routeCode: "LHV", exportTags: ["passenger"], importTags: ["medical", "relief"] },
      { id: "sable-exchange", name: "Sable Exchange", kind: "station", jurisdiction: "corporate", portStatus: "open", routeCode: "SBL", exportTags: ["bonded", "modules"], importTags: ["salvage", "volatile"] }
    ],
    operators: [
      { id: "morrow-haulage", name: "Morrow Haulage", code: "MHA", homeJurisdiction: "civil", licenceScopes: ["freight", "bonded"], permitGrade: "BND", reputationTags: ["punctual"] },
      { id: "blue-banner", name: "Blue Banner Transit", code: "BBT", homeJurisdiction: "civil", licenceScopes: ["passenger", "medical"], permitGrade: "PAX", reputationTags: ["old-fleet"] },
      { id: "kite-span", name: "Kite Span Logistics", code: "KSL", homeJurisdiction: "frontier", licenceScopes: ["freight", "survey"], permitGrade: "FRG", reputationTags: ["frontier"] },
      { id: "greywake", name: "Greywake Trade", code: "GWT", homeJurisdiction: "corporate", licenceScopes: ["freight"], permitGrade: "CIV", reputationTags: ["lean-paperwork"] },
      { id: "ternline", name: "Ternline Civil", code: "TNC", homeJurisdiction: "civil", licenceScopes: ["passenger", "relief"], permitGrade: "CIV", reputationTags: ["relief-charter"] },
      { id: "capella-freight", name: "Capella Freight Union", code: "CFU", homeJurisdiction: "corporate", licenceScopes: ["freight", "hazardous", "bonded"], permitGrade: "HZ", reputationTags: ["hazmat"] },
      { id: "deneb-transit", name: "Deneb Transit Combine", code: "DTC", homeJurisdiction: "corporate", licenceScopes: ["freight", "salvage", "bonded"], permitGrade: "BND", reputationTags: ["yard-linked"] },
      { id: "vega-supply", name: "Vega Colonial Supply", code: "VCS", homeJurisdiction: "civil", licenceScopes: ["freight", "medical", "relief"], permitGrade: "MED", reputationTags: ["colony"] },
      { id: "pegasi-heavy", name: "Pegasi Heavy Lift", code: "PHL", homeJurisdiction: "corporate", licenceScopes: ["freight", "hazardous", "salvage"], permitGrade: "HZ", reputationTags: ["heavy"] },
      { id: "outer-polder", name: "Outer Polder Dispatch", code: "OPD", homeJurisdiction: "frontier", licenceScopes: ["courier", "survey"], permitGrade: "TMP", reputationTags: ["temporary"] }
    ],
    cargo: [
      { id: "bio-tanks", name: "agricultural bioculture tanks", category: "agricultural", hazardClass: "bio", massRange: [28, 86], sealScheme: "BIO-3", requiredCerts: ["CN-BIO"], allowedDestinationKinds: ["station", "habitat", "anchorage"] },
      { id: "drive-components", name: "machined drive components", category: "industrial", hazardClass: "weapons-adjacent", massRange: [42, 135], sealScheme: "IND-2", requiredCerts: ["CN-IND"], allowedDestinationKinds: ["shipyard", "station", "anchorage"] },
      { id: "hab-glass", name: "laminated habitat glass", category: "industrial", hazardClass: "none", massRange: [55, 170], sealScheme: "BULK-1", requiredCerts: [], allowedDestinationKinds: ["habitat", "station", "anchorage"] },
      { id: "medical-textiles", name: "medical textile bales", category: "medical", hazardClass: "none", massRange: [12, 48], sealScheme: "MED-1", requiredCerts: ["CN-MED"], allowedDestinationKinds: ["habitat", "station", "relay"] },
      { id: "archive-racks", name: "sealed archive core racks", category: "controlled", hazardClass: "none", massRange: [3, 14], sealScheme: "SEC-2", requiredCerts: ["CN-SEC"], allowedDestinationKinds: ["station", "relay", "habitat"] },
      { id: "legal-containers", name: "legal dispatch containers", category: "controlled", hazardClass: "none", massRange: [1, 6], sealScheme: "SEC-1", requiredCerts: [], allowedDestinationKinds: ["station", "relay", "habitat"] },
      { id: "coolant-canisters", name: "reactor coolant canisters", category: "industrial", hazardClass: "pressure", massRange: [8, 32], sealScheme: "PRS-4", requiredCerts: ["CN-HAB"], allowedDestinationKinds: ["shipyard", "station", "belt", "extraction zone"] },
      { id: "diplomatic-lockers", name: "diplomatic parcel lockers", category: "controlled", hazardClass: "none", massRange: [1, 5], sealScheme: "DPL-1", requiredCerts: ["CN-DPL"], allowedDestinationKinds: ["habitat", "station", "relay"] },
      { id: "salvage-lattice", name: "cut salvage lattice", category: "salvage", hazardClass: "weapons-adjacent", massRange: [45, 180], sealScheme: "SLV-2", requiredCerts: ["CN-IND"], allowedDestinationKinds: ["shipyard", "station", "anchorage"] },
      { id: "reclaimed-machinery", name: "reclaimed industrial machinery", category: "salvage", hazardClass: "none", massRange: [70, 240], sealScheme: "SLV-1", requiredCerts: [], allowedDestinationKinds: ["shipyard", "station", "extraction zone"] },
      { id: "guidance-rings", name: "reclaimed guidance rings", category: "salvage", hazardClass: "radiological", massRange: [18, 75], sealScheme: "RAD-2", requiredCerts: ["CN-RAD"], allowedDestinationKinds: ["shipyard", "station"] },
      { id: "ore-drums", name: "used ore filtration drums", category: "salvage", hazardClass: "pressure", massRange: [35, 125], sealScheme: "PRS-2", requiredCerts: ["CN-IND"], allowedDestinationKinds: ["shipyard", "station", "extraction zone"] },
      { id: "ore-samples", name: "assayed ore sample cases", category: "industrial", hazardClass: "none", massRange: [6, 24], sealScheme: "ORE-1", requiredCerts: [], allowedDestinationKinds: ["station", "shipyard", "habitat"] },
      { id: "survey-cradles", name: "survey drone cradles", category: "survey", hazardClass: "none", massRange: [12, 46], sealScheme: "SRV-1", requiredCerts: [], allowedDestinationKinds: ["relay", "station", "extraction zone"] },
      { id: "mineral-slurry", name: "stabilised mineral slurry", category: "industrial", hazardClass: "volatile", massRange: [55, 210], sealScheme: "VOL-3", requiredCerts: ["CN-HAB"], allowedDestinationKinds: ["shipyard", "station", "extraction zone"] },
      { id: "drill-heads", name: "tungsten drill heads", category: "industrial", hazardClass: "none", massRange: [25, 96], sealScheme: "IND-1", requiredCerts: [], allowedDestinationKinds: ["shipyard", "station", "extraction zone"] },
      { id: "fabricator-units", name: "domestic fabricator units", category: "colony", hazardClass: "none", massRange: [18, 64], sealScheme: "COL-1", requiredCerts: [], allowedDestinationKinds: ["habitat", "station", "anchorage"] },
      { id: "filter-stacks", name: "colony water filter stacks", category: "colony", hazardClass: "bio", massRange: [22, 78], sealScheme: "BIO-2", requiredCerts: ["CN-BIO"], allowedDestinationKinds: ["habitat", "station", "anchorage"] },
      { id: "medical-stores", name: "emergency medical stores", category: "medical", hazardClass: "bio", massRange: [4, 18], sealScheme: "MED-2", requiredCerts: ["CN-MED"], allowedDestinationKinds: ["habitat", "station", "relay"] },
      { id: "hab-modules", name: "flat-pack habitation modules", category: "colony", hazardClass: "none", massRange: [65, 190], sealScheme: "COL-2", requiredCerts: [], allowedDestinationKinds: ["habitat", "station", "anchorage"] }
    ],
    contractors: [
      { id: "morrow-service", name: "Morrow Certified Service", certification: "CIV-YARD" },
      { id: "cinder-dock", name: "Cinder Vale Dockworks", certification: "RAD-GOV" },
      { id: "lattice-bureau", name: "Lattice Technical Bureau", certification: "CIV-REFIT" },
      { id: "subach-yard", name: "Subach-Innes Yard Services", certification: "DRV-REFIT" },
      { id: "akheton-field", name: "Akheton Systems Field Office", certification: "MODULE" },
      { id: "triton-office", name: "Triton Dynamics Field Office", certification: "SURVEY" },
      { id: "gamma-dock", name: "Gamma Draconis Dock Authority", certification: "FRONTIER" },
      { id: "orison-refit", name: "Orison Certified Refit", certification: "RECALL" }
    ],
    manufacturers: [
      {
        id: "aegis",
        name: "Aegis Systems",
        jurisdiction: "civil",
        certifications: ["DEF-CIV", "CIV-MOD"],
        moduleFamilies: [
          { family: "PD", types: ["point-defence mount"], models: ["PD-8", "PD-12"], lotPrefixes: ["PD8-A", "PD8-K"], recallTags: [] },
          { family: "NAV", types: ["navigation computer"], models: ["NAV-40", "NAV-52"], lotPrefixes: ["NAV-C", "NAV-R"], recallTags: [] }
        ]
      },
      {
        id: "cinder-vale",
        name: "Cinder Vale Dynamics",
        jurisdiction: "corporate",
        certifications: ["RAD-GOV", "CIV-MOD"],
        moduleFamilies: [
          { family: "CVR", types: ["radiator governor"], models: ["CVR-11", "CVR-14"], lotPrefixes: ["CVR-11-B", "CVR-11-K"], recallTags: ["radiator-governor"] },
          { family: "MULE", types: ["drive regulator"], models: ["MULE-6"], lotPrefixes: ["MULE-F", "MULE-R"], recallTags: [] }
        ]
      },
      {
        id: "morrow-foundry",
        name: "Morrow Foundry",
        jurisdiction: "civil",
        certifications: ["CIV-MOD", "CARGO"],
        moduleFamilies: [
          { family: "MF", types: ["cargo field controller"], models: ["MF-20", "BUS-18"], lotPrefixes: ["MF-C", "BUS-D"], recallTags: [] },
          { family: "GRD", types: ["shield lattice"], models: ["GRD-3"], lotPrefixes: ["GRD-A", "GRD-Q"], recallTags: [] }
        ]
      },
      {
        id: "pale-vector",
        name: "Pale Vector Instrument",
        jurisdiction: "frontier",
        certifications: ["SURVEY", "CIV-MOD"],
        moduleFamilies: [
          { family: "SCOPE", types: ["navigation computer"], models: ["SCOPE-2", "PV-7"], lotPrefixes: ["SCP-F", "PV-X"], recallTags: [] },
          { family: "LATCH", types: ["cargo field controller"], models: ["LATCH-5"], lotPrefixes: ["LCH-B", "LCH-R"], recallTags: [] }
        ]
      },
      {
        id: "lattice-works",
        name: "Lattice Works",
        jurisdiction: "civil",
        certifications: ["CIV-MOD"],
        moduleFamilies: [
          { family: "LW", types: ["shield lattice"], models: ["LW-14", "FRAME-8"], lotPrefixes: ["LW-A", "FRM-K"], recallTags: [] },
          { family: "COIL", types: ["drive regulator"], models: ["COIL-3"], lotPrefixes: ["COL-D", "COL-X"], recallTags: [] }
        ]
      },
      {
        id: "subach-innes",
        name: "Subach-Innes",
        jurisdiction: "corporate",
        certifications: ["DRV-REFIT", "CIV-MOD"],
        moduleFamilies: [
          { family: "SI", types: ["drive regulator"], models: ["SI-22", "VCTR-4"], lotPrefixes: ["SI-K", "VCT-R"], recallTags: [] },
          { family: "PROM", types: ["radiator governor"], models: ["PROM-7"], lotPrefixes: ["PRM-B", "PRM-D"], recallTags: [] }
        ]
      },
      {
        id: "akheton",
        name: "Akheton Corporation",
        jurisdiction: "corporate",
        certifications: ["DEF-CIV", "CIV-MOD"],
        moduleFamilies: [
          { family: "AKH", types: ["navigation computer"], models: ["AKH-19", "KPR-6"], lotPrefixes: ["AKH-C", "KPR-R"], recallTags: [] },
          { family: "LANCE", types: ["point-defence mount"], models: ["LANCE-12"], lotPrefixes: ["LNC-A", "LNC-X"], recallTags: [] }
        ]
      },
      {
        id: "triton",
        name: "Triton Dynamics",
        jurisdiction: "frontier",
        certifications: ["SURVEY", "RAD-GOV"],
        moduleFamilies: [
          { family: "TD", types: ["radiator governor"], models: ["TD-40"], lotPrefixes: ["TD-F", "TD-K"], recallTags: [] },
          { family: "MANTA", types: ["drive regulator"], models: ["ORION-8", "MANTA-3"], lotPrefixes: ["MAN-B", "ORN-Q"], recallTags: ["drive-regulator"] }
        ]
      }
    ],
    recallPolicies: [
      { id: "cvr-governor", manufacturerId: "cinder-vale", family: "CVR", type: "radiator governor", lotPrefix: "CVR-11-B", label: "Cinder Vale CVR radiator governors, lot CVR-11-B" },
      { id: "manta-drive", manufacturerId: "triton", family: "MANTA", type: "drive regulator", lotPrefix: "MAN-B", label: "Triton MANTA drive regulators, lot MAN-B" }
    ],
    moduleTypes: [
      "navigation computer", "shield lattice", "cargo field controller",
      "radiator governor", "drive regulator"
    ],
    routeEndorsements: ["RTE-INSPECT", "RTE-CIV", "RTE-BONDED", "RTE-RELIEF"],
    containmentCerts: ["CN-HAB", "CN-BIO", "CN-MED", "CN-IND", "CN-RAD", "CN-SEC", "CN-DPL"],
    pilotNotes: [
      "Pilot requests priority due to a relay slot closing at 19:40.",
      "Captain confirms manifest receipt and remains on open carrier.",
      "Bridge response is delayed by 1.8 seconds after each customs query.",
      "Pilot reports a recent coolant service at the origin port.",
      "Cargo clerk reads seal identifiers from a printed worksheet.",
      "Captain disputes the queue estimate but acknowledges inspection authority.",
      "Background comms indicate routine watch turnover.",
      "Crew repeats that route endorsement was issued at departure.",
      "Pilot says a yard recall notice was closed before launch.",
      "Manifest officer asks whether habitat containment codes are still required this shift."
    ]
  };
})(window.SpaceCustoms = window.SpaceCustoms || {});
