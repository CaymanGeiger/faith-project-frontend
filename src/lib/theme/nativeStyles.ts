import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';
import { colors, shades, surfaces } from './theme';

/** Static native layouts shared across app surfaces. Dynamic insets and measured sizes stay with their components. */
export const nativeMeasurements = {
  quickLinks: { width: 280, rowGap: 8, padding: 8 },
  bottomNav: { verticalOffset: 6, dockHeight: 68, topSpacing: 8, minimumBottomInset: 12 },
} as const;

const absoluteFill = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const;

export const nativeStyles = {
  contentViewer: {
    root: { flex: 1, width: '100%', maxWidth: 1100, alignSelf: 'center', backgroundColor: colors.white },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
    iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
    pressed: { opacity: 0.6, backgroundColor: shades.pressedSurface },
    heading: { flex: 1, minWidth: 0, gap: 4 },
    title: { fontSize: 16, fontWeight: '800', color: colors.ink },
    host: { fontSize: 12, color: colors.muted },
    track: { height: 3, backgroundColor: shades.progressTrack },
    progress: { height: 3, backgroundColor: colors.red },
    body: { flex: 1 },
    document: { flex: 1 },
    overlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: colors.white, padding: 24, justifyContent: 'center', alignItems: 'center' },
    loadingCard: { alignItems: 'center', gap: 14 },
    stateTitle: { color: colors.ink, fontSize: 22, fontWeight: '800', textAlign: 'center' },
    stateText: { color: colors.muted, fontSize: 16, lineHeight: 24, textAlign: 'center' },
    skeleton: { width: '100%', maxWidth: 420, marginTop: 40, gap: 14 },
    skeletonLine: { height: 14, borderRadius: 7, backgroundColor: surfaces.skeletonLine },
    skeletonBlock: { height: 132, borderRadius: 22, backgroundColor: surfaces.skeletonBlock, marginTop: 10 },
    errorCard: { maxWidth: 420, alignItems: 'center', gap: 18 },
    retry: { minHeight: 48, borderRadius: 16, backgroundColor: colors.blue, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 10 },
    retryText: { fontSize: 16, fontWeight: '700', color: colors.white },
    webHint: { padding: 12, fontSize: 13, color: colors.muted, textAlign: 'center', backgroundColor: surfaces.skeletonBlock },
  },
  pdfDocument: {
    container: { flex: 1, backgroundColor: surfaces.document },
    document: { flex: 1, width: '100%', backgroundColor: surfaces.document },
    controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderColor: surfaces.documentBorder, backgroundColor: colors.white },
    pageButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: surfaces.document },
    disabled: { opacity: 0.35 },
    pageDetails: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
    pageLabel: { color: colors.ink, fontSize: 14, fontWeight: '700' },
    hint: { color: colors.muted, fontSize: 12, marginTop: 3 },
  },
  bottomNav: {
    overlay: { position: 'absolute', bottom: 0, left: 0, right: 0 },
    tintedBackdrop: {
      ...absoluteFill,
      top: nativeMeasurements.bottomNav.topSpacing + nativeMeasurements.bottomNav.verticalOffset,
      overflow: 'hidden',
    },
    dock: {
      transform: [{ translateY: nativeMeasurements.bottomNav.verticalOffset }],
      elevation: 9,
      shadowColor: colors.blue,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 18,
    },
    tabSurface: {
      borderRadius: 20,
      flex: 1,
      overflow: 'hidden',
    },
  },
  appHeader: {
    titleLayer: { ...absoluteFill, alignItems: 'center', justifyContent: 'center' },
    centerSlot: {
      height: 44,
      position: 'absolute',
      top: 0,
      left: 44,
      right: 44,
    },
    overlayRoot: {
      flex: 1,
    },
    overlayScrim: {
      backgroundColor: shades.softBorder,
    },
  },
  quickLinks: {
    panel: {
      position: 'absolute',
      width: nativeMeasurements.quickLinks.width,
      left: 16,
    },
    panelContent: {
      gap: nativeMeasurements.quickLinks.rowGap,
      padding: nativeMeasurements.quickLinks.padding,
    },
  },
  notifications: {
    panel: {
      position: 'absolute',
      left: 16,
      right: 16,
      zIndex: 40,
      maxHeight: 460,
    },
    notificationGroup: {
      borderColor: shades.softBorder,
      borderRadius: 20,
      borderWidth: 1,
      overflow: 'hidden',
    },
  },
  floatingPanel: {
    shell: {
      borderRadius: 28,
      elevation: 9,
      shadowColor: colors.blue,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 18,
    },
    surface: {
      backgroundColor: colors.white,
      borderColor: shades.border,
      borderRadius: 28,
      borderWidth: 1,
      overflow: 'hidden',
    },
  },
  branding: {
    image: {
      height: '100%',
      width: '100%',
    },
  },
  heroSparkles: {
    layer: {
      ...absoluteFill,
    },
    left: {
      position: 'absolute',
      left: 30,
      top: 28,
    },
    leftSmall: {
      position: 'absolute',
      left: 68,
      top: 8,
    },
    right: {
      position: 'absolute',
      right: 32,
      top: 22,
    },
  },
  brandLaunch: {
    overlay: {
      ...absoluteFill,
      alignItems: 'center',
      backgroundColor: colors.white,
      justifyContent: 'center',
      zIndex: 1000,
    },
    stage: {
      height: 172,
      position: 'relative',
      width: 312,
    },
    logoFrame: {
      height: 67,
      left: 30,
      position: 'absolute',
      top: 52.5,
      width: 252,
    },
    logo: {
      height: '100%',
      width: '100%',
    },
    details: {
      alignItems: 'center',
      left: 0,
      position: 'absolute',
      right: 0,
      top: 106,
    },
    title: {
      color: colors.blue,
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: 2.15,
      lineHeight: 20,
    },
    subtitle: {
      color: colors.red,
      fontSize: 9.5,
      fontWeight: '700',
      letterSpacing: 1.05,
      lineHeight: 15,
      marginTop: 1,
    },
    accentRow: {
      flexDirection: 'row',
      gap: 5,
      marginTop: 12,
    },
    accent: {
      borderRadius: 999,
      height: 3,
      width: 54,
    },
    redAccent: {
      backgroundColor: colors.red,
    },
    blueAccent: {
      backgroundColor: colors.blue,
    },
  },
  messageThread: {
    listContent: {
      gap: 20,
      paddingVertical: 12,
    },
  },
  gettingStarted: {
    actionBar: {
      shadowColor: surfaces.actionShadow,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 10,
    },
    backIcon: {
      position: 'absolute',
      left: 18,
    },
  },
} as const satisfies Record<string, Record<string, ViewStyle | TextStyle | ImageStyle>>;
