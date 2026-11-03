import {
  BattleInstance,
  EFFECT_HIGH_PRIORITY,
  ParticipantInstance,
  Place,
} from "@/core/battle-types"
import { BattleEffect } from "@/core/battleeffect/battleEffects"
import { HitInfo } from "@/core/roll"
import { defaultRoll, UnitInstance, UnitType } from "@/core/unit"
import { getUnits } from "@/core/unitGet"
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
