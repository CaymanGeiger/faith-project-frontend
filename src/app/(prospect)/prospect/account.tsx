import { Pressable, Text, View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { AsyncContent } from '../../../components/ui/AsyncContent';
import { PageHero } from '../../../components/ui/PageHero';
import { SkeletonReveal } from '../../../components/ui/SkeletonReveal';
import {
  SkeletonLine,
  SkeletonPrimaryButton,
  SkeletonTextField,
} from '../../../components/ui/SkeletonPrimitives';
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
  'w-[65px]',
] as const;

export default function ProspectAccountScreen() {
  const { user, logout, refreshMe } = useAuth();
  const account = useAsyncData(() => accountApi.me(), []);

  const signOut = async () => {
    await logout();
  };

  return (
    <AppScreen
      title="Profile"
      quickLinks={prospectQuickLinks}
      contentContainerClassName="gap-4 px-5 pb-6 pt-4"
    >
      <PageHero
        title="Your Profile"
        subtitle="Keep your business profile current."
        reveal={false}
      />
      {account.error && !account.data ? (
        <>
          <ErrorState message={account.error} onRetry={account.reload} />
          <AccountSignOut onPress={() => void signOut()} />
        </>
      ) : (
        <AsyncContent
          ready={Boolean(account.data)}
          fallback={<ProspectAccountSkeleton />}
          className="gap-3"
        >
          {account.data ? (
            <>
              <AnimatedCard>
                <AccountForm
                  user={account.data.user}
                  companyName={
                    account.data.user.prospectProfile?.companyName
                  }
                  onSaved={async () => {
                    await Promise.all([account.reload(), refreshMe()]);
                  }}
                />
              </AnimatedCard>
              {user ? (
                <AnimatedCard index={1}>
                  <AccountComplianceActions
                    user={user}
                    onDeleted={signOut}
                  />
                </AnimatedCard>
              ) : null}
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

function ProspectAccountSkeleton() {
  return (
    <SkeletonReveal label="Loading account" className="gap-3">
      <View className="gap-3 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-4">
        <SkeletonLine className="h-7 w-[111px]" />
        {accountSkeletonLabelWidths.map((labelWidthClassName, index) => (
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
