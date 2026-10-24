import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { AuthShell } from '../../features/auth/AuthShell';
import { apiFetch } from '../../lib/api/client';
import { TextInput } from '../../components/ui/TextInput';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { ErrorState } from '../../components/ui/StateViews';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [sent, setSent] = useState(false);
  const [complete, setComplete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const submit = async (requestCode = false) => {
    setBusy(true); setError(null);
    try {
      if (!requestCode && sent && (password.length < 12 || password !== confirmation)) {
        throw new Error('Use at least 12 characters and make sure both passwords match.');
      }
      const result = await apiFetch<{ message: string }>(requestCode || !sent ? '/auth/password-recovery' : '/auth/password-recovery/confirm', {
        method: 'POST', body: JSON.stringify(requestCode || !sent ? { email: email.trim().toLowerCase() } : { email: email.trim().toLowerCase(), code: code.trim(), password }),
      });
      setMessage(result.message);
      if (!requestCode && sent) { setComplete(true); setPassword(''); setConfirmation(''); setCode(''); }
      else { setSent(true); setCode(''); }
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Please try again.'); }
    finally { setBusy(false); }
  };

  return (
    <AuthShell title="Reset your password" subtitle="Use a code sent to your account email to choose a new password.">
      <View className="mt-6 gap-4">
        {error ? <ErrorState message={error} /> : null}
        {message ? <Text accessibilityRole="alert" className="text-base text-hercules-ink">{message}</Text> : null}
        {!complete ? <>
          <TextInput label="Account email" value={email} onChangeText={setEmail} editable={!sent && !busy} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          {sent ? <>
            <TextInput label="8-digit verification code" value={code} onChangeText={setCode} keyboardType="number-pad" textContentType="oneTimeCode" maxLength={8} />
            <TextInput label="New password (at least 12 characters)" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
            <TextInput label="Confirm new password" value={confirmation} onChangeText={setConfirmation} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
          </> : null}
          <PrimaryButton label={sent ? 'Update Password' : 'Send Verification Code'} loading={busy} onPress={() => void submit()} />
          {sent ? <>
            <SecondaryButton label="Send a new code" disabled={busy} onPress={() => void submit(true)} />
            <SecondaryButton label="Use another email" disabled={busy} onPress={() => { setSent(false); setCode(''); setMessage(''); setError(null); }} />
          </> : null}
        </> : null}
        <SecondaryButton label="Back to Sign In" disabled={busy} onPress={() => router.replace('/login')} />
      </View>
    </AuthShell>
  );
}
