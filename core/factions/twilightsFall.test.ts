import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { getAllBattleEffects, isBattleEffectRelevant } from "@/core/battleeffect/battleEffects"
import { createParticipant } from "@/core/battleSetup"
import { TEST_NUMBER_OF_ROLLS } from "@/core/constant"
import { parseUnitStats } from "@/core/unitStats"
import { getTestParticipant, testBattleReport } from "@/util/util.test"

describe("Twilight's Fall Mahact Kings", () => {
  it("Ruby Monarch flagship rolls 2 dice at 5", () => {
    const attacker = getTestParticipant("attacker", { flagship: 1 }, "Ruby Monarch (TF)")
    const defender = getTestParticipant("defender", { dreadnought: 2 })

    testBattleReport(attacker, defender, "space", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.06 },
      { side: "draw", percentage: 0.112 },
      { side: "defender", percentage: 0.828 },
    ])
  })

  it("Radiant Aur flagship has AFB 5x3", () => {
    const attacker = getTestParticipant("attacker", { flagship: 1 }, "Radiant Aur (TF)")
    const defender = getTestParticipant("defender", { fighter: 6 })

    testBattleReport(attacker, defender, "space", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.265 },
      { side: "draw", percentage: 0.049 },
      { side: "defender", percentage: 0.685 },
    ])
  })

  it("Radiant Aur mechs repair with strategy tokens", () => {
    const attacker = getTestParticipant("attacker", { mech: 2 }, "Radiant Aur (TF)", {
      "Starlancer II repair": 3,
    })
    const defender = getTestParticipant("defender", { infantry: 6 })

    testBattleReport(attacker, defender, "ground", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.502 },
      { side: "draw", percentage: 0.015 },
      { side: "defender", percentage: 0.483 },
    ])
  })

  it("Radiant Aur mechs have planetary shield", () => {
    const attacker = getTestParticipant("attacker", { dreadnought: 2, infantry: 2 })
    const defender = getTestParticipant("defender", { mech: 1 }, "Radiant Aur (TF)")

    testBattleReport(attacker, defender, "ground", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.408 },
      { side: "draw", percentage: 0.103 },
      { side: "defender", percentage: 0.49 },
    ])
  })

  it("Saint of Swords mechs give Tizona extra dice", () => {
    const attacker = getTestParticipant(
      "attacker",
      { flagship: 1, mech: 2 },
      "Saint of Swords (TF)",
    )
    const defender = getTestParticipant("defender", { cruiser: 4 })

    testBattleReport(attacker, defender, "space", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.27 },
      { side: "draw", percentage: 0.175 },
      { side: "defender", percentage: 0.555 },
    ])
  })

  it("Il Na Viroset mechs fight in space", () => {
    const attacker = getTestParticipant("attacker", { mech: 2 }, "Il Na Viroset (TF)")
    const defender = getTestParticipant("defender", { cruiser: 2 })

    testBattleReport(attacker, defender, "space", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.95 },
      { side: "draw", percentage: 0.017 },
      { side: "defender", percentage: 0.033 },
    ])
  })

  it("Il Na Viroset mechs get anomaly bonus", () => {
    const attacker = getTestParticipant("attacker", { mech: 2 }, "Il Na Viroset (TF)", {
      "Starlancer XI anomaly bonus": 2,
    })
    const defender = getTestParticipant("defender", { cruiser: 2 })

    testBattleReport(attacker, defender, "space", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.991 },
      { side: "draw", percentage: 0.005 },
      { side: "defender", percentage: 0.004 },
    ])
  })

  it("El Nel Janovet flagship gains AFB from destroyer upgrade", () => {
    const attacker = getTestParticipant(
      "attacker",
      { flagship: 1 },
      "El Nel Janovet (TF)",
      {},
      { destroyer: true },
    )
    const defender = getTestParticipant("defender", { fighter: 6 })

    testBattleReport(attacker, defender, "space", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.351 },
      { side: "draw", percentage: 0.069 },
      { side: "defender", percentage: 0.58 },
    ])
  })

  it("A Sickening Lurch flagship bombards and mechs roll 2 dice at 5", () => {
    const attacker = getTestParticipant(
      "attacker",
      { flagship: 1, mech: 2 },
      "A Sickening Lurch (TF)",
    )
    const defender = getTestParticipant("defender", { mech: 3 })

    testBattleReport(attacker, defender, "ground", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.528 },
      { side: "draw", percentage: 0.154 },
      { side: "defender", percentage: 0.317 },
    ])
  })

  it("A Sickening Lurch mechs reroll with captured infantry", () => {
    const attacker = getTestParticipant("attacker", { mech: 2 }, "A Sickening Lurch (TF)", {
      "Bone Picked Clean reroll": 3,
    })
    const defender = getTestParticipant("defender", { mech: 3 })

    testBattleReport(attacker, defender, "ground", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.573 },
      { side: "draw", percentage: 0.184 },
      { side: "defender", percentage: 0.243 },
    ])
  })
})

