import { CheckCircle2, ShieldCheck } from 'lucide-react-native';
import { useCallback, useLayoutEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { ErrorState } from '../../components/ui/StateViews';
import { todosApi } from '../../lib/api/endpoints';
import { TodoItem } from '../../lib/api/types';
import { formatShortDate } from '../../lib/format';
import { colors } from '../../lib/theme/theme';
import { GettingStartedActionChange } from './gettingStarted';
import { GettingStartedStepCard } from './GettingStartedStepCard';

type WarrantySetupStepProps = {
  todo?: TodoItem;
  onComplete: () => Promise<void>;
  onActionChange: GettingStartedActionChange;
};

export function WarrantySetupStep({
  todo,
  onComplete,
  onActionChange,
}: WarrantySetupStepProps) {
  const complete = todo?.status === 'COMPLETED';
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = useCallback(async () => {
    if (!todo) {
      setError('The JB Warranties onboarding task is not available.');
      return;
    }
    if (complete) {
      await onComplete();
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await todosApi.update(todo.id, true);
      await onComplete();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update warranty status');
    } finally {
      setSaving(false);
    }
  }, [complete, onComplete, todo]);

  useLayoutEffect(() => {
    onActionChange({
      label: 'Save & Continue',
      onPress: () => void confirm(),
      loading: saving,
      disabled: !todo,
    });
  }, [complete, confirm, onActionChange, saving, todo]);

  return (
    <GettingStartedStepCard
      icon={ShieldCheck}
      title="Confirm JB Warranties Signup"
      description="This partner signup is required within 30 days of joining the Hercules dealer program."
    >
      <View className="gap-4">
        {error ? <ErrorState message={error} /> : null}
        <View className="gap-3 rounded-[20px] border border-hercules-blue/20 bg-hercules-white p-4">
          <View className="flex-row items-center gap-3">
            <CheckCircle2
              size={25}
              color={complete ? colors.blue : colors.red}
              strokeWidth={2.6}
            />
            <Text className="flex-1 text-lg font-extrabold text-hercules-ink">
              {complete ? 'Signup confirmed' : 'Complete partner registration'}
            </Text>
          </View>
          <Text className="text-sm leading-5 text-hercules-muted">
            Confirm this step only after your JB Warranties signup has been
            submitted. Your Hercules sales manager can provide partner-access
            details if needed.
          </Text>
          {todo ? (
            <Text className="text-xs font-extrabold text-hercules-blue">
              Due {formatShortDate(todo.dueAt)}
            </Text>
          ) : null}
        </View>
      </View>
    </GettingStartedStepCard>
  );
}
