import _times from "lodash/times"

import { doBombardment } from "@/core/battle"
import {
  BattleInstance,
  EFFECT_HIGH_PRIORITY,
  ParticipantInstance,
  Place,
} from "@/core/battle-types"
import { BattleEffect } from "@/core/battleeffect/battleEffects"
import { Faction } from "@/core/factions/faction"
import { getHits, HitInfo } from "@/core/roll"
import { defaultRoll, getUnitWithImproved, UnitInstance, UnitType } from "@/core/unit"
import { getLowestWorthSustainUnit, getUnits } from "@/core/unitGet"
import { logWrapper } from "@/util/util-log"

/**
 * The eight Mad Mahact Kings from the Twilight's Fall game mode (Thunder's Edge).
 * Kings have no faction abilities of their own; each has a unique flagship and mech.
 * Reference: https://scottmk.github.io/ti4-reference/twilights-fall/mad-mahact-kings/
 */

function flagship(name: string, hit: number, count: number, extra?: Partial<UnitInstance>) {
  const effect: BattleEffect = {
    type: "faction",
    name,
    place: "both",
    transformUnit: (unit: UnitInstance) => {
      if (unit.type === UnitType.flagship) {
        return {
          ...unit,
          combat: {
            ...defaultRoll,
            hit,
            count,
          },
          ...extra,
        }
      } else {
        return unit
      }
    },
  }
  return effect
}

// Vermillion – The Ruby Monarch
// Flagship The Scarlet Knife: 5x2. Mech The Sharpened Edge: no combat-relevant text.
export const rubyMonarch: BattleEffect[] = [flagship("The Scarlet Knife", 5, 2)]

// Divine – Radiant Aur
export const radiantAur: BattleEffect[] = [
  flagship("Airo Shir Rex", 7, 2, {
    afb: {
      ...defaultRoll,
      hit: 5,
      count: 3,
    },
  }),
  {
    type: "faction",
    name: "Starlancer II planetary shield",
    place: "both",
    transformUnit: (unit: UnitInstance) => {
      if (unit.type === UnitType.mech) {
        return {
          ...unit,
          planetaryShield: true,
        }
      } else {
        return unit
      }
    },
  },
  {
    type: "faction-ability",
    name: "Starlancer II repair",
    description:
      "Mech ability: At the start of each round of ground combat, you may spend 1 token from your strategy pool to repair all of your mechs. Set count to the number of strategy tokens you are willing to spend. A token is only spent when a mech is damaged.",
    place: "ground",
    faction: "Radiant Aur (TF)",
    count: true,
    onCombatRound: (
      p: ParticipantInstance,
      _battle: BattleInstance,
      _op: ParticipantInstance,
      effectName: string,
    ) => {
      if (!(p.effects[effectName] > 0)) {
        return
      }
      const damagedMechs = p.units.filter(
        (u) => u.type === UnitType.mech && !u.isDestroyed && u.takenDamage,
      )
      if (damagedMechs.length === 0) {
        return
      }
      damagedMechs.forEach((u) => {
        u.takenDamage = false
        u.takenDamageRound = undefined
      })
      p.effects[effectName] -= 1
      logWrapper(`${p.side} spent a strategy token to repair ${damagedMechs.length} mech(s)`)
    },
  },
]

// Glimmering – Avarice Rex
// Flagship Scintillia: 9x2. Mech Delver: no combat-relevant text.
export const avariceRex: BattleEffect[] = [flagship("Scintillia", 9, 2)]

// Blossoming – Il Sai Lakoe, Herald of Thorns
// Flagship Nightbloom: 7x2. Mech Lakoe's Roots: no combat-relevant text.
export const ilSaiLakoe: BattleEffect[] = [flagship("Nightbloom", 7, 2)]

// Tempered – The Saint of Swords
const CAPACITY_UNITS: UnitType[] = [
  UnitType.flagship,
  UnitType.warsun,
  UnitType.dreadnought,
  UnitType.carrier,
]

export const saintOfSwords: BattleEffect[] = [
  flagship("Tizona", 3, 1),
  {
    type: "faction",
    name: "Colada",
    description:
      "Mech ability: While this unit is in the space area, choose 1 unit in its system that has a capacity value to roll 1 additional die on its combat roll. Only applied for the attacker, whose mechs are assumed to be transported.",
    place: "space",
    onCombatRound: (p: ParticipantInstance) => {
      if (p.side !== "attacker") {
        return
      }
      const mechs = getUnits(p, undefined, false).filter((u) => u.type === UnitType.mech)
      if (mechs.length === 0) {
        return
      }
      const capacityTypes =
        p.unitUpgrades[UnitType.cruiser] === true
          ? [...CAPACITY_UNITS, UnitType.cruiser]
          : CAPACITY_UNITS
      const candidates = getUnits(p, "space", false).filter(
        (u) => capacityTypes.includes(u.type) && !!u.combat,
      )
      if (candidates.length === 0) {
        return
      }
      const best = candidates.reduce((a, b) => {
        const aHit = a.combat!.hit - a.combat!.hitBonus - a.combat!.hitBonusTmp
        const bHit = b.combat!.hit - b.combat!.hitBonus - b.combat!.hitBonusTmp
        return aHit <= bHit ? a : b
      })
      best.combat!.countBonusTmp += mechs.length
      logWrapper(`${p.side}'s Colada mechs give ${best.type} ${mechs.length} additional dice`)
    },
  },
]

