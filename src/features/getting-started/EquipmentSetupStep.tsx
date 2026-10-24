import { CheckCircle2, PackagePlus } from 'lucide-react-native';
import { useCallback, useLayoutEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ErrorState } from '../../components/ui/StateViews';
import { TextInput } from '../../components/ui/TextInput';
import { equipmentApi } from '../../lib/api/endpoints';
import { EquipmentRegistration } from '../../lib/api/types';
import { colors } from '../../lib/theme/theme';
import {
  clearGettingStartedDraftFields,
  GettingStartedActionChange,
  GettingStartedDraft,
  saveGettingStartedDraft,
} from './gettingStarted';
import { GettingStartedStepCard } from './GettingStartedStepCard';

type EquipmentSetupStepProps = {
  equipment: EquipmentRegistration[];
  userId: string;
  draft?: GettingStartedDraft | null;
  onComplete: () => Promise<void>;
  onActionChange: GettingStartedActionChange;
};

export function EquipmentSetupStep({
  equipment,
  userId,
  draft,
  onComplete,
  onActionChange,
}: EquipmentSetupStepProps) {
  const existing = equipment[0];
  const [editing, setEditing] = useState(Boolean(existing && existing.status !== 'APPROVED' && draft?.equipment));
  const [equipmentName, setEquipmentName] = useState(
    draft?.equipment?.equipmentName ?? '',
  );
  const [modelNumber, setModelNumber] = useState(
    draft?.equipment?.modelNumber ?? '',
  );
  const [serialNumber, setSerialNumber] = useState(
    draft?.equipment?.serialNumber ?? '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async () => {
    if (existing && !editing) {
      await onComplete();
      return;
    }

    if (![equipmentName, modelNumber, serialNumber].every((value) => value.trim())) {
      setError('Enter the equipment name, model number, and serial number.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (existing) await equipmentApi.update(existing.id, { equipmentName, modelNumber, serialNumber });
      else await equipmentApi.create({ equipmentName, modelNumber, serialNumber });
      setEditing(false);
      await clearGettingStartedDraftFields(userId, 'equipment');
      await onComplete();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save equipment record');
    } finally {
      setSaving(false);
    }
  }, [editing, equipmentName, existing, modelNumber, onComplete, serialNumber, userId]);

  const saveForLater = useCallback(
    () =>
      saveGettingStartedDraft(userId, {
        equipment: { equipmentName, modelNumber, serialNumber },
      }),
    [equipmentName, modelNumber, serialNumber, userId],
  );

  useLayoutEffect(() => {
    onActionChange({
      label: 'Save & Continue',
      onPress: () => void save(),
      onSaveForLater: !existing || editing ? saveForLater : undefined,
      loading: saving,
    });
  }, [editing, existing, onActionChange, save, saveForLater, saving]);

  return (
    <GettingStartedStepCard
      icon={PackagePlus}
      title="Add Your First LG System"
      description="Save an equipment record in this app for your Hercules dealer onboarding."
    >
      {existing && !editing ? (
        <View className="gap-4">
          <View className="flex-row items-start gap-3 rounded-[20px] border border-hercules-blue/20 bg-hercules-white p-4">
            <CheckCircle2 size={25} color={colors.blue} strokeWidth={2.6} />
            <View className="flex-1 gap-1">
              <Text className="text-lg font-extrabold text-hercules-ink">
                Equipment record saved
              </Text>
              <Text className="text-sm font-bold text-hercules-blue">
                {existing.equipmentName}
              </Text>
              <Text className="text-sm leading-5 text-hercules-muted">
                Model {existing.modelNumber} · Serial {existing.serialNumber}
              </Text>
              <Text className="text-sm leading-5 text-hercules-muted">
                This saves an onboarding record in Hercules Honors Rewards; it
                does not submit manufacturer registration.
              </Text>
            </View>
          </View>
          {existing.status !== 'APPROVED' ? <Pressable accessibilityRole="button" className="min-h-11 justify-center" onPress={() => { setEquipmentName(existing.equipmentName); setModelNumber(existing.modelNumber); setSerialNumber(existing.serialNumber); setEditing(true); }}><Text className="font-bold text-hercules-blue">Correct equipment details</Text></Pressable> : null}
        </View>
      ) : (
        <View className="gap-4">
          {error ? <ErrorState message={error} /> : null}
          <TextInput
            label="Equipment Name"
            value={equipmentName}
            onChangeText={setEquipmentName}
          />
          <TextInput
            label="Model Number"
            value={modelNumber}
            onChangeText={setModelNumber}
          />
          <TextInput
            label="Serial Number"
            value={serialNumber}
            onChangeText={setSerialNumber}
          />
        </View>
      )}
    </GettingStartedStepCard>
  );
}
