import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '../features/auth/AuthProvider';

export default function IndexRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <View className="flex-1 bg-hercules-white" />;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Redirect href={user.role === 'PROSPECT' ? '/prospect' : '/manager'} />
  );
}
