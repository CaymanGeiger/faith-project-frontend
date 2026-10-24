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
  canFinish: boolean;
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
  canFinish,
  onEdit,
  onFinish,
  onActionChange,
}: ReviewSetupStepProps) {
  useLayoutEffect(() => {
    onActionChange({
      label: 'Finish Getting Started',
      onPress: onFinish,
      disabled: !canFinish,
    });
  }, [canFinish, onActionChange, onFinish]);

  return (
    <GettingStartedStepCard
      icon={CheckCircle2}
      title="Review Getting Started"
      description="Everything collected here is saved to your Hercules onboarding record. Review any milestone before finishing."
    >
      <View className="gap-3">
        <ReviewRow
          icon={UserRound}
          title="Business Profile"
          detail={`${user.firstName} ${user.lastName} · ${user.prospectProfile?.companyName ?? 'Company needed'}`}
          complete={Boolean(user.prospectProfile?.companyName)}
          onPress={() => onEdit(0)}
        />
        <ReviewRow
          icon={CalendarDays}
          title="LG Training"
          detail={user.onboarding?.state === 'TRAINING_VERIFIED' ? 'Initial training completion verified' : classSession ? `${classSession.title} · ${formatShortDate(classSession.startsAt)} · Preference saved` : 'Training selection needed'}
          complete={user.onboarding?.state === 'TRAINING_VERIFIED' || Boolean(classSession)}
          onPress={() => onEdit(1)}
        />
        <ReviewRow
          icon={ShieldCheck}
          title="JB Warranties"
          detail={warrantyComplete ? 'Completion recorded' : 'Confirmation needed'}
          complete={warrantyComplete}
          onPress={() => onEdit(2)}
        />
        <ReviewRow
          icon={Megaphone}
          title="Marketing Consultation"
          detail={marketingComplete ? 'Availability saved' : 'Availability needed'}
          complete={marketingComplete}
          onPress={() => onEdit(3)}
        />
        <ReviewRow
          icon={PackageCheck}
          title="First LG System"
          detail={equipment ? `${equipment.equipmentName} · ${equipment.modelNumber} · Record saved` : 'Equipment record needed'}
          complete={Boolean(equipment)}
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
