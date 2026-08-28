import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { TextInput } from '../../components/ui/TextInput';
import { ErrorState } from '../../components/ui/StateViews';
import { useAuth } from '../../features/auth/AuthProvider';
import { AuthShell } from '../../features/auth/AuthShell';
import { useAuthViewport } from '../../features/auth/AuthViewport';
import { authMotion } from '../../lib/motion';

export default function LoginScreen() {
  const params = useLocalSearchParams<{ motion?: string }>();
  const { login } = useAuth();
  const { resetViewport, setBrandVisible } = useAuthViewport();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Animated.View
      collapsable={false}
      entering={params.motion === 'back' ? authMotion.backIn : undefined}
      className="flex-1"
    >
      <AuthShell
        variant="login"
        title="Sign in"
        subtitle="Access your Getting Started checklist, training, benefits, and support."
      >
        <View>
          {error ? <ErrorState message={error} /> : null}
          <View className="gap-5">
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          <View className="mt-6">
            <PrimaryButton
              label="Sign In"
              onPress={submit}
              loading={loading}
              shape="rounded"
            />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              resetViewport();
              setBrandVisible(true);
              router.push('/register');
            }}
            className="mt-4 min-h-11 items-center justify-center px-2"
          >
            <Text className="text-center text-[15px] font-bold leading-5 text-hercules-blue">
              Have an invitation? Set up your account
            </Text>
          </Pressable>
          <View className="mt-5 flex-row justify-center gap-4">
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push('/terms')}
              className="min-h-11 justify-center"
            >
              <Text className="text-sm font-bold text-hercules-blue">
                Terms of Use
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push('/privacy')}
              className="min-h-11 justify-center"
            >
              <Text className="text-sm font-bold text-hercules-blue">
                Privacy Notice
              </Text>
            </Pressable>
          </View>
        </View>
      </AuthShell>
    </Animated.View>
  );
}
