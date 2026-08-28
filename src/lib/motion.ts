import {
  Easing,
  Keyframe,
  LinearTransition,
  ReduceMotion,
} from 'react-native-reanimated';

export const motionDuration = {
  pressIn: 75,
  micro: 130,
  subtleEnter: 156,
  exit: 120,
  enter: 216,
  layout: 200,
} as const;

export const motionEasing = {
  enter: Easing.bezier(0.16, 1, 0.3, 1),
  exit: Easing.bezier(0.4, 0, 1, 1),
} as const;

export const authMotion = {
  forwardIn: new Keyframe({
    0: {
      opacity: 0,
      transform: [{ translateX: 20 }],
    },
    100: {
      opacity: 1,
      transform: [{ translateX: 0 }],
      easing: motionEasing.enter,
    },
  })
    .duration(204)
    .reduceMotion(ReduceMotion.System),
  backIn: new Keyframe({
    0: {
      opacity: 0,
      transform: [{ translateX: -18 }],
    },
    100: {
      opacity: 1,
      transform: [{ translateX: 0 }],
      easing: motionEasing.enter,
    },
  })
    .duration(motionDuration.enter)
    .reduceMotion(ReduceMotion.System),
} as const;

export const standardLayoutTransition = LinearTransition.duration(
  motionDuration.layout,
)
  .easing(motionEasing.enter)
  .reduceMotion(ReduceMotion.System);

export const pageEnterMotion = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ translateX: 8 }, { translateY: 6 }],
  },
  100: {
    opacity: 1,
    transform: [{ translateX: 0 }, { translateY: 0 }],
    easing: motionEasing.enter,
  },
})
  .duration(252)
  .reduceMotion(ReduceMotion.System);

export const asyncContentRevealMotion = new Keyframe({
  0: {
    opacity: 0,
  },
  100: {
    opacity: 1,
    easing: motionEasing.enter,
  },
})
  .duration(motionDuration.subtleEnter)
  .reduceMotion(ReduceMotion.System);

export const asyncContentExitMotion = new Keyframe({
  0: {
    opacity: 1,
  },
  100: {
    opacity: 0,
    easing: motionEasing.exit,
  },
})
  .duration(motionDuration.exit)
  .reduceMotion(ReduceMotion.System);

export const asyncFallbackRevealMotion = new Keyframe({
  0: {
    opacity: 0,
  },
  100: {
    opacity: 1,
    easing: motionEasing.enter,
  },
})
  .duration(motionDuration.subtleEnter)
  .reduceMotion(ReduceMotion.System);

export const cardRevealAnimations = [0, 1, 2, 3, 4].map((index) =>
  new Keyframe({
    0: {
      opacity: 0,
      transform: [{ translateX: 4 }, { translateY: 7 }],
    },
    100: {
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }],
      easing: motionEasing.enter,
    },
  })
    .duration(228)
    .delay(index * 22)
    .reduceMotion(ReduceMotion.System),
);

export function cardRevealForIndex(index: number) {
  return cardRevealAnimations[Math.min(Math.max(index, 0), 4)];
}
