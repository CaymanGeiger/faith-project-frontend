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
    <AnimatedCard
      className="border-b border-hercules-blue/15 px-1 pb-6 pt-2"
    >
      <View className="gap-2">
        <Text className="text-[32px] font-extrabold leading-[38px] tracking-[-0.7px] text-hercules-ink">
          {title}
        </Text>
        {subtitle ? (
          <Text className="max-w-[330px] text-[15px] font-medium leading-5 text-hercules-muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
    </AnimatedCard>
  );
}
