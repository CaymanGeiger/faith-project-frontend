import { useState } from 'react';
import { Text, View } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { apiFetch } from '../../lib/api/client';
import { TextInput } from '../../components/ui/TextInput';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { ErrorState } from '../../components/ui/StateViews';

export function EmailChangeForm() {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const response = await apiFetch<{ message: string }>(sent ? '/auth/email-change/confirm' : '/auth/email-change', {
        method: 'POST', body: JSON.stringify(sent ? { code: code.trim() } : { email: email.trim().toLowerCase(), currentPassword: password }),
      });
      setPassword(''); setMessage(response.message);
      if (sent) await logout();
      else setSent(true);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to verify your email.'); }
    finally { setBusy(false); }
  };
  if (!open) return <SecondaryButton label="Change Email Address" onPress={() => setOpen(true)} />;
  return <View className="gap-3">
    <Text className="text-base text-hercules-muted">Your current email remains active until verification. After confirmation, sign in again with the new address.</Text>
    {error ? <ErrorState message={error} /> : null}
    {message ? <Text accessibilityRole="alert" className="text-base text-hercules-ink">{message}</Text> : null}
    <TextInput label="New email address" value={email} onChangeText={setEmail} editable={!sent && !busy} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
    {sent ? <TextInput label="8-digit verification code" value={code} onChangeText={setCode} keyboardType="number-pad" textContentType="oneTimeCode" maxLength={8} /> : <TextInput label="Current password" value={password} onChangeText={setPassword} secureTextEntry />}
    <PrimaryButton label={sent ? 'Verify Email & Sign Out' : 'Send Verification Code'} loading={busy} onPress={() => void submit()} />
    {sent ? <SecondaryButton label="Request another code" disabled={busy} onPress={() => { setSent(false); setCode(''); setMessage(''); }} /> : null}
    <SecondaryButton label="Cancel" disabled={busy} onPress={() => { setOpen(false); setSent(false); setPassword(''); setCode(''); setError(null); setMessage(''); }} />
  </View>;
}
