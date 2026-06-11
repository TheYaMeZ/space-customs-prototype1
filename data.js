(function initData(namespace) {
  namespace.data = {
    rules: [
      {
        id: "military-registry",
        code: "REG-12",
        title: "Restricted hull registration",
        criterion: "Measured hull prefixes MX and EX require endorsement MIL-ACTIVE.",
        confirmingScan: "transponder"
      },
      {
        id: "weapon-license",
        code: "ARM-04",
        title: "Civil defence licensing",
        criterion: "Installed weapons and point-defence mounts require licence DEF-CIV.",
        confirmingScan: "modules"
      },
      {
        id: "banned-manufacturer",
        code: "MAT-31",
        title: "Prohibited component origin",
        criterion: "No installed component may be manufactured by Helix Forge.",
        confirmingScan: "modules"
      },
      {
        id: "unsafe-reactor",
        code: "OPS-08",
        title: "Lane reactor limit",
        criterion: "Controlled-lane reactor output may not exceed 100.0% rated output.",
        confirmingScan: "thermal"
      },
      {
        id: "manifest-match",
        code: "CAR-19",
        title: "Cargo declaration accuracy",
        criterion: "Measured cargo must remain within +/- 2.0 tonnes and match the seal ledger.",
        confirmingScan: "cargo"
      }
    ],
    shipNames: [
      "Morrow Finch", "Kite Psalm", "Dust Runner", "Blue Hour",
      "Pillar Wake", "Gilded Vector", "Low Orbit", "Signal Bloom",
      "Ragline", "Cinder Ark", "Borrowed Sun", "Talon Mercy",
      "Shale Lantern", "Vector Hymn", "Cold Meridian", "Anchor Rite"
    ],
    shipClasses: [
      {
        name: "Light Freighter",
        codePrefix: "CF",
        hullDescription: "Kestrel-pattern cargo shell",
        bays: 3,
        tendency: "Cargo volume and mass reconciliation",
        cargo: [
          { name: "agricultural bioculture tanks", massRange: [28, 86] },
          { name: "machined drive components", massRange: [42, 135] },
          { name: "laminated habitat glass", massRange: [55, 170] },
          { name: "medical textile bales", massRange: [12, 48] }
        ]
      },
      {
        name: "Courier",
        codePrefix: "CR",
        hullDescription: "Needle courier spine",
        bays: 2,
        tendency: "Registry identity and transit permits",
        cargo: [
          { name: "sealed archive core rack", massRange: [3, 14] },
          { name: "legal dispatch containers", massRange: [1, 6] },
          { name: "reactor coolant canisters", massRange: [8, 32] },
          { name: "diplomatic parcel lockers", massRange: [1, 5] }
        ]
      },
      {
        name: "Salvage Skiff",
        codePrefix: "SV",
        hullDescription: "Brace-frame industrial tug",
        bays: 3,
        tendency: "Module provenance and retrofit history",
        cargo: [
          { name: "cut salvage lattice", massRange: [45, 180] },
          { name: "reclaimed industrial machinery", massRange: [70, 240] },
          { name: "reclaimed guidance rings", massRange: [18, 75] },
          { name: "used ore filtration drums", massRange: [35, 125] }
        ]
      },
      {
        name: "Prospector",
        codePrefix: "PR",
        hullDescription: "Dust-line survey chassis",
        bays: 2,
        tendency: "Drive modules and sustained reactor load",
        cargo: [
          { name: "assayed ore sample cases", massRange: [6, 24] },
          { name: "survey drone cradles", massRange: [12, 46] },
          { name: "stabilised mineral slurry", massRange: [55, 210] },
          { name: "tungsten drill heads", massRange: [25, 96] }
        ]
      },
      {
        name: "Colony Shuttle",
        codePrefix: "CS",
        hullDescription: "Civil transfer bus",
        bays: 2,
        tendency: "Cargo seals and defensive-system declarations",
        cargo: [
          { name: "domestic fabricator units", massRange: [18, 64] },
          { name: "colony water filter stacks", massRange: [22, 78] },
          { name: "emergency medical stores", massRange: [4, 18] },
          { name: "flat-pack habitation modules", massRange: [65, 190] }
        ]
      }
    ],
    militaryHulls: [
      { codePrefix: "MX", description: "Mantis escort frame" },
      { codePrefix: "EX", description: "Expeditionary picket hull" }
    ],
    pilotNotes: [
      "Pilot requests priority due to a relay slot closing at 19:40.",
      "Captain confirms manifest receipt and remains on open carrier.",
      "Bridge response is delayed by 1.8 seconds after each customs query.",
      "Pilot reports a recent coolant service at the origin port.",
      "Cargo clerk reads seal identifiers from a printed worksheet.",
      "Captain disputes the queue estimate but acknowledges inspection authority.",
      "Background comms indicate routine watch turnover."
    ],
    origins: [
      "Morrow Anchorage", "Kite Reach", "Stonewake", "Nacre Port", "Tern Belt", "Hollow Step",
      "Capella Anchorage", "Deneb Shipyards", "Vega Transfer", "Altair Commercial Ring"
    ],
    destinations: [
      "Gate Four", "Lattice Haven", "Duskmarch", "Cinder Relay", "Outer Polder", "Sable Exchange",
      "Gamma Draconis Relay", "Epsilon Pegasi Station", "Polaris Junction", "Sirius Exchange"
    ],
    companies: [
      "Morrow Haulage", "Blue Banner Transit", "Kite Span Logistics", "Greywake Trade", "Ternline Civil",
      "Capella Freight Union", "Deneb Transit Combine", "Vega Colonial Supply", "Pegasi Heavy Lift"
    ],
    contractors: [
      "J4 Registry Works", "Morrow Certified Service", "Cinder Vale Dockworks", "Lattice Technical Bureau",
      "Subach-Innes Yard Services", "Akheton Systems Group", "Triton Dynamics Field Office",
      "Gamma Draconis Dock Authority"
    ],
    manufacturers: [
      { name: "Aegis Systems", models: ["PD-8", "NAV-40", "SG-2"] },
      { name: "Cinder Vale", models: ["CVR-11", "MULE-6", "RAD-9"] },
      { name: "Morrow Foundry", models: ["MF-20", "GRD-3", "BUS-18"] },
      { name: "Pale Vector", models: ["PV-7", "SCOPE-2", "LATCH-5"] },
      { name: "Lattice Works", models: ["LW-14", "FRAME-8", "COIL-3"] },
      { name: "Subach-Innes", models: ["SI-22", "PROM-7", "VCTR-4"] },
      { name: "Akheton Corporation", models: ["AKH-19", "KPR-6", "LANCE-12"] },
      { name: "Triton Dynamics", models: ["TD-40", "ORION-8", "MANTA-3"] }
    ],
    bannedManufacturer: { name: "Helix Forge", models: ["HX-44", "HF-P9", "LANCE-2"] },
    moduleTypes: [
      "navigation computer", "shield lattice", "cargo field controller",
      "radiator governor", "drive regulator"
    ]
  };
})(window.SpaceCustoms = window.SpaceCustoms || {});
