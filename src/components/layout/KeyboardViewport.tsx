import { useCallback, useRef, useState, type PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, View, type ViewInstance } from 'react-native';

/** Keep scrolling content and its footer in one keyboard-safe viewport. */
export function KeyboardViewport({ children }: PropsWithChildren) {
  const container = useRef<ViewInstance>(null);
  const [screenTop, setScreenTop] = useState(0);
  const measure = useCallback(() => {
    container.current?.measureInWindow((_x, y) => setScreenTop(y));
  }, []);

  return (
    <View ref={container} collapsable={false} onLayout={measure} className="flex-1">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={screenTop}
      >
        {children}
      </KeyboardAvoidingView>
    </View>
  );
}
