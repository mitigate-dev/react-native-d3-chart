import {
  requireNativeComponent,
  UIManager,
  Platform,
  type ViewStyle,
} from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-d3-chart' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

type D3ChartProps = {
  color: string;
  style: ViewStyle;
};

const ComponentName = 'D3ChartView';

export const D3ChartView =
  UIManager.getViewManagerConfig(ComponentName) != null
    ? requireNativeComponent<D3ChartProps>(ComponentName)
    : () => {
        throw new Error(LINKING_ERROR);
      };
