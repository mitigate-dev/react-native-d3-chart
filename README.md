# react-native-d3-chart

Create performant charts with zooming, panning and localization using D3.js in a WebView. Perfect for time-series data visualization with smooth interactions.

## Preview

https://github.com/user-attachments/assets/e2a03e9f-a29c-465c-b966-e729e1f6565f

_Interactive chart with zoom, pan, and multi-dataset support_

## Features

- 📊 **Multi-dataset support** - Display multiple data series on the same chart
- 🔍 **Zoom and pan** - Interactive zooming and panning with smooth animations
- 🌍 **Localization** - Built-in support for different locales and custom calendar strings
- 🎨 **Customizable styling** - Full control over colors, margins, and appearance
- 📱 **Cross-platform** - Works seamlessly on iOS and Android
- ⚡ **High performance** - Leverages D3.js for smooth rendering of large datasets
- 🔧 **Zero configuration** - Assets are automatically bundled during installation

## Installation

```sh
npm install react-native-d3-chart
# or
yarn add react-native-d3-chart
```

**Note**: This library requires `react-native-webview`. If you don't have it installed:

```sh
npm install react-native-webview
# or
yarn add react-native-webview
```

## Quick Start

```tsx
import React, { useState, useMemo } from 'react'
import { View } from 'react-native'
import Chart from 'react-native-d3-chart'

export default function App() {
  const [width, setWidth] = useState(0)
  const height = width * 0.6 // 16:10 aspect ratio

  // Generate some sample data
  const datasets = useMemo(
    () => [
      {
        measurementName: 'Temperature',
        color: '#e66',
        unit: '°C',
        decimals: 1,
        points: [
          { timestamp: Date.now() - 3600000, value: 22.5 },
          { timestamp: Date.now() - 1800000, value: 23.1 },
          { timestamp: Date.now(), value: 24.3 },
        ],
      },
    ],
    []
  )

  const timeDomain = useMemo(
    () => ({
      type: 'hour',
      start: Date.now() - 3600000, // 1 hour ago
      end: Date.now(),
    }),
    []
  )

  const colors = {
    background: '#fff',
    highlightLine: '#000',
    border: '#555',
    cursorStroke: '#0ff',
    highlightLabel: '#000',
    highlightTime: '#444',
  }

  return (
    <View
      style={{ flex: 1, padding: 20 }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width - 40)}
    >
      <Chart
        width={width}
        height={height}
        colors={colors}
        datasets={datasets}
        timeDomain={timeDomain}
        noDataString="No data available"
      />
    </View>
  )
}
```

> 💡 **Want to see more?** Check out the [complete example app](./example/src/App.tsx) for advanced usage with multiple datasets, time domain switching, and interactive controls.

## API Reference

### Chart Props

| Prop               | Type              | Required | Description                                                                        |
| ------------------ | ----------------- | -------- | ---------------------------------------------------------------------------------- |
| `width`            | `number`          | ✅       | Chart width in pixels                                                              |
| `height`           | `number`          | ✅       | Chart height in pixels                                                             |
| `datasets`         | `Dataset[]`       | ✅       | Array of data series to display                                                    |
| `colors`           | `ChartColors`     | ✅       | Color configuration for chart elements                                             |
| `timeDomain`       | `TimeDomain`      | ✅       | Control intial zoom level / scale of X-axis, doesn't have to fit the whole dataset |
| `noDataString`     | `string`          | ✅       | Message to show when no data is available                                          |
| `zoomEnabled`      | `boolean`         | ❌       | Enable zoom guesture                                                               |
| `locale`           | `string`          | ❌       | Locale for date/time formatting (default: 'en')                                    |
| `marginHorizontal` | `number`          | ❌       | Horizontal margin in pixels                                                        |
| `calendarStrings`  | `CalendarStrings` | ❌       | Custom calendar strings for localization                                           |
| `onZoomStarted`    | `() => void`      | ❌       | Callback when zoom interaction starts                                              |
| `onZoomEnded`      | `() => void`      | ❌       | Callback when zoom interaction ends                                                |

### Types

#### Dataset

```typescript
type Dataset = {
  measurementName: string // Display name for this data series
  color: string | ThresholdColor // Hex color for the line, or threshold-based coloring
  points: Point[] // Array of data points
  unit: string // Unit symbol (e.g., '°C', 'kg', 'm/s')
  decimals: number // Number of decimal places to show
  minDeltaY?: number // Minimum Y-axis change to show, limit Y-zoom
  areaColor?: string | null // Area fill color (null to disable, defaults to base color)
  axisColor?: string // Optional Y-axis text color (defaults to base color)
  slices?: Slices // Optional background regions/zones
  decimalSeparator?: '.' | ',' // Decimal separator
  domain?: {
    // Custom Y-axis range
    bottom: number
    top: number
  }
}

type Slices = {
  start: number // Start timestamp for the slices
  end: number // End timestamp for the slices
  items: Array<{
    color: string // Background color (use alpha for transparency)
    start: { top: number; bottom: number } // Y-values at start time
    end: { top: number; bottom: number } // Y-values at end time
  }>
}

type ThresholdColor = {
  type: 'thresholds'
  baseColor: string // Default color for values below all thresholds
  thresholds: Array<{
    value: number // Threshold value
    color: string // Color to use above this value
  }> // Should be sorted by value descending
  gradientBlur?: number // Gradient transition distance around thresholds. Default 0 - no blur
}
```

