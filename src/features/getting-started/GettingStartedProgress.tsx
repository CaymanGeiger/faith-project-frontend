import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
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
  const progressValue = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    const animation = Animated.timing(progressValue, {
      toValue: progress,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    animation.start();
    return () => animation.stop();
  }, [progress, progressValue]);

  return (
    <View className="gap-3 px-1 pb-3 pt-2">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-base font-extrabold text-hercules-ink">
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
          style={{
            width: progressValue.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>
    </View>
  );
}
