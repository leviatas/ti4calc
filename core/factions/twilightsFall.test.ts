import { describe, it } from "node:test"

import { TEST_NUMBER_OF_ROLLS } from "@/core/constant"
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
