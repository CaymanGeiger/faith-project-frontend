import { Easing as NativeEasing } from 'react-native';
import { Easing, ReduceMotion } from 'react-native-reanimated';
import { motionConfig } from './motionConfig';
const config = motionConfig.feedback;

const easing = {
  enter: Easing.bezier(...config.easing.enter),
  exit: Easing.bezier(...config.easing.exit),
  cubicOut: Easing.out(Easing.cubic),
  cubicInOut: Easing.inOut(Easing.cubic),
};
const nativeEasing = {
  easeInOut: NativeEasing.inOut(NativeEasing.ease),
};

export const feedbackTiming = {
  pressIn: {
    duration: config.press.inDuration,
    easing: easing[config.press.inEasing],
    reduceMotion: ReduceMotion.System,
  },
  pressOut: {
    duration: config.press.outDuration,
    easing: easing[config.press.outEasing],
    reduceMotion: ReduceMotion.System,
  },
  loading: {
    duration: config.loading.duration,
    easing: easing[config.loading.easing],
    reduceMotion: ReduceMotion.System,
  },
  focus: {
    duration: config.input.duration,
    easing: easing[config.input.focusEasing],
    reduceMotion: ReduceMotion.System,
  },
  blur: {
    duration: config.input.duration,
    easing: easing[config.input.blurEasing],
    reduceMotion: ReduceMotion.System,
  },
  navigation: {
    duration: config.navigation.duration,
    easing: easing[config.navigation.easing],
    reduceMotion: ReduceMotion.System,
  },
  progress: {
    duration: config.progressBar.duration,
    easing: easing[config.progressBar.easing],
    reduceMotion: ReduceMotion.System,
  },
} as const;

// React Native's default timing easing, made explicit to preserve the reveal.
export const skeletonRevealTiming = {
  toValue: config.opacity.visible,
  duration: config.skeleton.duration,
  easing: nativeEasing[config.skeleton.easing],
  useNativeDriver: true,
} as const;

export function brandLaunchTiming(reduceMotion: boolean) {
  const duration = (value: number) =>
    reduceMotion ? config.launch.reducedDuration : value;
  return {
    intro: {
      duration: duration(config.launch.intro.duration),
      easing: easing[config.launch.intro.easing],
    },
    accent: {
      duration: duration(config.launch.accent.duration),
      easing: easing[config.launch.accent.easing],
    },
    pulse: {
      duration: config.launch.pulse.duration,
      easing: easing[config.launch.pulse.easing],
    },
    exit: {
      duration: duration(config.launch.exit.duration),
      easing: easing[config.launch.exit.easing],
    },
  };
}
