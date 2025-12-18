import React, { useMemo, useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Text, Switch } from 'react-native'

import Chart, {
  type Dataset,
  type ChartProps,
  type ErrorSegment,
} from 'react-native-d3-chart'

import { buildSlices } from './helpers/buildSlices'
import { generateTimeSeriesData } from './helpers/generateTimeSeriesData'
import { temperatureData, visits } from './mockData'

type TimeDomainType = 'hour' | 'day' | 'week' | 'month'

const TIME_DOMAIN_TYPES: TimeDomainType[] = ['hour', 'day', 'week', 'month']

const chartColors: ChartProps['colors'] = {
  background: '#fff',
  highlightLine: '#000',
  border: '#555',
  cursorStroke: '#0ff',
  highlightLabel: '#000',
  highlightTime: '#444',
}

enum Measurement {
  Temperature = 'Temperature',
  Blue = 'Blue',
  Green = 'Green',
  Pink = 'Pink',
  Visits = 'Visits',
  VisitRate = 'Visit Rate',
}

const measurementKeys = Object.values(Measurement)
const measurementsRecords: Record<Measurement, Dataset> = {
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

export default function App() {
  const [width, setWidth] = useState<number>(0)
  const height = width * 1.1
  const [timeDomainType, setTimeDomainType] = useState<TimeDomainType>('hour')
  const timeDomain = useMemo(() => {
    const now = new Date().valueOf()
    let hours = 1
    if (timeDomainType !== 'hour') {
      hours *= 24

      if (timeDomainType === 'week') {
        hours *= 7
      }

      if (timeDomainType === 'month') {
        hours *= 30
      }
    }

    const start = now - hours * 60 * 60 * 1000
    const end = now

    return { start, end, type: timeDomainType }
  }, [timeDomainType])

  const [enabledMeasurements, setEnabledMeasurements] = useState<Measurement[]>(
    [Measurement.Temperature]
  )

  const errorSegments = useMemo<ErrorSegment[]>(() => {
    const now = Date.now()
    return [
      {
        message: 'Unknown error',
        messageColor: '#f0f',
        start: now - 50 * 60 * 1000,
        end: now - 40 * 60 * 1000,
      },
      {
        message: 'No data yet',
        messageColor: '#b22',
        start: now - 2 * 60 * 1000,
        end: now + 15 * 60 * 1000,
      },
    ]
  }, [])

  const datasets = useMemo<Dataset[]>(
    () =>
      enabledMeasurements.map((enabledMeasurement, index) => {
        const data = measurementsRecords[enabledMeasurement]
        if (index !== 0) return data

        const firstErrorSegment = errorSegments[0]
        if (!firstErrorSegment) return data

        // invalidate points within first error segment for the first measurement for demo purposes
        return {
          ...data,
          decimalSeparator: ',',
          decimals: 2,
          points: data.points.map((point) => ({
            timestamp: point.timestamp,
            value:
              point.timestamp - 60 * 1000 > firstErrorSegment.start &&
              point.timestamp + 60 * 1000 < firstErrorSegment.end
                ? null
                : point.value,
          })),
        }
      }),
    [enabledMeasurements, errorSegments]
  )

  return (
    <View
      style={styles.holder}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <View style={styles.optionsRow}>
        {(['top', 'tooltip', 'none'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.optionsItem,
              type === highlightValuePosition &&
                styles.highlightPositionItemActive,
            ]}
            onPress={() => setHighlightValuePosition(type)}
          >
            <Text style={styles.optionsItemText}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Chart
        zoomEnabled
        width={width}
        height={height}
        datasets={datasets}
        colors={chartColors}
        timeDomain={timeDomain}
        marginHorizontal={PADDING}
        errorSegments={errorSegments}
        noDataString="No data available"
        highlightValuePosition={highlightValuePosition}
        xDividerConfig={{ type: 'segment', color: '#F2F2FF' }}
        onHighlightChanged={setCurrentHighlight}
      />
      <View style={styles.spacer} />
      <View style={styles.optionsRow}>
        {TIME_DOMAIN_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.optionsItem,
              type === timeDomainType && styles.timeDomainItemActive,
            ]}
            onPress={() => setTimeDomainType(type)}
          >
            <Text style={styles.optionsItemText}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Measurement toggles */}
      {measurementKeys.map((measurement) => (
        <View key={measurement} style={styles.switchContainer}>
          <Switch
            value={enabledMeasurements.includes(measurement)}
            onValueChange={() =>
              setEnabledMeasurements((prev) => {
                if (!prev.includes(measurement))
                  // enable
                  return prev.concat(measurement)

                if (prev.length !== 1)
                  // disable
                  return prev.filter((m) => m !== measurement)

                // only one measurement was enabled, switch to next one
                const currentIndex = measurementKeys.findIndex(
                  (m) => m === measurement
                )
                const nextIndex = (currentIndex + 1) % measurementKeys.length
                const nextMeasurement = measurementKeys[nextIndex]!

                return [nextMeasurement]
              })
            }
          />
          <Text style={styles.switchLabel}>{measurement}</Text>
        </View>
      ))}
    </View>
  )
}

const PADDING = 20
const styles = StyleSheet.create({
  holder: {
    width: '100%',
    flex: 1,
    borderRadius: 10,
    paddingTop: 30,
    paddingBottom: PADDING,
    backgroundColor: '#fff',
  },
  spacer: {
    height: 10,
  },
  highlightContainer: {
    right: 20,
    bottom: 40,
    opacity: 0.9,
    position: 'absolute',
    backgroundColor: '#dfe',
  },
  optionsRow: {
    flexDirection: 'row',
    paddingHorizontal: PADDING,
    marginVertical: 10,
  },
  optionsItem: {
    flex: 1,
    borderRadius: 11,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsItemText: {
    fontSize: 13,
  },
  timeDomainItemActive: {
    backgroundColor: '#b22',
  },
  highlightPositionItemActive: {
    backgroundColor: '#2b2',
  },
  switchContainer: {
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: { marginLeft: 10 },
})
