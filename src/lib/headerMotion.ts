import { Easing, FadeIn, FadeInDown, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { motionConfig } from './motionConfig';
export const headerMotionConfig = motionConfig.header;



const { duration } = headerMotionConfig;
const enterEasing = Easing.bezier(...headerMotionConfig.easing.enter);
const exitEasing = Easing.bezier(...headerMotionConfig.easing.exit);
const namedEasing = {
  cubicOut: Easing.out(Easing.cubic),
  cubicInOut: Easing.inOut(Easing.cubic),
  linear: Easing.linear,
};

export const headerMotion = {
  titleEnter: FadeIn.duration(duration.titleEnter).reduceMotion(ReduceMotion.System),
  titleExit: FadeOut.duration(duration.titleExit).reduceMotion(ReduceMotion.System),
  scrimEnter: FadeIn.duration(duration.scrimEnter).reduceMotion(ReduceMotion.System),
  scrimExit: FadeOut.duration(duration.scrimExit).reduceMotion(ReduceMotion.System),
  notificationsEnter: FadeInDown
    .withInitialValues({
      opacity: 0,
      transform: [{ translateY: headerMotionConfig.notifications.initialTranslateY }],
    })
    .duration(duration.notificationsEnter)
    .easing(namedEasing[headerMotionConfig.easing.notificationsEnter])
    .reduceMotion(ReduceMotion.System),
  notificationsExit: FadeOut.duration(duration.notificationsExit)
    .easing(namedEasing[headerMotionConfig.easing.notificationsExit])
    .reduceMotion(ReduceMotion.System),
  quickLinksEnter: {
    duration: duration.quickLinksEnter,
    easing: enterEasing,
    reduceMotion: ReduceMotion.System,
  },
  quickLinksExit: {
    duration: duration.quickLinksExit,
    easing: exitEasing,
    reduceMotion: ReduceMotion.System,
  },
  control: {
    duration: duration.control,
    easing: enterEasing,
    reduceMotion: ReduceMotion.System,
  },
  spinner: {
    duration: duration.spinnerRotation,
    easing: namedEasing[headerMotionConfig.easing.spinner],
    reduceMotion: ReduceMotion.Never,
  },
  // The native overlay must remain mounted until every child exit has finished.
  overlayExitDuration: Math.max(
    duration.scrimExit,
    duration.quickLinksExit,
    duration.notificationsExit,
  ),
} as const;
