import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { AuthShell } from '../../features/auth/AuthShell';
import { apiFetch } from '../../lib/api/client';
import { TextInput } from '../../components/ui/TextInput';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { ErrorState } from '../../components/ui/StateViews';

export default function ActivateAccountScreen() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [sent, setSent] = useState(false);
  const [complete, setComplete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const submitting = useRef(false);

  const submit = async (requestCode = false) => {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    const requesting = requestCode || !sent;
    try {
      if (!requesting) {
        if (!/^\d{8}$/.test(code.trim())) throw new Error('Enter the 8-digit code from your email.');
        if (!firstName.trim() || !lastName.trim()) throw new Error('Enter your first and last name.');
        if (password.length < 12 || password !== confirmation) throw new Error('Use at least 12 characters and make sure both passwords match.');
        if (!termsAccepted) throw new Error('Please accept the Terms of Use and Privacy Notice.');
      }
      const result = await apiFetch<{ message: string }>(requesting ? '/auth/activation/request' : '/auth/activation/confirm', {
        method: 'POST',
        body: JSON.stringify(requesting ? { email: email.trim().toLowerCase() } : {
          email: email.trim().toLowerCase(), code: code.trim(), password,
          firstName: firstName.trim(), lastName: lastName.trim(), termsAccepted,
        }),
      });
      setMessage(result.message);
      setCode('');
      if (requesting) setSent(true);
      else { setComplete(true); setPassword(''); setConfirmation(''); }
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to activate your account. Please try again.'); }
    finally { submitting.current = false; setBusy(false); }
  };

  return (
    <AuthShell title="Activate your account" subtitle="After submitting your dealer registration, verify your email and create your password. Your registration must be processed before activation is available.">
      <View className="mt-6 gap-4">
        {error ? <ErrorState message={error} /> : null}
        {message ? <Text accessibilityRole="alert" className="text-base leading-6 text-hercules-ink">{message}</Text> : null}
        {!complete ? <>
          <TextInput label="Registration email" value={email} onChangeText={setEmail} editable={!sent && !busy} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          {sent ? <>
            <TextInput label="8-digit activation code" value={code} onChangeText={setCode} editable={!busy} keyboardType="number-pad" textContentType="oneTimeCode" maxLength={8} />
            <TextInput label="First name" value={firstName} onChangeText={setFirstName} editable={!busy} textContentType="givenName" />
            <TextInput label="Last name" value={lastName} onChangeText={setLastName} editable={!busy} textContentType="familyName" />
            <TextInput label="Password (at least 12 characters)" value={password} onChangeText={setPassword} editable={!busy} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
            <TextInput label="Confirm password" value={confirmation} onChangeText={setConfirmation} editable={!busy} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
            <View className="flex-row items-center gap-3">
              <Switch value={termsAccepted} onValueChange={setTermsAccepted} disabled={busy} accessibilityLabel="Accept Terms of Use and Privacy Notice" />
              <Text className="flex-1 text-sm leading-5 text-hercules-ink">I agree to the Terms of Use and acknowledge the Privacy Notice.</Text>
            </View>
            <View className="flex-row gap-5">
              <Pressable accessibilityRole="link" onPress={() => router.push('/terms')} className="min-h-11 justify-center"><Text className="font-bold text-hercules-blue">Terms of Use</Text></Pressable>
              <Pressable accessibilityRole="link" onPress={() => router.push('/privacy')} className="min-h-11 justify-center"><Text className="font-bold text-hercules-blue">Privacy Notice</Text></Pressable>
            </View>
          </> : null}
          <PrimaryButton label={sent ? 'Activate Account' : 'Send Activation Code'} loading={busy} onPress={() => void submit()} />
          {sent ? <>
            <SecondaryButton label="Send a New Code" disabled={busy} onPress={() => void submit(true)} />
            <SecondaryButton label="Use Another Email" disabled={busy} onPress={() => { setSent(false); setCode(''); setPassword(''); setConfirmation(''); setMessage(''); setError(null); }} />
          </> : null}
        </> : <Text className="text-base leading-6 text-hercules-muted">Sign in to access training, your profile and support. Dealer features unlock after verified initial training.</Text>}
        <SecondaryButton label="Back to Sign In" disabled={busy} onPress={() => router.replace('/login')} />
      </View>
    </AuthShell>
  );
}