#### Point

```typescript
type Point = {
  timestamp: number // Unix timestamp in milliseconds
  value: number | null // Data value (null for gaps)
}
```

#### TimeDomain

```typescript
type TimeDomain = {
  type: string // Domain type (e.g., 'hour', 'day', 'week')
  start: number // Start timestamp (ms)
  end: number // End timestamp (ms)
}
```

#### ChartColors

```typescript
type ChartColors = {
  background: string // Chart background color
  highlightLine: string // Crosshair line color
  border: string // Chart border color
  highlightLabel: string // Value label text color
  highlightTime: string // Time label text color
  cursorStroke: string // Cursor/crosshair circle color
}
```

#### CalendarStrings

```typescript
type CalendarStrings = {
  days: string[] // Full day names (Sunday first)
  shortDays: string[] // Short day names (Sun first)
  months: string[] // Full month names (January first)
  shortMonths: string[] // Short month names (Jan first)
}
```

## Advanced Usage

### Multiple Datasets

```tsx
const datasets = [
  {
    measurementName: 'Temperature',
    color: '#e66',
    unit: '°C',
    decimals: 1,
    points: temperatureData,
  },
  {
    measurementName: 'Humidity',
    color: '#66e',
    unit: '%',
    decimals: 0,
    points: humidityData,
  },
]
```

### Threshold-Based Colors

Create dynamic line colors that change based on data values using threshold configurations. This is perfect for showing status indicators, alerts, or different states in your data:

```tsx
const datasetWithThresholds = {
  measurementName: 'Server Load',
  unit: '%',
  decimals: 0,
  areaColor: '#e78e96', // Optional: custom area fill color
  color: {
    type: 'thresholds',
    baseColor: '#00FF00', // Green for values below all thresholds (low load)
    gradientBlur: 5, // Smooth transition distance around thresholds
    thresholds: [
      { value: 85, color: '#FF0000' }, // Red for values >= 85% (critical)
      { value: 50, color: '#FF9400' }, // Orange for values >= 50% (warning)
      // Values < 50% will use baseColor (green)
    ],
  },
  points: serverLoadData,
}
```

**How it works:**

- **Thresholds should be sorted by value in descending order**
- Values >= 85% will be colored red (`#FF0000`) - critical load
- Values >= 50% but < 80% will be colored orange (`#FF9400`) - warning load
- Values < 50% will use the `baseColor` green (`#00FF00`) - healthy load
- The `gradientBlur` creates smooth color transitions around threshold boundaries

**Real-world examples:**

- **Temperature monitoring**: Blue (cold) → Green (optimal) → Red (overheating)
- **Performance metrics**: Red (poor) → Yellow (acceptable) → Green (excellent)
- **Battery levels**: Red (critical) → Orange (low) → Green (healthy)
- **Network latency**: Green (fast) → Yellow (moderate) → Red (slow)

### Background Slices/Zones

Add colored background regions to highlight acceptable ranges, warning zones, or targets:

```tsx
const datasetWithSlices = {
  measurementName: 'CPU Usage',
  color: '#333',
  unit: '%',
  decimals: 1,
  points: cpuData,
  slices: {
    start: startTimestamp,
    end: endTimestamp,
    items: [
      {
        color: '#00FF0020', // Green with transparency (healthy zone)
        start: { bottom: 0, top: 50 },
        end: { bottom: 0, top: 50 },
      },
      {
        color: '#FFA50020', // Orange with transparency (warning zone)
        start: { bottom: 50, top: 80 },
        end: { bottom: 50, top: 80 },
      },
      {
        color: '#FF000020', // Red with transparency (critical zone)
        start: { bottom: 80, top: 100 },
        end: { bottom: 80, top: 100 },
      },
    ],
  },
}
```

**Features:**

- **Horizontal zones**: Use same top/bottom values for start and end
- **Diagonal zones**: Use different values to create slanted regions
- **Transparency**: Use alpha channel (e.g., `#FF000020`) for subtle backgrounds
- **Multiple regions**: Stack different colored zones for complex visualizations

### Zoom Callbacks

```tsx
<Chart
  // ... other props
  zoomEnabled
  onZoomStarted={() => console.log('Zoom started')}
  onZoomEnded={() => console.log('Zoom ended')}
/>
```

## Requirements

- React Native >= 0.60
- react-native-webview >= 11.0.0
- iOS 11.0+ / Android API 21+

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
