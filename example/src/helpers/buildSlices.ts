import type { Slices } from '../../../src/types'

export function buildSlices(
  variant: 'horizontal' | 'axial',
  {
    end,
    start,
    redThreshold,
    yellowThreshold,
  }: {
    end: number
    start: number
    redThreshold: number
    yellowThreshold: number
  }
): Slices {
  if (variant === 'horizontal') {
    return {
      end,
      start,
      items: [
        {
          color: '#08985115',
          start: { bottom: 0, top: yellowThreshold },
          end: { bottom: 0, top: yellowThreshold },
        },
        {
          color: '#ffc40015',
          start: {
            bottom: yellowThreshold,
            top: redThreshold,
          },
          end: {
            bottom: yellowThreshold,
            top: redThreshold,
          },
        },
        {
          color: '#bb222215',
          start: {
            bottom: redThreshold,
            top: redThreshold * 10,
          },
          end: {
            bottom: redThreshold,
            top: redThreshold * 10,
          },
        },
      ],
    }
  }

  const dataDurationMs = end - start
  const dataDurationHours = dataDurationMs / (60 * 60 * 1000)

  const warningEnd = dataDurationHours * yellowThreshold
  const dangerEnd = dataDurationHours * redThreshold

  const topEdge = redThreshold * 2 * dataDurationHours

  return {
    end,
    start,
    items: [
      {
        color: '#08985115',
        start: { bottom: 0, top: 0 },
        end: { bottom: 0, top: warningEnd },
      },
      {
        color: '#ffc40015',
        start: { bottom: 0, top: 0 },
        end: { bottom: warningEnd, top: dangerEnd },
      },
      {
        color: '#bb222215',
        start: { bottom: 0, top: topEdge },
        end: { bottom: dangerEnd, top: topEdge },
      },
    ],
  }
}
