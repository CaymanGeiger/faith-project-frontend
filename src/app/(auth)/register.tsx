import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { TextInput } from '../../components/ui/TextInput';
import { ErrorState } from '../../components/ui/StateViews';
import { AuthShell } from '../../features/auth/AuthShell';
import { useAuth } from '../../features/auth/AuthProvider';

export default function RegisterScreen() {
  const { registerFromInvite } = useAuth();
  const [token, setToken] = useState('prospect-demo-token');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await registerFromInvite({
        token,
        email,
        password,
        firstName,
        lastName,
        phone,
        companyName,
      });
      router.replace('/prospect');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Prospect Registration" subtitle="Hercules Honors Rewards">
      {error ? <ErrorState message={error} /> : null}
      <TextInput label="Invite or QR Token" value={token} onChangeText={setToken} />
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
      <TextInput label="First Name" value={firstName} onChangeText={setFirstName} />
      <TextInput label="Last Name" value={lastName} onChangeText={setLastName} />
      <TextInput
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        label="Company Name"
        value={companyName}
        onChangeText={setCompanyName}
      />
      <PrimaryButton label="Create Account" onPress={submit} loading={loading} />
      <Pressable onPress={() => router.push('/login')} className="items-center py-2">
        <Text className="font-bold text-hercules-blue">Back to sign in</Text>
      </Pressable>
    </AuthShell>
  );
}
