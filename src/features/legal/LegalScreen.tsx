import { Children, type PropsWithChildren } from 'react';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../lib/theme/theme';
import { PageEntrance } from '../../components/layout/PageEntrance';
import { AnimatedCard } from '../../components/ui/AnimatedCard';

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
    <SafeAreaView className="flex-1 bg-hercules-white" edges={Platform.OS === 'android' ? ['top', 'bottom', 'left', 'right'] : ['top', 'left', 'right']}>
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
      <PageEntrance className="flex-1">
        <ScrollView
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          className="flex-1"
          contentContainerClassName="gap-5 px-5 pb-10 pt-6"
        >
          {Children.map(children, (child, index) => child == null ? null : (
            <AnimatedCard index={index}>{child}</AnimatedCard>
          ))}
        </ScrollView>
      </PageEntrance>
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
