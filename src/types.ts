export type Point = { timestamp: number; value: number | null }
export type TimeDomain = { type: string; start: number; end: number }
export type ChartColors = {
  background: string
  highlightLine: string
  border: string
  highlightLabel: string
  highlightTime: string
  cursorStroke: string
}

export type CalendarStrings = {
  days: string[]
  shortDays: string[]
  months: string[]
  shortMonths: string[]
}

type ThresholdColor = {
  type: 'thresholds'
  baseColor: string
  /**
   * Must be sorted by value descending (highest value first)
   */
  thresholds: { value: number; color: string }[]
  /**
   * Gradient transition distance around thresholds.
   * Must be non-negative. Should be less than half the distance between thresholds.
   * @default 0 - no blur
   */
  gradientBlur?: number
}

export type Slices = {
  end: Point['timestamp']
  start: Point['timestamp']
  items: {
    color: string
    end: { top: Point['value']; bottom: Point['value'] }
    start: { top: Point['value']; bottom: Point['value'] }
  }[]
}

export type Dataset = {
  measurementName: string
  color: string | ThresholdColor
  points: Point[]
  unit: string
  decimals: number
  slices?: Slices
  minDeltaY?: number
  /**
   * Background fill color below the line (area chart)
   * Set to null to disable area fill.
   * @default undefined will use `color` with reduced opacity
   */
  areaColor?: string | null
  axisColor?: string
  decimalSeparator?: '.' | ','
  domain?: { bottom: number; top: number }
}

export type ChartProps = {
  width: number
  height: number
  datasets: Dataset[]
  colors: ChartColors
  noDataString: string
  timeDomain: TimeDomain
  locale?: string
  zoomEnabled?: boolean
  marginHorizontal?: number
  calendarStrings?: CalendarStrings
  onZoomEnded?: () => void
  onZoomStarted?: () => void
}
