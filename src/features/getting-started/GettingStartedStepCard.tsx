import { PropsWithChildren } from 'react';
import { LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';
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
    <View className="gap-4 rounded-[22px] border border-hercules-blue/20 bg-hercules-white p-4">
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-hercules-red">
          <Icon size={20} color={colors.white} strokeWidth={2.5} />
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-xl font-extrabold leading-6 text-hercules-ink">
            {title}
          </Text>
          <Text className="text-sm font-semibold leading-5 text-hercules-muted">
            {description}
          </Text>
        </View>
      </View>
      {children}
    </View>
  );
}
