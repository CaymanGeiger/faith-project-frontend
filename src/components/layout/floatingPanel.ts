import { StyleSheet } from 'react-native';
import { colors } from '../../lib/theme/theme';

/** Shared surface treatment for header popovers and the floating navigation dock. */
export const floatingPanelStyles = StyleSheet.create({
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
    borderColor: 'rgba(10, 45, 127, 0.15)',
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
