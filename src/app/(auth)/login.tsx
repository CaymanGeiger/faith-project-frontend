import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { TextInput } from '../../components/ui/TextInput';
import { ErrorState } from '../../components/ui/StateViews';
import { useAuth } from '../../features/auth/AuthProvider';
import { AuthShell } from '../../features/auth/AuthShell';
import { useAuthViewport } from '../../features/auth/AuthViewport';
import { useInAppContent } from '../../features/content/InAppContentProvider';
import { developmentAccounts, developmentFeaturesEnabled } from '../../lib/development';

const lgProDealerRegistrationUrl =
  'https://form.jotform.com/252405795315055';
type DemoAccount = keyof NonNullable<typeof developmentAccounts>;

export default function LoginScreen() {
  const { login } = useAuth();
  const { openContent } = useInAppContent();
  const { resetViewport, setBrandVisible } = useAuthViewport();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoAccount, setDemoAccount] = useState<DemoAccount | null>(null);
  const [error, setError] = useState<string | null>(null);

  const authenticate = async (
    loginEmail: string,
    loginPassword: string,
    selectedDemoAccount: DemoAccount | null = null,
  ) => {
    setLoading(true);
    setDemoAccount(selectedDemoAccount);
    setError(null);
    try {
      await login(loginEmail, loginPassword);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to sign in');
    } finally {
      setLoading(false);
      setDemoAccount(null);
    }
  };

  const submit = () => authenticate(email, password);

  const loginAsDemo = (account: DemoAccount) => {
    if (!developmentFeaturesEnabled || !developmentAccounts) return;
    const credentials = developmentAccounts[account];
    setEmail(credentials.email);
    setPassword(credentials.password);
    return authenticate(credentials.email, credentials.password, account);
  };

  return (
    <View className="flex-1">
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
              loading={loading && demoAccount === null}
              disabled={demoAccount !== null}
              shape="rounded"
            />
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/forgot-password')} className="mt-2 min-h-11 items-center justify-center">
            <Text className="text-base font-bold text-hercules-blue">Forgot password?</Text>
          </Pressable>
          {developmentFeaturesEnabled ? (
            <View className="mt-3 gap-3">
              <SecondaryButton
                label={
                  demoAccount === 'dealer'
                    ? 'Signing In…'
                    : 'Log In as Dealer'
                }
                onPress={() => void loginAsDemo('dealer')}
                disabled={loading}
              />
              <SecondaryButton
                label={
                  demoAccount === 'salesManager'
                    ? 'Signing In…'
                    : 'Log In as Sales Manager'
                }
                onPress={() => void loginAsDemo('salesManager')}
                disabled={loading}
              />
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => openContent({ url: lgProDealerRegistrationUrl, title: 'Dealer Registration' })}
            className="mt-4 min-h-11 items-center justify-center px-2"
          >
            <Text className="text-center text-[15px] font-bold leading-5 text-hercules-blue">
              Register Here
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push('/activate')} className="min-h-11 items-center justify-center px-2">
            <Text className="text-center text-[15px] font-bold leading-5 text-hercules-blue">Registered with Jotform? Activate your account</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              resetViewport();
              setBrandVisible(true);
              router.push('/register');
            }}
            className="min-h-11 items-center justify-center px-2"
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
    </View>
  );
}
