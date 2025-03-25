import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Chart, { ChartProps, Dataset } from '../../src/index';

type TimeDomainType = 'hour' | 'day' | 'week' | 'month';

const TIME_DOMAIN_TYPES: TimeDomainType[] = ['hour', 'day', 'week', 'month'];

const chartColors: ChartProps['colors'] = {
  background: '#fff',
  highlightLine: '#000',
  border: '#555',
  cursorStroke: '#0ff',
  highlightLabel: '#000',
  highlightTime: '#ff0',
};

const datasets: Dataset[] = [
  {
    unit: 'units',
    points: [],
    decimals: 0,
    color: '#e66',
    measurementName: 'Red',
  },
];

export default function App() {
  const [width, setWidth] = useState<number>(0);
  const height = width * 0.8;
  const [timeDomainType, setTimeDomainType] = useState<TimeDomainType>('hour');
  const timeDomain = useMemo(() => {
    const now = new Date().valueOf();
    var hours = 1;
    if (timeDomainType !== 'hour') {
      hours *= 24;

      if (timeDomainType === 'week') {
        hours *= 7;
      }

      if (timeDomainType === 'month') {
        hours *= 30;
      }
    }

    const start = now - hours * 60 * 60 * 1000;
    const end = now;

    return { start, end, type: timeDomainType };
  }, [timeDomainType]);

  return (
    <View
      style={styles.holder}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <Chart
        width={width}
        height={height}
        datasets={datasets}
        colors={chartColors}
        timeDomain={timeDomain}
        marginHorizontal={PADDING}
      />
      <View style={{ height: 10 }} />
      <View style={styles.timeDomainRow}>
        {TIME_DOMAIN_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.timeDomainItem,
              type === timeDomainType && {
                backgroundColor: '#f0f',
              },
            ]}
            onPress={() => setTimeDomainType(type)}
          >
            <Text style={styles.timeDomainItemText}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const PADDING = 20;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eee',
  },
  holder: {
    width: '100%',
    borderRadius: 10,
    paddingVertical: PADDING,
    backgroundColor: '#fff',
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
  timeDomainItemText: {
    fontSize: 13,
  },
});