// Paradox – Il Na Viroset
export const ilNaViroset: BattleEffect[] = [
  flagship("Enigma", 7, 1),
  {
    type: "faction",
    name: "Starlancer XI",
    description: "Mech ability: This unit participates in space combat as if it were a ship.",
    place: "both",
    priority: EFFECT_HIGH_PRIORITY,
    transformUnit: (unit: UnitInstance, _p: ParticipantInstance, place: Place) => {
      if (unit.type === UnitType.mech && place === "space") {
        return {
          ...unit,
          isShip: true,
          isGroundForce: false,
        }
      } else {
        return unit
      }
    },
  },
  {
    type: "faction-ability",
    name: "Starlancer XI anomaly bonus",
    description:
      "Mech ability: For each anomaly this unit is in or adjacent to, apply +1 to this unit's combat rolls. Set count to the number of anomalies.",
    place: "both",
    faction: "Il Na Viroset (TF)",
    count: true,
    onStart: (
      p: ParticipantInstance,
      _battle: BattleInstance,
      _op: ParticipantInstance,
      effectName: string,
    ) => {
      const bonus = p.effects[effectName]
      if (!(bonus > 0)) {
        return
      }
      p.units.forEach((u) => {
        if (u.type === UnitType.mech && u.combat) {
          u.combat.hitBonus += bonus
        }
      })
    },
  },
]

// Replicant – El Nel Janovet
export const elNelJanovet: BattleEffect[] = [
  {
    type: "faction",
    name: "The Faces of Janovet",
    description:
      "Flagship: This unit gains the unit abilities and text abilities of your destroyer, cruiser, and dreadnought unit upgrade technologies.",
    place: "both",
    transformUnit: (unit: UnitInstance, p: ParticipantInstance) => {
      if (unit.type !== UnitType.flagship) {
        return unit
      }
      const result: UnitInstance = {
        ...unit,
        combat: {
          ...defaultRoll,
          hit: 5,
          count: 2,
        },
      }
      if (p.unitUpgrades[UnitType.destroyer] === true) {
        result.afb = {
          ...defaultRoll,
          hit: 6,
          count: 3,
        }
      }
      if (p.unitUpgrades[UnitType.dreadnought] === true) {
        result.bombardment = {
          ...defaultRoll,
          hit: 5,
        }
        result.immuneToDirectHit = true
      }
      return result
    },
  },
]

// Raithborn – A Sickening Lurch
export const aSickeningLurch: BattleEffect[] = [
  flagship("A Strangled Whisper", 7, 2, {
    bombardment: {
      ...defaultRoll,
      hit: 7,
    },
  }),
  {
    type: "faction",
    name: "Bone Picked Clean",
    place: "both",
    priority: EFFECT_HIGH_PRIORITY,
    transformUnit: (unit: UnitInstance) => {
      if (unit.type === UnitType.mech) {
        return {
          ...unit,
          combat: {
            ...defaultRoll,
            hit: 5,
            count: 2,
          },
        }
      } else {
        return unit
      }
    },
  },
  {
    type: "faction-ability",
    name: "Bone Picked Clean reroll",
    description:
      "Mech ability: You can spend 1 captured infantry after rolling during combat to reroll this unit's dice. Set count to the number of captured infantry. In this simulation a captured infantry is spent when a mech misses with all of its dice.",
    place: "both",
    faction: "A Sickening Lurch (TF)",
    count: true,
    transformUnit: (unit: UnitInstance, _p: ParticipantInstance, _place: Place, effectName) => {
      if (unit.type !== UnitType.mech) {
        return unit
      }
      return {
        ...unit,
        onHit: (p: ParticipantInstance, _b: BattleInstance, _op, hitInfo: HitInfo) => {
          if (hitInfo.hits > 0 || !(p.effects[effectName] > 0)) {
            return
          }
          const dice = [...hitInfo.rollInfoList]
          if (dice.length === 0) {
            return
          }
          p.effects[effectName] -= 1
          dice.forEach((die) => {
            const roll = Math.floor(Math.random() * 10 + 1)
            hitInfo.rollInfoList.push({ roll, hitOn: die.hitOn })
            if (roll >= die.hitOn) {
              hitInfo.hits += 1
            }
          })
          logWrapper(
            `${p.side} spent a captured infantry to reroll a mech, now ${hitInfo.hits} hits`,
          )
        },
      }
    },
  },
]

export function isTwilightsFallKing(faction: Faction) {
  return faction.endsWith("(TF)")
}

/**
 * Faction techs and faction abilities of the base factions that also exist as Twilight's Fall
 * ability cards with the same rules text. A Mad Mahact King can splice them, so any king may use
 * them, whichever faction printed them.
 */
