(function initConfig(namespace) {
  namespace.config = {
    shiftDuration: 600,
    contactSpawn: [34, 50],
    contactLifetime: [140, 200],
    maxContacts: 4,
    activeRuleCount: 4,
    assistCharges: 3,
    maxScanPower: 8,
    powerRechargeInterval: 25,
    passiveTagThreshold: 42,
    assistThreshold: 55,
    scans: [
      { id: "transponder", label: "ACTIVE PING", cost: 1, duration: 2, description: "Hull and registry interrogation" },
      { id: "cargo", label: "HOLD TOMOGRAPHY", cost: 2, duration: 4, description: "Bay contents and measured mass" },
      { id: "modules", label: "MODULE QUERY", cost: 2, duration: 3, description: "Installed component registry" },
      { id: "thermal", label: "THERMAL LENS", cost: 1, duration: 2, description: "Reactor output sample series" }
    ],
    classProfiles: {
      "Light Freighter": {
        risk: { "manifest-match": 1.8, "weapon-license": 0.8, "banned-manufacturer": 0.9, "unsafe-reactor": 0.8, "military-registry": 0.7 },
        baseline: { massVariance: 1.4, thermalVariance: 7.5, iffDrift: 2.8, emApertures: 1 }
      },
      Courier: {
        risk: { "military-registry": 1.7, "manifest-match": 0.8, "weapon-license": 0.8, "banned-manufacturer": 0.7, "unsafe-reactor": 0.8 },
        baseline: { massVariance: 0.8, thermalVariance: 5.5, iffDrift: 1.8, emApertures: 0 }
      },
      "Salvage Skiff": {
        risk: { "banned-manufacturer": 1.8, "weapon-license": 1.2, "unsafe-reactor": 1.1, "manifest-match": 0.9, "military-registry": 0.7 },
        baseline: { massVariance: 2.0, thermalVariance: 10.5, iffDrift: 3.2, emApertures: 2 }
      },
      Prospector: {
        risk: { "unsafe-reactor": 1.7, "banned-manufacturer": 1.4, "weapon-license": 0.9, "manifest-match": 0.8, "military-registry": 0.7 },
        baseline: { massVariance: 1.7, thermalVariance: 12.0, iffDrift: 2.6, emApertures: 2 }
      },
      "Colony Shuttle": {
        risk: { "manifest-match": 1.35, "weapon-license": 1.35, "military-registry": 0.8, "banned-manufacturer": 0.8, "unsafe-reactor": 0.8 },
        baseline: { massVariance: 1.2, thermalVariance: 6.5, iffDrift: 2.2, emApertures: 1 }
      }
    }
  };

  namespace.utils = {
    randomFrom(list) {
      return list[Math.floor(Math.random() * list.length)];
    },
    randInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    chance(rate) {
      return Math.random() < rate;
    },
    shuffle(list) {
      const copy = [...list];
      for (let index = copy.length - 1; index > 0; index -= 1) {
        const target = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[target]] = [copy[target], copy[index]];
      }
      return copy;
    },
    serial(prefix) {
      return `${prefix}-${this.randInt(1000, 9999)}-${String.fromCharCode(this.randInt(65, 90))}`;
    },
    fixed(value, places = 1) {
      return Number(value).toFixed(places);
    }
  };
})(window.SpaceCustoms = window.SpaceCustoms || {});
