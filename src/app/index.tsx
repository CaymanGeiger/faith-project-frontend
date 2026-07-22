import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { LoadingState } from '../components/ui/StateViews';
import { useAuth } from '../features/auth/AuthProvider';

export default function IndexRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 justify-center bg-hercules-white px-5">
        <LoadingState label="Opening Hercules Honors" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Redirect href={user.role === 'PROSPECT' ? '/prospect' : '/manager'} />
  );
}
