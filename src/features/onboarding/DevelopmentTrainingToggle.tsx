import { useRef, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { apiFetch } from '../../lib/api/client';
import { colors } from '../../lib/theme/theme';
import { canUseDevelopmentTraining } from '../../lib/development';

/** Temporary testing control. The server independently enforces its access gate. */
export function DevelopmentTrainingToggle() {
  const { user, refreshMe } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  if (!user || !canUseDevelopmentTraining(user)) return null;

  const completed = user.onboarding?.state === 'TRAINING_VERIFIED';
  const changeCompletion = async (next: boolean) => {
    if (!canUseDevelopmentTraining(user) || inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    setError(null);
    try {
      await apiFetch('/onboarding/development/training', {
        method: 'PATCH',
        body: JSON.stringify({ completed: next }),
      });
      await refreshMe();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to change the development training state.');
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  };

  return (
    <View className="gap-2 border-b border-hercules-blue/15 px-3 pb-3 pt-2">
      <Text className="text-xs font-bold uppercase tracking-wide text-hercules-muted">Development only</Text>
      <View className="flex-row items-center gap-3">
        <Text className="flex-1 text-[15px] font-bold text-hercules-ink">Training verification completed</Text>
        <Switch
          accessibilityLabel="Training verification completed (development only)"
          accessibilityState={{ busy: saving }}
          value={completed}
          disabled={saving}
          trackColor={{ true: colors.blue }}
          onValueChange={(next) => void changeCompletion(next)}
        />
      </View>
      <Text accessibilityLiveRegion="polite" className="text-xs text-hercules-muted">
        {saving ? 'Updating access…' : completed ? 'On · Dealer features unlocked' : 'Off · Training verification required'}
      </Text>
      {error ? <Text accessibilityRole="alert" className="text-sm text-hercules-red">{error}</Text> : null}
    </View>
  );
}
