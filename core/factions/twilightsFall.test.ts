import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { getAllBattleEffects, isBattleEffectRelevant } from "@/core/battleeffect/battleEffects"
import { createParticipant } from "@/core/battleSetup"
import { TEST_NUMBER_OF_ROLLS } from "@/core/constant"
import { cleanUnitName, describeUnitStats, parseUnitStats } from "@/core/unitStats"
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

describe("Twilight's Fall spliced mechs and flagships", () => {
  it("Echo of Ascension makes the king's flagship roll one more die, one better", () => {
    const attacker = getTestParticipant("attacker", { flagship: 1 }, "Ruby Monarch (TF)", {
      "Echo of Ascension (TF)": 1,
    })
    const defender = getTestParticipant("defender", { dreadnought: 2 })

    testBattleReport(attacker, defender, "space", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.21 },
      { side: "draw", percentage: 0.312 },
      { side: "defender", percentage: 0.479 },
    ])
  })

  it("Eidolon Landwaster and Eidolon Terminus stack on the king's mech", () => {
    const attacker = getTestParticipant("attacker", { mech: 2 }, "Ruby Monarch (TF)", {
      "Eidolon Landwaster (TF)": 1,
      "Eidolon Terminus (TF)": 1,
    })
    const defender = getTestParticipant("defender", { mech: 2 })

    testBattleReport(attacker, defender, "ground", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.933 },
      { side: "draw", percentage: 0.045 },
      { side: "defender", percentage: 0.022 },
    ])
  })

  it("Eidolon Landwaster alone adds a die to the king's mech", () => {
    const attacker = getTestParticipant("attacker", { mech: 2 }, "Ruby Monarch (TF)", {
      "Eidolon Landwaster (TF)": 1,
    })
    const defender = getTestParticipant("defender", { mech: 2 })

    testBattleReport(attacker, defender, "ground", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.867 },
      { side: "draw", percentage: 0.068 },
      { side: "defender", percentage: 0.065 },
    ])
  })
})

describe("Twilight's Fall kings' own units", () => {
  it("a king's flagship keeps the bonuses of its abilities", () => {
    const attacker = getTestParticipant("attacker", { flagship: 1 }, "Ruby Monarch (TF)", {
      "Unrelenting (TF)": 1,
    })
    const defender = getTestParticipant("defender", { dreadnought: 2 })

    testBattleReport(attacker, defender, "space", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.086 },
      { side: "draw", percentage: 0.169 },
      { side: "defender", percentage: 0.746 },
    ])
  })

  it("stats for a king's flagship set its rolls and keep its bonuses", () => {
    // A Sickening Lurch's flagship printed like Ruby Monarch's: same result as the test above
    const attacker = getTestParticipant("attacker", { flagship: 1 }, "A Sickening Lurch (TF)", {
      "Unrelenting (TF)": 1,
    })
    attacker.unitStats = { flagship: "c5x2.sd" }
    const defender = getTestParticipant("defender", { dreadnought: 2 })

    testBattleReport(attacker, defender, "space", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.086 },
      { side: "draw", percentage: 0.169 },
      { side: "defender", percentage: 0.746 },
    ])
  })

  it("stats for a king's mech set its rolls and keep its abilities", () => {
    // Radiant Aur's mechs keep their planetary shield: same as Eidolon Terminus (6 -> 5)
    const attacker = getTestParticipant("attacker", { dreadnought: 2, infantry: 4 })
    const defender = getTestParticipant("defender", { mech: 2 }, "Radiant Aur (TF)")
    defender.unitStats = { mech: "c5x1.sd" }

    testBattleReport(attacker, defender, "ground", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.287 },
      { side: "draw", percentage: 0.05 },
      { side: "defender", percentage: 0.663 },
    ])
  })

  it("a king's mech without planetary shield is bombarded", () => {
    const attacker = getTestParticipant("attacker", { dreadnought: 2, infantry: 4 })
    const defender = getTestParticipant("defender", { mech: 2 }, "Ruby Monarch (TF)")
    defender.unitStats = { mech: "c5x1.sd" }

    testBattleReport(attacker, defender, "ground", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.59 },
      { side: "draw", percentage: 0.049 },
      { side: "defender", percentage: 0.36 },
    ])
  })
})

