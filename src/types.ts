export type Point = { timestamp: number; value: number | null };
export type TimeDomain = { type: string; start: number; end: number };
export type ChartColors = {
  background: string;
  highlightLine: string;
  border: string;
  highlightLabel: string;
  highlightTime: string;
  cursorStroke: string;
};

export type CalendarStrings = {
  days: string[];
  shortDays: string[];
  months: string[];
  shortMonths: string[];
};

export type Dataset = {
  measurementName: string;
  color: string;
  points: Point[];
  unit: string;
  decimals: number;
  minDeltaY?: number;
  decimalSeparator?: '.' | ',';
  domain?: { bottom: number; top: number };
};

export type ChartProps = {
  width: number;
  height: number;
  datasets: Dataset[];
  colors: ChartColors;
  noDataString: string;
  timeDomain: TimeDomain;
  locale?: string;
  zoomEnabled?: boolean;
  marginHorizontal?: number;
  calendarStrings?: CalendarStrings;
  onZoomEnded?: () => void;
  onZoomStarted?: () => void;
};
