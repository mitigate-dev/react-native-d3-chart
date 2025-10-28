import type { Point } from 'react-native-d3-chart'

import { generateRandomPulses } from './helpers/generateRandomPulses'
import { generateTimeSeriesData } from './helpers/generateTimeSeriesData'

export const temperatureData = generateTimeSeriesData({
  maximum: 40,
  minimum: -10,
  radomFactor: 1,
  startingValue: -8,
})

const averageVisitRatePerHour = 120
const pulsePoints = generateRandomPulses({
  maxAgeDays: 60,
  burstFactor: 10,
  burstProbability: 0.05,
  averageRatePerHour: averageVisitRatePerHour,
})

export const visits = {
  averageVisitRatePerHour,
  oldestTimestamp: pulsePoints[0]?.timestamp ?? 0,
  latestTimestamp: pulsePoints[pulsePoints.length - 1]?.timestamp ?? 0,
  movingAveregeData: pulsePoints.map(({ timestamp }, index, array) => {
    const slice = [...array.slice(Math.max(0, index - 60 + 1), index + 1)] // this and previous 59 minutes
    const hourSum = slice.reduce((sum, point) => sum + (point.value || 0), 0)

    return {
      timestamp,
      value: hourSum,
    }
  }),
  culmulativeData: pulsePoints.reduce(
    ({ array, sum }, { timestamp, value }) => {
      const newSum = sum + (value || 0)
      array.push({ timestamp, value: newSum })
      return {
        array,
        sum: newSum,
      }
    },
    { array: [] as Point[], sum: 0 }
  ).array,
}
