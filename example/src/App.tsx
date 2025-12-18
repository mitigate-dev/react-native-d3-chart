import React, { useMemo, useState } from 'react'
import { View, StyleSheet, TouchableOpacity, Text, Switch } from 'react-native'

import Chart, {
  type Dataset,
  type ChartProps,
  type ErrorSegment,
} from 'react-native-d3-chart'

import { measurementsRecords, Measurement } from './data'
import type { HighlightPayload } from '../../src/types'

type TimeDomainType = 'hour' | 'day' | 'week' | 'month'

const TIME_DOMAIN_TYPES: TimeDomainType[] = ['hour', 'day', 'week', 'month']
const MEASUREMENT_KEYS = Object.values(Measurement)

const chartColors: ChartProps['colors'] = {
  background: '#fff',
  highlightLine: '#000',
  border: '#555',
  cursorStroke: '#0ff',
  highlightLabel: '#000',
  highlightTime: '#444',
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

  const [highlightValuePosition, setHighlightValuePosition] = useState<
    'top' | 'tooltip' | 'none'
  >('tooltip')

  const [currentHighlight, setCurrentHighlight] = useState<HighlightPayload>()

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

  const xDividerConfig = useMemo<ChartProps['xDividerConfig']>(
    () => ({ type: 'segment', color: '#F2F2FF' }),
    []
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
        xDividerConfig={xDividerConfig}
        noDataString="No data available"
        highlightValuePosition={highlightValuePosition}
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
      <View style={styles.highlightContainer}>
        <Text>Highlight listener:</Text>
        <Text>
          Exact timestamp:
          {currentHighlight?.timestamp &&
            new Date(currentHighlight.timestamp).toTimeString()}
        </Text>
        {currentHighlight?.values.map((value, index) => (
          <Text key={index} style={{ color: value?.color || '#000' }}>
            {`${value?.measurementName}: ${value?.errorMessage ?? value?.value}`}
          </Text>
        ))}
      </View>
      {/* Measurement toggles */}
      {MEASUREMENT_KEYS.map((measurement) => (
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
                const currentIndex = MEASUREMENT_KEYS.findIndex(
                  (m) => m === measurement
                )
                const nextIndex = (currentIndex + 1) % MEASUREMENT_KEYS.length
                const nextMeasurement = MEASUREMENT_KEYS[nextIndex]!

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
