import { Text, View } from 'react-native';
import { Building2 } from 'lucide-react-native';
import { colors } from '../../lib/theme/theme';
import { User } from '../../lib/api/types';

type ProspectProfileCardProps = {
  user: User;
  companyName?: string;
};

export function ProspectProfileCard({ user, companyName }: ProspectProfileCardProps) {
  return (
    <View className="gap-4 rounded-[24px] bg-hercules-red p-5">
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 gap-2">
          <Text className="text-sm font-bold text-hercules-white/80">
            Hercules LG Dealer
          </Text>
          <Text className="text-3xl font-extrabold text-hercules-white">
            {user.firstName} {user.lastName}
          </Text>
          <Text className="text-base font-bold text-hercules-white/90">
            {companyName ?? 'LG Pro Dealer Prospect'}
          </Text>
        </View>
        <View className="h-16 w-16 items-center justify-center rounded-full bg-hercules-white/20">
          <Building2 size={30} color={colors.white} strokeWidth={2.4} />
        </View>
      </View>
    </View>
  );
}
