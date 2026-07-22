import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { TextInput } from '../../components/ui/TextInput';
import { ErrorState } from '../../components/ui/StateViews';
import { accountApi } from '../../lib/api/endpoints';
import { User } from '../../lib/api/types';

type AccountFormProps = {
  user: User;
  companyName?: string;
  onSaved: () => Promise<void>;
};

export function AccountForm({ user, companyName, onSaved }: AccountFormProps) {
  const [email, setEmail] = useState(user.email);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [company, setCompany] = useState(companyName ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEmail(user.email);
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPhone(user.phone ?? '');
    setCompany(companyName ?? '');
  }, [companyName, user]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await accountApi.update({
        email,
        firstName,
        lastName,
        phone,
        companyName: user.role === 'PROSPECT' ? company : undefined,
      });
      await onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="gap-4 rounded-[24px] border border-hercules-blue/20 bg-hercules-white p-5">
      <Text className="text-2xl font-extrabold text-hercules-ink">
        Manage Account
      </Text>
      {error ? <ErrorState message={error} /> : null}
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput label="First Name" value={firstName} onChangeText={setFirstName} />
      <TextInput label="Last Name" value={lastName} onChangeText={setLastName} />
      <TextInput
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      {user.role === 'PROSPECT' ? (
        <TextInput label="Company" value={company} onChangeText={setCompany} />
      ) : null}
      <PrimaryButton label="Save Changes" onPress={save} loading={saving} />
    </View>
  );
}
