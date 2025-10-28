/**
 * Generates time series data points, each point deviating slightly from the previous one.
 * @param startingValue Initial value for the first data point. Default is 400.
 * @param minimum Minimum value for the data points. Default is 0.
 * @param maximum Maximum value for the data points. Default is 3000.
 * @param maxAgeDays Number of days in the past to start generating data from. Default is 30 days.
 * @param intervalMs Time interval in milliseconds between consecutive data points. Default is 60,000 ms (1 minute).
 * @param radomFactor Maximum random variation applied to each point. Default is 20.
 * @returns Array of data points with timestamps and values.
 */
export function generateTimeSeriesData({
  startingValue = 400,
  minimum = 0,
  maximum = 3000,
  maxAgeDays = 30,
  intervalMs = 60 * 1000,
  radomFactor = 20,
} = {}) {
  const points = []
  const now = Date.now()
  const monthAgo = now - maxAgeDays * 24 * 60 * 60 * 1000
  let value = startingValue

  for (let timestamp = monthAgo; timestamp <= now; timestamp += intervalMs) {
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
