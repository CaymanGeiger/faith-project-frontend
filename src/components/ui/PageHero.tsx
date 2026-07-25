import { Text, View } from 'react-native';
import { AnimatedCard } from './AnimatedCard';

type PageHeroProps = {
  title: string;
  subtitle?: string;
};

export function PageHero({
  title,
  subtitle,
}: PageHeroProps) {
  return (
    <AnimatedCard className="px-1 pb-1 pt-2">
      <View className="gap-1.5">
        <Text className="text-3xl font-extrabold leading-9 text-hercules-ink">
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
