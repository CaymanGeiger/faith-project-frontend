import { PropsWithChildren } from 'react';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppLogo } from '../../components/ui/AppLogo';

type AuthShellProps = PropsWithChildren<{
  title: string;
  subtitle: string;
}>;

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <SafeAreaView className="flex-1 bg-hercules-white">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="flex-grow justify-center gap-6 bg-hercules-white px-5 py-8"
        >
          <View className="items-center gap-3">
            <AppLogo size="auth" />
            <Text className="text-center text-3xl font-extrabold text-hercules-ink">
              {title}
            </Text>
            <Text className="text-center text-base font-semibold text-hercules-muted">
              {subtitle}
            </Text>
          </View>
          <View className="gap-4 rounded-[24px] border border-hercules-blue/20 bg-hercules-white p-5">
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
