export default `
var zoomPixelPadding = 0,
  zoomTimePadding = 600000,
  yLabelMargin = 7,
  yLabelMaxLength = 6,
  headerHeight = 44

function sample(data, count, domain) {
  const length = data?.length
  if (!length) return []

  const domainStart = domain?.[0] || data[0].timestamp
  const domainEnd = domain?.[1] || data[length - 1].timestamp

  if (length <= count) {
    return data.filter(
      (d) => d.timestamp >= domainStart && d.timestamp <= domainEnd
    )
  }

  const batchLength = (domainEnd - domainStart) / count
  var i = data.findIndex((d) => d.timestamp >= domainStart)
  if (i < 0) return []

  var batchEnd =
    data[0].timestamp +
    Math.floor(
      Math.floor((data[i].timestamp - data[0].timestamp) / batchLength) *
        batchLength
    )

  const nullPointsBefore = []
  var maxPoint = undefined
  const nullPointsAfter = []

  const sampled = []
  const push = () => {
    sampled.push(...nullPointsBefore)
    maxPoint && sampled.push(maxPoint)
    sampled.push(...nullPointsAfter)
  }

  while (true) {
    const datum = data[i]
    if (!datum || datum.timestamp > domainEnd) break

    if (datum.timestamp > batchEnd) {
      batchEnd += batchLength

      push()
      nullPointsBefore.length = 0
      maxPoint = undefined
      nullPointsAfter.length = 0
    }

    if (datum.value === null) {
      nullPointsAfter.push(datum)
    } else if (!maxPoint || datum.value > maxPoint.value) {
      maxPoint = datum
      if (nullPointsAfter.length) {
        nullPointsBefore.push(...nullPointsAfter)
        nullPointsAfter.length = 0
      }
    }
    i++
  }

  push()

  return sampled
}

function findClosest(data, target) {
  if (!data?.length) return undefined

  if (target < data[0].date) {
    return 0
  }
  if (target > data[data.length - 1].date) {
    return data.length - 1
  }

  let lo = 0
  let hi = data.length - 1

  while (lo <= hi) {
    const mid = Math.round((hi + lo) / 2)

    const midPoint = data[mid]
    // console.log(lo, hi, mid, target < midPoint?.date, target > midPoint?.date)
    if (target < midPoint?.date) {
      hi = mid - 1
    } else if (target > midPoint?.date) {
      lo = mid + 1
    } else {
      return mid
    }
  }

  if (hi === lo) hi++

  const finalIx =
    Math.abs(target - data[lo]?.date) > Math.abs(data[hi]?.date - target)
      ? hi
      : lo

  return finalIx
}

function getClosest(data, target) {
  const closestIndex = findClosest(data, target)
  return data[closestIndex]
}

function postMessage(type, payload) {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload }))
  } else {
    const old = document.cookie && JSON.parse(document.cookie)
    document.cookie = JSON.stringify({ ...old, [type]: payload })
  }
}

function convertData(data) {
  const parseTime = d3.timeParse('%Q')
  return data.map((d) => ({
    date: parseTime(d.timestamp),
    value: d.value,
  }))
}

function extractValue(d) {
  return d.value
}

function extractDate(d) {
  return d.date
}

function getDatasetColor(dataset, value) {
  if (dataset.color.type === 'thresholds') {
    const crossedThreshold = dataset.color.thresholds.find(
      (threshold) => value >= threshold.value
    )

    if (crossedThreshold) {
      return crossedThreshold.color
    }

    return dataset.color.baseColor
  }
  return dataset.color
}

function formatXAxis(g, xDividerConfig) {
  g.select('.domain').remove()
  g.selectAll('.tick text')
    .attr('font-size', 10)
    .style('color', colors.border)
    .attr('y', 10)
  if (xDividerConfig.type === 'tick') {
    g.selectAll('.tick line')
      .attr('stroke', xDividerConfig.color ?? colors.border)
      .attr('stroke-width', xDividerConfig.strokeWidth ?? 0.5)
      .attr('stroke-dasharray', xDividerConfig.dashArray ?? '2,2')
  } else {
    g.selectAll('.tick line').remove()
  }
}

function exessSymbolCount(textEl) {
  if (!textEl?.__data__) return 0

  const label = yFormat(textEl.__data__)
  return label.length - yLabelMaxLength
}
function calculateYTickTextX(value, index, siblings) {
  const max = Math.max(
    0,
    exessSymbolCount(siblings[index - 1]),
    exessSymbolCount(siblings[index]),
    exessSymbolCount(siblings[index + 1])
  )
  return (
    -yLabelMargin + // default x
    5 * // digit size
      max
  )
}

function fromatYAxis(g, color, datasetIndex, width) {
  var xCalculation =
    datasetIndex % 2 === 0
      ? calculateYTickTextX
      : (...args) => {
          return width - calculateYTickTextX(...args)
        }
  var s = g.selection ? g.selection() : g
  s.select('.domain').remove()
  s.selectAll('.tick text')
    .attr('font-size', 10)
    .style('color', color)
    .attr('x', xCalculation)
  s.selectAll('.tick line').remove()

  if (s !== g)
    g.selectAll('.tick text').attrTween('x', null).attrTween('dy', null)
}

function buildValueDomain(data, { minDeltaY, domain }) {
  let min = d3.min(data, (d) => (d.value === null ? Infinity : d.value))
  let max = d3.max(data, (d) => d.value)

  if (domain) {
    min = Math.min(min, domain.bottom)
    max = Math.max(max, domain.top)
  }
  if (typeof minDeltaY !== 'undefined') {
    min = Math.min(min, max - minDeltaY / 2)
    max = Math.max(max, min + minDeltaY)
  }
  return [min, max]
}

function getTickCount(domain, { minDeltaY }) {
  if (typeof minDeltaY === 'undefined') return 4

  const count = (2 * (domain[1] - domain[0])) / minDeltaY + 1
  const tickCount = Math.min(count, 4)
  return tickCount
}

function yFormat(value) {
  const axisLabel = String(value)
  return axisLabel.length > yLabelMaxLength ? '' : axisLabel
}

function buildYAxis(y, dataset, datasetIndex) {
  const axisBuilder = datasetIndex % 2 === 0 ? d3.axisLeft : d3.axisRight

  return axisBuilder(y)
    .ticks(getTickCount(y.domain(), dataset))
    .tickFormat(yFormat)
}

function isDefined(d) {
  return d.value !== null
}

var x = undefined
var wholeScaleX = undefined
var zoom = undefined
var colors = undefined
var timeDomain = undefined

/**
 * {[index]: {y, definedData, domainData }}
 */
var operators = {}

window.draw = (props) => {
  try {
    d3.select('#my_dataviz').style('background', props.colors.background)
    d3.selectAll('.remove_me').remove()
    Object.keys(operators).forEach((index) => {
      if (!props.datasets[index]) {
        d3.select('g#y_axis' + index).remove()
        d3.select('path#area' + index).remove()
        d3.select('path#line' + index).remove()
        d3.select('g#crosshair' + index).remove()
        d3.select('span#highlightvalue' + index).remove()
        d3.select('span#label' + index).remove()
        d3.select('span#unit' + index).remove()

        delete operators[index]
      }
    })

    function selectOrAppend(parent, type, id) {
      const selection = parent.select(type + '#' + id)
      if (selection.empty()) {
        return parent.append(type).attr('id', id)
      }
      // console.log("has el", type + '#' + id)
      return selection
    }

    colors = props.colors

    var margin = {
      top: 16,
      right: 24 + props.marginHorizontal,
      left: 24 + props.marginHorizontal,
      bottom: 24,
    }
    var width = props.width - margin.left - margin.right
    var height =
      props.height -
      margin.top -
      margin.bottom -
      headerHeight -
      24 * (props.datasets.length - 1)

    if (typeof props.decimalSeparator === 'string') {
      d3.formatDefaultLocale({ decimal: props.decimalSeparator })
    }
    if (!!props.calendar?.months) {
      d3.timeFormatDefaultLocale({
        dateTime: '%a %b %e %X %Y',
        date: '%d/%m/%Y',
        time: '%H:%M:%S',
        periods: ['AM', 'PM'],
        ...props.calendar,
      })
    }

    var formatMillisecond = d3.timeFormat('.%L'),
      formatSecond = d3.timeFormat(':%S'),
      formatMinute = d3.timeFormat(props.use12hClock ? '%I:%M' : '%H:%M'),
      formatHour = d3.timeFormat(props.use12hClock ? '%I %p' : '%H:%M'),
      formatDay = d3.timeFormat('%a %d'),
      // formatWeek = d3.timeFormat('%b %d'),
      formatMonth = d3.timeFormat('%B'),
      formatYear = d3.timeFormat('%Y')

    function multiFormat(date) {
      return (
        d3.timeSecond(date) < date
          ? formatMillisecond
          : d3.timeMinute(date) < date
            ? formatSecond
            : d3.timeHour(date) < date
              ? formatMinute
              : d3.timeDay(date) < date
                ? formatHour
                : d3.timeMonth(date) < date
                  ? // d3.timeWeek(date) < date? // move beginning of week to monday
                    formatDay // : formatWeek
                  : d3.timeYear(date) < date
                    ? formatMonth
                    : formatYear
      )(date)
    }

    var svg = selectOrAppend(
      selectOrAppend(d3.select('#my_dataviz'), 'svg', 'svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom),
      'g',
      'master'
    ).attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    function getSampledData(data, x) {
      const zoomDomain = !x
        ? undefined
        : [
            new Date(x.invert(0 - zoomPixelPadding)).getTime() -
              zoomTimePadding,
            new Date(x.invert(width + zoomPixelPadding)).getTime() +
              zoomTimePadding,
          ]

      return convertData(sample(data, width + zoomPixelPadding * 2, zoomDomain))
    }

    const newScale = !x || !wholeScaleX || !props.keepZoom
    timeDomain = props.timeDomain
    if (newScale) {
      x = d3
        .scaleTime()
        .domain([timeDomain.start, timeDomain.end])
        .range([0, width])
      wholeScaleX = x.copy()
    }

    if (props.xDividerConfig.type === 'segment') {
      var segmentHolder = selectOrAppend(svg, 'g', 'segment_holder')
      segmentHolder.attr('clip-path', 'url(#clip)')
    }

    const xAxis = selectOrAppend(svg, 'g', 'x_axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom(x).ticks(6).tickSize(-height).tickFormat(multiFormat))
      .call(formatXAxis, props.xDividerConfig)

    const defs = svg.append('defs').attr('class', 'remove_me')
    defs
      .append('svg:clipPath')
      .attr('id', 'clip')
      .append('svg:rect')
      .attr('width', width)
      .attr('height', height)
      .attr('x', 0)
      .attr('y', 0)

    defs
      .append('linearGradient')
      .attr('id', 'error-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', 0)
      .attr('y2', height)
      .selectAll('stop')
      .data([
        { offset: '0%', opacity: 0 },
        { offset: '100%', opacity: 0.1 },
      ])
      .enter()
      .append('stop')
      .attr('offset', (d) => d.offset)
      .attr('stop-opacity', (d) => d.opacity)
      .attr('stop-color', '#000000')

    var drawSegments = () => {
      if (props.xDividerConfig.type !== 'segment') return
      const { xDividerConfig } = props

      const end = x.invert(width)
      const start = x.invert(0)
      const scope = end - start
      const day = 24 * 60 * 60 * 1000
      const hour = 60 * 60 * 1000

      const interval = 
        xDividerConfig.variant === "day" 
          ? day
        : xDividerConfig.variant === "hour"
          ? hour
        : scope > (xDividerConfig.variant?.dynamicThreshold ?? 1.1 * day)
          ? day
          : hour

      const segments = []

      start.setHours(0, 0, 0, 0)
      const timeZoneRemainder = start % interval
      for (
        let beginning = start.getTime();
        beginning < end.getTime();
        beginning += interval
      ) {
        if (beginning % (2 * interval) === timeZoneRemainder) {
          segments.push({
            start: x(new Date(beginning)),
            end: x(new Date(beginning + interval)),
          })
        }
      }

      segmentHolder.selectAll('rect').remove()
      segmentHolder
        .selectAll('rect')
        .data(segments)
        .enter()
        .append('rect')
        .attr('fill', 'url(#segment-gradient)')
        .attr('height', height)
        .attr('width', (d) => d.end - d.start)
        .attr('x', (d) => d.start)
    }
    drawSegments()

    const chart = selectOrAppend(svg, 'g', 'chart').attr(
      'clip-path',
      'url(#clip)'
    )

    var drawErrorSegments = () => {
      const errorSegmentsHolder = selectOrAppend(
        chart,
        'g',
        'errorSegmentsHolder'
      )
      errorSegmentsHolder.selectAll('rect').remove()
      if (!props.errorSegments?.length) return

      try {
        const parseTime = d3.timeParse('%Q')
        errorSegmentsHolder
          .selectAll('rect')
          .data(
            props.errorSegments.map(({ start, end }) => ({
              startDate: parseTime(start),
              endDate: parseTime(end),
            }))
          )
          .enter()
          .append('rect')
          .attr('fill', 'url(#error-gradient)')
          .attr('height', height)
          .attr('width', (d) => x(d.endDate) - x(d.startDate))
          .attr('x', (d) => x(d.startDate))
      } catch (e) {
        postMessage('error segment update error', e.message)
      }
    }
    drawErrorSegments()

    const getGradientOffset =
      (yScale) =>
      ({ value }) =>
        (yScale(value) / (height + margin.top + margin.bottom)) * 100 + '%'

    props.datasets.forEach((dataset, index) => {
      const { points, color, minDeltaY } = dataset
      var data = getSampledData(points, x)

      const definedData = data.filter(isDefined)
      const domainData = data

      const y = d3
        .scaleLinear()
        .domain(buildValueDomain(points, dataset))
        .range([height - 1, 1])

      operators[index] = { definedData, domainData, y }

      if (dataset.slices) {
        const { start, end, items } = dataset.slices
        const [startDatum, endDatum] = convertData([
          { timestamp: start },
          { timestamp: end },
        ])
        items.forEach(({ color, start, end }, sliceIndex) => {
          selectOrAppend(chart, 'path', 'slice' + index + '_' + sliceIndex)
            .datum([
              { ...startDatum, ...start },
              { ...endDatum, ...end },
            ])
            .attr('class', 'remove_me')
            .attr('fill', color)
            .attr('stroke', 'none')
        })
      }

      selectOrAppend(svg, 'g', 'y_axis' + index)

      svg
        .select('g#y_axis' + index)
        .transition()
        .call(buildYAxis(y, dataset, index))
        .call(
          fromatYAxis,
          dataset.axisColor ?? getDatasetColor(dataset),
          index,
          width
        )

      if (dataset.areaColor !== null) {
        const color = dataset.areaColor ?? getDatasetColor(dataset)
        const baseOpacity = dataset.areaColor ? 1 : 0.3
        const stops = [
          { value: y.domain()[1], opacity: baseOpacity },
          {
            value: y.domain()[0] + (y.domain()[1] - y.domain()[0]) * 0.526042,
            opacity: 0.223958 * baseOpacity,
          },
          { value: y.domain()[0], opacity: 0 },
        ]
        defs
          .append('linearGradient')
          .attr('id', 'area-gradient' + index)
          .attr('gradientUnits', 'userSpaceOnUse')
          .attr('x1', 0)
          .attr('x2', 0)
          .attr('y1', 0)
          .attr('y2', '100%')
          .selectAll('stop')
          .data(stops)
          .enter()
          .append('stop')
          .attr('offset', getGradientOffset(y))
          .attr('stop-opacity', (d) => d.opacity)
          .attr('stop-color', color)
      }

      if (props.xDividerConfig.type === 'segment') {
        defs
          .append('linearGradient')
          .attr('id', 'segment-gradient')
          .attr('gradientUnits', 'userSpaceOnUse')
          .attr('x1', 0)
          .attr('x2', 0)
          .attr('y1', 0)
          .attr('y2', height)
          .selectAll('stop')
          .data([
            { offset: '0%', opacity: 0 },
            { offset: '7.51%', opacity: 1 },
            { offset: '91.71%', opacity: 1 },
            { offset: '100%', opacity: 0 },
          ])
          .enter()
          .append('stop')
          .attr('offset', (d) => d.offset)
          .attr('stop-opacity', (d) => d.opacity)
          .attr('stop-color', props.xDividerConfig.color ?? "#FBFBFC")
      }

      selectOrAppend(chart, 'path', 'area' + index)
        .datum(data)
        .attr('class', 'area')
        .attr('fill', 'url(#area-gradient' + index + ')')
        .attr('stroke', 'none')
      d3.select('path#area' + index)
        .transition()
        .attr(
          'd',
          d3
            .area()
            .defined(isDefined)
            .x((d) => x(d.date))
            .y0(y(y.domain()[0]) + 1) // NOTE: +1 prevents a weird hairline at the bottom (just above axis)
            .y1((d) => y(d.value))
        )

      selectOrAppend(chart, 'path', 'line' + index)
        .datum(data)
        .attr('class', 'line')
        .attr('fill', 'none')
        .attr('stroke-width', 2)

      if (dataset.color.type === 'thresholds') {
        const { baseColor, gradientBlur = 0, thresholds } = dataset.color
        const stops = thresholds.flatMap(({ value, color }, index) => [
          {
            value: value + gradientBlur,
            color: color,
          },
          {
            value: value - gradientBlur,
            // NOTE: All thresholds have color. index out of bounds - last threshold - use baseColor
            color: thresholds[index + 1]?.color ?? baseColor,
          },
        ])

        defs
          .append('linearGradient')
          .attr('id', 'line-gradient' + index)
          .attr('gradientUnits', 'userSpaceOnUse')
          .attr('x1', 0)
          .attr('x2', 0)
          .attr('y1', 0)
          .attr('y2', '100%')
          .selectAll('stop')
          .data(stops)
          .enter()
          .append('stop')
          .attr('offset', getGradientOffset(y))
          .attr('stop-color', (stop) => stop.color)
      }

      d3.select('path#line' + index)
        .attr(
          'stroke',
          dataset.color.type === 'thresholds'
            ? 'url(#line-gradient' + index + ')'
            : dataset.color
        )
        .transition()
        .attr(
          'd',
          d3
            .line()
            .defined(isDefined)
            .x((d) => x(d.date))
            .y((d) => y(d.value))
        )
    })

    const valuesHolder = d3.select('#values_holder')
    const timeholder = d3
      .select('#timeholder')
      .style('background', colors.highlightTime)

    selectOrAppend(svg, 'line', 'highlight')
      .style('stroke', colors.highlightLine)
      .style('stroke-width', 1)
      .attr('x1', width * props.highlightPosition)
      .attr('x2', width * props.highlightPosition)
      .attr('y1', 0)
      .attr('y2', height)

    selectOrAppend(svg, 'line', 'bottomBorder')
      .style('stroke', colors.border)
      .style('stroke-width', 0.5)
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', height)
      .attr('y2', height)

    selectOrAppend(svg, 'line', 'leftBorder')
      .style('stroke', colors.border)
      .style('stroke-width', 0.5)
      .attr('stroke-dasharray', '2,2')
      .attr('stroke-dashoffset', 2)
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', 0)
      .attr('y2', height)

    selectOrAppend(svg, 'line', 'rightBorder')
      .style('stroke', colors.border)
      .style('stroke-width', 0.5)
      .attr('stroke-dasharray', '2,2')
      .attr('stroke-dashoffset', 2)
      .attr('x1', width)
      .attr('x2', width)
      .attr('y1', 0)
      .attr('y2', height)

    props.datasets.forEach(
      /* prettier-ignore newline */
      (dataset, index) => {
        const { points, measurementName, unit } = dataset
        const color = getDatasetColor(dataset)
        selectOrAppend(d3.select('#labels_holder'), 'span', 'label' + index)
          .style('color', colors.highlightLabel)
          .html(measurementName)

        const noData = !points.find(isDefined)
        selectOrAppend(valuesHolder, 'span', 'highlightvalue' + index)
          .style('color', color)
          .html(noData ? props.noDataString : '')

        const highlightCroshair = selectOrAppend(
          selectOrAppend(svg, 'g', 'crosshair' + index),
          'circle',
          'crosshair' + index
        )
          .attr('r', 5)
          .attr('opacity', 0)
          .attr('fill', 'transparent')
          .attr('stroke-width', 2)
          .attr('stroke', color)
          .attr('cx', width * props.highlightPosition)

        if (!highlightCroshair.attr('cy')) {
          highlightCroshair.attr('cy', height)
        }

        const unitPositionKey = index % 2 === 0 ? 'right' : 'left'
        selectOrAppend(d3.select('div#my_dataviz'), 'span', 'unit' + index)
          .style('color', dataset.axisColor ?? color)
          .style('font-size', '10px')
          .style('position', 'absolute')
          .style(
            'bottom',
            margin.bottom - 10 * (Math.floor(index / 2) + 1) + 'px'
          )
          .style(
            unitPositionKey,
            margin[unitPositionKey] + width + yLabelMargin + 'px'
          )
          .html(unit)
      }
    )

    if (newScale) {
      zoom = d3.zoom().scaleExtent([
        1,
        props.zoomEnabled === false
          ? 1
          : (wholeScaleX.domain()[1] - wholeScaleX.domain()[0]) /
            (1000 * 60 * 10), // at max zoom 10 mins are on screen at a time
      ])
    }

    zoom
      .extent([
        [0, 0],
        [width, height],
      ])
      .on('start', () => postMessage('zoom', 'start'))
      .on('zoom', onZoom)
      .on('end', rescaleY)

    const catcher = selectOrAppend(svg, 'rect', 'event-catcher')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .call(zoom)

    if (newScale) {
      catcher.call(zoom.transform, d3.zoomIdentity)
    }

    function rescaleY(e) {
      postMessage('zoom', 'end')
      const duration = e.sourceEvent === null ? 0 : 300
      props.datasets.forEach((dataset, index) => {
        const { definedData, domainData, y } = operators[index]
        if (definedData.length < 2) return

        y.domain(buildValueDomain(definedData, dataset))

        d3.select('path#line' + index)
          .datum(domainData)
          .transition()
          .duration(duration)
          .attr(
            'd',
            d3
              .line()
              .defined(isDefined)
              .x((d) => x(d.date))
              .y((d) => y(d.value))
          )

        d3.select('path#area' + index)
          .datum(domainData)
          .transition()
          .duration(duration)
          .attr(
            'd',
            d3
              .area()
              .defined(isDefined)
              .x((d) => x(d.date))
              .y0(y(y.domain()[0]) + 1) // NOTE: +1 prevents a weird hairline at the bottom (just above axis)
              .y1((d) => y(d.value))
          )

        svg
          .select('g#y_axis' + index)
          .transition()
          .duration(duration)
          .call(buildYAxis(y, dataset, index))
          .call(
            fromatYAxis,
            dataset.axisColor ?? getDatasetColor(dataset),
            index,
            width
          )

        defs
          .selectAll(
            'linearGradient#area-gradient' +
              index +
              ',' +
              'linearGradient#line-gradient' +
              index
          )
          .selectAll('stop')
          .transition()
          .duration(duration)
          .attr('offset', getGradientOffset(y))
      })

      updateHighlight(duration)
      updateSlices(duration)
    }

    function onZoom({ transform, sourceEvent }) {
      try {
        const newX = transform.rescaleX(wholeScaleX)

        xAxis
          .call(
            d3
              .axisBottom(newX)
              .ticks(6)
              .tickSize(-height)
              .tickFormat(multiFormat)
          )
          .call(formatXAxis, props.xDividerConfig)

        props.datasets.forEach(({ points }, index) => {
          const { y } = operators[index]

          const domainData = getSampledData(points, newX)
          operators[index].domainData = domainData
          operators[index].definedData = domainData.filter(isDefined)

          d3.select('path#line' + index)
            .datum(domainData)
            .attr(
              'd',
              d3
                .line()
                .defined(isDefined)
                .x((d) => newX(d.date))
                .y((d) => y(d.value))
            )

          d3.select('path#area' + index)
            .datum(domainData)
            .attr(
              'd',
              d3
                .area()
                .defined(isDefined)
                .x((d) => newX(d.date))
                .y0(y(y.domain()[0]) + 1) // NOTE: +1 prevents a weird hairline at the bottom (just above axis)
                .y1((d) => y(d.value))
            )
        })

        x.domain(newX.domain())

        updateHighlight()
        updateSlices()
        drawSegments()
        drawErrorSegments()
      } catch (e) {
        postMessage('zoomerror', e.message)
      }
    }

    function formatDate(date) {
      const twoDigit = (value) => String(value).padStart(2, '0')
      return (
        twoDigit(date.getDate()) +
        '.' +
        twoDigit(date.getMonth() + 1) +
        '.' +
        date.getFullYear() +
        '.'
      )
    }

    function updateHighlight(duration = 0) {
      const x0 = width * props.highlightPosition
      const highlightExactDate = x.invert(x0)

      const highlightedErrorSegment = props.errorSegments?.find(
        (s) => s.start < highlightExactDate && s.end > highlightExactDate
      )

      var highlightTime = null
      props.datasets.forEach((dataset, index) => {
        const { unit, decimals } = dataset
        const { definedData, y } = operators[index]

        if (!definedData.length) {
          valuesHolder
            .select('span#highlightvalue' + index)
            .style('color', getDatasetColor(dataset))
            .html(props.noDataString)

          return
        }

        const highlight = getClosest(definedData, highlightExactDate)
        const xValue = x(highlight.date)

        const is10MinutesAway =
          Math.abs(highlightExactDate - highlight.date) > 10 * 60 * 1000
        const is8PixelsAway = Math.abs(x0 - xValue) > 8

        // Closest defined point is more than 10 minutes away, or we are in error segment + closest _unfiltered_ point is null
        const tooFar =
          is8PixelsAway &&
          (is10MinutesAway ||
            (!!highlightedErrorSegment &&
              getClosest(operators[index].domainData, highlightExactDate)
                ?.value === null))
        const isInErrorSegment = highlightedErrorSegment && tooFar

        const color = isInErrorSegment
          ? highlightedErrorSegment.messageColor
          : getDatasetColor(dataset, tooFar ? undefined : highlight.value)

        if (!tooFar) {
          highlightTime = highlight.date
        }

        d3.select('circle#crosshair' + index)
          .transition()
          .duration(duration)
          .attr('cx', xValue)
          .attr('cy', y(highlight.value))
          .attr('stroke', color)
          .attr('opacity', tooFar ? 0 : 1)

        valuesHolder
          .select('span#highlightvalue' + index)
          .style('color', color)
          .html(
            isInErrorSegment
              ? highlightedErrorSegment.message
              : tooFar
                ? props.noDataString
                : d3.format('.' + decimals + 'f')(highlight.value) + ' ' + unit
          )
      })

      const date = highlightTime ?? highlightExactDate

      timeholder.select('span#date').html(formatDate(date))
      timeholder.select('span#time').html(
        date.toLocaleString(props.locale, {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      )
    }

    function updateSlices(duration = 0) {
      props.datasets.forEach((dataset, index) => {
        if (!dataset.slices) return

        const { y } = operators[index]
        dataset.slices.items.forEach((_, sliceIndex) => {
          d3.select('path#slice' + index + '_' + sliceIndex)
            .transition()
            .duration(duration)
            .attr(
              'd',
              d3
                .area()
                .x((d) => x(d.date))
                .y0((d) => y(d.top))
                .y1((d) => y(d.bottom))
            )
        })
      })
    }

    if (x.range()[1] !== width) {
      const domain = x.domain().map((d) => d.getTime())
      x.range([0, width])
      wholeScaleX.range(x.range())

      if (domain) {
        const wholeDomain = wholeScaleX.domain()
        const wholeDomainLength = wholeDomain[1] - wholeDomain[0]
        const k = wholeDomainLength / (domain[1] - domain[0])
        const distanceMs = wholeDomain[0] - domain[0]
        const msPerPixel = wholeDomainLength / width
        const distancePx = distanceMs / msPerPixel

        const x = distancePx * k

        zoom.transform(catcher, d3.zoomIdentity)
        zoom.scaleTo(catcher, k)
        const xNow = width * (0.5 - k / 2)
        // console.log({ k, x, xNow, r: (x - xNow) / k })
        zoom.translateBy(catcher, (x - xNow) / k, 0)
      }
    }

    updateHighlight(newScale ? 0 : 300)
    updateSlices(newScale ? 0 : 300)

    if (!newScale && props.keepZoom) {
      rescaleY({ sourceEvent: null })
    }
  } catch (e) {
    postMessage('error', e.message)
  }
}

console.log = (...args) => {
  window.ReactNativeWebView.postMessage(
    JSON.stringify({
      type: 'log',
      payload: args.length > 1 ? [...args] : args[0],
    })
  )
}

true
`
