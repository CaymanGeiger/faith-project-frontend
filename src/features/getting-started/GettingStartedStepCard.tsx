import { PropsWithChildren } from 'react';
import { LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { AnimatedCard } from '../../components/ui/AnimatedCard';
import { colors } from '../../lib/theme/theme';

type GettingStartedStepCardProps = PropsWithChildren<{
  icon: LucideIcon;
  title: string;
  description: string;
}>;

export function GettingStartedStepCard({
  icon: Icon,
  title,
  description,
  children,
}: GettingStartedStepCardProps) {
  return (
    <AnimatedCard index={1} className="gap-5 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-5">
      <View className="gap-1">
        <View className="flex-row items-start gap-3">
          <Text className="min-w-0 flex-1 text-xl font-extrabold leading-6 text-hercules-ink">
            {title}
          </Text>
          <View className="h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-hercules-red">
            <Icon size={20} color={colors.white} strokeWidth={2.5} />
          </View>
        </View>
        <Text className="text-sm leading-5 text-hercules-muted">
          {description}
        </Text>
      </View>
      {children}
    </AnimatedCard>
  );
}
