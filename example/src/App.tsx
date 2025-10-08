import React, { useMemo, useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Text, Switch } from 'react-native'

import Chart, { ChartProps, Dataset } from 'react-native-d3-chart'

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

// Generate data points every minute from a month ago to now
const generateDataPoints = ({
  startingValue = 400,
  minimum = 0,
  maximum = 3000,
  radomFactor = 20,
} = {}) => {
  const points = []
  const now = Date.now()
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000 // 30 days ago
  let value = startingValue

  for (let timestamp = monthAgo; timestamp <= now; timestamp += 60 * 1000) {
    const randomVariation = (Math.random() - 0.5) * radomFactor
    value += randomVariation

    // either randomVariation was negative and value went below minimum
    // or     randomVariation was positive and value went above maximum
    if (value < minimum || value > maximum) {
      // invert direction to keep within bounds
      value -= 2 * randomVariation
    }

    points.push({ timestamp, value })
  }

  return points
}

enum Measurement {
  Temperature = 'Temperature',
  Blue = 'Blue',
  Green = 'Green',
  Pink = 'Pink',
}
const measurementKeys = Object.values(Measurement)
const measurementsRecords: Record<Measurement, Dataset> = {
  [Measurement.Temperature]: {
    unit: '°C',
    points: generateDataPoints({
      maximum: 40,
      minimum: -10,
      radomFactor: 1,
      startingValue: -8,
    }),
    decimals: 0,
    areaColor: '#83cba8',
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
    points: generateDataPoints({
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
    points: generateDataPoints(),
    decimals: 0,
    color: '#6e6',
    measurementName: Measurement.Green,
  },
  [Measurement.Pink]: {
    unit: 'm/s',
    points: generateDataPoints({
      startingValue: 20,
      minimum: 100,
    }),
    decimals: 1,
    color: '#e0e',
    measurementName: Measurement.Pink,
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

  const datasets = useMemo<Dataset[]>(
    () => enabledMeasurements.map((m) => measurementsRecords[m]),
    [enabledMeasurements]
  )

  return (
    <View
      style={styles.holder}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <Chart
        zoomEnabled
        width={width}
        height={height}
        datasets={datasets}
        colors={chartColors}
        timeDomain={timeDomain}
        marginHorizontal={PADDING}
        noDataString="No data available"
      />
      <View style={styles.spacer} />
      <View style={styles.timeDomainRow}>
        {TIME_DOMAIN_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.timeDomainItem,
              type === timeDomainType && styles.timeDomainItemActive,
            ]}
            onPress={() => setTimeDomainType(type)}
          >
            <Text style={styles.timeDomainItemText}>{type}</Text>
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
    paddingVertical: PADDING,
    backgroundColor: '#fff',
  },
  spacer: {
    height: 10,
  },
  timeDomainRow: {
    flexDirection: 'row',
    paddingHorizontal: PADDING,
  },
  timeDomainItem: {
    flex: 1,
    borderRadius: 11,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeDomainItemActive: {
    backgroundColor: '#b22',
  },
  timeDomainItemText: {
    fontSize: 13,
  },
  switchContainer: {
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: { marginLeft: 10 },
})
