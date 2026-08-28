import { Pressable, Text, View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { managerQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { AsyncContent } from '../../../components/ui/AsyncContent';
import { PageHero } from '../../../components/ui/PageHero';
import {
  SkeletonLine,
  SkeletonPrimaryButton,
  SkeletonTextField,
} from '../../../components/ui/SkeletonPrimitives';
import { SkeletonReveal } from '../../../components/ui/SkeletonReveal';
import { ErrorState } from '../../../components/ui/StateViews';
import { AccountForm } from '../../../features/account/AccountForm';
import { AccountComplianceActions } from '../../../features/account/AccountComplianceActions';
import { useAuth } from '../../../features/auth/AuthProvider';
import { accountApi } from '../../../lib/api/endpoints';
import { useAsyncData } from '../../../lib/hooks/useAsyncData';

const accountSkeletonLabelWidths = [
  'w-[37px]',
  'w-[75px]',
  'w-[73px]',
  'w-[43px]',
] as const;

export default function ManagerAccountScreen() {
  const { user, logout, refreshMe } = useAuth();
  const account = useAsyncData(() => accountApi.me(), []);
  const accountUser = account.data?.user ?? user;

  const signOut = async () => {
    await logout();
  };

  return (
    <AppScreen
      title="Account"
      quickLinks={managerQuickLinks}
      contentContainerClassName="gap-4 px-5 pb-6 pt-4"
    >
      <PageHero
        title="Your Account"
        subtitle="Keep your contact details current."
        reveal={false}
      />
      {account.error && !accountUser ? (
        <>
          <ErrorState message={account.error} onRetry={account.reload} />
          <AccountSignOut onPress={() => void signOut()} />
        </>
      ) : (
        <AsyncContent
          ready={Boolean(accountUser)}
          fallback={<ManagerAccountSkeleton />}
          className="gap-3"
        >
          {accountUser ? (
            <>
              <AnimatedCard>
                <AccountForm
                  user={accountUser}
                  onSaved={async () => {
                    await Promise.all([account.reload(), refreshMe()]);
                  }}
                />
              </AnimatedCard>
              <AnimatedCard index={1}>
                <AccountComplianceActions
                  user={accountUser}
                  onDeleted={signOut}
                />
              </AnimatedCard>
              <AccountSignOut
                index={2}
                onPress={() => void signOut()}
              />
            </>
          ) : null}
        </AsyncContent>
      )}
    </AppScreen>
  );
}

function ManagerAccountSkeleton() {
  return (
    <SkeletonReveal label="Loading account" className="gap-3">
      <View className="gap-3 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-4">
        <SkeletonLine className="h-7 w-[111px]" />
        {accountSkeletonLabelWidths.map((labelWidthClassName, index) => (
          <SkeletonTextField
            key={`manager-account-field-skeleton-${index}`}
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

function AccountSignOut({
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