describe("Twilight's Fall abilities", () => {
  const effect = (name: string) => getAllBattleEffects().find((e) => e.name === name)!

  it("only the kings get the Twilight's Fall abilities", () => {
    const king = getTestParticipant("attacker", {}, "Ruby Monarch (TF)")
    const sol = getTestParticipant("attacker", {}, "Sol")
    assert.equal(isBattleEffectRelevant(effect("Unrelenting (TF)"), king), true)
    assert.equal(isBattleEffectRelevant(effect("Unrelenting (TF)"), sol), false)
  })

  it("kings can use spliced faction abilities of any faction", () => {
    const king = getTestParticipant("attacker", {}, "Saint of Swords (TF)")
    const sol = getTestParticipant("attacker", {}, "Sol")
    assert.equal(isBattleEffectRelevant(effect("Munitions Reserves"), king), true)
    assert.equal(isBattleEffectRelevant(effect("Devotion"), king), true)
    assert.equal(isBattleEffectRelevant(effect("Munitions Reserves"), sol), false)
    // the Mentak hero is a paradigm in Twilight's Fall, not a spliceable ability
    assert.equal(isBattleEffectRelevant(effect("Mentak hero"), king), false)
  })

  it("Unrelenting applies +1 to every combat roll", () => {
    const attacker = getTestParticipant("attacker", { cruiser: 2 }, "Ruby Monarch (TF)", {
      "Unrelenting (TF)": 1,
    })
    const defender = getTestParticipant("defender", { cruiser: 2 })

    testBattleReport(attacker, defender, "space", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.541 },
      { side: "draw", percentage: 0.133 },
      { side: "defender", percentage: 0.326 },
    ])
  })

  it("Supercharge applies +2 to one unit each round", () => {
    const attacker = getTestParticipant("attacker", { dreadnought: 1 }, "Ruby Monarch (TF)", {
      "Supercharge (TF)": 1,
    })
    const defender = getTestParticipant("defender", { dreadnought: 1 })

    testBattleReport(attacker, defender, "space", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.515 },
      { side: "draw", percentage: 0.319 },
      { side: "defender", percentage: 0.165 },
    ])
  })

  it("Ambush shoots with up to 2 cruisers or destroyers before combat", () => {
    const attacker = getTestParticipant("attacker", { destroyer: 2 }, "Ruby Monarch (TF)", {
      "Ambush (TF)": 1,
    })
    const defender = getTestParticipant("defender", { destroyer: 2 })

    testBattleReport(attacker, defender, "space", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.621 },
      { side: "draw", percentage: 0.036 },
      { side: "defender", percentage: 0.343 },
    ])
  })

  it("Harrow bombards after each round of ground combat", () => {
    const attacker = getTestParticipant(
      "attacker",
      { dreadnought: 1, infantry: 2 },
      "Ruby Monarch (TF)",
      { "Harrow (TF)": 1 },
    )
    const defender = getTestParticipant("defender", { infantry: 3 })

    testBattleReport(attacker, defender, "ground", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.624 },
      { side: "draw", percentage: 0.115 },
      { side: "defender", percentage: 0.262 },
    ])
  })

  it("Raid Formation damages sustain ships with excess AFB hits", () => {
    const attacker = getTestParticipant("attacker", { destroyer: 3 }, "Ruby Monarch (TF)", {
      "Raid Formation (TF)": 1,
    })
    const defender = getTestParticipant("defender", { dreadnought: 1 })

    testBattleReport(attacker, defender, "space", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.744 },
      { side: "draw", percentage: 0.042 },
      { side: "defender", percentage: 0.214 },
    ])
  })

  it("a king can use spliced Munitions Reserves", () => {
    const attacker = getTestParticipant("attacker", { dreadnought: 2 }, "Ruby Monarch (TF)", {
      "Munitions Reserves": 3,
    })
    const defender = getTestParticipant("defender", { dreadnought: 2 })

    testBattleReport(attacker, defender, "space", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.718 },
      { side: "draw", percentage: 0.152 },
      { side: "defender", percentage: 0.13 },
    ])
  })
})

