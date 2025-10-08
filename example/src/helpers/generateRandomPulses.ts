export function generateRandomPulses({
  maxAgeDays = 30,
  intervalMs = 60 * 1000,
  averageRatePerHour = 120,
  burstFactor = 3,
  burstProbability = 0.1,
} = {}) {
  const points = []
  const now = Date.now()
  const oldestTimestamp = now - maxAgeDays * 24 * 60 * 60 * 1000 // maxAgeDays ago
  const averageRate = averageRatePerHour / 60 // Convert to per minute

  for (
    let timestamp = oldestTimestamp;
    timestamp <= now;
    timestamp += intervalMs
  ) {
    // Generate clustered/bursty Poisson data with higher short-term variance
    // Calculate rates to maintain target average: baseRate * (1-p) + burstRate * p = averageRate
    const burstRate = averageRate * burstFactor
    const baseRate =
      (averageRate - burstRate * burstProbability) / (1 - burstProbability)

    let pulses = 0

    // Determine if this is a burst period
    const isBurst = Math.random() < burstProbability
    const lambda = isBurst ? burstRate : baseRate

    if (lambda < 30) {
      // Knuth's algorithm for small λ
      const L = Math.exp(-lambda)
      let k = 0
      let p = 1

      do {
        k++
        p *= Math.random()
      } while (p > L)

      pulses = k - 1
    } else {
      // Normal approximation for large λ
      const u1 = Math.random()
      const u2 = Math.random()
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
      pulses = Math.max(0, Math.round(lambda + Math.sqrt(lambda) * z))
    }

    points.push({ timestamp, value: pulses })
  }

  return points
}
