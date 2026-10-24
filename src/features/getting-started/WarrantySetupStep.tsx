import { CheckCircle2, ShieldCheck } from 'lucide-react-native';
import { useCallback, useLayoutEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { ErrorState } from '../../components/ui/StateViews';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { todosApi } from '../../lib/api/endpoints';
import { TodoItem } from '../../lib/api/types';
import { formatShortDate } from '../../lib/format';
import { colors } from '../../lib/theme/theme';
import { GettingStartedActionChange } from './gettingStarted';
import { GettingStartedStepCard } from './GettingStartedStepCard';

type WarrantySetupStepProps = {
  todo?: TodoItem;
  onComplete: () => Promise<void>;
  onTodoUpdated: (todo: TodoItem) => void;
  onActionChange: GettingStartedActionChange;
};

export function WarrantySetupStep({
  todo,
  onComplete,
  onTodoUpdated,
  onActionChange,
}: WarrantySetupStepProps) {
  const complete = todo?.status === 'COMPLETED';
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
    setNotice(null);
    try {
      await todosApi.update(todo.id, true);
      await onComplete();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update warranty status');
    } finally {
      setSaving(false);
    }
  }, [complete, onComplete, todo]);

  const markIncomplete = async () => {
    if (!todo || saving) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const result = await todosApi.update(todo.id, false);
      onTodoUpdated(result.todo);
      setNotice('Warranty setup is marked incomplete. Confirm it again after completing the JB Warranties process.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to correct warranty status. Try again.');
    } finally {
      setSaving(false);
    }
  };

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
      title="Record Your JB Warranties Setup"
      description="After completing setup with JB Warranties, record that completion here for your Hercules onboarding."
    >
      <View className="gap-4">
        {error ? <ErrorState message={error} /> : null}
        {notice ? <Text accessibilityRole="alert" className="text-sm leading-5 text-hercules-blue">{notice}</Text> : null}
        <View className="gap-3 rounded-[20px] border border-hercules-blue/20 bg-hercules-white p-4">
          <View className="flex-row items-center gap-3">
            <CheckCircle2
              size={25}
              color={complete ? colors.blue : colors.red}
              strokeWidth={2.6}
            />
            <Text className="flex-1 text-lg font-extrabold text-hercules-ink">
              {complete ? 'Completion recorded' : 'Confirm completed setup'}
            </Text>
          </View>
          <Text className="text-sm leading-5 text-hercules-muted">
            Confirm this only after you complete the JB Warranties process.
            Hercules can provide partner-access details if needed. This app does
            not submit the partner registration for you.
          </Text>
          {todo ? (
            <Text className="text-xs font-extrabold text-hercules-blue">
              Due {formatShortDate(todo.dueAt)}
            </Text>
          ) : null}
        </View>
        {complete ? (
          <SecondaryButton
            label={saving ? 'Updating status…' : 'Mark Setup Incomplete'}
            disabled={saving}
            onPress={() => void markIncomplete()}
          />
        ) : null}
      </View>
    </GettingStartedStepCard>
  );
}
