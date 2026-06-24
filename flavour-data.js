(function initFlavourData(namespace) {
  const template = (text, context) => text.replace(/\{(\w+)\}/g, (_, key) => context[key] ?? "");

  function lower(value) {
    return String(value ?? "").toLowerCase();
  }

  function addMatches(pool, context, matches) {
    matches.forEach(({ when, lines }) => {
      if (when(context)) pool.push(...lines);
    });
  }

  function pick(pool, context, utils) {
    const line = utils.randomFrom(pool);
    return typeof line === "function" ? line(context) : template(line, context);
  }

  const pilotNotes = {
    general: [
      "Pilot requests priority due to a relay slot closing at 19:40.",
      "Captain confirms manifest receipt and remains on open carrier.",
      "Bridge response is delayed by 1.8 seconds after each customs query.",
      "Pilot reports a recent coolant service at the origin port.",
      "Cargo clerk reads seal identifiers from a printed worksheet.",
      "Captain disputes the queue estimate but acknowledges inspection authority.",
      "Background comms indicate routine watch turnover.",
      "Crew repeats that route endorsement was issued at departure.",
      "Pilot says a yard recall notice was closed before launch.",
      "Manifest officer asks whether habitat containment codes are still required this shift.",
      "Bridge audio carries an old fan whine under every transmission.",
      "The duty officer keeps one channel open to the operator dispatch desk.",
      "A junior clerk can be heard rehearsing the registry ID before each reply.",
      "Crew reports the autopilot is holding lane attitude inside customs tolerance."
    ],
    matches: [
      {
        when: (ctx) => ctx.className === "Light Freighter",
        lines: [
          "Loadmaster reports the bay tally twice, then asks the bridge to stop interrupting.",
          "Freight crew keeps a seal worksheet taped beside the comms pickup.",
          "Cargo bay pressure is being watched manually from an aft maintenance panel.",
          "The captain says the pallet count was reconciled at departure, then pauses before giving the time."
        ]
      },
      {
        when: (ctx) => ctx.className === "Courier",
        lines: [
          "Courier pilot is trying to protect a tight relay slot without sounding like they are rushing customs.",
          "Dispatch custody seals are logged in a clipped legal cadence over the background channel.",
          "Pilot says the packet bay is isolated and asks for a quick handoff when released.",
          "A route clerk keeps asking whether the next beacon window is still valid."
        ]
      },
      {
        when: (ctx) => ctx.className === "Colony Shuttle",
        lines: [
          "Cabin supervisor reports passengers are strapped in and tired of the hold pattern.",
          "Habitat liaison traffic bleeds through from a low-priority service channel.",
          "Crew chief asks whether colony-priority handling applies during customs qualification.",
          "The shuttle keeps repeating passenger count, cargo count, then passenger count again."
        ]
      },
      {
        when: (ctx) => ["Salvage Skiff", "Prospector"].includes(ctx.className),
        lines: [
          "Industrial crew answers through suit mics and a lot of loose tool noise.",
          "Pilot reports dust contamination on one exterior camera but normal helm response.",
          "A yardhand in the background is arguing about who signed the last service worksheet.",
          "Bridge audio is half procedure, half someone trying to quiet a pump alarm."
        ]
      },
      {
        when: (ctx) => lower(ctx.routeProfile).includes("freight") || lower(ctx.routeProfile).includes("bonded"),
        lines: [
          "Operator desk asks the crew to keep the freight ledger open until customs closes the contact.",
          "The route clerk says the bonded file is available if J4 wants a second copy.",
          "Crew reports the freight manifest was re-exported after a ledger-format warning.",
          "A dispatch supervisor remains on the circuit, saying little and logging everything."
        ]
      },
      {
        when: (ctx) => ["bio", "pressure", "radiological", "volatile", "weapons-adjacent"].includes(ctx.hazardClass),
        lines: [
          "Cargo watch reports containment telemetry is stable but keeps the channel terse.",
          "The crew sounds more careful than annoyed whenever the cargo is mentioned.",
          "A safety officer cuts into comms to remind the bridge not to cycle bay power.",
          "The declared load has the crew using checklists for even routine acknowledgements."
        ]
      },
      {
        when: (ctx) => ["medical", "relief", "colony"].includes(ctx.cargoCategory) || lower(ctx.routeProfile).includes("relief"),
        lines: [
          "Crew mentions habitat receiving staff are already waiting on the dock net.",
          "Medical-priority language appears in the operator chatter, though the captain stays procedural.",
          "Relief cargo coordinator asks for release timing, then apologises into a muted mic.",
          "The pilot repeats that the destination watch has been notified of the customs hold."
        ]
      },
      {
        when: (ctx) => ctx.destinationKind === "habitat",
        lines: [
          "Destination traffic is tagged for habitat intake, with a local dockmaster listening in.",
          "Crew asks whether habitat arrival control needs a customs delay code.",
          "The bridge keeps a second line open to habitat supply coordination.",
          "A habitat receiving clerk is audibly waiting for the J4 disposition."
        ]
      },
      {
        when: (ctx) => ctx.hasDefenceDeclaration,
        lines: [
          "Bridge reports defensive buses are safed and isolated for the hold.",
          "A systems tech confirms hardpoints are power-quiet while customs has the lane.",
          "Crew uses the phrase 'defence bus cold' before anyone asks them to.",
          "The captain volunteers that all defensive mounts are in transit-safe condition."
        ]
      },
      {
        when: (ctx) => ctx.operatorTags.includes("lean-paperwork") || ctx.storyKey === "greywake",
        lines: [
          "Greywake dispatch answers promptly but gives every timestamp in a different ledger format.",
          "The bridge keeps its replies immaculate, almost too neat for a tired freight lane.",
          "A Greywake clerk says the file is 'the current one' before anyone challenges it.",
          "Crew cadence is polished, corporate, and slightly brittle under routine customs questions."
        ]
      },
      {
        when: (ctx) => ctx.operatorTags.includes("frontier"),
        lines: [
          "Frontier dispatch delay leaves small holes between every acknowledgement.",
          "Pilot says the origin desk still uses a half-manual ledger export.",
          "Crew warns that one route stamp may appear under the old frontier format.",
          "Bridge audio carries the calm fatalism of someone used to provisional paperwork."
        ]
      },
      {
        when: (ctx) => ctx.operatorTags.includes("hazmat"),
        lines: [
          "Operator hazmat desk stays on the channel and corrects one cargo term under their breath.",
          "Crew reports containment paperwork is ready for any secondary authority request.",
          "The safety officer has a better microphone than the captain.",
          "Dispatch insists the cargo file was checked against the latest handling bulletin."
        ]
      }
    ]
  };

  const controlCopy = {
    packet: {
      general: [
        "{name}, this is J4 Customs. Hold lane vector and transmit declaration packet.",
        "{name}, J4 Control. Maintain approach marker and uplink customs declaration.",
        "{name}, customs check is active. Freeze vector and send registry packet.",
        "{name}, J4 Control has your contact. Hold present lane and send declaration bundle."
      ]
    },
    clear: {
      general: [
        "{name}, customs release granted. Resume filed route.",
        "{name}, you are clear through J4. Keep to filed corridor until beacon handoff.",
        "{name}, inspection closed. Proceed on declared transit vector.",
        "{name}, J4 releases your hold. Return to filed traffic sequence."
      ]
    },
    detain: {
      general: [
        "{name}, hold position. Detention order follows on authority channel.",
        "{name}, do not depart lane. Power down transit burn and await authority transfer.",
        "{name}, customs hold is in effect. Maintain position for detention control.",
        "{name}, J4 is placing your contact under customs hold. Keep all drives safed."
      ]
    },
    correction: {
      general: [
        "{name}, ruling transmission logged. Hold for amended lane instruction.",
        "{name}, customs ruling is under audit correction. Maintain present vector.",
        "{name}, stand by. J4 is reconciling the ruling packet.",
        "{name}, J4 has an audit exception. Maintain lane hold while control reconciles."
      ]
    },
    scan: {
      general: [
        "{name}, stand by for {scanLabelLower} acquisition. Maintain present attitude."
      ],
      byScan: {
        transponder: [
          "{name}, submit to active transponder interrogation. Keep beacon power steady.",
          "{name}, J4 Customs will run {scanLabelLower}. Hold registry channel open.",
          "{name}, maintain lane vector. We are polling hull and authority records."
        ],
        cargo: [
          "{name}, prepare for hold tomography. Lock cargo bay shutters and stand by.",
          "{name}, submit to cargo scan. Keep mass dampers stable until acquisition closes.",
          "{name}, J4 Customs is imaging your declared load. No bay cycling during scan.",
          "{name}, hold all bay actuators still while J4 resolves cargo geometry."
        ],
        modules: [
          "{name}, submit installed systems for module registry query.",
          "{name}, keep service bus open. We are checking component registry returns.",
          "{name}, J4 Customs is polling installed module licences. Hold configuration."
        ],
        thermal: [
          "{name}, steady reactor output for thermal lens acquisition.",
          "{name}, hold thrust idle. We are sampling your reactor profile.",
          "{name}, thermal lens pass inbound. Keep output inside normal operating band."
        ]
      }
    }
  };

  const shipComms = {
    packet: {
      general: [
        "J4 Control, {name}. {className} packet is uplinked; holding inspection vector.",
        "{name} to J4. Declaration packet sent. Holding vector and awaiting customs readback.",
        "J4, {name}. Packet transfer complete; nav is steady on your lane marker.",
        "{name} copies customs hold. Registry and load packet are on the wire.",
        "J4 Control, {name}. Declaration is away. We are hands-off the lane vector.",
        "{name} responding. Packet is cleanly transferred; awaiting inspection sequence.",
        "J4, we have you. {name} is holding and the declaration packet is live."
      ],
      matches: [
        {
          when: (ctx) => ctx.storyKey === "greywake",
          lines: [
            "J4, {name}. Greywake Trade packet is current by dispatch timestamp. Holding vector.",
            "{name} to J4. Declaration file transferred from Greywake ledger node; awaiting your read.",
            "J4 Control, {name}. Greywake copies qualification hold. Packet is live on your channel."
          ]
        },
        {
          when: (ctx) => ctx.className === "Courier",
          lines: [
            "{name} to J4. Courier packet sealed and transmitted; relay slot is still green.",
            "J4, {name}. Custody file is away. We are holding the packet bay locked."
          ]
        },
        {
          when: (ctx) => lower(ctx.routeProfile).includes("freight"),
          lines: [
            "{name} copies. Freight declaration and load ledger are both on the wire.",
            "J4 Control, {name}. Loadmaster confirms packet upload; bays remain sealed."
          ]
        }
      ]
    },
    scanStandby: {
      general: [
        "{name} copies. Holding attitude for {scanLabelLower}.",
        "Standing by for {scanLabelLower}, J4. Thrusters cold.",
        "{name}. Present attitude locked; ready for your {scanLabelLower}.",
        "J4, {name}. We are steady. Run your {scanLabelLower}.",
        "{name} copies scan order. No bay or bus changes until you release us.",
        "Holding for customs acquisition. Call when the {scanLabelLower} is closed.",
        "{name} has the lane lock. Proceed with {scanLabelLower}.",
        "Copy, J4. Crew is standing off controls for your scan pass."
      ],
      matches: [
        {
          when: (ctx) => ctx.scanId === "cargo" && lower(ctx.routeProfile).includes("freight"),
          lines: [
            "{name} copies hold tomography. Loadmaster has the bay board frozen.",
            "J4, {name}. Bay cycling is locked out; run your hold pass."
          ]
        },
        {
          when: (ctx) => ctx.scanId === "modules" && ctx.hasDefenceDeclaration,
          lines: [
            "{name} copies module query. Defence bus remains cold.",
            "J4, {name}. Service bus open; hardpoints remain transit-safe."
          ]
        },
        {
          when: (ctx) => ctx.storyKey === "greywake",
          lines: [
            "{name} copies. Greywake dispatch notes customs acquisition in the ledger.",
            "J4, {name}. Holding exactly on marker for your {scanLabelLower}."
          ]
        }
      ]
    },
    scanReturn: {
      general: [
        "{scanLabelLower} return complete. Holding for customs instruction.",
        "J4, {name}. {scanLabelLower} handshake closed; awaiting your call.",
        "{name} confirms {scanLabelLower} cycle complete. Still on lane vector.",
        "Customs acquisition closed on our board. {name} remains at hold.",
        "J4, our panel shows your {scanLabelLower} is complete. Standing by.",
        "{name}. Scan cycle ended; no manoeuvre pending your release.",
        "Return acknowledged. {name} is waiting on customs disposition.",
        "J4 Control, {name}. Your scan pass is clear of our bus."
      ],
      matches: [
        {
          when: (ctx) => ctx.scanId === "cargo",
          lines: [
            "{name} confirms hold tomography closed. Bay board is still frozen.",
            "J4, {name}. Cargo scan handshake is complete; loadmaster standing by."
          ]
        },
        {
          when: (ctx) => ctx.storyKey === "greywake",
          lines: [
            "{name} to J4. Greywake ledger marks your scan pass complete.",
            "J4, {name}. Acquisition closed. Dispatch is waiting on customs disposition."
          ]
        }
      ]
    },
    clear: {
      general: [
        "{name} copies release. Resuming filed route.",
        "Customs release received, J4. {name} is outbound on filed vector.",
        "{name}. Release logged; thanks control.",
        "J4, {name} is clear and coming back onto transit power.",
        "{name} copies clear. We will keep to the filed corridor.",
        "Release received. {name} departing lane control.",
        "Much obliged, J4. {name} is moving to beacon handoff.",
        "{name} has your release. Safe watch, control."
      ],
      matches: [
        {
          when: (ctx) => ctx.storyKey === "greywake",
          lines: [
            "{name} copies release. Greywake dispatch closes the customs hold.",
            "J4, {name}. Release logged in Greywake ledger; returning to filed vector."
          ]
        }
      ]
    },
    detain: {
      general: [
        "{name} copies detention order. Holding position.",
        "Detention order received, J4. {name} is safing drives.",
        "{name}. Holding for authority channel transfer.",
        "J4, {name} acknowledges customs hold. Main burn is locked out.",
        "Copy detention. {name} is maintaining lane position.",
        "{name} received. We are standing by for enforcement instructions.",
        "Understood, J4. {name} will not depart controlled volume.",
        "{name} is holding. Crew requests authority channel when ready."
      ],
      matches: [
        {
          when: (ctx) => ctx.storyKey === "greywake",
          lines: [
            "{name} copies customs hold. Greywake dispatch requests authority channel when available.",
            "J4, {name}. Drives are safed. Dispatch is escalating the hold internally."
          ]
        },
        {
          when: (ctx) => ["bio", "pressure", "radiological", "volatile"].includes(ctx.hazardClass),
          lines: [
            "{name} copies detention. Safety officer is keeping containment on local watch.",
            "J4, {name}. Holding position; cargo safety remains under crew watch."
          ]
        }
      ]
    }
  };

  function noteContextPool(context) {
    const pool = [...pilotNotes.general];
    addMatches(pool, context, pilotNotes.matches);
    return pool;
  }

  function commsPool(collection, event, context) {
    const eventPool = collection[event];
    const pool = [...(eventPool?.general ?? [])];
    if (event === "scan" && context.scanId) {
      pool.push(...(eventPool?.byScan?.[context.scanId] ?? []));
    }
    addMatches(pool, context, eventPool?.matches ?? []);
    return pool;
  }

  namespace.flavour = {
    pilotNote(context, utils) {
      return pick(noteContextPool(context), context, utils);
    },
    controlCopy(event, context, utils) {
      return pick(commsPool(controlCopy, event, context), context, utils);
    },
    shipComms(event, context, utils) {
      return pick(commsPool(shipComms, event, context), context, utils);
    }
  };
})(window.SpaceCustoms = window.SpaceCustoms || {});
