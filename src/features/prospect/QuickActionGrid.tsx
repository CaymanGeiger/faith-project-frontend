import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LucideIcon } from 'lucide-react-native';
import { colors } from '../../lib/theme/theme';

type Action = {
  label: string;
  href: string;
  icon: LucideIcon;
  tone: 'red' | 'blue';
};

type QuickActionGridProps = {
  actions: Action[];
};

export function QuickActionGrid({ actions }: QuickActionGridProps) {
  return (
    <View className="flex-row justify-between gap-3 border-y border-hercules-blue/10 py-5">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Pressable
            key={action.href}
            onPress={() => router.push(action.href)}
            className="flex-1 items-center gap-2 active:opacity-70"
          >
            <View
              className={`h-14 w-14 items-center justify-center rounded-[18px] ${
                action.tone === 'red' ? 'bg-hercules-red' : 'bg-hercules-blue'
              }`}
            >
              <Icon size={24} color={colors.white} strokeWidth={2.4} />
            </View>
            <Text numberOfLines={2} className="text-center text-xs font-extrabold leading-4 text-hercules-ink">
              {action.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
