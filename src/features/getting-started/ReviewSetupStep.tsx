import {
  CalendarDays,
  CheckCircle2,
  Megaphone,
  PackageCheck,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';
import { useLayoutEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ClassSession, EquipmentRegistration, ProspectProfile, User } from '../../lib/api/types';
import { formatShortDate } from '../../lib/format';
import { colors } from '../../lib/theme/theme';
import { GettingStartedActionChange } from './gettingStarted';
import { GettingStartedStepCard } from './GettingStartedStepCard';

type ReviewSetupStepProps = {
  user: User & { prospectProfile?: ProspectProfile };
  equipment?: EquipmentRegistration;
  classSession?: ClassSession;
  warrantyComplete: boolean;
  marketingComplete: boolean;
  onEdit: (step: number) => void;
  onFinish: () => void;
  onActionChange: GettingStartedActionChange;
};

export function ReviewSetupStep({
  user,
  equipment,
  classSession,
  warrantyComplete,
  marketingComplete,
  onEdit,
  onFinish,
  onActionChange,
}: ReviewSetupStepProps) {
  useLayoutEffect(() => {
    onActionChange({
      label: 'Finish Setup',
      onPress: onFinish,
    });
  }, [onActionChange, onFinish]);

  return (
    <GettingStartedStepCard
      icon={CheckCircle2}
      title="Review Your Dealer Setup"
      description="Everything collected here is saved to your Hercules onboarding record. Review any item before finishing."
    >
      <View className="gap-3">
        <ReviewRow
          icon={UserRound}
          title="Business Profile"
          detail={`${user.firstName} ${user.lastName} · ${user.prospectProfile?.companyName ?? 'Company needed'}`}
          complete={Boolean(user.phone && user.prospectProfile?.companyName)}
          onPress={() => onEdit(0)}
        />
        <ReviewRow
          icon={PackageCheck}
          title="Equipment"
          detail={equipment ? `${equipment.equipmentName} · ${equipment.modelNumber}` : 'Registration needed'}
          complete={Boolean(equipment)}
          onPress={() => onEdit(1)}
        />
        <ReviewRow
          icon={CalendarDays}
          title="Certification"
          detail={classSession ? `${classSession.title} · ${formatShortDate(classSession.startsAt)}` : 'Class needed'}
          complete={Boolean(classSession)}
          onPress={() => onEdit(2)}
        />
        <ReviewRow
          icon={ShieldCheck}
          title="JB Warranties"
          detail={warrantyComplete ? 'Signup confirmed' : 'Confirmation needed'}
          complete={warrantyComplete}
          onPress={() => onEdit(3)}
        />
        <ReviewRow
          icon={Megaphone}
          title="Marketing Consultation"
          detail={marketingComplete ? 'Availability submitted' : 'Availability needed'}
          complete={marketingComplete}
          onPress={() => onEdit(4)}
        />
      </View>
    </GettingStartedStepCard>
  );
}

type ReviewRowProps = {
  icon: typeof UserRound;
  title: string;
  detail: string;
  complete: boolean;
  onPress: () => void;
};

function ReviewRow({ icon: Icon, title, detail, complete, onPress }: ReviewRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Edit ${title}`}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-[18px] border border-hercules-blue/20 bg-hercules-white p-4 active:opacity-80"
    >
      <View className={`h-10 w-10 items-center justify-center rounded-full ${complete ? 'bg-hercules-blue' : 'bg-hercules-red'}`}>
        <Icon size={19} color={colors.white} strokeWidth={2.5} />
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-base font-extrabold text-hercules-ink">{title}</Text>
        <Text className="text-sm leading-5 text-hercules-muted">{detail}</Text>
      </View>
      <Text className="text-xs font-extrabold text-hercules-blue">Edit</Text>
    </Pressable>
  );
}
