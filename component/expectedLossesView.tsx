import React from "react"

import { BattleReport } from "@/core"
import { Side } from "@/core/battle-types"
import { UnitType } from "@/core/unit"
import { objectEntries } from "@/util/util-object"
import { PartialRecord } from "@/util/util-types"

// Printed costs of the base units. Fighters and infantry come two for 1.
const UNIT_COST: PartialRecord<UnitType, number> = {
  flagship: 8,
  warsun: 12,
  dreadnought: 4,
  carrier: 3,
  cruiser: 2,
  destroyer: 1,
  fighter: 0.5,
  mech: 2,
  infantry: 0.5,
}

const UNIT_ORDER: UnitType[] = [
  UnitType.flagship,
  UnitType.warsun,
  UnitType.dreadnought,
  UnitType.carrier,
  UnitType.cruiser,
  UnitType.destroyer,
  UnitType.fighter,
  UnitType.mech,
  UnitType.infantry,
  UnitType.pds,
]

const formatNumber = (n: number) => (Math.round(n * 10) / 10).toLocaleString("en-US")

function average(losses: PartialRecord<UnitType, number>, battles: number) {
  const perType = UNIT_ORDER.map((type) => ({
    type,
    count: battles > 0 ? (losses[type] ?? 0) / battles : 0,
  })).filter(({ count }) => count >= 0.05)
  let units = 0
  let resources = 0
  for (const [type, total] of objectEntries(losses)) {
    const count = battles > 0 ? total / battles : 0
    units += count
    resources += count * (UNIT_COST[type] ?? 0)
  }
  return { perType, units, resources }
}

function LossLine({ units, resources }: { units: number; resources: number }) {
  return (
    <span>
      <b>{formatNumber(units)}</b> {units === 1 ? "unit" : "units"}
      {resources > 0 && <> (≈ {formatNumber(resources)} resources)</>}
    </span>
  )
}

function SideLosses({ report, side }: { report: BattleReport; side: Side }) {
  const total = report.attacker + report.defender + report.draw
  const wins = side === "attacker" ? report.attacker : report.defender
  const all = average(side === "attacker" ? report.attackerLosses : report.defenderLosses, total)
  const whenWinning = average(
    side === "attacker" ? report.attackerLossesWhenWinning : report.defenderLossesWhenWinning,
    wins,
  )
  const name = side === "attacker" ? "Attacker" : "Defender"

  return (
    <div
      style={{
        flex: "1 1 220px",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <h4 style={{ margin: 0 }}>{name}</h4>
      <div>
        Loses on average <LossLine units={all.units} resources={all.resources} />
      </div>
      {all.perType.length > 0 && (
        <div style={{ fontSize: "13px" }}>
          {all.perType.map(({ type, count }) => `${formatNumber(count)} ${type}`).join(", ")}
        </div>
      )}
      {wins > 0 && (
        <div>
          When the {side} wins:{" "}
          <LossLine units={whenWinning.units} resources={whenWinning.resources} />
        </div>
      )}
    </div>
  )
}

/**
 * How many units each side can expect to lose: over every simulated battle, and over the
 * battles that side wins, so a likely but costly win shows as such.
 */
export function ExpectedLossesView({ report }: { report: BattleReport }) {
  const total = report.attacker + report.defender + report.draw
  if (total === 0) {
    return null
  }
  return (
    <div style={{ background: "white", padding: "10px", borderTop: "1px solid #ddd" }}>
      <h3 style={{ marginTop: 0, marginBottom: "8px" }}>Expected losses</h3>
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <SideLosses report={report} side="attacker" />
        <SideLosses report={report} side="defender" />
      </div>
      <div style={{ marginTop: "8px", fontSize: "12px", opacity: 0.75 }}>
        Units that take part in the combat and are destroyed, averaged over every simulated battle.
        Resources use the printed cost of the base units.
      </div>
    </div>
  )
}
