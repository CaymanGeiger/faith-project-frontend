import {
  Easing,
  Keyframe,
  LinearTransition,
  ReduceMotion,
} from 'react-native-reanimated';

import { motionConfig } from './motionConfig';
export { motionConfig } from './motionConfig';

export const motionDuration = motionConfig.duration;
export const motionEasing = {
  enter: Easing.bezier(...motionConfig.easing.enter),
  exit: Easing.bezier(...motionConfig.easing.exit),
};
export const drawerMotion = {
  ...motionConfig.drawer,
  opacityInput: [...motionConfig.drawer.opacityInput],
  opacityOutput: [...motionConfig.drawer.opacityOutput],
  enter: { duration: motionConfig.drawer.enterDuration, easing: motionEasing.enter, reduceMotion: ReduceMotion.System },
  exit: { duration: motionConfig.drawer.exitDuration, easing: motionEasing.exit, reduceMotion: ReduceMotion.System },
};
export const contentViewerMotion = {
  ...motionConfig.contentViewer,
  enter: { duration: motionConfig.contentViewer.enterDuration, easing: motionEasing.enter, reduceMotion: ReduceMotion.System },
  exit: { duration: motionConfig.contentViewer.exitDuration, easing: motionEasing.exit, reduceMotion: ReduceMotion.System },
};

export const standardLayoutTransition = LinearTransition.duration(
  motionDuration.layout,
)
  .easing(motionEasing.enter)
  .reduceMotion(ReduceMotion.System);

export const pageEnterMotion = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ translateX: motionConfig.page.offsetX }, { translateY: motionConfig.page.offsetY }],
  },
  100: {
    opacity: 1,
    transform: [{ translateX: 0 }, { translateY: 0 }],
    easing: motionEasing.enter,
  },
})
  .duration(motionConfig.page.duration)
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

export const cardRevealAnimations = Array.from({ length: motionConfig.card.variants }, (_, index) =>
  new Keyframe({
    0: {
      opacity: 0,
      transform: [{ translateX: motionConfig.card.offsetX }, { translateY: motionConfig.card.offsetY }],
    },
    100: {
      opacity: 1,
      transform: [{ translateX: 0 }, { translateY: 0 }],
      easing: motionEasing.enter,
    },
  })
    .duration(motionConfig.card.duration)
    .delay(index * motionConfig.card.stagger)
    .reduceMotion(ReduceMotion.System),
);

export function cardRevealForIndex(index: number) {
  return cardRevealAnimations[Math.min(Math.max(index, 0), motionConfig.card.variants - 1)];
}