const SPLICEABLE_FACTION_EFFECTS = new Set([
  "Munitions Reserves",
  "Non-Euclidean Shielding",
  "Dimensional Splicer",
  "Valkyrie Particle Weave",
  "Devotion",
])

export function canTwilightsFallKingUse(faction: Faction, effect: BattleEffect) {
  return isTwilightsFallKing(faction) && SPLICEABLE_FACTION_EFFECTS.has(effect.name)
}

/**
 * Twilight's Fall ability cards whose rules differ from, or are automatic for, the faction that
 * printed them in the base game. They are options for the kings only.
 * Reference: https://scottmk.github.io/ti4-reference/twilights-fall/
 */
export const twilightsFallAbilities: BattleEffect[] = [
  {
    type: "twilights-fall",
    name: "Unrelenting (TF)",
    description: "Ability: Apply +1 to the result of each of your unit's combat rolls.",
    place: "both",
    transformUnit: (unit: UnitInstance) => {
      if (unit.combat) {
        return getUnitWithImproved(unit, "combat", "hit", "permanent")
      } else {
        return unit
      }
    },
  },
  {
    type: "twilights-fall",
    name: "Supercharge (TF)",
    description:
      "Ability: Before making a combat roll, choose 1 of your units and apply +2 to the result of its combat roll. The unit that gains the most from it is chosen each round.",
    place: "both",
    onCombatRound: (p: ParticipantInstance, battle: BattleInstance) => {
      let best: UnitInstance | undefined
      let bestGain = 0
      for (const unit of getUnits(p, battle.place, false)) {
        if (!unit.combat) {
          continue
        }
        const roll = unit.combat
        const hitOn = roll.hit - roll.hitBonus - roll.hitBonusTmp
        const dice = roll.count + roll.countBonus + roll.countBonusTmp
        // a die can not hit on better than 1+, nor gain anything once it already does
        const gain = dice * Math.max(0, Math.min(hitOn, 11) - Math.max(hitOn - 2, 1))
        if (gain > bestGain) {
          best = unit
          bestGain = gain
        }
      }
      if (best) {
        best.combat!.hitBonusTmp += 2
        logWrapper(`${p.side} used Supercharge on ${best.type}`)
      }
    },
  },
  {
    type: "twilights-fall",
    name: "Ambush (TF)",
    description:
      "Ability: At the start of a space combat, you may roll 1 die for each of up to 2 of your cruisers or destroyers in the system. For each result equal to or greater than that ship's combat value, produce 1 hit; your opponent must assign it to 1 of their ships.",
    place: "space",
    onStart: (p: ParticipantInstance, _battle: BattleInstance, op: ParticipantInstance) => {
      const cruisers = p.units.filter((u) => u.type === UnitType.cruiser && !!u.combat).slice(0, 2)
      const destroyers = p.units
        .filter((u) => u.type === UnitType.destroyer && !!u.combat)
        .slice(0, 2 - cruisers.length)
      let hits = 0
      for (const ship of [...cruisers, ...destroyers]) {
        hits += getHits({ ...defaultRoll, hit: ship.combat!.hit }).hits
      }
      logWrapper(`${p.side} produced ${hits} hits with Ambush`)
      op.hitsToAssign.hits += hits
    },
  },
  {
    type: "twilights-fall",
    name: "Harrow (TF)",
    description:
      "Ability: At the end of each round of ground combat, your ships in the active system may use their BOMBARDMENT abilities against your opponent's ground forces on the planet. Only the attacker has ships to bombard with.",
    place: "ground",
    onCombatRoundEnd: (p: ParticipantInstance, battle: BattleInstance) => {
      if (p.side === "attacker") {
        doBombardment(battle, true)
      }
    },
  },
  {
    type: "twilights-fall",
    name: "Raid Formation (TF)",
    description:
      "Ability: When 1 or more of your units uses ANTI-FIGHTER BARRAGE, for each hit produced in excess of your opponent's fighters, choose 1 of your opponent's ships that has SUSTAIN DAMAGE to become damaged.",
    place: "space",
    afterAfb: (p: ParticipantInstance, battle: BattleInstance, op: ParticipantInstance) => {
      _times(op.afbHitsToAssign.fighterHitsToAssign, () => {
        const sustainUnit = getLowestWorthSustainUnit(op, battle.place, true)
        if (sustainUnit) {
          logWrapper(`${p.side} damaged ${sustainUnit.type} with Raid Formation`)
          sustainUnit.takenDamage = true
          sustainUnit.takenDamageRound = 0
        }
      })
    },
  },
  {
    type: "twilights-fall",
    name: "Planesplitter (TF)",
    description:
      "Ability: Apply +2 to the result of each of your units' combat rolls in the Fracture. Only turn this on for a combat in the Fracture.",
    place: "both",
    transformUnit: (unit: UnitInstance) => {
      if (unit.combat) {
        return getUnitWithImproved(unit, "combat", "hit", "permanent", 2)
      } else {
        return unit
      }
    },
  },
]

export function getTwilightsFallAbilities() {
  return twilightsFallAbilities
}
