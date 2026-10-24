import { Pressable, Text, View } from 'react-native';
import { AnimatedCard } from '../../components/ui/AnimatedCard';
import {
  SkeletonLine,
  SkeletonPrimaryButton,
  SkeletonTextField,
} from '../../components/ui/SkeletonPrimitives';
import { SkeletonReveal } from '../../components/ui/SkeletonReveal';

const accountFieldLabelWidths = [
  'w-[37px]',
  'w-[75px]',
  'w-[73px]',
  'w-[43px]',
] as const;

export function AccountSkeleton({ includeCompany = false }: { includeCompany?: boolean }) {
  const labelWidths = includeCompany
    ? [...accountFieldLabelWidths, 'w-[65px]']
    : accountFieldLabelWidths;

  return (
    <SkeletonReveal label="Loading account" className="gap-3">
      <View className="gap-3 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-4">
        <SkeletonLine className="h-7 w-[111px]" />
        {labelWidths.map((labelWidthClassName, index) => (
          <SkeletonTextField
            key={`account-field-skeleton-${index}`}
            labelWidthClassName={labelWidthClassName}
            compact
          />
        ))}
        <SkeletonPrimaryButton />
      </View>
      <View className="items-center">
        <View className="py-1.5">
          <View className="h-5 w-[54px] rounded-full bg-hercules-red/15" />
        </View>
      </View>
    </SkeletonReveal>
  );
}

export function AccountSignOut({
  index = 0,
  onPress,
}: {
  index?: number;
  onPress: () => void;
}) {
  return (
    <AnimatedCard index={index} className="items-center">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        onPress={onPress}
        className="py-1.5 active:opacity-70"
      >
        <Text className="text-sm font-extrabold text-hercules-red">
          Sign Out
        </Text>
      </Pressable>
    </AnimatedCard>
  );
}
