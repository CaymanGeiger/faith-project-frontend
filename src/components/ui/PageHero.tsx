import { LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { colors } from '../../lib/theme/theme';
import { AnimatedCard } from './AnimatedCard';

type PageHeroProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  tone?: 'red' | 'blue';
};

export function PageHero({
  icon: Icon,
  title,
  subtitle,
  tone = 'red',
}: PageHeroProps) {
  const iconBackground = tone === 'blue' ? 'bg-hercules-blue' : 'bg-hercules-red';

  return (
    <AnimatedCard className="flex-row items-center gap-4 rounded-[24px] border border-hercules-blue/20 bg-hercules-white px-5 py-4">
      <View
        className={`h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full ${iconBackground}`}
      >
        <Icon size={25} color={colors.white} strokeWidth={2.4} />
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-2xl font-extrabold leading-7 text-hercules-ink">
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-sm font-semibold leading-5 text-hercules-muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
    </AnimatedCard>
  );
}
