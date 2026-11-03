import { EFFECT_HIGH_PRIORITY, EFFECT_LOW_PRIORITY } from "@/core/battle-types"
import { BattleEffect } from "@/core/battleeffect/battleEffects"
import { defaultRoll, Roll, UnitInstance, UnitType } from "@/core/unit"
import { objectEntries, objectKeys } from "@/util/util-object"
import { PartialRecord } from "@/util/util-types"

/**
 * Unit stats sent from outside (for example the async web for a Twilight's Fall unit upgrade
 * spliced from another faction), written as a compact string of dot separated tokens:
 *
 * - `c5x2` combat 5 with 2 dice
 * - `a6x3` anti-fighter barrage 6 (x3)
 * - `b4x2` bombardment 4 (x2)
 * - `s5x1` space cannon 5 (x1)
 * - `sd` sustain damage
 * - `ps` planetary shield
 * - `dh` immune to direct hit
 *
 * The stats replace the unit's printed values completely: a roll that is not listed is removed.
 * Bonuses from other effects (techs, abilities, action cards) still apply on top. Flagships and
 * mechs are the exception, see `getUnitStatsEffects`.
 */
export interface UnitStats {
  combat?: Roll
  afb?: Roll
  bombardment?: Roll
  spaceCannon?: Roll
  sustainDamage: boolean
  planetaryShield: boolean
  immuneToDirectHit: boolean
}

const ROLL_TOKENS = {
  c: "combat",
  a: "afb",
  b: "bombardment",
  s: "spaceCannon",
} as const

export function parseUnitStats(value: string): UnitStats | undefined {
  const stats: UnitStats = {
    sustainDamage: false,
    planetaryShield: false,
    immuneToDirectHit: false,
  }
  const tokens = value.split(".").filter((t) => t.length > 0)
  if (tokens.length === 0) {
    return undefined
  }
  for (const token of tokens) {
    if (token === "sd") {
      stats.sustainDamage = true
      continue
    }
    if (token === "ps") {
      stats.planetaryShield = true
      continue
    }
    if (token === "dh") {
      stats.immuneToDirectHit = true
      continue
    }
    const rollMatch = token.match(/^([cabs])(\d+)x(\d+)$/)
    if (!rollMatch) {
      return undefined
    }
    const hit = parseInt(rollMatch[2])
    const count = parseInt(rollMatch[3])
    if (hit < 1 || hit > 10 || count < 1 || count > 10) {
      return undefined
    }
    const key = ROLL_TOKENS[rollMatch[1] as keyof typeof ROLL_TOKENS]
    stats[key] = { ...defaultRoll, hit, count }
  }
  return stats
}

export function isValidUnitStats(value: string) {
  return parseUnitStats(value) !== undefined
}

function applyUnitStats(unit: UnitInstance, stats: UnitStats): UnitInstance {
  return {
    ...unit,
    combat: stats.combat ? { ...stats.combat } : undefined,
    afb: stats.afb ? { ...stats.afb } : undefined,
    bombardment: stats.bombardment ? { ...stats.bombardment } : undefined,
    spaceCannon: stats.spaceCannon ? { ...stats.spaceCannon } : undefined,
    sustainDamage: stats.sustainDamage,
    planetaryShield: stats.planetaryShield,
    immuneToDirectHit: stats.immuneToDirectHit,
  }
}

/**
 * Flagships and mechs of the Twilight's Fall kings keep their own card in play when a spliced
 * upgrade of the same type is gained. For them the stats only set the printed rolls they list
 * (and sustain damage), and the unit keeps its other abilities, such as a king's planetary shield
 * or bombardment.
 */
const UNITS_THAT_KEEP_THEIR_ABILITIES: UnitType[] = [UnitType.flagship, UnitType.mech]

function withPrintedRoll(current: Roll | undefined, printed: Roll | undefined): Roll | undefined {
  if (!printed) {
    return current
  }
  return { ...(current ?? defaultRoll), hit: printed.hit, count: printed.count }
}

function applyPrintedRolls(unit: UnitInstance, stats: UnitStats): UnitInstance {
  return {
    ...unit,
    combat: withPrintedRoll(unit.combat, stats.combat),
    afb: withPrintedRoll(unit.afb, stats.afb),
    bombardment: withPrintedRoll(unit.bombardment, stats.bombardment),
    spaceCannon: withPrintedRoll(unit.spaceCannon, stats.spaceCannon),
    sustainDamage: unit.sustainDamage || stats.sustainDamage,
    planetaryShield: unit.planetaryShield || stats.planetaryShield,
    immuneToDirectHit: !!unit.immuneToDirectHit || stats.immuneToDirectHit,
  }
}

/**
 * The battle effects that give units their custom stats.
 *
 * Most units are replaced whole, before every other transform, so faction abilities and techs
 * that improve rolls still add their bonuses afterwards. Flagships and mechs get only their
 * printed rolls, after the faction has defined its unit (which sets the rolls of a king's own
 * flagship and mech) and keeping every bonus already given.
 */
export function getUnitStatsEffects(
  unitStats: PartialRecord<UnitType, string> | undefined,
): BattleEffect[] {
  const parsed: PartialRecord<UnitType, UnitStats> = {}
  for (const [unitType, value] of objectEntries(unitStats ?? {})) {
    const stats = parseUnitStats(value)
    if (stats) {
      parsed[unitType] = stats
    }
  }
  if (objectKeys(parsed).length === 0) {
    return []
  }
  const keepsAbilities = (type: UnitType) => UNITS_THAT_KEEP_THEIR_ABILITIES.includes(type)
  return [
    {
      type: "other",
      name: "Custom unit stats",
      place: "both",
      priority: EFFECT_HIGH_PRIORITY + 25,
      transformUnit: (unit: UnitInstance) => {
        const stats = parsed[unit.type]
        return stats && !keepsAbilities(unit.type) ? applyUnitStats(unit, stats) : unit
      },
    },
    {
      type: "other",
      name: "Custom unit stats (flagship and mech)",
      place: "both",
      // after every unit definition, before the effects that take unit abilities away
      priority: EFFECT_LOW_PRIORITY + 5,
      transformUnit: (unit: UnitInstance) => {
        const stats = parsed[unit.type]
        return stats && keepsAbilities(unit.type) ? applyPrintedRolls(unit, stats) : unit
      },
    },
  ]
}
