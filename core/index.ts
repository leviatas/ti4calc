import _cloneDeep from "lodash/cloneDeep"
import _times from "lodash/times"

import { Battle, BattleResult, BattleWinner, Participant, Place } from "@/core/battle-types"
import { setupBattle, startBattle } from "@/core/battleSetup"
import { UnitType } from "@/core/unit"
import { objectEntries } from "@/util/util-object"
import { PartialRecord } from "@/util/util-types"

export interface BattleReport {
  attacker: number
  attackerSurvivers: PartialRecord<string, number>
  draw: number
  defender: number
  defenderSurvivers: PartialRecord<string, number>
  numberOfRolls: number
  // Units destroyed, summed over every battle, by unit type
  attackerLosses: PartialRecord<UnitType, number>
  defenderLosses: PartialRecord<UnitType, number>
  // Units destroyed, summed over the battles that side won
  attackerLossesWhenWinning: PartialRecord<UnitType, number>
  defenderLossesWhenWinning: PartialRecord<UnitType, number>
}

export function createEmptyBattleReport(): BattleReport {
  return {
    attacker: 0,
    attackerSurvivers: {},
    draw: 0,
    defender: 0,
    defenderSurvivers: {},
    numberOfRolls: 0,
    attackerLosses: {},
    defenderLosses: {},
    attackerLossesWhenWinning: {},
    defenderLossesWhenWinning: {},
  }
}

function addCounts<K extends string>(
  target: PartialRecord<K, number>,
  source: PartialRecord<K, number>,
) {
  for (const [key, count] of objectEntries(source)) {
    target[key] = (target[key] ?? 0) + count
  }
}

/** Adds the result of one battle to the report. */
export function addBattleResult(data: BattleReport, result: BattleResult) {
  switch (result.winner) {
    case BattleWinner.attacker:
      data.attacker += 1
      addCounts(data.attackerSurvivers, { [result.units]: 1 })
      addCounts(data.attackerLossesWhenWinning, result.losses.attacker)
      break
    case BattleWinner.draw:
      data.draw += 1
      break
    case BattleWinner.defender:
      data.defender += 1
      addCounts(data.defenderSurvivers, { [result.units]: 1 })
      addCounts(data.defenderLossesWhenWinning, result.losses.defender)
      break
  }
  addCounts(data.attackerLosses, result.losses.attacker)
  addCounts(data.defenderLosses, result.losses.defender)
}

/** Adds every count of `part` to `target`. */
export function mergeBattleReports(target: BattleReport, part: BattleReport) {
  target.attacker += part.attacker
  target.draw += part.draw
  target.defender += part.defender
  target.numberOfRolls += part.numberOfRolls
  addCounts(target.attackerSurvivers, part.attackerSurvivers)
  addCounts(target.defenderSurvivers, part.defenderSurvivers)
  addCounts(target.attackerLosses, part.attackerLosses)
  addCounts(target.defenderLosses, part.defenderLosses)
  addCounts(target.attackerLossesWhenWinning, part.attackerLossesWhenWinning)
  addCounts(target.defenderLossesWhenWinning, part.defenderLossesWhenWinning)
}

export function getBattleReport(
  attacker: Participant,
  defender: Participant,
  place: Place,
  times: number,
  addToBattleReport?: BattleReport,
): BattleReport {
  if (attacker.side !== "attacker" || defender.side !== "defender") {
    throw new Error(`side error: ${attacker.side}, ${defender.side}`)
  }

  const battle: Battle = {
    attacker,
    defender,
    place,
  }

  const data: BattleReport = addToBattleReport ?? createEmptyBattleReport()

  const battleInstance = setupBattle(battle)
  _times(times, () => {
    const tmp = _cloneDeep(battleInstance)
    addBattleResult(data, startBattle(tmp))
  })
  data.numberOfRolls += times
  return data
}
