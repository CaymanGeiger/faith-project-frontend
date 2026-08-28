import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { motionDuration, motionEasing } from '../../lib/motion';
import { gettingStartedSteps } from './gettingStarted';

type GettingStartedProgressProps = {
  currentStep: number;
};

export function GettingStartedProgress({
  currentStep,
}: GettingStartedProgressProps) {
  const setupStepCount = gettingStartedSteps.length - 1;
  const isReviewStep = currentStep >= setupStepCount;
  const activeStep = Math.min(currentStep + 1, setupStepCount);
  const progress = activeStep / setupStepCount;
  const progressValue = useSharedValue(progress);

  useEffect(() => {
    progressValue.value = withTiming(progress, {
      duration: motionDuration.layout,
      easing: motionEasing.enter,
      reduceMotion: ReduceMotion.System,
    });
  }, [progress, progressValue]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  return (
    <View className="gap-3 border-b border-hercules-blue/15 px-1 pb-5 pt-2">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-base font-extrabold tracking-[-0.1px] text-hercules-ink">
          Getting Started
        </Text>
        <Text className="text-sm font-extrabold text-hercules-blue">
          {isReviewStep
            ? 'Review & Finish'
            : `Step ${activeStep} of ${setupStepCount}`}
        </Text>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={`Getting Started: ${isReviewStep ? 'review and finish' : `step ${activeStep} of ${setupStepCount}`}`}
        accessibilityValue={{ min: 0, max: setupStepCount, now: activeStep }}
        className="h-2.5 overflow-hidden rounded-pill bg-hercules-blue/15"
      >
        <Animated.View
          className="h-full rounded-pill bg-hercules-blue"
          style={progressStyle}
        />
      </View>
    </View>
  );
}
