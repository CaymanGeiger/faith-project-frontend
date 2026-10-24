import { Text, View } from 'react-native';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { ErrorState } from '../../components/ui/StateViews';
import { usePushNotifications } from './PushNotificationsProvider';

export function NotificationSettings() {
  const { enabled, busy, error, supported, setEnabled } = usePushNotifications();
  return <View className="gap-3 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-4">
    <Text className="text-xl font-extrabold text-hercules-ink">Chat notifications</Text>
    <Text className="text-base text-hercules-muted">Get an alert when a new chat message arrives. Message text stays inside the app.</Text>
    {error ? <ErrorState message={error} /> : null}
    {supported ? <SecondaryButton label={busy ? 'Updating…' : enabled ? 'Turn Off Chat Alerts' : 'Enable Chat Alerts'} disabled={busy} onPress={() => void setEnabled(!enabled)} /> : <Text className="text-sm text-hercules-muted">Push alerts are available in the installed iOS and Android app. They are not available in this preview.</Text>}
  </View>;
}
