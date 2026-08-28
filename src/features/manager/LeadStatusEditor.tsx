import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { TextInput } from '../../components/ui/TextInput';
import { ErrorState } from '../../components/ui/StateViews';
import { LeadRecord } from '../../lib/api/types';
import { leadsApi } from '../../lib/api/endpoints';

const statuses: Array<{ label: string; value: LeadRecord['status'] }> = [
  { label: 'New', value: 'NEW' },
  { label: 'Contacted', value: 'CONTACTED' },
  { label: 'Active', value: 'IN_PROGRESS' },
  { label: 'Certified', value: 'CERTIFIED' },
  { label: 'Lost', value: 'LOST' },
];

type LeadStatusEditorProps = {
  prospectUserId: string;
  lead: LeadRecord;
  onSaved: () => Promise<void>;
};

export function LeadStatusEditor({
  prospectUserId,
  lead,
  onSaved,
}: LeadStatusEditorProps) {
  const [status, setStatus] = useState<LeadRecord['status']>(lead.status);
  const [notes, setNotes] = useState(lead.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  useEffect(() => {
    setStatus(lead.status);
    setNotes(lead.notes ?? '');
    setSyncNotice(null);
  }, [lead]);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSyncNotice(null);
    try {
      const result = await leadsApi.updateLead(prospectUserId, { status, notes });
      await onSaved();
      if (!result.sync.synced) {
        setSyncNotice(
          'Saved in Hercules Honors Rewards. External lead-system syncing is not configured for this app yet.',
        );
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="gap-4">
      <Text className="text-xl font-extrabold text-hercules-ink">Lead Tracking</Text>
      {error ? <ErrorState message={error} /> : null}
      {syncNotice ? (
        <View className="rounded-[14px] border border-hercules-blue/15 bg-hercules-blue/5 px-4 py-3">
          <Text className="text-sm leading-5 text-hercules-muted">{syncNotice}</Text>
        </View>
      ) : null}
      <SegmentedControl options={statuses} value={status} onChange={setStatus} />
      <TextInput label="Notes" value={notes} onChangeText={setNotes} multiline />
      <PrimaryButton label="Save Lead" onPress={save} loading={saving} />
    </View>
  );
}
