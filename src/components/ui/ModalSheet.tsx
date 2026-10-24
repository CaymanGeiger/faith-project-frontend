import { useRef } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useDrawerMotion } from '../../lib/hooks/useDrawerMotion';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { motionConfig } from '../../lib/motionConfig';
import { colors } from '../../lib/theme/theme';
import { componentStyles } from '../../lib/theme/componentStyles';

const drawerStyles = componentStyles.drawer;

type ModalSheetProps = PropsWithChildren<{
  visible: boolean;
  title: string;
  titleContent?: ReactNode;
  avoidKeyboard?: boolean;
  onClose: () => void;
  onDismissed?: () => void;
}>;

export function ModalSheet({
  visible,
  title,
  titleContent,
  avoidKeyboard = false,
  onClose,
  onDismissed,
  children,
}: ModalSheetProps) {
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === 'android';
  const { mounted, backdropStyle, sheetStyle } = useDrawerMotion(visible, onDismissed);
  const displayedTitle = useRef(title);
  const displayedTitleContent = useRef(titleContent);
  const displayedChildren = useRef(children);

  if (visible) {
    displayedTitle.current = title;
    displayedTitleContent.current = titleContent;
    displayedChildren.current = children;
  }

  if (!mounted) {
    return null;
  }

  return (
    <Modal
      visible={mounted}
      animationType={motionConfig.native.modalAnimation}
      transparent
      statusBarTranslucent={isAndroid ? true : undefined}
      navigationBarTranslucent={isAndroid ? true : undefined}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        enabled={avoidKeyboard && !isAndroid}
        behavior="padding"
        className={drawerStyles.root}
        style={isAndroid ? { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right } : undefined}
      >
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
        />
        <Pressable
          pointerEvents={visible ? 'auto' : 'none'}
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <Animated.View
          accessibilityViewIsModal
          importantForAccessibility="yes"
          pointerEvents={visible ? 'auto' : 'none'}
          style={[
            styles.sheet,
            sheetStyle,
            isAndroid ? { paddingBottom: Math.max(insets.bottom, drawerStyles.minimumBottomPadding) } : undefined,
          ]}
          className={drawerStyles.surface}
        >
          <View className={drawerStyles.header}>
            {displayedTitleContent.current ?? <Text
              accessibilityRole="header"
              numberOfLines={1}
              className={drawerStyles.title}
            >
              {displayedTitle.current}
            </Text>}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={drawerStyles.closeHitSlop}
              onPress={onClose}
              style={styles.closeButton}
              className={drawerStyles.closeButton}
            >
              <X size={drawerStyles.closeIconSize} color={colors.ink} />
            </Pressable>
          </View>
          {displayedChildren.current}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create(drawerStyles.native);
