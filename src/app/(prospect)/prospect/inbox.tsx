import { router } from 'expo-router';
import { CalendarDays, CheckCircle2, PackagePlus, Wrench } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { AppScreen } from '../../../components/layout/AppScreen';
import { prospectQuickLinks } from '../../../components/layout/navigation';
import { AnimatedCard } from '../../../components/ui/AnimatedCard';
import { ListItem } from '../../../components/ui/ListItem';
import { ModalSheet } from '../../../components/ui/ModalSheet';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../../components/ui/SecondaryButton';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { ErrorState, LoadingState } from '../../../components/ui/StateViews';
import { TextInput } from '../../../components/ui/TextInput';
import { equipmentApi, todosApi } from '../../../lib/api/endpoints';
import { formatShortDate } from '../../../lib/format';
import { useAsyncData } from '../../../lib/hooks/useAsyncData';

export default function ProspectInboxScreen() {
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [equipmentName, setEquipmentName] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const inbox = useAsyncData(async () => {
    const [todos, equipment] = await Promise.all([
      todosApi.list(),
      equipmentApi.list(),
    ]);
    return { todos, equipment };
  }, []);

  const submitEquipment = async () => {
    setSaving(true);
    setFormError(null);
    try {
      await equipmentApi.create({ equipmentName, modelNumber, serialNumber });
      setEquipmentName('');
      setModelNumber('');
      setSerialNumber('');
      setEquipmentOpen(false);
      await inbox.reload();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'Unable to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen
      title="Inbox"
      quickLinks={prospectQuickLinks}
      alertHref="/prospect/inbox"
    >
      <AnimatedCard className="gap-3 rounded-[24px] border border-hercules-blue/20 bg-hercules-white p-5">
        <Text className="text-3xl font-extrabold text-hercules-ink">Inbox</Text>
        <Text className="text-base font-semibold leading-6 text-hercules-muted">
          Class signup, equipment registration, and onboarding notifications.
        </Text>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <SecondaryButton
              label="Classes"
              icon={CalendarDays}
              onPress={() => router.push('/prospect/classes')}
            />
          </View>
          <View className="flex-1">
            <PrimaryButton
              label="Register"
              icon={PackagePlus}
              onPress={() => setEquipmentOpen(true)}
            />
          </View>
        </View>
      </AnimatedCard>

      {inbox.loading ? <LoadingState label="Loading inbox" /> : null}
      {inbox.error ? <ErrorState message={inbox.error} onRetry={inbox.reload} /> : null}
      {inbox.data ? (
        <>
          <AnimatedCard index={1}>
            <SectionHeader
              title="Notifications"
              actionLabel="View To-Do"
              onAction={() => router.push('/prospect/todos')}
            />
            <View className="gap-3">
              {inbox.data.todos.todos.map((todo, index) => (
                <ListItem
                  key={todo.id}
                  title={todo.title}
                  subtitle={`Due ${formatShortDate(todo.dueAt)} · ${todo.description}`}
                  meta={todo.status === 'OPEN' ? 'New' : 'Done'}
                  icon={todo.status === 'OPEN' ? CalendarDays : CheckCircle2}
                  iconTone={index % 2 === 0 ? 'red' : 'blue'}
                  onPress={() => router.push('/prospect/todos')}
                />
              ))}
            </View>
          </AnimatedCard>

          <AnimatedCard index={2}>
            <SectionHeader title="Equipment Records" />
            <View className="gap-3">
              {inbox.data.equipment.equipment.length === 0 ? (
                <View className="rounded-[20px] border border-hercules-blue/20 bg-hercules-white p-5">
                  <Text className="font-bold text-hercules-muted">
                    No equipment registered yet.
                  </Text>
                </View>
              ) : (
                inbox.data.equipment.equipment.map((item) => (
                  <ListItem
                    key={item.id}
                    title={item.equipmentName}
                    subtitle={`${item.modelNumber} · ${item.serialNumber}`}
                    meta={item.status}
                    icon={Wrench}
                    iconTone="blue"
                  />
                ))
              )}
            </View>
          </AnimatedCard>
        </>
      ) : null}

      <ModalSheet
        title="Equipment Registration"
        visible={equipmentOpen}
        onClose={() => setEquipmentOpen(false)}
      >
        <View className="gap-4">
          {formError ? <ErrorState message={formError} /> : null}
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
          <PrimaryButton
            label="Submit Registration"
            onPress={submitEquipment}
            loading={saving}
          />
        </View>
      </ModalSheet>
    </AppScreen>
  );
}