describe("Custom unit stats", () => {
  it("parses the stats string", () => {
    const stats = parseUnitStats("c4x1.b4x2.sd.dh")!
    assert.equal(stats.combat!.hit, 4)
    assert.equal(stats.combat!.count, 1)
    assert.equal(stats.bombardment!.hit, 4)
    assert.equal(stats.bombardment!.count, 2)
    assert.equal(stats.afb, undefined)
    assert.equal(stats.sustainDamage, true)
    assert.equal(stats.immuneToDirectHit, true)
    assert.equal(stats.planetaryShield, false)
    assert.equal(parseUnitStats("c11x1"), undefined)
    assert.equal(parseUnitStats("nonsense"), undefined)
    assert.equal(parseUnitStats(""), undefined)
  })

  it("reads the stats from the query", () => {
    const attacker = createParticipant("attacker", undefined, {
      "attacker-faction": "Ruby Monarch (TF)",
      "attacker-unit-dreadnought": "1",
      "attacker-stats-dreadnought": "c4x1.b4x2.sd",
      "attacker-stats-cruiser": "bad",
      "defender-stats-carrier": "c9x1",
    })
    assert.deepEqual(attacker.unitStats, { dreadnought: "c4x1.b4x2.sd" })
  })

  it("non-kings do not get Twilight's Fall abilities, even from a link", () => {
    const attacker = getTestParticipant("attacker", { cruiser: 2 }, "Sol", {
      "Unrelenting (TF)": 1,
    })
    const defender = getTestParticipant("defender", { cruiser: 2 })

    testBattleReport(attacker, defender, "space", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.443 },
      { side: "draw", percentage: 0.115 },
      { side: "defender", percentage: 0.442 },
    ])
  })

  it("stats replace the printed values of the unit", () => {
    // 2 cruisers that roll like dreadnoughts with sustain damage are just dreadnoughts
    const attacker = getTestParticipant("attacker", { cruiser: 2 }, "Ruby Monarch (TF)")
    attacker.unitStats = { cruiser: "c5x1.sd" }
    const defender = getTestParticipant("defender", { dreadnought: 2 })

    testBattleReport(attacker, defender, "space", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.438 },
      { side: "draw", percentage: 0.123 },
      { side: "defender", percentage: 0.439 },
    ])
  })

  it("stats take the place of the unit upgrade and still get bonuses", () => {
    const attacker = getTestParticipant(
      "attacker",
      { destroyer: 2 },
      "Ruby Monarch (TF)",
      { "Unrelenting (TF)": 1 },
      { destroyer: true },
    )
    attacker.unitStats = { destroyer: "c8x1.a6x3" }
    const defender = getTestParticipant("defender", { cruiser: 2 })

    testBattleReport(attacker, defender, "space", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.443 },
      { side: "draw", percentage: 0.115 },
      { side: "defender", percentage: 0.443 },
    ])
  })
})
