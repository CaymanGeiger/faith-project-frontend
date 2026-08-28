import type { PropsWithChildren } from 'react';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../lib/theme/theme';

type LegalScreenProps = PropsWithChildren<{
  title: string;
  eyebrow?: string;
}>;

export function LegalScreen({
  title,
  eyebrow = 'Hercules Honors Rewards',
  children,
}: LegalScreenProps) {
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-hercules-white" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center border-b border-hercules-blue/10 px-5 py-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={goBack}
          className="h-11 w-11 items-start justify-center"
        >
          <ChevronLeft size={28} color={colors.blue} strokeWidth={2.4} />
        </Pressable>
        <View className="flex-1 pr-11">
          <Text className="text-xs font-extrabold uppercase tracking-[1px] text-hercules-red">
            {eyebrow}
          </Text>
          <Text className="mt-0.5 text-xl font-extrabold text-hercules-ink">
            {title}
          </Text>
        </View>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-5 pb-10 pt-6"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function LegalSection({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <View className="gap-2">
      <Text className="text-lg font-extrabold text-hercules-ink">{title}</Text>
      {children}
    </View>
  );
}

export function LegalCopy({ children }: PropsWithChildren) {
  return (
    <Text className="text-[15px] leading-6 text-hercules-muted">{children}</Text>
  );
}
