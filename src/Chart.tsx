import React, { useRef, useMemo, useEffect, useCallback } from 'react'
import { PixelRatio, Platform, View } from 'react-native'

import { WebView, type WebViewMessageEvent } from 'react-native-webview'

import drawFunction from './drawFunction'
import {
  type Dataset,
  type ChartProps,
  type TimeDomain,
  type ChartColors,
  type ErrorSegment,
  type XDividerConfig,
  type CalendarStrings,
} from './types'

const MAX_TEXT_ZOOM = 130

type HtmlProps = {
  height: number
  width: number
  locale: string
  keepZoom: boolean
  colors: ChartColors
  datasets: Dataset[]
  zoomEnabled: boolean
  noDataString: string
  timeDomain: TimeDomain
  marginHorizontal: number
  calendar?: CalendarStrings
  xDividerConfig: XDividerConfig
  errorSegments?: ErrorSegment[]
}

export default function Chart({
  width,
  height,
  datasets,
  timeDomain,
  zoomEnabled,
  noDataString,
  errorSegments,
  calendarStrings,
  colors: chartColors,
  locale = 'en',
  marginHorizontal = 0,
  xDividerConfig = { type: 'tick' },
  onZoomEnded,
  onZoomStarted,
}: ChartProps) {
  const ref = useRef<WebView>(null)
  const propInjection = useRef<string>('')
  const currentTimeDomain = useRef<TimeDomain>()

  useEffect(() => {
    if (!height || !width) {
      propInjection.current = ''
      return
    }

    const keepZoom =
      currentTimeDomain.current?.start === timeDomain.start &&
      currentTimeDomain.current?.end === timeDomain.end &&
      currentTimeDomain.current?.type === timeDomain.type
    const props: HtmlProps = {
      width,
      height,
      locale,
      keepZoom,
      datasets,
      timeDomain,
      noDataString,
      xDividerConfig,
      errorSegments,
      marginHorizontal,
      calendar: calendarStrings,
      zoomEnabled: !!zoomEnabled,
      colors: chartColors,
    }
    currentTimeDomain.current = timeDomain
    const injection = `
      try {
        window.draw(${JSON.stringify(props)});
      } catch (e) {
        console.log("failed drawing", e.toString());
      }
      true;
    `

    if (injection !== propInjection.current) {
      propInjection.current = injection
      const webview = ref.current
      if (webview) {
        webview.injectJavaScript(injection)
      }
    }
  }, [
    width,
    height,
    locale,
    datasets,
    timeDomain,
    chartColors,
    zoomEnabled,
    noDataString,
    xDividerConfig,
    errorSegments,
    calendarStrings,
    marginHorizontal,
  ])

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const message = JSON.parse(event.nativeEvent.data)
      switch (message.type) {
        case 'READY':
          ref.current!.injectJavaScript(drawFunction)
          ref.current!.injectJavaScript(propInjection.current)
          break
        case 'log':
          console.log('chart log', ...message.payload)
          break
        case 'zoom':
          message.payload === 'end' && onZoomEnded?.()
          message.payload === 'start' && onZoomStarted?.()
          break
        default:
          console.log(message)
      }
    },
    [onZoomEnded, onZoomStarted]
  )

  const source = useMemo(() => {
    // Assets are copied to platform-specific locations
    const uri = Platform.select({
      ios: 'react-native-d3-chart-chart.html', // Direct file reference in iOS bundle
      android: 'file:///android_asset/react-native-d3-chart/chart.html',
    }) as string

    return { uri }
  }, [])

  const textZoom = Math.min(
    MAX_TEXT_ZOOM,
    Math.round(PixelRatio.getFontScale() * 100)
  )

  return (
    <View style={{ width, height }}>
      <WebView
        ref={ref}
        javaScriptEnabled
        thirdPartyCookiesEnabled
        source={source}
        bounces={false}
        textZoom={textZoom}
        scrollEnabled={false}
        overScrollMode="never"
        originWhitelist={['file://']}
        setBuiltInZoomControls={false}
        setDisplayZoomControls={false}
        style={{ height, width, backgroundColor: chartColors.background }}
        onMessage={onMessage}
      />
    </View>
  )
}
