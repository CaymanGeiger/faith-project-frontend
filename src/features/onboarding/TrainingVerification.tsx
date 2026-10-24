import { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { TextInput } from '../../components/ui/TextInput';
import { ErrorState } from '../../components/ui/StateViews';
import { apiFetch } from '../../lib/api/client';
import { useAsyncData } from '../../lib/hooks/useAsyncData';
import type { OnboardingAccess } from './access';

type Verification = { completedAt: string; verifiedAt: string; source: string; reference: string };

export function TrainingVerification({ prospectUserId, onVerified }: { prospectUserId: string; onVerified: () => Promise<void> }) {
  const status = useAsyncData(() => apiFetch<{
    access: OnboardingAccess;
    verification: Verification | null;
    canVerifyTraining: boolean;
  }>(`/onboarding/prospects/${encodeURIComponent(prospectUserId)}`), [prospectUserId]);
  const [completedOn, setCompletedOn] = useState('');
  const [source, setSource] = useState('');
  const [reference, setReference] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = async () => {
    if (saving) return;
    setError(null);
    const date = new Date(`${completedOn}T00:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(completedOn) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== completedOn || date > new Date()) {
      setError('Enter a valid completed training date in YYYY-MM-DD format, no later than today.');
      return;
    }
    if (!confirmed || !source.trim() || !reference.trim()) {
      setError('Provide the verification source and evidence reference, then confirm that initial training was completed.');
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/onboarding/prospects/${encodeURIComponent(prospectUserId)}/training-verification`, {
        method: 'POST',
        body: JSON.stringify({ completedAt: date.toISOString(), source: source.trim(), reference: reference.trim() }),
      });
      await Promise.all([status.reload(), onVerified()]);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to verify initial training.'); }
    finally { setSaving(false); }
  };

  return <View className="gap-3 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-5">
    <Text className="text-lg font-extrabold text-hercules-ink">Initial Training Verification</Text>
    {error || status.error ? <ErrorState message={error ?? status.error!} onRetry={status.reload} /> : null}
    {!status.data ? <Text className="text-base text-hercules-muted">Loading verification status…</Text> : status.data.verification ? <>
      <Text className="font-bold text-hercules-blue">Verified · Dealer features available</Text>
      <Text className="text-sm leading-5 text-hercules-muted">Completed {status.data.verification.completedAt.slice(0, 10)} · {status.data.verification.source}</Text>
      <Text selectable className="text-sm leading-5 text-hercules-muted">Evidence: {status.data.verification.reference}</Text>
    </> : <>
      <Text className="text-sm leading-5 text-hercules-muted">{status.data.access.state === 'EXISTING_ACCESS' ? 'Existing app access is preserved; initial training has not been verified here.' : 'Dealer features remain restricted until initial training is verified.'} Saving a preference, class registration or a lead status does not verify completion.</Text>
      {status.data.canVerifyTraining ? <>
        <TextInput label="Training completion date (YYYY-MM-DD)" value={completedOn} onChangeText={setCompletedOn} editable={!saving} autoCapitalize="none" />
        <TextInput label="Verification source" value={source} onChangeText={setSource} editable={!saving} maxLength={120} />
        <TextInput label="Evidence reference" value={reference} onChangeText={setReference} editable={!saving} maxLength={300} multiline />
        <View className="flex-row items-center gap-3">
          <Switch value={confirmed} onValueChange={setConfirmed} disabled={saving} accessibilityLabel="I verified completion of the required initial training" />
          <Text className="flex-1 text-sm leading-5 text-hercules-ink">I verified completion of the required initial training against this evidence.</Text>
        </View>
        <PrimaryButton label="Verify Training and Unlock Features" loading={saving} disabled={!confirmed} onPress={() => void verify()} />
      </> : <Text className="text-sm leading-5 text-hercules-muted">Training verification requires an activated account and an approved verification owner.</Text>}
    </>}
  </View>;
}
