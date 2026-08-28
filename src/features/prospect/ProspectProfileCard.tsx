import { Text, View } from 'react-native';
import { User } from '../../lib/api/types';

type ProspectProfileCardProps = {
  user: User;
  companyName?: string;
};

export function ProspectProfileCard({ user, companyName }: ProspectProfileCardProps) {
  return (
    <View className="gap-4 rounded-[20px] bg-hercules-red px-5 py-6">
      <View className="gap-2">
        <Text className="text-xs font-extrabold uppercase tracking-[0.8px] text-hercules-white/75">
          Hercules Honors Rewards
        </Text>
        <Text className="text-[28px] font-extrabold leading-8 tracking-[-0.35px] text-hercules-white">
          Welcome, {user.firstName}
        </Text>
        <Text className="text-base font-bold leading-5 text-hercules-white/90">
          Your path to becoming a successful LG Pro Dealer.
        </Text>
        {companyName ? (
          <Text className="text-sm font-semibold text-hercules-white/70">
            {companyName}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
