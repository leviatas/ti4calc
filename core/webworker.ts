import _cloneDeep from "lodash/cloneDeep"
import _times from "lodash/times"

import { addBattleResult, BattleReport, createEmptyBattleReport, mergeBattleReports } from "@/core"
import { Battle, BattleInstance } from "@/core/battle-types"
import { setupBattle, startBattle } from "@/core/battleSetup"
import {
  NUMBER_OF_ROLLS,
  ROLLS_BETWEEN_UI_UPDATE,
  ROLLS_WHEN_BUILDING_TEST_DATA,
} from "@/core/constant"
import { ErrorReportUnsaved } from "@/server/errorReportController"

//! To avoid isolatedModules error
export default {}

const MIN_TIME_BETWEEN_SENDING_UPDATES = 250

self.addEventListener("message", (e) => {
  const battle = e.data as Battle

  try {
    doWork(battle)
  } catch (e) {
    reportError(battle, e)
  }
})

function doWork(battle: Battle) {
  const battleInstance = setupBattle(battle)

  const finalData: BattleReport = createEmptyBattleReport()

  const parts = Math.ceil(NUMBER_OF_ROLLS / ROLLS_BETWEEN_UI_UPDATE)
  const partRolls = Math.ceil(NUMBER_OF_ROLLS / parts)

  let lastMessageTime = 0
  _times(parts, (index) => {
    const partialData = getPartialReport(battleInstance, partRolls)
    mergeBattleReports(finalData, partialData)
    const currentTime = new Date().getTime()
    const lastIteration = parts === index
    if (lastIteration || currentTime > lastMessageTime + MIN_TIME_BETWEEN_SENDING_UPDATES) {
      lastMessageTime = currentTime
      self.postMessage(finalData)
    }
  })

  if (NUMBER_OF_ROLLS === ROLLS_WHEN_BUILDING_TEST_DATA) {
    // oxlint-disable-next-line no-console
    console.log(JSON.stringify(finalData))
  }
}

function getPartialReport(battleInstance: BattleInstance, times: number) {
  const data = createEmptyBattleReport()
  _times(times, () => {
    const tmp = _cloneDeep(battleInstance)
    addBattleResult(data, startBattle(tmp))
  })
  data.numberOfRolls += times
  return data
}

function reportError(battle: Battle, e: any) {
  let workerError: ErrorReportUnsaved
  if (e instanceof Error) {
    workerError = {
      error: true,
      message: e.message,
      stack: e.stack ?? "",
      battle,
    }
  } else {
    workerError = {
      error: true,
      message: "unknown error",
      stack: "",
      battle,
    }
  }

  self.postMessage(workerError)
}
