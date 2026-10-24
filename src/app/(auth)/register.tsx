import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Keyboard, Platform, Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { TextInput } from '../../components/ui/TextInput';
import { ErrorState } from '../../components/ui/StateViews';
import { AuthShell } from '../../features/auth/AuthShell';
import { useAuth } from '../../features/auth/AuthProvider';
import { useAuthViewport } from '../../features/auth/AuthViewport';
import { standardLayoutTransition } from '../../lib/motion';
import { colors } from '../../lib/theme/theme';
import { developmentInvitationToken } from '../../lib/development';

type AccountType = 'PROSPECT' | 'SALES_MANAGER';

export default function RegisterScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const { getInviteDetails, registerFromInvite } = useAuth();
  const { resetViewport, setBrandVisible } = useAuthViewport();
  const initialToken = params.token ?? developmentInvitationToken;
  const [token, setToken] = useState(initialToken);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [validatingInvite, setValidatingInvite] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inviteRequest = useRef(0);
  const checkedDeepLink = useRef(false);
  const returningToLogin = useRef(false);

  const validateInvite = useCallback(
    async (inviteToken = token) => {
      const request = ++inviteRequest.current;
      setValidatingInvite(true);
      setError(null);
      try {
        const cleanToken = inviteToken.trim();
        const details = await getInviteDetails(cleanToken);
        if (request !== inviteRequest.current) return;
        resetViewport();
        setToken(cleanToken);
        setBrandVisible(false);
        setAccountType(details.accountType);
      } catch (caught) {
        if (request !== inviteRequest.current) return;
        setError(
          caught instanceof Error
            ? caught.message
            : 'Unable to verify invitation',
        );
      } finally {
        if (request === inviteRequest.current) setValidatingInvite(false);
      }
    },
    [getInviteDetails, resetViewport, token],
  );

  useEffect(() => {
    if (!params.token || checkedDeepLink.current) {
      return;
    }
    checkedDeepLink.current = true;
    void validateInvite(params.token);
  }, [params.token, validateInvite]);

  const submit = async () => {
    if (!accountType) {
      return;
    }

    setCreatingAccount(true);
    setError(null);
    try {
      await registerFromInvite({
        accountType,
        token,
        email,
        password,
        firstName,
        lastName,
        phone: accountType === 'PROSPECT' ? phone : undefined,
        companyName: accountType === 'PROSPECT' ? companyName : undefined,
        termsAccepted,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to register');
    } finally {
      setCreatingAccount(false);
    }
  };

  const resetInvite = useCallback(() => {
    inviteRequest.current += 1;
    setValidatingInvite(false);
    resetViewport();
    setBrandVisible(true);
    setError(null);
    setAccountType(null);
  }, [resetViewport, setBrandVisible]);

  const returnToLogin = useCallback(() => {
    if (returningToLogin.current) {
      return;
    }
    returningToLogin.current = true;
    inviteRequest.current += 1;
    resetViewport();
    setBrandVisible(true);
    router.dismissTo('/login');
  }, [resetViewport]);

  useFocusEffect(useCallback(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (Keyboard.isVisible()) {
        Keyboard.dismiss();
      } else if (creatingAccount) {
        // Do not leave while a one-use invitation is being consumed.
        return true;
      } else if (accountType) {
        resetInvite();
      } else {
        returnToLogin();
      }
      return true;
    });
    return () => subscription.remove();
  }, [accountType, creatingAccount, resetInvite, returnToLogin]));

  useEffect(() => () => { inviteRequest.current += 1; }, []);

  return (
    <View className="pb-3 pt-4">
      {!accountType ? (
        <Animated.View
          key="invitation-stage"
          collapsable={false}
          layout={standardLayoutTransition}
          className="w-full"
        >
          <AuthShell
            variant="login"
            title="Set up your account"
            subtitle="Enter the code from your invitation."
          >
            <View>
              {error ? <ErrorState message={error} /> : null}
              <TextInput
                label="Invitation Code"
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
              />
              <View className="mt-6">
                <PrimaryButton
                  label="Continue"
                  onPress={() => void validateInvite()}
                  loading={validatingInvite}
                  disabled={!token.trim()}
                  shape="rounded"
                />
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={returnToLogin}
                className="mt-4 min-h-11 items-center justify-center px-2"
              >
                <Text className="text-center text-[15px] font-bold leading-5 text-hercules-blue">
                  Back to sign in
                </Text>
              </Pressable>
            </View>
          </AuthShell>
        </Animated.View>
      ) : (
        <Animated.View
          key={`account-stage-${accountType}`}
          collapsable={false}
          layout={standardLayoutTransition}
          className="w-full"
        >
          <AuthShell
            variant="form"
            title="Create your account"
            subtitle={
              accountType === 'PROSPECT'
                ? 'Complete your business profile.'
                : 'Create your team account.'
            }
            onBack={resetInvite}
          >
            <View>
              {error ? <ErrorState message={error} /> : null}
              <View className="gap-3">
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
                <TextInput
                  label="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                />
                <TextInput
                  label="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                />
                {accountType === 'PROSPECT' ? (
                  <>
                    <TextInput
                      label="Phone (optional)"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                    <TextInput
                      label="Company Name"
                      value={companyName}
                      onChangeText={setCompanyName}
                    />
                  </>
                ) : null}
              </View>
              <View className="mt-5 gap-2">
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: termsAccepted }}
                  onPress={() => setTermsAccepted((accepted) => !accepted)}
                  className="flex-row items-start gap-3 py-1"
                >
                  <View
                    className={`mt-0.5 h-5 w-5 items-center justify-center rounded border ${
                      termsAccepted
                        ? 'border-hercules-blue bg-hercules-blue'
                        : 'border-hercules-blue/40 bg-hercules-white'
                    }`}
                  >
                    {termsAccepted ? (
                      <Check size={14} color={colors.white} strokeWidth={3} />
                    ) : null}
                  </View>
                  <Text className="flex-1 text-sm leading-5 text-hercules-muted">
                    I agree to the Hercules Honors Rewards Terms of Use and
                    acknowledge the Privacy Notice.
                  </Text>
                </Pressable>
                <View className="flex-row gap-4 pl-8">
                  <Pressable
                    accessibilityRole="link"
                    onPress={() => router.push('/terms')}
                    className="min-h-11 justify-center"
                  >
                    <Text className="text-sm font-bold text-hercules-blue">
                      Read Terms
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="link"
                    onPress={() => router.push('/privacy')}
                    className="min-h-11 justify-center"
                  >
                    <Text className="text-sm font-bold text-hercules-blue">
                      Read Privacy Notice
                    </Text>
                  </Pressable>
                </View>
              </View>
              <View className="mt-6">
                <PrimaryButton
                  label="Create Account"
                  onPress={submit}
                  loading={creatingAccount}
                  disabled={!termsAccepted}
                  shape="rounded"
                />
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={returnToLogin}
                className="mt-4 min-h-11 items-center justify-center px-2"
              >
                <Text className="text-center text-[15px] font-bold leading-5 text-hercules-blue">
                  Back to sign in
                </Text>
              </Pressable>
            </View>
          </AuthShell>
        </Animated.View>
      )}
    </View>
  );
}
