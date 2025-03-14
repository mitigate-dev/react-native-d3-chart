import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { PixelRatio, Platform } from 'react-native';

import { WebView, WebViewMessageEvent } from 'react-native-webview';

import drawFunction from './drawFunction';
import {
  ChartProps,
  TimeDomain,
  ChartColors,
  Dataset,
  CalendarStrings,
} from './types';

const MAX_TEXT_ZOOM = 130;

export default function Chart({
  width,
  height,
  datasets,
  timeDomain,
  noDataString,
  calendarStrings,
  locale = 'en',
  marginHorizontal = 0,
  colors: chartColors,
  onZoomEnded,
  onZoomStarted,
}: ChartProps) {
  const ref = useRef<WebView>(null);
  const propInjection = useRef<string>('');
  const currentTimeDomain = useRef<TimeDomain>();

  useEffect(() => {
    if (!height || !width) {
      propInjection.current = '';
      return;
    }

    const props: HtmlProps = {
      zoomEnabled: false,
      width,
      height,
      locale,
      datasets,
      timeDomain,
      noDataString,
      marginHorizontal,
      calendar: calendarStrings,
      colors: chartColors,
    };
    currentTimeDomain.current = timeDomain;
    const injection = `
      try {
        window.draw(${JSON.stringify(props)});
      } catch (e) {
        console.log("failed drawing", e.toString());
      }
      true;
    `;

    if (injection !== propInjection.current) {
      propInjection.current = injection;
      const webview = ref.current;
      if (webview) {
        webview.injectJavaScript(injection);
      }
    }
  }, [
    width,
    height,
    locale,
    datasets,
    timeDomain,
    chartColors,
    noDataString,
    calendarStrings,
    marginHorizontal,
  ]);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const message = JSON.parse(event.nativeEvent.data);
      switch (message.type) {
        case 'READY':
          ref.current!.injectJavaScript(drawFunction);
          ref.current!.injectJavaScript(propInjection.current);
          break;
        case 'log':
          console.log('chart log', ...message.payload);
          break;
        case 'zoom':
          message.payload === 'end' && onZoomEnded?.();
          message.payload === 'start' && onZoomStarted?.();
          break;
        default:
          console.log(message);
      }
    },
    [onZoomEnded, onZoomStarted]
  );

  const source = useMemo(() => {
    const baseUrl = Platform.select({
      ios: 'assets',
      android: 'file:///android_asset',
    });
    return { uri: `${baseUrl}/chart.html` };
  }, []);

  const textZoom = Math.min(MAX_TEXT_ZOOM, PixelRatio.getFontScale() * 100);

  return (
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
  );
}

type HtmlProps = {
  zoomEnabled: boolean;
  height: number;
  width: number;
  marginHorizontal: number;
  locale: string;
  timeDomain: TimeDomain;
  colors: ChartColors;
  datasets: Dataset[];
  noDataString: string;
  calendar?: CalendarStrings;
};
