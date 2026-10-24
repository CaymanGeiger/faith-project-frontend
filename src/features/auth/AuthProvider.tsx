import { AppState } from 'react-native';
import { runSignOutCleanup } from './signOutCleanup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ApiError, apiFetch, setApiToken, onSessionExpired } from '../../lib/api/client';
import { AuthResponse, User } from '../../lib/api/types';
import { clearGettingStartedDraft } from '../getting-started/gettingStarted';

const TOKEN_KEY = 'faith_project_access_token';

async function hasSecureAuthStorage() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

async function getStoredAuthToken() {
  if (await hasSecureAuthStorage()) {
    return SecureStore.getItemAsync(TOKEN_KEY);
  }
  return AsyncStorage.getItem(TOKEN_KEY);
}

async function setStoredAuthToken(token: string) {
  if (await hasSecureAuthStorage()) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    return;
  }
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

async function deleteStoredAuthToken() {
  if (await hasSecureAuthStorage()) {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      AsyncStorage.removeItem(TOKEN_KEY),
    ]);
    return;
  }
  await AsyncStorage.removeItem(TOKEN_KEY);
}

type RegisterInput = {
  accountType: 'PROSPECT' | 'SALES_MANAGER';
  token: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  companyName?: string;
  termsAccepted: boolean;
};

type InviteDetails = {
  accountType: 'PROSPECT' | 'SALES_MANAGER';
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  restoring: boolean;
  restoreError: string | null;
  retrySession: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  getInviteDetails: (token: string) => Promise<InviteDetails>;
  registerFromInvite: (input: RegisterInput) => Promise<User>;
  acceptLegalTerms: () => Promise<User>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const sessionRevision = useRef(0);
  const restoreInFlight = useRef(false);

  const clearRejectedSession = useCallback(() => {
    sessionRevision.current += 1;
    setApiToken(null); setToken(null); setUser(null); setRestoreError(null);
    void deleteStoredAuthToken().catch(() => undefined);
  }, []);

  useEffect(() => onSessionExpired?.(clearRejectedSession), [clearRejectedSession]);

  const persistAuth = useCallback(async (response: AuthResponse) => {
    const revision = ++sessionRevision.current;
    await setStoredAuthToken(response.accessToken);
    if (revision !== sessionRevision.current) return;
    setRestoreError(null);
    setApiToken(response.accessToken);
    setToken(response.accessToken);
    setUser(response.user);
  }, []);

  const restoreSession = useCallback(async () => {
    if (restoreInFlight.current) return;
    restoreInFlight.current = true;
    const revision = sessionRevision.current;
    setRestoring(true);
    try {
      const storedToken = await getStoredAuthToken();
      if (revision !== sessionRevision.current) return;
      if (!storedToken) {
        setRestoreError(null);
        return;
      }

      setApiToken(storedToken);
      const response = await apiFetch<{ user: User }>('/auth/me');
      if (revision !== sessionRevision.current) return;
      setToken(storedToken);
      setUser(response.user);
      setRestoreError(null);
    } catch (caught) {
      if (revision !== sessionRevision.current) return;
      setApiToken(null);
      setToken(null);
      setUser(null);
      if (caught instanceof ApiError && [401, 403].includes(caught.status)) {
        await deleteStoredAuthToken().catch(() => undefined);
        setRestoreError(null);
      } else {
        // Keep the credential, but do not grant access until the server verifies it.
        setRestoreError('We could not restore your session. Check your connection and try again.');
      }
    } finally {
      restoreInFlight.current = false;
      setRestoring(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      await persistAuth(response);
      return response.user;
    },
    [persistAuth],
  );

  const registerFromInvite = useCallback(
    async (input: RegisterInput) => {
      const response = await apiFetch<AuthResponse>('/auth/register-from-invite', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      await persistAuth(response);
      return response.user;
    },
    [persistAuth],
  );

  const getInviteDetails = useCallback(async (inviteToken: string) => {
    return apiFetch<InviteDetails>('/auth/invite-details', {
      method: 'POST',
      body: JSON.stringify({ token: inviteToken }),
    });
  }, []);

  const refreshMe = useCallback(async () => {
    const revision = sessionRevision.current;
    try {
      const response = await apiFetch<{ user: User }>('/auth/me');
      if (revision === sessionRevision.current) setUser(response.user);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401 && revision === sessionRevision.current) clearRejectedSession();
      throw caught;
    }
  }, [clearRejectedSession]);

  useEffect(() => {
    if (!token) return;
    const subscription = AppState.addEventListener('change', (next) => { if (next === 'active') void refreshMe().catch(() => undefined); });
    // A manager may verify training while the dealer keeps this screen open.
    const interval = user?.onboarding?.restricted
      ? setInterval(() => { if (AppState.currentState === 'active') void refreshMe().catch(() => undefined); }, 30000)
      : undefined;
    return () => { subscription.remove(); clearInterval(interval); };
  }, [token, refreshMe, user?.onboarding?.restricted]);

  const acceptLegalTerms = useCallback(async () => {
    const response = await apiFetch<{ user: User }>('/me/legal-acceptance', {
      method: 'PATCH',
    });
    setUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback(async () => {
    const userId = user?.id;
    sessionRevision.current += 1;
    setRestoreError(null);
    try {
      await runSignOutCleanup();
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Stateless local logout still succeeds if the network is unavailable.
    }

    setApiToken(null);
    setToken(null);
    setUser(null);
    await Promise.all([
      deleteStoredAuthToken(),
      userId ? clearGettingStartedDraft(userId) : Promise.resolve(),
    ]);
  }, [user?.id]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      restoring,
      restoreError,
      retrySession: restoreSession,
      login,
      getInviteDetails,
      registerFromInvite,
      acceptLegalTerms,
      logout,
      refreshMe,
    }),
    [
      user,
      token,
      loading,
      restoring,
      restoreError,
      restoreSession,
      login,
      getInviteDetails,
      registerFromInvite,
      acceptLegalTerms,
      logout,
      refreshMe,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
