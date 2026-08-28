import type { PropsWithChildren } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { colors } from '../../lib/theme/theme';

type AuthShellProps = PropsWithChildren<{
  title?: string;
  subtitle: string;
  variant?: 'login' | 'flow' | 'form';
  onBack?: () => void;
}>;

export function AuthShell({
  title,
  subtitle,
  variant = 'flow',
  onBack,
  children,
}: AuthShellProps) {
  const isCompactForm = variant === 'form';

  return (
    <View
      className={
        variant === 'login'
          ? 'pb-1 pt-[124px]'
          : variant === 'form'
            ? 'pb-1 pt-1'
            : 'pb-1 pt-[80px]'
      }
    >
      {isCompactForm ? (
        <>
          <View className="relative h-11 items-center justify-center">
            {onBack ? (
              <Pressable
                accessibilityLabel="Back to invitation code"
                accessibilityRole="button"
                onPress={onBack}
                hitSlop={10}
                className="absolute left-0 h-11 w-11 items-start justify-center"
              >
                <ChevronLeft size={28} color={colors.blue} strokeWidth={2.4} />
              </Pressable>
            ) : null}
            {title ? (
              <Text className="text-[17px] font-bold leading-6 text-hercules-ink">
                {title}
              </Text>
            ) : null}
          </View>
          <View className="mt-5 items-center">
            <Text className="max-w-[320px] text-center text-base font-medium leading-6 text-hercules-muted">
              {subtitle}
            </Text>
          </View>
        </>
      ) : (
        <View className="items-center">
          {title ? (
            <Text className="text-center text-[26px] font-extrabold leading-8 tracking-[-0.55px] text-hercules-ink">
              {title}
            </Text>
          ) : null}
          <Text className="mt-2 max-w-[320px] text-center text-base font-medium leading-6 text-hercules-muted">
            {subtitle}
          </Text>
        </View>
      )}

      <View className={`${isCompactForm ? 'mt-7' : 'mt-8'} items-center`}>
        <View className="w-full max-w-[360px]">{children}</View>
      </View>
    </View>
  );
}
