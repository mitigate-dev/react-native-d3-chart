import { type Dataset } from 'react-native-d3-chart'

import { buildSlices } from './helpers/buildSlices'
import { generateTimeSeriesData } from './helpers/generateTimeSeriesData'
import { temperatureData, visits } from './mockData'

export enum Measurement {
  Temperature = 'Temperature',
  Blue = 'Blue',
  Green = 'Green',
  Pink = 'Pink',
  Visits = 'Visits',
  VisitRate = 'Visit Rate',
}
export const measurementsRecords: Record<Measurement, Dataset> = {
  [Measurement.Temperature]: {
    unit: '°C',
    points: temperatureData,
    decimals: 0,
    areaColor: '#c4deff',
    color: {
      type: 'thresholds',
      baseColor: '#3d91ff',
      gradientBlur: 2,
      thresholds: [
        { value: 32, color: '#bb2222' },
        { value: 24, color: '#ffc400' },
        { value: 16, color: '#089851' },
        { value: 10, color: '#9ceeff' },
        { value: 0, color: '#00d5ff' },
      ],
    },
    measurementName: Measurement.Temperature,
  },
  [Measurement.Blue]: {
    unit: 'l',
    points: generateTimeSeriesData({
      startingValue: 160,
      minimum: 50,
      radomFactor: 6,
    }),
    decimals: 0,
    color: '#66e',
    measurementName: Measurement.Blue,
  },
  [Measurement.Green]: {
    unit: 'kg',
    points: generateTimeSeriesData(),
    decimals: 0,
    color: '#6e6',
    measurementName: Measurement.Green,
  },
  [Measurement.Pink]: {
    unit: 'm/s',
    points: generateTimeSeriesData({
      startingValue: 20,
      minimum: 100,
    }),
    decimals: 1,
    color: '#e0e',
    measurementName: Measurement.Pink,
  },

  [Measurement.VisitRate]: {
    unit: 'visits/h',
    points: visits.movingAveregeData,
    slices: buildSlices('horizontal', {
      end: visits.latestTimestamp,
      start: visits.oldestTimestamp,
      yellowThreshold: visits.averageVisitRatePerHour,
      redThreshold: visits.averageVisitRatePerHour * 1.1,
    }),
    decimals: 0,
    color: '#000',
    areaColor: null,
    measurementName: Measurement.VisitRate,
  },
  [Measurement.Visits]: {
    unit: 'pulses',
    points: visits.culmulativeData,
    decimals: 0,
    color: '#000',
    areaColor: null,
    measurementName: 'Visits cumulative',
    slices: buildSlices('axial', {
      end: visits.latestTimestamp,
      start: visits.oldestTimestamp,
      yellowThreshold: visits.averageVisitRatePerHour,
      redThreshold: visits.averageVisitRatePerHour * 1.1,
    }),
  },
}
