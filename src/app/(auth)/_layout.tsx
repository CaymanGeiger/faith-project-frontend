import { Redirect, Slot, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useAuth } from '../../features/auth/AuthProvider';
import { AuthViewportProvider } from '../../features/auth/AuthViewport';

export default function AuthLayout() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    Keyboard.dismiss();
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [pathname]);

  if (loading) {
    return <View className="flex-1 bg-hercules-white" />;
  }

  if (user) {
    return (
      <Redirect href={user.role === 'PROSPECT' ? '/prospect' : '/manager'} />
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className="flex-1 bg-hercules-white"
    >
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="flex-grow bg-hercules-white px-6 pt-10"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        >
          <AuthViewportProvider scrollRef={scrollRef}>
            <Slot />
          </AuthViewportProvider>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
