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
  unit: string
  points: Point[]
  decimals: number
  measurementName: string
  color: string | ThresholdColor
  slices?: Slices
  minDeltaY?: number
  axisColor?: string
  /**
   * Background fill color below the line (area chart)
   * Set to null to disable area fill.
   * @default undefined will use `color` with reduced opacity
   */
  areaColor?: string | null
  decimalSeparator?: '.' | ','
  /**
   * Override Y axis domain (min/max values)
   */
  domain?: { bottom: number; top: number }
}

export type ErrorSegment = {
  message: string
  messageColor: string
  end: Point['timestamp']
  start: Point['timestamp']
}

type XDividerTick = {
  /**
   * Style for vertical dividers on X axis: lines extending from labels (ticks).
   */
  type: 'tick'
  /**
   * Defaults to ChartColors.border
   */
  color?: string
  /**
   * Defaults to 0.5
   */
  strokeWidth?: number
  /**
   * Stroke dash array for the full-height-tick lines
   * See: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/stroke-dasharray
   * Defaults to '2,2'
   */
  strokeDasharray?: string
}

type XDividerSegment = {
  /**
   * Style for vertical dividers on X axis: segments (full height segments, n hour has segment, n+1 does not).
   * Top and bottom are transparent
   */
  type: 'segment'
  /**
   * Defaults to dynamic with dynamicThreshold matching 1.1 days in ms
   *  - when less than threshold being displayed, every other hour has a segment
   *  - when more than threshold being displayed, every other day has a segment
   */
  variant?: 'hour' | 'day' | { dynamicThreshold: number }
  /**
   * Defaults to #FBFBFC, a gradient will be applied
   */
  color?: string
}

export type XDividerConfig = XDividerTick | XDividerSegment

export type HighlightPayload = {
  timestamp: number
  values: ({
    value: Point['value']
    timestamp: Point['timestamp']
    color: string
    errorMessage: string | null
    measurementName: Dataset['measurementName']
  } | null)[]
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
  /**
   * Position of the vertical highlight line as a fraction of the chart width (0 - left, 1 - right).
   * Defaults to 0.5 (center).
   */
  highlightPosition?: number
  errorSegments?: ErrorSegment[]
  /**
   * Style for vertical dividers on X axis
   * Defaults to dashed lines using ChartColors.border color, exteding from labels.
   */
  xDividerConfig?: XDividerConfig
  calendarStrings?: CalendarStrings
  /**
   * Possition of the highlighted value.
   *  - "top" - show value label at the top of the chart
   * - "tooltip" - show value label in a tooltip near the highlight line
   * - "none" - do not show value label. Consider using in combination with @prop `onHighlightChanged` for custom handling.
   *
   * Defaults to "top".
   */
  highlightValuePosition?: 'top' | 'tooltip' | 'none'
  onZoomEnded?: () => void
  onZoomStarted?: () => void
  onHighlightChanged?: (payload: HighlightPayload) => void
}