describe("Twilight's Fall abilities that depend on the map", () => {
  it("Planesplitter applies +2 to every combat roll", () => {
    const attacker = getTestParticipant("attacker", { cruiser: 2 }, "Ruby Monarch (TF)", {
      "Planesplitter (TF)": 1,
    })
    const defender = getTestParticipant("defender", { cruiser: 2 })

    testBattleReport(attacker, defender, "space", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.623 },
      { side: "draw", percentage: 0.149 },
      { side: "defender", percentage: 0.227 },
    ])
  })

  it("Smothering Presence takes sustain damage from the opponent", () => {
    // same as 3 cruisers against 2 dreadnoughts printed without sustain damage
    const attacker = getTestParticipant("attacker", { cruiser: 3 }, "Ruby Monarch (TF)", {
      "Smothering Presence (TF)": 1,
    })
    const defender = getTestParticipant("defender", { dreadnought: 2 })

    testBattleReport(attacker, defender, "space", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.666 },
      { side: "draw", percentage: 0.087 },
      { side: "defender", percentage: 0.248 },
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
    assert.equal(stats.assignHitsToNonFighters, false)
    assert.equal(parseUnitStats("s5x1.ps.nf")!.assignHitsToNonFighters, true)
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

  it("describes the stats in words", () => {
    assert.equal(
      describeUnitStats("c4x1.b4x2.sd.dh"),
      "Combat 4, Bombardment 4 (x2), Sustain damage, Immune to Direct Hit",
    )
    assert.equal(describeUnitStats("c8x1.a6x3"), "Combat 8, Anti-fighter barrage 6 (x3)")
    assert.equal(
      describeUnitStats("s5x1.ps.nf"),
      "Space cannon 5, Planetary shield, Hits to non-fighter ships if able",
    )
    assert.equal(describeUnitStats("bad"), undefined)
  })

  it("reads the unit card names from the query and cleans them", () => {
    const attacker = createParticipant("attacker", undefined, {
      "attacker-faction": "Ruby Monarch (TF)",
      "attacker-stats-dreadnought": "c4x1.b4x2.sd",
      "attacker-unitname-dreadnought": "Exotrireme",
      "attacker-unitname-cruiser": "<script>Corsair</script>",
      "attacker-unitname-carrier": "<>",
      "defender-unitname-mech": "Eidolon Terminus",
    })
    assert.deepEqual(attacker.unitNames, {
      dreadnought: "Exotrireme",
      cruiser: "scriptCorsairscript",
    })
    assert.equal(cleanUnitName("Super-Dreadnought (TF)"), "Super-Dreadnought (TF)")
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

  it("space cannon hits from nf stats go to non-fighter ships", () => {
    // Justicer Rail always hitting: the damaged dreadnought dies instead of the fighter
    const attacker = getTestParticipant(
      "attacker",
      { dreadnought: 1, fighter: 1 },
      undefined,
      {},
      {},
      { dreadnought: 1 },
    )
    const defender = getTestParticipant("defender", { pds: 1, destroyer: 1 }, "El Nel Janovet (TF)")
    defender.unitStats = { pds: "s1x1.ps.nf" }

    testBattleReport(attacker, defender, "space", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.284 },
      { side: "draw", percentage: 0.071 },
      { side: "defender", percentage: 0.645 },
    ])
  })

  it("space cannon hits without nf stats may go to fighters", () => {
    // the same battle without nf: the fighter dies and the dreadnought fights on
    const attacker = getTestParticipant(
      "attacker",
      { dreadnought: 1, fighter: 1 },
      undefined,
      {},
      {},
      { dreadnought: 1 },
    )
    const defender = getTestParticipant("defender", { pds: 1, destroyer: 1 }, "El Nel Janovet (TF)")
    defender.unitStats = { pds: "s1x1.ps" }

    testBattleReport(attacker, defender, "space", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.706 },
      { side: "draw", percentage: 0.176 },
      { side: "defender", percentage: 0.118 },
    ])
  })

  it("space cannon hits from nf stats go to fighters when only fighters are left", () => {
    // nothing but fighters to hit: same as without nf
    const attacker = getTestParticipant("attacker", { fighter: 3 })
    const defender = getTestParticipant("defender", { pds: 1, destroyer: 1 }, "El Nel Janovet (TF)")
    defender.unitStats = { pds: "s1x1.ps.nf" }

    testBattleReport(attacker, defender, "space", TEST_NUMBER_OF_ROLLS, [
      { side: "attacker", percentage: 0.69 },
      { side: "draw", percentage: 0.054 },
      { side: "defender", percentage: 0.256 },
    ])
  })
})
