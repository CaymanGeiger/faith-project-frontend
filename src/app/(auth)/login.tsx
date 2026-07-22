import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { TextInput } from '../../components/ui/TextInput';
import { ErrorState } from '../../components/ui/StateViews';
import { AuthShell } from '../../features/auth/AuthShell';
import { useAuth } from '../../features/auth/AuthProvider';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('prospect@hercules.local');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      router.replace(user.role === 'PROSPECT' ? '/prospect' : '/manager');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Hercules Honors" subtitle="LG Dealer Portal">
      {error ? <ErrorState message={error} /> : null}
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <PrimaryButton label="Sign In" onPress={submit} loading={loading} />
      <Pressable onPress={() => router.push('/register')} className="items-center py-2">
        <Text className="font-bold text-hercules-blue">Register from invite</Text>
      </Pressable>
    </AuthShell>
  );
}
