import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { apiFetch } from '../../lib/api/client';
import { useAuth } from '../auth/AuthProvider';
import { registerSignOutCleanup } from '../auth/signOutCleanup';

type State = { enabled: boolean; busy: boolean; error: string | null; supported: boolean; setEnabled: (enabled: boolean) => Promise<void> };
const Context = createContext<State | null>(null);
const supported = Platform.OS !== 'web' && Constants.executionEnvironment !== 'storeClient';
const key = (userId: string) => `hercules:push:${userId}`;
async function nativeNotifications() {
  if (!supported) throw new Error('Push notifications require the installed Hercules app on a supported device.');
  const device = await import('expo-device');
  if (!device.isDevice) throw new Error('Enable push notifications on a physical phone.');
  return import('expo-notifications');
}

export function PushNotificationsProvider({ children }: PropsWithChildren) {
  const { user, token } = useAuth();
  const [enabled, setEnabledState] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentUser = useRef(user?.id);
  currentUser.current = user?.id;
  const registeredToken = useRef<string | null>(null);
  const sessionEpoch = useRef(0);
  const registration = useRef<Promise<unknown> | null>(null);

  const sync = useCallback(async (requestPermission: boolean, epoch = sessionEpoch.current) => {
    if (!user || !token || epoch !== sessionEpoch.current) return;
    const userId = user.id;
    const notifications = await nativeNotifications();
    const availability = await apiFetch<{ available: boolean }>('/push/status');
    if (!availability.available) throw new Error('Push notifications are not available yet. Please try again later.');
    if (Platform.OS === 'android') await notifications.setNotificationChannelAsync('messages', { name: 'Chat messages', importance: notifications.AndroidImportance.DEFAULT });
    let permission = await notifications.getPermissionsAsync();
    if (!permission.granted && requestPermission) permission = await notifications.requestPermissionsAsync();
    if (!permission.granted) throw new Error('Allow notifications in your phone settings to receive chat alerts.');
    const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) throw new Error('Notifications are not configured for this app build.');
    const result = await notifications.getExpoPushTokenAsync({ projectId });
    if (currentUser.current !== userId || sessionEpoch.current !== epoch) return;
    // Serialize registration and preference persistence so opt-out can await both.
    registration.current = (registration.current?.catch(() => undefined) ?? Promise.resolve()).then(async () => {
      if (currentUser.current !== userId || sessionEpoch.current !== epoch) return;
      registeredToken.current = result.data;
      await apiFetch('/push/register', { method: 'POST', body: JSON.stringify({ token: result.data, platform: Platform.OS }) });
      if (currentUser.current !== userId || sessionEpoch.current !== epoch) return;
      await AsyncStorage.setItem(key(userId), JSON.stringify({ token: result.data }));
      if (currentUser.current !== userId || sessionEpoch.current !== epoch) return;
      setEnabledState(true); setError(null);
    });
    await registration.current;
  }, [token, user?.id]);

  const setEnabled = useCallback(async (next: boolean) => {
    if (!user || busy) return;
    setBusy(true); setError(null);
    try {
      if (next) await sync(true);
      else {
        sessionEpoch.current += 1;
        await registration.current?.catch(() => undefined);
        const stored = await AsyncStorage.getItem(key(user.id));
        const pushToken = registeredToken.current ?? (stored ? (JSON.parse(stored) as { token?: string }).token : undefined);
        if (pushToken) await apiFetch('/push/unregister', { method: 'POST', body: JSON.stringify({ token: pushToken }) });
        await AsyncStorage.removeItem(key(user.id));
        registeredToken.current = null; setEnabledState(false);
      }
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to update notifications.'); }
    finally { setBusy(false); }
  }, [busy, sync, user?.id]);

  useEffect(() => {
    setEnabledState(false); setError(null); registeredToken.current = null;
    if (!user || !supported) return;
    let active = true;
    const refresh = async () => {
      const epoch = sessionEpoch.current;
      const stored = await AsyncStorage.getItem(key(user.id));
      if (!active || epoch !== sessionEpoch.current || !stored) return;
      registeredToken.current = (JSON.parse(stored) as { token: string }).token;
      setEnabledState(true);
      await sync(false, epoch);
    };
    const refreshSafely = () => { void refresh().catch(caught => { if (active) setError(caught instanceof Error ? caught.message : 'Unable to refresh notifications.'); }); };
    refreshSafely();
    const foreground = AppState.addEventListener('change', state => { if (state === 'active') refreshSafely(); });
    const unregister = registerSignOutCleanup(async () => {
      active = false;
      sessionEpoch.current += 1;
      await registration.current?.catch(() => undefined);
      if (registeredToken.current) await apiFetch('/push/unregister', { method: 'POST', body: JSON.stringify({ token: registeredToken.current }) });
      registeredToken.current = null;
    });
    return () => { active = false; sessionEpoch.current += 1; foreground.remove(); unregister(); };
  }, [user?.id, sync]);

  useEffect(() => {
    if (!user || !supported) return;
    let active = true;
    let remove = () => {};
    void import('expo-notifications').then(notifications => {
      if (!active) return;
      notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: false, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }) });
      const openChat = (response: import('expo-notifications').NotificationResponse | null) => {
        const data = response?.notification.request.content.data;
        if (active && data?.type === 'chat' && data.recipientId === user.id) {
          router.push(user.role === 'PROSPECT' ? '/prospect/messages' : '/manager/messages');
          void notifications.clearLastNotificationResponseAsync();
        }
      };
      const subscription = notifications.addNotificationResponseReceivedListener(openChat);
      const tokenSubscription = notifications.addPushTokenListener(() => {
        const epoch = sessionEpoch.current;
        void AsyncStorage.getItem(key(user.id)).then(stored => { if (stored && active && epoch === sessionEpoch.current) return sync(false, epoch); }).catch(() => undefined);
      });
      remove = () => { subscription.remove(); tokenSubscription.remove(); };
      void notifications.getLastNotificationResponseAsync().then(openChat).catch(() => undefined);
    }).catch(() => undefined);
    return () => { active = false; remove(); };
  }, [user?.id, user?.role, sync]);

  return <Context.Provider value={{ enabled, busy, error, supported, setEnabled }}>{children}</Context.Provider>;
}

export function usePushNotifications() {
  const context = useContext(Context);
  if (!context) throw new Error('PushNotificationsProvider is missing');
  return context;
}
