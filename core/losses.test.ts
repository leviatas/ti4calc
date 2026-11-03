import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { getBattleReport } from "@/core"
import { getTestParticipant } from "@/util/util.test"

const ROLLS = 5_000

describe("Expected losses", () => {
  it("the loser loses every unit that fought, the winner what it lost on the way", () => {
    const attacker = getTestParticipant("attacker", { cruiser: 2 })
    const defender = getTestParticipant("defender", { cruiser: 2 })
    const report = getBattleReport(attacker, defender, "space", ROLLS)

    // every battle is lost by one side (all its 2 cruisers) or is a draw (both sides lose 2)
    assert.equal(
      report.defenderLosses.cruiser,
      2 * report.attacker + 2 * report.draw + (report.defenderLossesWhenWinning.cruiser ?? 0),
    )
    assert.equal(
      report.attackerLosses.cruiser,
      2 * report.defender + 2 * report.draw + (report.attackerLossesWhenWinning.cruiser ?? 0),
    )
    // a winner keeps at least one of its two cruisers
    assert.ok((report.attackerLossesWhenWinning.cruiser ?? 0) <= report.attacker)
  })

  it("a sure win loses only what the opponent could hit", () => {
    const attacker = getTestParticipant("attacker", { warsun: 2 })
    const defender = getTestParticipant("defender", { fighter: 1 })
    const report = getBattleReport(attacker, defender, "space", ROLLS)

    assert.equal(report.attacker, ROLLS)
    assert.equal(report.defenderLosses.fighter, ROLLS)
    // one fighter can not destroy a war sun with sustain damage
    assert.equal(report.attackerLosses.warsun, undefined)
  })

  it("units that do not fight are not counted as lost", () => {
    // ground forces in a space battle do not take part in it
    const attacker = getTestParticipant("attacker", { dreadnought: 3, infantry: 4 })
    const defender = getTestParticipant("defender", { fighter: 1 })
    const report = getBattleReport(attacker, defender, "space", ROLLS)

    assert.equal(report.attackerLosses.infantry, undefined)
  })
})
